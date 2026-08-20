import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router, useForm } from '@inertiajs/react';
import {
    Archive,
    BarChart3,
    Calendar,
    Camera,
    Check,
    Copy,
    Download,
    Edit3,
    Eye,
    FileArchive,
    FileText,
    Folder,
    Globe2,
    Image as ImageIcon,
    LockKeyhole,
    Plus,
    RefreshCcw,
    Search,
    Share2,
    ShieldAlert,
    Trash2,
    Upload,
    X,
} from 'lucide-react';
import { FormEvent, ReactNode, useEffect, useMemo, useRef, useState } from 'react';

type Option = {
    value: string;
    label: string;
};

type DokumenFile = {
    id: number;
    originalName: string;
    url: string;
    previewUrl?: string | null;
    mimeType?: string | null;
    extension?: string | null;
    size: number;
    fileType: 'main_file' | 'cover_image' | 'attachment' | 'gallery_image' | string;
    isImage: boolean;
    isPdf: boolean;
    category?: string | null;
    directUrl?: string | null;
    createdAt?: string | null;
    exists?: boolean;
    downloadUrl?: string | null;
};

type Dokumen = {
    id: number;
    title: string;
    slug: string;
    description?: string | null;
    category: string;
    type: string;
    typeLabel: string;
    visibility: 'publik' | 'admin' | string;
    visibilityLabel: string;
    status: 'draft' | 'published' | 'archived' | string;
    statusLabel: string;
    periodMonth?: number | null;
    periodYear?: number | null;
    publishedAt?: string | null;
    createdAt?: string | null;
    createdBy?: string | null;
    files: DokumenFile[];
};

type Filters = {
    search: string;
    kategori: string;
    tipe: string;
    visibility: string;
    status: string;
    tab: string;
};

type Summary = {
    total: number;
    published: number;
    draft: number;
    archived: number;
    documentation: number;
};

type Props = {
    documents?: Dokumen[];
    filters?: Partial<Filters>;
    summary?: Partial<Summary>;
    categoryOptions?: string[];
    typeOptions?: Option[];
    visibilityOptions?: Option[];
    statusOptions?: Option[];
    flash?: {
        success?: string | null;
        error?: string | null;
    };
};

const defaultFilters: Filters = {
    search: '',
    kategori: 'all',
    tipe: 'all',
    visibility: 'all',
    status: 'all',
    tab: 'semua',
};

const defaultSummary: Summary = {
    total: 0,
    published: 0,
    draft: 0,
    archived: 0,
    documentation: 0,
};

const monthOptions = [
    { value: '', label: 'Tidak ada periode' },
    { value: '1', label: 'Januari' },
    { value: '2', label: 'Februari' },
    { value: '3', label: 'Maret' },
    { value: '4', label: 'April' },
    { value: '5', label: 'Mei' },
    { value: '6', label: 'Juni' },
    { value: '7', label: 'Juli' },
    { value: '8', label: 'Agustus' },
    { value: '9', label: 'September' },
    { value: '10', label: 'Oktober' },
    { value: '11', label: 'November' },
    { value: '12', label: 'Desember' },
];

const tabs = [
    { value: 'semua', label: 'Semua' },
    { value: 'publik', label: 'Dokumen Publik' },
    { value: 'jadwal', label: 'Jadwal' },
    { value: 'laporan', label: 'Laporan' },
    { value: 'dokumentasi', label: 'Dokumentasi' },
    { value: 'arsip', label: 'Arsip' },
];

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

function formatBytes(bytes?: number) {
    const size = Number(bytes || 0);

    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;

    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function fileMatchesAccept(file: File, accept?: string) {
    if (!accept) return true;

    const fileName = file.name.toLowerCase();
    const mimeType = file.type.toLowerCase();
    const allowed = accept
        .split(',')
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean);

    if (allowed.length === 0) return true;

    return allowed.some((rule) => {
        if (rule.startsWith('.')) return fileName.endsWith(rule);
        if (rule.endsWith('/*')) return mimeType.startsWith(rule.replace('/*', '/'));
        return mimeType === rule;
    });
}

function mergeFiles(currentFiles: File[], nextFiles: File[]) {
    const fileMap = new Map<string, File>();

    [...currentFiles, ...nextFiles].forEach((file) => {
        const relativePath = file.webkitRelativePath || file.name;
        fileMap.set(`${relativePath}-${file.size}-${file.lastModified}`, file);
    });

    return Array.from(fileMap.values());
}

function statusClass(status: string) {
    switch (status) {
        case 'published':
            return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
        case 'archived':
            return 'bg-slate-100 text-slate-700 border border-slate-200';
        default:
            return 'bg-amber-50 text-amber-700 border border-amber-200';
    }
}

function visibilityClass(visibility: string) {
    return visibility === 'publik' 
        ? 'bg-blue-50 text-blue-700 border border-blue-200' 
        : 'bg-purple-50 text-purple-700 border border-purple-200';
}

function firstFile(document: Dokumen) {
    return document.files.find((file) => file.fileType === 'main_file') ?? document.files[0];
}

function defaultFormData() {
    return {
        _method: 'post',
        judul: '',
        deskripsi: '',
        kategori: 'Jadwal',
        tipe: 'manual_upload',
        visibility: 'admin',
        status: 'draft',
        periode_bulan: '',
        periode_tahun: '',
        main_file: null as File | null,
        cover_image: null as File | null,
        folder_foto_kegiatan: [] as File[],
        folder_foto_kegiatan_paths: [] as string[],
        gallery_files: [] as File[],
        gallery_paths: [] as string[],
    };
}

const inputCls = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition text-sm';
const labelCls = 'mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600';

export default function Documents({
    documents = [],
    filters = defaultFilters,
    summary = defaultSummary,
    categoryOptions = [],
    typeOptions = [],
    visibilityOptions = [],
    statusOptions = [],
    flash,
}: Props) {
    const safeFilters: Filters = { ...defaultFilters, ...filters };
    const safeSummary: Summary = { ...defaultSummary, ...summary };

    const currentYear = new Date().getFullYear();
    const yearOptions = useMemo(() => Array.from({ length: 7 }, (_, index) => currentYear - 2 + index), [currentYear]);

    const [filterState, setFilterState] = useState<Filters>(safeFilters);
    const [selectedDocument, setSelectedDocument] = useState<Dokumen | null>(null);
    const [editingDocument, setEditingDocument] = useState<Dokumen | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [isDeletingFileId, setIsDeletingFileId] = useState<number | null>(null);

    const documentForm = useForm(defaultFormData());

    useEffect(() => {
        setFilterState(safeFilters);
    }, [filters]);

    const applyFilters = (overrides: Partial<Filters> = {}) => {
        const nextFilters = { ...filterState, ...overrides };
        setFilterState(nextFilters);

        const params: Record<string, string> = {};

        if (nextFilters.search) params.search = nextFilters.search;
        if (nextFilters.kategori !== 'all') params.kategori = nextFilters.kategori;
        if (nextFilters.tipe !== 'all') params.tipe = nextFilters.tipe;
        if (nextFilters.visibility !== 'all') params.visibility = nextFilters.visibility;
        if (nextFilters.status !== 'all') params.status = nextFilters.status;
        if (nextFilters.tab !== 'semua') params.tab = nextFilters.tab;

        router.get('/admin/documents', params, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const resetFilters = () => {
        setFilterState(defaultFilters);
        router.get('/admin/documents', {}, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const openCreateForm = () => {
        setEditingDocument(null);
        documentForm.reset();
        documentForm.setData(defaultFormData());
        documentForm.clearErrors();
        setShowForm(true);
    };

    const openEditForm = (document: Dokumen) => {
        setEditingDocument(document);
        documentForm.clearErrors();
        documentForm.setData({
            _method: 'patch',
            judul: document.title || '',
            deskripsi: document.description || '',
            kategori: document.category || 'Jadwal',
            tipe: document.type || 'manual_upload',
            visibility: (document.visibility as 'publik' | 'admin') || 'admin',
            status: (document.status as 'draft' | 'published' | 'archived') || 'draft',
            periode_bulan: document.periodMonth ? String(document.periodMonth) : '',
            periode_tahun: document.periodYear ? String(document.periodYear) : '',
            main_file: null,
            cover_image: null,
            folder_foto_kegiatan: [],
            folder_foto_kegiatan_paths: [],
            gallery_files: [],
            gallery_paths: [],
        });
        setShowForm(true);
    };

    const submitDocument = (event: FormEvent) => {
        event.preventDefault();

        if (editingDocument) {
            documentForm.post(`/admin/documents/${editingDocument.id}`, {
                preserveScroll: true,
                onSuccess: () => {
                    setShowForm(false);
                    setEditingDocument(null);
                },
            });
            return;
        }

        documentForm.post('/admin/documents', {
            preserveScroll: true,
            onSuccess: () => {
                setShowForm(false);
            },
        });
    };

    const publishDocument = (document: Dokumen) => {
        router.patch(`/admin/documents/${document.id}/publish`, {}, { preserveScroll: true });
    };

    const unpublishDocument = (document: Dokumen) => {
        router.patch(`/admin/documents/${document.id}/unpublish`, {}, { preserveScroll: true });
    };

    const archiveDocument = (document: Dokumen) => {
        if (!window.confirm('Arsipkan dokumen ini?')) return;
        router.patch(`/admin/documents/${document.id}/archive`, {}, { preserveScroll: true });
    };

    const deleteDocument = (document: Dokumen) => {
        if (!window.confirm(`Hapus dokumen "${document.title}" permanen?`)) return;
        router.delete(`/admin/documents/${document.id}`, { preserveScroll: true });
    };

    const deleteFile = (documentId: number, file: DokumenFile) => {
        if (!window.confirm(`Yakin ingin menghapus file "${file.originalName}" dari dokumen ini?`)) return;
        setIsDeletingFileId(file.id);
        router.delete(`/admin/documents/${documentId}/files/${file.id}`, {
            preserveScroll: true,
            onFinish: () => setIsDeletingFileId(null),
        });
    };

    const closeForm = () => {
        setShowForm(false);
        setEditingDocument(null);
        documentForm.clearErrors();
    };

    return (
        <AdminLayout activeMenu="documents">
            <Head title="Dokumen & Arsip RT" />

            {/* Flash Messages */}
            {flash?.success && (
                <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3.5 text-sm text-emerald-800 font-bold shadow-sm flex items-center justify-between">
                    <span>{flash.success}</span>
                </div>
            )}
            {flash?.error && (
                <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm text-red-800 font-bold shadow-sm flex items-center justify-between">
                    <span>{flash.error}</span>
                </div>
            )}

            {/* Header */}
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-emerald-700 mb-1">RT Management</p>
                    <h2 className="text-2xl font-black text-slate-900">Dokumen & Arsip RT</h2>
                    <p className="text-slate-600 text-sm mt-1">Kelola dokumen publik, laporan RT, jadwal, dan dokumentasi kegiatan warga.</p>
                </div>

                <div className="flex flex-wrap gap-2.5">
                    <button
                        type="button"
                        onClick={() => alert('Generate laporan otomatis akan dibuat setelah format laporan disepakati.')}
                        className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition shadow-sm"
                    >
                        <BarChart3 size={16} />
                        Generate Laporan
                    </button>
                    <button
                        type="button"
                        onClick={openCreateForm}
                        className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 transition"
                    >
                        <Plus size={16} />
                        Tambah Dokumen
                    </button>
                </div>
            </div>

            {/* Stats Summary Grid */}
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <SummaryCard icon={<Folder size={22} />} label="Total Dokumen" value={safeSummary.total} />
                <SummaryCard icon={<Globe2 size={22} />} label="Dipublish" value={safeSummary.published} />
                <SummaryCard icon={<Edit3 size={22} />} label="Draft" value={safeSummary.draft} />
                <SummaryCard icon={<Archive size={22} />} label="Arsip" value={safeSummary.archived} />
                <SummaryCard icon={<Camera size={22} />} label="Dokumentasi" value={safeSummary.documentation} />
            </div>

            {/* Main Content Area */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                {/* Tabs */}
                <div className="flex items-center overflow-x-auto border-b border-slate-200 px-6 scrollbar-none bg-slate-50">
                    {tabs.map((tab) => (
                        <button
                            key={tab.value}
                            type="button"
                            onClick={() => applyFilters({ tab: tab.value })}
                            className={`whitespace-nowrap border-b-2 px-4 py-4 text-sm font-bold transition duration-200 ${
                                filterState.tab === tab.value
                                    ? 'border-emerald-600 text-emerald-700'
                                    : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Filter & Search Bar */}
                <div className="border-b border-slate-200 bg-slate-50/50 p-5">
                    <div className="flex flex-col gap-4 lg:flex-row">
                        <div className="relative flex-1">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                value={filterState.search}
                                onChange={(event) => setFilterState((current) => ({ ...current, search: event.target.value }))}
                                onKeyDown={(event) => event.key === 'Enter' && applyFilters()}
                                placeholder="Cari judul dokumen..."
                                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-11 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                            />
                        </div>

                        <div className="flex flex-wrap gap-2.5">
                            <SelectFilter label="Kategori" value={filterState.kategori} onChange={(value) => setFilterState((current) => ({ ...current, kategori: value }))} options={categoryOptions.map((item) => ({ value: item, label: item }))} />
                            <SelectFilter label="Tipe" value={filterState.tipe} onChange={(value) => setFilterState((current) => ({ ...current, tipe: value }))} options={typeOptions} />
                            <SelectFilter label="Visibility" value={filterState.visibility} onChange={(value) => setFilterState((current) => ({ ...current, visibility: value }))} options={visibilityOptions} />
                            <SelectFilter label="Status" value={filterState.status} onChange={(value) => setFilterState((current) => ({ ...current, status: value }))} options={statusOptions} />

                            <button type="button" onClick={() => applyFilters()} className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 transition">
                                Terapkan
                            </button>
                            <button type="button" onClick={resetFilters} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 transition">
                                Reset
                            </button>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[800px]">
                        <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wider text-slate-600">
                            <tr>
                                <th className="px-5 py-4 font-bold">Judul</th>
                                <th className="px-5 py-4 font-bold">Kategori</th>
                                <th className="px-5 py-4 font-bold">Tipe</th>
                                <th className="px-5 py-4 text-center font-bold">Visibility</th>
                                <th className="px-5 py-4 text-center font-bold">Status</th>
                                <th className="px-5 py-4 font-bold">Tanggal Publish</th>
                                <th className="px-5 py-4 text-center font-bold">File</th>
                                <th className="px-5 py-4 text-right font-bold">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {documents.map((document) => {
                                const mainFile = firstFile(document);

                                return (
                                    <tr key={document.id} className="transition duration-200 hover:bg-slate-50/80 text-slate-800">
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3.5">
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700">
                                                    {document.type === 'event_documentation' ? <Camera size={18} /> : document.category === 'Jadwal' ? <Calendar size={18} /> : <FileText size={18} />}
                                                </div>
                                                <div className="min-w-[220px]">
                                                    <p className="font-bold text-slate-900 leading-tight">{document.title}</p>
                                                    <p className="line-clamp-1 text-xs text-slate-500 mt-1">{document.description || 'Tidak ada deskripsi'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-sm font-semibold text-slate-700">{document.category}</td>
                                        <td className="px-5 py-4 text-sm text-slate-600">{document.typeLabel}</td>
                                        <td className="px-5 py-4 text-center">
                                            <span className={`rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider ${visibilityClass(document.visibility)}`}>{document.visibilityLabel}</span>
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            <span className={`rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider ${statusClass(document.status)}`}>{document.statusLabel}</span>
                                        </td>
                                        <td className="px-5 py-4 text-sm text-slate-600">{formatDate(document.publishedAt)}</td>
                                        <td className="px-5 py-4 text-center">
                                            {mainFile ? (
                                                <a href={mainFile.previewUrl || mainFile.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-700 hover:text-emerald-800 hover:underline">
                                                    <Download size={14} />
                                                    {document.files.length}
                                                </a>
                                            ) : (
                                                <span className="text-sm text-slate-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <IconButton label="Detail" onClick={() => setSelectedDocument(document)} icon={<Eye size={17} />} />
                                                {document.status === 'published' ? (
                                                    <IconButton label="Unpublish" onClick={() => unpublishDocument(document)} icon={<RefreshCcw size={17} />} />
                                                ) : (
                                                    <IconButton label="Publish" onClick={() => publishDocument(document)} icon={<Globe2 size={17} />} />
                                                )}
                                                <IconButton label="Edit" onClick={() => openEditForm(document)} icon={<Edit3 size={17} />} />
                                                <IconButton label="Arsipkan" onClick={() => archiveDocument(document)} icon={<Archive size={17} />} />
                                                <IconButton label="Hapus" onClick={() => deleteDocument(document)} icon={<Trash2 size={17} />} danger />
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Empty State */}
                {documents.length === 0 && (
                    <div className="flex flex-col items-center justify-center px-4 py-20 text-center">
                        <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700">
                            <FileArchive size={36} />
                        </div>
                        <h3 className="mb-2 text-lg font-bold text-slate-900">Belum ada dokumen</h3>
                        <p className="mb-6 max-w-md text-sm text-slate-600 leading-relaxed">Tambahkan dokumen pertama untuk mengelola jadwal, laporan, dokumentasi, dan dokumen publik homepage RT.</p>
                        <button type="button" onClick={openCreateForm} className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 transition">
                            Tambah Dokumen
                        </button>
                    </div>
                )}
            </div>

            {/* Banner Penyimpanan Aman */}
            <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-6 relative overflow-hidden">
                <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl" />
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 border border-emerald-200 text-emerald-700">
                            <LockKeyhole size={22} className="animate-pulse" />
                        </div>
                        <div>
                            <h4 className="text-base font-bold text-slate-900">Sistem Penyimpanan Dokumen Aman</h4>
                            <p className="text-slate-600 text-sm mt-1">Seluruh berkas laporan pertanggungjawaban, regulasi, dan arsip sensitif disimpan dalam penyimpanan terenkripsi yang aman.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-800">
                            <ShieldAlert size={13} />
                            Standar ISO 27001
                        </span>
                    </div>
                </div>
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={closeForm} />
                    <div className="relative max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">
                        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
                            <div>
                                <h3 className="text-lg font-black text-slate-900">{editingDocument ? 'Edit Dokumen' : 'Tambah Dokumen'}</h3>
                                <p className="text-xs text-slate-500 mt-0.5">Dokumen dengan status published dan visibility publik akan tampil di homepage.</p>
                            </div>
                            <button type="button" onClick={closeForm} className="rounded-xl p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={submitDocument} className="space-y-6 p-6">
                            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                                <FormInput label="Judul Dokumen" value={documentForm.data.judul} onChange={(value) => documentForm.setData('judul', value)} error={documentForm.errors.judul} required />
                                <FormSelect label="Kategori" value={documentForm.data.kategori} onChange={(value) => documentForm.setData('kategori', value)} options={categoryOptions.map((item) => ({ value: item, label: item }))} error={documentForm.errors.kategori} />
                                <FormSelect label="Tipe Dokumen" value={documentForm.data.tipe} onChange={(value) => documentForm.setData('tipe', value)} options={typeOptions} error={documentForm.errors.tipe} />
                                <FormSelect label="Visibility" value={documentForm.data.visibility} onChange={(value) => documentForm.setData('visibility', value)} options={visibilityOptions} error={documentForm.errors.visibility} />
                                <FormSelect label="Status" value={documentForm.data.status} onChange={(value) => documentForm.setData('status', value)} options={statusOptions} error={documentForm.errors.status} />
                                <div className="grid grid-cols-2 gap-3.5">
                                    <FormSelect label="Periode Bulan" value={documentForm.data.periode_bulan} onChange={(value) => documentForm.setData('periode_bulan', value)} options={monthOptions} error={documentForm.errors.periode_bulan} />
                                    <FormSelect label="Periode Tahun" value={documentForm.data.periode_tahun} onChange={(value) => documentForm.setData('periode_tahun', value)} options={[{ value: '', label: '-' }, ...yearOptions.map((year) => ({ value: String(year), label: String(year) }))]} error={documentForm.errors.periode_tahun} />
                                </div>
                            </div>

                            <div>
                                <label className={labelCls}>Deskripsi</label>
                                <textarea
                                    value={documentForm.data.deskripsi}
                                    onChange={(event) => documentForm.setData('deskripsi', event.target.value)}
                                    rows={4}
                                    className={inputCls}
                                    placeholder="Deskripsi singkat dokumen..."
                                />
                                {documentForm.errors.deskripsi && <p className="mt-1.5 text-xs text-red-600">{documentForm.errors.deskripsi}</p>}
                            </div>

                            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                                <FileInput label="File Utama (Masuk Berkas ZIP)" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.webp" onChange={(file) => documentForm.setData('main_file', file)} error={documentForm.errors.main_file} helper="PDF, Word, Excel, PowerPoint, atau gambar. Maks 10 MB." />
                                <FileInput label="Cover / Gambar Header (Head pada Homepage)" accept=".jpg,.jpeg,.png,.webp" onChange={(file) => documentForm.setData('cover_image', file)} error={documentForm.errors.cover_image} helper="Opsional. Khusus gambar (JPG, JPEG, PNG, WEBP). Maks 10 MB. Tampil di banner/hero slider bagian atas homepage." />
                            </div>

                            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                                <MultiFileInput
                                    label="Folder Foto Kegiatan"
                                    accept=".jpg,.jpeg,.png,.webp"
                                    files={documentForm.data.folder_foto_kegiatan || []}
                                    onChange={(files) => {
                                        documentForm.setData((prev: any) => ({
                                            ...prev,
                                            folder_foto_kegiatan: files,
                                            folder_foto_kegiatan_paths: files.map(f => f.webkitRelativePath || f.name)
                                        }));
                                    }}
                                    error={documentForm.errors.folder_foto_kegiatan}
                                    folderPicker
                                    helper="Pilih satu folder berisi foto kegiatan. Format JPG, JPEG, PNG, atau WEBP. Maksimal 10 MB per foto."
                                />
                                <MultiFileInput
                                    label="Foto Galeri Kegiatan"
                                    accept=".jpg,.jpeg,.png,.webp"
                                    files={documentForm.data.gallery_files || []}
                                    onChange={(files) => {
                                        documentForm.setData((prev: any) => ({
                                            ...prev,
                                            gallery_files: files,
                                            gallery_paths: files.map(f => f.webkitRelativePath || f.name)
                                        }));
                                    }}
                                    error={documentForm.errors.gallery_files}
                                    helper="Khusus gambar (JPG, JPEG, PNG, WEBP). Maks 10 MB. Tampil di section Galeri Kegiatan homepage."
                                />
                            </div>

                            {editingDocument && editingDocument.files.length > 0 && (
                                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-6">
                                    <p className="text-sm font-black uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-2">File yang sudah tersimpan</p>
                                    
                                    {['main', 'cover', 'attachment', 'gallery'].map((cat) => {
                                        const groupedFiles = editingDocument.files.filter((f) => {
                                            const fileCat = f.category || (f.fileType === 'main_file' ? 'main' : f.fileType === 'cover_image' ? 'cover' : f.fileType === 'gallery_image' ? 'gallery' : 'attachment');
                                            return fileCat === cat;
                                        });

                                        if (groupedFiles.length === 0) return null;

                                        const categoryTitles: Record<string, string> = {
                                            main: 'File Utama',
                                            cover: 'Cover / Gambar Header',
                                            attachment: 'Folder Foto Kegiatan',
                                            gallery: 'Foto Galeri Kegiatan',
                                        };

                                        return (
                                            <div key={cat} className="space-y-2.5">
                                                <h5 className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                                                     {categoryTitles[cat]}
                                                </h5>
                                                <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
                                                    {groupedFiles.map((file) => (
                                                        <StoredFileRow key={file.id} file={file} onDelete={() => deleteFile(editingDocument.id, file)} isDeleting={isDeletingFileId === file.id} />
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                             <div className="flex flex-col-reverse sm:flex-row justify-end gap-3.5 border-t border-slate-200 pt-5">
                                <button type="button" onClick={closeForm} className="w-full sm:w-auto rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-100 transition">
                                    Batal
                                </button>
                                <button type="submit" disabled={documentForm.processing} className="w-full sm:w-auto rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 transition disabled:opacity-60">
                                    {documentForm.processing ? 'Menyimpan...' : editingDocument ? 'Update Dokumen' : 'Simpan Dokumen'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Detail Modal */}
            {selectedDocument && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSelectedDocument(null)} />
                    <div className="relative h-full w-full max-w-2xl overflow-y-auto bg-white border-l border-slate-200 shadow-2xl p-6">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6">
                            <div>
                                <h3 className="text-lg font-black text-slate-900">Detail Dokumen</h3>
                                <p className="text-xs text-slate-500 mt-0.5">Preview data, file, dan status publish dokumen.</p>
                            </div>
                            <button type="button" onClick={() => setSelectedDocument(null)} className="rounded-xl p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <h4 className="mb-2 text-xl font-black text-slate-900 leading-tight">{selectedDocument.title}</h4>
                                <p className="text-sm text-slate-600 leading-relaxed">{selectedDocument.description || 'Tidak ada deskripsi.'}</p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Info label="Kategori" value={selectedDocument.category} />
                                <Info label="Tipe" value={selectedDocument.typeLabel} />
                                <Info label="Visibility" value={selectedDocument.visibilityLabel} />
                                <Info label="Status" value={selectedDocument.statusLabel} />
                                <Info label="Tanggal Publish" value={formatDate(selectedDocument.publishedAt)} />
                                <Info label="Dibuat Oleh" value={selectedDocument.createdBy || '-'} />
                            </div>

                             <div className="flex flex-wrap gap-2.5 pt-2 border-t border-slate-200">
                                 {selectedDocument.status === 'published' ? (
                                     <button type="button" onClick={() => unpublishDocument(selectedDocument)} className="w-full sm:w-auto text-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-100 transition">
                                         Unpublish
                                     </button>
                                 ) : (
                                     <button type="button" onClick={() => publishDocument(selectedDocument)} className="w-full sm:w-auto text-center justify-center rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 transition">
                                         Publish
                                     </button>
                                 )}
                                 <button type="button" onClick={() => openEditForm(selectedDocument)} className="w-full sm:w-auto text-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-100 transition">
                                     Edit
                                 </button>
                                 <button type="button" onClick={() => archiveDocument(selectedDocument)} className="w-full sm:w-auto text-center justify-center rounded-xl border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-bold text-red-700 hover:bg-red-100 transition">
                                     Arsipkan
                                 </button>
                                 <button type="button" onClick={() => { deleteDocument(selectedDocument); setSelectedDocument(null); }} className="w-full sm:w-auto text-center justify-center rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-red-700 transition">
                                     Hapus Permanen
                                 </button>
                             </div>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}

function SummaryCard({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-300 hover:border-emerald-500/40 hover:shadow-md">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700">
                {icon}
            </div>
            <div className="flex items-baseline gap-1.5">
                <p className="text-3xl font-black text-slate-900 leading-none">{value || 0}</p>
            </div>
            <p className="text-sm font-semibold text-slate-600 mt-2">{label}</p>
        </div>
    );
}

function SelectFilter({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Option[] }) {
    return (
        <select value={value} onChange={(event) => onChange(event.target.value)} className="min-w-[145px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-emerald-500 transition">
            <option value="all" className="bg-white text-slate-400">{label}</option>
            {options.map((option) => (
                <option key={option.value} value={option.value} className="bg-white text-slate-800">
                    {option.label}
                </option>
            ))}
        </select>
    );
}

function FormInput({ label, value, onChange, error, required = false }: { label: string; value: string; onChange: (value: string) => void; error?: string; required?: boolean }) {
    return (
        <div>
            <label className={labelCls}>
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <input value={value} onChange={(event) => onChange(event.target.value)} required={required} className={inputCls} />
            {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
        </div>
    );
}

function FormSelect({ label, value, onChange, options, error }: { label: string; value: string; onChange: (value: string) => void; options: Option[]; error?: string }) {
    return (
        <div>
            <label className={labelCls}>{label}</label>
            <select value={value} onChange={(event) => onChange(event.target.value)} className={inputCls}>
                {options.map((option) => (
                    <option key={option.value} value={option.value} className="bg-white text-slate-800">
                        {option.label}
                    </option>
                ))}
            </select>
            {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
        </div>
    );
}

function FileInput({ label, accept, onChange, error, helper }: { label: string; accept: string; onChange: (file: File | null) => void; error?: string; helper?: string }) {
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    useEffect(() => {
        if (!selectedFile) {
            setPreviewUrl(null);
            return;
        }

        if (selectedFile.type.startsWith('image/')) {
            const url = URL.createObjectURL(selectedFile);
            setPreviewUrl(url);
            return () => URL.revokeObjectURL(url);
        } else {
            setPreviewUrl(null);
        }
    }, [selectedFile]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        setSelectedFile(file);
        onChange(file);
    };

    const clearFile = () => {
        setSelectedFile(null);
        setPreviewUrl(null);
        onChange(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-center justify-between mb-1.5">
                <label className={labelCls}>{label}</label>
                {selectedFile && (
                    <button
                        type="button"
                        onClick={clearFile}
                        className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-bold text-red-600 hover:bg-red-100 hover:text-red-700 transition shadow-sm"
                        title="Hapus file yang dipilih"
                        aria-label="Hapus file yang dipilih"
                    >
                        <Trash2 size={13} />
                        Hapus File
                    </button>
                )}
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept={accept}
                onChange={handleFileChange}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-emerald-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
            />

            {selectedFile && (
                <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                    <div className="flex items-center gap-2.5 min-w-0">
                        {previewUrl ? (
                            <img src={previewUrl} alt="Preview" className="h-10 w-10 rounded-lg object-cover border border-slate-200 shrink-0" />
                        ) : (
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 text-xs">
                                {selectedFile.name.split('.').pop()?.toUpperCase() || 'FILE'}
                            </div>
                        )}
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-bold text-slate-900" title={selectedFile.name}>{selectedFile.name}</p>
                            <p className="text-[10px] text-slate-500 font-medium">{formatBytes(selectedFile.size)}</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={clearFile}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
                        title="Hapus file ini"
                        aria-label="Hapus file ini"
                    >
                        <X size={15} />
                    </button>
                </div>
            )}

            {helper && <p className="mt-2 text-xs text-slate-500">{helper}</p>}
            {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
        </div>
    );
}

function MultiFileInput({
    label,
    accept,
    onChange,
    error,
    helper,
    files = [],
    folderPicker = false,
}: {
    label: string;
    accept: string;
    onChange: (files: File[]) => void;
    error?: string;
    helper?: string;
    files?: File[];
    folderPicker?: boolean;
}) {
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const folderInputRef = useRef<HTMLInputElement | null>(null);
    const [previews, setPreviews] = useState<Record<string, string>>({});

    useEffect(() => {
        const newPreviews: Record<string, string> = {};
        const revokeUrls: string[] = [];

        files.forEach((file) => {
            if (file.type.startsWith('image/')) {
                const key = `${file.name}-${file.size}-${file.lastModified}`;
                const url = URL.createObjectURL(file);
                newPreviews[key] = url;
                revokeUrls.push(url);
            }
        });

        setPreviews(newPreviews);

        return () => {
            revokeUrls.forEach((url) => URL.revokeObjectURL(url));
        };
    }, [files]);

    const appendFiles = (selectedFiles: File[]) => {
        const allowedFiles = selectedFiles.filter((file) => fileMatchesAccept(file, accept));
        onChange(mergeFiles(files, allowedFiles));

        if (fileInputRef.current) fileInputRef.current.value = '';
        if (folderInputRef.current) folderInputRef.current.value = '';
    };

    const removeFile = (indexToRemove: number) => {
        const updatedFiles = files.filter((_, index) => index !== indexToRemove);
        onChange(updatedFiles);
    };

    const clearFiles = () => {
        onChange([]);
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (folderInputRef.current) folderInputRef.current.value = '';
    };

    return (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-center justify-between mb-1.5">
                <label className={labelCls}>{label}</label>
                {files.length > 0 && (
                    <button
                        type="button"
                        onClick={clearFiles}
                        className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-bold text-red-600 hover:bg-red-100 hover:text-red-700 transition shadow-sm"
                        title="Hapus semua file yang dipilih"
                        aria-label="Hapus semua file yang dipilih"
                    >
                        <Trash2 size={13} />
                        Hapus Semua ({files.length})
                    </button>
                )}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept={accept}
                    onChange={(event) => appendFiles(Array.from(event.target.files ?? []))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-emerald-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                />

                {folderPicker && (
                    <>
                        <input
                            ref={folderInputRef}
                            type="file"
                            multiple
                            accept={accept}
                            onChange={(event) => appendFiles(Array.from(event.target.files ?? []))}
                            className="hidden"
                            {...({ webkitdirectory: '', directory: '' } as Record<string, string>)}
                        />
                        <button
                            type="button"
                            onClick={() => folderInputRef.current?.click()}
                            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100"
                        >
                            <Folder size={15} />
                            Pilih Folder
                        </button>
                    </>
                )}
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-slate-500">{helper || 'Bisa pilih lebih dari satu file.'}</p>
            </div>

            {files.length > 0 && (
                <div className="mt-4 rounded-xl bg-white border border-slate-200 p-4">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-bold text-slate-700">{files.length} file dipilih</p>
                        <button
                            type="button"
                            onClick={clearFiles}
                            className="text-xs font-bold text-red-600 hover:text-red-700 hover:underline flex items-center gap-1"
                            title="Hapus semua pilihan"
                            aria-label="Hapus semua pilihan"
                        >
                            <Trash2 size={12} />
                            Hapus Semua
                        </button>
                    </div>
                    <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
                        {files.map((file, index) => {
                            const key = `${file.name}-${file.size}-${file.lastModified}`;
                            const previewUrl = previews[key];

                            return (
                                <div key={`${key}-${index}`} className="flex items-center justify-between gap-3 text-xs text-slate-800 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        {previewUrl ? (
                                            <img src={previewUrl} alt="preview" className="w-8 h-8 rounded object-cover shrink-0 border border-slate-200" />
                                        ) : (
                                            <div className="w-8 h-8 rounded bg-white flex items-center justify-center shrink-0 border border-slate-200 text-emerald-700 font-bold uppercase text-[9px]">
                                                {file.name.split('.').pop() || 'file'}
                                            </div>
                                        )}
                                        <span className="min-w-0 truncate font-semibold text-slate-900" title={file.webkitRelativePath || file.name}>
                                            {file.webkitRelativePath || file.name}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className="text-slate-500 text-[10px] font-medium">{formatBytes(file.size)}</span>
                                        <button
                                            type="button"
                                            onClick={() => removeFile(index)}
                                            className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
                                            title={`Hapus "${file.name}" dari pilihan`}
                                            aria-label={`Hapus ${file.name}`}
                                        >
                                            <X size={15} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
        </div>
    );
}

function IconButton({ label, onClick, icon, danger = false }: { label: string; onClick: () => void; icon: ReactNode; danger?: boolean }) {
    return (
        <button 
            type="button" 
            title={label} 
            onClick={onClick} 
            className={`rounded-xl p-2 transition duration-200 border ${
                danger 
                    ? 'text-red-700 border-red-200 bg-red-50 hover:bg-red-100 hover:text-red-800' 
                    : 'text-slate-600 border-slate-200 bg-white hover:bg-slate-100 hover:text-slate-900'
            }`}
        >
            {icon}
        </button>
    );
}

function StoredFileRow({ file, onDelete, isDeleting = false }: { file: DokumenFile; onDelete: () => void; isDeleting?: boolean }) {
    const [copied, setCopied] = useState(false);

    const categoryLabels: Record<string, string> = {
        main: 'File Utama',
        cover: 'Cover',
        attachment: 'Folder Foto Kegiatan',
        gallery: 'Foto Galeri Kegiatan',
    };

    const fileUrl = file.directUrl || file.previewUrl || file.url;

    const copyLink = () => {
        if (!fileUrl) return;
        const absoluteUrl = fileUrl.startsWith('http') ? fileUrl : `${window.location.origin}${fileUrl}`;
        navigator.clipboard.writeText(absoluteUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const getIcon = () => {
        if (file.isImage) {
            return (
                <div className="relative h-10 w-10 shrink-0 rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                    <img src={fileUrl} alt={file.originalName} className="h-full w-full object-cover" />
                </div>
            );
        }
        return (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700">
                {file.isPdf ? <FileText size={18} /> : <Upload size={18} />}
            </div>
        );
    };

    return (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 w-full shadow-sm">
            <div className="flex min-w-0 items-center gap-3 flex-1">
                {getIcon()}
                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-900 max-w-[180px] sm:max-w-[220px] md:max-w-[280px]" title={file.originalName}>
                        {file.originalName}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-[10px] font-semibold">
                        <span className="rounded bg-emerald-50 text-emerald-700 px-1.5 py-0.5 border border-emerald-200 uppercase tracking-wider">
                            {file.category ? (categoryLabels[file.category] || file.category) : 'File'}
                        </span>
                        <span className="text-slate-500">{formatBytes(file.size)}</span>
                        {file.createdAt && <span className="text-slate-400">· {formatDate(file.createdAt)}</span>}
                        {file.exists !== undefined && (
                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] ${
                                file.exists 
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                    : 'bg-red-50 text-red-700 border border-red-200'
                            }`}>
                                <span className={`h-1.5 w-1.5 rounded-full ${file.exists ? 'bg-emerald-600 animate-pulse' : 'bg-red-600'}`} />
                                {file.exists ? 'Tersedia' : 'Hilang'}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* 5 Icon Action Buttons with size={18}, p-2 padding, title tooltips & high-contrast colors */}
            <div className="flex shrink-0 items-center gap-1">
                {/* 1. View/Preview */}
                <a
                    href={file.previewUrl || file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-xl p-2 text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-200 transition"
                    title="Preview / Lihat File"
                    aria-label="Preview / Lihat File"
                >
                    <Eye size={18} />
                </a>

                {/* 2. Download */}
                <a
                    href={file.downloadUrl || file.url}
                    className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition"
                    title="Download File"
                    aria-label="Download File"
                >
                    <Download size={18} />
                </a>

                {/* 3. Share / Copy Link */}
                <button
                    type="button"
                    onClick={copyLink}
                    className="rounded-xl p-2 text-purple-600 hover:bg-purple-50 border border-transparent hover:border-purple-200 transition"
                    title={copied ? 'Link Disalin!' : 'Salin Link File'}
                    aria-label="Salin Link File"
                >
                    {copied ? <Check size={18} className="text-purple-700" /> : <Share2 size={18} />}
                </button>

                {/* 4. Edit / Info */}
                <button
                    type="button"
                    onClick={() => alert(`Nama: ${file.originalName}\nKategori: ${file.category || 'File'}\nUkuran: ${formatBytes(file.size)}\nType: ${file.mimeType || file.extension}`)}
                    className="rounded-xl p-2 text-amber-600 hover:bg-amber-50 border border-transparent hover:border-amber-200 transition"
                    title="Informasi Detail File"
                    aria-label="Informasi Detail File"
                >
                    <Edit3 size={18} />
                </button>

                {/* 5. Delete/Hapus */}
                <button
                    type="button"
                    onClick={onDelete}
                    disabled={isDeleting}
                    className="rounded-xl p-2 text-red-600 hover:bg-red-50 hover:text-red-700 border border-transparent hover:border-red-200 transition disabled:opacity-50"
                    title="Hapus File Permanen"
                    aria-label="Hapus File Permanen"
                >
                    {isDeleting ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                    ) : (
                        <Trash2 size={18} />
                    )}
                </button>
            </div>
        </div>
    );
}

function Info({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
            <p className="font-bold text-slate-900 mt-1 text-sm">{value}</p>
        </div>
    );
}
