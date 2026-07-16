import WargaLayout, { WargaProfile } from '@/Layouts/WargaLayout';
import { Head, Link, router } from '@inertiajs/react';
import { 
    ArrowLeft, 
    CheckCircle, 
    Clock, 
    Download, 
    FileText, 
    Plus, 
    Search, 
    X, 
    XCircle,
    UploadCloud,
    Trash2,
    Check,
    AlertCircle,
    Info,
    ChevronRight,
    HelpCircle,
    FileCheck,
    Zap,
    FileUp,
    Lock,
    HelpCircle as QuestionIcon
} from 'lucide-react';
import { FormEvent, ReactNode, useMemo, useState, useRef } from 'react';

type FieldType = 'text' | 'textarea' | 'select' | 'number' | 'date' | 'time';

type DynamicField = {
    name: string;
    label: string;
    type: FieldType;
    required?: boolean;
    options?: string[];
};

type UploadRequirement = {
    name: string;
    label: string;
    required?: boolean;
};

type JenisSurat = {
    id: number;
    nama: string;
    kode?: string;
    deskripsi?: string | null;
    fields?: DynamicField[];
    uploadRequirements?: UploadRequirement[];
};

type SubmissionFile = {
    id: number;
    label?: string | null;
    originalName?: string | null;
    url?: string;
    previewUrl?: string;
    mimeType?: string | null;
    isAdminFile?: boolean;
};

type Pengajuan = {
    id: number;
    nomorPengajuan?: string;
    nomorSurat?: string | null;
    jenisSurat?: string;
    ringkasanKeperluan?: string | null;
    dataPengajuan?: Record<string, string>;
    catatanWarga?: string | null;
    catatanAdmin?: string | null;
    status?: string;
    statusLabel?: string;
    tanggalPengajuan?: string | null;
    tanggalSelesai?: string | null;
    files?: SubmissionFile[];
};

type Summary = {
    total: number;
    proses: number;
    disetujui: number;
    ditolak: number;
};

type Props = {
    profile?: WargaProfile;
    jenisSurats?: JenisSurat[];
    pengajuans?: Pengajuan[];
    summary?: Summary;
    canSubmit?: boolean;
};

const fallbackProfile: WargaProfile = {
    name: 'Warga',
    initials: 'WG',
    houseNumber: '-',
    hasLinkedWarga: false,
};

const defaultSummary: Summary = {
    total: 0,
    proses: 0,
    disetujui: 0,
    ditolak: 0,
};

function getStatusBadgeConfig(status?: string) {
    switch (status) {
        case 'draft':
            return { cls: 'bg-slate-500/10 text-slate-400 border border-slate-500/20', dot: 'bg-slate-400', label: 'Draft' };
        case 'diajukan':
            return { cls: 'bg-blue-500/10 text-blue-400 border border-blue-500/20', dot: 'bg-blue-400', label: 'Diajukan' };
        case 'diverifikasi_rt':
            return { cls: 'bg-purple-500/10 text-purple-400 border border-purple-500/20', dot: 'bg-purple-400', label: 'Diverifikasi' };
        case 'revisi':
            return { cls: 'bg-orange-500/10 text-orange-400 border border-orange-500/20', dot: 'bg-orange-400', label: 'Revisi' };
        case 'disetujui':
        case 'selesai':
        case 'diambil':
            return { cls: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20', dot: 'bg-emerald-400', label: 'Selesai' };
        case 'ditolak':
            return { cls: 'bg-red-500/10 text-red-400 border border-red-500/20', dot: 'bg-red-400', label: 'Ditolak' };
        default:
            return { cls: 'bg-slate-500/10 text-slate-400 border border-slate-500/20', dot: 'bg-slate-400', label: status || '-' };
    }
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

const inputCls = 'w-full rounded-2xl border border-slate-800 bg-[#131b2e]/60 px-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:border-emerald-500 focus:outline-none transition';
const labelCls = 'mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400';

export default function PengajuanSurat({
    profile = fallbackProfile,
    jenisSurats = [],
    pengajuans = [],
    summary = defaultSummary,
    canSubmit = true,
}: Props) {
    const safeJenisSurats = Array.isArray(jenisSurats) ? jenisSurats : [];
    const safePengajuans = Array.isArray(pengajuans) ? pengajuans : [];
    const safeSummary = summary ?? defaultSummary;

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [showForm, setShowForm] = useState(false);
    
    // Select default template on main page
    const [selectedJenisId, setSelectedJenisId] = useState('');
    const [ringkasanKeperluan, setRingkasanKeperluan] = useState('');
    const [catatanWarga, setCatatanWarga] = useState('');
    const [dataPengajuan, setDataPengajuan] = useState<Record<string, string>>({});
    const [fileMap, setFileMap] = useState<Record<string, File | null>>({});
    const [selectedPengajuan, setSelectedPengajuan] = useState<Pengajuan | null>(null);
    const [processing, setProcessing] = useState(false);

    const selectedJenis = useMemo(() => safeJenisSurats.find((item) => String(item.id) === selectedJenisId) ?? null, [safeJenisSurats, selectedJenisId]);
    const selectedFields = Array.isArray(selectedJenis?.fields) ? selectedJenis.fields : [];
    const selectedUploads = Array.isArray(selectedJenis?.uploadRequirements) ? selectedJenis.uploadRequirements : [];

    const filteredPengajuans = useMemo(() => {
        const search = searchTerm.toLowerCase();

        return safePengajuans.filter((item) => {
            const matchSearch =
                (item.nomorPengajuan ?? '').toLowerCase().includes(search) ||
                (item.jenisSurat ?? '').toLowerCase().includes(search) ||
                (item.ringkasanKeperluan ?? '').toLowerCase().includes(search);
            const matchStatus = statusFilter === 'all' || item.status === statusFilter;

            return matchSearch && matchStatus;
        });
    }, [safePengajuans, searchTerm, statusFilter]);

    const submitPengajuan = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!selectedJenisId) {
            alert('Pilih jenis surat terlebih dahulu.');
            return;
        }

        const formData = new FormData();
        formData.append('jenis_surat_id', selectedJenisId);
        formData.append('ringkasan_keperluan', ringkasanKeperluan);
        formData.append('catatan_warga', catatanWarga);

        Object.entries(dataPengajuan).forEach(([key, value]) => {
            formData.append(`data_pengajuan[${key}]`, String(value ?? ''));
        });

        Object.entries(fileMap).forEach(([key, file]) => {
            if (file) formData.append(`dokumen_pendukung[${key}]`, file as File);
        });

        setProcessing(true);

        router.post('/warga/ajukan-surat', formData, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setSelectedJenisId('');
                setRingkasanKeperluan('');
                setCatatanWarga('');
                setDataPengajuan({});
                setFileMap({});
                setShowForm(false);
            },
            onFinish: () => setProcessing(false),
        });
    };

    const handleStartApplication = () => {
        if (!selectedJenisId) return;
        setShowForm(true);
    };

    return (
        <WargaLayout profile={profile} title="Pengajuan Surat">
            <Head title="Pengajuan Surat" />

            <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 lg:px-8 lg:py-8">
                {/* Header Title */}
                <div className="flex items-center gap-3">
                    <Link href="/warga/dashboard" className="rounded-xl border border-slate-800 bg-[#0b1220] p-2.5 text-slate-400 hover:text-slate-200 transition">
                        <ArrowLeft size={18} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-black text-slate-100 tracking-tight lg:text-3xl">Pengajuan Surat</h1>
                        <p className="text-xs text-slate-400 mt-1">Ajukan dan pantau status berkas administrasi RT secara digital</p>
                    </div>
                </div>

                {/* Tipe Pengajuan Info Banner */}
                <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-xs leading-relaxed text-emerald-300 shadow-md">
                    <Info size={16} className="shrink-0 text-emerald-400 mt-0.5" />
                    <div>
                        <span className="font-bold text-emerald-200">Informasi Tipe Pengajuan:</span> Proses peninjauan, verifikasi, dan penerbitan nomor surat oleh pengurus RT/RW umumnya membutuhkan waktu 1-2 hari kerja sejak dokumen terkirim di sistem.
                    </div>
                </div>

                {!canSubmit && (
                    <div className="rounded-2xl border border-red-500/25 bg-red-500/5 p-4 text-xs font-semibold text-red-400 flex items-center gap-2">
                        <AlertCircle size={16} />
                        Akun Anda belum terhubung dengan data kartu keluarga. Hubungi Sekretariat RT.
                    </div>
                )}

                {/* Summary Row */}
                <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    <SummaryCard icon={<FileText size={18} />} title="Total Pengajuan" value={safeSummary.total} colorClass="text-blue-400" bgClass="bg-blue-500/10 border-blue-500/20" />
                    <SummaryCard icon={<Clock size={18} />} title="Sedang Proses" value={safeSummary.proses} colorClass="text-orange-400" bgClass="bg-orange-500/10 border-orange-500/20" />
                    <SummaryCard icon={<CheckCircle size={18} />} title="Disetujui / Selesai" value={safeSummary.disetujui} colorClass="text-emerald-400" bgClass="bg-emerald-500/10 border-emerald-500/20" />
                    <SummaryCard icon={<XCircle size={18} />} title="Ditolak" value={safeSummary.ditolak} colorClass="text-red-400" bgClass="bg-red-500/10 border-red-500/20" />
                </section>

                {/* 2-Column Core Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    
                    {/* Left Column: Buat Pengajuan Baru */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="rounded-3xl border border-slate-800 bg-[#0b1220] p-5 shadow-xl space-y-5">
                            <div className="flex items-center gap-2 pb-3 border-b border-slate-800/80">
                                <Plus size={18} className="text-emerald-400" />
                                <h2 className="text-sm font-black text-slate-200 uppercase tracking-wider">Buat Pengajuan Baru</h2>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className={labelCls}>Pilih Jenis Surat</label>
                                    <select
                                        disabled={!canSubmit}
                                        value={selectedJenisId}
                                        onChange={(event) => {
                                            setSelectedJenisId(event.target.value);
                                            setDataPengajuan({});
                                            setFileMap({});
                                        }}
                                        className="w-full rounded-2xl border border-slate-800 bg-[#131b2e]/60 px-3.5 py-3 text-sm text-slate-300 focus:border-emerald-500 focus:outline-none transition disabled:opacity-50"
                                    >
                                        <option value="" className="bg-[#0b1220]">Pilih jenis pengajuan...</option>
                                        {safeJenisSurats.map((jenis) => (
                                            <option key={jenis.id} value={jenis.id} className="bg-[#0b1220]">
                                                {jenis.nama}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Dynamic Requirements Box */}
                                {selectedJenis ? (
                                    <div className="rounded-2xl border border-slate-800/60 bg-[#131b2e]/30 p-4 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Dokumen Persyaratan</span>
                                            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                                Resmi Pemerintah
                                            </span>
                                        </div>

                                        {selectedJenis.deskripsi && (
                                            <p className="text-xs text-slate-400 leading-relaxed italic border-b border-slate-800/50 pb-2 mb-2">
                                                "{selectedJenis.deskripsi}"
                                            </p>
                                        )}

                                        <div className="space-y-2">
                                            {selectedUploads.length > 0 ? (
                                                selectedUploads.map((req) => {
                                                    const isUploaded = !!fileMap[req.name];
                                                    return (
                                                        <div key={req.name} className="flex items-center justify-between text-xs py-1">
                                                            <div className="flex items-center gap-2 min-w-0 pr-2">
                                                                <FileText size={13} className="text-slate-500 shrink-0" />
                                                                <span className="text-slate-300 truncate font-medium">{req.label}</span>
                                                                {req.required && <span className="text-red-400 text-[10px] shrink-0">(Wajib)</span>}
                                                            </div>
                                                            <span className={`flex items-center gap-1 text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded shrink-0 ${
                                                                isUploaded 
                                                                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' 
                                                                    : 'bg-slate-800 text-slate-500'
                                                            }`}>
                                                                {isUploaded ? <Check size={8} className="stroke-[3]" /> : null}
                                                                {isUploaded ? 'Siap' : 'Belum'}
                                                            </span>
                                                        </div>
                                                    );
                                                })
                                            ) : (
                                                <div className="text-xs text-slate-500 flex items-center gap-1.5 py-1">
                                                    <Info size={13} />
                                                    Tidak ada berkas fisik khusus yang diperlukan.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="rounded-2xl border border-dashed border-slate-800 p-6 text-center text-xs text-slate-500 leading-relaxed">
                                        Silakan pilih jenis surat di atas untuk melihat dokumen persyaratan yang harus diunggah.
                                    </div>
                                )}

                                <button
                                    type="button"
                                    disabled={!canSubmit || !selectedJenisId}
                                    onClick={handleStartApplication}
                                    className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-3 text-xs font-black uppercase tracking-wider transition disabled:opacity-50 disabled:hover:bg-emerald-500"
                                >
                                    <Zap size={14} className="stroke-[3]" /> Mulai Pengajuan
                                </button>
                            </div>
                        </div>

                        {/* Banner Bantuan */}
                        <div className="rounded-3xl border border-slate-800 bg-[#0b1220] p-5 shadow-lg relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl"></div>
                            <div className="flex items-start gap-4">
                                <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                    <QuestionIcon size={20} />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-xs font-black text-slate-300 uppercase tracking-wider">Butuh Bantuan?</h3>
                                    <p className="text-[11px] text-slate-400 leading-relaxed">
                                        Hubungi sekretariat RT jika Anda mengalami kesulitan dalam pengunggahan berkas persyaratan.
                                    </p>
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            window.dispatchEvent(new CustomEvent('open-helpdesk-ticket'));
                                        }}
                                        className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-400 hover:text-blue-300 transition mt-2 text-left"
                                    >
                                        Hubungi Sekretariat <ChevronRight size={12} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Riwayat Pengajuan */}
                    <div className="lg:col-span-3 space-y-6">
                        <div className="rounded-3xl border border-slate-800 bg-[#0b1220] p-5 shadow-xl space-y-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-800/80">
                                <div className="flex items-center gap-2">
                                    <FileText size={18} className="text-emerald-400" />
                                    <h2 className="text-sm font-black text-slate-200 uppercase tracking-wider">Riwayat Pengajuan</h2>
                                </div>
                                <span className="text-[10px] font-bold text-slate-500">{filteredPengajuans.length} Pengajuan</span>
                            </div>

                            {/* Search & Filter bar */}
                            <div className="flex flex-col gap-3 md:flex-row">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
                                    <input
                                        value={searchTerm}
                                        onChange={(event) => setSearchTerm(event.target.value)}
                                        placeholder="Cari nomor, jenis surat, atau keperluan..."
                                        className="w-full rounded-2xl border border-slate-800 bg-[#131b2e]/60 py-2.5 pl-9 pr-4 text-xs text-slate-200 placeholder-slate-500 focus:border-emerald-500 focus:outline-none transition"
                                    />
                                </div>
                                <select
                                    value={statusFilter}
                                    onChange={(event) => setStatusFilter(event.target.value)}
                                    className="rounded-2xl border border-slate-800 bg-[#131b2e]/80 px-3 py-2.5 text-xs text-slate-300 focus:border-emerald-500 focus:outline-none transition"
                                >
                                    <option value="all" className="bg-[#0b1220]">Semua Status</option>
                                    <option value="diajukan" className="bg-[#0b1220]">Diajukan</option>
                                    <option value="diverifikasi_rt" className="bg-[#0b1220]">Diverifikasi RT</option>
                                    <option value="revisi" className="bg-[#0b1220]">Revisi</option>
                                    <option value="disetujui" className="bg-[#0b1220]">Disetujui / Selesai</option>
                                    <option value="ditolak" className="bg-[#0b1220]">Ditolak</option>
                                </select>
                            </div>

                            {/* List of Applications */}
                            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                                {filteredPengajuans.length === 0 ? (
                                    <div className="rounded-2xl border border-dashed border-slate-800 p-12 text-center text-xs text-slate-500 leading-relaxed">
                                        Belum ada data riwayat pengajuan surat.
                                    </div>
                                ) : (
                                    filteredPengajuans.map((item) => {
                                        const badge = getStatusBadgeConfig(item.status);
                                        return (
                                            <article 
                                                key={item.id} 
                                                className="rounded-2xl border border-slate-800/80 bg-[#131b2e]/20 p-4 hover:border-slate-700/60 transition flex flex-col justify-between"
                                            >
                                                <div className="flex items-start justify-between gap-3 mb-2">
                                                    <div>
                                                        <p className="font-mono text-[10px] text-slate-500 tracking-wider">
                                                            {item.nomorPengajuan || '-'}
                                                        </p>
                                                        <h3 className="text-sm font-black text-slate-200 mt-1">
                                                            {item.jenisSurat || '-'}
                                                        </h3>
                                                    </div>
                                                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wide shrink-0 ${badge.cls}`}>
                                                        <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
                                                        {item.statusLabel || badge.label}
                                                    </span>
                                                </div>

                                                <p className="line-clamp-2 text-xs text-slate-400 leading-relaxed mb-4">
                                                    {item.ringkasanKeperluan || 'Tidak ada keterangan keperluan.'}
                                                </p>

                                                <div className="flex items-center justify-between border-t border-slate-800/60 pt-3 text-[10px] text-slate-500">
                                                    <span>Diajukan: {formatDate(item.tanggalPengajuan)}</span>
                                                    <button 
                                                        type="button" 
                                                        onClick={() => setSelectedPengajuan(item)} 
                                                        className="rounded-xl border border-slate-800 hover:border-emerald-500/40 hover:text-emerald-400 bg-[#131b2e]/60 px-3 py-1.5 font-bold text-slate-300 transition"
                                                    >
                                                        Detail
                                                    </button>
                                                </div>
                                            </article>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal: Form Pengajuan Baru */}
            {showForm && selectedJenis && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
                    <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-slate-800 bg-[#090e1a] shadow-2xl flex flex-col">
                        
                        {/* Sticky Modal Header */}
                        <div className="sticky top-0 flex items-center justify-between border-b border-slate-800 bg-[#090e1a] px-6 py-4 z-10">
                            <div>
                                <h3 className="text-base font-black text-slate-100 uppercase tracking-wider">Lengkapi Formulir Pengajuan</h3>
                                <p className="text-[11px] text-slate-400 mt-0.5">{selectedJenis.nama}</p>
                            </div>
                            <button 
                                type="button" 
                                onClick={() => setShowForm(false)} 
                                className="rounded-xl border border-slate-800 p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 transition"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Form Body */}
                        <form onSubmit={submitPengajuan} className="p-6 space-y-5 flex-1">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                
                                {/* Dynamic Fields Inputs */}
                                {selectedFields.map((field) => (
                                    <div key={field.name} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                                        <DynamicInput
                                            field={field}
                                            value={dataPengajuan[field.name] ?? ''}
                                            onChange={(value) => setDataPengajuan((previous) => ({ ...previous, [field.name]: value }))}
                                        />
                                    </div>
                                ))}

                                {/* Ringkasan Keperluan */}
                                <div className="md:col-span-2">
                                    <label className={labelCls}>Ringkasan Keperluan</label>
                                    <input
                                        required
                                        value={ringkasanKeperluan}
                                        onChange={(event) => setRingkasanKeperluan(event.target.value)}
                                        className={inputCls}
                                        placeholder="Misalnya: Pengurusan bantuan sekolah anak, pembuatan paspor, pengajuan pinjaman bank, dll"
                                    />
                                </div>

                                {/* Catatan Tambahan */}
                                <div className="md:col-span-2">
                                    <label className={labelCls}>Catatan Tambahan (Masyarakat)</label>
                                    <textarea
                                        value={catatanWarga}
                                        onChange={(event) => setCatatanWarga(event.target.value)}
                                        rows={3}
                                        className={inputCls}
                                        placeholder="Tulis pesan atau keterangan tambahan jika diperlukan..."
                                    />
                                </div>
                            </div>

                            {/* Dropzones for Upload Requirements */}
                            {selectedUploads.length > 0 && (
                                <div className="rounded-2xl border border-slate-800 bg-[#131b2e]/25 p-5 space-y-4">
                                    <div>
                                        <p className="text-xs font-black text-slate-200 uppercase tracking-wider">Unggah Berkas Pendukung</p>
                                        <p className="text-[10px] text-slate-500 mt-1">
                                            Format yang didukung adalah PDF, JPG, atau PNG dengan ukuran berkas maksimal 4MB.
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        {selectedUploads.map((upload) => (
                                            <FileDropzone
                                                key={upload.name}
                                                requirement={upload}
                                                file={fileMap[upload.name] ?? null}
                                                onFileSelect={(file) => setFileMap((prev) => ({ ...prev, [upload.name]: file }))}
                                                onFileClear={() => setFileMap((prev) => ({ ...prev, [upload.name]: null }))}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Sticky Modal Footer Actions */}
                            <div className="flex justify-end gap-3 border-t border-slate-800 pt-4 mt-6">
                                <button 
                                    type="button" 
                                    onClick={() => setShowForm(false)} 
                                    className="rounded-xl border border-slate-800 bg-transparent px-4 py-2.5 text-xs font-bold text-slate-400 hover:text-slate-100 transition"
                                >
                                    Batal
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={processing} 
                                    className="flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2.5 text-xs font-black text-slate-950 uppercase tracking-wider transition disabled:opacity-50"
                                >
                                    {processing ? 'Mengirim...' : 'Kirim Pengajuan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Detail Pengajuan */}
            {selectedPengajuan && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
                    <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-slate-800 bg-[#090e1a] shadow-2xl flex flex-col">
                        
                        {/* Detail Modal Header */}
                        <div className="sticky top-0 flex items-start justify-between gap-4 border-b border-slate-800 bg-[#090e1a] px-6 py-4 z-10">
                            <div>
                                <p className="font-mono text-[10px] text-slate-500 tracking-wider">{selectedPengajuan.nomorPengajuan}</p>
                                <h3 className="text-base font-black text-slate-100 uppercase tracking-wider mt-1">{selectedPengajuan.jenisSurat}</h3>
                            </div>
                            <button 
                                type="button" 
                                onClick={() => setSelectedPengajuan(null)} 
                                className="rounded-xl border border-slate-800 p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Detail Modal Body */}
                        <div className="p-6 space-y-6">
                            
                            {/* Status and dates summary block */}
                            <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-800 bg-[#131b2e]/30 p-4 text-xs">
                                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[9px] font-bold uppercase tracking-wide ${getStatusBadgeConfig(selectedPengajuan.status).cls}`}>
                                    <span className={`h-1.5 w-1.5 rounded-full ${getStatusBadgeConfig(selectedPengajuan.status).dot}`} />
                                    {selectedPengajuan.statusLabel || selectedPengajuan.status}
                                </span>
                                <span className="text-slate-500">•</span>
                                <span className="text-slate-400">Diajukan: {formatDate(selectedPengajuan.tanggalPengajuan)}</span>
                                {selectedPengajuan.nomorSurat && (
                                    <>
                                        <span className="text-slate-500">•</span>
                                        <span className="text-emerald-400 font-bold">No. Surat: {selectedPengajuan.nomorSurat}</span>
                                    </>
                                )}
                            </div>

                            {/* Keperluan, Notes, and RT Feedbacks */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <InfoBox title="Ringkasan Keperluan" value={selectedPengajuan.ringkasanKeperluan || '-'} />
                                {selectedPengajuan.catatanWarga && <InfoBox title="Catatan dari Warga" value={selectedPengajuan.catatanWarga} />}
                                {selectedPengajuan.catatanAdmin && (
                                    <div className="md:col-span-2">
                                        <InfoBox title="Catatan / Arahan dari Pengurus RT" value={selectedPengajuan.catatanAdmin} highlight />
                                    </div>
                                )}
                            </div>

                            {/* JSON Dynamic Fields data */}
                            {selectedPengajuan.dataPengajuan && Object.keys(selectedPengajuan.dataPengajuan).length > 0 && (
                                <div className="rounded-2xl border border-slate-800/80 bg-[#0b1220] p-4 space-y-3 shadow-md">
                                    <p className="text-xs font-black text-slate-200 uppercase tracking-wider">Data Rincian Formulir</p>
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
                                        {Object.entries(selectedPengajuan.dataPengajuan).map(([key, value]) => (
                                            <div key={key} className="rounded-xl border border-slate-800/60 bg-[#131b2e]/40 p-3">
                                                <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">{key.replace(/_/g, ' ')}</p>
                                                <p className="mt-1 text-xs font-semibold text-slate-200 truncate">{value || '-'}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Uploaded Documents List */}
                            <div className="rounded-2xl border border-slate-800/80 bg-[#0b1220] p-4 space-y-3 shadow-md">
                                <p className="text-xs font-black text-slate-200 uppercase tracking-wider">Dokumen Lampiran Berkas</p>
                                <div className="space-y-2.5">
                                    {(selectedPengajuan.files?.length ?? 0) > 0 ? (
                                        selectedPengajuan.files?.map((file) => (
                                            <div 
                                                key={file.id} 
                                                className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-[#131b2e]/20 p-3.5 sm:flex-row sm:items-center sm:justify-between"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                                        <FileCheck size={16} />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-slate-200">
                                                            {file.label || file.originalName || 'Berkas Lampiran'}
                                                        </p>
                                                        <p className="text-[10px] text-slate-500 mt-0.5">
                                                            {file.isAdminFile ? 'Disiapkan oleh Admin' : 'Dokumen Pendukung Warga'}
                                                        </p>
                                                    </div>
                                                </div>
                                                {(file.previewUrl || file.url) && (
                                                    <a 
                                                        href={file.previewUrl || file.url} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer" 
                                                        className="flex items-center justify-center gap-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 px-3.5 py-2 text-xs font-bold text-blue-300 hover:bg-blue-500/20 transition"
                                                    >
                                                        <Download size={14} /> Buka Berkas
                                                    </a>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-xs text-slate-500 flex items-center gap-1.5 py-1">
                                            <Info size={13} />
                                            Belum ada dokumen yang diunggah.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </WargaLayout>
    );
}

function SummaryCard({ 
    icon, 
    title, 
    value,
    colorClass,
    bgClass
}: { 
    icon: ReactNode; 
    title: string; 
    value: number;
    colorClass: string;
    bgClass: string;
}) {
    return (
        <div className="rounded-2xl border border-slate-800/80 bg-[#0b1220] p-4 shadow-sm flex items-center justify-between transition hover:border-slate-700/60">
            <div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">{title}</p>
                <p className={`text-2xl font-black ${colorClass} mt-1`}>{value}</p>
            </div>
            <div className={`rounded-xl border p-2 ${bgClass} ${colorClass} shrink-0`}>
                {icon}
            </div>
        </div>
    );
}

function FileDropzone({
    requirement,
    file,
    onFileSelect,
    onFileClear
}: {
    requirement: UploadRequirement;
    file: File | null;
    onFileSelect: (file: File) => void;
    onFileClear: () => void;
}) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [dragActive, setDragActive] = useState(false);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const selectedFile = e.dataTransfer.files[0];
            if (validateFile(selectedFile)) {
                onFileSelect(selectedFile);
            }
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            if (validateFile(selectedFile)) {
                onFileSelect(selectedFile);
            }
        }
    };

    const validateFile = (file: File) => {
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
        if (!allowedTypes.includes(file.type)) {
            alert('Format berkas tidak didukung! Gunakan format PDF, JPG, atau PNG.');
            return false;
        }
        if (file.size > 4 * 1024 * 1024) {
            alert('Ukuran berkas melebihi batas maksimal 4MB!');
            return false;
        }
        return true;
    };

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const dm = 2;
        const sizes = ['B', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    };

    return (
        <div className="space-y-1.5 text-left">
            <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                    {requirement.label} {requirement.required && <span className="text-red-400">*</span>}
                </span>
                {file && (
                    <span className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase text-emerald-400 bg-emerald-500/15 px-2 py-0.5 border border-emerald-500/20 rounded">
                        <Check size={9} className="stroke-[3]" /> Terunggah
                    </span>
                )}
            </div>

            {file ? (
                <div className="flex items-center justify-between rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-3.5 transition">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <FileCheck size={18} />
                        </div>
                        <div className="min-w-0">
                            <p className="truncate text-xs font-bold text-slate-200">{file.name}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">{formatSize(file.size)} • {file.name.split('.').pop()?.toUpperCase()}</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onFileClear}
                        className="rounded-xl p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition border border-transparent hover:border-red-500/20 shrink-0"
                    >
                        <Trash2 size={15} />
                    </button>
                </div>
            ) : (
                <div
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed py-7 px-4 text-center cursor-pointer transition ${
                        dragActive 
                            ? 'border-emerald-400 bg-emerald-500/5' 
                            : 'border-slate-800 bg-[#131b2e]/30 hover:border-slate-700 hover:bg-[#131b2e]/60'
                    }`}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFileChange}
                        className="hidden"
                    />
                    <UploadCloud size={24} className={`${dragActive ? 'text-emerald-400 animate-bounce' : 'text-slate-500'} mb-2`} />
                    <p className="text-xs font-bold text-slate-300">
                        {dragActive ? 'Lepas file di sini' : 'Pilih atau Tarik Berkas'}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1">
                        PDF, JPG, atau PNG (Maks. 4MB)
                    </p>
                </div>
            )}
        </div>
    );
}

function DynamicInput({ field, value, onChange }: { field: DynamicField; value: string; onChange: (value: string) => void }) {
    if (field.type === 'textarea') {
        return (
            <div>
                <label className={labelCls}>
                    {field.label} {field.required && <span className="text-red-400">*</span>}
                </label>
                <textarea 
                    required={field.required} 
                    value={value} 
                    onChange={(event) => onChange(event.target.value)} 
                    rows={3} 
                    className={inputCls} 
                />
            </div>
        );
    }

    if (field.type === 'select') {
        return (
            <div>
                <label className={labelCls}>
                    {field.label} {field.required && <span className="text-red-400">*</span>}
                </label>
                <select 
                    required={field.required} 
                    value={value} 
                    onChange={(event) => onChange(event.target.value)} 
                    className={inputCls}
                >
                    <option value="" className="bg-[#090e1a]">Pilih {field.label}...</option>
                    {(field.options ?? []).map((option) => (
                        <option key={option} value={option} className="bg-[#090e1a]">
                            {option}
                        </option>
                    ))}
                </select>
            </div>
        );
    }

    return (
        <div>
            <label className={labelCls}>
                {field.label} {field.required && <span className="text-red-400">*</span>}
            </label>
            <input 
                required={field.required} 
                type={field.type} 
                value={value} 
                onChange={(event) => onChange(event.target.value)} 
                className={inputCls} 
            />
        </div>
    );
}

function InfoBox({ title, value, highlight = false }: { title: string; value: string; highlight?: boolean }) {
    return (
        <div className={`rounded-2xl p-4 shadow-sm border ${
            highlight 
                ? 'border-blue-500/20 bg-blue-500/5' 
                : 'border-slate-800 bg-[#131b2e]/10'
        }`}>
            <p className={`mb-1.5 text-[10px] font-bold uppercase tracking-wider ${highlight ? 'text-blue-400' : 'text-slate-500'}`}>{title}</p>
            <p className="whitespace-pre-line text-xs leading-relaxed text-slate-300 font-medium">{value}</p>
        </div>
    );
}
