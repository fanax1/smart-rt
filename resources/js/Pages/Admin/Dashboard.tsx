import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router } from '@inertiajs/react';
import {
    MessageSquare,
    Calendar,
    Users,
    Wallet,
    AlertTriangle,
    TrendingUp,
    Phone,
    Video,
    MoreVertical,
    Plus,
    Smile,
    Send,
    FileText,
    ArrowRight,
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface Citizen {
    id: number;
    name: string;
    noRumah: string;
    profilePhotoUrl?: string | null;
    lastSeen: string;
    snippet: string;
}

interface DashboardProps {
    totalResidents?: number;
    totalHouses?: number;
    totalEvents?: number;
    totalComplaints?: number;
    pendingComplaints?: number;
    totalFinanceBalance?: number;
    activeCitizens?: Citizen[];
    helpdeskStats?: {
        total: number;
        pending: number;
        processing: number;
        resolved: number;
    };
    pengaduanStats?: {
        total: number;
        pending: number;
        processing: number;
        resolved: number;
    };
    suratStats?: {
        total: number;
        pending: number;
        approved: number;
        resolved: number;
    };
    recentNotifications?: any[];
    databaseOnlineCitizens?: any[];
}

function formatCurrency(amount: number) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

function formatNumber(num: number) {
    return new Intl.NumberFormat('id-ID').format(num);
}

export default function Dashboard({
    totalResidents = 0,
    totalHouses = 0,
    totalEvents = 0,
    totalComplaints = 0,
    pendingComplaints = 0,
    totalFinanceBalance = 0,
    activeCitizens = [],
    helpdeskStats = { total: 0, pending: 0, processing: 0, resolved: 0 },
    pengaduanStats = { total: 0, pending: 0, processing: 0, resolved: 0 },
    suratStats = { total: 0, pending: 0, approved: 0, resolved: 0 },
    recentNotifications = [],
    databaseOnlineCitizens = [],
}: DashboardProps) {
    // Presence Channel for online citizens (initialized with database fallback list)
    const [onlineCitizens, setOnlineCitizens] = useState<any[]>(databaseOnlineCitizens || []);

    // Sync state if databaseOnlineCitizens prop changes
    useEffect(() => {
        if (databaseOnlineCitizens) {
            setOnlineCitizens((prev) => {
                // Merge database list with Echo real-time list to keep the set unique
                const merged = [...databaseOnlineCitizens];
                prev.forEach((item) => {
                    if (!merged.some((m) => m.id === item.id)) {
                        merged.push(item);
                    }
                });
                return merged;
            });
        }
    }, [databaseOnlineCitizens]);

    useEffect(() => {
        // Poll for database online citizens every 15 seconds to keep synced
        const pollInterval = setInterval(() => {
            router.reload({ only: ['databaseOnlineCitizens'] });
        }, 15000);

        const echo = (window as any).Echo;
        if (!echo) {
            return () => {
                clearInterval(pollInterval);
            };
        }

        const channel = echo.join('online-citizens');

        channel.here((users: any[]) => {
            const citizens = users.filter((u) => u.role !== 'admin');
            setOnlineCitizens((prev) => {
                const uniqueCitizens = [...citizens];
                prev.forEach((item) => {
                    if (!uniqueCitizens.some((u) => u.id === item.id)) {
                        uniqueCitizens.push(item);
                    }
                });
                return uniqueCitizens;
            });
        });

        channel.joining((user: any) => {
            if (user.role !== 'admin') {
                setOnlineCitizens((prev) => {
                    if (prev.some((u) => u.id === user.id)) return prev;
                    return [...prev, user];
                });
            }
        });

        channel.leaving((user: any) => {
            setOnlineCitizens((prev) => prev.filter((u) => u.id !== user.id));
        });

        return () => {
            clearInterval(pollInterval);
            echo.leave('online-citizens');
        };
    }, []);

    return (
        <AdminLayout activeMenu="dashboard">
            <Head title="Admin Console - SMART-RT" />

            {/* Title Header Section */}
            <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <h2 className="text-3xl font-black tracking-tight text-white">Admin Console</h2>
                    <p className="mt-1 text-sm text-slate-400 font-medium">System-wide performance and engagement metrics for SMART-RT.</p>
                </div>

            </div>

            {/* Categorized Notifications Card Grid */}
            <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* 1. TIKET HELPDESK CARD */}
                <div className="rounded-2xl border border-emerald-500/20 bg-[#111A2E]/60 p-6 shadow-md relative overflow-hidden backdrop-blur-sm">
                    <div className="mb-4 flex items-center justify-between">
                        <span className="text-[10px] font-black tracking-widest text-emerald-400 uppercase">TIKET HELPDESK MASUK</span>
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                            <MessageSquare size={16} />
                        </div>
                    </div>

                    <div className="grid grid-cols-5 gap-4 items-center">
                        <div className="col-span-2 flex flex-col justify-center border-r border-[#1C2541]/40 pr-4">
                            <div className="flex items-center gap-1.5">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                </span>
                                <span className="text-[9px] font-bold text-red-400 tracking-wider">MENUNGGU</span>
                            </div>
                            <h3 className="text-4xl font-black tracking-tight text-white mt-1.5">{helpdeskStats.pending}</h3>
                            <p className="text-[10px] text-slate-400 font-semibold mt-1">Belum Dijawab</p>
                        </div>
                        <div className="col-span-3 pl-2 space-y-2 text-xs font-semibold text-slate-300">
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400">Total Tiket</span>
                                <span className="text-white font-black">{helpdeskStats.total}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400">Sedang Diproses</span>
                                <span className="text-amber-400 font-black">{helpdeskStats.processing}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400">Selesai</span>
                                <span className="text-emerald-400 font-black">{helpdeskStats.resolved}</span>
                            </div>
                        </div>
                    </div>

                    <div className="absolute bottom-0 left-6 right-6">
                        <div className="h-[3px] w-1/3 rounded-t-full bg-emerald-500"></div>
                    </div>
                </div>

                {/* 2. PENGADUAN WARGA CARD */}
                <div className="rounded-2xl border border-amber-500/20 bg-[#111A2E]/60 p-6 shadow-md relative overflow-hidden backdrop-blur-sm">
                    <div className="mb-4 flex items-center justify-between">
                        <span className="text-[10px] font-black tracking-widest text-amber-400 uppercase">PENGADUAN WARGA MASUK</span>
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-500/20 bg-amber-500/10 text-amber-400">
                            <AlertTriangle size={16} />
                        </div>
                    </div>

                    <div className="grid grid-cols-5 gap-4 items-center">
                        <div className="col-span-2 flex flex-col justify-center border-r border-[#1C2541]/40 pr-4">
                            <div className="flex items-center gap-1.5">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                                </span>
                                <span className="text-[9px] font-bold text-amber-400 tracking-wider">DIAJUKAN</span>
                            </div>
                            <h3 className="text-4xl font-black tracking-tight text-white mt-1.5">{pengaduanStats.pending}</h3>
                            <p className="text-[10px] text-slate-400 font-semibold mt-1">Laporan Baru</p>
                        </div>
                        <div className="col-span-3 pl-2 space-y-2 text-xs font-semibold text-slate-300">
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400">Total Pengaduan</span>
                                <span className="text-white font-black">{pengaduanStats.total}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400">Sedang Diproses</span>
                                <span className="text-amber-400 font-black">{pengaduanStats.processing}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400">Selesai</span>
                                <span className="text-emerald-400 font-black">{pengaduanStats.resolved}</span>
                            </div>
                        </div>
                    </div>

                    <div className="absolute bottom-0 left-6 right-6">
                        <div className="h-[3px] w-1/3 rounded-t-full bg-amber-500"></div>
                    </div>
                </div>

                {/* 3. PENGAJUAN SURAT CARD */}
                <div className="rounded-2xl border border-purple-500/20 bg-[#111A2E]/60 p-6 shadow-md relative overflow-hidden backdrop-blur-sm">
                    <div className="mb-4 flex items-center justify-between">
                        <span className="text-[10px] font-black tracking-widest text-purple-400 uppercase">PENGAJUAN SURAT MASUK</span>
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-purple-500/20 bg-purple-500/10 text-purple-400">
                            <Calendar size={16} />
                        </div>
                    </div>

                    <div className="grid grid-cols-5 gap-4 items-center">
                        <div className="col-span-2 flex flex-col justify-center border-r border-[#1C2541]/40 pr-4">
                            <div className="flex items-center gap-1.5">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                                </span>
                                <span className="text-[9px] font-bold text-purple-400 tracking-wider">DIAJUKAN</span>
                            </div>
                            <h3 className="text-4xl font-black tracking-tight text-white mt-1.5">{suratStats.pending}</h3>
                            <p className="text-[10px] text-slate-400 font-semibold mt-1">Surat Baru</p>
                        </div>
                        <div className="col-span-3 pl-2 space-y-2 text-xs font-semibold text-slate-300">
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400">Total Pengajuan</span>
                                <span className="text-white font-black">{suratStats.total}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400">Disetujui RT</span>
                                <span className="text-emerald-400 font-black">{suratStats.approved}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400">Selesai/Diambil</span>
                                <span className="text-purple-400 font-black">{suratStats.resolved}</span>
                            </div>
                        </div>
                    </div>

                    <div className="absolute bottom-0 left-6 right-6">
                        <div className="h-[3px] w-1/3 rounded-t-full bg-purple-500"></div>
                    </div>
                </div>
            </div>

            {/* Graph Card Section: Analytics Performance */}
            <div className="mb-8 rounded-2xl border border-[#1C2541]/50 bg-[#111A2E]/40 p-6 shadow-lg relative overflow-hidden">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h3 className="text-base font-black text-white">Analytics Performance</h3>
                        <p className="mt-1 text-xs font-semibold text-slate-400">Citizen reports vs. Resolution speed monthly tracking.</p>
                    </div>
                    {/* Graph Legends */}
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
                            <span className="text-xs font-bold text-slate-300">Reports</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-full bg-purple-500 border border-purple-300 border-dashed"></span>
                            <span className="text-xs font-bold text-slate-300">Resolutions</span>
                        </div>
                    </div>
                </div>

                {/* SVG Line Graph */}
                <div className="relative w-full overflow-hidden pt-2">
                    <svg viewBox="0 0 1000 240" className="w-full h-[220px] overflow-visible">
                        <defs>
                            {/* Grid Lines Pattern */}
                            <pattern id="grid" width="1000" height="40" patternUnits="userSpaceOnUse">
                                <line x1="0" y1="0" x2="1000" y2="0" stroke="#1C2541" strokeWidth="0.5" strokeDasharray="4 4" />
                            </pattern>
                            {/* Glow Filters */}
                            <filter id="glow-emerald" x="-20%" y="-20%" width="140%" height="140%">
                                <feGaussianBlur stdDeviation="4" result="blur" />
                                <feComposite in="SourceGraphic" in2="blur" operator="over" />
                            </filter>
                            {/* Gradient Backgrounds */}
                            <linearGradient id="grad-emerald" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#10B981" stopOpacity="0.15" />
                                <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
                            </linearGradient>
                        </defs>

                        {/* Background Grid Pattern */}
                        <rect width="1000" height="200" fill="url(#grid)" />

                        {/* Baseline X-Axis Line */}
                        <line x1="0" y1="200" x2="1000" y2="200" stroke="#1C2541" strokeWidth="1" />

                        {/* Area Gradient under curve Reports */}
                        <path
                            d="M 50 200 L 50 130 C 120 100, 180 140, 250 110 C 320 80, 380 160, 450 150 C 520 140, 580 50, 650 60 C 720 70, 780 180, 850 160 C 920 140, 950 40, 950 40 L 950 200 Z"
                            fill="url(#grad-emerald)"
                        />

                        {/* Curve Line 1: Reports (Solid Green) */}
                        <path
                            d="M 50 130 C 120 100, 180 140, 250 110 C 320 80, 380 160, 450 150 C 520 140, 580 50, 650 60 C 720 70, 780 180, 850 160 C 920 140, 950 40, 950 40"
                            fill="none"
                            stroke="#10B981"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            filter="url(#glow-emerald)"
                        />

                        {/* Curve Line 2: Resolutions (Dashed Purple/White) */}
                        <path
                            d="M 50 150 C 120 160, 180 90, 250 130 C 320 170, 380 120, 450 100 C 520 80, 580 150, 650 130 C 720 110, 780 130, 850 100 C 920 70, 950 120, 950 120"
                            fill="none"
                            stroke="#c084fc"
                            strokeWidth="2.5"
                            strokeDasharray="6 6"
                            strokeLinecap="round"
                        />

                        {/* Dots on peak points */}
                        <circle cx="650" cy="60" r="4.5" fill="#10B981" stroke="#0B132B" strokeWidth="1.5" />
                        <circle cx="450" cy="100" r="4" fill="#c084fc" stroke="#0B132B" strokeWidth="1.5" />

                        {/* X-Axis Month Labels */}
                        {['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'].map((m, i) => (
                            <text
                                key={m}
                                x={50 + i * 81.8}
                                y="222"
                                fill="#64748B"
                                fontSize="10"
                                fontWeight="bold"
                                textAnchor="middle"
                            >
                                {m}
                            </text>
                        ))}
                    </svg>
                </div>
            </div>

            {/* Bottom Panels: Real-time Online Citizens & Unified Incoming Request Notifications */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Real-time Online Citizens List Box */}
                <div className="rounded-2xl border border-[#1C2541]/50 bg-[#111A2E]/50 p-6 shadow-md flex flex-col h-[480px]">
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-base font-black text-white">Warga Sedang Online</h3>
                        <span className={`rounded-full px-2.5 py-0.5 text-[9px] font-black shadow-sm shrink-0 ${onlineCitizens.length === 0
                                ? 'bg-slate-500/10 border border-slate-500/20 text-slate-400'
                                : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                            }`}>
                            {onlineCitizens.length} ONLINE
                        </span>
                    </div>

                    {/* Citizens List */}
                    {onlineCitizens.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-500 py-10 font-sans">
                            <Users size={36} className="text-slate-600 mb-2.5 opacity-40 animate-pulse" />
                            <p className="text-xs font-bold text-slate-400">Tidak ada warga online saat ini</p>
                            <p className="text-[10px] text-slate-500 mt-1 max-w-[200px] text-center leading-normal">
                                Akun warga yang sedang membuka portal akan terdeteksi secara otomatis.
                            </p>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
                            {onlineCitizens.map((c) => {
                                const citizenInitials = c.name
                                    .split(' ')
                                    .map((w: string) => w[0])
                                    .join('')
                                    .slice(0, 2)
                                    .toUpperCase();

                                return (
                                    <div
                                        key={c.id}
                                        className="w-full flex items-center gap-3 rounded-2xl p-3.5 border border-[#1C2541]/40 bg-[#111A2E]/30"
                                    >
                                        <div className="relative shrink-0">
                                            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-400">
                                                <span>{citizenInitials}</span>
                                            </div>
                                            <span className="absolute bottom-0.5 right-0.5 h-2 w-2 rounded-full border border-[#111A2E] bg-emerald-500 animate-pulse"></span>
                                        </div>
                                        <div className="min-w-0 flex-1 leading-tight">
                                            <div className="flex items-center justify-between">
                                                <p className="truncate text-xs font-bold text-white">{c.name}</p>
                                                <span className="text-[9px] text-emerald-400 font-bold shrink-0">Aktif</span>
                                            </div>
                                            <p className="truncate text-[10px] text-slate-400 mt-1 font-semibold leading-normal">
                                                No. Rumah: <span className="text-slate-200">{c.no_rumah || '-'}</span>
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Database Incoming Notifications Box */}
                <div className="rounded-2xl border border-[#1C2541]/50 bg-[#111A2E]/50 p-6 shadow-md flex flex-col justify-between h-[480px] lg:col-span-2">
                    <div className="mb-4 flex items-center justify-between pb-3 border-b border-[#1C2541]/30">
                        <div>
                            <h3 className="text-base font-black text-white">Notifikasi & Aktivitas Masuk</h3>
                            <p className="text-[10px] text-slate-400 mt-0.5 font-semibold">Daftar permintaan yang memerlukan tindakan admin.</p>
                        </div>
                        <span className="rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 text-[9px] font-black text-amber-400 shadow-sm shrink-0">
                            {recentNotifications.length} PENDING
                        </span>
                    </div>

                    {/* Notifications List */}
                    {recentNotifications.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-500 py-10 font-sans">
                            <FileText size={36} className="text-slate-600 mb-2.5 opacity-40" />
                            <p className="text-xs font-bold text-slate-400">Tidak ada aktivitas masuk saat ini</p>
                            <p className="text-[10px] text-slate-500 mt-1">Semua tiket helpdesk, pengaduan, dan surat telah diselesaikan.</p>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 pb-1">
                            {recentNotifications.map((item) => {
                                const isTicket = item.type === 'ticket';
                                const isComplaint = item.type === 'complaint';
                                const isLetter = item.type === 'letter';

                                return (
                                    <div
                                        key={item.key}
                                        className="flex items-start justify-between gap-4 rounded-2xl border border-[#1C2541]/40 bg-[#111A2E]/30 p-3.5 transition hover:bg-[#111A2E]/50"
                                    >
                                        <div className="flex items-start gap-3 min-w-0">
                                            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${isTicket
                                                    ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                                                    : isComplaint
                                                        ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                                                        : 'text-purple-400 bg-purple-500/10 border-purple-500/20'
                                                }`}>
                                                {isTicket && <MessageSquare size={16} />}
                                                {isComplaint && <AlertTriangle size={16} />}
                                                {isLetter && <FileText size={16} />}
                                            </div>

                                            <div className="min-w-0 leading-tight">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className={`rounded px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider ${isTicket
                                                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                            : isComplaint
                                                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                                                : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                                                        }`}>
                                                        {isTicket ? 'Helpdesk Ticket' : isComplaint ? 'Pengaduan Warga' : 'Pengajuan Surat'}
                                                    </span>
                                                    <span className="text-[9px] font-semibold text-slate-500 select-all">{item.ref_no}</span>
                                                </div>
                                                <h4 className="text-xs font-bold text-white mt-1.5 truncate max-w-[220px] sm:max-w-[340px] md:max-w-[420px]">
                                                    {item.title}
                                                </h4>
                                                <p className="text-[10px] text-slate-400 font-semibold mt-1">
                                                    Oleh: <span className="text-slate-200">{item.sender}</span> • <span className="text-slate-500">{item.date}</span>
                                                </p>
                                            </div>
                                        </div>

                                        <a
                                            href={item.link}
                                            className="inline-flex shrink-0 items-center gap-1 text-[10px] font-black tracking-wider text-emerald-400 hover:text-emerald-300 transition mt-1.5"
                                        >
                                            <span>PROSES</span>
                                            <ArrowRight size={11} />
                                        </a>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
