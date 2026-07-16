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
            return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
        case 'diproses':
            return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
        case 'diajukan':
        case 'pending':
            return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
        case 'ditolak':
            return 'bg-red-500/10 text-red-400 border border-red-500/20';
        case 'dibatalkan':
            return 'bg-slate-800 text-slate-400 border border-slate-700/60';
        default:
            return 'bg-slate-800 text-slate-400 border border-slate-700/60';
    }
}

function priorityBadgeClass(priority?: string) {
    const p = String(priority || '').toLowerCase();
    switch (p) {
        case 'darurat':
            return 'bg-red-500/10 text-red-400 border border-red-500/20';
        case 'tinggi':
            return 'bg-orange-500/10 text-orange-400 border border-orange-500/20';
        case 'sedang':
            return 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20';
        case 'rendah':
            return 'bg-slate-800 text-slate-400 border border-slate-700/60';
        default:
            return 'bg-slate-800 text-slate-400 border border-slate-700/60';
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
        <WargaLayout profile={profile} title="Pengaduan" searchQuery={searchTerm} onSearchChange={handleSearch}>
            <Head title="Pengaduan & Aspirasi Warga" />

            <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 lg:px-8 lg:py-8">
                {/* Header Back & Titles */}
                <div className="flex items-center gap-3">
                    <Link href="/warga/dashboard" className="rounded-xl bg-[#131b2e] border border-slate-800 p-2 text-slate-400 hover:text-slate-200 transition">
                        <ArrowLeft size={16} />
                    </Link>
                    <div>
                        <h1 className="text-xl font-black text-slate-100 tracking-tight">Pengaduan Warga</h1>
                        <p className="text-xs text-slate-500 mt-0.5">Laporkan masalah lingkungan dan layanan RT secara langsung dan aman.</p>
                    </div>
                </div>

                {/* Mobile Search input */}
                <div className="lg:hidden relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => handleSearch(e.target.value)}
                        placeholder="Cari pengaduan..."
                        className="w-full rounded-2xl border border-slate-800 bg-[#131b2e] py-3 pl-10 pr-4 text-xs text-slate-200 placeholder-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    />
                </div>

                {/* main content split grid layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Left Column: Form + stats */}
                    <div className="lg:col-span-5 space-y-6">
                        {/* Form Card */}
                        <div className="rounded-3xl border border-slate-800 bg-[#0b1220] p-5 shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl"></div>
                            
                            <h2 className="text-sm font-black text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Plus size={16} className="text-emerald-400" />
                                <span>Buat Pengaduan Baru</span>
                            </h2>

                            {!canSubmit ? (
                                <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-xs text-slate-400 leading-relaxed">
                                    Akun Anda belum terhubung dengan data warga. Hubungi pengurus RT untuk sinkronisasi profil agar dapat membuat aduan.
                                </div>
                            ) : (
                                <form onSubmit={submitPengaduan} className="space-y-4">
                                    {/* Judul */}
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 block mb-2">Judul Laporan</label>
                                        <input
                                            type="text"
                                            required
                                            value={form.judul}
                                            onChange={(e) => setForm(prev => ({ ...prev, judul: e.target.value }))}
                                            placeholder="Contoh: Lampu jalan Blok A mati..."
                                            className="w-full rounded-xl border border-slate-800 bg-[#131b2e] px-4 py-3 text-xs text-slate-200 focus:border-emerald-500 focus:ring-emerald-500 placeholder-slate-600"
                                        />
                                    </div>

                                    {/* Category & Sifat row */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-bold text-slate-400 block mb-2">Kategori</label>
                                            <select
                                                value={form.kategori}
                                                onChange={(e) => setForm(prev => ({ ...prev, kategori: e.target.value }))}
                                                className="w-full rounded-xl border border-slate-800 bg-[#131b2e] px-3 py-3 text-xs text-slate-200 focus:border-emerald-500 focus:ring-emerald-500 capitalize"
                                            >
                                                {categories.map(cat => (
                                                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-400 block mb-2">Sifat Aduan</label>
                                            <select
                                                value={form.is_private}
                                                onChange={(e) => setForm(prev => ({ ...prev, is_private: e.target.value }))}
                                                className="w-full rounded-xl border border-slate-800 bg-[#131b2e] px-3 py-3 text-xs text-slate-200 focus:border-emerald-500 focus:ring-emerald-500"
                                            >
                                                <option value="1">Rahasia / Privat</option>
                                                <option value="0">Publik / Umum</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Lokasi */}
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 block mb-2">Lokasi Kejadian</label>
                                        <input
                                            type="text"
                                            value={form.lokasi}
                                            onChange={(e) => setForm(prev => ({ ...prev, lokasi: e.target.value }))}
                                            placeholder="Contoh: Dekat Pos Satpam Blok C"
                                            className="w-full rounded-xl border border-slate-800 bg-[#131b2e] px-4 py-3 text-xs text-slate-200 focus:border-emerald-500 focus:ring-emerald-500 placeholder-slate-600"
                                        />
                                    </div>

                                    {/* Deskripsi */}
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 block mb-2">Deskripsi Detail</label>
                                        <textarea
                                            required
                                            value={form.deskripsi}
                                            onChange={(e) => setForm(prev => ({ ...prev, deskripsi: e.target.value }))}
                                            rows={3}
                                            placeholder="Jelaskan detail masalah yang terjadi..."
                                            className="w-full rounded-xl border border-slate-800 bg-[#131b2e] px-4 py-3 text-xs text-slate-200 placeholder-slate-650 focus:border-emerald-500 focus:ring-emerald-500"
                                        />
                                    </div>

                                    {/* Upload Bukti */}
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 block mb-2">Lampiran Bukti Foto</label>
                                        <div className="relative">
                                            {form.lampiran.length === 0 ? (
                                                <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-800 hover:border-emerald-500/50 rounded-2xl p-5 bg-[#131b2e]/50 cursor-pointer transition group">
                                                    <UploadCloud size={24} className="text-slate-500 group-hover:text-emerald-400 transition mb-1.5" />
                                                    <span className="text-[11px] font-semibold text-slate-300">Pilih Foto Bukti Kejadian</span>
                                                    <span className="text-[9px] text-slate-500 mt-0.5">PNG, JPG, WEBP, atau PDF (Maks. 5MB)</span>
                                                    <input
                                                        type="file"
                                                        multiple
                                                        accept="image/*,.pdf"
                                                        onChange={(e) => setForm(prev => ({ ...prev, lampiran: Array.from(e.target.files ?? []) }))}
                                                        className="hidden"
                                                    />
                                                </label>
                                            ) : (
                                                <div className="flex items-center justify-between border border-emerald-500/30 rounded-2xl p-3 bg-emerald-500/5">
                                                    <div className="flex items-center gap-2.5 overflow-hidden">
                                                        <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0">
                                                            <FileText size={16} />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-xs font-bold text-slate-200 truncate">
                                                                {form.lampiran.map(f => f.name).join(', ')}
                                                            </p>
                                                            <p className="text-[10px] text-slate-500">
                                                                {form.lampiran.length} berkas dipilih
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => setForm(prev => ({ ...prev, lampiran: [] }))}
                                                        className="p-1 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition shrink-0"
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <button 
                                        type="submit" 
                                        disabled={processing}
                                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 px-5 py-3 text-xs font-black transition disabled:opacity-50 shadow-lg"
                                    >
                                        <span>Kirim Laporan Pengaduan</span>
                                    </button>
                                </form>
                            )}
                        </div>

                        {/* stats cards widget */}
                        <div className="grid grid-cols-2 gap-4">
                            {/* Card 1: Total */}
                            <div className="rounded-2xl border border-slate-800 bg-[#0b1220] p-4 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-full blur-2xl"></div>
                                <div className="mb-2.5 flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                    <MessageSquare size={15} />
                                </div>
                                <h3 className="text-2xl font-black text-slate-100">{summary.total || 0}</h3>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Total Laporan</p>
                            </div>

                            {/* Card 2: Belum Selesai */}
                            <div className="rounded-2xl border border-slate-800 bg-[#0b1220] p-4 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/5 rounded-full blur-2xl"></div>
                                <div className="mb-2.5 flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                    <Clock size={15} />
                                </div>
                                <h3 className="text-2xl font-black text-slate-100">
                                    {(summary.diajukan || 0) + (summary.diproses || 0)}
                                </h3>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Belum Selesai</p>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Complaints History List */}
                    <div className="lg:col-span-7 space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 mb-2">
                            <h2 className="text-sm font-black text-slate-300 uppercase tracking-wider">Riwayat Pengaduan Anda</h2>
                            {/* Pills */}
                            <div className="flex items-center gap-1.5 bg-[#0b1220] border border-slate-850 p-1 rounded-xl">
                                <button
                                    onClick={() => handleFilterSelect('all')}
                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black tracking-wide uppercase transition ${
                                        statusFilter === 'all' 
                                            ? 'bg-emerald-400 text-slate-950' 
                                            : 'text-slate-450 hover:text-slate-200'
                                    }`}
                                >
                                    Semua
                                </button>
                                <button
                                    onClick={() => handleFilterSelect('active')}
                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black tracking-wide uppercase transition ${
                                        statusFilter === 'active' 
                                            ? 'bg-emerald-400 text-slate-950' 
                                            : 'text-slate-450 hover:text-slate-200'
                                    }`}
                                >
                                    Aktif
                                </button>
                                <button
                                    onClick={() => handleFilterSelect('selesai')}
                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black tracking-wide uppercase transition ${
                                        statusFilter === 'selesai' 
                                            ? 'bg-emerald-400 text-slate-950' 
                                            : 'text-slate-450 hover:text-slate-200'
                                    }`}
                                >
                                    Selesai
                                </button>
                            </div>
                        </div>

                        {/* List Cards loop */}
                        {filtered.length === 0 ? (
                            <div className="rounded-3xl border border-dashed border-slate-850 bg-[#0b1220] p-10 text-center text-xs text-slate-500">
                                <AlertTriangle size={30} className="mx-auto text-slate-600 mb-2" />
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
                                            className="flex flex-col sm:flex-row gap-4 p-4 rounded-3xl border border-slate-800 bg-[#0b1220] hover:border-slate-700/80 transition-all duration-300 relative group"
                                        >
                                            {/* Thumbnail Left */}
                                            <div className="h-24 w-full sm:w-24 md:h-28 md:w-28 rounded-2xl overflow-hidden shrink-0 border border-slate-800 bg-[#131b2e] flex items-center justify-center relative">
                                                {image ? (
                                                    <img src={image} alt={complaint.judul} className="h-full w-full object-cover" />
                                                ) : (
                                                    <ImageIcon size={22} className="text-slate-600" />
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

                                                    <h3 className="text-xs font-black text-slate-200 mt-2 leading-tight tracking-tight group-hover:text-emerald-400 transition-colors">
                                                        {complaint.judul}
                                                    </h3>
                                                    
                                                    <p className="text-[11px] text-slate-450 leading-relaxed font-medium line-clamp-2 mt-1.5">
                                                        {complaint.deskripsi}
                                                    </p>
                                                </div>

                                                <div className="flex items-center justify-between pt-2 border-t border-slate-850/60 mt-1">
                                                    {/* note/footer info */}
                                                    <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                                                        {complaint.status === 'selesai' && (
                                                            <>
                                                                <CheckCircle size={11} className="text-emerald-400" />
                                                                <span className="text-emerald-500/80">Laporan diselesaikan oleh pengurus</span>
                                                            </>
                                                        )}
                                                        {complaint.status === 'diproses' && (
                                                            <>
                                                                <Clock size={11} className="text-amber-400" />
                                                                <span className="text-amber-500/80">Sedang ditindaklanjuti</span>
                                                            </>
                                                        )}
                                                        {isPending && (
                                                            <>
                                                                <Clock size={11} className="text-slate-500" />
                                                                <span>Menunggu verifikasi admin</span>
                                                            </>
                                                        )}
                                                        {complaint.status === 'ditolak' && (
                                                            <>
                                                                <XCircle size={11} className="text-red-400" />
                                                                <span className="text-red-500/80">Aduan ditolak oleh admin</span>
                                                            </>
                                                        )}
                                                    </span>

                                                    {/* action link */}
                                                    <div>
                                                        {isPending ? (
                                                            <button
                                                                type="button"
                                                                onClick={() => cancelPengaduan(complaint.id)}
                                                                className="inline-flex items-center gap-1 text-[10px] font-black text-red-400 hover:text-red-350 transition"
                                                            >
                                                                <XCircle size={11} />
                                                                <span>Batalkan Laporan</span>
                                                            </button>
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                onClick={() => setSelectedComplaint(complaint)}
                                                                className="inline-flex items-center gap-1.5 text-[10px] font-black text-emerald-400 hover:text-emerald-350 transition"
                                                            >
                                                                <span>Detail Laporan</span>
                                                                <Plus size={11} className="stroke-[2.5]" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Pagination Row */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-1.5 pt-4">
                                <button
                                    type="button"
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    className="rounded-xl border border-slate-800 bg-[#0b1220] p-1.5 text-slate-400 hover:text-slate-200 disabled:opacity-30 transition"
                                >
                                    <ChevronLeft size={13} />
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                    <button
                                        key={page}
                                        type="button"
                                        onClick={() => setCurrentPage(page)}
                                        className={`h-7 w-7 rounded-lg text-[10px] font-black transition ${
                                            currentPage === page 
                                                ? 'bg-emerald-400 text-slate-950' 
                                                : 'border border-slate-800 bg-[#0b1220] text-slate-400 hover:text-slate-200'
                                        }`}
                                    >
                                        {page}
                                    </button>
                                ))}
                                <button
                                    type="button"
                                    disabled={currentPage === totalPages}
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    className="rounded-xl border border-slate-800 bg-[#0b1220] p-1.5 text-slate-400 hover:text-slate-200 disabled:opacity-30 transition"
                                >
                                    <ChevronRight size={13} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal: View Complaint Detail */}
            {selectedComplaint && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl bg-[#0b1220] border border-slate-800 shadow-2xl overflow-hidden">
                        {/* Modal Header */}
                        <div className="flex items-start justify-between gap-4 border-b border-slate-800/80 p-5 bg-[#131b2e]/30">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className={`rounded px-1.5 py-0.5 text-[8px] font-black uppercase ${statusBadgeClass(selectedComplaint.status)}`}>
                                        {selectedComplaint.statusLabel || selectedComplaint.status}
                                    </span>
                                    <span className={`rounded px-1.5 py-0.5 text-[8px] font-black uppercase ${priorityBadgeClass(selectedComplaint.prioritas)}`}>
                                        {selectedComplaint.prioritasLabel || selectedComplaint.prioritas}
                                    </span>
                                </div>
                                <h3 className="text-base font-black text-slate-100 leading-snug tracking-tight mt-2">{selectedComplaint.judul}</h3>
                                <p className="mt-1 text-[10px] text-slate-500 font-bold font-mono">No. {selectedComplaint.nomorPengaduan || '-'}</p>
                            </div>
                            <button type="button" onClick={() => setSelectedComplaint(null)} className="rounded-xl p-1.5 text-slate-400 hover:bg-[#131b2e] hover:text-slate-200 transition">
                                <X size={18} />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-5 overflow-y-auto space-y-4 flex-1 scrollbar-thin scrollbar-thumb-slate-800">
                            <div className="rounded-2xl bg-[#131b2e]/30 border border-slate-850 p-4 space-y-3">
                                <div>
                                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Deskripsi Masalah</p>
                                    <p className="text-xs text-slate-300 leading-relaxed font-medium whitespace-pre-line">{selectedComplaint.deskripsi || '-'}</p>
                                </div>
                                {selectedComplaint.lokasi && (
                                    <div className="pt-2 border-t border-slate-850/40 flex items-center gap-1.5 text-[11px] text-slate-450 font-bold">
                                        <MapPin size={12} className="text-emerald-400" />
                                        <span>Lokasi: {selectedComplaint.lokasi}</span>
                                    </div>
                                )}
                            </div>

                            {selectedComplaint.catatanAdmin && (
                                <div className="rounded-2xl bg-amber-500/5 border border-amber-500/20 p-4">
                                    <p className="text-[9px] font-bold text-amber-400 uppercase tracking-wider mb-1">Tanggapan/Catatan Admin RT</p>
                                    <p className="text-xs text-slate-350 leading-relaxed font-medium">{selectedComplaint.catatanAdmin}</p>
                                </div>
                            )}

                            {/* Date timeline cards */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="bg-[#131b2e]/20 border border-slate-850 rounded-2xl p-3 text-center">
                                    <p className="text-[8px] uppercase font-bold text-slate-500 tracking-wider">Diajukan</p>
                                    <p className="text-[10px] font-black text-slate-300 mt-1">{formatDate(selectedComplaint.tanggalPengaduan)}</p>
                                </div>
                                <div className="bg-[#131b2e]/20 border border-slate-850 rounded-2xl p-3 text-center">
                                    <p className="text-[8px] uppercase font-bold text-slate-500 tracking-wider">Diproses</p>
                                    <p className="text-[10px] font-black text-slate-300 mt-1">{selectedComplaint.tanggalDiproses ? formatDate(selectedComplaint.tanggalDiproses) : '-'}</p>
                                </div>
                                <div className="bg-[#131b2e]/20 border border-slate-850 rounded-2xl p-3 text-center">
                                    <p className="text-[8px] uppercase font-bold text-slate-500 tracking-wider">Selesai</p>
                                    <p className="text-[10px] font-black text-slate-300 mt-1">{selectedComplaint.tanggalSelesai ? formatDate(selectedComplaint.tanggalSelesai) : '-'}</p>
                                </div>
                            </div>

                            {/* Files */}
                            {(selectedComplaint.files?.length ?? 0) > 0 && (
                                <div className="space-y-2.5">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Dokumen & Foto Bukti</h4>
                                    <div className="space-y-2">
                                        {selectedComplaint.files?.map((file) => (
                                            <div key={file.id} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-850 bg-[#131b2e]/20 p-3">
                                                <div className="min-w-0">
                                                    <p className="text-xs font-bold text-slate-200 truncate">{file.originalName || 'Lampiran'}</p>
                                                    <p className="text-[10px] text-slate-500 font-semibold">{file.isAdminFile ? 'Dari Pengurus' : 'Berkas Warga'} · {formatFileSize(file.size)}</p>
                                                </div>
                                                {(file.previewUrl || file.url) && (
                                                    <a 
                                                        href={file.previewUrl || file.url} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer" 
                                                        className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#131b2e] border border-slate-800 hover:bg-[#1a243d] hover:text-slate-150 px-3.5 py-2 text-xs font-bold text-slate-300 transition"
                                                    >
                                                        <Eye size={13} className="text-emerald-400" />
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
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Log Riwayat Tanggapan</h4>
                                    <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin">
                                        {selectedComplaint.tanggapans?.map((item) => (
                                            <div key={item.id} className="rounded-xl border border-slate-850 bg-[#131b2e]/10 p-3 relative">
                                                <div className="flex items-center justify-between gap-2 text-[10px] text-slate-500 mb-1">
                                                    <span className="font-bold text-slate-300">{item.userName || (item.isAdmin ? 'Admin RT' : 'Warga')}</span>
                                                    <span className="font-mono">{formatDateTime(item.createdAt)}</span>
                                                </div>
                                                {item.statusToLabel && (
                                                    <p className="text-[9px] font-extrabold text-emerald-400 uppercase tracking-wider mb-1">
                                                        Status Laporan: {item.statusToLabel}
                                                    </p>
                                                )}
                                                <p className="text-xs text-slate-400 leading-relaxed font-medium">{item.pesan}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="border-t border-slate-800/80 p-5 bg-[#131b2e]/10 flex justify-end">
                            <button 
                                type="button" 
                                onClick={() => setSelectedComplaint(null)}
                                className="rounded-xl bg-[#131b2e] hover:bg-[#1a243d] border border-slate-800 px-4 py-2.5 text-xs font-bold text-slate-300 transition"
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
                className="fixed bottom-6 right-6 lg:bottom-8 lg:right-8 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[#131b2e] border border-emerald-500/25 hover:border-emerald-500/50 text-emerald-400 shadow-xl active:scale-95 transition"
                title="Hubungi Pengurus RT"
            >
                <MessageCircle size={22} />
            </a>
        </WargaLayout>
    );
}