import StrukturKeanggotaan from '@/Components/Public/StrukturKeanggotaan';
import SmartRtChatbot from '@/Components/Public/SmartRtChatbot';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    Bell,
    Calendar,
    Camera,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Clock,
    Download,
    FileText,
    Home,
    LayoutDashboard,
    LogOut,
    Mail,
    MapPin,
    Menu,
    MessageCircle,
    Phone,
    Users,
    X,
    Zap,
    Newspaper,
    LayoutGrid,
    User,
} from 'lucide-react';
import { ReactNode, useEffect, useMemo, useState } from 'react';

// Inline social icons not available in lucide-react v1.x
function InstagramIcon({ size = 17 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
        </svg>
    );
}
function YoutubeIcon({ size = 17 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.41 19.1C5.12 19.56 12 19.56 12 19.56s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95 29 29 0 0 0 .46-5.32 29 29 0 0 0-.46-5.33z" />
            <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="currentColor" stroke="none" />
        </svg>
    );
}
function WhatsappIcon({ size = 17 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.456 5.709 1.457h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413" fill="currentColor" />
        </svg>
    );
}

type SiteProfile = {
    rtName: string;
    title: string;
    tagline?: string | null;
    subtitle: string;
    address?: string | null;
    email?: string | null;
    phone?: string | null;
    logoUrl?: string | null;
    accentColor?: string | null;
    footerText?: string | null;
    copyright?: string | null;
    waLink?: string | null;
    instagram?: string | null;
    facebook?: string | null;
    youtube?: string | null;
    gmapsUrl?: string | null;
    gmapsEmbedUrl?: string | null;
    emergencyContacts?: Array<{ label: string; phone: string }>;
};

type PublicFile = {
    id: number;
    originalName: string;
    url: string;
    mimeType?: string | null;
    size?: number;
};

type Announcement = {
    id: number;
    title: string;
    excerpt?: string;
    content?: string;
    category?: string;
    publishedAt?: string | null;
    isPinned?: boolean;
    imageUrl?: string | null;
    files?: PublicFile[];
};

type EventParticipant = {
    id: number;
    warga_id?: number | null;
    user_id?: number | null;
    name: string;
    initials?: string;
    houseNumber?: string | null;
    joinedAt?: string | null;
};

type EventItem = {
    id: number;
    title: string;
    date?: string | null;
    time?: string | null;
    location?: string | null;
    type?: string | null;
    description?: string | null;
    status?: string | null;
    participantsCount?: number;
    participants?: EventParticipant[];
    isJoined?: boolean;
    canJoin?: boolean;
    imageUrl?: string | null;
    hasilKegiatan?: string | null;
    fotoDokumentasi?: string[];
};

type PublicDocument = {
    id: number;
    title: string;
    description?: string | null;
    category?: string | null;
    type?: string | null;
    publishedAt?: string | null;
    files: Array<{
        id: number;
        originalName: string;
        url: string;
        mimeType?: string | null;
        size: number;
        fileType: string;
        category?: string | null;
        isImage?: boolean;
    }>;
};

type GalleryItem = {
    id: number;
    title: string;
    imageUrl: string;
    publishedAt?: string | null;
    description?: string | null;
    category?: string | null;
    fileName?: string | null;
    fileSize?: number;
};

type StatItem = {
    label: string;
    value: string;
    unit: string;
};

type CommitteePeriod = {
    id: string;
    tahun: string;
    label: string;
    status: string;
    anggota: Array<{
        id: number;
        nama: string;
        jabatan: string;
        jabatanSingkat?: string;
        phone?: string | null;
        email?: string | null;
        avatar?: string;
        foto?: string | null;
        deskripsi?: string | null;
        isKetua?: boolean;
    }>;
};

type PublicComplaint = {
    id: number;
    judul: string;
    kategori?: string | null;
    prioritas?: string | null;
    status?: string | null;
    excerpt?: string | null;
    tanggal?: string | null;
    authorName?: string;
    authorInitials?: string;
    authorAvatar?: string | null;
    houseNumber?: string | null;
    commentCount?: number;
};

type Props = {
    site?: SiteProfile;
    stats?: StatItem[];
    announcements?: Announcement[];
    events?: EventItem[];
    documents?: PublicDocument[];
    gallery?: GalleryItem[];
    heroImages?: GalleryItem[];
    committeePeriods?: CommitteePeriod[];
    complaints?: PublicComplaint[];
};

type AuthUser = {
    id: number;
    name: string;
    email: string;
    role?: string | null;
    warga_id?: number | null;
    is_active?: boolean;
    profile_photo_url?: string | null;
};

type SharedPageProps = {
    auth?: {
        user?: AuthUser | null;
    };
};

const navLinks = [
    { id: 'beranda', label: 'Beranda' },
    { id: 'struktur', label: 'Struktur RT' },
    { id: 'layanan', label: 'Layanan' },
    { id: 'berita', label: 'Berita' },
    { id: 'kegiatan', label: 'Kegiatan' },
    { id: 'galeri', label: 'Galeri' },
    { id: 'dokumen', label: 'Dokumen' },
    { id: 'kontak', label: 'Kontak' },
];

// ─── Status / priority helpers ───────────────────────────────────────────────
const statusConfig: Record<string, { label: string; icon: string; cls: string }> = {
    diajukan: { label: 'Menunggu', icon: 'schedule', cls: 'bg-slate-100 text-slate-700 border border-slate-200' },
    diproses: { label: 'Diproses', icon: 'sync', cls: 'bg-blue-50 text-blue-700 border border-blue-200' },
    selesai: { label: 'Selesai', icon: 'check_circle', cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
    ditolak: { label: 'Ditolak', icon: 'cancel', cls: 'bg-red-50 text-red-700 border border-red-200' },
};
const priorityConfig: Record<string, { label: string; icon: string; cls: string }> = {
    darurat: { label: 'Darurat', icon: 'priority_high', cls: 'text-rose-600 font-bold' },
    tinggi: { label: 'Urgent', icon: 'priority_high', cls: 'text-rose-600 font-bold' },
    sedang: { label: 'Sedang', icon: 'eco', cls: 'text-emerald-700 font-bold' },
    rendah: { label: 'Info', icon: 'info', cls: 'text-blue-700 font-bold' },
};
const kategoriConfig: Record<string, { label: string; icon: string; cls: string }> = {
    lingkungan: { label: 'Lingkungan', icon: 'eco', cls: 'text-emerald-700' },
    keamanan: { label: 'Keamanan', icon: 'minor_crash', cls: 'text-amber-700' },
    fasilitas: { label: 'Fasilitas', icon: 'construction', cls: 'text-indigo-700' },
    sosial: { label: 'Sosial', icon: 'groups', cls: 'text-emerald-700' },
    administrasi: { label: 'Administrasi', icon: 'description', cls: 'text-blue-700' },
    lainnya: { label: 'Lainnya', icon: 'help', cls: 'text-slate-600' },
};

// ─── Announcement category ────────────────────────────────────────────────────
const announcementBadge: Record<string, string> = {
    umum: 'bg-blue-50 text-blue-700 border border-blue-200',
    penting: 'bg-red-50 text-red-700 border border-red-200',
    kegiatan: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    iuran: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    sosial: 'bg-teal-50 text-teal-700 border border-teal-200',
    keamanan: 'bg-amber-50 text-amber-700 border border-amber-200',
};
function annBadgeClass(cat?: string | null) {
    const key = (cat || 'umum').toLowerCase();
    return announcementBadge[key] || 'bg-slate-100 text-slate-700 border border-slate-200';
}
function annLabel(cat?: string | null) {
    if (!cat) return 'Umum';
    return cat.charAt(0).toUpperCase() + cat.slice(1);
}

// ─── Document icon helper ─────────────────────────────────────────────────────
function docIcon(cat?: string | null) {
    const c = (cat || '').toLowerCase();
    if (c.includes('laporan') || c.includes('keuangan')) return { icon: 'picture_as_pdf', cls: 'bg-red-50 text-red-600 border border-red-200' };
    if (c.includes('peraturan') || c.includes('tata')) return { icon: 'description', cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200' };
    if (c.includes('formulir') || c.includes('form')) return { icon: 'contact_page', cls: 'bg-blue-50 text-blue-700 border border-blue-200' };
    if (c.includes('agenda') || c.includes('kalender')) return { icon: 'calendar_month', cls: 'bg-indigo-50 text-indigo-700 border border-indigo-200' };
    return { icon: 'folder', cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200' };
}

function formatFileSize(size?: number) {
    if (!size) return '-';
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDateIndonesian(date: Date): string {
    const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

function parseIndonesianDate(dateStr: string): Date | null {
    if (!dateStr) return null;
    const parts = dateStr.split(' ');
    if (parts.length < 3) return null;

    const dayNum = parseInt(parts[0], 10);
    const monthStr = parts[1].toLowerCase();
    const yearNum = parseInt(parts[2], 10);

    const months = [
        'januari', 'februari', 'maret', 'april', 'mei', 'juni',
        'juli', 'agustus', 'september', 'oktober', 'november', 'desember'
    ];
    const monthIndex = months.indexOf(monthStr);
    if (monthIndex === -1) return null;

    return new Date(yearNum, monthIndex, dayNum);
}

function getEventStatus(eventDateStr?: string | null): 'selesai' | 'sedang berlangsung' | 'coming soon' {
    if (!eventDateStr) return 'coming soon';
    const date = parseIndonesianDate(eventDateStr);
    if (!date) return 'coming soon';

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);

    if (date.getTime() < today.getTime()) {
        return 'selesai';
    } else if (date.getTime() === today.getTime()) {
        return 'sedang berlangsung';
    } else {
        return 'coming soon';
    }
}

// ─── Default stats ─────────────────────────────────────────────────────────────
const defaultStats: StatItem[] = [
    { label: 'Total Warga', value: '0', unit: 'jiwa' },
    { label: 'Kartu Keluarga', value: '0', unit: 'KK' },
    { label: 'Kegiatan Tahun Ini', value: '0', unit: 'agenda' },
    { label: 'Tingkat Iuran', value: '0', unit: '%' },
];

// ─── Main Component ───────────────────────────────────────────────────────────
export default function HomePage({
    site,
    stats = [],
    announcements = [],
    events = [],
    documents = [],
    gallery = [],
    heroImages = [],
    committeePeriods = [],
    complaints = [],
}: Props) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
    const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);
    const [activeHeroIndex, setActiveHeroIndex] = useState(0);
    const [galleryModalOpen, setGalleryModalOpen] = useState(false);
    const [selectedGalleryItem, setSelectedGalleryItem] = useState<GalleryItem | null>(null);
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
    const [selectedParticipantsEvent, setSelectedParticipantsEvent] = useState<EventItem | null>(null);
    const [selectedDetailEvent, setSelectedDetailEvent] = useState<EventItem | null>(null);
    const [detailModalTab, setDetailModalTab] = useState<'info' | 'dokumentasi'>('info');
    const [eventLightboxUrl, setEventLightboxUrl] = useState<string | null>(null);
    const [activeSection, setActiveSection] = useState('beranda');

    const openEventDetailModal = (event: EventItem, initialTab?: 'info' | 'dokumentasi') => {
        setSelectedDetailEvent(event);
        if (initialTab) {
            setDetailModalTab(initialTab);
        } else {
            const isSelesai = (event.status || '').toLowerCase() === 'selesai';
            setDetailModalTab(isSelesai ? 'dokumentasi' : 'info');
        }
    };

    const activeTab = useMemo<string>(() => {
        if (activeSection === 'beranda') return 'beranda';
        if (activeSection === 'struktur') return 'struktur';
        if (activeSection === 'layanan') return 'layanan';
        if (['berita', 'kegiatan'].includes(activeSection)) return 'berita';
        if (['galeri', 'dokumen'].includes(activeSection)) return 'galeri';
        if (['kontak', 'diskusi'].includes(activeSection)) return 'kontak';
        return 'beranda';
    }, [activeSection]);

    const [showCalendarModal, setShowCalendarModal] = useState(false);
    const [selectedCalendarModalDate, setSelectedCalendarModalDate] = useState<string | null>(null);
    const [selectedStatusFilter, setSelectedStatusFilter] = useState('semua');

    const getMonthDaysHelper = useMemo(() => {
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth();

        const firstDayIndex = new Date(year, month, 1).getDay();
        const totalDays = new Date(year, month + 1, 0).getDate();

        const days = [];
        for (let i = 0; i < firstDayIndex; i++) {
            days.push(null);
        }
        for (let i = 1; i <= totalDays; i++) {
            const dateObj = new Date(year, month, i);
            days.push({
                dayNum: i,
                dateObj: dateObj,
                matchStr: formatDateIndonesian(dateObj)
            });
        }
        return days;
    }, []);

    const modalFilteredEvents = useMemo(() => {
        return events.filter(e => {
            if (selectedCalendarModalDate) {
                return e.date === selectedCalendarModalDate;
            }
            if (selectedStatusFilter !== 'semua') {
                const status = getEventStatus(e.date);
                return status === selectedStatusFilter;
            }
            return true;
        });
    }, [events, selectedCalendarModalDate, selectedStatusFilter]);

    // States for search, filter and share functions
    const [newsSearch, setNewsSearch] = useState('');
    const [newsCategory, setNewsCategory] = useState('semua');
    const [showAllNews, setShowAllNews] = useState(false);

    const [docSearch, setDocSearch] = useState('');
    const [docCategory, setDocCategory] = useState('semua');
    const [showAllDocs, setShowAllDocs] = useState(false);

    const [showAllEvents, setShowAllEvents] = useState(false);

    const [galleryCategory, setGalleryCategory] = useState('semua');
    const [showAllGallery, setShowAllGallery] = useState(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);

    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const safeSite: SiteProfile = site ?? {
        rtName: 'RT 004',
        title: 'SMART-RT',
        subtitle: 'Portal resmi informasi warga dan layanan administrasi RT.',
        emergencyContacts: [],
    };

    const { auth, flash } = usePage().props as any;
    const authUser = auth?.user ?? null;
    const isLoggedIn = Boolean(authUser);
    const isAdmin = authUser?.role === 'admin';
    const isWargaLoggedIn = Boolean(authUser && !isAdmin && (authUser.role === 'warga' || authUser.warga_id));
    const dashboardUrl = isAdmin ? '/admin/dashboard' : '/warga/dashboard';
    const dashboardLabel = isAdmin ? 'Dashboard Admin' : 'Dashboard Warga';
    const roleLabel = isAdmin ? 'Admin' : 'Warga';
    const firstName = authUser?.name?.split(' ')[0] ?? 'Warga';
    const userInitials = (authUser?.name ?? 'U')
        .split(' ').filter(Boolean).slice(0, 2)
        .map((p: any) => p[0]).join('').toUpperCase();

    const handleShare = async (title: string, url?: string) => {
        const shareUrl = url || window.location.href;
        const shareData = {
            title: title || 'SMART-RT 004',
            text: 'Lihat informasi SMART-RT 004',
            url: shareUrl,
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
                return;
            }
        } catch (err) {
            // share failed
        }

        try {
            await navigator.clipboard.writeText(shareUrl);
            setToastMessage('Tautan berhasil disalin.');
            setTimeout(() => setToastMessage(null), 3000);
        } catch (err) {
            // copy failed
        }
    };

    // Extract dynamic categories
    const newsCategories = useMemo(() => {
        const cats = new Set(announcements.map(a => a.category?.trim()).filter(Boolean) as string[]);
        return ['semua', ...Array.from(cats)];
    }, [announcements]);

    const docCategories = useMemo(() => {
        const cats = new Set(documents.map(d => d.category?.trim()).filter(Boolean) as string[]);
        return ['semua', ...Array.from(cats)];
    }, [documents]);

    const galleryCategories = useMemo(() => {
        const cats = new Set(gallery.map(g => g.category?.trim()).filter(Boolean) as string[]);
        return ['semua', ...Array.from(cats)];
    }, [gallery]);

    // Generate horizontal calendar days
    const calendarDays = useMemo(() => {
        const days = [];
        const dayNames = ['MNG', 'SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB'];
        const today = new Date();
        for (let i = -2; i <= 4; i++) {
            const d = new Date();
            d.setDate(today.getDate() + i);
            days.push({
                dayNum: d.getDate(),
                dayName: dayNames[d.getDay()],
                matchStr: formatDateIndonesian(d)
            });
        }
        return days;
    }, []);

    const currentMonthLabel = useMemo(() => {
        const months = [
            'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
            'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
        ];
        return months[new Date().getMonth()];
    }, []);

    // Apply filters
    const filteredAnnouncements = useMemo(() => {
        const keyword = newsSearch.trim().toLowerCase();
        return announcements.filter(item => {
            const matchesSearch = !keyword ||
                item.title?.toLowerCase().includes(keyword) ||
                item.content?.toLowerCase().includes(keyword) ||
                item.excerpt?.toLowerCase().includes(keyword);

            const matchesCategory = newsCategory === 'semua' ||
                (item.category || '').toLowerCase() === newsCategory.toLowerCase();

            return matchesSearch && matchesCategory;
        });
    }, [announcements, newsSearch, newsCategory]);

    const filteredDocuments = useMemo(() => {
        const keyword = docSearch.trim().toLowerCase();
        return documents.filter(item => {
            const matchesSearch = !keyword ||
                item.title?.toLowerCase().includes(keyword) ||
                item.description?.toLowerCase().includes(keyword);

            const matchesCategory = docCategory === 'semua' ||
                (item.category || '').toLowerCase() === docCategory.toLowerCase();

            return matchesSearch && matchesCategory;
        });
    }, [documents, docSearch, docCategory]);

    const filteredGallery = useMemo(() => {
        return gallery.filter(item => {
            return galleryCategory === 'semua' ||
                (item.category || '').toLowerCase() === galleryCategory.toLowerCase();
        });
    }, [gallery, galleryCategory]);

    const displayedAnnouncements = useMemo(() => {
        const limit = showAllNews ? filteredAnnouncements.length : (isMobile ? 4 : 3);
        return filteredAnnouncements.slice(0, limit);
    }, [filteredAnnouncements, showAllNews, isMobile]);

    const displayedDocuments = useMemo(() => {
        return showAllDocs ? filteredDocuments : filteredDocuments.slice(0, 3);
    }, [filteredDocuments, showAllDocs]);

    const filteredEvents = useMemo(() => {
        return events.filter(e => {
            if (!selectedCalendarDate) return true;
            return e.date === selectedCalendarDate;
        });
    }, [events, selectedCalendarDate]);

    const displayedEvents = useMemo(() => {
        return showAllEvents ? filteredEvents : filteredEvents.slice(0, 3);
    }, [filteredEvents, showAllEvents]);

    const latestAnnouncements = useMemo(() => announcements.slice(0, 6), [announcements]);
    const heroList = useMemo(() => heroImages.length > 0 ? heroImages : gallery, [heroImages, gallery]);
    const activeHero = useMemo(() => heroList.length > 0 ? heroList[activeHeroIndex % heroList.length] : null, [heroList, activeHeroIndex]);
    const activeGallery = useMemo(() => gallery.length > 0 ? gallery[activeGalleryIndex % gallery.length] : null, [gallery, activeGalleryIndex]);
    const displayedGallery = useMemo(() => {
        return showAllGallery ? filteredGallery : filteredGallery.slice(0, 4);
    }, [filteredGallery, showAllGallery]);
    const galleryPreviewItems = displayedGallery;

    // Auto-advance hero slider randomly
    useEffect(() => {
        if (heroList.length <= 1 || galleryModalOpen || selectedGalleryItem) return;
        const timer = window.setInterval(() => {
            setActiveHeroIndex((prev) => {
                if (heroList.length <= 1) return 0;
                let next = prev;
                while (next === prev && heroList.length > 1) {
                    next = Math.floor(Math.random() * heroList.length);
                }
                return next;
            });
        }, 4500);
        return () => window.clearInterval(timer);
    }, [heroList.length, galleryModalOpen, selectedGalleryItem]);

    // Auto-advance gallery slider randomly
    useEffect(() => {
        if (gallery.length <= 1 || galleryModalOpen || selectedGalleryItem) return;
        const timer = window.setInterval(() => {
            setActiveGalleryIndex((prev) => {
                if (gallery.length <= 1) return 0;
                let next = prev;
                while (next === prev && gallery.length > 1) {
                    next = Math.floor(Math.random() * gallery.length);
                }
                return next;
            });
        }, 5000);
        return () => window.clearInterval(timer);
    }, [gallery.length, galleryModalOpen, selectedGalleryItem]);

    // Escape key listener to close all modals
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setSelectedAnnouncement(null);
                setSelectedParticipantsEvent(null);
                setGalleryModalOpen(false);
                setSelectedGalleryItem(null);
                setShowCalendarModal(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    useEffect(() => {
        if (heroList.length > 0 && activeHeroIndex >= heroList.length) setActiveHeroIndex(0);
    }, [heroList.length, activeHeroIndex]);

    useEffect(() => {
        if (gallery.length > 0 && activeGalleryIndex >= gallery.length) setActiveGalleryIndex(0);
    }, [gallery.length, activeGalleryIndex]);

    // Scrollspy
    useEffect(() => {
        const sections = navLinks.map((l) => document.getElementById(l.id)).filter(Boolean) as HTMLElement[];
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((e) => { if (e.isIntersecting) setActiveSection(e.target.id); });
            },
            { threshold: 0.35 },
        );
        sections.forEach((s) => observer.observe(s));
        return () => observer.disconnect();
    }, []);

    const goToPreviousHero = () => {
        if (heroList.length <= 1) return;
        setActiveHeroIndex((prev) => {
            let next = prev;
            while (next === prev) {
                next = Math.floor(Math.random() * heroList.length);
            }
            return next;
        });
    };
    const goToNextHero = () => {
        if (heroList.length <= 1) return;
        setActiveHeroIndex((prev) => {
            let next = prev;
            while (next === prev) {
                next = Math.floor(Math.random() * heroList.length);
            }
            return next;
        });
    };
    const goToPreviousGallery = () => {
        if (gallery.length <= 1) return;
        setActiveGalleryIndex((prev) => {
            let next = prev;
            while (next === prev) {
                next = Math.floor(Math.random() * gallery.length);
            }
            return next;
        });
    };
    const goToNextGallery = () => {
        if (gallery.length <= 1) return;
        setActiveGalleryIndex((prev) => {
            let next = prev;
            while (next === prev) {
                next = Math.floor(Math.random() * gallery.length);
            }
            return next;
        });
    };

    const openGalleryDetail = (item: GalleryItem, index?: number) => {
        if (typeof index === 'number') setActiveGalleryIndex(index);
        setSelectedGalleryItem(item);
    };

    const joinEvent = (event: EventItem) => {
        if (!isWargaLoggedIn) { router.visit('/login'); return; }
        router.post(`/warga/kegiatan/${event.id}/ikut`, {}, { preserveScroll: true });
    };

    const cancelJoinEvent = (event: EventItem) => {
        router.delete(`/warga/kegiatan/${event.id}/batal`, { preserveScroll: true });
    };

    const serviceCards = [
        { label: 'Iuran Bulanan', icon: 'payments', href: isLoggedIn ? '/warga/iuran' : '/login' },
        { label: 'Pengajuan Surat', icon: 'description', href: isLoggedIn ? '/warga/ajukan-surat' : '/login' },
        { label: 'Pengaduan Warga', icon: 'campaign', href: isLoggedIn ? '/warga/pengaduan' : '/login' },
        { label: 'Pengumuman RT', icon: 'notifications_active', href: '#berita' },
        { label: 'Kegiatan RT', icon: 'event_available', href: '#kegiatan' },
        { label: 'Dokumen Warga', icon: 'folder_shared', href: '#dokumen' },
    ];

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
            <Head title={`${safeSite.title} | Portal Digital Warga`} />

            {/* ── Emergency Bar ── */}
            <div className="flex items-center justify-between bg-red-700 px-4 py-1.5 text-xs text-white">
                <div className="flex flex-wrap items-center gap-3 font-mono">
                    <span className="flex items-center gap-1 font-semibold">
                        <span className="material-symbols-outlined text-[14px]">emergency</span>
                        Kontak Darurat:
                    </span>
                    {(safeSite.emergencyContacts ?? []).length > 0
                        ? (safeSite.emergencyContacts ?? []).map((c) => (
                            <a key={`${c.label}-${c.phone}`} href={`tel:${c.phone}`} className="font-bold hover:underline">
                                {c.label} {c.phone}
                            </a>
                        ))
                        : <span className="font-semibold">Hubungi pengurus RT untuk keadaan darurat.</span>
                    }
                </div>
                {!isLoggedIn && (
                    <Link href="/login" className="hidden font-semibold hover:underline sm:inline">Masuk Portal</Link>
                )}
            </div>

            {/* ── Sticky Navbar ── */}
            <nav className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur glass-nav">
                <div className="mx-auto flex h-16 lg:h-20 max-w-container-max items-center justify-between px-margin-mobile md:px-margin-desktop">
                    {/* Logo */}
                    <a href="#beranda" className="flex items-center gap-3 min-w-0 mr-4">
                        {safeSite.logoUrl ? (
                            <img src={safeSite.logoUrl} alt={safeSite.title} className="h-9 w-9 lg:h-10 lg:w-10 rounded-xl object-cover shrink-0" />
                        ) : (
                            <div className="flex h-9 w-9 lg:h-10 lg:w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <Home size={18} />
                            </div>
                        )}
                        <div className="min-w-0">
                            <p className="text-sm lg:text-lg font-extrabold leading-none text-slate-900 truncate" title={safeSite.title}>{safeSite.title}</p>
                            <p className="text-[9px] lg:text-[10px] font-bold uppercase tracking-widest text-emerald-700 mt-1">{safeSite.rtName}</p>
                        </div>
                    </a>

                    {/* Desktop nav */}
                    <div className="hidden items-center gap-1 lg:flex">
                        {navLinks.map((link) => (
                            <a
                                key={link.id}
                                href={`#${link.id}`}
                                className={[
                                    'relative rounded-full px-4 py-2 text-sm font-bold transition',
                                    activeSection === link.id
                                        ? 'text-emerald-700 active-dot'
                                        : 'text-slate-600 hover:text-emerald-700',
                                ].join(' ')}
                            >
                                {link.label}
                            </a>
                        ))}
                    </div>

                    {/* Header actions */}
                    <div className="flex items-center gap-3">
                        {isLoggedIn && authUser ? (
                            <ProfileDropdown
                                authUser={authUser}
                                dashboardLabel={dashboardLabel}
                                dashboardUrl={dashboardUrl}
                                profileMenuOpen={profileMenuOpen}
                                roleLabel={roleLabel}
                                userInitials={userInitials}
                                firstName={firstName}
                                setProfileMenuOpen={setProfileMenuOpen}
                            />
                        ) : (
                            <>
                                <Link href="/login" className="rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs lg:text-sm font-bold text-slate-700 hover:text-emerald-700 hover:bg-slate-50 transition">
                                    Masuk
                                </Link>
                                <Link href="/warga/dashboard" className="hidden lg:inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-emerald-700 active:scale-95">
                                    <LayoutDashboard size={16} /> Portal Warga
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            <main className="pb-24 lg:pb-0">
                {/* Flash Messages */}
                {flash?.error && (
                    <div className="mx-auto max-w-container-max px-margin-mobile md:px-margin-desktop mt-6">
                        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 font-bold shadow-sm flex items-center justify-between">
                            <span>{flash.error}</span>
                        </div>
                    </div>
                )}
                {flash?.success && (
                    <div className="mx-auto max-w-container-max px-margin-mobile md:px-margin-desktop mt-6">
                        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700 font-bold shadow-sm flex items-center justify-between">
                            <span>{flash.success}</span>
                        </div>
                    </div>
                )}
                {/* ── 1. Hero ── */}
                <section id="beranda" className="relative overflow-hidden pt-12 sm:pt-16 pb-12 bg-gradient-to-b from-emerald-50/60 via-slate-50 to-white">
                    <div className="absolute -left-24 top-24 h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl animate-pulse" />
                    <div className="absolute -right-20 bottom-10 h-80 w-80 rounded-full bg-emerald-400/10 blur-3xl animate-pulse" />

                    <div className="relative mx-auto grid max-w-container-max items-center gap-10 px-margin-mobile md:px-margin-desktop py-4 md:py-12 md:grid-cols-2">
                        <div className="space-y-5 text-left">
                            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 text-emerald-700">
                                <span className="material-symbols-outlined text-sm font-bold text-emerald-600 animate-bounce">bolt</span>
                                <span className="text-[10px] font-black uppercase tracking-widest">
                                    INOVASI WARGA DIGITAL
                                </span>
                            </div>

                            <h1 className="text-4xl sm:text-5xl font-black leading-tight tracking-tight text-slate-900 md:text-5xl lg:text-6xl">
                                {isLoggedIn ? (
                                    <>Selamat Datang,<br className="sm:hidden" /><span className="text-emerald-600"> {firstName}!</span></>
                                ) : (
                                    <>Transformasi <span className="text-emerald-600">Digital</span> untuk Lingkungan yang Harmonis.</>
                                )}
                            </h1>

                            <p className="max-w-lg text-xs sm:text-sm leading-relaxed text-slate-600">
                                {isLoggedIn
                                    ? "Semoga hari Anda menyenangkan! Akses portal warga untuk memantau iuran, surat administratif, dan informasi rukun tetangga."
                                    : "Saatnya RT 004 melangkah lebih maju. Urus dokumen administrasi, cek iuran berkala, dan pantau info terkini jadi lebih mudah kapan saja."}
                            </p>

                            <div className="flex flex-row gap-3 pt-1 w-full max-w-sm">
                                {isLoggedIn ? (
                                    <>
                                        <Link href={dashboardUrl} className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 py-3.5 text-xs font-bold text-white shadow-md transition active:scale-95">
                                            {dashboardLabel} <span className="material-symbols-outlined text-[16px]">dashboard</span>
                                        </Link>
                                        {!isAdmin && (
                                            <Link href="/warga/iuran" className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-3.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition active:scale-95">
                                                Cek Iuran <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                                            </Link>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <Link href="/warga/dashboard" className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 py-3.5 text-xs font-bold text-white shadow-md transition active:scale-95">
                                            Portal Warga
                                        </Link>
                                        <Link href="/login" className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-3.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition active:scale-95">
                                            Cek Iuran
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Hero gallery card */}
                        <div className="relative group w-full">
                            <div className="absolute -inset-4 rounded-full bg-emerald-400/10 blur-3xl" />
                            <div className="relative rounded-3xl border border-slate-200 bg-white/90 p-3 shadow-xl backdrop-blur-sm">
                                <div className="overflow-hidden rounded-2xl bg-slate-100">
                                    {heroList.length > 0 && activeHero ? (
                                        <div className="relative h-[320px] sm:h-[380px]">
                                            <button type="button" onClick={() => openGalleryDetail(activeHero, activeHeroIndex)} className="block h-full w-full text-left">
                                                <img src={activeHero.imageUrl} alt={activeHero.title} className="h-full w-full object-cover transition duration-700 hover:scale-105" />
                                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/30 to-transparent" />
                                                <div className="absolute bottom-0 left-0 right-0 p-6">
                                                    <span className="mb-2.5 inline-block rounded-xl bg-purple-500/20 border border-purple-500/30 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-purple-300">
                                                        {activeHero.category || 'Momen Warga'}
                                                    </span>
                                                    <h3 className="line-clamp-2 text-lg md:text-xl font-bold text-white">{activeHero.title}</h3>
                                                    <p className="mt-1 text-xs text-slate-300 font-semibold">{activeHero.publishedAt || ''}</p>
                                                </div>
                                            </button>
                                            {heroList.length > 1 && (
                                                <>
                                                    <button type="button" onClick={goToPreviousHero} aria-label="Sebelumnya" className="absolute left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-slate-700 border border-slate-200 backdrop-blur transition hover:bg-white">
                                                        <ChevronLeft size={20} />
                                                    </button>
                                                    <button type="button" onClick={goToNextHero} aria-label="Berikutnya" className="absolute right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-slate-700 border border-slate-200 backdrop-blur transition hover:bg-white">
                                                        <ChevronRight size={20} />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex h-[320px] items-center justify-center sm:h-[380px]">
                                            <div className="text-center p-8">
                                                <Camera size={48} className="mx-auto mb-3 text-slate-400" />
                                                <p className="font-bold text-slate-600">Belum ada foto galeri</p>
                                                <p className="mt-2 text-xs text-slate-500">Foto kegiatan akan tampil di sini setelah admin mempublishnya.</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {heroList.length > 1 && (
                                    <div className="mt-3 flex justify-center gap-1.5">
                                        {heroList.map((_, i) => (
                                            <button key={i} type="button" onClick={() => setActiveHeroIndex(i)}
                                                className={['h-1.5 rounded-full transition', i === activeHeroIndex ? 'w-6 bg-emerald-600' : 'w-1.5 bg-slate-300'].join(' ')}
                                                aria-label={`Foto ${i + 1}`}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── 2. Quick Stats ── */}
                <section className="relative -mt-8 z-10 px-margin-mobile md:px-margin-desktop">
                    <div className="mx-auto max-w-container-max">
                        <div className="grid grid-cols-2 gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-xl md:grid-cols-4">
                            {(stats.length > 0 ? stats : defaultStats).map((stat, i) => (
                                <StatCard key={stat.label} stat={stat} index={i} />
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── 3. Layanan Warga Digital ── */}
                <section id="layanan" className="py-stack-lg">
                    <div className="mx-auto max-w-container-max px-margin-mobile md:px-margin-desktop">
                        <div className="mb-10 text-center">
                            <span className="text-xs font-bold uppercase tracking-widest text-emerald-700">Layanan</span>
                            <h2 className="mt-1 text-3xl font-black text-slate-900 md:text-4xl">Layanan Warga Digital</h2>
                            <p className="mt-2 text-slate-600 max-w-xl mx-auto">Akses cepat semua kebutuhan administratif dan komunitas dalam satu platform.</p>
                        </div>
                        <div className="grid grid-cols-2 gap-gutter md:grid-cols-3 lg:grid-cols-6">
                            {serviceCards.map((item) => (
                                <ServiceCard key={item.label} icon={item.icon} label={item.label} href={item.href} />
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── 4. Struktur Keanggotaan ── */}
                <div id="struktur">
                    <StrukturKeanggotaan periods={committeePeriods} />
                </div>

                {/* ── 5. Berita & Pengumuman ── */}
                <section id="berita" className="py-stack-lg bg-slate-50/80">
                    <div className="mx-auto max-w-container-max px-margin-mobile md:px-margin-desktop">
                        <div className="mb-10 text-center">
                            <span className="text-xs font-bold uppercase tracking-widest text-emerald-700">Informasi Terkini</span>
                            <h2 className="mt-1 text-3xl font-black text-slate-900 md:text-4xl">Berita &amp; Pengumuman</h2>
                            <p className="mt-2 text-slate-600 max-w-xl mx-auto">Informasi terbaru seputar lingkungan RT 004.</p>
                        </div>

                        {/* Search & Category Filter for News */}
                        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-6">
                            {/* Search Input */}
                            <div className="relative flex-1 max-w-md w-full">
                                <input
                                    type="text"
                                    value={newsSearch}
                                    onChange={(e) => setNewsSearch(e.target.value)}
                                    placeholder="Cari berita..."
                                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 pl-10 text-xs text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 transition"
                                />
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                </span>
                            </div>

                            {/* Category Chips */}
                            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar whitespace-nowrap scroll-smooth w-full md:w-auto">
                                {newsCategories.map((cat) => (
                                    <button
                                        key={cat}
                                        type="button"
                                        onClick={() => { setNewsCategory(cat); setShowAllNews(true); }}
                                        className={[
                                            'px-4 py-2 rounded-full text-xs font-bold transition capitalize',
                                            newsCategory.toLowerCase() === cat.toLowerCase()
                                                ? 'bg-emerald-600 text-white font-bold shadow-md'
                                                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                        ].join(' ')}
                                    >
                                        {cat === 'semua' ? 'Semua Kategori' : cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {displayedAnnouncements.length > 0 ? (
                            <>
                                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-gutter">
                                    {displayedAnnouncements.map((item) => (
                                        <ArticleCard key={item.id} item={item} onRead={() => setSelectedAnnouncement(item)} />
                                    ))}
                                </div>

                                {filteredAnnouncements.length > 3 && (
                                    <div className="mt-8 flex justify-center">
                                        <button
                                            type="button"
                                            onClick={() => setShowAllNews(prev => !prev)}
                                            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-emerald-600 px-6 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 active:scale-[0.98] focus:outline-none"
                                        >
                                            {showAllNews ? 'Sembunyikan Sebagian' : 'Lihat Semua Berita'}
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <EmptySection
                                icon={<Bell size={28} />}
                                title="Belum ada berita"
                                description="Tidak ada berita yang cocok dengan kata kunci atau filter kategori Anda."
                            />
                        )}
                    </div>
                </section>

                {/* ── 6. Kegiatan / Agenda ── */}
                <section id="kegiatan" className="py-stack-lg bg-white">
                    <div className="mx-auto max-w-container-max px-margin-mobile md:px-margin-desktop">
                        <div className="mb-10 text-center">
                            <span className="text-xs font-bold uppercase tracking-widest text-emerald-700">Agenda RT</span>
                            <h2 className="mt-1 text-3xl font-black text-slate-900 md:text-4xl">Agenda Mendatang</h2>
                            <p className="mt-2 text-slate-600 max-w-xl mx-auto">Daftar kegiatan, rapat warga, dan iuran lingkungan berikutnya.</p>
                        </div>

                        {/* Calendar Day Strip */}
                        <div className="mb-8 rounded-3xl border border-slate-200 bg-slate-50 p-5">
                            <div className="mb-4 flex items-center justify-between">
                                <h3 className="text-sm font-bold text-slate-900">Jadwal {currentMonthLabel}</h3>
                                <button
                                    type="button"
                                    onClick={() => setShowCalendarModal(true)}
                                    className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                                >
                                    Lihat Semua <span className="text-[10px]">&gt;</span>
                                </button>
                            </div>
                            <div className="flex gap-2.5 justify-start md:justify-center overflow-x-auto pb-1 no-scrollbar whitespace-nowrap scroll-smooth">
                                {calendarDays.map((day, idx) => {
                                    const isSelected = selectedCalendarDate === day.matchStr;
                                    const hasEvent = events.some(e => e.date === day.matchStr);
                                    return (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => {
                                                if (isSelected) {
                                                    setSelectedCalendarDate(null);
                                                } else {
                                                    setSelectedCalendarDate(day.matchStr);
                                                    setShowAllEvents(true);
                                                }
                                            }}
                                            className={[
                                                'flex flex-col items-center justify-center rounded-2xl py-3.5 px-4 min-w-[64px] md:w-28 transition relative',
                                                isSelected
                                                    ? 'bg-emerald-600 text-white font-bold shadow-md'
                                                    : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                            ].join(' ')}
                                        >
                                            <span className="text-[8px] font-bold uppercase tracking-wider">{day.dayName}</span>
                                            <span className="text-sm font-extrabold mt-1">{day.dayNum}</span>

                                            {/* Indicator dot for selected day */}
                                            {isSelected && (
                                                <span className="absolute bottom-1.5 h-1 w-1 rounded-full bg-white" />
                                            )}

                                            {/* Event present indicator dot */}
                                            {!isSelected && hasEvent && (
                                                <span className="absolute bottom-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {displayedEvents.length > 0 ? (
                            <div className="space-y-5">
                                <div className="space-y-5">
                                    {displayedEvents.map((event) => {
                                        const participants = event.participants ?? [];
                                        const count = event.participantsCount ?? participants.length;
                                        return (
                                            <article key={event.id} className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-emerald-500/40 hover:shadow-md md:p-8">
                                                <div className="flex flex-col">

                                                    {/* Badge and Details grouped in flex-row */}
                                                    <div className="flex flex-row items-start gap-4 flex-1 min-w-0">
                                                        {/* Date badge */}
                                                        <div className="flex h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 shrink-0 flex-col items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-700">
                                                            <Calendar size={22} className="md:w-6 md:h-6" />
                                                            <span className="mt-0.5 text-[8px] md:text-xs font-bold uppercase tracking-wider">Agenda</span>
                                                        </div>

                                                        {/* Details */}
                                                        <div className="min-w-0 flex-1">
                                                            <div className="mb-2 flex flex-wrap items-center gap-1.5">
                                                                {event.type && (
                                                                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] md:text-xs font-bold text-slate-700">{event.type}</span>
                                                                )}
                                                                {event.status && (
                                                                    <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] md:text-xs font-bold text-emerald-700">{event.status}</span>
                                                                )}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setSelectedParticipantsEvent(event)}
                                                                    className="rounded-full bg-emerald-50 hover:bg-emerald-100 px-2.5 py-0.5 text-[10px] md:text-xs font-bold text-emerald-700 border border-emerald-200 flex items-center gap-1 transition"
                                                                >
                                                                    <span className="material-symbols-outlined text-[12px] md:text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>groups</span>
                                                                    {count} Ikut
                                                                </button>
                                                            </div>
                                                            <h3 className="text-sm sm:text-lg md:text-2xl font-bold text-slate-900 group-hover:text-emerald-600 transition leading-snug">{event.title}</h3>
                                                            {event.description && (
                                                                <p className="mt-2 line-clamp-2 text-xs md:text-sm leading-relaxed text-slate-600">{event.description}</p>
                                                            )}
                                                            <div className="mt-3 flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-4 text-xs text-slate-500">
                                                                <span className="flex items-center gap-1.5">
                                                                    <Clock size={14} className="text-emerald-600" /> {event.date || '-'} {event.time ? `· ${event.time}` : ''}
                                                                </span>
                                                                <span className="flex items-center gap-1.5">
                                                                    <MapPin size={14} className="text-emerald-600" /> {event.location || '-'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Bottom Action Area (RSVP & Share & Detail) */}
                                                    <div className="mt-4 pt-4 border-t border-slate-200 flex items-center gap-3 w-full">
                                                        <button
                                                            type="button"
                                                            onClick={() => openEventDetailModal(event)}
                                                            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200 hover:text-slate-900 transition active:scale-95"
                                                        >
                                                            <FileText size={14} className="text-emerald-600" />
                                                            Detail &amp; Dokumentasi
                                                        </button>

                                                        {event.status?.toLowerCase() === 'dijadwalkan' && (
                                                            isWargaLoggedIn ? (
                                                                event.isJoined ? (
                                                                    <div className="flex-1 flex gap-2">
                                                                        <span className="flex-1 flex items-center justify-center rounded-xl bg-emerald-50 border border-emerald-200 py-2.5 text-xs font-bold text-emerald-700">
                                                                            Sudah Ikut
                                                                        </span>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => cancelJoinEvent(event)}
                                                                            className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-bold text-red-700 transition hover:bg-red-100"
                                                                        >
                                                                            Batal
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => joinEvent(event)}
                                                                        className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 transition active:scale-95 shadow-sm"
                                                                    >
                                                                        RSVP
                                                                    </button>
                                                                )
                                                            ) : (
                                                                <Link
                                                                    href="/login"
                                                                    className="flex-1 flex items-center justify-center rounded-xl bg-slate-100 border border-slate-200 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200 transition"
                                                                >
                                                                    Masuk untuk RSVP
                                                                </Link>
                                                            )
                                                        )}

                                                        {/* Share button */}
                                                        <button
                                                            type="button"
                                                            onClick={() => handleShare(event.title || 'Agenda RT', window.location.href)}
                                                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:text-emerald-700 hover:bg-slate-100 transition"
                                                            title="Bagikan Kegiatan"
                                                        >
                                                            <span className="material-symbols-outlined text-[18px]">share</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            </article>
                                        );
                                    })}
                                </div>

                                {events.length > 3 && (
                                    <div className="mt-8 flex justify-center">
                                        <button
                                            type="button"
                                            onClick={() => setShowAllEvents(prev => !prev)}
                                            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-emerald-600 px-6 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 active:scale-[0.98] focus:outline-none"
                                        >
                                            {showAllEvents ? 'Sembunyikan Sebagian' : 'Lihat Semua Kegiatan'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <EmptySection icon={<Calendar size={28} />} title="Belum ada kegiatan" description="Agenda akan muncul setelah admin menginput kegiatan di sistem." />
                        )}
                    </div>
                </section>

                {/* ── 7. Diskusi & Pengaduan Publik ── */}
                <section id="diskusi" className="py-stack-lg bg-slate-50/80">
                    <div className="mx-auto max-w-container-max px-margin-mobile md:px-margin-desktop">
                        <div className="mb-10 text-center">
                            <span className="text-xs font-bold uppercase tracking-widest text-emerald-700">Aspirasi Warga</span>
                            <h2 className="mt-1 text-3xl font-black text-slate-900 md:text-4xl">Diskusi &amp; Pengaduan Warga</h2>
                            <p className="mt-2 text-slate-600">Wadah aspirasi dan laporan warga untuk lingkungan yang lebih baik.</p>
                        </div>

                        {complaints.length > 0 ? (
                            <>
                                <div className="grid gap-gutter md:grid-cols-2 lg:grid-cols-3">
                                    {complaints.map((c) => {
                                        const st = statusConfig[c.status ?? ''] ?? statusConfig.diajukan;
                                        const pri = priorityConfig[c.prioritas ?? ''] ?? priorityConfig.sedang;
                                        const kat = kategoriConfig[c.kategori ?? ''] ?? kategoriConfig.lainnya;
                                        return (
                                            <div key={c.id} className="group flex flex-col gap-4 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-emerald-500 hover:shadow-md">
                                                {/* Header */}
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-center gap-3">
                                                        {c.authorAvatar ? (
                                                            <img
                                                                src={c.authorAvatar}
                                                                alt={c.authorName}
                                                                className="h-10 w-10 rounded-full object-cover border border-emerald-200"
                                                            />
                                                        ) : (
                                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-sm font-black text-emerald-700 border border-emerald-200">
                                                                {c.authorInitials ?? '?'}
                                                            </div>
                                                        )}
                                                        <div>
                                                            <p className="text-sm font-bold text-slate-900">{c.authorName}</p>
                                                            {c.houseNumber && (
                                                                <p className="text-[10px] uppercase tracking-widest text-slate-500">No. {c.houseNumber}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <span className={['flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-bold uppercase', st.cls].join(' ')}>
                                                        <span className="material-symbols-outlined text-[13px]">{st.icon}</span>
                                                        {st.label}
                                                    </span>
                                                </div>

                                                {/* Priority & category */}
                                                <div>
                                                    <div className={['mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest', pri.cls].join(' ')}>
                                                        <span className="material-symbols-outlined text-[16px]">{pri.icon}</span>
                                                        <span>{pri.label}</span>
                                                        <span className="mx-1 text-slate-300">·</span>
                                                        <span className={['flex items-center gap-1', kat.cls].join(' ')}>
                                                            <span className="material-symbols-outlined text-[16px]">{kat.icon}</span>
                                                            {kat.label}
                                                        </span>
                                                    </div>
                                                    <h4 className="text-base font-black text-slate-900 group-hover:text-emerald-600 transition-colors">{c.judul}</h4>
                                                    {c.excerpt && <p className="mt-2 line-clamp-2 text-sm leading-5 text-slate-600">{c.excerpt}</p>}
                                                </div>

                                                {/* Footer */}
                                                <div className="flex items-center justify-end border-t border-slate-100 pt-3">
                                                    <span className="text-xs text-slate-400">{c.tanggal || '-'}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                {isLoggedIn ? (
                                    <div className="mt-8 flex justify-center">
                                        <Link href="/warga/pengaduan" className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-7 py-3 font-black text-white shadow-md transition hover:bg-emerald-700 active:scale-95">
                                            Lihat Semua Pengaduan <ArrowRight size={17} />
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="mt-8 flex justify-center">
                                        <Link href="/login" className="inline-flex items-center gap-2 rounded-2xl bg-white border border-slate-200 px-7 py-3 font-black text-slate-800 shadow-sm transition hover:bg-slate-100 active:scale-95">
                                            Masuk untuk Buat Pengaduan <ArrowRight size={17} />
                                        </Link>
                                    </div>
                                )}
                            </>
                        ) : (
                            <EmptySection icon={<MessageCircle size={28} />} title="Belum ada pengaduan publik" description="Pengaduan warga yang tidak bersifat privat akan tampil di sini setelah diproses." />
                        )}
                    </div>
                </section>

                {/* ── 8. Galeri Kegiatan ── */}
                <section id="galeri" className="py-stack-lg bg-slate-50/80">
                    <div className="mx-auto max-w-container-max px-margin-mobile md:px-margin-desktop">
                        <div className="mb-8 text-center">
                            <span className="text-xs font-bold uppercase tracking-widest text-emerald-700">Foto Kegiatan</span>
                            <h2 className="mt-1 text-3xl font-black text-slate-900 md:text-4xl">Galeri Kegiatan</h2>
                        </div>

                        {/* Category Chips for Gallery */}
                        <div className="mb-8 flex justify-center border-b border-slate-200 pb-6">
                            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar whitespace-nowrap scroll-smooth">
                                {galleryCategories.map((cat) => (
                                    <button
                                        key={cat}
                                        type="button"
                                        onClick={() => { setGalleryCategory(cat); setShowAllGallery(true); }}
                                        className={[
                                            'px-4 py-2 rounded-full text-xs font-bold transition capitalize',
                                            galleryCategory.toLowerCase() === cat.toLowerCase()
                                                ? 'bg-emerald-600 text-white font-bold shadow-md'
                                                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                        ].join(' ')}
                                    >
                                        {cat === 'semua' ? 'Semua Galeri' : cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {displayedGallery.length > 0 ? (
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                                    {displayedGallery.map((item, index) => (
                                        <div key={item.id} className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-2 transition hover:border-emerald-500/40 hover:shadow-md">
                                            <button
                                                type="button"
                                                onClick={() => openGalleryDetail(item, index)}
                                                className="relative aspect-[4/5] w-full overflow-hidden rounded-lg block text-left"
                                            >
                                                <img
                                                    src={item.imageUrl}
                                                    alt={item.title}
                                                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-60" />
                                            </button>

                                            <div className="mt-3 px-1">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="rounded bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[9px] font-bold uppercase text-emerald-700">
                                                        {item.category || 'Dokumentasi'}
                                                    </span>
                                                    <span className="text-[9px] text-slate-500 font-semibold">{item.publishedAt || ''}</span>
                                                </div>
                                                <h4 className="mt-2 text-xs sm:text-sm font-semibold text-slate-900 line-clamp-1 group-hover:text-emerald-600 transition">
                                                    {item.title}
                                                </h4>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {filteredGallery.length > 4 && (
                                    <div className="mt-8 flex justify-center">
                                        <button
                                            type="button"
                                            onClick={() => setShowAllGallery(prev => !prev)}
                                            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-emerald-600 px-6 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 active:scale-[0.98] focus:outline-none"
                                        >
                                            {showAllGallery ? 'Sembunyikan Sebagian' : 'Lihat Semua Foto'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <EmptySection
                                icon={<Camera size={28} />}
                                title="Belum ada foto"
                                description="Tidak ada foto galeri kegiatan yang cocok dengan filter kategori Anda."
                            />
                        )}
                    </div>
                </section>

                {/* ── 9. Dokumen Publik ── */}
                <section id="dokumen" className="py-stack-lg bg-white">
                    <div className="mx-auto max-w-container-max px-margin-mobile md:px-margin-desktop">
                        <div className="mb-8 text-center">
                            <span className="text-xs font-bold uppercase tracking-widest text-emerald-700">Transparansi Data</span>
                            <h2 className="mt-1 text-3xl font-black text-slate-900 md:text-4xl">Dokumen Digital</h2>
                            <p className="mt-2 text-slate-600 max-w-xl mx-auto">Akses dokumen penting secara transparan dan mudah diunduh.</p>
                        </div>

                        {/* Search & Category Filter for Documents */}
                        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-6">
                            {/* Search Input */}
                            <div className="relative flex-1 max-w-md w-full">
                                <input
                                    type="text"
                                    value={docSearch}
                                    onChange={(e) => setDocSearch(e.target.value)}
                                    placeholder="Cari dokumen..."
                                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 pl-10 text-xs text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 transition"
                                />
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                </span>
                            </div>

                            {/* Category Chips */}
                            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar whitespace-nowrap scroll-smooth w-full md:w-auto">
                                {docCategories.map((cat) => (
                                    <button
                                        key={cat}
                                        type="button"
                                        onClick={() => { setDocCategory(cat); setShowAllDocs(true); }}
                                        className={[
                                            'px-4 py-2 rounded-full text-xs font-bold transition capitalize',
                                            docCategory.toLowerCase() === cat.toLowerCase()
                                                ? 'bg-emerald-600 text-white font-bold shadow-md'
                                                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                        ].join(' ')}
                                    >
                                        {cat === 'semua' ? 'Semua Dokumen' : cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {displayedDocuments.length > 0 ? (
                            <>
                                <div className="grid gap-5 md:grid-cols-2">
                                    {displayedDocuments.map((doc) => {
                                        const { icon, cls } = docIcon(doc.category);
                                        const hasMainFile = doc.files ? doc.files.some(f => (f.category || f.fileType) === 'main' || (f.category || f.fileType) === 'main_file') : false;
                                        const hasPhotos = doc.files ? doc.files.some(f => {
                                            const rawCat = f.category || f.fileType;
                                            const isImage = f.isImage || (f.mimeType && f.mimeType.startsWith('image/')) || ['jpg', 'jpeg', 'png', 'webp'].some(ext => (f.originalName || '').toLowerCase().endsWith('.' + ext));
                                            return ['attachment', 'gallery', 'attachments', 'gallery_image'].includes(rawCat) && isImage;
                                        }) : false;

                                        return (
                                            <div key={doc.id} className="group flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 transition hover:border-emerald-500/40 hover:shadow-md md:flex-row md:items-center">
                                                <div className="flex items-start gap-4 flex-1 min-w-0">
                                                    <div className={['w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition group-hover:scale-110', cls].join(' ')}>
                                                        <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="mb-1 flex flex-wrap items-center gap-2">
                                                            <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-700">
                                                                {doc.category || 'Dokumen'}
                                                            </span>
                                                            <span className="text-[10px] text-slate-500 font-semibold">{doc.publishedAt || ''}</span>
                                                        </div>
                                                        <h4 className="text-base font-black text-slate-900 leading-snug">{doc.title}</h4>
                                                        {doc.description && <p className="mt-1 line-clamp-2 text-sm text-slate-600 leading-relaxed">{doc.description}</p>}

                                                        {/* File download area */}
                                                        <div className="mt-4 border-t border-slate-200 pt-4 flex flex-col gap-2.5">
                                                            {/* 1. Unduh File Utama */}
                                                            {hasMainFile && (
                                                                <a
                                                                    href={`/documents/${doc.id}/download-main`}
                                                                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100 active:scale-[0.98] hover:no-underline w-full text-center"
                                                                >
                                                                    <Download size={14} />
                                                                    <span>Unduh File Utama</span>
                                                                </a>
                                                            )}

                                                            {/* 2. Unduh Foto Kegiatan (.ZIP) */}
                                                            {hasPhotos && (
                                                                <a
                                                                    href={`/documents/${doc.id}/download-photos`}
                                                                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100 active:scale-[0.98] hover:no-underline w-full text-center"
                                                                >
                                                                    <Download size={14} />
                                                                    <span>Unduh Foto Kegiatan (.ZIP)</span>
                                                                </a>
                                                            )}

                                                            {/* 3. Unduh Semuanya (.ZIP) */}
                                                            {(hasMainFile || hasPhotos) ? (
                                                                <a
                                                                    href={`/documents/${doc.id}/download-all`}
                                                                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-xs font-bold text-white shadow-md transition hover:bg-emerald-700 active:scale-[0.98] hover:no-underline w-full text-center"
                                                                >
                                                                    <Download size={14} className="shrink-0" />
                                                                    <span>Unduh Semuanya (.ZIP)</span>
                                                                </a>
                                                            ) : (
                                                                <p className="text-xs text-slate-500 italic">Tidak ada file yang dapat diunduh.</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {filteredDocuments.length > 3 && (
                                    <div className="mt-8 flex justify-center">
                                        <button
                                            type="button"
                                            onClick={() => setShowAllDocs(prev => !prev)}
                                            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-emerald-600 px-6 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 active:scale-[0.98] focus:outline-none"
                                        >
                                            {showAllDocs ? 'Sembunyikan Sebagian' : 'Lihat Semua Dokumen'}
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <EmptySection
                                icon={<FileText size={28} />}
                                title="Belum ada dokumen"
                                description="Tidak ada dokumen digital yang cocok dengan kata kunci atau filter kategori Anda."
                            />
                        )}
                    </div>
                </section>

                {/* ── 10. Kontak ── */}
                <section id="kontak" className="bg-slate-50/80 py-stack-lg">
                    <div className="mx-auto max-w-container-max px-margin-mobile md:px-margin-desktop">
                        <div className="mb-10 text-center">
                            <span className="text-xs font-bold uppercase tracking-widest text-emerald-700">Kontak RT</span>
                            <h2 className="mt-1 text-3xl font-black text-slate-900 md:text-4xl">Kontak dan Sekretariat</h2>
                            <p className="mt-2 text-slate-600">Kunjungi kantor sekretariat kami untuk layanan tatap muka dan informasi lebih lanjut.</p>
                        </div>

                        <div className="grid gap-10 md:grid-cols-2">
                            {/* Map */}
                            <div className="relative h-[360px] overflow-hidden rounded-3xl border border-slate-200 shadow-md group bg-slate-100">
                                {safeSite.gmapsEmbedUrl ? (
                                    <>
                                        <iframe
                                            src={safeSite.gmapsEmbedUrl}
                                            width="100%"
                                            height="100%"
                                            style={{ border: 0 }}
                                            allowFullScreen={true}
                                            loading="lazy"
                                            referrerPolicy="no-referrer-when-downgrade"
                                            className="opacity-90 contrast-105 transition-all duration-300 group-hover:opacity-100"
                                            title="Peta Lokasi Sekretariat RT"
                                        ></iframe>
                                        <div className="pointer-events-none absolute bottom-4 left-4 rounded-xl bg-white/95 px-3 py-2 text-xs font-bold text-slate-900 shadow-md backdrop-blur border border-slate-200">
                                            <div className="flex items-center gap-2">
                                                <MapPin size={14} className="text-emerald-700 animate-bounce" />
                                                <span>Sekretariat {safeSite.rtName}</span>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
                                        <span className="material-symbols-outlined mb-4 text-[48px] text-emerald-700">map</span>
                                        <p className="font-bold text-slate-900">Peta Lokasi</p>
                                        <p className="mt-2 text-sm text-slate-600">{safeSite.address || 'Alamat belum diatur'}</p>
                                    </div>
                                )}
                            </div>

                            {/* Contact cards */}
                            <div className="grid gap-4 sm:grid-cols-2">
                                {safeSite.address && (
                                    <ContactCard icon={<MapPin size={20} />} title="Alamat Sekretariat" value={safeSite.address} href={safeSite.gmapsUrl || undefined} />
                                )}
                                {safeSite.email && (
                                    <ContactCard icon={<Mail size={20} />} title="Email Resmi" value={safeSite.email} href={`mailto:${safeSite.email}`} />
                                )}
                                {safeSite.phone && (
                                    <ContactCard icon={<Phone size={20} />} title="Telepon / WhatsApp" value={safeSite.phone} href={`tel:${safeSite.phone}`} />
                                )}
                                <ContactCard icon={<LayoutDashboard size={20} />} title="Portal Warga" value="Masuk ke Portal" href="/login" />

                                {safeSite.emergencyContacts && safeSite.emergencyContacts.length > 0 && (
                                    <div className="col-span-1 sm:col-span-2 mt-6">
                                        <h4 className="mb-4 text-sm font-bold text-red-700 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>emergency</span>
                                            Nomor Darurat Lingkungan
                                        </h4>
                                        <div className="grid gap-3 sm:grid-cols-2">
                                            {safeSite.emergencyContacts.map((contact, idx) => (
                                                <a
                                                    key={idx}
                                                    href={`tel:${contact.phone}`}
                                                    className="flex items-center justify-between rounded-2xl border border-red-200 bg-red-50/80 p-4 hover:bg-red-100 transition hover:border-red-300 group hover:no-underline"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-100 text-red-700 group-hover:scale-105 transition">
                                                            <Phone size={16} />
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-bold text-slate-900">{contact.label}</p>
                                                            <p className="text-[10px] text-slate-600 font-semibold">{contact.phone}</p>
                                                        </div>
                                                    </div>
                                                    <span className="material-symbols-outlined text-slate-400 text-sm group-hover:text-red-700 transition" style={{ fontVariationSettings: "'FILL' 1" }}>call</span>
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {!safeSite.address && !safeSite.email && !safeSite.phone && (!safeSite.emergencyContacts || safeSite.emergencyContacts.length === 0) && (
                                    <div className="col-span-2 rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-slate-600">
                                        <MapPin className="mx-auto mb-2 text-emerald-700" size={28} />
                                        <p className="text-sm font-semibold">Data kontak belum diatur.</p>
                                        <p className="mt-1 text-xs">Admin dapat mengatur informasi kontak di panel Pengaturan.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* ── Footer ── */}
            <footer className="border-t border-slate-200 bg-slate-100 px-margin-mobile md:px-margin-desktop py-12">
                <div className="mx-auto grid max-w-container-max gap-8 md:grid-cols-12">
                    <div className="md:col-span-5">
                        <p className="text-xl font-black text-emerald-700">{safeSite.title}</p>
                        <p className="mt-2 text-xs font-bold uppercase tracking-widest text-slate-600">{safeSite.rtName}</p>
                        <p className="mt-3 max-w-sm text-sm leading-6 text-slate-600">
                            {safeSite.footerText || 'Platform digital terpadu untuk mewujudkan tata kelola lingkungan yang transparan, modern, dan inklusif.'}
                        </p>
                        {/* Social links */}
                        {(safeSite.instagram || safeSite.youtube || safeSite.waLink || safeSite.email) && (
                            <div className="mt-5 flex gap-3">
                                {safeSite.instagram && (
                                    <a href={`https://instagram.com/${safeSite.instagram}`} target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-full bg-white border border-slate-200 text-slate-700 transition hover:bg-emerald-600 hover:text-white hover:border-emerald-600">
                                        <InstagramIcon size={17} />
                                    </a>
                                )}
                                {safeSite.youtube && (
                                    <a href={safeSite.youtube} target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-full bg-white border border-slate-200 text-slate-700 transition hover:bg-emerald-600 hover:text-white hover:border-emerald-600">
                                        <YoutubeIcon size={17} />
                                    </a>
                                )}
                                {safeSite.waLink && (
                                    <a href={safeSite.waLink} target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-full bg-white border border-slate-200 text-slate-700 transition hover:bg-emerald-600 hover:text-white hover:border-emerald-600" aria-label="WhatsApp Group">
                                        <WhatsappIcon size={17} />
                                    </a>
                                )}
                                {safeSite.email && (
                                    <a href={`mailto:${safeSite.email}`} className="flex h-9 w-9 items-center justify-center rounded-full bg-white border border-slate-200 text-slate-700 transition hover:bg-emerald-600 hover:text-white hover:border-emerald-600">
                                        <Mail size={17} />
                                    </a>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="md:col-span-7">
                        <div className="flex flex-wrap gap-4 text-sm font-semibold text-slate-600 md:justify-end">
                            {navLinks.map((link) => (
                                <a key={link.id} href={`#${link.id}`} className="hover:text-emerald-700 transition-colors">
                                    {link.label}
                                </a>
                            ))}
                        </div>
                        <p className="mt-6 text-xs text-slate-500 md:text-right">
                            {safeSite.copyright || `© ${new Date().getFullYear()} ${safeSite.rtName}. Portal publik informasi RT.`}
                        </p>
                    </div>
                </div>
            </footer>

            {/* ── Participants modal ── */}
            {selectedParticipantsEvent && (
                <div onClick={() => setSelectedParticipantsEvent(null)} className="fixed inset-0 z-[55] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm cursor-pointer">
                    <div onClick={(e) => e.stopPropagation()} className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white border border-slate-200 shadow-2xl cursor-default">
                        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-slate-50 px-6 py-4">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">Partisipasi Warga</p>
                                <h3 className="text-xl font-black text-slate-900">{selectedParticipantsEvent.title}</h3>
                                <p className="mt-1 text-sm text-slate-600">
                                    {(selectedParticipantsEvent.participantsCount ?? selectedParticipantsEvent.participants?.length ?? 0)} warga ikut kegiatan ini.
                                </p>
                            </div>
                            <button type="button" onClick={() => setSelectedParticipantsEvent(null)} className="rounded-xl p-2 text-slate-500 hover:bg-slate-200">
                                <X size={22} />
                            </button>
                        </div>
                        <div className="p-6">
                            {selectedParticipantsEvent.participants && selectedParticipantsEvent.participants.length > 0 ? (
                                <div className="space-y-3">
                                    {selectedParticipantsEvent.participants.map((p, idx) => (
                                        <div key={p.id} className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-black text-emerald-700 border border-emerald-200">
                                                {p.initials || idx + 1}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900">{p.name}</p>
                                                <p className="text-xs text-slate-500">
                                                    {p.houseNumber ? `No. ${p.houseNumber} · ` : ''}
                                                    Bergabung {p.joinedAt || 'baru-baru ini'}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                                    <Users size={30} className="mx-auto mb-3 text-slate-400" />
                                    <p className="font-bold text-slate-800">Belum ada warga yang ikut.</p>
                                    <p className="mt-1 text-sm text-slate-500">Jadilah warga pertama yang ikut kegiatan ini.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Announcement detail modal ── */}
            {selectedAnnouncement && (
                <div onClick={() => setSelectedAnnouncement(null)} className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm cursor-pointer">
                    <div onClick={(e) => e.stopPropagation()} className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white border border-slate-200 shadow-2xl cursor-default">
                        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">Detail Pengumuman</p>
                                <h3 className="text-xl font-black text-slate-900">{selectedAnnouncement.title}</h3>
                            </div>
                            <button type="button" onClick={() => setSelectedAnnouncement(null)} className="rounded-xl p-2 text-slate-500 hover:bg-slate-200">
                                <X size={22} />
                            </button>
                        </div>

                        {selectedAnnouncement.imageUrl && (
                            <div className="relative w-full overflow-hidden bg-slate-100 border-b border-slate-200 flex items-center justify-center">
                                <div
                                    className="absolute inset-0 bg-cover bg-center blur-md opacity-25 scale-105 pointer-events-none"
                                    style={{ backgroundImage: `url(${selectedAnnouncement.imageUrl})` }}
                                />
                                <img
                                    src={selectedAnnouncement.imageUrl}
                                    alt={selectedAnnouncement.title}
                                    className="relative max-h-[380px] md:max-h-[420px] w-auto max-w-full object-contain mx-auto transition-all"
                                />
                            </div>
                        )}

                        <div className="space-y-5 p-6">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className={['rounded-full px-3 py-1 text-xs font-bold', annBadgeClass(selectedAnnouncement.category)].join(' ')}>
                                    {annLabel(selectedAnnouncement.category)}
                                </span>
                                <span className="text-sm text-slate-500">{selectedAnnouncement.publishedAt || '-'}</span>
                            </div>
                            <div className="whitespace-pre-line text-sm leading-7 text-slate-700">
                                {selectedAnnouncement.content || selectedAnnouncement.excerpt}
                            </div>

                            {(selectedAnnouncement.files ?? []).length > 0 && (
                                <div className="rounded-2xl border border-slate-200 p-4">
                                    <p className="mb-3 font-bold text-slate-900">Lampiran</p>
                                    <div className="space-y-2">
                                        {(selectedAnnouncement.files ?? []).map((file) => (
                                            <a key={file.id} href={file.url} target="_blank" rel="noopener noreferrer"
                                                className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-sm hover:bg-slate-100">
                                                <span className="font-medium text-slate-800">{file.originalName}</span>
                                                <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                                                    <Download size={14} /> Buka
                                                </span>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Gallery all-photos modal ── */}
            {galleryModalOpen && (
                <div onClick={() => setGalleryModalOpen(false)} className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm cursor-pointer">
                    <div onClick={(e) => e.stopPropagation()} className="max-h-[90vh] w-full max-w-6xl overflow-hidden rounded-3xl bg-white border border-slate-200 shadow-2xl cursor-default">
                        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">Galeri Kegiatan</p>
                                <h3 className="text-xl font-black text-slate-900">Semua Foto Dokumentasi</h3>
                            </div>
                            <button type="button" onClick={() => setGalleryModalOpen(false)} className="rounded-xl p-2 text-slate-500 hover:bg-slate-200">
                                <X size={22} />
                            </button>
                        </div>
                        <div className="max-h-[75vh] overflow-y-auto p-6">
                            {gallery.length > 0 ? (
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {gallery.map((item, index) => (
                                        <button key={item.id} type="button" onClick={() => openGalleryDetail(item, index)}
                                            className="group overflow-hidden rounded-3xl border border-slate-200 bg-white text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md">
                                            <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                                                <img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent opacity-80" />
                                                <span className="absolute left-4 top-4 rounded-full bg-emerald-600 px-3 py-1 text-[10px] font-bold text-white">
                                                    {item.category || 'Dokumentasi'}
                                                </span>
                                            </div>
                                            <div className="p-4">
                                                <h4 className="line-clamp-2 text-sm font-black text-slate-900">{item.title}</h4>
                                                <p className="mt-1 text-xs text-slate-500">{item.publishedAt || ''}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-slate-500">
                                    Belum ada foto dokumentasi.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Gallery detail modal ── */}
            {selectedGalleryItem && (
                <div onClick={() => setSelectedGalleryItem(null)} className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm cursor-pointer">
                    <div onClick={(e) => e.stopPropagation()} className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white border border-slate-200 shadow-2xl cursor-default">
                        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">Detail Foto</p>
                                <h3 className="line-clamp-1 text-xl font-black text-slate-900">{selectedGalleryItem.title}</h3>
                            </div>
                            <button type="button" onClick={() => setSelectedGalleryItem(null)} className="rounded-xl p-2 text-slate-500 hover:bg-slate-200">
                                <X size={22} />
                            </button>
                        </div>
                        <img src={selectedGalleryItem.imageUrl} alt={selectedGalleryItem.title} className="max-h-[520px] w-full bg-slate-100 object-contain" />
                        <div className="space-y-4 p-6">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-700">{selectedGalleryItem.category || 'Dokumentasi'}</span>
                                <span className="text-sm text-slate-500">{selectedGalleryItem.publishedAt || ''}</span>
                            </div>
                            {selectedGalleryItem.description && (
                                <p className="whitespace-pre-line text-sm leading-7 text-slate-700">{selectedGalleryItem.description}</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
            {showCalendarModal && (
                <div onClick={() => setShowCalendarModal(false)} className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm cursor-pointer">
                    <div onClick={(e) => e.stopPropagation()} className="max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-3xl bg-white border border-slate-200 shadow-2xl cursor-default flex flex-col animate-in fade-in zoom-in-95 duration-200">

                        {/* Modal Header */}
                        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">Agenda &amp; Kegiatan</p>
                                <h3 className="text-xl font-black text-slate-900">Kalender &amp; Riwayat Agenda RT</h3>
                            </div>
                            <button type="button" onClick={() => setShowCalendarModal(false)} className="rounded-xl p-2 text-slate-500 hover:bg-slate-200 transition">
                                <X size={22} />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="overflow-y-auto p-6 flex-1 space-y-6">
                            <div className="grid gap-6 md:grid-cols-12">

                                {/* Monthly Calendar Grid */}
                                <div className="md:col-span-5 space-y-4">
                                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                        <div className="mb-4 flex items-center justify-between text-slate-900">
                                            <span className="font-extrabold text-sm uppercase tracking-wider">{currentMonthLabel} {new Date().getFullYear()}</span>
                                            <span className="text-[10px] text-slate-500 font-bold uppercase">Pilih Tanggal</span>
                                        </div>

                                        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-500 mb-2">
                                            <span>MIN</span>
                                            <span>SEN</span>
                                            <span>SEL</span>
                                            <span>RAB</span>
                                            <span>KAM</span>
                                            <span>JUM</span>
                                            <span>SAB</span>
                                        </div>

                                        <div className="grid grid-cols-7 gap-1">
                                            {getMonthDaysHelper.map((day, idx) => {
                                                if (!day) return <div key={idx} className="h-9" />;

                                                const hasEvent = events.some(e => e.date === day.matchStr);
                                                const isSelected = selectedCalendarModalDate === day.matchStr;
                                                const isToday = day.dateObj.toDateString() === new Date().toDateString();

                                                return (
                                                    <button
                                                        key={idx}
                                                        type="button"
                                                        onClick={() => {
                                                            if (isSelected) {
                                                                setSelectedCalendarModalDate(null);
                                                            } else {
                                                                setSelectedCalendarModalDate(day.matchStr);
                                                            }
                                                        }}
                                                        className={[
                                                            'h-9 rounded-lg flex flex-col items-center justify-center text-xs font-bold transition relative',
                                                            isSelected
                                                                ? 'bg-emerald-600 text-white font-extrabold shadow-md'
                                                                : isToday
                                                                    ? 'border border-emerald-500 bg-emerald-50 text-emerald-700'
                                                                    : 'hover:bg-slate-200 text-slate-700'
                                                        ].join(' ')}
                                                    >
                                                        <span>{day.dayNum}</span>
                                                        {hasEvent && (
                                                            <span className={[
                                                                'absolute bottom-1.5 h-1 w-1 rounded-full',
                                                                isSelected ? 'bg-white' : 'bg-emerald-600'
                                                            ].join(' ')} />
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-3 text-[10px] text-slate-600 font-bold px-1">
                                        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded bg-emerald-600" /> Coming Soon</span>
                                        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded bg-amber-500 animate-pulse" /> Hari Ini</span>
                                        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded bg-slate-400" /> Selesai</span>
                                    </div>
                                </div>

                                {/* Filtered Agendas List */}
                                <div className="md:col-span-7 space-y-4">
                                    <div className="flex gap-1.5 border-b border-slate-200 pb-3 overflow-x-auto no-scrollbar">
                                        {['semua', 'coming soon', 'sedang berlangsung', 'selesai'].map((statusOption) => (
                                            <button
                                                key={statusOption}
                                                type="button"
                                                onClick={() => {
                                                    setSelectedStatusFilter(statusOption);
                                                    setSelectedCalendarModalDate(null);
                                                }}
                                                className={[
                                                    'px-3.5 py-1.5 rounded-xl text-xs font-bold transition capitalize shrink-0',
                                                    selectedStatusFilter === statusOption && !selectedCalendarModalDate
                                                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-700 font-extrabold'
                                                        : 'border border-transparent text-slate-600 hover:text-slate-900'
                                                ].join(' ')}
                                            >
                                                {statusOption === 'semua' ? 'Semua Riwayat' : statusOption === 'sedang berlangsung' ? 'Sedang Berlangsung' : statusOption}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                                        {modalFilteredEvents.length > 0 ? (
                                            modalFilteredEvents.map((event) => {
                                                const status = getEventStatus(event.date);
                                                const statusLabel = status === 'selesai' ? 'Selesai' : status === 'sedang berlangsung' ? 'Hari Ini' : 'Mendatang';
                                                const statusCls = status === 'selesai' ? 'bg-slate-100 text-slate-600' : status === 'sedang berlangsung' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200';

                                                return (
                                                    <div key={event.id} className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 space-y-3 transition hover:border-slate-300">
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div className="space-y-1">
                                                                <div className="flex items-center gap-2">
                                                                    <span className={['rounded-md px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider', statusCls].join(' ')}>{statusLabel}</span>
                                                                    <span className="text-[10px] font-bold text-slate-500 capitalize">{event.type}</span>
                                                                </div>
                                                                <h4 className="text-sm font-bold text-slate-900">{event.title}</h4>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col gap-1.5 text-xs text-slate-600">
                                                            <span className="flex items-center gap-1.5">
                                                                <Clock size={12} className="text-emerald-600" /> {event.date} {event.time ? `· ${event.time}` : ''}
                                                            </span>
                                                            <span className="flex items-center gap-1.5">
                                                                <MapPin size={12} className="text-emerald-600" /> {event.location}
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="text-center py-8 text-slate-500 text-xs">
                                                Tidak ada agenda yang cocok untuk filter ini.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Navigasi Bawah Mobile ── */}
            <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
                <div className="mx-auto grid h-16 max-w-md grid-cols-6 items-center">
                    <a
                        href="#beranda"
                        className={[
                            'flex flex-col items-center justify-center py-2 text-xs font-medium transition',
                            activeTab === 'beranda'
                                ? 'text-emerald-700 font-bold'
                                : 'text-slate-600 hover:text-slate-900',
                        ].join(' ')}
                    >
                        <Home size={18} />
                        <span className="mt-1 text-[9px]">Beranda</span>
                    </a>
                    <a
                        href="#struktur"
                        className={[
                            'flex flex-col items-center justify-center py-2 text-xs font-medium transition',
                            activeTab === 'struktur'
                                ? 'text-emerald-700 font-bold'
                                : 'text-slate-600 hover:text-slate-900',
                        ].join(' ')}
                    >
                        <Users size={18} />
                        <span className="mt-1 text-[9px]">Struktur</span>
                    </a>
                    <a
                        href="#layanan"
                        className={[
                            'flex flex-col items-center justify-center py-2 text-xs font-medium transition',
                            activeTab === 'layanan'
                                ? 'text-emerald-700 font-bold'
                                : 'text-slate-600 hover:text-slate-900',
                        ].join(' ')}
                    >
                        <LayoutGrid size={18} />
                        <span className="mt-1 text-[9px]">Layanan</span>
                    </a>
                    <a
                        href="#berita"
                        className={[
                            'flex flex-col items-center justify-center py-2 text-xs font-medium transition',
                            activeTab === 'berita'
                                ? 'text-emerald-700 font-bold'
                                : 'text-slate-600 hover:text-slate-900',
                        ].join(' ')}
                    >
                        <Newspaper size={18} />
                        <span className="mt-1 text-[9px]">Berita</span>
                    </a>
                    <a
                        href="#galeri"
                        className={[
                            'flex flex-col items-center justify-center py-2 text-xs font-medium transition',
                            activeTab === 'galeri'
                                ? 'text-emerald-700 font-bold'
                                : 'text-slate-600 hover:text-slate-900',
                        ].join(' ')}
                    >
                        <Camera size={18} />
                        <span className="mt-1 text-[9px]">Galeri</span>
                    </a>
                    <a
                        href="#kontak"
                        className={[
                            'flex flex-col items-center justify-center py-2 text-xs font-medium transition',
                            activeTab === 'kontak'
                                ? 'text-emerald-700 font-bold'
                                : 'text-slate-600 hover:text-slate-900',
                        ].join(' ')}
                    >
                        <Phone size={18} />
                        <span className="mt-1 text-[9px]">Kontak</span>
                    </a>
                </div>
            </nav>

            {/* ── Chatbot ── */}
            <SmartRtChatbot
                site={safeSite}
                stats={stats}
                announcements={announcements}
                events={events}
                documents={documents}
                gallery={gallery}
                committeePeriods={committeePeriods}
            />

            {toastMessage && (
                <div className="fixed bottom-20 left-1/2 z-[9999] -translate-x-1/2 rounded-full bg-emerald-600 px-6 py-3 text-xs font-black text-white shadow-2xl transition-all animate-bounce">
                    {toastMessage}
                </div>
            )}

            {/* ── Event Detail Modal (HomePage) ── */}
            {selectedDetailEvent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-md">
                    <div className="w-full max-w-xl max-h-[90vh] flex flex-col rounded-3xl bg-white border border-slate-200 shadow-2xl overflow-hidden">
                        {/* Modal Header */}
                        <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5 bg-slate-50 shrink-0">
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 mb-1.5">
                                    {selectedDetailEvent.type && (
                                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-700">
                                            {selectedDetailEvent.type}
                                        </span>
                                    )}
                                    {selectedDetailEvent.status && (
                                        <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                                            {selectedDetailEvent.status}
                                        </span>
                                    )}
                                </div>
                                <h3 className="text-lg md:text-xl font-extrabold text-slate-900 leading-tight line-clamp-2">
                                    {selectedDetailEvent.title}
                                </h3>
                                <p className="mt-1 text-xs text-slate-500 font-medium">
                                    {selectedDetailEvent.date || '-'} {selectedDetailEvent.time ? `· ${selectedDetailEvent.time}` : ''}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => { setSelectedDetailEvent(null); setDetailModalTab('info'); }}
                                className="rounded-xl p-2 text-slate-500 hover:bg-slate-200 transition shrink-0"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Tab Switcher */}
                        <div className="flex shrink-0 border-b border-slate-200 bg-slate-50/50">
                            <button
                                type="button"
                                onClick={() => setDetailModalTab('info')}
                                className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-bold uppercase tracking-wider transition ${detailModalTab === 'info'
                                        ? 'text-emerald-700 border-b-2 border-emerald-600 font-black'
                                        : 'text-slate-500 hover:text-slate-900'
                                    }`}
                            >
                                <FileText size={14} />
                                Informasi
                            </button>
                            <button
                                type="button"
                                onClick={() => setDetailModalTab('dokumentasi')}
                                className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-bold uppercase tracking-wider transition ${detailModalTab === 'dokumentasi'
                                        ? 'text-emerald-700 border-b-2 border-emerald-600 font-black'
                                        : 'text-slate-500 hover:text-slate-900'
                                    }`}
                            >
                                <Camera size={14} />
                                Dokumentasi
                                {(selectedDetailEvent.fotoDokumentasi?.length ?? 0) > 0 && (
                                    <span className="ml-1.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black px-2 py-0.5">
                                        {selectedDetailEvent.fotoDokumentasi!.length}
                                    </span>
                                )}
                            </button>
                        </div>

                        {/* Tab Content: Info */}
                        {detailModalTab === 'info' && (
                            <div className="p-5 overflow-y-auto space-y-4 flex-1 scrollbar-thin">
                                {/* Poster/Image if available */}
                                {selectedDetailEvent.imageUrl && (
                                    <div className="rounded-2xl overflow-hidden border border-slate-200 max-h-52">
                                        <img
                                            src={selectedDetailEvent.imageUrl}
                                            alt={selectedDetailEvent.title}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                )}

                                {/* Description */}
                                <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 space-y-2">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Deskripsi Kegiatan</p>
                                    <p className="text-xs md:text-sm text-slate-700 leading-relaxed font-medium whitespace-pre-line">
                                        {selectedDetailEvent.description || 'Tidak ada deskripsi tambahan.'}
                                    </p>
                                </div>

                                {/* Meta Grid */}
                                <div className="grid grid-cols-2 gap-3 text-xs text-slate-600 font-medium">
                                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5">
                                        <p className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Waktu / Jam</p>
                                        <p className="text-xs font-bold text-slate-900 mt-1 flex items-center gap-1.5">
                                            <Clock size={13} className="text-emerald-600" />
                                            <span>{selectedDetailEvent.time || '-'}</span>
                                        </p>
                                    </div>
                                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5">
                                        <p className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Lokasi</p>
                                        <p className="text-xs font-bold text-slate-900 mt-1 flex items-center gap-1.5">
                                            <MapPin size={13} className="text-emerald-600" />
                                            <span className="truncate">{selectedDetailEvent.location || '-'}</span>
                                        </p>
                                    </div>
                                </div>

                                {/* Participants List */}
                                <div className="space-y-2.5">
                                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                                        <span>Partisipasi Warga</span>
                                        <span className="text-emerald-700 font-bold">{selectedDetailEvent.participantsCount || 0} Terdaftar</span>
                                    </h4>
                                    <div className="space-y-2 max-h-44 overflow-y-auto scrollbar-thin">
                                        {(selectedDetailEvent.participants || []).length > 0 ? (
                                            (selectedDetailEvent.participants || []).map((p) => (
                                                <div key={p.id} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-xs font-black text-emerald-700 border border-emerald-200">
                                                        {p.initials || p.name?.slice(0, 2).toUpperCase()}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="truncate font-bold text-slate-900 text-xs">{p.name}</p>
                                                        {p.houseNumber && (
                                                            <p className="text-[10px] text-slate-500 font-medium">Rumah No. {p.houseNumber}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center text-xs text-slate-500">
                                                Belum ada daftar partisipan warga.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tab Content: Dokumentasi */}
                        {detailModalTab === 'dokumentasi' && (
                            <div className="p-5 overflow-y-auto space-y-5 flex-1 scrollbar-thin">
                                {/* Hasil Kegiatan (teks) */}
                                <div className="space-y-2">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                                        <FileText size={13} className="text-emerald-600" />
                                        Hasil Kegiatan
                                    </p>
                                    {selectedDetailEvent.hasilKegiatan ? (
                                        <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                                            <p className="text-xs md:text-sm text-slate-700 leading-relaxed font-medium whitespace-pre-line">
                                                {selectedDetailEvent.hasilKegiatan}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                                            <p className="text-xs text-slate-500">Hasil kegiatan belum diisi oleh pengurus.</p>
                                        </div>
                                    )}
                                </div>

                                {/* Foto Dokumentasi */}
                                <div className="space-y-3">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                                        <Camera size={13} className="text-emerald-600" />
                                        Foto Dokumentasi
                                        {(selectedDetailEvent.fotoDokumentasi?.length ?? 0) > 0 && (
                                            <span className="text-emerald-700 font-bold">({selectedDetailEvent.fotoDokumentasi!.length} foto)</span>
                                        )}
                                    </p>
                                    {(selectedDetailEvent.fotoDokumentasi?.length ?? 0) > 0 ? (
                                        <div className="grid grid-cols-2 gap-2.5">
                                            {selectedDetailEvent.fotoDokumentasi!.map((url, idx) => (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    onClick={() => setEventLightboxUrl(url)}
                                                    className="group relative rounded-2xl overflow-hidden border border-slate-200 aspect-video bg-slate-100 hover:border-emerald-500 transition"
                                                >
                                                    <img
                                                        src={url}
                                                        alt={`Dokumentasi ${idx + 1}`}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                                    />
                                                    <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/40 transition flex items-center justify-center">
                                                        <span className="material-symbols-outlined text-white opacity-0 group-hover:opacity-100 transition text-[24px]">zoom_in</span>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                                            <p className="text-xs text-slate-500">Belum ada foto dokumentasi yang di-upload.</p>
                                        </div>
                                    )}
                                </div>

                                {/* Tombol Lihat Dokumen Arsip */}
                                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 flex items-center justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold text-emerald-700">Arsip Dokumen RT</p>
                                        <p className="text-[10px] text-slate-600 mt-0.5">Unduh laporan dan dokumen publik terkait kegiatan.</p>
                                    </div>
                                    <a
                                        href="#dokumen"
                                        className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white px-3.5 py-2 transition active:scale-95 shadow-sm"
                                        onClick={() => setSelectedDetailEvent(null)}
                                    >
                                        <Download size={13} />
                                        Lihat Arsip
                                    </a>
                                </div>
                            </div>
                        )}

                        {/* Modal Footer */}
                        <div className="border-t border-slate-200 p-4 bg-slate-50 flex justify-end shrink-0">
                            <button
                                type="button"
                                onClick={() => { setSelectedDetailEvent(null); setDetailModalTab('info'); }}
                                className="rounded-xl bg-white hover:bg-slate-100 border border-slate-200 px-5 py-2.5 text-xs font-bold text-slate-700 transition"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Lightbox Modal */}
            {eventLightboxUrl && (
                <div
                    className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/80 p-4 cursor-zoom-out backdrop-blur-sm"
                    onClick={() => setEventLightboxUrl(null)}
                >
                    <button
                        type="button"
                        onClick={() => setEventLightboxUrl(null)}
                        className="absolute top-4 right-4 rounded-xl bg-white/80 p-2 text-slate-700 hover:text-slate-900 transition z-10"
                    >
                        <X size={20} />
                    </button>
                    <img
                        src={eventLightboxUrl}
                        alt="Foto Dokumentasi"
                        className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProfileDropdown({
    authUser, dashboardLabel, dashboardUrl, profileMenuOpen, roleLabel, userInitials, firstName, setProfileMenuOpen,
}: {
    authUser: AuthUser;
    dashboardLabel: string;
    dashboardUrl: string;
    profileMenuOpen: boolean;
    roleLabel: string;
    userInitials: string;
    firstName: string;
    setProfileMenuOpen: (fn: (c: boolean) => boolean) => void;
}) {
    return (
        <div className="relative">
            <button type="button" onClick={() => setProfileMenuOpen((c) => !c)}
                className="inline-flex items-center gap-2 sm:gap-3 rounded-full border border-slate-200 bg-white p-1 lg:px-2.5 lg:py-2 lg:pr-4 shadow-sm transition hover:border-emerald-500/40 focus:outline-none">
                {authUser.profile_photo_url ? (
                    <img src={authUser.profile_photo_url} alt={authUser.name} className="h-8 w-8 sm:h-9 sm:w-9 rounded-full object-cover" />
                ) : (
                    <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-emerald-100 text-xs font-black text-emerald-700">{userInitials}</div>
                )}
                <div className="hidden lg:block max-w-[150px] text-left leading-tight">
                    <p className="truncate text-sm font-black text-slate-900">{firstName}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">{roleLabel}</p>
                </div>
                <ChevronDown size={15} className={['hidden lg:block text-slate-500 transition-transform', profileMenuOpen ? 'rotate-180' : ''].join(' ')} />
            </button>

            {profileMenuOpen && (
                <div className="absolute right-0 top-full z-50 mt-3 w-64 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
                    <div className="border-b border-slate-100 bg-slate-50 p-4">
                        <p className="truncate text-sm font-black text-slate-900">{authUser.name}</p>
                        <p className="mt-1 truncate text-xs text-slate-500">{authUser.email}</p>
                    </div>
                    <div className="p-2">
                        <Link href={dashboardUrl} onClick={() => setProfileMenuOpen(() => false)}
                            className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-700">
                            <LayoutDashboard size={16} /> {dashboardLabel}
                        </Link>
                        <Link href="/logout" method="post" as="button"
                            className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-bold text-red-600 transition hover:bg-red-50">
                            <LogOut size={16} /> Keluar
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}

function ServiceCard({ icon, label, href }: { icon: string; label: string; href: string }) {
    return (
        <Link href={href}
            className="group flex min-h-[140px] flex-col items-center justify-center gap-4 rounded-3xl border border-slate-200 bg-white p-5 text-center shadow-sm transition hover:-translate-y-1 hover:border-emerald-500/40 hover:shadow-md">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 transition group-hover:bg-emerald-600 group-hover:text-white group-hover:scale-105">
                <span className="material-symbols-outlined text-[32px]">{icon}</span>
            </div>
            <span className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition">{label}</span>
        </Link>
    );
}

function StatCard({ stat, index }: { stat: StatItem; index: number }) {
    const icons = ['groups', 'home', 'event', 'trending_up'];
    const icon = icons[index % icons.length];
    return (
        <div className="rounded-2xl p-2 sm:p-4 text-center">
            <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="material-symbols-outlined text-[22px]">{icon}</span>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-emerald-700 truncate">{stat.value}<span className="ml-1 text-xs sm:text-sm font-semibold text-slate-500">{stat.unit}</span></p>
            <p className="mt-1 text-[9px] sm:text-xs font-bold uppercase tracking-widest text-slate-600 leading-tight">{stat.label}</p>
        </div>
    );
}

function ArticleCard({ item, onRead }: { item: Announcement; onRead: () => void }) {
    return (
        <article className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:border-emerald-500/40 hover:shadow-md cursor-pointer" onClick={onRead}>
            {/* Image Section */}
            <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-slate-100 flex items-center justify-center">
                {item.imageUrl ? (
                    <>
                        <div
                            className="absolute inset-0 bg-cover bg-center blur-md opacity-25 scale-105 pointer-events-none"
                            style={{ backgroundImage: `url(${item.imageUrl})` }}
                        />
                        <img
                            src={item.imageUrl}
                            alt={item.title}
                            className="relative w-full h-full object-cover transition duration-500 group-hover:scale-[1.03]"
                        />
                    </>
                ) : (
                    <div className="flex h-full w-full items-center justify-center bg-slate-100">
                        <span className="material-symbols-outlined text-[32px] md:text-[48px] text-slate-400">newspaper</span>
                    </div>
                )}
                {/* Badges */}
                <div className="absolute left-2 top-2 flex flex-wrap gap-1">
                    <span className={['rounded-md px-1.5 py-0.5 text-[8px] font-bold tracking-wide shadow-sm capitalize', annBadgeClass(item.category)].join(' ')}>
                        {annLabel(item.category)}
                    </span>
                    {item.isPinned && (
                        <span className="rounded-md bg-emerald-600 px-1.5 py-0.5 text-[8px] font-bold text-white shadow-sm">Prioritas</span>
                    )}
                </div>
            </div>

            {/* Content Section */}
            <div className="flex-1 flex flex-col justify-between p-3 md:p-5">
                <div>
                    <div className="mb-1 flex items-center gap-1.5 text-[9px] md:text-[10px] text-slate-500">
                        <Clock size={10} />
                        <span>{item.publishedAt || '-'}</span>
                    </div>
                    <h3 className="line-clamp-2 text-xs md:text-base font-bold text-slate-900 group-hover:text-emerald-700 transition leading-snug">
                        {item.title}
                    </h3>
                    <p className="mt-1.5 hidden md:line-clamp-3 text-xs sm:text-sm leading-relaxed text-slate-600">
                        {item.excerpt}
                    </p>
                </div>

                <div className="mt-3">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onRead();
                        }}
                        className="inline-flex items-center gap-1 text-[10px] md:text-xs font-bold text-emerald-700 hover:text-emerald-800 transition-transform group-hover:translate-x-0.5"
                    >
                        Baca Selengkapnya <ArrowRight size={12} />
                    </button>
                </div>
            </div>
        </article>
    );
}

function EmptySection({ icon, title, description }: { icon: ReactNode; title: string; description: string }) {
    return (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-slate-600">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200">{icon}</div>
            <p className="font-bold text-slate-900">{title}</p>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-6">{description}</p>
        </div>
    );
}

function ContactCard({ icon, title, value, href }: { icon: ReactNode; title: string; value: string; href?: string }) {
    const content = (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 flex items-center gap-4 transition hover:-translate-y-0.5 hover:border-emerald-500/40 hover:shadow-md hover:no-underline">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                {icon}
            </div>
            <div className="min-w-0 flex-1 text-left">
                <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-slate-500 leading-none">{title}</p>
                <p className="mt-1.5 text-xs sm:text-sm font-bold text-slate-900 leading-snug break-words">{value}</p>
            </div>
        </div>
    );
    return href ? <a href={href} className="hover:no-underline block">{content}</a> : content;
}
