import { Link, router, usePage } from '@inertiajs/react';
import { LogOut, Settings, User, Search, ChevronDown, X, Bell, Menu } from 'lucide-react';
import { useState, useEffect } from 'react';

export function Header({ onMenuClick }: { onMenuClick?: () => void }) {
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [toasts, setToasts] = useState<Array<{ id: number; message: string; submessage?: string }>>([]);
    const { props } = usePage();

    useEffect(() => {
        const echo = (window as any).Echo;
        if (!echo) return;

        const channel = echo.channel('admin.tickets')
            .listen('.App\\Events\\TicketCreated', (data: any) => {
                const newToast = {
                    id: Date.now(),
                    message: `Tiket baru dari ${data.ticket.nama_lengkap}`,
                    submessage: `${data.ticket.kategori}: "${data.ticket.judul}"`,
                };
                setToasts((prev) => [...prev, newToast]);

                // Auto remove after 6 seconds
                setTimeout(() => {
                    setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
                }, 6000);

                // Reload Inertia shared props to update badge count
                router.reload({ only: ['auth'] });
            });

        return () => {
            channel.stopListening('.App\\Events\\TicketCreated');
        };
    }, []);

    const auth = (props as any).auth;
    const user = auth?.user;

    const initials = (user?.name || 'Admin RT')
        .split(' ')
        .map((word: string) => word[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    const logout = () => {
        router.post('/logout');
    };

    return (
        <header className="fixed left-0 lg:left-64 right-0 top-0 z-10 border-b border-[#1C2541]/40 bg-[#090E1A]/90 backdrop-blur-xl px-4 sm:px-6 lg:px-8 py-4 font-sans">
            <div className="flex items-center justify-between">
                <div className="flex items-center flex-1 min-w-0">
                    {/* Mobile Menu Toggle */}
                    {onMenuClick && (
                        <button
                            type="button"
                            onClick={onMenuClick}
                            className="mr-2 rounded-xl p-2 text-slate-400 hover:text-white hover:bg-[#111A2E] lg:hidden"
                            aria-label="Buka menu"
                        >
                            <Menu size={20} />
                        </button>
                    )}

                    {/* Search Bar */}
                    <div className="relative flex-1 max-w-[150px] sm:max-w-xs md:max-w-md">
                        <Search
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                            size={16}
                        />
                        <input
                            type="text"
                            placeholder="Search..."
                            className="w-full rounded-full bg-[#111A2E]/80 border border-[#1C2541]/70 py-2.5 pl-11 pr-4 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition duration-200"
                        />
                    </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-6">

                    {/* Profile Dropdown */}
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setShowUserMenu((value) => !value)}
                            className="flex items-center gap-3 rounded-xl p-1.5 transition hover:bg-[#111A2E]/50 group"
                        >
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-emerald-500/20 bg-emerald-500/10 text-xs font-bold text-emerald-400">
                                {user?.profile_photo_url ? (
                                    <img
                                        src={user.profile_photo_url}
                                        alt={user.name}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <span>{initials}</span>
                                )}
                            </div>
                            <div className="hidden text-left sm:block leading-tight">
                                <p className="text-xs font-bold text-white group-hover:text-emerald-400 transition duration-200">
                                    {user?.name || 'Admin User'}
                                </p>
                                <p className="text-[9px] font-semibold uppercase tracking-wider text-emerald-500 mt-0.5">
                                    {user?.role === 'admin' ? 'Super Administrator' : (user?.role || 'Admin')}
                                </p>
                            </div>
                            <ChevronDown size={14} className="text-slate-500 group-hover:text-white transition duration-200" />
                        </button>

                        {showUserMenu && (
                            <div className="absolute right-0 mt-3 w-52 overflow-hidden rounded-2xl border border-[#1C2541]/60 bg-[#111A2E] py-1 shadow-2xl z-50">
                                <div className="border-b border-[#1C2541]/40 bg-[#0B132B]/50 px-4 py-3">
                                    <p className="truncate text-xs font-bold text-white">{user?.name || 'Admin'}</p>
                                    <p className="mt-0.5 truncate text-[10px] text-slate-500">{user?.email}</p>
                                </div>
                                <div className="p-1 space-y-0.5">
                                    <Link
                                        href="/profile"
                                        className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-left text-xs font-semibold text-slate-300 hover:bg-[#0B132B] hover:text-white transition duration-200"
                                    >
                                        <User size={15} className="text-slate-400" />
                                        Profil Saya
                                    </Link>
                                    <Link
                                        href="/admin/settings"
                                        className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-left text-xs font-semibold text-slate-300 hover:bg-[#0B132B] hover:text-white transition duration-200"
                                    >
                                        <Settings size={15} className="text-slate-400" />
                                        Pengaturan
                                    </Link>
                                    <hr className="border-[#1C2541]/40 my-1 mx-2" />
                                    <button
                                        type="button"
                                        onClick={logout}
                                        className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-left text-xs font-semibold text-red-400 hover:bg-red-950/20 hover:text-red-300 transition duration-200"
                                    >
                                        <LogOut size={15} />
                                        Keluar
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Toast Notifications Container */}
            <div className="fixed top-5 right-5 z-[100] flex flex-col gap-3 max-w-sm pointer-events-none">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className="pointer-events-auto flex w-80 items-start gap-3 rounded-2xl border border-emerald-500/30 bg-[#0B132B] p-4 text-slate-200 shadow-2xl shadow-emerald-500/5 transition-all duration-300"
                    >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <Bell size={18} className="animate-bounce" />
                        </div>
                        <div className="flex-1 min-w-0 font-sans">
                            <p className="text-xs font-black text-white">{toast.message}</p>
                            {toast.submessage && (
                                <p className="mt-1 truncate text-[11px] font-medium text-slate-400">
                                    {toast.submessage}
                                </p>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                            className="text-slate-500 hover:text-white transition"
                        >
                            <X size={14} />
                        </button>
                    </div>
                ))}
            </div>
        </header>
    );
}
