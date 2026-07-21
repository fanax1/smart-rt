import { Link, router, usePage } from '@inertiajs/react';
import {
    Calendar,
    ChevronDown,
    Database,
    FileText,
    History,
    Home,
    Megaphone,
    MessageSquare,
    Settings,
    Shield,
    UserCog,
    Users,
    Wallet,
    LayoutGrid,
    HelpCircle,
    LogOut,
    X,
} from 'lucide-react';
import { useState } from 'react';

interface SidebarProps {
    activeMenu: string;
    isOpen?: boolean;
    onClose?: () => void;
}

const dataWargaMenus = [
    {
        id: 'residents',
        label: 'Data Hunian & KK',
        icon: Database,
        href: '/admin/residents',
    },
    {
        id: 'resident-users',
        label: 'User Warga',
        icon: UserCog,
        href: '/admin/resident-users',
    },
    {
        id: 'profile-change-logs',
        label: 'Riwayat Perubahan Profil',
        icon: History,
        href: '/admin/profile-change-logs',
    },
];

const menuItems = [
    { id: 'dashboard', label: 'Ringkasan', icon: Home, href: '/dashboard' },
    { id: 'announcements', label: 'Pengumuman', icon: Megaphone, href: '/admin/announcements' },
    { id: 'finance', label: 'Keuangan', icon: Wallet, href: '/admin/finance' },
    { id: 'events', label: 'Kegiatan', icon: Calendar, href: '/admin/events' },
    { id: 'security', label: 'Pengajuan Surat', icon: Shield, href: '/admin/security' },
    { id: 'complaints', label: 'Pengaduan', icon: MessageSquare, href: '/admin/complaints' },
    { id: 'documents', label: 'Dokumen', icon: FileText, href: '/admin/documents' },
    { id: 'tickets', label: 'Tiket Helpdesk', icon: HelpCircle, href: '/admin/tickets' },
    { id: 'settings', label: 'Pengaturan', icon: Settings, href: '/admin/settings' },
];

export function Sidebar({ activeMenu, isOpen, onClose }: SidebarProps) {
    const isDataWargaActive = dataWargaMenus.some((item) => item.id === activeMenu);
    const [openDataWarga, setOpenDataWarga] = useState(isDataWargaActive);

    const handleLogout = () => {
        router.post('/logout');
    };

    return (
        <aside className={['fixed left-0 top-0 z-50 lg:z-20 flex h-screen w-64 flex-col bg-[#0B132B] border-r border-[#1C2541]/40 text-slate-300 font-sans transition-transform duration-300', isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'].join(' ')}>
            {/* Header Brand */}
            <div className="flex items-center justify-between border-b border-[#1C2541]/40 p-6">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                        <LayoutGrid size={22} />
                    </div>
                    <div>
                        <h1 className="text-base font-black tracking-wider text-white leading-none">SMART-RT</h1>
                        <p className="mt-1.5 text-[9px] font-bold tracking-[0.2em] text-emerald-400">SISTEM MANAJEMEN</p>
                    </div>
                </div>
                {onClose && (
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl p-2 text-slate-400 hover:text-white hover:bg-[#111A2E] lg:hidden"
                        aria-label="Tutup sidebar"
                    >
                        <X size={18} />
                    </button>
                )}
            </div>

            {/* Nav Menu Items */}
            <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
                {/* Ringkasan / Dashboard */}
                <Link
                    href="/dashboard"
                    className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 border-l-4 ${
                        activeMenu === 'dashboard'
                            ? 'bg-[#10B981]/10 text-emerald-400 border-emerald-500 shadow-[inset_1px_0_0_rgba(16,185,129,0.2)]'
                            : 'text-slate-400 hover:bg-[#111A2E] hover:text-white border-transparent'
                    }`}
                >
                    <Home size={18} className={activeMenu === 'dashboard' ? 'text-emerald-400' : 'text-slate-400'} />
                    <span>Ringkasan</span>
                </Link>

                {/* Data Warga Dropdown */}
                <div className="space-y-1">
                    <button
                        type="button"
                        onClick={() => setOpenDataWarga((current) => !current)}
                        className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 border-l-4 ${
                            isDataWargaActive
                                ? 'bg-[#10B981]/10 text-emerald-400 border-emerald-500'
                                : 'text-slate-400 hover:bg-[#111A2E] hover:text-white border-transparent'
                        }`}
                    >
                        <Users size={18} className={isDataWargaActive ? 'text-emerald-400' : 'text-slate-400'} />
                        <span className="flex-1 text-left">Data Warga</span>
                        <ChevronDown
                            size={16}
                            className={`transition-transform duration-200 ${openDataWarga ? 'rotate-180 text-emerald-400' : 'text-slate-400'}`}
                        />
                    </button>

                    {openDataWarga && (
                        <div className="mt-1 pl-4 space-y-1">
                            {dataWargaMenus.map((item) => {
                                const Icon = item.icon;
                                const isActive = activeMenu === item.id;

                                return (
                                    <Link
                                        key={item.id}
                                        href={item.href}
                                        className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all duration-200 border-l-4 ${
                                            isActive
                                                ? 'bg-[#10B981]/5 text-emerald-400 border-emerald-500'
                                                : 'text-slate-500 hover:bg-[#111A2E] hover:text-white border-transparent'
                                        }`}
                                    >
                                        <Icon size={15} />
                                        <span>{item.label}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Other functional menus */}
                {menuItems
                    .filter((item) => item.id !== 'dashboard')
                    .map((item) => {
                        const Icon = item.icon;
                        const isActive = activeMenu === item.id;
                        const { auth } = usePage().props as any;
                        const unreadTicketsCount = auth?.unread_tickets_count || 0;

                        return (
                            <Link
                                key={item.id}
                                href={item.href}
                                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 border-l-4 ${
                                    isActive
                                        ? 'bg-[#10B981]/10 text-emerald-400 border-emerald-500 shadow-[inset_1px_0_0_rgba(16,185,129,0.2)]'
                                        : 'text-slate-400 hover:bg-[#111A2E] hover:text-white border-transparent'
                                }`}
                            >
                                <Icon size={18} className={isActive ? 'text-emerald-400' : 'text-slate-400'} />
                                <span className="flex-1">{item.label}</span>
                                {item.id === 'tickets' && unreadTicketsCount > 0 && (
                                    <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-black text-[#0B132B]">
                                        {unreadTicketsCount}
                                    </span>
                                )}
                            </Link>
                        );
                    })}
            </nav>

            {/* Sidebar Bottom / Card & Footer */}
            <div className="p-4 border-t border-[#1C2541]/40 space-y-4">
                {/* Portal Dukungan Card */}
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/10 p-4 space-y-3">
                    <p className="text-xs font-black text-white">Portal Dukungan</p>
                    <p className="text-[10px] leading-relaxed text-slate-400">Butuh bantuan teknis manajemen sistem?</p>
                    <a
                        href="https://google.com"
                        target="_blank"
                        rel="noreferrer"
                        className="block w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 py-2.5 text-center text-xs font-bold text-[#0B132B] transition duration-200 shadow-md shadow-emerald-500/10"
                    >
                        Dapatkan Bantuan
                    </a>
                </div>

                {/* Help and Logout Links */}
                <div className="space-y-1">
                    <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold text-red-400 hover:bg-red-950/20 hover:text-red-300 transition-all duration-200"
                    >
                        <LogOut size={18} />
                        <span>Keluar</span>
                    </button>
                </div>
            </div>
        </aside>
    );
}
