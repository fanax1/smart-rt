import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router } from '@inertiajs/react';
import { Archive, Bell, CheckCircle, Download, Edit, Eye, FileText, Plus, Search, Trash2, X } from 'lucide-react';
import { FormEvent, ReactNode, useEffect, useState } from 'react';

type AnnouncementFile = {
    id: number;
    originalName: string;
    url: string;
    mimeType?: string | null;
    size?: number;
};

type Announcement = {
    id: number;
    judul: string;
    isi: string;
    kategori: string;
    targetAudiens: string;
    status: 'draft' | 'published' | 'archived';
    statusLabel: string;
    publishedAt?: string | null;
    createdAt?: string | null;
    creator?: string | null;
    files?: AnnouncementFile[];
};

type Option = {
    value: string;
    label: string;
};

type Props = {
    announcements?: Announcement[];
    filters?: {
        search?: string;
        status?: string;
        kategori?: string;
    };
    summary?: {
        total: number;
        draft: number;
        published: number;
        archived: number;
        views_rate?: number;
    };
    statusOptions?: Option[];
    targetOptions?: Option[];
    categoryOptions?: Option[];
};

type FormState = {
    judul: string;
    isi: string;
    kategori: string;
    target_audiens: string;
    status: string;
    lampiran: File[];
};

const defaultForm: FormState = {
    judul: '',
    isi: '',
    kategori: 'umum',
    target_audiens: 'semua',
    status: 'draft',
    lampiran: [],
};

const defaultSummary = {
    total: 0,
    draft: 0,
    published: 0,
    archived: 0,
};

function statusBadge(status: string) {
    switch (status) {
        case 'published':
            return 'bg-green-100 text-green-700';
        case 'archived':
            return 'bg-slate-200 text-slate-700';
        case 'draft':
        default:
            return 'bg-yellow-100 text-yellow-700';
    }
}

function formatDate(value?: string | null) {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';

    return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

function formatFileSize(size?: number) {
    if (!size) return '-';
    if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export default function Announcements({
    announcements = [],
    filters,
    summary = defaultSummary,
    statusOptions = [],
    targetOptions = [],
    categoryOptions = [],
}: Props) {
    const [searchTerm, setSearchTerm] = useState(filters?.search ?? '');
    const [statusFilter, setStatusFilter] = useState(filters?.status ?? 'all');
    const [categoryFilter, setCategoryFilter] = useState(filters?.kategori ?? 'all');
    const [showForm, setShowForm] = useState(false);
    const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
    const [form, setForm] = useState<FormState>(defaultForm);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        const timeout = window.setTimeout(() => {
            router.get(
                '/admin/announcements',
                { search: searchTerm, status: statusFilter, kategori: categoryFilter },
                { preserveState: true, preserveScroll: true, replace: true },
            );
        }, 350);

        return () => window.clearTimeout(timeout);
    }, [searchTerm, statusFilter, categoryFilter]);

    const openCreate = () => {
        setEditingAnnouncement(null);
        setForm(defaultForm);
        setShowForm(true);
    };

    const openEdit = (announcement: Announcement) => {
        setEditingAnnouncement(announcement);
        setForm({
            judul: announcement.judul,
            isi: announcement.isi,
            kategori: announcement.kategori,
            target_audiens: announcement.targetAudiens,
            status: announcement.status,
            lampiran: [],
        });
        setShowForm(true);
    };

    const submitForm = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const payload = new FormData();
        payload.append('judul', form.judul);
        payload.append('isi', form.isi);
        payload.append('kategori', form.kategori);
        payload.append('target_audiens', form.target_audiens);
        payload.append('status', form.status);

        form.lampiran.forEach((file) => {
            payload.append('lampiran[]', file);
        });

        setProcessing(true);

        if (editingAnnouncement) {
            payload.append('_method', 'PUT');
            router.post(`/admin/announcements/${editingAnnouncement.id}`, payload, {
                forceFormData: true,
                preserveScroll: true,
                onSuccess: () => setShowForm(false),
                onFinish: () => setProcessing(false),
            });
            return;
        }

        router.post('/admin/announcements', payload, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => setShowForm(false),
            onFinish: () => setProcessing(false),
        });
    };

    const publishAnnouncement = (announcement: Announcement) => {
        router.patch(`/admin/announcements/${announcement.id}/publish`, {}, { preserveScroll: true });
    };

    const unpublishAnnouncement = (announcement: Announcement) => {
        router.patch(`/admin/announcements/${announcement.id}/unpublish`, {}, { preserveScroll: true });
    };

    const archiveAnnouncement = (announcement: Announcement) => {
        if (!window.confirm(`Arsipkan pengumuman "${announcement.judul}"?`)) return;
        router.patch(`/admin/announcements/${announcement.id}/archive`, {}, { preserveScroll: true });
    };

    const deleteAnnouncement = (announcement: Announcement) => {
        if (!window.confirm(`Hapus pengumuman "${announcement.judul}" secara permanen? Data yang dihapus tidak dapat dikembalikan.`)) return;
        router.delete(`/admin/announcements/${announcement.id}`, { preserveScroll: true });
    };

    const deleteFile = (file: AnnouncementFile) => {
        if (!window.confirm('Hapus lampiran ini?')) return;
        router.delete(`/admin/announcements/files/${file.id}`, { preserveScroll: true });
    };

    return (
        <AdminLayout activeMenu="announcements">
            <Head title="Pengumuman - SMART-RT" />

            {/* Title Header Section */}
            <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <h2 className="text-3xl font-black text-white">Pengumuman</h2>
                    <p className="mt-1 text-sm text-slate-400 font-medium">Kelola pengumuman, berita, dan informasi untuk seluruh warga RT 003.</p>
                </div>
                <button
                    type="button"
                    onClick={openCreate}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-xs font-black text-[#0B132B] hover:bg-emerald-400 transition duration-200 shadow-lg shadow-emerald-500/10"
                >
                    <Plus size={14} />
                    <span>Buat Pengumuman Baru</span>
                </button>
            </div>

            {/* 4 Stat Cards */}
            <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
                {/* Total */}
                <div className="rounded-2xl border border-[#1C2541]/50 bg-[#111A2E]/60 p-6 relative overflow-hidden">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">TOTAL PENGUMUMAN</span>
                        <div className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_8px_#3B82F6]"></div>
                    </div>
                    <div className="mt-4">
                        <h3 className="text-3xl font-black text-white">{String(summary?.total || 0).padStart(2, '0')}</h3>
                    </div>
                </div>

                {/* Aktif */}
                <div className="rounded-2xl border border-[#1C2541]/50 bg-[#111A2E]/60 p-6 relative overflow-hidden">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">AKTIF</span>
                        <div className="h-2 w-2 rounded-full bg-amber-500 shadow-[0_0_8px_#F59E0B]"></div>
                    </div>
                    <div className="mt-4">
                        <h3 className="text-3xl font-black text-white">{String(summary?.published || 0).padStart(2, '0')}</h3>
                    </div>
                </div>

                {/* Arsip */}
                <div className="rounded-2xl border border-[#1C2541]/50 bg-[#111A2E]/60 p-6 relative overflow-hidden">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">ARSIP</span>
                        <div className="h-2 w-2 rounded-full bg-purple-500 shadow-[0_0_8px_#A855F7]"></div>
                    </div>
                    <div className="mt-4">
                        <h3 className="text-3xl font-black text-white">{String(summary?.archived || 0).padStart(2, '0')}</h3>
                    </div>
                </div>

                {/* Dilihat */}
                <div className="rounded-2xl border border-[#1C2541]/50 bg-[#111A2E]/60 p-6 relative overflow-hidden">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">DILIHAT</span>
                        <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10B981]"></div>
                    </div>
                    <div className="mt-4 flex items-center gap-2">
                        <h3 className="text-3xl font-black text-white">{summary?.views_rate ?? 92}%</h3>
                        <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[9px] font-black text-emerald-400">92% Dilihat</span>
                    </div>
                </div>
            </div>

            {/* Filter Bar with Search and Dropdowns */}
            <div className="mb-6 rounded-2xl border border-[#1C2541]/50 bg-[#111A2E]/50 p-4 shadow-md">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                    {/* Search Input */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <input
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                            placeholder="Cari judul, isi, warga, atau pengumuman..."
                            className="w-full rounded-full bg-[#111A2E] border border-[#1C2541]/70 py-2.5 pl-10 pr-4 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                        />
                    </div>

                    {/* Status Tabs / Buttons */}
                    <div className="flex bg-[#0B132B]/80 rounded-xl p-1 border border-[#1C2541]/40 shrink-0">
                        {[
                            { value: 'all', label: 'Semua' },
                            { value: 'published', label: 'Aktif' },
                            { value: 'archived', label: 'Arsip' },
                        ].map((tab) => (
                            <button
                                key={tab.value}
                                type="button"
                                onClick={() => setStatusFilter(tab.value)}
                                className={`rounded-lg px-4 py-1.5 text-xs font-bold transition duration-200 ${
                                    statusFilter === tab.value
                                        ? 'bg-emerald-500 text-[#0B132B]'
                                        : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Dropdowns */}
                    <div className="flex gap-2 shrink-0">
                        <select
                            value={categoryFilter}
                            onChange={(event) => setCategoryFilter(event.target.value)}
                            className="rounded-xl border border-[#1C2541] bg-[#111A2E] px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
                        >
                            <option value="all">Semua Kategori</option>
                            {categoryOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>

                        <select
                            className="rounded-xl border border-[#1C2541] bg-[#111A2E] px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
                        >
                            <option value="latest">Terbaru</option>
                            <option value="oldest">Terlama</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Grid Cards Container */}
            <div className="grid grid-cols-1 gap-6 mb-8">
                {announcements.map((announcement) => {
                    // Find first image attachment
                    const imageFile = announcement.files?.find(f => f.mimeType?.startsWith('image/'));
                    const coverSrc = imageFile?.url || null;

                    // Choose colors based on category
                    let categoryColor = 'bg-red-500/10 text-red-400 border border-red-500/20';
                    if (announcement.kategori === 'kegiatan') categoryColor = 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
                    else if (announcement.kategori === 'keamanan') categoryColor = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
                    else if (announcement.kategori === 'penting') categoryColor = 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
                    else if (announcement.kategori === 'sosial') categoryColor = 'bg-blue-500/10 text-blue-400 border border-blue-500/20';

                    const formattedDate = formatDate(announcement.publishedAt || announcement.createdAt);
                    const isPublished = announcement.status === 'published';
                    const isDraft = announcement.status === 'draft';
                    const isArchived = announcement.status === 'archived';

                    return (
                        <div key={announcement.id} className="flex flex-col md:flex-row gap-5 rounded-2xl border border-[#1C2541]/50 bg-[#111A2E]/50 p-5 hover:border-[#10B981]/50 transition duration-300">
                            {/* Left Cover Image */}
                            <div className="w-full md:w-48 h-32 rounded-xl overflow-hidden shrink-0 bg-[#0B132B]/60 flex items-center justify-center relative border border-[#1C2541]/40">
                                {coverSrc ? (
                                    <>
                                        <div 
                                            className="absolute inset-0 bg-cover bg-center blur-md opacity-20 scale-105 pointer-events-none" 
                                            style={{ backgroundImage: `url(${coverSrc})` }}
                                        />
                                        <img 
                                            src={coverSrc} 
                                            alt={announcement.judul} 
                                            className="relative w-full h-full object-contain mx-auto transition duration-500 hover:scale-[1.03]" 
                                        />
                                    </>
                                ) : (
                                    <div className="h-full w-full bg-gradient-to-br from-indigo-950 via-slate-900 to-emerald-950 flex items-center justify-center">
                                        <Bell size={24} className="text-emerald-500/30 animate-pulse" />
                                    </div>
                                )}
                            </div>

                            {/* Center Info */}
                            <div className="flex-1 flex flex-col justify-between">
                                <div>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <span className={`rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider ${categoryColor}`}>
                                            {announcement.kategori}
                                        </span>
                                        <span className="text-[10px] text-slate-500 font-semibold">
                                            Diterbitkan: {formattedDate}
                                        </span>
                                        {isPublished && <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">● Aktif</span>}
                                        {isDraft && <span className="text-[10px] text-amber-400 font-bold flex items-center gap-1">● Draf</span>}
                                        {isArchived && <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1">● Arsip</span>}
                                    </div>

                                    <h4 className="mt-3 text-lg font-bold text-white leading-snug">
                                        {announcement.judul}
                                    </h4>

                                    <p className="mt-2 text-slate-400 text-xs line-clamp-2 leading-relaxed">
                                        {announcement.isi}
                                    </p>
                                </div>

                                <div className="mt-5 flex flex-wrap items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedAnnouncement(announcement)}
                                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#1C2541] border border-[#2a365c] px-3.5 py-2 text-xs font-bold text-slate-200 hover:bg-[#253256] hover:text-white transition duration-200"
                                    >
                                        <Eye size={13} className="text-slate-400" />
                                        <span>Detail</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => openEdit(announcement)}
                                        className="inline-flex items-center gap-1.5 rounded-xl bg-blue-500/10 border border-blue-500/30 px-3.5 py-2 text-xs font-bold text-blue-400 hover:bg-blue-500/20 transition duration-200"
                                    >
                                        <Edit size={13} />
                                        <span>Edit</span>
                                    </button>
                                    {isPublished ? (
                                        <button
                                            type="button"
                                            onClick={() => unpublishAnnouncement(announcement)}
                                            className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 px-3.5 py-2 text-xs font-bold text-amber-400 hover:bg-amber-500/20 transition duration-200"
                                        >
                                            <X size={13} />
                                            <span>Unpublish</span>
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => publishAnnouncement(announcement)}
                                            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3.5 py-2 text-xs font-black text-[#0B132B] hover:bg-emerald-400 transition duration-200 shadow-md shadow-emerald-500/20"
                                        >
                                            <CheckCircle size={13} />
                                            <span>Publish</span>
                                        </button>
                                    )}
                                    {!isArchived && (
                                        <button
                                            type="button"
                                            onClick={() => archiveAnnouncement(announcement)}
                                            className="inline-flex items-center gap-1.5 rounded-xl bg-purple-500/10 border border-purple-500/30 px-3.5 py-2 text-xs font-bold text-purple-300 hover:bg-purple-500/20 transition duration-200"
                                        >
                                            <Archive size={13} />
                                            <span>Arsipkan</span>
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => deleteAnnouncement(announcement)}
                                        className="inline-flex items-center gap-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 px-3.5 py-2 text-xs font-bold text-rose-400 hover:bg-rose-500/20 transition duration-200"
                                    >
                                        <Trash2 size={13} />
                                        <span>Hapus</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {announcements.length === 0 && (
                    <div className="py-12 text-center text-slate-500 border border-dashed border-[#1C2541]/40 rounded-2xl">
                        Belum ada pengumuman yang sesuai.
                    </div>
                )}
            </div>

            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowForm(false)} />
                    <div className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-[#1C2541]/60 bg-[#090E1A] shadow-2xl">
                        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#1C2541]/40 bg-[#090E1A]/95 backdrop-blur-sm px-6 py-4">
                            <h3 className="text-lg font-black text-white">{editingAnnouncement ? 'Edit Pengumuman' : 'Tambah Pengumuman'}</h3>
                            <button type="button" onClick={() => setShowForm(false)} className="rounded-xl p-2 text-slate-400 hover:text-white hover:bg-[#1C2541]/60 transition">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={submitForm} className="space-y-4 p-6">
                            <FormInput label="Judul" value={form.judul} onChange={(value) => setForm((previous) => ({ ...previous, judul: value }))} required />

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                <SelectInput label="Kategori" value={form.kategori} options={categoryOptions} onChange={(value) => setForm((previous) => ({ ...previous, kategori: value }))} />
                                <SelectInput label="Target Audiens" value={form.target_audiens} options={targetOptions} onChange={(value) => setForm((previous) => ({ ...previous, target_audiens: value }))} />
                                <SelectInput label="Status" value={form.status} options={statusOptions} onChange={(value) => setForm((previous) => ({ ...previous, status: value }))} />
                            </div>

                            <div>
                                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">Isi Pengumuman</label>
                                <textarea
                                    required
                                    value={form.isi}
                                    onChange={(event) => setForm((previous) => ({ ...previous, isi: event.target.value }))}
                                    rows={8}
                                    className="w-full rounded-xl border border-[#1C2541]/60 bg-[#0B132B]/80 px-3 py-2.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition text-sm"
                                />
                            </div>

                            <div>
                                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">Lampiran Opsional</label>
                                <input
                                    type="file"
                                    multiple
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={(event) => setForm((previous) => ({ ...previous, lampiran: Array.from(event.target.files ?? []) }))}
                                    className="w-full rounded-xl border border-[#1C2541]/40 bg-[#090E1A]/80 px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-emerald-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-emerald-500/10 file:text-emerald-400 hover:file:bg-emerald-500/20"
                                />
                                <p className="mt-2 text-xs text-slate-500">Format PDF/JPG/PNG, maksimal 5 MB per file.</p>
                            </div>

                            {editingAnnouncement && (editingAnnouncement.files?.length ?? 0) > 0 && (
                                <div className="rounded-2xl border border-[#1C2541]/60 bg-[#0B132B]/40 p-5">
                                    <p className="mb-4 text-sm font-bold text-white">Lampiran Saat Ini</p>
                                    <div className="space-y-2">
                                        {editingAnnouncement.files?.map((file) => (
                                            <div key={file.id} className="flex flex-col gap-2 rounded-xl bg-[#090E1A]/80 border border-[#1C2541]/40 p-3 sm:flex-row sm:items-center sm:justify-between">
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-200">{file.originalName}</p>
                                                    <p className="text-xs text-slate-400 mt-1">{formatFileSize(file.size)}</p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => deleteFile(file)}
                                                    className="rounded-xl border border-red-500/30 px-3 py-2 text-xs font-bold text-red-400 hover:bg-red-950/20 transition duration-200"
                                                >
                                                    Hapus Lampiran
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end gap-3.5 border-t border-[#1C2541]/40 pt-5">
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="rounded-xl border border-[#1C2541]/60 bg-[#0B132B]/50 px-5 py-2.5 text-sm font-bold text-slate-400 hover:text-white hover:bg-[#1C2541]/60 transition"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="rounded-xl bg-emerald-500 px-6 py-2.5 text-sm font-bold text-[#0B132B] hover:bg-emerald-400 transition disabled:opacity-60"
                                >
                                    {processing ? 'Menyimpan...' : editingAnnouncement ? 'Update' : 'Simpan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {selectedAnnouncement && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setSelectedAnnouncement(null)} />
                    <div className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-[#1C2541]/60 bg-[#090E1A] shadow-2xl">
                        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#1C2541]/40 bg-[#090E1A]/95 backdrop-blur-sm px-6 py-4">
                            <div>
                                <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-emerald-400">{selectedAnnouncement.kategori}</p>
                                <h3 className="text-xl font-black text-white">{selectedAnnouncement.judul}</h3>
                            </div>
                            <button type="button" onClick={() => setSelectedAnnouncement(null)} className="rounded-xl p-2 text-slate-400 hover:text-white hover:bg-[#1C2541]/60 transition">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-6 p-6">
                            <div className="flex flex-wrap gap-4 text-xs font-semibold text-slate-400">
                                <span>Status: <span className="text-slate-200">{selectedAnnouncement.statusLabel}</span></span>
                                <span>Target: <span className="text-slate-200">{selectedAnnouncement.targetAudiens}</span></span>
                                <span>Publish: <span className="text-slate-200">{formatDate(selectedAnnouncement.publishedAt)}</span></span>
                            </div>

                            {/* Cover Image */}
                            {(() => {
                                const imageFile = selectedAnnouncement.files?.find(f => f.mimeType?.startsWith('image/'));
                                const coverSrc = imageFile?.url || null;
                                return coverSrc ? (
                                    <div className="relative w-full overflow-hidden bg-black/45 border border-[#1C2541]/40 rounded-xl flex items-center justify-center">
                                        <div 
                                            className="absolute inset-0 bg-cover bg-center blur-md opacity-20 scale-105 pointer-events-none" 
                                            style={{ backgroundImage: `url(${coverSrc})` }}
                                        />
                                        <img 
                                            src={coverSrc} 
                                            alt={selectedAnnouncement.judul} 
                                            className="relative max-h-[300px] w-auto max-w-full object-contain mx-auto transition-all" 
                                        />
                                    </div>
                                ) : null;
                            })()}

                            <div className="whitespace-pre-line rounded-xl border border-[#1C2541]/40 bg-[#0B132B]/40 p-5 text-sm leading-7 text-slate-300">
                                {selectedAnnouncement.isi}
                            </div>

                            {(selectedAnnouncement.files?.length ?? 0) > 0 && (
                                <div className="pt-4 border-t border-[#1C2541]/40">
                                    <h4 className="mb-4 font-bold text-white text-sm">Lampiran</h4>
                                    <div className="space-y-3">
                                        {selectedAnnouncement.files?.map((file) => (
                                            <div key={file.id} className="flex flex-col gap-3 rounded-xl border border-[#1C2541]/40 bg-[#0B132B]/20 p-4 sm:flex-row sm:items-center sm:justify-between">
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-200">{file.originalName}</p>
                                                    <p className="text-xs text-slate-400 mt-1">{formatFileSize(file.size)}</p>
                                                </div>
                                                <a
                                                    href={file.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-500/30 px-4 py-2 text-xs font-bold text-blue-400 hover:bg-blue-950/20 transition duration-200"
                                                >
                                                    <Download size={15} /> Buka / Download
                                                </a>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}

function SummaryCard({ icon, title, value, iconClass }: { icon: ReactNode; title: string; value: number; iconClass: string }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-[#111A2E]/60 p-4 shadow-sm">
            <div className={`mb-3 inline-flex rounded-lg p-2 ${iconClass}`}>{icon}</div>
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-sm text-slate-400">{title}</p>
        </div>
    );
}

function TableHead({ children }: { children: ReactNode }) {
    return <th className="px-4 py-3 text-left text-sm text-slate-400">{children}</th>;
}

function FormInput({ label, value, onChange, required = false }: { label: string; value: string; onChange: (value: string) => void; required?: boolean }) {
    return (
        <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                {label} {required && <span className="text-red-400">*</span>}
            </label>
            <input
                required={required}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="w-full rounded-xl border border-[#1C2541]/60 bg-[#0B132B]/80 px-3 py-2.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition text-sm"
            />
        </div>
    );
}

function SelectInput({ label, value, options, onChange }: { label: string; value: string; options: Option[]; onChange: (value: string) => void }) {
    return (
        <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</label>
            <select
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="w-full rounded-xl border border-[#1C2541]/60 bg-[#0B132B]/80 px-3 py-2.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition text-sm"
            >
                {options.map((option) => (
                    <option key={option.value} value={option.value} className="bg-[#090E1A] text-slate-200">
                        {option.label}
                    </option>
                ))}
            </select>
        </div>
    );
}
