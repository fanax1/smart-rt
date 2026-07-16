import WargaLayout, { WargaProfile } from '@/Layouts/WargaLayout';
import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    Bell,
    ChevronDown,
    Download,
    FileText,
    Search,
    Star,
    X,
    Plus,
    ChevronLeft,
    ChevronRight,
    Image as ImageIcon
} from 'lucide-react';
import { useMemo, useState } from 'react';

type AnnouncementFile = {
    id: number;
    originalName?: string;
    url?: string;
    mimeType?: string | null;
    size?: number;
};

type Announcement = {
    id: number;
    judul?: string;
    title?: string;
    isi?: string;
    body?: string;
    kategori?: string;
    category?: string;
    publishedAt?: string | null;
    date?: string | null;
    creator?: string | null;
    files?: AnnouncementFile[];
};

type Filters = {
    search?: string;
    kategori?: string;
};

type Props = {
    profile?: WargaProfile;
    announcements?: Announcement[];
    filters?: Filters;
    categories?: string[];
};

const fallbackProfile: WargaProfile = {
    name: 'Warga',
    initials: 'WG',
    houseNumber: '-',
    hasLinkedWarga: false,
};

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

function formatFileSize(size?: number) {
    if (!size) return '-';
    if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function getCategoryBadgeStyle(category?: string) {
    const cat = String(category || '').toLowerCase();
    if (cat.includes('penting')) {
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
    }
    if (cat.includes('keamanan')) {
        return 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20';
    }
    if (cat.includes('kegiatan')) {
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
    }
    if (cat.includes('iuran') || cat.includes('keuangan')) {
        return 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20';
    }
    if (cat.includes('informasi') || cat.includes('kesehatan')) {
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
    }
    return 'bg-slate-800 text-slate-400 border border-slate-700/60';
}

function getAnnouncementImage(item: Announcement) {
    const imageFile = item.files?.find(f => f.mimeType?.startsWith('image/'));
    if (imageFile?.url) {
        return imageFile.url;
    }

    const title = (item.judul || item.title || '').toLowerCase();
    const category = (item.kategori || item.category || '').toLowerCase();

    if (title.includes('cctv') || title.includes('keamanan') || category.includes('keamanan')) {
        return 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=600&q=80';
    }
    if (title.includes('kerja bakti') || title.includes('fogging') || title.includes('gotong royong') || category.includes('kegiatan')) {
        return 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&w=600&q=80';
    }
    if (title.includes('iuran') || title.includes('rekapitulasi') || title.includes('kas rt') || category.includes('iuran') || category.includes('keuangan')) {
        return 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80';
    }
    if (title.includes('digital') || title.includes('sistem') || title.includes('aplikasi') || category.includes('informasi')) {
        return 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=600&q=80';
    }
    if (title.includes('solar') || title.includes('led') || title.includes('jalan') || title.includes('penerangan')) {
        return 'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=600&q=80';
    }
    if (category.includes('kesehatan') || title.includes('sehat') || title.includes('dbd') || title.includes('vaksin')) {
        return 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=600&q=80';
    }
    
    return 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80';
}

export default function Pengumuman({ profile = fallbackProfile, announcements = [], filters, categories = [] }: Props) {
    const data = Array.isArray(announcements) ? announcements : [];
    const [searchTerm, setSearchTerm] = useState(filters?.search ?? '');
    const [categoryFilter, setCategoryFilter] = useState(filters?.kategori ?? 'all');
    const [selected, setSelected] = useState<Announcement | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    const categoryList = useMemo(() => {
        const fromData = data.map((item) => item.kategori || item.category).filter(Boolean) as string[];
        return Array.from(new Set([...(categories || []), ...fromData]));
    }, [categories, data]);

    const handleSearch = (text: string) => {
        setSearchTerm(text);
        setCurrentPage(1);
    };

    const handleCategorySelect = (category: string) => {
        setCategoryFilter(category);
        setCurrentPage(1);
    };

    const filtered = useMemo(() => {
        const search = searchTerm.toLowerCase();

        return data.filter((item) => {
            const title = item.judul || item.title || '';
            const body = item.isi || item.body || '';
            const category = item.kategori || item.category || '';
            const matchSearch = title.toLowerCase().includes(search) || body.toLowerCase().includes(search) || category.toLowerCase().includes(search);
            const matchCategory = categoryFilter === 'all' || category.toLowerCase() === categoryFilter.toLowerCase();

            return matchSearch && matchCategory;
        });
    }, [categoryFilter, data, searchTerm]);

    const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
    
    // Paginated subset
    const paginatedItems = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filtered.slice(start, start + itemsPerPage);
    }, [filtered, currentPage]);

    return (
        <WargaLayout profile={profile} title="Pengumuman" searchQuery={searchTerm} onSearchChange={handleSearch}>
            <Head title="Pengumuman Warga" />

            <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 lg:px-8 lg:py-8">
                {/* Header Back & Titles */}
                <div className="flex items-center gap-3">
                    <Link href="/warga/dashboard" className="rounded-xl bg-[#131b2e] border border-slate-800 p-2 text-slate-400 hover:text-slate-200 transition">
                        <ArrowLeft size={16} />
                    </Link>
                    <div>
                        <h1 className="text-xl font-black text-slate-100 tracking-tight">Pengumuman Warga</h1>
                        <p className="text-xs text-slate-500 mt-0.5">Tetap terinformasi dengan berita terbaru, aturan lingkungan, dan jadwal kegiatan rutin di wilayah RT kita.</p>
                    </div>
                </div>

                {/* Mobile Search Input */}
                <div className="lg:hidden relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => handleSearch(e.target.value)}
                        placeholder="Cari pengumuman..."
                        className="w-full rounded-2xl border border-slate-800 bg-[#131b2e] py-3 pl-10 pr-4 text-xs text-slate-200 placeholder-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    />
                </div>

                {/* Category Filters row */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-none">
                    <button
                        type="button"
                        onClick={() => handleCategorySelect('all')}
                        className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition ${
                            categoryFilter === 'all' 
                                ? 'bg-emerald-400 text-slate-950 shadow-md shadow-emerald-400/10' 
                                : 'bg-[#131b2e] border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                        }`}
                    >
                        Semua
                    </button>
                    {categoryList.map((category) => (
                        <button
                            key={category}
                            type="button"
                            onClick={() => handleCategorySelect(category)}
                            className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition capitalize ${
                                categoryFilter === category 
                                    ? 'bg-emerald-400 text-slate-950 shadow-md shadow-emerald-400/10' 
                                    : 'bg-[#131b2e] border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                            }`}
                        >
                            {category}
                        </button>
                    ))}
                </div>

                {/* Grid Layout of Cards */}
                {filtered.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-slate-800 bg-[#0b1220] p-12 text-center text-xs text-slate-500">
                        <Bell size={36} className="mx-auto text-slate-600 mb-2" />
                        <span>Tidak ada pengumuman yang ditemukan untuk pencarian atau kategori ini.</span>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {paginatedItems.map((item) => {
                            const title = item.judul || item.title || '-';
                            const body = item.isi || item.body || '-';
                            const category = item.kategori || item.category || 'Umum';
                            return (
                                <div 
                                    key={item.id} 
                                    className="rounded-3xl border border-slate-800 bg-[#0b1220] overflow-hidden shadow-xl hover:border-slate-700/85 hover:shadow-2xl transition-all duration-300 flex flex-col justify-between group lg:col-span-1"
                                >
                                    <div>
                                        {/* Card Cover Image */}
                                        <div className="relative w-full overflow-hidden bg-slate-950/40 shrink-0 flex items-center justify-center h-48 border-b border-slate-800/60">
                                            <div 
                                                className="absolute inset-0 bg-cover bg-center blur-md opacity-20 scale-105 pointer-events-none" 
                                                style={{ backgroundImage: `url(${getAnnouncementImage(item)})` }}
                                            />
                                            <img 
                                                src={getAnnouncementImage(item)} 
                                                alt={title}
                                                className="relative w-full h-full object-contain mx-auto transition duration-500 group-hover:scale-[1.03]"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-[#0b1220] via-transparent to-transparent opacity-60" />
                                        </div>

                                        {/* Details Container */}
                                        <div className="p-5 space-y-3">
                                            <div className="flex items-center gap-2">
                                                <span className={`rounded-md px-2 py-0.5 text-[9px] font-extrabold tracking-wide uppercase ${getCategoryBadgeStyle(category)}`}>
                                                    {category}
                                                </span>
                                                <span className="text-[10px] text-slate-500 font-medium">
                                                    {formatDate(item.publishedAt || item.date)}
                                                </span>
                                            </div>

                                            <h2 className="text-base font-black text-slate-100 leading-snug tracking-tight group-hover:text-emerald-400 transition-colors">
                                                {title}
                                            </h2>

                                            <p className="text-xs text-slate-400 leading-relaxed font-medium line-clamp-3">
                                                {body}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Action row at bottom of card */}
                                    <div className="p-5 pt-0 mt-auto">
                                        <button 
                                            type="button" 
                                            onClick={() => setSelected(item)}
                                            className="w-full py-2.5 rounded-xl border border-slate-800/80 hover:bg-[#131b2e] hover:border-slate-700 hover:text-emerald-400 text-xs font-bold text-slate-350 text-center transition flex items-center justify-center gap-1.5"
                                        >
                                            <span>Baca Selengkapnya</span>
                                            <ArrowLeft size={13} className="rotate-180 mt-0.5 stroke-[2]" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-1.5 pt-6">
                        <button
                            type="button"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            className="rounded-xl border border-slate-800 bg-[#0b1220] p-2 text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:hover:text-slate-400 transition"
                        >
                            <ChevronLeft size={14} />
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <button
                                key={page}
                                type="button"
                                onClick={() => setCurrentPage(page)}
                                className={`h-8 w-8 rounded-xl text-xs font-black transition ${
                                    currentPage === page 
                                        ? 'bg-emerald-400 text-slate-950 shadow-md shadow-emerald-400/10' 
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
                            className="rounded-xl border border-slate-800 bg-[#0b1220] p-2 text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:hover:text-slate-400 transition"
                        >
                            <ChevronRight size={14} />
                        </button>
                    </div>
                )}
            </div>

            {/* Modal: View Announcement Detail */}
            {selected && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl bg-[#0b1220] border border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="flex items-start justify-between gap-4 border-b border-slate-800/80 p-5 bg-[#131b2e]/30">
                            <div>
                                <span className={`rounded-md px-2 py-0.5 text-[9px] font-extrabold tracking-wide uppercase inline-block ${getCategoryBadgeStyle(selected.kategori || selected.category)}`}>
                                    {selected.kategori || selected.category || 'Umum'}
                                </span>
                                <h3 className="text-base font-black text-slate-100 leading-snug tracking-tight mt-2">{selected.judul || selected.title}</h3>
                                <p className="mt-1 text-[10px] text-slate-500 font-bold">{formatDate(selected.publishedAt || selected.date)}</p>
                            </div>
                            <button type="button" onClick={() => setSelected(null)} className="rounded-xl p-1.5 text-slate-400 hover:bg-[#131b2e] hover:text-slate-200 transition">
                                <X size={18} />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-5 overflow-y-auto space-y-5 flex-1 scrollbar-thin scrollbar-thumb-slate-800">
                            {/* Cover Image */}
                            {(() => {
                                const coverSrc = getAnnouncementImage(selected);
                                return coverSrc ? (
                                    <div className="relative w-full overflow-hidden bg-slate-950/60 border border-slate-800/80 rounded-2xl flex items-center justify-center">
                                        <div 
                                            className="absolute inset-0 bg-cover bg-center blur-md opacity-20 scale-105 pointer-events-none" 
                                            style={{ backgroundImage: `url(${coverSrc})` }}
                                        />
                                        <img 
                                            src={coverSrc} 
                                            alt={selected.judul || selected.title} 
                                            className="relative max-h-[300px] w-auto max-w-full object-contain mx-auto transition-all" 
                                        />
                                    </div>
                                ) : null;
                            })()}

                            <div className="whitespace-pre-line rounded-2xl bg-[#131b2e]/30 border border-slate-850 p-4 text-xs leading-relaxed text-slate-350 font-medium">
                                {selected.isi || selected.body}
                            </div>

                            {/* Attachments List */}
                            {(selected.files?.length ?? 0) > 0 && (
                                <div className="space-y-3">
                                    <h4 className="flex items-center gap-2 text-xs font-black text-slate-300 uppercase tracking-wider">
                                        <FileText size={14} className="text-emerald-400" />
                                        <span>Dokumen Lampiran</span>
                                    </h4>
                                    <div className="space-y-2">
                                        {selected.files?.map((file) => (
                                            <div key={file.id} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-850 bg-[#131b2e]/20 p-3">
                                                <div className="min-w-0">
                                                    <p className="text-xs font-bold text-slate-200 truncate">{file.originalName || 'Lampiran'}</p>
                                                    <p className="text-[10px] text-slate-500 font-semibold">{formatFileSize(file.size)}</p>
                                                </div>
                                                {file.url && (
                                                    <a 
                                                        href={file.url} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer" 
                                                        className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#131b2e] border border-slate-800 hover:bg-[#1a243d] hover:text-slate-150 px-3.5 py-2 text-xs font-bold text-slate-300 transition"
                                                    >
                                                        <Download size={13} className="text-emerald-400" />
                                                        <span>Download</span>
                                                    </a>
                                                )}
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
                                onClick={() => setSelected(null)}
                                className="rounded-xl bg-[#131b2e] hover:bg-[#1a243d] border border-slate-800 px-4 py-2.5 text-xs font-bold text-slate-300 transition"
                            >
                                Tutup Pengumuman
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Floating Action Button (FAB) for Complaints */}
            <Link 
                href="/warga/pengaduan" 
                className="fixed bottom-6 right-6 lg:bottom-8 lg:right-8 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-400 hover:bg-emerald-300 text-slate-950 shadow-lg shadow-emerald-400/20 active:scale-95 transition"
                title="Lapor Aduan"
            >
                <Plus size={22} className="stroke-[3]" />
            </Link>
        </WargaLayout>
    );
}
