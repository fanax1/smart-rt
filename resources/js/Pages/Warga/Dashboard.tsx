import WargaLayout, { WargaProfile } from '@/Layouts/WargaLayout';
import { Head, Link } from '@inertiajs/react';
import { 
    Calendar, 
    ChevronRight, 
    Plus, 
    AlertTriangle, 
    Users, 
    Wallet, 
    Clock, 
    MapPin, 
    Sparkles, 
    ArrowRight,
    Megaphone
} from 'lucide-react';

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
};

type EventItem = {
    id: number;
    title?: string;
    judul?: string;
    date?: string | null;
    tanggal?: string | null;
    time?: string | null;
    location?: string | null;
    lokasi?: string | null;
    category?: string | null;
    kategori?: string | null;
    status?: string | null;
    description?: string | null;
    mandatory?: boolean;
};

type Props = {
    profile?: WargaProfile;
    familyCount?: number;
    unpaidBillsCount?: number;
    activeComplaintsCount?: number;
    latestAnnouncements?: Announcement[];
    upcomingEvents?: EventItem[];
    billingAmount?: number;
    billingStatus?: string;
    billingPeriod?: string;
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

function getRelativeTime(value?: string | null) {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    const diffMs = new Date().getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) {
        return `${Math.max(1, diffMins)} menit yang lalu`;
    } else if (diffHours < 24) {
        return `${diffHours} jam yang lalu`;
    } else {
        return `${diffDays} hari yang lalu`;
    }
}

function greeting(gender?: string | null) {
    const hour = new Date().getHours();
    let timeGreeting = 'Selamat pagi';
    if (hour >= 11 && hour < 15) timeGreeting = 'Selamat siang';
    else if (hour >= 15 && hour < 18) timeGreeting = 'Selamat sore';
    else if (hour >= 18) timeGreeting = 'Selamat malam';

    return timeGreeting;
}

export default function Dashboard({
    profile = fallbackProfile,
    familyCount = 0,
    unpaidBillsCount = 0,
    activeComplaintsCount = 0,
    latestAnnouncements = [],
    upcomingEvents = [],
    billingAmount = 0,
    billingStatus = 'Belum Bayar',
    billingPeriod = '-',
}: Props) {
    const safeProfile = profile ?? fallbackProfile;
    const announcements = Array.isArray(latestAnnouncements) ? latestAnnouncements : [];
    const events = Array.isArray(upcomingEvents) ? upcomingEvents : [];

    const getFirstName = (fullName: string) => {
        const cleanName = fullName.replace(/^(Pak|Bu|Ibu|Bapak)\s+/i, '');
        const first = cleanName.trim().split(' ')[0] || '';
        return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
    };

    const prefix = safeProfile.jenisKelamin === 'Laki-laki' ? 'Pak' : safeProfile.jenisKelamin === 'Perempuan' ? 'Ibu' : '';
    const formattedGreetingName = `${prefix} ${getFirstName(safeProfile.name)}`.trim();

    const getFormattedToday = () => {
        return new Date().toLocaleDateString('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

    const getEventDateParts = (dateString?: string | null) => {
        if (!dateString) return { day: '-', month: '-' };
        const d = new Date(dateString);
        if (Number.isNaN(d.getTime())) return { day: '-', month: '-' };
        return {
            day: d.getDate().toString().padStart(2, '0'),
            month: d.toLocaleDateString('id-ID', { month: 'short' }).toUpperCase(),
        };
    };

    return (
        <WargaLayout profile={safeProfile} title="Beranda">
            <Head title="Beranda Warga" />

            <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 lg:px-8 lg:py-8">
                {/* Greeting & Date Header */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-black text-slate-100 lg:text-3xl tracking-tight">
                            {greeting(safeProfile.jenisKelamin)}, {formattedGreetingName}.
                        </h1>
                        <p className="text-xs text-slate-400 mt-1">
                            Berikut adalah ringkasan aktivitas di lingkungan RT {safeProfile.rt || '04'} hari ini.
                        </p>
                    </div>

                    <div className="inline-flex items-center gap-2 rounded-xl bg-[#131b2e] px-4 py-2 text-xs font-semibold text-emerald-400 border border-slate-800 shadow-sm self-start md:self-auto">
                        <Calendar size={14} className="text-emerald-400" />
                        <span>{getFormattedToday()}</span>
                    </div>
                </div>

                {/* Main Grid Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column (Main widgets) */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Status Iuran & Pengumuman Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Card 1: Status Iuran */}
                            <div className="flex flex-col justify-between rounded-3xl bg-[#0b1220] border border-slate-800/80 p-5 shadow-lg relative overflow-hidden group hover:border-slate-700/60 transition">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl group-hover:bg-emerald-500/10 transition"></div>
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Status Iuran</span>
                                        <span className="text-xs font-semibold text-slate-400 bg-[#131b2e] px-2.5 py-0.5 rounded-lg border border-slate-800">
                                            {billingPeriod}
                                        </span>
                                    </div>
                                    <h2 className="text-2xl font-black text-emerald-400 tracking-tight mt-2">
                                        Rp {billingAmount.toLocaleString('id-ID')}
                                    </h2>
                                    
                                    <div className="mt-4">
                                        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold tracking-wide uppercase ${
                                            billingStatus === 'Sudah Bayar' 
                                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                : billingStatus === 'Menunggu Verifikasi'
                                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                                : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                        }`}>
                                            <span className={`h-1.5 w-1.5 rounded-full ${
                                                billingStatus === 'Sudah Bayar' ? 'bg-emerald-400' : billingStatus === 'Menunggu Verifikasi' ? 'bg-amber-400' : 'bg-red-400'
                                            }`} />
                                            {billingStatus}
                                        </span>
                                    </div>
                                </div>

                                <div className="border-t border-slate-800/60 pt-4 mt-6 flex items-center justify-between">
                                    <Link href="/warga/iuran" className="inline-flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-emerald-400 transition">
                                        Riwayat Iuran
                                        <ChevronRight size={14} className="mt-0.5" />
                                    </Link>
                                    <div className="p-2 rounded-xl bg-emerald-500/5 text-emerald-400">
                                        <Wallet size={16} />
                                    </div>
                                </div>
                            </div>

                            {/* Card 2: Pengumuman Terbaru */}
                            <div className="rounded-3xl bg-[#0b1220] border border-slate-800/80 p-5 shadow-lg hover:border-slate-700/60 transition flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <Megaphone size={16} className="text-emerald-400" />
                                            <h2 className="text-xs font-black text-slate-300 uppercase tracking-wider">Pengumuman Terbaru</h2>
                                        </div>
                                        <Link href="/warga/pengumuman" className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 transition">
                                            Lihat Semua
                                        </Link>
                                    </div>

                                    <div className="space-y-3">
                                        {announcements.length === 0 ? (
                                            <div className="rounded-2xl border border-dashed border-slate-800 p-4 text-center text-xs text-slate-500">
                                                Belum ada pengumuman terbaru.
                                            </div>
                                        ) : (
                                            announcements.slice(0, 2).map((item) => {
                                                const isPenting = (item.kategori || item.category || '').toLowerCase() === 'penting';
                                                return (
                                                    <Link 
                                                        key={item.id} 
                                                        href="/warga/pengumuman" 
                                                        className="block rounded-2xl border border-slate-800/50 bg-[#131b2e]/40 p-3 hover:border-slate-700 hover:bg-[#131b2e]/70 transition"
                                                    >
                                                        <div className="flex items-center justify-between mb-1.5">
                                                            <span className={`rounded-md px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide ${
                                                                isPenting 
                                                                    ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                                                                    : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                                            }`}>
                                                                {item.kategori || item.category || 'Info'}
                                                            </span>
                                                            <span className="text-[10px] text-slate-500">
                                                                {getRelativeTime(item.publishedAt || item.date)}
                                                            </span>
                                                        </div>
                                                        <p className="line-clamp-1 text-xs font-bold text-slate-300">
                                                            {item.judul || item.title || '-'}
                                                        </p>
                                                        <p className="line-clamp-1 text-[10px] text-slate-500 mt-0.5">
                                                            {item.isi || item.body || '-'}
                                                        </p>
                                                    </Link>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Kegiatan Mendatang */}
                        <div className="rounded-3xl bg-[#0b1220] border border-slate-800/80 p-5 shadow-lg">
                            <div className="flex items-center justify-between mb-5">
                                <div className="flex items-center gap-2">
                                    <Calendar size={16} className="text-emerald-400" />
                                    <h2 className="text-xs font-black text-slate-300 uppercase tracking-wider">Kegiatan Mendatang</h2>
                                </div>
                                <Link href="/warga/kegiatan" className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 transition">
                                    Lihat Semua
                                </Link>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {events.length === 0 ? (
                                    <div className="col-span-2 rounded-2xl border border-dashed border-slate-800 p-8 text-center text-xs text-slate-500">
                                        Belum ada agenda kegiatan mendatang.
                                    </div>
                                ) : (
                                    events.slice(0, 2).map((event) => {
                                        const dateParts = getEventDateParts(event.date || event.tanggal);
                                        const isMandatory = event.mandatory;
                                        return (
                                            <div 
                                                key={event.id} 
                                                className="flex items-start gap-4 rounded-2xl bg-[#131b2e]/30 border border-slate-800/80 p-4 shadow-sm"
                                            >
                                                {/* Calendar Date Block */}
                                                <div className={`flex flex-col items-center justify-center h-14 w-12 shrink-0 rounded-xl ${
                                                    isMandatory 
                                                        ? 'bg-emerald-500 text-slate-950 font-black' 
                                                        : 'bg-slate-800 text-slate-300 font-bold border border-slate-700/60'
                                                }`}>
                                                    <span className="text-lg leading-none">{dateParts.day}</span>
                                                    <span className="text-[9px] uppercase mt-0.5 tracking-wider font-extrabold">{dateParts.month}</span>
                                                </div>

                                                {/* Event Info */}
                                                <div className="min-w-0 flex-1 space-y-1">
                                                    <h3 className="line-clamp-1 text-xs font-bold text-slate-200">
                                                        {event.title || event.judul || '-'}
                                                    </h3>
                                                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                                                        <Clock size={11} className="text-emerald-400/80" />
                                                        <span className="truncate">{event.time || '-'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                                                        <MapPin size={11} className="text-emerald-400/80 shrink-0" />
                                                        <span className="truncate">{event.location || event.lokasi || '-'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column (Quick actions & profile stats) */}
                    <div className="space-y-6">
                        {/* Quick actions stack */}
                        <div className="grid grid-cols-2 gap-4 lg:grid-cols-1">
                            {/* Action 1: Ajukan Surat */}
                            <Link 
                                href="/warga/ajukan-surat"
                                className="flex flex-col lg:flex-row items-center lg:justify-between gap-4 rounded-3xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 p-5 transition duration-200 shadow-lg group active:scale-98"
                            >
                                <div className="text-center lg:text-left">
                                    <p className="text-sm font-black tracking-tight leading-none">Ajukan Surat</p>
                                    <p className="text-[10px] font-bold text-slate-800 mt-1 hidden lg:block">Proses dokumen RT instan</p>
                                </div>
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950/10 text-slate-950 border border-slate-950/15 group-hover:scale-105 transition">
                                    <Plus size={22} className="stroke-[3]" />
                                </div>
                            </Link>

                            {/* Action 2: Lapor Masalah */}
                            <Link 
                                href="/warga/pengaduan"
                                className="flex flex-col lg:flex-row items-center lg:justify-between gap-4 rounded-3xl bg-[#131b2e] border border-red-500/25 text-red-400 p-5 hover:bg-red-500/5 hover:border-red-500/40 transition duration-200 shadow-lg group active:scale-98"
                            >
                                <div className="text-center lg:text-left">
                                    <p className="text-sm font-black tracking-tight leading-none text-slate-200">Lapor Masalah</p>
                                    <p className="text-[10px] text-slate-500 mt-1 hidden lg:block">Laporkan aduan lingkungan</p>
                                </div>
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-500/10 text-red-400 border border-red-500/25 group-hover:scale-105 transition">
                                    <AlertTriangle size={20} />
                                </div>
                            </Link>
                        </div>

                        {/* Warga Profile Card */}
                        <div className="rounded-3xl border border-slate-800 bg-[#0b1220] p-5 shadow-xl relative overflow-hidden group">
                            {/* Graphic background details */}
                            <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/5 rounded-full blur-3xl group-hover:bg-emerald-500/10 transition"></div>
                            
                            <div className="flex flex-col items-center text-center pb-6 border-b border-slate-800/80 relative">
                                <div className="relative mb-4">
                                    <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2 border-emerald-500/20 bg-[#131b2e] shadow-lg">
                                        {safeProfile.profilePhotoUrl ? (
                                            <img
                                                src={safeProfile.profilePhotoUrl}
                                                alt={safeProfile.name}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <span className="text-2xl font-black text-emerald-400">{safeProfile.initials}</span>
                                        )}
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-[#131b2e] border border-slate-800 shadow text-emerald-400">
                                        <Sparkles size={11} />
                                    </div>
                                </div>

                                <h3 className="text-base font-black text-slate-100 leading-tight">
                                    {safeProfile.name}
                                </h3>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-md px-2 py-0.5 mt-2 inline-block">
                                    {safeProfile.hubunganKeluarga || 'Anggota Keluarga'}
                                </p>
                            </div>

                            {/* stats grid */}
                            <div className="grid grid-cols-2 gap-3 pt-5 relative">
                                <div className="bg-[#131b2e]/40 border border-slate-800/60 rounded-2xl p-3 text-center hover:border-slate-800 transition">
                                    <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Anggota</span>
                                    <p className="text-base font-black text-slate-200 mt-1">
                                        {familyCount} <span className="text-xs font-semibold text-slate-500">Orang</span>
                                    </p>
                                </div>

                                <div className="bg-[#131b2e]/40 border border-slate-800/60 rounded-2xl p-3 text-center hover:border-slate-800 transition">
                                    <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">No Rumah</span>
                                    <p className="text-base font-black text-emerald-400 mt-1">
                                        {safeProfile.houseNumber || '-'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Section */}
                <div className="border-t border-slate-800/60 pt-6 mt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-[10px] text-slate-500">
                    <p>© 2026 SMART-RT. Powered by Digital Civic Platform.</p>
                    <div className="flex items-center gap-4">
                        <a href="#" className="hover:text-slate-400 transition">Syarat & Ketentuan</a>
                        <a href="#" className="hover:text-slate-400 transition">Pusat Bantuan</a>
                        <a href="#" className="hover:text-slate-400 transition">Kontak Pengurus</a>
                    </div>
                </div>
            </div>
        </WargaLayout>
    );
}
