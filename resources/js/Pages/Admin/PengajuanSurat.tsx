import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router } from '@inertiajs/react';
import * as Dialog from '@radix-ui/react-dialog';
import {
    AlertCircle,
    CheckCircle,
    Clock,
    Download,
    Eye,
    FileCheck,
    FileText,
    Filter,
    Search,
    ShieldCheck,
    TrendingUp,
    X,
    XCircle,
    Zap,
} from 'lucide-react';
import { FormEvent, ReactNode, useEffect, useMemo, useState } from 'react';

type SubmissionFile = {
    id: number;
    label?: string | null;
    originalName: string;
    url: string;
    mimeType?: string | null;
    isAdminFile: boolean;
};

type Approval = {
    id: number;
    status: string;
    statusLabel: string;
    notes?: string | null;
    approver?: string | null;
    createdAt?: string | null;
};

type Pengajuan = {
    id: number;
    nomorPengajuan: string;
    nomorSurat?: string | null;
    jenisSurat: string;
    kodeJenis?: string | null;
    pemohon: string;
    kepalaKeluarga: string;
    noRumah: string;
    noKk: string;
    ringkasanKeperluan?: string | null;
    dataPengajuan: Record<string, string>;
    catatanWarga?: string | null;
    catatanAdmin?: string | null;
    status: string;
    statusLabel: string;
    tanggalPengajuan?: string | null;
    tanggalSelesai?: string | null;
    files: SubmissionFile[];
    approvals: Approval[];
};

type StatusOption = { value: string; label: string };

type Summary = {
    total: number;
    diajukan: number;
    diproses: number;
    selesai: number;
    ditolak: number;
};

type Props = {
    filters: { status: string; search: string };
    pengajuans: Pengajuan[];
    summary: Summary;
    statuses: StatusOption[];
};

function getStatusConfig(status: string): { cls: string; dot: string; label: string } {
    switch (status) {
        case 'draft': return { cls: 'bg-slate-500/20 text-slate-300 border border-slate-500/30', dot: 'bg-slate-400', label: 'Draft' };
        case 'diajukan': return { cls: 'bg-blue-500/20 text-blue-300 border border-blue-500/30', dot: 'bg-blue-400', label: 'Diajukan' };
        case 'diverifikasi_rt': return { cls: 'bg-purple-500/20 text-purple-300 border border-purple-500/30', dot: 'bg-purple-400', label: 'Diverifikasi' };
        case 'revisi': return { cls: 'bg-orange-500/20 text-orange-300 border border-orange-500/30', dot: 'bg-orange-400', label: 'Revisi' };
        case 'disetujui':
        case 'selesai':
        case 'diambil': return { cls: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30', dot: 'bg-emerald-400', label: 'Selesai' };
        case 'ditolak': return { cls: 'bg-red-500/20 text-red-300 border border-red-500/30', dot: 'bg-red-400', label: 'Ditolak' };
        default: return { cls: 'bg-slate-500/20 text-slate-300 border border-slate-500/30', dot: 'bg-slate-400', label: status };
    }
}

function formatDate(value?: string | null) {
    if (!value) return '-';
    return new Date(value).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

const inputCls = 'w-full rounded-xl border border-[#1C2541]/60 bg-[#0B132B]/80 px-3 py-2.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition text-sm';
const labelCls = 'mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400';

export default function PengajuanSurat({ filters, pengajuans = [], summary, statuses = [] }: Props) {
    const [searchTerm, setSearchTerm] = useState(filters?.search || '');
    const [statusFilter, setStatusFilter] = useState(filters?.status || 'all');
    const [selectedDetail, setSelectedDetail] = useState<Pengajuan | null>(null);
    const [statusModal, setStatusModal] = useState<Pengajuan | null>(null);
    const [statusValue, setStatusValue] = useState('diverifikasi_rt');
    const [catatanAdmin, setCatatanAdmin] = useState('');
    const [nomorSurat, setNomorSurat] = useState('');
    const [fileSurat, setFileSurat] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const timeout = window.setTimeout(() => {
            router.get(
                route('admin.pengajuan-surat.index'),
                { status: statusFilter, search: searchTerm },
                { preserveState: true, preserveScroll: true, replace: true },
            );
        }, 350);
        return () => window.clearTimeout(timeout);
    }, [searchTerm, statusFilter]);

    const openStatusModal = (pengajuan: Pengajuan, nextStatus?: string) => {
        setStatusModal(pengajuan);
        setStatusValue(nextStatus || pengajuan.status);
        setCatatanAdmin(pengajuan.catatanAdmin || '');
        setNomorSurat(pengajuan.nomorSurat || '');
        setFileSurat(null);
    };

    const submitStatus = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!statusModal) return;
        const formData = new FormData();
        formData.append('status', statusValue);
        formData.append('catatan_admin', catatanAdmin);
        formData.append('nomor_surat', nomorSurat);
        if (fileSurat) formData.append('file_surat', fileSurat);
        setIsSubmitting(true);
        router.post(route('admin.pengajuan-surat.status', { pengajuan: statusModal.id }), formData, {
            forceFormData: true, preserveScroll: true,
            onSuccess: () => setStatusModal(null),
            onFinish: () => setIsSubmitting(false),
        });
    };

    const activeStatuses = useMemo(() => statuses.filter(s => s.value !== 'draft'), [statuses]);

    /* SVG Mini Bar Chart (last 7 months distribution) */
    const chartBars = [
        { label: 'Des', h: 20 }, { label: 'Jan', h: 45 }, { label: 'Feb', h: 35 },
        { label: 'Mar', h: 60 }, { label: 'Apr', h: 50 }, { label: 'Mei', h: summary.diajukan + 10 },
        { label: 'Jun', h: summary.selesai + 15 },
    ];
    const maxH = Math.max(...chartBars.map(b => b.h), 1);

    return (
        <AdminLayout activeMenu="security">
            <Head title="Pengajuan Surat" />

            {/* ── Page Header ── */}
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400 mb-1">Administrasi Warga</p>
                    <h2 className="text-2xl font-black text-white">Pengajuan Surat</h2>
                    <p className="text-slate-400 text-sm mt-1">Validasi, proses, dan arsipkan pengajuan administrasi warga RT.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button className="flex items-center gap-2 rounded-xl border border-[#1C2541]/60 bg-[#0B132B]/60 px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:border-emerald-500/40 transition">
                        <Filter size={16} /> Filter
                    </button>
                </div>
            </div>

            {/* ── Stats + Chart Row ── */}
            <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 lg:col-span-1">
                    {[
                        { icon: FileText, label: 'Total', value: summary?.total || 0, color: 'text-blue-400', bg: 'bg-blue-400/10 border-blue-400/20' },
                        { icon: Clock, label: 'Menunggu', value: summary?.diajukan || 0, color: 'text-orange-400', bg: 'bg-orange-400/10 border-orange-400/20' },
                        { icon: AlertCircle, label: 'Diproses', value: summary?.diproses || 0, color: 'text-purple-400', bg: 'bg-purple-400/10 border-purple-400/20' },
                        { icon: CheckCircle, label: 'Selesai', value: summary?.selesai || 0, color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/20' },
                        { icon: XCircle, label: 'Ditolak', value: summary?.ditolak || 0, color: 'text-red-400', bg: 'bg-red-400/10 border-red-400/20' },
                    ].map(({ icon: Icon, label, value, color, bg }) => (
                        <div key={label} className="rounded-2xl border border-[#1C2541]/60 bg-[#0B132B]/60 p-4 backdrop-blur-sm">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
                                <div className={`rounded-lg border p-1.5 ${bg}`}><Icon size={14} className={color} /></div>
                            </div>
                            <p className={`text-2xl font-black ${color}`}>{value}</p>
                        </div>
                    ))}
                    {/* Processing rate */}
                    <div className="col-span-2 rounded-2xl border border-[#1C2541]/60 bg-[#0B132B]/60 p-4">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-bold text-white">Tingkat Penyelesaian</p>
                            <TrendingUp size={14} className="text-emerald-400" />
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex-1 h-2 bg-[#1C2541]/60 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all"
                                    style={{ width: `${summary?.total ? Math.round((summary.selesai / summary.total) * 100) : 0}%` }}
                                />
                            </div>
                            <span className="text-sm font-black text-emerald-400">
                                {summary?.total ? Math.round((summary.selesai / summary.total) * 100) : 0}%
                            </span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">{summary?.selesai || 0} dari {summary?.total || 0} pengajuan selesai</p>
                    </div>
                </div>

                {/* Bar Chart */}
                <div className="lg:col-span-2 rounded-2xl border border-[#1C2541]/60 bg-[#0B132B]/60 p-5 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-sm font-bold text-white">Tren Pengajuan Surat</h3>
                            <p className="text-xs text-slate-500">7 bulan terakhir</p>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-slate-500">
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-emerald-500 inline-block" /> Pengajuan</span>
                        </div>
                    </div>
                    <div className="flex items-end gap-3 h-32">
                        {chartBars.map((bar, i) => {
                            const heightPct = (bar.h / maxH) * 100;
                            return (
                                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                    <div className="w-full flex items-end justify-center h-24">
                                        <div
                                            className="w-full rounded-t-lg transition-all duration-700"
                                            style={{
                                                height: `${heightPct}%`,
                                                background: i === chartBars.length - 1
                                                    ? 'linear-gradient(to top, #10B981, #34D399)'
                                                    : 'rgba(16, 185, 129, 0.25)',
                                                boxShadow: i === chartBars.length - 1 ? '0 0 12px rgba(16,185,129,0.4)' : 'none',
                                            }}
                                        />
                                    </div>
                                    <span className="text-[10px] text-slate-500">{bar.label}</span>
                                </div>
                            );
                        })}
                    </div>

                    {/* Insights Panel */}
                    <div className="mt-4 pt-4 border-t border-[#1C2541]/40 grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="rounded-xl bg-[#111A2E]/60 p-3">
                            <div className="flex items-center gap-2 mb-1">
                                <Zap size={12} className="text-yellow-400" />
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Smart Insights</p>
                            </div>
                            <p className="text-xs text-slate-300 leading-relaxed">
                                {summary?.diajukan > 0
                                    ? `Ada ${summary.diajukan} pengajuan menunggu verifikasi. Segera proses untuk meningkatkan kepuasan warga.`
                                    : 'Semua pengajuan telah diproses. Tidak ada antrian saat ini.'}
                            </p>
                        </div>
                        <div className="rounded-xl bg-[#111A2E]/60 p-3">
                            <div className="flex items-center gap-2 mb-1">
                                <ShieldCheck size={12} className="text-emerald-400" />
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Panduan Verifikasi</p>
                            </div>
                            <ul className="text-[10px] text-slate-400 space-y-0.5">
                                <li className="flex items-center gap-1"><CheckCircle size={9} className="text-emerald-400" /> Periksa kelengkapan data KK</li>
                                <li className="flex items-center gap-1"><CheckCircle size={9} className="text-emerald-400" /> Validasi tujuan pengajuan</li>
                                <li className="flex items-center gap-1"><CheckCircle size={9} className="text-emerald-400" /> Konfirmasi via WhatsApp jika perlu</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Filter & Search ── */}
            <div className="mb-4 rounded-2xl border border-[#1C2541]/60 bg-[#0B132B]/60 p-4">
                <div className="flex flex-col gap-3 sm:flex-row">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
                        <input
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            placeholder="Cari nomor, pemohon, jenis surat, atau keperluan..."
                            className="w-full rounded-xl border border-[#1C2541]/60 bg-[#111A2E]/60 py-2.5 pl-9 pr-4 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                        />
                    </div>
                    <div className="flex gap-2">
                        {[{ value: 'all', label: 'Semua' }, ...activeStatuses].map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => setStatusFilter(opt.value)}
                                className={`rounded-xl px-4 py-2.5 text-xs font-bold transition ${statusFilter === opt.value
                                    ? 'bg-emerald-500 text-[#0B132B] shadow-lg shadow-emerald-500/20'
                                    : 'border border-[#1C2541]/60 text-slate-400 hover:text-white hover:border-emerald-500/30'
                                }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Table ── */}
            <div className="rounded-2xl border border-[#1C2541]/60 bg-[#0B132B]/60 backdrop-blur-sm overflow-hidden">
                <div className="border-b border-[#1C2541]/40 px-5 py-4 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white">Daftar Pengajuan Warga</h3>
                    <span className="text-xs text-slate-500">{pengajuans.length} pengajuan</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[800px]">
                        <thead>
                            <tr className="border-b border-[#1C2541]/40">
                                {['Nomor', 'Warga', 'No Rumah', 'Jenis Surat', 'Tanggal', 'Status', 'Aksi'].map(h => (
                                    <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-500">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {pengajuans.map(item => {
                                const statusConf = getStatusConfig(item.status);
                                return (
                                    <tr key={item.id} className="border-b border-[#1C2541]/30 hover:bg-[#111A2E]/50 transition group">
                                        <td className="px-4 py-4 font-mono text-xs text-slate-400">{item.nomorPengajuan}</td>
                                        <td className="px-4 py-4">
                                            <p className="text-sm font-bold text-white">{item.pemohon}</p>
                                            <p className="text-xs text-slate-500">KK: {item.kepalaKeluarga}</p>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className="rounded-lg bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 text-xs font-bold text-emerald-300">{item.noRumah}</span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-1.5">
                                                <FileCheck size={14} className="text-blue-400 shrink-0" />
                                                <span className="text-xs text-slate-300">{item.jenisSurat}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-xs text-slate-400">{formatDate(item.tanggalPengajuan)}</td>
                                        <td className="px-4 py-4">
                                            <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-bold ${statusConf.cls}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${statusConf.dot}`} />{item.statusLabel}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex gap-2">
                                                <button onClick={() => setSelectedDetail(item)} className="flex items-center gap-1.5 rounded-xl border border-[#1C2541]/60 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-emerald-300 hover:border-emerald-500/30 transition">
                                                    <Eye size={13} /> Detail
                                                </button>
                                                <button onClick={() => openStatusModal(item)} className="rounded-xl bg-[#111A2E] border border-[#1C2541]/60 px-3 py-1.5 text-xs font-bold text-slate-300 hover:bg-emerald-500/10 hover:text-emerald-300 hover:border-emerald-500/30 transition">
                                                    Proses
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                {pengajuans.length === 0 && (
                    <div className="py-16 text-center">
                        <FileText size={40} className="text-slate-600 mx-auto mb-3" />
                        <p className="text-slate-500 text-sm">Belum ada pengajuan surat.</p>
                    </div>
                )}
            </div>

            {/* ── Detail Modal ── */}
            <Dialog.Root open={selectedDetail !== null} onOpenChange={open => !open && setSelectedDetail(null)}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" />
                    <Dialog.Content className="fixed right-0 top-0 z-50 h-full w-full max-w-2xl overflow-y-auto border-l border-[#1C2541]/60 bg-[#090E1A] shadow-2xl">
                        <div className="sticky top-0 flex items-center justify-between border-b border-[#1C2541]/40 bg-[#090E1A]/95 px-6 py-4 z-10">
                            <Dialog.Title className="text-lg font-black text-white">Detail Pengajuan</Dialog.Title>
                            <Dialog.Close asChild>
                                <button className="rounded-xl p-2 text-slate-400 hover:text-white hover:bg-[#1C2541]/60 transition"><X size={20} /></button>
                            </Dialog.Close>
                        </div>
                        <Dialog.Description className="sr-only">Detail pengajuan surat warga</Dialog.Description>
                        {selectedDetail && (
                            <div className="space-y-5 p-6">
                                <div className="rounded-xl border border-[#1C2541]/60 bg-[#0B132B]/60 p-5">
                                    <div className="mb-4 flex items-start justify-between gap-3">
                                        <div>
                                            <p className="font-mono text-xs text-slate-500">{selectedDetail.nomorPengajuan}</p>
                                            <h3 className="text-base font-black text-white mt-1">{selectedDetail.jenisSurat}</h3>
                                        </div>
                                        <span className={`shrink-0 inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold ${getStatusConfig(selectedDetail.status).cls}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${getStatusConfig(selectedDetail.status).dot}`} />{selectedDetail.statusLabel}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-sm">
                                        {[
                                            ['Pemohon', selectedDetail.pemohon],
                                            ['Kepala Keluarga', selectedDetail.kepalaKeluarga],
                                            ['No. Rumah', selectedDetail.noRumah],
                                            ['No. KK', selectedDetail.noKk],
                                            ['Nomor Surat', selectedDetail.nomorSurat || '-'],
                                            ['Tanggal Pengajuan', formatDate(selectedDetail.tanggalPengajuan)],
                                        ].map(([label, value]) => (
                                            <div key={label}>
                                                <p className="text-xs text-slate-500">{label}</p>
                                                <p className="font-semibold text-white mt-0.5">{value}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Data Pengajuan</h3>
                                    <div className="space-y-2 rounded-xl border border-[#1C2541]/60 bg-[#0B132B]/40 p-4">
                                        {selectedDetail.ringkasanKeperluan && (
                                            <div className="flex justify-between gap-4 py-1 text-sm border-b border-[#1C2541]/40 pb-2 mb-2">
                                                <span className="text-slate-500">Ringkasan Keperluan</span>
                                                <span className="text-right font-semibold text-white">{selectedDetail.ringkasanKeperluan}</span>
                                            </div>
                                        )}
                                        {Object.entries(selectedDetail.dataPengajuan || {}).map(([key, value]) => (
                                            <div key={key} className="flex justify-between gap-4 py-1 text-sm">
                                                <span className="capitalize text-slate-500">{key.replace(/_/g, ' ')}</span>
                                                <span className="text-right font-semibold text-white">{String(value || '-')}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {selectedDetail.catatanWarga && (
                                    <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
                                        <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-blue-400">Catatan Warga</h3>
                                        <p className="text-sm text-slate-300">{selectedDetail.catatanWarga}</p>
                                    </div>
                                )}

                                <div>
                                    <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Dokumen Lampiran</h3>
                                    <div className="space-y-3">
                                        {selectedDetail.files.length > 0 ? selectedDetail.files.map(file => (
                                            <div key={file.id} className="flex items-center justify-between rounded-xl border border-[#1C2541]/60 bg-[#0B132B]/40 p-3">
                                                <div>
                                                    <p className="text-sm font-semibold text-white">{file.label || 'Dokumen'}</p>
                                                    <p className="text-xs text-slate-500">{file.originalName}</p>
                                                </div>
                                                <a href={file.url} target="_blank" className="flex items-center gap-1.5 rounded-xl bg-blue-500/20 border border-blue-500/30 px-3 py-1.5 text-xs font-bold text-blue-300 hover:bg-blue-500/30 transition">
                                                    <Download size={13} /> Buka
                                                </a>
                                            </div>
                                        )) : (
                                            <div className="rounded-xl border border-dashed border-[#1C2541]/60 p-6 text-center text-sm text-slate-500">Belum ada dokumen.</div>
                                        )}
                                    </div>
                                    <div className="flex flex-col sm:flex-row flex-wrap gap-2 border-t border-[#1C2541]/40 pt-4">
                                        <button onClick={() => openStatusModal(selectedDetail, 'diverifikasi_rt')} className="w-full sm:w-auto text-center justify-center rounded-xl bg-blue-500/20 border border-blue-500/30 px-4 py-2 text-sm font-bold text-blue-300 hover:bg-blue-500/30 transition">Verifikasi</button>
                                        <button onClick={() => openStatusModal(selectedDetail, 'revisi')} className="w-full sm:w-auto text-center justify-center rounded-xl bg-orange-500/20 border border-orange-500/30 px-4 py-2 text-sm font-bold text-orange-300 hover:bg-orange-500/30 transition">Minta Revisi</button>
                                        <button onClick={() => openStatusModal(selectedDetail, 'disetujui')} className="w-full sm:w-auto text-center justify-center rounded-xl bg-emerald-500/20 border border-emerald-500/30 px-4 py-2 text-sm font-bold text-emerald-300 hover:bg-emerald-500/30 transition">Setujui</button>
                                        <button onClick={() => openStatusModal(selectedDetail, 'ditolak')} className="w-full sm:w-auto text-center justify-center rounded-xl bg-red-500/20 border border-red-500/30 px-4 py-2 text-sm font-bold text-red-300 hover:bg-red-500/30 transition">Tolak</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>

            {/* ── Status Modal ── */}
            <Dialog.Root open={statusModal !== null} onOpenChange={open => !open && setStatusModal(null)}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" />
                    <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-full max-w-xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-[#1C2541]/60 bg-[#090E1A] shadow-2xl">
                        <div className="sticky top-0 flex items-center justify-between border-b border-[#1C2541]/40 bg-[#090E1A]/95 px-6 py-4 z-10">
                            <Dialog.Title className="text-lg font-black text-white">Ubah Status Pengajuan</Dialog.Title>
                            <Dialog.Close asChild>
                                <button className="rounded-xl p-2 text-slate-400 hover:text-white hover:bg-[#1C2541]/60 transition"><X size={20} /></button>
                            </Dialog.Close>
                        </div>
                        <Dialog.Description className="sr-only">Form update status pengajuan surat warga</Dialog.Description>
                        {statusModal && (
                            <form onSubmit={submitStatus} className="space-y-4 p-6">
                                <div className="rounded-xl border border-[#1C2541]/60 bg-[#0B132B]/60 p-4">
                                    <p className="font-mono text-xs text-slate-500">{statusModal.nomorPengajuan}</p>
                                    <p className="font-bold text-white mt-1">{statusModal.jenisSurat}</p>
                                    <p className="text-sm text-slate-400">{statusModal.pemohon}</p>
                                </div>
                                <div>
                                    <label className={labelCls}>Status</label>
                                    <select value={statusValue} onChange={e => setStatusValue(e.target.value)} className={inputCls}>
                                        {activeStatuses.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className={labelCls}>Nomor Surat</label>
                                    <input value={nomorSurat} onChange={e => setNomorSurat(e.target.value)} placeholder="Boleh kosong, otomatis saat disetujui" className={inputCls} />
                                </div>
                                <div>
                                    <label className={labelCls}>Catatan RT</label>
                                    <textarea value={catatanAdmin} onChange={e => setCatatanAdmin(e.target.value)} rows={4} placeholder="Catatan revisi, alasan penolakan, atau keterangan persetujuan" className={inputCls} />
                                </div>
                                <div>
                                    <label className={labelCls}>Upload File Surat Selesai</label>
                                    <input type="file" accept=".pdf,.jpg,.jpeg,.png,image/jpeg,image/png,application/pdf" onChange={e => setFileSurat(e.target.files?.[0] || null)} className={inputCls} />
                                    <p className="mt-1 text-[10px] text-slate-500">Format PDF/JPG/PNG, maks 4 MB.</p>
                                </div>
                                <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 border-t border-[#1C2541]/40 pt-4">
                                    <button type="button" onClick={() => setStatusModal(null)} className="w-full sm:w-auto rounded-xl border border-[#1C2541]/60 px-4 py-2.5 text-sm text-slate-400 hover:text-white transition">Batal</button>
                                    <button type="submit" disabled={isSubmitting} className="w-full sm:w-auto rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-[#0B132B] hover:bg-emerald-400 transition disabled:opacity-60">
                                        {isSubmitting ? 'Menyimpan...' : 'Simpan Status'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>
        </AdminLayout>
    );
}

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between gap-4 py-1 text-sm">
            <span className="capitalize text-slate-500">{label}</span>
            <span className="text-right font-semibold text-white">{value}</span>
        </div>
    );
}
