import { Link, router, usePage } from '@inertiajs/react';
import { ReactNode, useState, useEffect } from 'react';
import {
    Bell,
    Calendar,
    ChevronRight,
    ExternalLink,
    FileText,
    Home,
    LogOut,
    Menu,
    MessageSquare,
    TreePine,
    User,
    Users,
    Wallet,
    X,
    Search,
    HelpCircle,
} from 'lucide-react';
import { WargaProfile } from '@/types/warga';
export type { WargaProfile };

interface WargaLayoutProps {
    children: ReactNode;
    profile: WargaProfile;
    title?: string;
    searchQuery?: string;
    onSearchChange?: (val: string) => void;
}

const MENU_ITEMS = [
    { path: '/warga/dashboard', label: 'Beranda', icon: Home, exact: true },
    { path: '/warga/data-keluarga', label: 'Data Keluarga', icon: Users },
    { path: '/warga/iuran', label: 'Iuran', icon: Wallet },
    { path: '/warga/pengumuman', label: 'Pengumuman', icon: Bell },
    { path: '/warga/kegiatan', label: 'Kegiatan RT', icon: Calendar },
    { path: '/warga/pengaduan', label: 'Pengaduan', icon: MessageSquare },
    { path: '/warga/ajukan-surat', label: 'Ajukan Surat', icon: FileText },
    { path: '/warga/profil', label: 'Profil Akun', icon: User },
];

const BOTTOM_NAV = [
    { path: '/warga/dashboard', label: 'Beranda', icon: Home, exact: true },
    { path: '/warga/data-keluarga', label: 'Keluarga', icon: Users },
    { path: '/warga/iuran', label: 'Iuran', icon: Wallet },
    { path: '/warga/pengaduan', label: 'Aduan', icon: MessageSquare },
    { path: '/warga/profil', label: 'Profil', icon: User },
];

function isActive(path: string, current: string, exact = false) {
    if (exact) return current === path || current === '/warga';
    return current === path || current.startsWith(path + '/');
}

export default function WargaLayout({ children, profile, title, searchQuery, onSearchChange }: WargaLayoutProps) {
    const { url } = usePage();
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

    useEffect(() => {
        const echo = (window as any).Echo;
        if (!echo) return;

        // Join online citizens presence channel
        echo.join('online-citizens');

        return () => {
            echo.leave('online-citizens');
        };
    }, []);

    const handleLogout = () => {
        router.post('/logout');
    };

    const userSubText = profile.houseNumber
        ? `No. ${profile.houseNumber}${profile.rt ? ` · RT ${profile.rt}` : ''}`
        : 'Akun warga';

    return (
    return (
        <div className="flex min-h-screen bg-slate-50 text-slate-900 antialiased font-sans">
            {/* Sidebar (Desktop) */}
            <aside className="fixed left-0 top-0 z-40 hidden h-full w-64 flex-col border-r border-slate-200 bg-white shadow-sm lg:flex">
                <div className="border-b border-slate-200 p-5">
                    <div className="mb-5 flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm">
                            <TreePine size={20} />
                        </div>
                        <div>
                            <p className="text-base font-black tracking-wider text-emerald-700 leading-none">SMART-RT</p>
                            <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mt-1">Citizen Portal</p>
                        </div>
                    </div>

                    <Link href="/warga/profil" className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3 border border-slate-200 transition-all hover:bg-slate-100">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-emerald-50 border border-emerald-200">
                            {profile.profilePhotoUrl ? (
                                <img
                                    src={profile.profilePhotoUrl}
                                    alt={profile.name}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <span className="text-xs font-bold text-emerald-700">{profile.initials}</span>
                            )}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-bold text-slate-900">{profile.name}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">{userSubText}</p>
                        </div>
                        <ChevronRight size={14} className="shrink-0 text-slate-400" />
                    </Link>
                </div>

                <nav className="flex-1 space-y-1 overflow-y-auto p-3">
                    {MENU_ITEMS.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.path, url, item.exact);

                        return (
                            <Link
                                key={item.path}
                                href={item.path}
                                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs transition-all ${
                                    active
                                        ? 'bg-emerald-50 font-bold text-emerald-700 border-l-4 border-emerald-600 pl-2 rounded-r-xl shadow-sm'
                                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                }`}
                            >
                                <Icon size={16} className={active ? 'text-emerald-700' : 'text-slate-500'} />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="space-y-1 border-t border-slate-200 p-3">
                    <Link
                        href="/"
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
                    >
                        <ExternalLink size={14} />
                        Kembali ke Beranda
                    </Link>
                    <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs text-slate-600 transition-colors hover:bg-red-50 hover:text-red-700"
                    >
                        <LogOut size={14} />
                        Keluar
                    </button>
                </div>
            </aside>

            {/* Sidebar (Mobile Drawer) */}
            {mobileSidebarOpen && (
                <div className="fixed inset-0 z-50 flex lg:hidden">
                    <button className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setMobileSidebarOpen(false)} aria-label="Tutup menu" />
                    <div className="relative flex h-full w-72 flex-col bg-white border-r border-slate-200 shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-200 p-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    <TreePine size={18} />
                                </div>
                                <div>
                                    <p className="text-sm font-black text-emerald-700 leading-none">SMART-RT</p>
                                    <p className="text-[9px] uppercase font-bold text-slate-500 tracking-wider mt-1">Layanan Warga</p>
                                </div>
                            </div>
                            <button onClick={() => setMobileSidebarOpen(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="p-3">
                            <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 border border-slate-200">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-emerald-50 border border-emerald-200">
                                    {profile.profilePhotoUrl ? (
                                        <img
                                            src={profile.profilePhotoUrl}
                                            alt={profile.name}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <span className="text-sm font-bold text-emerald-700">{profile.initials}</span>
                                    )}
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-900">{profile.name}</p>
                                    <p className="text-[10px] text-slate-500 mt-0.5">{userSubText}</p>
                                </div>
                            </div>
                        </div>

                        <nav className="flex-1 space-y-1 overflow-y-auto px-3">
                            {MENU_ITEMS.map((item) => {
                                const Icon = item.icon;
                                const active = isActive(item.path, url, item.exact);

                                return (
                                    <Link
                                        key={item.path}
                                        href={item.path}
                                        onClick={() => setMobileSidebarOpen(false)}
                                        className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs transition-all ${
                                            active
                                                ? 'bg-emerald-50 font-bold text-emerald-700 border-l-4 border-emerald-600 pl-2 rounded-r-xl'
                                                : 'text-slate-600 hover:bg-slate-100'
                                        }`}
                                    >
                                        <Icon size={16} className={active ? 'text-emerald-700' : 'text-slate-500'} />
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </nav>

                        <div className="border-t border-slate-200 p-3 space-y-1">
                            <Link
                                href="/"
                                onClick={() => setMobileSidebarOpen(false)}
                                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                            >
                                <ExternalLink size={14} />
                                Kembali ke Beranda
                            </Link>
                            <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs text-slate-600 hover:bg-red-50 hover:text-red-700">
                                <LogOut size={14} />
                                Keluar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            <main className="flex min-h-screen flex-1 flex-col pb-20 lg:ml-64 lg:pb-0">
                {/* Header (Desktop) */}
                <header className="hidden lg:flex h-16 items-center justify-between border-b border-slate-200 bg-white px-8 shadow-sm">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-700 tracking-wider">
                            {title === 'Beranda' ? 'Dashboard Utama' : title === 'Data Keluarga' ? 'Data Keluarga / Manajemen Anggota' : title || 'Dashboard Warga'}
                        </span>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={searchQuery ?? ''}
                                onChange={(e) => onSearchChange?.(e.target.value)}
                                placeholder={
                                    title === 'Data Keluarga' 
                                        ? 'Cari data...' 
                                        : title === 'Pengumuman' 
                                        ? 'Cari pengumuman...' 
                                        : title === 'Pengaduan'
                                        ? 'Cari pengaduan...'
                                        : title === 'Kegiatan'
                                        ? 'Cari kegiatan...'
                                        : 'Cari informasi...'
                                }
                                className="h-8 w-60 rounded-lg bg-slate-100 pl-9 pr-4 text-[11px] text-slate-900 border border-slate-200 placeholder-slate-400 focus:bg-white focus:ring-1 focus:ring-emerald-500"
                            />
                        </div>
                        <button className="text-slate-500 hover:text-slate-900 relative">
                            <Bell size={18} />
                            <span className="absolute top-0 right-0 h-1.5 w-1.5 rounded-full bg-emerald-600"></span>
                        </button>
                        <button className="text-slate-500 hover:text-slate-900">
                            <HelpCircle size={18} />
                        </button>
                    </div>
                </header>

                {/* Header (Mobile) */}
                <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm lg:hidden">
                    <button onClick={() => setMobileSidebarOpen(true)} className="-ml-1 rounded-lg p-2 text-slate-600 hover:bg-slate-100">
                        <Menu size={20} />
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <TreePine size={14} />
                        </div>
                        <span className="text-sm font-bold text-slate-900">{title || 'Portal Warga'}</span>
                    </div>
                    <Link href="/warga/pengumuman" className="-mr-1 rounded-lg p-2 text-slate-600 hover:bg-slate-100">
                        <Bell size={20} />
                    </Link>
                </header>

                {/* Verification Notice */}
                {!profile.hasLinkedWarga && (
                    <div className="mx-4 mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800 lg:mx-8">
                        Akun ini belum terhubung dengan data warga. Nanti admin perlu menghubungkan akun ini ke data warga melalui kolom <b>warga_id</b>.
                    </div>
                )}

                {/* Inner Page View */}
                <div className="flex-1 overflow-x-hidden">{children}</div>
            </main>

            {/* Bottom Nav (Mobile Only) */}
            <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white lg:hidden shadow-lg">
                <div className="flex h-16 items-stretch">
                    {BOTTOM_NAV.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.path, url, item.exact);

                        return (
                            <Link
                                key={item.path}
                                href={item.path}
                                className={`flex flex-1 flex-col items-center justify-center gap-0.5 transition-colors ${
                                    active ? 'text-emerald-700' : 'text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                <div className={`rounded-lg p-1 transition-colors ${active ? 'bg-emerald-50 border border-emerald-200' : ''}`}>
                                    <Icon size={18} />
                                </div>
                                <span className="text-[9px] font-bold tracking-wide">{item.label}</span>
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </div>
    );
}
