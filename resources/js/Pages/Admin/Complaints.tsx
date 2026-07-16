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
        'infrastruktur': 'text-blue-400 bg-blue-400/10 border-blue-400/20',
        'kebersihan': 'text-green-400 bg-green-400/10 border-green-400/20',
        'keamanan': 'text-red-400 bg-red-400/10 border-red-400/20',
        'kebisingan': 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
        'penerangan': 'text-amber-400 bg-amber-400/10 border-amber-400/20',
        'administrasi': 'text-purple-400 bg-purple-400/10 border-purple-400/20',
        'lainnya': 'text-slate-400 bg-slate-400/10 border-slate-400/20',
    };
    const catCls = (cat: string) => catColors[cat] || 'text-slate-400 bg-slate-400/10 border-slate-400/20';

    return (
        <AdminLayout activeMenu="complaints">
            <Head title="Pusat Laporan Warga" />

            {/* ── Page Header ── */}
            <div className="mb-6 flex items-start justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400 mb-1">Layanan Warga</p>
                    <h2 className="text-2xl font-black text-white">Pusat Laporan Warga</h2>
                    <p className="text-slate-400 text-sm mt-1">Pantau, proses, dan selesaikan pengaduan warga RT secara real-time.</p>
                </div>
            </div>

            {/* ── Stats Header Bar ── */}
            <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
                <div className="rounded-2xl border border-[#1C2541]/60 bg-[#0B132B]/60 p-5 col-span-2 lg:col-span-1 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 p-3">
                            <MessageSquare size={22} className="text-blue-400" />
                        </div>
                        <div>
                            <p className="text-3xl font-black text-white">{summary.total}</p>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Pengaduan</p>
                        </div>
                    </div>
                </div>
                {[
                    { label: 'Menunggu', value: summary.diajukan, color: 'text-blue-400', icon: Clock },
                    { label: 'Diproses', value: summary.diproses, color: 'text-orange-400', icon: AlertCircle },
                    { label: 'Selesai', value: summary.selesai, color: 'text-emerald-400', icon: CheckCircle },
                ].map(({ label, value, color, icon: Icon }) => (
                    <div key={label} className="rounded-2xl border border-[#1C2541]/60 bg-[#0B132B]/60 p-5 backdrop-blur-sm">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
                            <Icon size={14} className={color} />
                        </div>
                        <p className={`text-2xl font-black ${color}`}>{value}</p>
                        <div className="mt-2 h-1 bg-[#1C2541]/60 rounded-full overflow-hidden">
                            <div className="h-full bg-current rounded-full transition-all" style={{ width: `${summary.total ? (value / summary.total) * 100 : 0}%`, color: 'inherit' }} />
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Main Content: Feed + Sidebar ── */}
            <div className="flex flex-col gap-6 lg:flex-row">
                {/* Feed Panel */}
                <div className="flex-1 min-w-0">
                    {/* Filters */}
                    <div className="mb-4 rounded-2xl border border-[#1C2541]/60 bg-[#0B132B]/60 p-4">
                        <div className="flex flex-col gap-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
                                <input
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    placeholder="Cari nomor, warga, rumah, judul, lokasi..."
                                    className="w-full rounded-xl border border-[#1C2541]/60 bg-[#111A2E]/60 py-2.5 pl-9 pr-4 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                                />
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {/* Archived Toggle */}
                                <button
                                    onClick={() => setArchivedFilter('0')}
                                    className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${archivedFilter === '0'
                                        ? 'bg-emerald-500 text-[#0B132B] shadow-lg shadow-emerald-500/20'
                                        : 'border border-[#1C2541]/60 text-slate-400 hover:text-white'
                                    }`}
                                >
                                    Aduan Aktif
                                </button>
                                <button
                                    onClick={() => setArchivedFilter('1')}
                                    className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${archivedFilter === '1'
                                        ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40 shadow-lg shadow-purple-500/10'
                                        : 'border border-[#1C2541]/60 text-slate-400 hover:text-white'
                                    }`}
                                >
                                    Arsip
                                </button>
                                <div className="h-4 w-px bg-[#1C2541]/60 mx-1 self-center" />

                                {/* Status Tabs */}
                                {[{ value: 'all', label: 'Semua Status' }, ...statusOptions].map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => setStatusFilter(opt.value)}
                                        className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${statusFilter === opt.value
                                            ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                                            : 'border border-[#1C2541]/60 text-slate-400 hover:text-white'
                                        }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                                <div className="h-4 w-px bg-[#1C2541]/60 mx-1 self-center" />
                                {/* Priority Tabs */}
                                {[{ value: 'all', label: 'Semua Prioritas' }, ...priorityOptions].map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => setPriorityFilter(opt.value)}
                                        className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${priorityFilter === opt.value
                                            ? 'bg-orange-500/20 border border-orange-500/30 text-orange-300'
                                            : 'border border-[#1C2541]/60 text-slate-500 hover:text-slate-300'
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
                            <div className="rounded-2xl border border-[#1C2541]/60 bg-[#0B132B]/60 py-16 text-center">
                                <MessageSquare size={40} className="text-slate-600 mx-auto mb-3" />
                                <p className="text-slate-500 text-sm">Belum ada pengaduan yang sesuai filter.</p>
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
                                    <div key={complaint.id} className="group rounded-2xl border border-[#1C2541]/60 bg-[#0B132B]/60 p-5 hover:border-emerald-500/20 transition backdrop-blur-sm">
                                        <div className="flex gap-4">
                                            {/* Avatar */}
                                            <div className="shrink-0">
                                                {complaint.wargaAvatar ? (
                                                    <img
                                                        src={complaint.wargaAvatar}
                                                        alt={complaint.wargaName}
                                                        className="h-10 w-10 rounded-xl object-cover border border-emerald-500/20"
                                                    />
                                                ) : (
                                                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-blue-500/20 border border-emerald-500/20 flex items-center justify-center text-sm font-black text-emerald-300">
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
                                                            <span className="text-xs font-bold text-white">{complaint.wargaName}</span>
                                                            <span className="text-[10px] text-slate-500">Rumah {complaint.houseNumber}</span>
                                                            <span className="font-mono text-[10px] text-slate-600">{complaint.nomorPengaduan}</span>
                                                            {complaint.isPrivate ? (
                                                                <span className="rounded bg-purple-500/15 text-purple-400 px-1.5 py-0.5 text-[9px] font-bold border border-purple-500/20">
                                                                    Privasi
                                                                </span>
                                                            ) : (
                                                                <div className="flex items-center gap-1">
                                                                    <span className="rounded bg-blue-500/15 text-blue-400 px-1.5 py-0.5 text-[9px] font-bold border border-blue-500/20">
                                                                        Publik
                                                                    </span>
                                                                    {complaint.isConfirmed ? (
                                                                        <span className="rounded bg-emerald-500/15 text-emerald-400 px-1.5 py-0.5 text-[9px] font-bold border border-emerald-500/20">
                                                                            Terpublikasi
                                                                        </span>
                                                                    ) : (
                                                                        <span className="rounded bg-amber-500/15 text-amber-400 px-1.5 py-0.5 text-[9px] font-bold border border-amber-500/20">
                                                                            Butuh Konfirmasi
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition truncate">{complaint.judul}</h3>
                                                    </div>
                                                    <span className={`shrink-0 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-bold ${statusConf.cls}`}>
                                                        <StatusIcon size={10} />{complaint.statusLabel}
                                                    </span>
                                                </div>

                                                {/* Description snippet */}
                                                <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 mb-3">{complaint.deskripsi}</p>

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
                                                            <span className="text-[10px] text-slate-500">📍 {complaint.lokasi}</span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-[10px] text-slate-500">{formatDate(complaint.tanggalPengaduan)}</span>
                                                        {responseCount > 0 && (
                                                            <span className="flex items-center gap-1 text-[10px] text-slate-500">
                                                                <MessageSquare size={10} /> {responseCount} balasan
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Actions */}
                                                <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-[#1C2541]/40">
                                                    <button
                                                        onClick={() => setSelectedComplaint(complaint)}
                                                        className="flex items-center gap-1.5 rounded-xl border border-[#1C2541]/60 px-3 py-1.5 text-xs font-bold text-slate-400 hover:text-white hover:border-[#1C2541] transition"
                                                    >
                                                        <Eye size={13} /> Lihat Detail
                                                    </button>
                                                    {!complaint.isPrivate && (
                                                        <button
                                                            onClick={() => toggleConfirmComplaint(complaint)}
                                                            className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
                                                                complaint.isConfirmed
                                                                    ? 'bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/20 hover:border-amber-500'
                                                                    : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25 hover:border-emerald-500'
                                                            }`}
                                                        >
                                                            <CheckCircle size={13} />
                                                            {complaint.isConfirmed ? 'Batal Publikasikan' : 'Konfirmasi Publikasi'}
                                                        </button>
                                                    )}
                                                    {complaint.status !== 'selesai' && complaint.status !== 'ditolak' && (
                                                        <button
                                                            onClick={() => openStatusForm(complaint)}
                                                            className="flex items-center gap-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 px-3 py-1.5 text-xs font-bold text-emerald-300 hover:bg-emerald-500/25 transition"
                                                        >
                                                            <CheckCircle size={13} />
                                                            {complaint.status === 'diajukan' ? 'Proses' : 'Update'}
                                                        </button>
                                                    )}
                                                    {complaint.status === 'selesai' && (
                                                        <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold">
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
                    <div className="rounded-2xl border border-[#1C2541]/60 bg-[#0B132B]/60 p-5">
                        <h3 className="text-sm font-bold text-white mb-4">Distribusi Status</h3>
                        <div className="space-y-3">
                            {[
                                { label: 'Diajukan', value: summary.diajukan, color: 'bg-blue-400', textColor: 'text-blue-400' },
                                { label: 'Diproses', value: summary.diproses, color: 'bg-orange-400', textColor: 'text-orange-400' },
                                { label: 'Selesai', value: summary.selesai, color: 'bg-emerald-400', textColor: 'text-emerald-400' },
                                { label: 'Ditolak', value: summary.ditolak, color: 'bg-red-400', textColor: 'text-red-400' },
                            ].map(({ label, value, color, textColor }) => (
                                <div key={label}>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs text-slate-400">{label}</span>
                                        <span className={`text-xs font-bold ${textColor}`}>{value}</span>
                                    </div>
                                    <div className="h-1.5 bg-[#1C2541]/60 rounded-full overflow-hidden">
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
                    <div className="rounded-2xl border border-[#1C2541]/60 bg-[#0B132B]/60 p-5">
                        <h3 className="text-sm font-bold text-white mb-4">Kategori</h3>
                        <div className="space-y-2">
                            {categoryOptions.map(opt => {
                                const count = complaints.filter(c => c.kategori === opt.value).length;
                                return (
                                    <button
                                        key={opt.value}
                                        onClick={() => setCategoryFilter(categoryFilter === opt.value ? 'all' : opt.value)}
                                        className={`w-full flex items-center justify-between rounded-xl px-3 py-2 transition ${categoryFilter === opt.value
                                            ? 'bg-emerald-500/10 border border-emerald-500/20'
                                            : 'hover:bg-[#111A2E]/60'
                                        }`}
                                    >
                                        <span className={`text-xs font-semibold ${categoryFilter === opt.value ? 'text-emerald-300' : 'text-slate-400'}`}>{opt.label}</span>
                                        <span className={`text-xs font-black rounded-lg px-2 py-0.5 ${count > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'text-slate-600'}`}>{count}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Resolution Rate */}
                    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
                        <div className="flex items-center gap-2 mb-3">
                            <TrendingUp size={16} className="text-emerald-400" />
                            <h3 className="text-sm font-bold text-white">Tingkat Penyelesaian</h3>
                        </div>
                        <div className="text-center">
                            <p className="text-4xl font-black text-emerald-400">
                                {summary.total ? Math.round((summary.selesai / summary.total) * 100) : 0}%
                            </p>
                            <p className="text-xs text-slate-500 mt-1">{summary.selesai} dari {summary.total} selesai</p>
                        </div>
                        <div className="mt-3 h-2 bg-[#1C2541]/60 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-700"
                                style={{ width: `${summary.total ? (summary.selesai / summary.total) * 100 : 0}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Detail Modal ── */}
            {selectedComplaint && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                    <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-[#1C2541]/60 bg-[#090E1A] shadow-2xl">
                        <div className="sticky top-0 flex items-center justify-between border-b border-[#1C2541]/40 bg-[#090E1A]/95 px-6 py-4 z-10">
                            <div>
                                <h3 className="text-lg font-black text-white">Detail Pengaduan</h3>
                                <p className="text-xs text-slate-500 font-mono">{selectedComplaint.nomorPengaduan}</p>
                            </div>
                            <button onClick={() => setSelectedComplaint(null)} className="rounded-xl p-2 text-slate-400 hover:text-white hover:bg-[#1C2541]/60 transition"><X size={20} /></button>
                        </div>
                        <div className="space-y-5 p-6">
                            <div className="rounded-xl border border-[#1C2541]/60 bg-[#0B132B]/60 p-5">
                                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                                    <div>
                                        <h3 className="text-lg font-bold text-white">{selectedComplaint.judul}</h3>
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
                                            <p className="text-xs text-slate-500">{label}</p>
                                            <p className="font-semibold text-white mt-0.5">{value}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Deskripsi</h4>
                                <p className="whitespace-pre-line rounded-xl border border-[#1C2541]/60 bg-[#0B132B]/40 p-4 text-sm leading-relaxed text-slate-300">{selectedComplaint.deskripsi}</p>
                            </div>

                            {selectedComplaint.catatanAdmin && (
                                <div>
                                    <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-blue-400">Catatan Admin</h4>
                                    <p className="whitespace-pre-line rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 text-sm text-blue-200">{selectedComplaint.catatanAdmin}</p>
                                </div>
                            )}

                            {/* Files */}
                            {(selectedComplaint.files || []).length > 0 && (
                                <div>
                                    <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Lampiran</h4>
                                    <div className="space-y-2">
                                        {selectedComplaint.files!.map(file => (
                                            <div key={file.id} className="flex flex-col gap-3 rounded-xl border border-[#1C2541]/60 bg-[#0B132B]/40 p-3 sm:flex-row sm:items-center sm:justify-between">
                                                <div>
                                                    <p className="text-sm font-semibold text-white">{file.originalName}</p>
                                                    <p className="text-xs text-slate-500">{file.isAdminFile ? 'Lampiran admin' : 'Lampiran warga'} · {formatFileSize(file.size)}</p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <a href={file.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-xl bg-blue-500/20 border border-blue-500/30 px-3 py-1.5 text-xs font-bold text-blue-300 hover:bg-blue-500/30 transition">
                                                        <Download size={13} /> Buka
                                                    </a>
                                                    <button onClick={() => deleteFile(file)} className="rounded-xl border border-red-500/30 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 transition">Hapus</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Tanggapans */}
                            {(selectedComplaint.tanggapans || []).length > 0 && (
                                <div>
                                    <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Riwayat Tanggapan</h4>
                                    <div className="space-y-3">
                                        {selectedComplaint.tanggapans!.map(item => (
                                            <div key={item.id} className={`rounded-xl border p-3 ${item.isAdmin ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-[#1C2541]/60 bg-[#0B132B]/40'}`}>
                                                <div className="mb-1 flex items-center justify-between gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${item.isAdmin ? 'bg-emerald-500/20' : 'bg-slate-500/20'}`}>
                                                            <User size={12} className={item.isAdmin ? 'text-emerald-400' : 'text-slate-400'} />
                                                        </div>
                                                        <span className={`text-xs font-bold ${item.isAdmin ? 'text-emerald-300' : 'text-white'}`}>{item.isAdmin ? 'Admin RT' : 'Warga'}</span>
                                                        {item.statusToLabel && <span className="text-[10px] text-slate-500">→ {item.statusToLabel}</span>}
                                                    </div>
                                                    <span className="text-[10px] text-slate-500">{formatDateTime(item.createdAt)}</span>
                                                </div>
                                                {item.pesan && <p className="mt-2 whitespace-pre-line text-sm text-slate-300 leading-relaxed">{item.pesan}</p>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end gap-2.5 border-t border-[#1C2541]/40 pt-4">
                                <button
                                    onClick={() => deleteComplaint(selectedComplaint.id)}
                                    className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-2.5 text-sm font-bold text-red-400 hover:bg-red-500/20 transition"
                                >
                                    Hapus Laporan
                                </button>
                                <button
                                    onClick={() => toggleArchiveComplaint(selectedComplaint)}
                                    className="rounded-xl bg-purple-500/10 border border-purple-500/20 px-4 py-2.5 text-sm font-bold text-purple-400 hover:bg-purple-500/20 transition"
                                >
                                    {selectedComplaint.isArchived ? 'Batal Arsipkan' : 'Arsipkan'}
                                </button>
                                {!selectedComplaint.isPrivate && (
                                    <button
                                        onClick={() => toggleConfirmComplaint(selectedComplaint)}
                                        className={`rounded-xl px-4 py-2.5 text-sm font-bold border transition ${
                                            selectedComplaint.isConfirmed
                                                ? 'bg-amber-500/10 border-amber-500/25 text-amber-400 hover:bg-amber-500/20'
                                                : 'bg-blue-500/10 border-blue-500/20 text-blue-400 hover:bg-blue-500/20'
                                        }`}
                                    >
                                        {selectedComplaint.isConfirmed ? 'Batal Publikasikan' : 'Konfirmasi Publikasi'}
                                    </button>
                                )}
                                <button onClick={() => openStatusForm(selectedComplaint)} className="rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-[#0B132B] hover:bg-emerald-400 transition">
                                    Update Status
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Status Update Modal ── */}
            {statusComplaint && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                    <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-[#1C2541]/60 bg-[#090E1A] shadow-2xl">
                        <div className="sticky top-0 flex items-center justify-between border-b border-[#1C2541]/40 bg-[#090E1A]/95 px-6 py-4">
                            <h3 className="text-lg font-black text-white">Update Status Pengaduan</h3>
                            <button onClick={() => setStatusComplaint(null)} className="rounded-xl p-2 text-slate-400 hover:text-white hover:bg-[#1C2541]/60 transition"><X size={20} /></button>
                        </div>
                        <form onSubmit={submitStatus} className="space-y-4 p-6">
                            <div className="rounded-xl border border-[#1C2541]/60 bg-[#0B132B]/60 p-3">
                                <p className="font-mono text-xs text-slate-500">{statusComplaint.nomorPengaduan}</p>
                                <p className="font-bold text-white mt-1">{statusComplaint.judul}</p>
                                <p className="text-sm text-slate-400">{statusComplaint.wargaName} · Rumah {statusComplaint.houseNumber}</p>
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
                                <p className="mt-1 text-[10px] text-slate-500">Format PDF/JPG/PNG/MP4, maks 10MB per file.</p>
                            </div>
                            <div className="flex justify-end gap-3 border-t border-[#1C2541]/40 pt-4">
                                <button type="button" onClick={() => setStatusComplaint(null)} className="rounded-xl border border-[#1C2541]/60 px-4 py-2.5 text-sm text-slate-400 hover:text-white transition">Batal</button>
                                <button type="submit" disabled={processing} className="rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-[#0B132B] hover:bg-emerald-400 transition disabled:opacity-60">
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
