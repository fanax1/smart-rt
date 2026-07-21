import WargaLayout, { WargaProfile } from '@/Layouts/WargaLayout';
import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    Calendar as CalendarIcon,
    CheckCircle,
    Clock,
    MapPin,
    Search,
    Tag,
    UserCheck,
    Users,
    X,
    XCircle,
    ChevronLeft,
    ChevronRight,
    MapPin as MapPinIcon,
    Sparkles,
    CalendarDays
} from 'lucide-react';
import { useMemo, useState } from 'react';

type Participant = {
    id: number;
    wargaId: number;
    name: string;
    initials: string;
    houseNumber?: string | null;
    joinedAt?: string | null;
};

type EventItem = {
    id: number;
    title: string;
    date?: string | null;
    time?: string | null;
    location?: string | null;
    category?: string | null;
    status?: string | null;
    description?: string | null;
    mandatory?: boolean;
    participantsCount?: number;
    isJoined?: boolean;
    participants?: Participant[];
    image?: string;      // untuk fallback/dummy data
    imageUrl?: string | null;  // dari backend Storage::url(poster)
};

type Props = {
    profile?: WargaProfile;
    events?: EventItem[];
    pastEvents?: EventItem[];
};

const fallbackProfile: WargaProfile = {
    name: 'Warga',
    initials: 'WG',
    houseNumber: '-',
    hasLinkedWarga: false,
};

const defaultPastEvents: EventItem[] = [
    {
        id: 991,
        title: 'Penyuluhan Kesehatan Lansia',
        date: '2026-05-15',
        category: 'KESEHATAN',
        location: 'Posyandu RT',
        description: 'Kegiatan pemeriksaan kesehatan rutin dan edukasi pola hidup sehat bagi warga lanjut usia.',
        image: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=600&q=80',
        participantsCount: 32,
    },
    {
        id: 992,
        title: 'Penghijauan Fasilitas Umum',
        date: '2026-04-30',
        category: 'LINGKUNGAN',
        location: 'Taman Warga RT',
        description: 'Penanaman 50 bibit pohon pelindung dan tanaman hias di sepanjang jalan utama RT.',
        image: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=600&q=80',
        participantsCount: 20,
    },
    {
        id: 993,
        title: 'Halal bi Halal Warga',
        date: '2026-04-12',
        category: 'SOSIAL',
        location: 'Balai Pertemuan RT',
        description: 'Silaturahmi akbar pasca Idul Fitri untuk mempererat tali persaudaraan antar tetangga.',
        image: 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&w=600&q=80',
        participantsCount: 85,
    }
];

function formatDate(value?: string | null) {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return value;
    }
    return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

function formatDateFull(value?: string | null) {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return value;
    }
    return date.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    });
}

function getEventColorClass(category?: string | null) {
    const cat = String(category || '').toLowerCase();
    if (cat.includes('sosial') || cat.includes('bakti')) {
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
    }
    if (cat.includes('perayaan') || cat.includes('hut') || cat.includes('lomba')) {
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
    }
    if (cat.includes('rapat') || cat.includes('musyawarah') || cat.includes('rt')) {
        return 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20';
    }
    return 'bg-slate-800 text-slate-400 border border-slate-700/60';
}

function getEventBadgeColor(category?: string | null) {
    const cat = String(category || '').toLowerCase();
    if (cat.includes('sosial') || cat.includes('bakti')) {
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
    }
    if (cat.includes('perayaan') || cat.includes('hut')) {
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
    }
    return 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20';
}

export default function Kegiatan({ profile = fallbackProfile, events = [], pastEvents = [] }: Props) {
    const safeProfile = profile ?? fallbackProfile;
    const safeEvents = Array.isArray(events) ? events : [];
    const dbPastEvents = Array.isArray(pastEvents) ? pastEvents : [];
    const activePastEvents = dbPastEvents.length > 0 ? dbPastEvents : defaultPastEvents;

    const [search, setSearch] = useState('');
    const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
    const [currentDate, setCurrentDate] = useState(new Date());

    const handleSearch = (text: string) => {
        setSearch(text);
    };

    const joinEvent = (event: EventItem) => {
        router.post(`/warga/kegiatan/${event.id}/ikut`, {}, {
            preserveScroll: true,
        });
    };

    const cancelJoinEvent = (event: EventItem) => {
        if (!confirm(`Batalkan partisipasi pada kegiatan "${event.title}"?`)) {
            return;
        }

        router.delete(`/warga/kegiatan/${event.id}/batal`, {
            preserveScroll: true,
        });
    };

    // Filter events locally by search
    const filteredEvents = useMemo(() => {
        const keyword = search.trim().toLowerCase();
        return safeEvents.filter((event) => {
            const haystack = [
                event.title,
                event.description,
                event.location,
                event.category,
            ].filter(Boolean).join(' ').toLowerCase();

            return keyword === '' || haystack.includes(keyword);
        });
    }, [safeEvents, search]);

    // Calendar generation details
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const monthName = currentDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

    const calendarGrid = useMemo(() => {
        const firstDayIndex = new Date(year, month, 1).getDay(); // Sunday is 0
        const totalDays = new Date(year, month + 1, 0).getDate();
        const prevMonthTotalDays = new Date(year, month, 0).getDate();

        // Previous month padding
        const prevDays = Array.from({ length: firstDayIndex }, (_, i) => {
            const dayNum = prevMonthTotalDays - firstDayIndex + i + 1;
            const m = month === 0 ? 11 : month - 1;
            const y = month === 0 ? year - 1 : year;
            return {
                day: dayNum,
                isCurrentMonth: false,
                dateString: `${y}-${String(m + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
            };
        });

        // Current month days
        const currDays = Array.from({ length: totalDays }, (_, i) => {
            const dayNum = i + 1;
            return {
                day: dayNum,
                isCurrentMonth: true,
                dateString: `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
            };
        });

        // Next month padding
        const totalCells = prevDays.length + currDays.length;
        const nextPaddingCount = (7 - (totalCells % 7)) % 7;
        const nextDays = Array.from({ length: nextPaddingCount }, (_, i) => {
            const dayNum = i + 1;
            const m = month === 11 ? 0 : month + 1;
            const y = month === 11 ? year + 1 : year;
            return {
                day: dayNum,
                isCurrentMonth: false,
                dateString: `${y}-${String(m + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
            };
        });

        return [...prevDays, ...currDays, ...nextDays];
    }, [year, month]);

    const changeMonth = (direction: 'prev' | 'next') => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            if (direction === 'prev') {
                newDate.setMonth(prev.getMonth() - 1);
            } else {
                newDate.setMonth(prev.getMonth() + 1);
            }
            return newDate;
        });
    };

    return (
        <WargaLayout profile={safeProfile} title="Kegiatan" searchQuery={search} onSearchChange={handleSearch}>
            <Head title="Agenda Kegiatan RT" />

            <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 lg:px-8 lg:py-8">
                {/* Header Back & Titles */}
                <div className="flex items-center gap-3">
                    <Link href="/warga/dashboard" className="rounded-xl bg-[#131b2e] border border-slate-800 p-2 text-slate-400 hover:text-slate-200 transition">
                        <ArrowLeft size={16} />
                    </Link>
                    <div>
                        <h1 className="text-xl font-black text-slate-100 tracking-tight">Kegiatan RT</h1>
                        <p className="text-xs text-slate-500 mt-0.5">Kelola dan ikuti agenda kebersamaan warga lingkungan SMART-RT.</p>
                    </div>
                </div>

                {/* Mobile Search input */}
                <div className="lg:hidden relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => handleSearch(e.target.value)}
                        placeholder="Cari kegiatan..."
                        className="w-full rounded-2xl border border-slate-800 bg-[#131b2e] py-3 pl-10 pr-4 text-xs text-slate-200 placeholder-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    />
                </div>

                {/* Grid Split Content */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Left Column: Calendar Component */}
                    <div className="lg:col-span-8">
                        <div className="rounded-3xl border border-slate-800 bg-[#0b1220] p-5 shadow-xl relative overflow-hidden">
                            {/* Calendar Header Nav */}
                            <div className="flex items-center justify-between mb-4 border-b border-slate-850 pb-4">
                                <div className="flex items-center gap-2">
                                    <h2 className="text-base font-black text-slate-150 capitalize tracking-tight">{monthName}</h2>
                                    <div className="flex items-center gap-1">
                                        <button 
                                            onClick={() => changeMonth('prev')}
                                            className="p-1 rounded-lg bg-[#131b2e] border border-slate-850 text-slate-400 hover:text-slate-250 transition"
                                        >
                                            <ChevronLeft size={14} />
                                        </button>
                                        <button 
                                            onClick={() => changeMonth('next')}
                                            className="p-1 rounded-lg bg-[#131b2e] border border-slate-850 text-slate-400 hover:text-slate-250 transition"
                                        >
                                            <ChevronRight size={14} />
                                        </button>
                                    </div>
                                </div>
                                {/* Filter pills mock */}
                                <div className="flex items-center gap-1.5 bg-[#131b2e] p-1 rounded-xl border border-slate-850">
                                    <button className="px-3 py-1 rounded-lg text-[9px] font-black uppercase bg-slate-800 text-slate-200">Bulan</button>
                                    <button className="px-3 py-1 rounded-lg text-[9px] font-black uppercase text-slate-500 hover:text-slate-300">Minggu</button>
                                </div>
                            </div>

                            {/* Calendar Weeks header */}
                            <div className="grid grid-cols-7 text-center text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2">
                                <div>Min</div>
                                <div>Sen</div>
                                <div>Sel</div>
                                <div>Rab</div>
                                <div>Kam</div>
                                <div>Jum</div>
                                <div>Sab</div>
                            </div>

                            {/* Calendar Days grid */}
                            <div className="grid grid-cols-7 gap-1 border border-slate-850 rounded-2xl overflow-hidden bg-[#131b2e]/20">
                                {calendarGrid.map((gridDay, idx) => {
                                    // Find events on this day
                                    const dayEvents = safeEvents.filter(e => e.date === gridDay.dateString);
                                    
                                    return (
                                        <div 
                                            key={`${gridDay.dateString}-${idx}`}
                                            className={`min-h-[72px] sm:min-h-[85px] p-2 flex flex-col justify-between border-slate-850 transition duration-150 ${
                                                idx % 7 !== 6 ? 'border-r' : ''
                                            } ${
                                                idx < calendarGrid.length - 7 ? 'border-b' : ''
                                            } ${
                                                gridDay.isCurrentMonth ? 'bg-transparent' : 'bg-slate-950/20'
                                            }`}
                                        >
                                            {/* Date number */}
                                            <span className={`text-[10px] font-black leading-none ${
                                                gridDay.isCurrentMonth ? 'text-slate-350' : 'text-slate-600'
                                            }`}>
                                                {gridDay.day}
                                            </span>

                                            {/* Day Event badges */}
                                            <div className="space-y-1 mt-1.5">
                                                {dayEvents.map(evt => (
                                                    <button
                                                        key={evt.id}
                                                        type="button"
                                                        onClick={() => setSelectedEvent(evt)}
                                                        className={`w-full text-[8px] font-bold text-left px-1.5 py-0.5 rounded truncate block transition active:scale-97 border ${getEventColorClass(evt.category)}`}
                                                        title={evt.title}
                                                    >
                                                        {evt.title}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Event Stats & Agenda Terdekat */}
                    <div className="lg:col-span-4 space-y-6">
                        {/* Summary Widget */}
                        <div className="rounded-3xl border border-slate-800 bg-[#0b1220] p-5 shadow-xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl"></div>
                            
                            <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Ringkasan Kegiatan</h2>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-2xl font-black text-slate-100">{safeEvents.length}</p>
                                    <p className="text-[9px] uppercase font-bold text-slate-500 mt-1 tracking-wider">Mendatang</p>
                                </div>
                                <div className="border-l border-slate-850 pl-4">
                                    <p className="text-2xl font-black text-emerald-400">{activePastEvents.length + 20}</p>
                                    <p className="text-[9px] uppercase font-bold text-slate-500 mt-1 tracking-wider">Total Selesai</p>
                                </div>
                            </div>
                        </div>

                        {/* Agenda Terdekat list */}
                        <div className="rounded-3xl border border-slate-800 bg-[#0b1220] p-5 shadow-xl relative overflow-hidden">
                            <div className="flex items-center justify-between mb-4 border-b border-slate-850/80 pb-3">
                                <h3 className="text-xs font-black text-slate-300 uppercase tracking-wider">Agenda Terdekat</h3>
                                <span className="text-[10px] font-black text-emerald-400 hover:text-emerald-350 transition cursor-pointer">Lihat Semua</span>
                            </div>

                            {filteredEvents.length === 0 ? (
                                <div className="text-center py-6 text-xs text-slate-500 border border-dashed border-slate-850 rounded-2xl">
                                    Belum ada agenda kegiatan mendatang.
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {filteredEvents.slice(0, 3).map((event) => (
                                        <div 
                                            key={event.id}
                                            className="rounded-2xl border border-slate-850 bg-[#131b2e]/30 overflow-hidden hover:border-slate-700/60 transition group"
                                        >
                                            {/* Thumbnail kecil jika ada */}
                                            {(event.imageUrl || event.image) && (
                                                <div className="h-24 w-full overflow-hidden relative">
                                                    <img
                                                        src={event.imageUrl || event.image}
                                                        alt={event.title}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-[#131b2e] via-transparent to-transparent opacity-70" />
                                                </div>
                                            )}
                                            <div className="p-3.5 space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <span className={`rounded px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wide inline-block ${getEventBadgeColor(event.category)}`}>
                                                        {event.category || 'Umum'}
                                                    </span>
                                                    <span className="text-[10px] text-slate-500 font-bold font-mono">
                                                        {event.time}
                                                    </span>
                                                </div>

                                                <h4 className="text-xs font-black text-slate-200 leading-snug tracking-tight group-hover:text-emerald-400 transition-colors">
                                                    {event.title}
                                                </h4>

                                                <div className="space-y-1.5 text-[10px] text-slate-400 font-medium">
                                                    <p className="flex items-center gap-1.5">
                                                        <CalendarIcon size={12} className="text-emerald-400/80 shrink-0" />
                                                        <span>{formatDate(event.date)}</span>
                                                    </p>
                                                    {event.location && (
                                                        <p className="flex items-center gap-1.5">
                                                            <MapPinIcon size={12} className="text-emerald-400/80 shrink-0" />
                                                            <span className="truncate">{event.location}</span>
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="pt-3 border-t border-slate-850/60 flex gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedEvent(event)}
                                                        className={['py-2 rounded-xl border border-slate-800 bg-[#0b1220] hover:bg-[#1a243d] text-[10px] font-bold text-slate-350 text-center transition', event.status?.toLowerCase() === 'dijadwalkan' ? 'flex-1' : 'w-full'].join(' ')}
                                                    >
                                                        Detail
                                                    </button>
                                                    {event.status?.toLowerCase() === 'dijadwalkan' && (
                                                        event.isJoined ? (
                                                            <button
                                                                type="button"
                                                                onClick={() => cancelJoinEvent(event)}
                                                                className="flex-1 py-2 rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-[10px] font-black text-red-400 text-center transition active:scale-97"
                                                            >
                                                                Batal Ikut
                                                            </button>
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                onClick={() => joinEvent(event)}
                                                                className="flex-1 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-[10px] font-black text-center transition active:scale-97"
                                                            >
                                                                Daftar
                                                            </button>
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Bottom Row: Kegiatan Terlaksana (Past events list cards) */}
                <div className="rounded-3xl border border-slate-800 bg-[#0b1220] p-5 shadow-xl">
                    <h3 className="text-xs font-black text-slate-300 uppercase tracking-wider mb-5 pb-3 border-b border-slate-850/80 flex items-center gap-2">
                        <CalendarDays size={14} className="text-emerald-400" />
                        <span>Kegiatan Terlaksana</span>
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {activePastEvents.map((evt) => {
                            // Gunakan imageUrl dari backend, fallback ke image dummy
                            const thumbnail = evt.imageUrl || evt.image || null;
                            return (
                                <div 
                                    key={evt.id}
                                    className="rounded-2xl border border-slate-850 bg-[#131b2e]/10 overflow-hidden shadow hover:border-slate-700/60 transition group flex flex-col justify-between"
                                >
                                    <div>
                                        {thumbnail ? (
                                            <div className="h-40 w-full overflow-hidden relative">
                                                <img src={thumbnail} alt={evt.title} className="w-full h-full object-cover group-hover:scale-102 transition duration-300" />
                                                <div className="absolute inset-0 bg-gradient-to-t from-[#0b1220] via-transparent to-transparent opacity-80" />
                                            </div>
                                        ) : (
                                            <div className="h-40 w-full bg-[#131b2e] flex items-center justify-center border-b border-slate-850">
                                                <CalendarIcon size={24} className="text-slate-650" />
                                            </div>
                                        )}
                                        <div className="p-4 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[8px] font-black text-slate-500 tracking-wider font-mono">
                                                    {formatDate(evt.date)}
                                                </span>
                                                <span className="text-[8px] font-extrabold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded uppercase tracking-wider">
                                                    {evt.category || 'Selesai'}
                                                </span>
                                            </div>
                                            <h4 className="text-xs font-black text-slate-200 group-hover:text-emerald-400 transition-colors leading-tight">
                                                {evt.title}
                                            </h4>
                                            <p className="text-[10px] text-slate-450 leading-relaxed font-medium line-clamp-2">
                                                {evt.description || 'Kegiatan warga RT telah selesai dilaksanakan dengan baik.'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="p-4 pt-0 border-t border-slate-850/40 mt-3 flex items-center justify-between gap-2">
                                        <span className="text-[9px] font-bold text-slate-550 flex items-center gap-1 shrink-0">
                                            <Users size={11} className="text-emerald-400" />
                                            <span>Selesai • {evt.participantsCount || 0} Hadir</span>
                                        </span>
                                        <div className="flex items-center gap-2">
                                            {/* Tombol Lihat Detail */}
                                            <button 
                                                type="button"
                                                onClick={() => setSelectedEvent(evt)}
                                                className="text-[9px] font-black text-slate-400 hover:text-slate-200 transition flex items-center gap-1 border border-slate-800 rounded-lg px-2 py-1"
                                            >
                                                <span>Detail</span>
                                            </button>
                                            {/* Tombol Lihat Dokumentasi */}
                                            <button 
                                                type="button"
                                                onClick={() => setSelectedEvent(evt)}
                                                className="text-[9px] font-black text-emerald-400 hover:text-emerald-300 transition flex items-center gap-1.5"
                                            >
                                                <span>Dokumentasi</span>
                                                <ArrowLeft size={10} className="rotate-180 mt-0.5 stroke-[2.5]" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Modal: View Event/Participants Details */}
            {selectedEvent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md max-h-[88vh] flex flex-col rounded-3xl bg-[#0b1220] border border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="flex items-start justify-between gap-4 border-b border-slate-800/80 p-5 bg-[#131b2e]/30">
                            <div>
                                <span className={`rounded px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wide inline-block ${getEventBadgeColor(selectedEvent.category)}`}>
                                    {selectedEvent.category || 'Umum'}
                                </span>
                                <h3 className="mt-2 text-base font-black text-slate-100 leading-tight">{selectedEvent.title}</h3>
                                <p className="mt-1 text-[10px] text-slate-500 font-bold">{formatDateFull(selectedEvent.date)}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedEvent(null)}
                                className="rounded-xl p-1.5 text-slate-400 hover:bg-[#131b2e] hover:text-slate-200 transition"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-5 overflow-y-auto space-y-4 flex-1 scrollbar-thin">
                            {/* Foto/Poster kegiatan jika ada */}
                            {(selectedEvent.imageUrl || selectedEvent.image) && (
                                <div className="rounded-2xl overflow-hidden border border-slate-800">
                                    <img
                                        src={selectedEvent.imageUrl || selectedEvent.image}
                                        alt={selectedEvent.title}
                                        className="w-full max-h-48 object-cover"
                                    />
                                </div>
                            )}

                            {/* Description block */}
                            <div className="rounded-2xl bg-[#131b2e]/30 border border-slate-850 p-4 space-y-2">
                                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Keterangan Kegiatan</p>
                                <p className="text-xs text-slate-350 leading-relaxed font-medium whitespace-pre-line">
                                    {selectedEvent.description || 'Tidak ada deskripsi tambahan.'}
                                </p>
                            </div>

                            {/* Details meta grid */}
                            <div className="grid grid-cols-2 gap-3 text-xs text-slate-400 font-medium">
                                <div className="bg-[#131b2e]/20 border border-slate-850 rounded-2xl p-3">
                                    <p className="text-[8px] uppercase font-bold text-slate-500 tracking-wider">Jam Mulai</p>
                                    <p className="text-xs font-black text-slate-300 mt-1 flex items-center gap-1.5">
                                        <Clock size={12} className="text-emerald-400" />
                                        <span>{selectedEvent.time || '-'}</span>
                                    </p>
                                </div>
                                <div className="bg-[#131b2e]/20 border border-slate-850 rounded-2xl p-3">
                                    <p className="text-[8px] uppercase font-bold text-slate-500 tracking-wider">Lokasi</p>
                                    <p className="text-xs font-black text-slate-300 mt-1 flex items-center gap-1.5">
                                        <MapPin size={12} className="text-emerald-400" />
                                        <span className="truncate">{selectedEvent.location || '-'}</span>
                                    </p>
                                </div>
                            </div>

                            {/* Participants List */}
                            <div className="space-y-2.5">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center justify-between">
                                    <span>Partisipasi Warga</span>
                                    <span className="text-emerald-400">{selectedEvent.participantsCount || 0} Terdaftar</span>
                                </h4>
                                <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin">
                                    {(selectedEvent.participants || []).length > 0 ? (
                                        (selectedEvent.participants || []).map((participant) => (
                                            <div
                                                key={participant.id}
                                                className="flex items-center gap-3 rounded-2xl border border-slate-850 bg-[#131b2e]/20 p-3"
                                            >
                                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10 text-xs font-black text-emerald-400 border border-emerald-500/20">
                                                    {participant.initials}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate font-bold text-slate-200 text-xs">{participant.name}</p>
                                                    <p className="text-[10px] text-slate-500 font-bold">
                                                        Rumah No. {participant.houseNumber || '-'}
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="rounded-2xl border border-dashed border-slate-850 bg-[#131b2e]/10 p-6 text-center text-[11px] text-slate-500">
                                            Belum ada warga terdaftar. Klik "Daftar" untuk berpartisipasi.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="border-t border-slate-800/80 p-5 bg-[#131b2e]/10 flex gap-3">
                            <button 
                                type="button" 
                                onClick={() => setSelectedEvent(null)}
                                className={['rounded-xl bg-[#131b2e] hover:bg-[#1a243d] border border-slate-800 px-4 py-2.5 text-xs font-bold text-slate-300 transition', selectedEvent.status?.toLowerCase() === 'dijadwalkan' ? 'flex-1' : 'w-full'].join(' ')}
                            >
                                Tutup Detail
                            </button>
                            {selectedEvent.status?.toLowerCase() === 'dijadwalkan' && (
                                selectedEvent.isJoined ? (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            cancelJoinEvent(selectedEvent);
                                            setSelectedEvent(null);
                                        }}
                                        className="flex-1 rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-xs font-black text-red-400 transition"
                                    >
                                        Batal Daftar
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            joinEvent(selectedEvent);
                                            setSelectedEvent(null);
                                        }}
                                        className="flex-1 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs font-black transition"
                                    >
                                        Daftar Kegiatan
                                    </button>
                                )
                            )}
                        </div>
                    </div>
                </div>
            )}
        </WargaLayout>
    );
}
