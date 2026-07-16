import WargaLayout, { WargaProfile } from '@/Layouts/WargaLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowLeft,
    Calendar,
    CheckCircle,
    Clock,
    CreditCard,
    Eye,
    FileText,
    UploadCloud,
    Wallet,
    X,
    XCircle,
    Download,
    SlidersHorizontal,
    Receipt
} from 'lucide-react';
import { FormEvent, ReactNode, useState } from 'react';

type Bill = {
    id: number | null;
    title?: string;
    period?: string;
    amount?: number;
    dueDate?: string | null;
    status?: string;
    rawStatus?: string;
    method?: string | null;
    proofUrl?: string | null;
    notes?: string | null;
};

type Payment = {
    id: number | null;
    title?: string;
    date?: string | null;
    amount?: number;
    method?: string | null;
    status?: string;
    rawStatus?: string;
    proofUrl?: string | null;
};

type BillComponent = {
    id: number;
    name: string;
    amount: number;
    note?: string | null;
};

type Props = {
    profile?: WargaProfile;
    currentBills?: Bill[];
    payments?: Payment[];
    billComponents?: BillComponent[];
};

type UploadProofForm = {
    period: string;
    amount: string;
    metode_pembayaran: string;
    bukti_pembayaran: File | null;
    catatan: string;
};

const fallbackProfile: WargaProfile = {
    name: 'Warga',
    initials: 'WG',
    houseNumber: '-',
    hasLinkedWarga: false,
};

function formatCurrency(value?: number) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(Number(value || 0));
}

function formatDate(value?: string | null) {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

function getPaymentMonthYear(title?: string, date?: string | null) {
    if (title && title.includes('Pembayaran Iuran ')) {
        return title.replace('Pembayaran Iuran ', '');
    }
    if (!date) return '-';
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
}

function statusClass(status?: string) {
    switch (status) {
        case 'Sudah Bayar':
        case 'Lunas':
            return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
        case 'Menunggu Verifikasi':
            return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
        case 'Kurang Bayar':
            return 'bg-orange-500/10 text-orange-400 border border-orange-500/20';
        case 'Ditolak':
        case 'Belum Bayar':
        case 'Menunggak':
            return 'bg-red-500/10 text-red-400 border border-red-500/20';
        default:
            return 'bg-slate-800 text-slate-400 border border-slate-700/60';
    }
}

function canUploadProof(bill: Bill) {
    const status = String(bill.rawStatus || bill.status || '').toLowerCase();
    return ['belum_bayar', 'belum bayar', 'ditolak', 'unpaid', 'rejected'].includes(status);
}

export default function Iuran({ profile = fallbackProfile, currentBills = [], payments = [], billComponents = [] }: Props) {
    const safeProfile = profile ?? fallbackProfile;
    const bills = Array.isArray(currentBills) ? currentBills : [];
    const history = Array.isArray(payments) ? payments : [];
    const mainBill = bills[0] ?? null;

    // Calculate dynamic stats
    const totalTagihan = bills.reduce((sum, bill) => sum + Number(bill.amount || 0), 0);
    const totalPaid = history
        .filter((item) => item.rawStatus === 'verified' || item.status === 'Sudah Bayar' || item.status === 'Lunas')
        .reduce((sum, item) => sum + Number(item.amount || 0), 0);

    const latestVerifiedPayment = history.find(
        (item) => item.rawStatus === 'verified' || item.status === 'Sudah Bayar' || item.status === 'Lunas'
    );
    const lastPaidDate = latestVerifiedPayment ? formatDate(latestVerifiedPayment.date) : '-';

    const totalUnpaid = bills
        .filter((bill) => canUploadProof(bill))
        .reduce((sum, bill) => sum + Number(bill.amount || 0), 0);
    const unpaidCount = bills.filter((bill) => canUploadProof(bill)).length;

    const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
    const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    const uploadForm = useForm<UploadProofForm>({
        period: '',
        amount: '',
        metode_pembayaran: 'transfer_bank',
        bukti_pembayaran: null,
        catatan: '',
    });

    const openUploadModal = (bill: Bill) => {
        uploadForm.clearErrors();
        uploadForm.setData({
            period: bill.period || '',
            amount: String(bill.amount || 0),
            metode_pembayaran: bill.method || 'transfer_bank',
            bukti_pembayaran: null,
            catatan: bill.notes || '',
        });
        setSelectedBill(bill);
    };

    const closeUploadModal = () => {
        setSelectedBill(null);
        uploadForm.reset();
        uploadForm.clearErrors();
    };

    const submitProof = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!selectedBill) {
            return;
        }

        uploadForm.post('/warga/iuran/upload-bukti', {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: closeUploadModal,
        });
    };

    const getFormattedMethod = (method?: string | null) => {
        if (!method) return '-';
        switch (method.toLowerCase()) {
            case 'transfer_bank':
            case 'transfer bca':
            case 'transfer mandiri':
                return 'Transfer Bank';
            case 'qris':
            case 'ovo':
            case 'gopay':
                return method.toUpperCase();
            case 'tunai':
            case 'cash':
                return 'Tunai';
            default:
                return method.charAt(0).toUpperCase() + method.slice(1);
        }
    };

    return (
        <WargaLayout profile={safeProfile} title="Iuran">
            <Head title="Pembayaran Iuran" />

            <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 lg:px-8 lg:py-8">
                {/* Header Back & Titles & Upload Button */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Link href="/warga/dashboard" className="rounded-xl bg-[#131b2e] border border-slate-800 p-2 text-slate-400 hover:text-slate-200 transition">
                            <ArrowLeft size={16} />
                        </Link>
                        <div>
                            <h1 className="text-xl font-black text-slate-100 tracking-tight">Pembayaran Iuran</h1>
                            <p className="text-xs text-slate-500 mt-0.5">Status tagihan bulanan dan riwayat pembayaran</p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => openUploadModal(mainBill || { id: null, amount: 0, period: new Date().toISOString().slice(0, 7) })}
                        className="flex items-center justify-center gap-2 rounded-2xl bg-[#131b2e] hover:bg-[#1a243d] border border-slate-800 text-xs font-bold text-slate-200 px-4 py-2.5 transition active:scale-97 self-start sm:self-center"
                    >
                        <UploadCloud size={14} className="text-emerald-400" />
                        <span>Input Bukti Pembayaran</span>
                    </button>
                </div>

                {/* Grid Layout: Main Bill & Sub Stats Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Side: Big Bill Card (Yellow highlighted tagihan) */}
                    <div className="lg:col-span-2">
                        {mainBill ? (
                            <div className="rounded-3xl border border-amber-500/30 bg-[#0b1220] p-6 shadow-xl relative overflow-hidden group h-full flex flex-col justify-between hover:border-amber-500/50 transition-colors duration-300">
                                {/* Amber Glow Accent for Tagihan */}
                                <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/5 rounded-full blur-3xl group-hover:bg-amber-500/10 transition duration-300"></div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-md px-2.5 py-0.5 text-[10px] font-extrabold tracking-wider uppercase">
                                            Tagihan Bulan Ini
                                        </span>
                                        <span className="text-[10px] font-bold text-slate-500">
                                            No. Rumah: {safeProfile.houseNumber || '-'}
                                        </span>
                                    </div>

                                    <div className="pt-2">
                                        <h2 className="text-3xl font-black text-slate-100 tracking-tight">
                                            {formatCurrency(totalTagihan)}
                                        </h2>
                                        <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                                            <Calendar size={13} className="text-amber-500/80" />
                                            Jatuh tempo: <span className="font-bold text-slate-350">{formatDate(mainBill.dueDate)}</span>
                                        </p>
                                    </div>

                                    {/* Verification Status Warning/Notice inside Bill Card */}
                                    {mainBill.status === 'Menunggu Verifikasi' && (
                                        <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-3 flex gap-2.5 items-start text-[11px] leading-relaxed text-amber-400 mt-3">
                                            <AlertCircle size={15} className="shrink-0 mt-0.5" />
                                            <span>Bukti pembayaran sudah dikirim dan sedang menunggu verifikasi admin.</span>
                                        </div>
                                    )}

                                    {mainBill.notes && mainBill.status === 'Ditolak' && (
                                        <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-3 flex gap-2.5 items-start text-[11px] leading-relaxed text-red-400 mt-3">
                                            <AlertCircle size={15} className="shrink-0 mt-0.5" />
                                            <div>
                                                <p className="font-bold">Unggahan Bukti Ditolak Admin:</p>
                                                <p className="text-slate-400 mt-0.5">{mainBill.notes}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Action Buttons */}
                                <div className="flex flex-wrap gap-3 pt-6 border-t border-slate-800/80 mt-6">
                                    {canUploadProof(mainBill) ? (
                                        <>
                                            <button 
                                                type="button" 
                                                onClick={() => openUploadModal(mainBill)}
                                                className="inline-flex items-center gap-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 px-5 py-2.5 text-xs font-black transition active:scale-97 shadow-lg"
                                            >
                                                <UploadCloud size={14} className="stroke-[2.5]" />
                                                <span>Bayar Sekarang</span>
                                            </button>
                                            <button 
                                                type="button"
                                                onClick={() => setIsDetailModalOpen(true)}
                                                className="inline-flex items-center gap-2 rounded-xl bg-transparent border border-slate-800 hover:bg-[#131b2e] text-slate-300 px-5 py-2.5 text-xs font-bold transition active:scale-97"
                                            >
                                                <span>Detail Tagihan</span>
                                            </button>
                                        </>
                                    ) : (
                                        <div className="flex items-center flex-wrap gap-3 w-full">
                                            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 bg-[#131b2e] px-4 py-2.5 rounded-xl border border-slate-800">
                                                {mainBill.status === 'Sudah Bayar' || mainBill.status === 'Lunas' ? (
                                                    <>
                                                        <CheckCircle size={14} className="text-emerald-400" />
                                                        <span className="text-emerald-400">Tagihan Terbayar Lunas</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Clock size={14} className="text-amber-400" />
                                                        <span className="text-amber-400">Sedang Diproses Verifikasi</span>
                                                    </>
                                                )}
                                            </div>
                                            <button 
                                                type="button"
                                                onClick={() => setIsDetailModalOpen(true)}
                                                className="inline-flex items-center gap-2 rounded-xl bg-transparent border border-slate-800 hover:bg-[#131b2e] text-slate-300 px-5 py-2.5 text-xs font-bold transition active:scale-97"
                                            >
                                                <span>Detail Tagihan</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="rounded-3xl border border-dashed border-slate-800 p-8 text-center text-xs text-slate-500 bg-[#0b1220] h-full flex flex-col justify-center items-center">
                                <Wallet size={36} className="text-slate-600 mb-2" />
                                <span>Belum ada tagihan iuran aktif untuk bulan ini.</span>
                            </div>
                        )}
                    </div>

                    {/* Right Side: Smaller Status summary widgets */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
                        {/* Summary Widget 1: Sudah Bayar (Green Highlight) */}
                        <div className="rounded-2xl border border-emerald-500/30 bg-[#0b1220] p-4 shadow-md relative overflow-hidden group hover:border-emerald-500/50 transition-colors duration-300">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition duration-300"></div>
                            <div className="flex items-center justify-between mb-3">
                                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide">
                                    Sudah Bayar
                                </span>
                                <CheckCircle size={15} className="text-emerald-400" />
                            </div>
                            <h3 className="text-xl font-black text-slate-100">{formatCurrency(totalPaid)}</h3>
                            <p className="text-[10px] text-slate-500 mt-1.5">
                                Terakhir bayar: <span className="font-semibold text-slate-400">{lastPaidDate}</span>
                            </p>
                        </div>

                        {/* Summary Widget 2: Belum Bayar (Red Highlight) */}
                        <div className="rounded-2xl border border-red-500/30 bg-[#0b1220] p-4 shadow-md relative overflow-hidden group hover:border-red-500/50 transition-colors duration-300">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-2xl group-hover:bg-red-500/10 transition duration-300"></div>
                            <div className="flex items-center justify-between mb-3">
                                <span className="bg-red-500/10 text-red-400 border border-red-500/20 rounded-md px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide">
                                    Belum Bayar
                                </span>
                                <AlertCircle size={15} className="text-red-400" />
                            </div>
                            <h3 className="text-xl font-black text-slate-100">{formatCurrency(totalUnpaid)}</h3>
                            <p className="text-[10px] text-slate-500 mt-1.5">
                                Tunggakan berjalan: <span className="font-semibold text-slate-400">{unpaidCount} bulan</span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Payments History Section */}
                <div className="rounded-3xl border border-slate-800 bg-[#0b1220] p-5 shadow-xl">
                    <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-800/80">
                        <div className="flex items-center gap-2">
                            <Clock size={16} className="text-emerald-400" />
                            <h3 className="text-xs font-black text-slate-300 uppercase tracking-wider">Riwayat Pembayaran</h3>
                        </div>
                        <div className="flex items-center gap-2">
                            <button className="p-1.5 rounded-lg bg-[#131b2e] border border-slate-850 text-slate-400 hover:text-slate-200 transition">
                                <SlidersHorizontal size={13} />
                            </button>
                            <button className="p-1.5 rounded-lg bg-[#131b2e] border border-slate-850 text-slate-400 hover:text-slate-200 transition">
                                <Download size={13} />
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto -mx-5 px-5">
                        {history.length === 0 ? (
                            <div className="text-center py-8 text-xs text-slate-500 border border-dashed border-slate-850 rounded-2xl">
                                Belum ada riwayat pembayaran iuran.
                            </div>
                        ) : (
                            <table className="w-full text-left border-collapse min-w-[500px]">
                                <thead>
                                    <tr className="border-b border-slate-850/80 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                                        <th className="pb-3 pt-1">Bulan / Tahun</th>
                                        <th className="pb-3 pt-1">Jenis Iuran</th>
                                        <th className="pb-3 pt-1">Jumlah</th>
                                        <th className="pb-3 pt-1">Metode</th>
                                        <th className="pb-3 pt-1">Status</th>
                                        <th className="pb-3 pt-1 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-850/40 text-xs">
                                    {history.map((payment) => (
                                        <tr key={payment.id ?? `${payment.date}-${payment.amount}`} className="hover:bg-[#131b2e]/10 transition-colors">
                                            <td className="py-3.5 font-bold text-slate-200">
                                                {getPaymentMonthYear(payment.title, payment.date)}
                                            </td>
                                            <td className="py-3.5 text-slate-400 font-medium">
                                                Iuran Bulanan (Kebersihan & Keamanan)
                                            </td>
                                            <td className="py-3.5 font-black text-slate-355">
                                                {formatCurrency(payment.amount)}
                                            </td>
                                            <td className="py-3.5 text-slate-400">
                                                {getFormattedMethod(payment.method)}
                                            </td>
                                            <td className="py-3.5">
                                                <span className={`rounded-full px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide inline-block ${statusClass(payment.status)}`}>
                                                    {payment.status === 'Sudah Bayar' || payment.status === 'Lunas' ? 'Lunas' : payment.status}
                                                </span>
                                            </td>
                                            <td className="py-3.5 text-right">
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedPayment(payment)}
                                                    className="inline-flex items-center gap-1 rounded-md bg-[#131b2e] border border-slate-800/80 px-2.5 py-1 text-[10px] font-bold text-emerald-400 hover:bg-[#1a243d] hover:text-emerald-300 transition"
                                                >
                                                    <Receipt size={10} />
                                                    <span>Invoice</span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal: Upload Bukti Pembayaran */}
            {selectedBill && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-3xl bg-[#0b1220] border border-slate-800 shadow-2xl overflow-hidden">
                        <div className="flex items-start justify-between gap-4 border-b border-slate-800/80 p-5 bg-[#131b2e]/30">
                            <div>
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400">Upload Bukti</span>
                                <h2 className="mt-1 text-base font-black text-slate-100 leading-tight">
                                    {selectedBill.title || 'Iuran Bulanan'}
                                </h2>
                                <p className="mt-1.5 text-xs text-slate-400">
                                    Periode: <span className="font-semibold text-slate-300">{selectedBill.period || '-'}</span> · Jumlah: <span className="font-bold text-emerald-400">{formatCurrency(selectedBill.amount)}</span>
                                </p>
                            </div>
                            <button type="button" onClick={closeUploadModal} className="rounded-xl p-1.5 text-slate-400 hover:bg-[#131b2e] hover:text-slate-200 transition">
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={submitProof} className="space-y-4 p-5">
                            {/* Periode Input */}
                            <div>
                                <label className="text-xs font-bold text-slate-400">Periode (Bulan / Tahun)</label>
                                <input
                                    type="month"
                                    required
                                    disabled={selectedBill && selectedBill.id !== null}
                                    value={uploadForm.data.period}
                                    onChange={(event) => uploadForm.setData('period', event.target.value)}
                                    className="mt-2 w-full rounded-xl border border-slate-800 bg-[#131b2e] px-4 py-3 text-xs text-slate-200 focus:border-emerald-500 focus:ring-emerald-500 disabled:opacity-50"
                                />
                                {uploadForm.errors.period && <p className="mt-1 text-xs text-red-500">{uploadForm.errors.period}</p>}
                            </div>

                            {/* Nominal Pembayaran Input */}
                            <div>
                                <label className="text-xs font-bold text-slate-400">Jumlah Pembayaran (Rp)</label>
                                <input
                                    type="number"
                                    required
                                    disabled={selectedBill && selectedBill.id !== null}
                                    value={uploadForm.data.amount}
                                    onChange={(event) => uploadForm.setData('amount', event.target.value)}
                                    className="mt-2 w-full rounded-xl border border-slate-800 bg-[#131b2e] px-4 py-3 text-xs text-slate-200 focus:border-emerald-500 focus:ring-emerald-500 disabled:opacity-50"
                                    placeholder="Contoh: 150000"
                                />
                                {uploadForm.errors.amount && <p className="mt-1 text-xs text-red-500">{uploadForm.errors.amount}</p>}
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-400">Metode Pembayaran</label>
                                <select
                                    value={uploadForm.data.metode_pembayaran}
                                    onChange={(event) => uploadForm.setData('metode_pembayaran', event.target.value)}
                                    className="mt-2 w-full rounded-xl border-slate-800 bg-[#131b2e] px-4 py-3 text-xs text-slate-200 focus:border-emerald-500 focus:ring-emerald-500"
                                >
                                    <option value="transfer_bank">Transfer Bank</option>
                                    <option value="qris">QRIS</option>
                                    <option value="tunai">Tunai / Cash</option>
                                </select>
                                {uploadForm.errors.metode_pembayaran && <p className="mt-1 text-xs text-red-500">{uploadForm.errors.metode_pembayaran}</p>}
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-400">Bukti Pembayaran</label>
                                <div className="mt-2 relative">
                                    {!uploadForm.data.bukti_pembayaran ? (
                                        <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-800 hover:border-emerald-500/50 rounded-2xl p-6 bg-[#131b2e]/50 cursor-pointer transition group">
                                            <UploadCloud size={28} className="text-slate-500 group-hover:text-emerald-400 transition mb-2" />
                                            <span className="text-xs font-semibold text-slate-350">Pilih atau Seret Foto / Dokumen</span>
                                            <span className="text-[10px] text-slate-500 mt-1">PNG, JPG, WEBP, atau PDF (Maks. 2MB)</span>
                                            <input
                                                type="file"
                                                accept="image/*,.pdf"
                                                onChange={(event) => uploadForm.setData('bukti_pembayaran', event.currentTarget.files?.[0] ?? null)}
                                                className="hidden"
                                            />
                                        </label>
                                    ) : (
                                        <div className="flex items-center justify-between border border-emerald-500/30 rounded-2xl p-4 bg-emerald-500/5">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0">
                                                    <FileText size={18} />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-bold text-slate-200 truncate">
                                                        {(uploadForm.data.bukti_pembayaran as File).name}
                                                    </p>
                                                    <p className="text-[10px] text-slate-500">
                                                        {((uploadForm.data.bukti_pembayaran as File).size / 1024 / 1024).toFixed(2)} MB
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => uploadForm.setData('bukti_pembayaran', null)}
                                                className="p-1 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition shrink-0"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                                {uploadForm.errors.bukti_pembayaran && <p className="mt-1.5 text-xs text-red-500">{uploadForm.errors.bukti_pembayaran}</p>}
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-400">Catatan Opsional</label>
                                <textarea
                                    value={uploadForm.data.catatan}
                                    onChange={(event) => uploadForm.setData('catatan', event.target.value)}
                                    rows={3}
                                    className="mt-2 w-full rounded-xl border-slate-800 bg-[#131b2e] px-4 py-3 text-xs text-slate-200 placeholder-slate-650 focus:border-emerald-500 focus:ring-emerald-500"
                                    placeholder="Contoh: Transfer dari rekening BCA atas nama Fatih..."
                                />
                                {uploadForm.errors.catatan && <p className="mt-1 text-xs text-red-500">{uploadForm.errors.catatan}</p>}
                            </div>

                            <div className="rounded-2xl bg-emerald-500/5 border border-emerald-500/20 p-3.5 text-[11px] leading-relaxed text-slate-400">
                                Setelah bukti dikirim, status tagihan berubah menjadi <strong className="text-amber-400 font-bold">Menunggu Verifikasi</strong>. Admin RT akan memeriksa bukti sebelum status diubah menjadi <strong className="text-emerald-400 font-bold">Lunas</strong>.
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={closeUploadModal} className="rounded-xl border border-slate-800 px-4 py-2.5 text-xs font-bold text-slate-400 hover:bg-[#131b2e] transition">
                                    Batal
                                </button>
                                <button type="submit" disabled={uploadForm.processing} className="rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 px-4 py-2.5 text-xs font-black transition disabled:opacity-50">
                                    {uploadForm.processing ? 'Mengirim...' : 'Kirim Bukti'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Detail Rincian Iuran */}
            {isDetailModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-3xl bg-[#0b1220] border border-slate-800 shadow-2xl overflow-hidden">
                        <div className="flex items-start justify-between gap-4 border-b border-slate-800/80 p-5 bg-[#131b2e]/30">
                            <div>
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400">Rincian Tagihan</span>
                                <h2 className="mt-1 text-base font-black text-slate-100 leading-tight">
                                    Rincian Komponen Iuran
                                </h2>
                                <p className="mt-1.5 text-xs text-slate-400">
                                    Rincian iuran bulanan berdasarkan kebijakan pengurus RT.
                                </p>
                            </div>
                            <button type="button" onClick={() => setIsDetailModalOpen(false)} className="rounded-xl p-1.5 text-slate-400 hover:bg-[#131b2e] hover:text-slate-200 transition">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="p-5 space-y-4">
                            {billComponents.length === 0 ? (
                                <p className="text-xs text-slate-500 text-center py-4">Belum ada rincian komponen iuran aktif.</p>
                            ) : (
                                <div className="space-y-3.5">
                                    {billComponents.map((comp) => (
                                        <div key={comp.id} className="flex justify-between items-start gap-4 py-2.5 border-b border-slate-850/40">
                                            <div className="space-y-0.5">
                                                <p className="text-xs font-bold text-slate-200">{comp.name}</p>
                                                {comp.note && (
                                                    <p className="text-[10px] text-slate-400 italic font-medium leading-relaxed">{comp.note}</p>
                                                )}
                                            </div>
                                            <span className="text-xs font-black text-slate-100 shrink-0">
                                                {formatCurrency(comp.amount)}
                                            </span>
                                        </div>
                                    ))}
                                    
                                    <div className="flex justify-between items-center pt-4 border-t border-slate-850">
                                        <span className="text-xs font-black text-slate-300">Total Iuran Bulanan</span>
                                        <span className="text-sm font-black text-amber-400">
                                            {formatCurrency(billComponents.reduce((sum, comp) => sum + comp.amount, 0))}
                                        </span>
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end pt-3">
                                <button 
                                    type="button" 
                                    onClick={() => setIsDetailModalOpen(false)} 
                                    className="w-full rounded-xl bg-[#131b2e] hover:bg-[#1a243d] border border-slate-800 px-4 py-2.5 text-xs font-bold text-slate-300 transition"
                                >
                                    Tutup Rincian
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: View Receipt / Invoice Detail */}
            {selectedPayment && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-sm rounded-3xl bg-[#0b1220] border border-slate-800 shadow-2xl p-5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl"></div>
                        
                        <div className="flex justify-between items-start pb-4 border-b border-slate-800/80 mb-4">
                            <div>
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400">Bukti Pembayaran</span>
                                <h3 className="text-sm font-black text-slate-100 mt-1">Invoice #{selectedPayment.id || '-'}-Iuran</h3>
                            </div>
                            <button type="button" onClick={() => setSelectedPayment(null)} className="rounded-lg p-1 text-slate-400 hover:bg-[#131b2e] transition">
                                <X size={16} />
                            </button>
                        </div>

                        <div className="space-y-3.5 text-xs text-slate-400">
                            <div className="flex justify-between">
                                <span>Judul</span>
                                <span className="font-bold text-slate-200">{selectedPayment.title || '-'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Tanggal Bayar</span>
                                <span className="font-bold text-slate-200">{formatDate(selectedPayment.date)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Metode</span>
                                <span className="font-bold text-slate-200">{getFormattedMethod(selectedPayment.method)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Status</span>
                                <span className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide inline-block ${statusClass(selectedPayment.status)}`}>
                                    {selectedPayment.status === 'Sudah Bayar' || selectedPayment.status === 'Lunas' ? 'Lunas' : selectedPayment.status}
                                </span>
                            </div>
                            <div className="flex justify-between pt-2 border-t border-slate-850/60">
                                <span className="text-slate-300 font-bold">Total Pembayaran</span>
                                <span className="font-black text-emerald-400 text-sm">{formatCurrency(selectedPayment.amount)}</span>
                            </div>

                            {selectedPayment.proofUrl && (
                                <div className="pt-4 border-t border-slate-850/60 flex flex-col gap-2">
                                    <span className="text-xs text-slate-500 font-bold">Dokumen Lampiran Bukti</span>
                                    <a
                                        href={selectedPayment.proofUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#131b2e] border border-slate-800 px-4 py-2.5 text-xs font-bold text-slate-300 hover:bg-[#1a243d] hover:text-slate-100 transition shadow-sm w-full"
                                    >
                                        <Eye size={13} className="text-emerald-400" />
                                        <span>Lihat Dokumen Bukti</span>
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </WargaLayout>
    );
}
