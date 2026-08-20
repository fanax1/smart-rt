import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router } from '@inertiajs/react';
import {
    AlertCircle,
    AlertOctagon,
    CheckCircle,
    Clock,
    Download,
    Eye,
    Filter,
    MessageSquare,
    Search,
    Shield,
    TrendingUp,
    User,
    X,
    XCircle,
    Zap,
} from 'lucide-react';
import { FormEvent, ReactNode, useEffect, useState } from 'react';

type ComplaintFile = {
    id: number;
    label?: string | null;
    originalName: string;
    url: string;
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
    isAdmin: boolean;
    userName?: string | null;
    createdAt?: string | null;
};

type Complaint = {
    id: number;
    nomorPengaduan: string;
    judul: string;
    kategori: string;
    kategoriLabel: string;
    prioritas: string;
    prioritasLabel: string;
    isPrivate?: boolean;
    isArchived?: boolean;
    wargaAvatar?: string | null;
    lokasi?: string | null;
    deskripsi: string;
    status: 'diajukan' | 'diproses' | 'selesai' | 'ditolak';
    statusLabel: string;
    catatanAdmin?: string | null;
    tanggalPengaduan?: string | null;
    tanggalDiproses?: string | null;
    tanggalSelesai?: string | null;
    isConfirmed?: boolean;
    wargaName: string;
    houseNumber: string;
    kkNumber?: string | null;
    phone?: string | null;
    files?: ComplaintFile[];
    tanggapans?: ComplaintResponse[];
};

type Option = { value: string; label: string };

type Props = {
    complaints?: Complaint[];
    filters?: { search?: string; status?: string; kategori?: string; prioritas?: string; archived?: string };
    summary?: { total: number; diajukan: number; diproses: number; selesai: number; ditolak: number };
    statusOptions?: Option[];
    categoryOptions?: Option[];
    priorityOptions?: Option[];
};

type StatusForm = { status: string; catatan_admin: string; lampiran_admin: File[] };

const defaultSummary = { total: 0, diajukan: 0, diproses: 0, selesai: 0, ditolak: 0 };
const defaultStatusForm: StatusForm = { status: 'diproses', catatan_admin: '', lampiran_admin: [] };

function getStatusConfig(status: string) {
    switch (status) {
        case 'diajukan': return { cls: 'bg-blue-500/20 text-blue-300 border border-blue-500/30', dot: 'bg-blue-400', icon: Clock };
        case 'diproses': return { cls: 'bg-orange-500/20 text-orange-300 border border-orange-500/30', dot: 'bg-orange-400', icon: AlertCircle };
        case 'selesai': return { cls: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30', dot: 'bg-emerald-400', icon: CheckCircle };
        case 'ditolak': return { cls: 'bg-red-500/20 text-red-300 border border-red-500/30', dot: 'bg-red-400', icon: XCircle };
        default: return { cls: 'bg-slate-500/20 text-slate-300 border border-slate-500/30', dot: 'bg-slate-400', icon: Clock };
    }
}

function getPriorityConfig(priority: string) {
    switch (priority) {
        case 'darurat': return { cls: 'bg-red-500/25 text-red-300 border border-red-500/40', icon: AlertOctagon };
        case 'tinggi': return { cls: 'bg-orange-500/20 text-orange-300 border border-orange-500/30', icon: AlertCircle };
        case 'sedang': return { cls: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30', icon: Zap };
        case 'rendah': return { cls: 'bg-slate-500/20 text-slate-400 border border-slate-500/30', icon: Shield };
        default: return { cls: 'bg-slate-500/20 text-slate-400 border border-slate-500/30', icon: Shield };
    }
}

function formatDate(value?: string | null) {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDateTime(value?: string | null) {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatFileSize(size?: number) {
    if (!size) return '-';
    if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function getInitials(name: string) {
    return name.split(' ').filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase() || 'WG';
}

const inputCls = 'w-full rounded-xl border border-[#1C2541]/60 bg-[#0B132B]/80 px-3 py-2.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition text-sm';
const labelCls = 'mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400';

export default function Complaints({
    complaints = [],
    filters,
    summary = defaultSummary,
    statusOptions = [],
    categoryOptions = [],
    priorityOptions = [],
}: Props) {
    const [searchTerm, setSearchTerm] = useState(filters?.search ?? '');
    const [statusFilter, setStatusFilter] = useState(filters?.status ?? 'all');
    const [categoryFilter, setCategoryFilter] = useState(filters?.kategori ?? 'all');
    const [priorityFilter, setPriorityFilter] = useState(filters?.prioritas ?? 'all');
    const [archivedFilter, setArchivedFilter] = useState(filters?.archived ?? '0');
    const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
    const [statusComplaint, setStatusComplaint] = useState<Complaint | null>(null);
    const [statusForm, setStatusForm] = useState<StatusForm>(defaultStatusForm);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        const timeout = window.setTimeout(() => {
            router.get('/admin/complaints', { search: searchTerm, status: statusFilter, kategori: categoryFilter, prioritas: priorityFilter, archived: archivedFilter }, { preserveState: true, preserveScroll: true, replace: true });
        }, 350);
        return () => window.clearTimeout(timeout);
    }, [searchTerm, statusFilter, categoryFilter, priorityFilter, archivedFilter]);

    const openStatusForm = (complaint: Complaint) => {
        setStatusComplaint(complaint);
        setStatusForm({ status: complaint.status === 'diajukan' ? 'diproses' : complaint.status, catatan_admin: complaint.catatanAdmin ?? '', lampiran_admin: [] });
    };

    const submitStatus = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!statusComplaint) return;
        const payload = new FormData();
        payload.append('_method', 'PATCH');
        payload.append('status', statusForm.status);
        payload.append('catatan_admin', statusForm.catatan_admin);
        statusForm.lampiran_admin.forEach(file => payload.append('lampiran_admin[]', file));
        setProcessing(true);
        router.post(`/admin/complaints/${statusComplaint.id}/status`, payload, {
            forceFormData: true, preserveScroll: true,
            onSuccess: () => { setStatusComplaint(null); setSelectedComplaint(null); },
            onFinish: () => setProcessing(false),
        });
    };

    const deleteFile = (file: ComplaintFile) => {
        if (!window.confirm('Hapus lampiran ini?')) return;
        router.delete(`/admin/complaints/files/${file.id}`, { preserveScroll: true });
    };

    const deleteComplaint = (complaintId: number) => {
        if (!window.confirm('Yakin ingin menghapus pengaduan ini beserta tanggapannya secara permanen?')) return;
        router.delete(`/admin/complaints/${complaintId}`, {
            preserveScroll: true,
            onSuccess: () => {
                setSelectedComplaint(null);
            }
        });
    };

    const toggleArchiveComplaint = (complaint: Complaint) => {
        const actionText = complaint.isArchived ? 'mengembalikan' : 'mengarsipkan';
        if (!window.confirm(`Yakin ingin ${actionText} pengaduan ini?`)) return;
        router.patch(`/admin/complaints/${complaint.id}/archive`, {}, {
            preserveScroll: true,
            onSuccess: () => {
                setSelectedComplaint(null);
            }
        });
    };

    const toggleConfirmComplaint = (complaint: Complaint) => {
        const actionText = complaint.isConfirmed ? 'membatalkan konfirmasi publikasi' : 'mengonfirmasi publikasi';
        if (!window.confirm(`Yakin ingin ${actionText} pengaduan ini ke homepage?`)) return;
        router.patch(`/admin/complaints/${complaint.id}/toggle-confirm`, {}, {
            preserveScroll: true,
            onSuccess: () => {
                setSelectedComplaint(null);
            }
        });
    };

    /* Category color map */
    const catColors: Record<string, string> = {
        'infrastruktur': 'text-blue-700 bg-blue-50 border-blue-200',
        'kebersihan': 'text-emerald-700 bg-emerald-50 border-emerald-200',
        'keamanan': 'text-red-700 bg-red-50 border-red-200',
        'kebisingan': 'text-amber-700 bg-amber-50 border-amber-200',
        'penerangan': 'text-amber-700 bg-amber-50 border-amber-200',
        'administrasi': 'text-purple-700 bg-purple-50 border-purple-200',
        'lainnya': 'text-slate-700 bg-slate-100 border-slate-200',
    };
    const catCls = (cat: string) => catColors[cat] || 'text-slate-700 bg-slate-100 border-slate-200';

    return (
        <AdminLayout activeMenu="complaints">
            <Head title="Pusat Laporan Warga" />

            {/* ── Page Header ── */}
            <div className="mb-6 flex items-start justify-between">
                <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-emerald-700 mb-1">Layanan Warga</p>
                    <h2 className="text-2xl font-black text-slate-900">Pusat Laporan Warga</h2>
                    <p className="text-slate-600 text-sm mt-1">Pantau, proses, dan selesaikan pengaduan warga RT secara real-time.</p>
                </div>
            </div>

            {/* ── Stats Header Bar ── */}
            <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 col-span-2 lg:col-span-1 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-blue-50 border border-blue-200 p-3">
                            <MessageSquare size={22} className="text-blue-700" />
                        </div>
                        <div>
                            <p className="text-3xl font-black text-slate-900">{summary.total}</p>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Pengaduan</p>
                        </div>
                    </div>
                </div>
                {[
                    { label: 'Menunggu', value: summary.diajukan, color: 'text-blue-700', icon: Clock },
                    { label: 'Diproses', value: summary.diproses, color: 'text-amber-700', icon: AlertCircle },
                    { label: 'Selesai', value: summary.selesai, color: 'text-emerald-700', icon: CheckCircle },
                ].map(({ label, value, color, icon: Icon }) => (
                    <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
                            <Icon size={14} className={color} />
                        </div>
                        <p className={`text-2xl font-black ${color}`}>{value}</p>
                        <div className="mt-2 h-1 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-600 rounded-full transition-all" style={{ width: `${summary.total ? (value / summary.total) * 100 : 0}%` }} />
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Main Content: Feed + Sidebar ── */}
            <div className="flex flex-col gap-6 lg:flex-row">
                {/* Feed Panel */}
                <div className="flex-1 min-w-0">
                    {/* Filters */}
                    <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="flex flex-col gap-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                                <input
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    placeholder="Cari nomor, warga, rumah, judul, lokasi..."
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-4 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-emerald-500 transition"
                                />
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {/* Archived Toggle */}
                                <button
                                    onClick={() => setArchivedFilter('0')}
                                    className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${archivedFilter === '0'
                                        ? 'bg-emerald-600 text-white shadow-sm'
                                        : 'border border-slate-200 text-slate-700 bg-white hover:bg-slate-100'
                                    }`}
                                >
                                    Aduan Aktif
                                </button>
                                <button
                                    onClick={() => setArchivedFilter('1')}
                                    className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${archivedFilter === '1'
                                        ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                        : 'border border-slate-200 text-slate-700 bg-white hover:bg-slate-100'
                                    }`}
                                >
                                    Arsip
                                </button>
                                <div className="h-4 w-px bg-slate-200 mx-1 self-center" />

                                {/* Status Tabs */}
                                {[{ value: 'all', label: 'Semua Status' }, ...statusOptions].map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => setStatusFilter(opt.value)}
                                        className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${statusFilter === opt.value
                                            ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                                            : 'border border-slate-200 text-slate-700 bg-white hover:bg-slate-100'
                                        }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                                <div className="h-4 w-px bg-slate-200 mx-1 self-center" />
                                {/* Priority Tabs */}
                                {[{ value: 'all', label: 'Semua Prioritas' }, ...priorityOptions].map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => setPriorityFilter(opt.value)}
                                        className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${priorityFilter === opt.value
                                            ? 'bg-amber-50 border border-amber-200 text-amber-700'
                                            : 'border border-slate-200 text-slate-700 bg-white hover:bg-slate-100'
                                        }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Complaint Cards Feed */}
                    <div className="space-y-4">
                        {complaints.length === 0 ? (
                            <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center shadow-sm">
                                <MessageSquare size={40} className="text-slate-400 mx-auto mb-3" />
                                <p className="text-slate-500 text-sm font-medium">Belum ada pengaduan yang sesuai filter.</p>
                            </div>
                        ) : (
                            complaints.map(complaint => {
                                const statusConf = getStatusConfig(complaint.status);
                                const priorityConf = getPriorityConfig(complaint.prioritas);
                                const PriorityIcon = priorityConf.icon;
                                const StatusIcon = statusConf.icon;
                                const initials = getInitials(complaint.wargaName);
                                const responseCount = complaint.tanggapans?.length || 0;

                                return (
                                    <div key={complaint.id} className="group rounded-2xl border border-slate-200 bg-white p-5 hover:border-emerald-300 transition shadow-sm">
                                        <div className="flex gap-4">
                                            {/* Avatar */}
                                            <div className="shrink-0">
                                                {complaint.wargaAvatar ? (
                                                    <img
                                                        src={complaint.wargaAvatar}
                                                        alt={complaint.wargaName}
                                                        className="h-10 w-10 rounded-xl object-cover border border-slate-200"
                                                    />
                                                ) : (
                                                    <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-sm font-black text-emerald-700">
                                                        {initials}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                {/* Header */}
                                                <div className="flex items-start justify-between gap-3 mb-2">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap mb-1">
                                                            <span className="text-xs font-bold text-slate-900">{complaint.wargaName}</span>
                                                            <span className="text-[10px] text-slate-500 font-medium">Rumah {complaint.houseNumber}</span>
                                                            <span className="font-mono text-[10px] text-slate-400 font-bold">{complaint.nomorPengaduan}</span>
                                                            {complaint.isPrivate ? (
                                                                <span className="rounded bg-purple-50 text-purple-700 px-1.5 py-0.5 text-[9px] font-bold border border-purple-200">
                                                                    Privasi
                                                                </span>
                                                            ) : (
                                                                <div className="flex items-center gap-1">
                                                                    <span className="rounded bg-blue-50 text-blue-700 px-1.5 py-0.5 text-[9px] font-bold border border-blue-200">
                                                                        Publik
                                                                    </span>
                                                                    {complaint.isConfirmed ? (
                                                                        <span className="rounded bg-emerald-50 text-emerald-700 px-1.5 py-0.5 text-[9px] font-bold border border-emerald-200">
                                                                            Terpublikasi
                                                                        </span>
                                                                    ) : (
                                                                        <span className="rounded bg-amber-50 text-amber-700 px-1.5 py-0.5 text-[9px] font-bold border border-amber-200">
                                                                            Butuh Konfirmasi
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition truncate">{complaint.judul}</h3>
                                                    </div>
                                                    <span className={`shrink-0 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-bold ${statusConf.cls}`}>
                                                        <StatusIcon size={10} />{complaint.statusLabel}
                                                    </span>
                                                </div>

                                                {/* Description snippet */}
                                                <p className="text-xs text-slate-600 leading-relaxed line-clamp-2 mb-3">{complaint.deskripsi}</p>

                                                {/* Tags & Meta */}
                                                <div className="flex items-center justify-between gap-3 flex-wrap">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        {/* Priority */}
                                                        <span className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[10px] font-bold ${priorityConf.cls}`}>
                                                            <PriorityIcon size={10} />{complaint.prioritasLabel}
                                                        </span>
                                                        {/* Category */}
                                                        <span className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[10px] font-bold ${catCls(complaint.kategori)}`}>
                                                            {complaint.kategoriLabel}
                                                        </span>
                                                        {/* Location */}
                                                        {complaint.lokasi && (
                                                            <span className="text-[10px] text-slate-500 font-medium">📍 {complaint.lokasi}</span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-[10px] text-slate-500 font-medium">{formatDate(complaint.tanggalPengaduan)}</span>
                                                        {responseCount > 0 && (
                                                            <span className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
                                                                <MessageSquare size={10} /> {responseCount} balasan
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Actions */}
                                                <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-slate-100">
                                                    <button
                                                        onClick={() => setSelectedComplaint(complaint)}
                                                        className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition shadow-sm"
                                                    >
                                                        <Eye size={13} /> Lihat Detail
                                                    </button>
                                                    {!complaint.isPrivate && (
                                                        <button
                                                            onClick={() => toggleConfirmComplaint(complaint)}
                                                            className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition shadow-sm ${
                                                                complaint.isConfirmed
                                                                    ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
                                                                    : 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
                                                            }`}
                                                        >
                                                            <CheckCircle size={13} />
                                                            {complaint.isConfirmed ? 'Batal Publikasikan' : 'Konfirmasi Publikasi'}
                                                        </button>
                                                    )}
                                                    {complaint.status !== 'selesai' && complaint.status !== 'ditolak' && (
                                                        <button
                                                            onClick={() => openStatusForm(complaint)}
                                                            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-sm"
                                                        >
                                                            <CheckCircle size={13} />
                                                            {complaint.status === 'diajukan' ? 'Proses' : 'Update'}
                                                        </button>
                                                    )}
                                                    {complaint.status === 'selesai' && (
                                                        <span className="flex items-center gap-1 text-[10px] text-emerald-700 font-bold">
                                                            <CheckCircle size={12} /> Selesai
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Sidebar Stats */}
                <div className="w-full lg:w-72 shrink-0 space-y-4">
                    {/* Response Stats */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-900 mb-4">Distribusi Status</h3>
                        <div className="space-y-3">
                            {[
                                { label: 'Diajukan', value: summary.diajukan, color: 'bg-blue-600', textColor: 'text-blue-700' },
                                { label: 'Diproses', value: summary.diproses, color: 'bg-amber-500', textColor: 'text-amber-700' },
                                { label: 'Selesai', value: summary.selesai, color: 'bg-emerald-600', textColor: 'text-emerald-700' },
                                { label: 'Ditolak', value: summary.ditolak, color: 'bg-red-600', textColor: 'text-red-700' },
                            ].map(({ label, value, color, textColor }) => (
                                <div key={label}>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs text-slate-600 font-medium">{label}</span>
                                        <span className={`text-xs font-bold ${textColor}`}>{value}</span>
                                    </div>
                                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${color} rounded-full transition-all duration-700`}
                                            style={{ width: `${summary.total ? (value / summary.total) * 100 : 0}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Category Breakdown */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-900 mb-4">Kategori</h3>
                        <div className="space-y-2">
                            {categoryOptions.map(opt => {
                                const count = complaints.filter(c => c.kategori === opt.value).length;
                                return (
                                    <button
                                        key={opt.value}
                                        onClick={() => setCategoryFilter(categoryFilter === opt.value ? 'all' : opt.value)}
                                        className={`w-full flex items-center justify-between rounded-xl px-3 py-2 transition ${categoryFilter === opt.value
                                            ? 'bg-emerald-50 border border-emerald-200'
                                            : 'hover:bg-slate-50'
                                        }`}
                                    >
                                        <span className={`text-xs font-bold ${categoryFilter === opt.value ? 'text-emerald-700' : 'text-slate-600'}`}>{opt.label}</span>
                                        <span className={`text-xs font-black rounded-lg px-2 py-0.5 ${count > 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'text-slate-400'}`}>{count}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Resolution Rate */}
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                        <div className="flex items-center gap-2 mb-3">
                            <TrendingUp size={16} className="text-emerald-700" />
                            <h3 className="text-sm font-bold text-slate-900">Tingkat Penyelesaian</h3>
                        </div>
                        <div className="text-center">
                            <p className="text-4xl font-black text-emerald-700">
                                {summary.total ? Math.round((summary.selesai / summary.total) * 100) : 0}%
                            </p>
                            <p className="text-xs text-slate-600 mt-1 font-medium">{summary.selesai} dari {summary.total} selesai</p>
                        </div>
                        <div className="mt-3 h-2 bg-emerald-200/60 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-emerald-600 rounded-full transition-all duration-700"
                                style={{ width: `${summary.total ? (summary.selesai / summary.total) * 100 : 0}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Detail Modal ── */}
            {selectedComplaint && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">
                        <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4 z-10">
                            <div>
                                <h3 className="text-lg font-black text-slate-900">Detail Pengaduan</h3>
                                <p className="text-xs text-slate-500 font-mono font-bold">{selectedComplaint.nomorPengaduan}</p>
                            </div>
                            <button onClick={() => setSelectedComplaint(null)} className="rounded-xl p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-200 transition"><X size={20} /></button>
                        </div>
                        <div className="space-y-5 p-6">
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">{selectedComplaint.judul}</h3>
                                    </div>
                                    <span className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold ${getStatusConfig(selectedComplaint.status).cls}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${getStatusConfig(selectedComplaint.status).dot}`} />{selectedComplaint.statusLabel}
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    {[
                                        ['Nama Warga', selectedComplaint.wargaName],
                                        ['No. Rumah', selectedComplaint.houseNumber],
                                        ['Kategori', selectedComplaint.kategoriLabel],
                                        ['Prioritas', selectedComplaint.prioritasLabel],
                                        ['Sifat Pengaduan', selectedComplaint.isPrivate ? 'Privasi / Rahasia' : 'Publik' + (selectedComplaint.isConfirmed ? ' (Terpublikasi)' : ' (Butuh Konfirmasi)')],
                                        ['Lokasi', selectedComplaint.lokasi || '-'],
                                        ['Tanggal Pengaduan', formatDateTime(selectedComplaint.tanggalPengaduan)],
                                        ['Tanggal Selesai', formatDateTime(selectedComplaint.tanggalSelesai)],
                                    ].map(([label, value]) => (
                                        <div key={label}>
                                            <p className="text-xs text-slate-500 font-bold">{label}</p>
                                            <p className="font-bold text-slate-900 mt-0.5">{value}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-700">Deskripsi</h4>
                                <p className="whitespace-pre-line rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-slate-700 font-medium">{selectedComplaint.deskripsi}</p>
                            </div>

                            {selectedComplaint.catatanAdmin && (
                                <div>
                                    <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-blue-800">Catatan Admin</h4>
                                    <p className="whitespace-pre-line rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 font-medium">{selectedComplaint.catatanAdmin}</p>
                                </div>
                            )}

                            {/* Files */}
                            {(selectedComplaint.files || []).length > 0 && (
                                <div>
                                    <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-700">Lampiran</h4>
                                    <div className="space-y-2">
                                        {selectedComplaint.files!.map(file => (
                                            <div key={file.id} className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between">
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900">{file.originalName}</p>
                                                    <p className="text-xs text-slate-500 font-medium">{file.isAdminFile ? 'Lampiran admin' : 'Lampiran warga'} · {formatFileSize(file.size)}</p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <a href={file.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50 border border-blue-200 px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100 transition">
                                                        <Download size={13} /> Buka
                                                    </a>
                                                    <button onClick={() => deleteFile(file)} className="rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100 transition">Hapus</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Tanggapans */}
                            {(selectedComplaint.tanggapans || []).length > 0 && (
                                <div>
                                    <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-700">Riwayat Tanggapan</h4>
                                    <div className="space-y-3">
                                        {selectedComplaint.tanggapans!.map(item => (
                                            <div key={item.id} className={`rounded-xl border p-3 ${item.isAdmin ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-slate-50'}`}>
                                                <div className="mb-1 flex items-center justify-between gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${item.isAdmin ? 'bg-emerald-200' : 'bg-slate-200'}`}>
                                                            <User size={12} className={item.isAdmin ? 'text-emerald-800' : 'text-slate-700'} />
                                                        </div>
                                                        <span className={`text-xs font-bold ${item.isAdmin ? 'text-emerald-800' : 'text-slate-900'}`}>{item.isAdmin ? 'Admin RT' : 'Warga'}</span>
                                                        {item.statusToLabel && <span className="text-[10px] text-slate-500 font-medium">→ {item.statusToLabel}</span>}
                                                    </div>
                                                    <span className="text-[10px] text-slate-500 font-medium">{formatDateTime(item.createdAt)}</span>
                                                </div>
                                                {item.pesan && <p className="mt-2 whitespace-pre-line text-sm text-slate-700 leading-relaxed font-medium">{item.pesan}</p>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end gap-2.5 border-t border-slate-200 pt-4">
                                <button
                                    onClick={() => deleteComplaint(selectedComplaint.id)}
                                    className="rounded-xl bg-red-50 border border-red-200 px-4 py-2.5 text-sm font-bold text-red-700 hover:bg-red-100 transition"
                                >
                                    Hapus Laporan
                                </button>
                                <button
                                    onClick={() => toggleArchiveComplaint(selectedComplaint)}
                                    className="rounded-xl bg-purple-50 border border-purple-200 px-4 py-2.5 text-sm font-bold text-purple-700 hover:bg-purple-100 transition"
                                >
                                    {selectedComplaint.isArchived ? 'Batal Arsipkan' : 'Arsipkan'}
                                </button>
                                {!selectedComplaint.isPrivate && (
                                    <button
                                        onClick={() => toggleConfirmComplaint(selectedComplaint)}
                                        className={`rounded-xl px-4 py-2.5 text-sm font-bold border transition ${
                                            selectedComplaint.isConfirmed
                                                ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
                                                : 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
                                        }`}
                                    >
                                        {selectedComplaint.isConfirmed ? 'Batal Publikasikan' : 'Konfirmasi Publikasi'}
                                    </button>
                                )}
                                <button onClick={() => openStatusForm(selectedComplaint)} className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 transition shadow-sm">
                                    Update Status
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Status Update Modal ── */}
            {statusComplaint && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">
                        <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
                            <h3 className="text-lg font-black text-slate-900">Update Status Pengaduan</h3>
                            <button onClick={() => setStatusComplaint(null)} className="rounded-xl p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-200 transition"><X size={20} /></button>
                        </div>
                        <form onSubmit={submitStatus} className="space-y-4 p-6">
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                <p className="font-mono text-xs text-slate-500 font-bold">{statusComplaint.nomorPengaduan}</p>
                                <p className="font-bold text-slate-900 mt-1">{statusComplaint.judul}</p>
                                <p className="text-sm text-slate-600 font-medium">{statusComplaint.wargaName} · Rumah {statusComplaint.houseNumber}</p>
                            </div>
                            <div>
                                <label className={labelCls}>Status</label>
                                <select value={statusForm.status} onChange={e => setStatusForm(prev => ({ ...prev, status: e.target.value }))} className={inputCls}>
                                    {statusOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className={labelCls}>Catatan Admin</label>
                                <textarea value={statusForm.catatan_admin} onChange={e => setStatusForm(prev => ({ ...prev, catatan_admin: e.target.value }))} rows={4} className={inputCls} placeholder="Tulis tindak lanjut, alasan penolakan, atau catatan penyelesaian" />
                            </div>
                            <div>
                                <label className={labelCls}>Lampiran Admin (opsional)</label>
                                <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.mp4,.mov" onChange={e => setStatusForm(prev => ({ ...prev, lampiran_admin: Array.from(e.target.files || []) }))} className={inputCls} />
                                <p className="mt-1 text-[10px] text-slate-500 font-medium">Format PDF/JPG/PNG/MP4, maks 10MB per file.</p>
                            </div>
                            <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
                                <button type="button" onClick={() => setStatusComplaint(null)} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-100 transition shadow-sm">Batal</button>
                                <button type="submit" disabled={processing} className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 transition disabled:opacity-60 shadow-sm">
                                    {processing ? 'Menyimpan...' : 'Simpan Status'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
