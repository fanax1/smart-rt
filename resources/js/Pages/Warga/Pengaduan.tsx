import WargaLayout, { WargaProfile } from '@/Layouts/WargaLayout';
import { Head, Link, router } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowLeft,
    CheckCircle,
    Clock,
    Download,
    MessageSquare,
    Plus,
    Search,
    X,
    XCircle,
    UploadCloud,
    FileText,
    MapPin,
    AlertTriangle,
    Eye,
    MessageCircle,
    ChevronLeft,
    ChevronRight,
    ImageIcon
} from 'lucide-react';
import { FormEvent, ReactNode, useMemo, useState } from 'react';

type Option = {
    value: string;
    label: string;
};

type ComplaintFile = {
    id: number;
    label?: string | null;
    originalName?: string | null;
    url?: string;
    previewUrl?: string;
    mimeType?: string | null;
    size?: number;
    isAdminFile?: boolean;
};

type ComplaintResponse = {
    id: number;
    statusFrom?: string | null;
    statusTo?: string | null;
    statusToLabel?: string | null;
    pesan?: string | null;
    isAdmin?: boolean;
    userName?: string | null;
    createdAt?: string | null;
};

type Complaint = {
    id: number;
    nomorPengaduan?: string;
    judul?: string;
    kategori?: string;
    kategoriLabel?: string;
    prioritas?: string;
    prioritasLabel?: string;
    lokasi?: string | null;
    deskripsi?: string;
    status?: 'diajukan' | 'diproses' | 'selesai' | 'ditolak' | 'dibatalkan' | string;
    statusLabel?: string;
    catatanAdmin?: string | null;
    tanggalPengaduan?: string | null;
    tanggalDiproses?: string | null;
    tanggalSelesai?: string | null;
    files?: ComplaintFile[];
    tanggapans?: ComplaintResponse[];
};

type Summary = {
    total: number;
    diajukan: number;
    diproses: number;
    selesai: number;
    ditolak: number;
};

type Props = {
    profile?: WargaProfile;
    complaints?: Complaint[];
    summary?: Summary;
    categoryOptions?: Option[];
    priorityOptions?: Option[];
    canSubmit?: boolean;
};

type FormState = {
    judul: string;
    kategori: string;
    prioritas: string;
    lokasi: string;
    deskripsi: string;
    is_private: string;
    lampiran: File[];
};

const fallbackProfile: WargaProfile = {
    name: 'Warga',
    initials: 'WG',
    houseNumber: '-',
    hasLinkedWarga: false,
};

const defaultSummary: Summary = {
    total: 0,
    diajukan: 0,
    diproses: 0,
    selesai: 0,
    ditolak: 0,
};

const defaultCategoryOptions: Option[] = [
    { value: 'lingkungan', label: 'Lingkungan' },
    { value: 'keamanan', label: 'Keamanan' },
    { value: 'fasilitas', label: 'Fasilitas Umum' },
    { value: 'sosial', label: 'Sosial' },
    { value: 'administrasi', label: 'Administrasi' },
    { value: 'lainnya', label: 'Lainnya' },
];

const defaultPriorityOptions: Option[] = [
    { value: 'rendah', label: 'Rendah' },
    { value: 'sedang', label: 'Sedang' },
    { value: 'tinggi', label: 'Tinggi' },
    { value: 'darurat', label: 'Darurat' },
];

const defaultForm: FormState = {
    judul: '',
    kategori: 'lingkungan',
    prioritas: 'sedang',
    lokasi: '',
    deskripsi: '',
    is_private: '1',
    lampiran: [],
};

function statusBadgeClass(status?: string) {
    const s = String(status || '').toLowerCase();
    switch (s) {
        case 'selesai':
            return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
        case 'diproses':
            return 'bg-amber-50 text-amber-700 border border-amber-200';
        case 'diajukan':
        case 'pending':
            return 'bg-blue-50 text-blue-700 border border-blue-200';
        case 'ditolak':
            return 'bg-red-50 text-red-700 border border-red-200';
        case 'dibatalkan':
            return 'bg-slate-100 text-slate-700 border border-slate-200';
        default:
            return 'bg-slate-100 text-slate-700 border border-slate-200';
    }
}

function priorityBadgeClass(priority?: string) {
    const p = String(priority || '').toLowerCase();
    switch (p) {
        case 'darurat':
            return 'bg-red-50 text-red-700 border border-red-200';
        case 'tinggi':
            return 'bg-amber-50 text-amber-700 border border-amber-200';
        case 'sedang':
            return 'bg-blue-50 text-blue-700 border border-blue-200';
        case 'rendah':
            return 'bg-slate-100 text-slate-700 border border-slate-200';
        default:
            return 'bg-slate-100 text-slate-700 border border-slate-200';
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

function formatDateTime(value?: string | null) {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }) + ' WIB';
}

function formatFileSize(size?: number) {
    if (!size) return '-';
    if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function canCancelComplaint(status?: string) {
    return ['diajukan', 'pending', 'menunggu'].includes(String(status).toLowerCase());
}

export default function Pengaduan({
    profile = fallbackProfile,
    complaints = [],
    summary = defaultSummary,
    categoryOptions = defaultCategoryOptions,
    priorityOptions = defaultPriorityOptions,
    canSubmit = true,
}: Props) {
    const data = Array.isArray(complaints) ? complaints : [];
    const categories = categoryOptions.length > 0 ? categoryOptions : defaultCategoryOptions;
    const priorities = priorityOptions.length > 0 ? priorityOptions : defaultPriorityOptions;

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); // all, active, selesai
    const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
    const [form, setForm] = useState<FormState>(defaultForm);
    const [processing, setProcessing] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 3;

    const filtered = useMemo(() => {
        const search = searchTerm.toLowerCase();

        return data.filter((complaint) => {
            const matchSearch =
                (complaint.nomorPengaduan ?? '').toLowerCase().includes(search) ||
                (complaint.judul ?? '').toLowerCase().includes(search) ||
                (complaint.deskripsi ?? '').toLowerCase().includes(search) ||
                (complaint.lokasi ?? '').toLowerCase().includes(search);

            let matchStatus = false;
            const currentStatus = String(complaint.status || '').toLowerCase();
            if (statusFilter === 'all') {
                matchStatus = true;
            } else if (statusFilter === 'active') {
                matchStatus = ['diajukan', 'diproses', 'pending'].includes(currentStatus);
            } else if (statusFilter === 'selesai') {
                matchStatus = currentStatus === 'selesai';
            }

            return matchSearch && matchStatus;
        });
    }, [data, searchTerm, statusFilter]);

    const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
    const paginatedItems = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filtered.slice(start, start + itemsPerPage);
    }, [filtered, currentPage]);

    const handleSearch = (text: string) => {
        setSearchTerm(text);
        setCurrentPage(1);
    };

    const handleFilterSelect = (filterVal: string) => {
        setStatusFilter(filterVal);
        setCurrentPage(1);
    };

    const submitPengaduan = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const payload = new FormData();
        payload.append('judul', form.judul);
        payload.append('kategori', form.kategori);
        payload.append('prioritas', form.prioritas);
        payload.append('lokasi', form.lokasi);
        payload.append('deskripsi', form.deskripsi);
        payload.append('is_private', form.is_private);
        form.lampiran.forEach((file) => payload.append('lampiran[]', file));

        setProcessing(true);

        router.post('/warga/pengaduan', payload, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setForm(defaultForm);
            },
            onFinish: () => setProcessing(false),
        });
    };

    const cancelPengaduan = (pengaduanId: number) => {
        if (!confirm('Yakin ingin membatalkan pengaduan ini?')) {
            return;
        }

        router.patch(
            `/warga/pengaduan/${pengaduanId}/batal`,
            {},
            {
                preserveScroll: true,
            },
        );
    };

    const getFirstImageFile = (complaint: Complaint) => {
        const file = complaint.files?.find(f => f.mimeType?.startsWith('image/'));
        return file?.previewUrl || file?.url || null;
    };

    return (
        <WargaLayout profile={profile} title="Pengaduan & Aspirasi Warga">
            <Head title="Pengaduan & Aspirasi Warga" />

            <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 lg:px-8 lg:py-8">
                {/* Header Back & Titles */}
                <div className="flex items-center gap-3">
                    <Link href="/warga/dashboard" className="rounded-xl bg-white border border-slate-200 p-2 text-slate-600 hover:text-slate-900 shadow-sm transition">
                        <ArrowLeft size={16} />
                    </Link>
                    <div>
                        <h1 className="text-xl font-black text-slate-900 tracking-tight">Pengaduan Warga</h1>
                        <p className="text-xs text-slate-600 mt-0.5 font-medium">Laporkan masalah lingkungan dan layanan RT secara langsung dan aman.</p>
                    </div>
                </div>

                {/* Mobile Search input */}
                <div className="lg:hidden relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => handleSearch(e.target.value)}
                        placeholder="Cari pengaduan..."
                        className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-xs text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    />
                </div>

                {/* main content split grid layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Left Column: Form + stats */}
                    <div className="lg:col-span-5 space-y-6">
                        {/* Form Card */}
                        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm relative overflow-hidden">
                            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Plus size={16} className="text-emerald-600" />
                                <span>Buat Pengaduan Baru</span>
                            </h2>

                            {!canSubmit ? (
                                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-700 leading-relaxed font-semibold">
                                    Akun Anda belum terhubung dengan data warga. Hubungi pengurus RT untuk sinkronisasi profil agar dapat membuat aduan.
                                </div>
                            ) : (
                                <form onSubmit={submitPengaduan} className="space-y-4">
                                    {/* Judul */}
                                    <div>
                                        <label className="text-xs font-bold text-slate-700 block mb-1.5">Judul Laporan</label>
                                        <input
                                            type="text"
                                            required
                                            value={form.judul}
                                            onChange={(e) => setForm(prev => ({ ...prev, judul: e.target.value }))}
                                            placeholder="Contoh: Lampu jalan Blok A mati..."
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-900 focus:bg-white focus:border-emerald-500 focus:ring-emerald-500 placeholder:text-slate-400 transition"
                                        />
                                    </div>

                                    {/* Category & Sifat row */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-bold text-slate-700 block mb-1.5">Kategori</label>
                                            <select
                                                value={form.kategori}
                                                onChange={(e) => setForm(prev => ({ ...prev, kategori: e.target.value }))}
                                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs text-slate-900 focus:bg-white focus:border-emerald-500 focus:ring-emerald-500 capitalize transition"
                                            >
                                                {categories.map(cat => (
                                                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-700 block mb-1.5">Sifat Aduan</label>
                                            <select
                                                value={form.is_private}
                                                onChange={(e) => setForm(prev => ({ ...prev, is_private: e.target.value }))}
                                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs text-slate-900 focus:bg-white focus:border-emerald-500 focus:ring-emerald-500 transition"
                                            >
                                                <option value="1">Rahasia / Privat</option>
                                                <option value="0">Publik / Umum</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Lokasi */}
                                    <div>
                                        <label className="text-xs font-bold text-slate-700 block mb-1.5">Lokasi Kejadian</label>
                                        <input
                                            type="text"
                                            value={form.lokasi}
                                            onChange={(e) => setForm(prev => ({ ...prev, lokasi: e.target.value }))}
                                            placeholder="Contoh: Dekat Pos Satpam Blok C"
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-900 focus:bg-white focus:border-emerald-500 focus:ring-emerald-500 placeholder:text-slate-400 transition"
                                        />
                                    </div>

                                    {/* Deskripsi */}
                                    <div>
                                        <label className="text-xs font-bold text-slate-700 block mb-1.5">Deskripsi Detail</label>
                                        <textarea
                                            required
                                            value={form.deskripsi}
                                            onChange={(e) => setForm(prev => ({ ...prev, deskripsi: e.target.value }))}
                                            rows={3}
                                            placeholder="Jelaskan detail masalah yang terjadi..."
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-emerald-500 focus:ring-emerald-500 transition"
                                        />
                                    </div>

                                    {/* Upload Bukti */}
                                    <div>
                                        <label className="text-xs font-bold text-slate-700 block mb-1.5">Lampiran Bukti Foto</label>
                                        <div className="relative">
                                            {form.lampiran.length === 0 ? (
                                                <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 hover:border-emerald-500 rounded-2xl p-5 bg-slate-50 cursor-pointer transition group">
                                                    <UploadCloud size={24} className="text-slate-400 group-hover:text-emerald-600 transition mb-1.5" />
                                                    <span className="text-[11px] font-bold text-slate-700">Pilih Foto Bukti Kejadian</span>
                                                    <span className="text-[9px] text-slate-500 mt-0.5 font-medium">PNG, JPG, WEBP, atau PDF (Maks. 5MB)</span>
                                                    <input
                                                        type="file"
                                                        multiple
                                                        accept="image/*,.pdf"
                                                        onChange={(e) => setForm(prev => ({ ...prev, lampiran: Array.from(e.target.files ?? []) }))}
                                                        className="hidden"
                                                    />
                                                </label>
                                            ) : (
                                                <div className="flex items-center justify-between border border-emerald-200 rounded-2xl p-3 bg-emerald-50">
                                                    <div className="flex items-center gap-2.5 overflow-hidden">
                                                        <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700 shrink-0">
                                                            <FileText size={16} />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-xs font-bold text-slate-900 truncate">
                                                                {form.lampiran.map(f => f.name).join(', ')}
                                                            </p>
                                                            <p className="text-[9px] text-emerald-700 font-bold">
                                                                {form.lampiran.length} file dipilih
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => setForm(prev => ({ ...prev, lampiran: [] }))}
                                                        className="p-1 rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {processing ? 'Mengirim...' : 'Kirim Laporan Pengaduan'}
                                    </button>
                                </form>
                            )}
                        </div>

                        {/* stats cards widget */}
                        <div className="grid grid-cols-2 gap-4">
                            {/* Card 1: Total */}
                            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                <div className="mb-2.5 flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    <MessageSquare size={15} />
                                </div>
                                <h3 className="text-2xl font-black text-slate-900">{summary.total || 0}</h3>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Total Laporan</p>
                            </div>

                            {/* Card 2: Belum Selesai */}
                            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                <div className="mb-2.5 flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
                                    <Clock size={15} />
                                </div>
                                <h3 className="text-2xl font-black text-slate-900">
                                    {(summary.diajukan || 0) + (summary.diproses || 0)}
                                </h3>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Belum Selesai</p>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Complaints History List */}
                    <div className="lg:col-span-7 space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-200 mb-2">
                            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Riwayat Pengaduan Anda</h2>
                            {/* Pills */}
                            <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 p-1 rounded-xl">
                                <button
                                    onClick={() => handleFilterSelect('all')}
                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wide uppercase transition ${
                                        statusFilter === 'all' 
                                            ? 'bg-emerald-600 text-white shadow-sm' 
                                            : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                >
                                    Semua
                                </button>
                                <button
                                    onClick={() => handleFilterSelect('active')}
                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wide uppercase transition ${
                                        statusFilter === 'active' 
                                            ? 'bg-emerald-600 text-white shadow-sm' 
                                            : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                >
                                    Aktif
                                </button>
                                <button
                                    onClick={() => handleFilterSelect('selesai')}
                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wide uppercase transition ${
                                        statusFilter === 'selesai' 
                                            ? 'bg-emerald-600 text-white shadow-sm' 
                                            : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                >
                                    Selesai
                                </button>
                            </div>
                        </div>

                        {/* List Cards loop */}
                        {filtered.length === 0 ? (
                            <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-10 text-center text-xs text-slate-500 shadow-sm">
                                <AlertTriangle size={30} className="mx-auto text-slate-400 mb-2" />
                                <span>Tidak ada riwayat laporan pengaduan ditemukan.</span>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {paginatedItems.map((complaint) => {
                                    const image = getFirstImageFile(complaint);
                                    const isPending = canCancelComplaint(complaint.status);
                                    
                                    return (
                                        <div 
                                            key={complaint.id}
                                            className="flex flex-col sm:flex-row gap-4 p-4 rounded-3xl border border-slate-200 bg-white hover:border-emerald-200 hover:shadow-md transition-all duration-300 relative group shadow-sm"
                                        >
                                            {/* Thumbnail Left */}
                                            <div className="h-24 w-full sm:w-24 md:h-28 md:w-28 rounded-2xl overflow-hidden shrink-0 border border-slate-200 bg-slate-100 flex items-center justify-center relative">
                                                {image ? (
                                                    <img src={image} alt={complaint.judul} className="h-full w-full object-cover" />
                                                ) : (
                                                    <ImageIcon size={22} className="text-slate-400" />
                                                )}
                                            </div>

                                            {/* Details Right */}
                                            <div className="flex-1 flex flex-col justify-between space-y-2">
                                                <div>
                                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className={`rounded px-1.5 py-0.5 text-[8px] font-black tracking-wide uppercase ${statusBadgeClass(complaint.status)}`}>
                                                                {complaint.statusLabel || complaint.status || '-'}
                                                            </span>
                                                            <span className={`rounded px-1.5 py-0.5 text-[8px] font-black tracking-wide uppercase ${priorityBadgeClass(complaint.prioritas)}`}>
                                                                {complaint.prioritasLabel || complaint.prioritas || '-'}
                                                            </span>
                                                        </div>
                                                        <span className="text-[10px] text-slate-500 font-bold font-mono">
                                                            #{complaint.nomorPengaduan || '-'} · {formatDate(complaint.tanggalPengaduan)}
                                                        </span>
                                                    </div>

                                                    <h3 className="text-xs font-black text-slate-900 mt-2 leading-tight tracking-tight group-hover:text-emerald-700 transition-colors">
                                                        {complaint.judul}
                                                    </h3>
                                                    
                                                    <p className="text-[11px] text-slate-600 leading-relaxed font-medium line-clamp-2 mt-1.5">
                                                        {complaint.deskripsi}
                                                    </p>
                                                </div>

                                                <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedComplaint(complaint)}
                                                        className="text-[10px] font-bold text-emerald-700 hover:text-emerald-800 transition flex items-center gap-1"
                                                    >
                                                        <span>Lihat Detail Laporan</span>
                                                        <ArrowLeft size={12} className="rotate-180" />
                                                    </button>

                                                    {isPending && (
                                                        <button
                                                            type="button"
                                                            onClick={() => cancelPengaduan(complaint.id)}
                                                            className="text-[10px] font-bold text-red-600 hover:text-red-700 transition"
                                                        >
                                                            Batalkan Laporan
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-1.5 pt-4">
                                <button
                                    type="button"
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition"
                                >
                                    <ChevronLeft size={14} />
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                    <button
                                        key={page}
                                        type="button"
                                        onClick={() => setCurrentPage(page)}
                                        className={`h-8 w-8 rounded-xl text-xs font-bold transition ${
                                            currentPage === page 
                                                ? 'bg-emerald-600 text-white shadow-sm' 
                                                : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                                        }`}
                                    >
                                        {page}
                                    </button>
                                ))}
                                <button
                                    type="button"
                                    disabled={currentPage === totalPages}
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition"
                                >
                                    <ChevronRight size={14} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal: View Complaint Detail */}
            {selectedComplaint && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl bg-white border border-slate-200 shadow-2xl overflow-hidden">
                        {/* Modal Header */}
                        <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5 bg-slate-50">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className={`rounded px-1.5 py-0.5 text-[8px] font-black uppercase ${statusBadgeClass(selectedComplaint.status)}`}>
                                        {selectedComplaint.statusLabel || selectedComplaint.status}
                                    </span>
                                    <span className={`rounded px-1.5 py-0.5 text-[8px] font-black uppercase ${priorityBadgeClass(selectedComplaint.prioritas)}`}>
                                        {selectedComplaint.prioritasLabel || selectedComplaint.prioritas}
                                    </span>
                                </div>
                                <h3 className="text-base font-black text-slate-900 leading-snug tracking-tight mt-2">{selectedComplaint.judul}</h3>
                                <p className="mt-1 text-[10px] text-slate-500 font-bold font-mono">No. {selectedComplaint.nomorPengaduan || '-'}</p>
                            </div>
                            <button type="button" onClick={() => setSelectedComplaint(null)} className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-900 transition">
                                <X size={18} />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-5 overflow-y-auto space-y-4 flex-1 scrollbar-thin">
                            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 space-y-3">
                                <div>
                                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Deskripsi Masalah</p>
                                    <p className="text-xs text-slate-700 leading-relaxed font-medium whitespace-pre-line">{selectedComplaint.deskripsi || '-'}</p>
                                </div>
                                {selectedComplaint.lokasi && (
                                    <div className="pt-2 border-t border-slate-200 flex items-center gap-1.5 text-[11px] text-slate-600 font-bold">
                                        <MapPin size={12} className="text-emerald-600" />
                                        <span>Lokasi: {selectedComplaint.lokasi}</span>
                                    </div>
                                )}
                            </div>

                            {selectedComplaint.catatanAdmin && (
                                <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4">
                                    <p className="text-[9px] font-bold text-amber-800 uppercase tracking-wider mb-1">Tanggapan/Catatan Admin RT</p>
                                    <p className="text-xs text-amber-950 leading-relaxed font-medium">{selectedComplaint.catatanAdmin}</p>
                                </div>
                            )}

                            {/* Date timeline cards */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-center">
                                    <p className="text-[8px] uppercase font-bold text-slate-500 tracking-wider">Diajukan</p>
                                    <p className="text-[10px] font-black text-slate-900 mt-1">{formatDate(selectedComplaint.tanggalPengaduan)}</p>
                                </div>
                                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-center">
                                    <p className="text-[8px] uppercase font-bold text-slate-500 tracking-wider">Diproses</p>
                                    <p className="text-[10px] font-black text-slate-900 mt-1">{selectedComplaint.tanggalDiproses ? formatDate(selectedComplaint.tanggalDiproses) : '-'}</p>
                                </div>
                                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-center">
                                    <p className="text-[8px] uppercase font-bold text-slate-500 tracking-wider">Selesai</p>
                                    <p className="text-[10px] font-black text-slate-900 mt-1">{selectedComplaint.tanggalSelesai ? formatDate(selectedComplaint.tanggalSelesai) : '-'}</p>
                                </div>
                            </div>

                            {/* Files */}
                            {(selectedComplaint.files?.length ?? 0) > 0 && (
                                <div className="space-y-2.5">
                                    <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-wider">Dokumen & Foto Bukti</h4>
                                    <div className="space-y-2">
                                        {selectedComplaint.files?.map((file) => (
                                            <div key={file.id} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                                                <div className="min-w-0">
                                                    <p className="text-xs font-bold text-slate-900 truncate">{file.originalName || 'Lampiran'}</p>
                                                    <p className="text-[10px] text-slate-500 font-semibold">{file.isAdminFile ? 'Dari Pengurus' : 'Berkas Warga'} · {formatFileSize(file.size)}</p>
                                                </div>
                                                {(file.previewUrl || file.url) && (
                                                    <a 
                                                        href={file.previewUrl || file.url} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer" 
                                                        className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-white border border-slate-200 hover:bg-emerald-50 hover:border-emerald-200 px-3.5 py-2 text-xs font-bold text-emerald-700 transition shadow-sm"
                                                    >
                                                        <Eye size={13} className="text-emerald-600" />
                                                        <span>Buka</span>
                                                    </a>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Tanggapan Logs */}
                            {(selectedComplaint.tanggapans?.length ?? 0) > 0 && (
                                <div className="space-y-2.5">
                                    <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-wider">Log Riwayat Tanggapan</h4>
                                    <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin">
                                        {selectedComplaint.tanggapans?.map((item) => (
                                            <div key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 relative">
                                                <div className="flex items-center justify-between gap-2 text-[10px] text-slate-500 mb-1">
                                                    <span className="font-bold text-slate-900">{item.userName || (item.isAdmin ? 'Admin RT' : 'Warga')}</span>
                                                    <span className="font-mono">{formatDateTime(item.createdAt)}</span>
                                                </div>
                                                {item.statusToLabel && (
                                                    <p className="text-[9px] font-extrabold text-emerald-700 uppercase tracking-wider mb-1">
                                                        Status Laporan: {item.statusToLabel}
                                                    </p>
                                                )}
                                                <p className="text-xs text-slate-700 leading-relaxed font-medium">{item.pesan}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="border-t border-slate-200 p-5 bg-slate-50 flex justify-end">
                            <button 
                                type="button" 
                                onClick={() => setSelectedComplaint(null)}
                                className="rounded-xl bg-white hover:bg-slate-100 border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 transition shadow-sm"
                            >
                                Tutup Laporan
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Chat Floating Support Button */}
            <a 
                href="#"
                className="fixed bottom-6 right-6 lg:bottom-8 lg:right-8 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-white border border-emerald-200 text-emerald-600 shadow-xl hover:bg-emerald-50 active:scale-95 transition"
                title="Hubungi Pengurus RT"
            >
                <MessageCircle size={22} />
            </a>
        </WargaLayout>
    );
}