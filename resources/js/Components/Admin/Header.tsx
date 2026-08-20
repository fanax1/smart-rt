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
        <header className="fixed left-0 lg:left-64 right-0 top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur-xl px-4 sm:px-6 lg:px-8 py-4 font-sans">
            <div className="flex items-center justify-between">
                <div className="flex items-center flex-1 min-w-0">
                    {/* Mobile Menu Toggle */}
                    {onMenuClick && (
                        <button
                            type="button"
                            onClick={onMenuClick}
                            className="mr-2 rounded-xl p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 lg:hidden"
                            aria-label="Buka menu"
                        >
                            <Menu size={20} />
                        </button>
                    )}

                    {/* Search Bar */}
                    <div className="relative flex-1 max-w-[150px] sm:max-w-xs md:max-w-md">
                        <Search
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                            size={16}
                        />
                        <input
                            type="text"
                            placeholder="Search..."
                            className="w-full rounded-full bg-slate-100 border border-slate-200 py-2.5 pl-11 pr-4 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition duration-200"
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
                            className="flex items-center gap-3 rounded-xl p-1.5 transition hover:bg-slate-100 group"
                        >
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-emerald-200 bg-emerald-50 text-xs font-bold text-emerald-700">
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
                                <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition duration-200">
                                    {user?.name || 'Admin User'}
                                </p>
                                <p className="text-[9px] font-semibold uppercase tracking-wider text-emerald-700 mt-0.5">
                                    {user?.role === 'admin' ? 'Super Administrator' : (user?.role || 'Admin')}
                                </p>
                            </div>
                            <ChevronDown size={14} className="text-slate-400 group-hover:text-slate-700 transition duration-200" />
                        </button>

                        {showUserMenu && (
                            <div className="absolute right-0 mt-3 w-52 overflow-hidden rounded-2xl border border-slate-200 bg-white py-1 shadow-xl z-50">
                                <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
                                    <p className="truncate text-xs font-bold text-slate-900">{user?.name || 'Admin'}</p>
                                    <p className="mt-0.5 truncate text-[10px] text-slate-500">{user?.email}</p>
                                </div>
                                <div className="p-1 space-y-0.5">
                                    <Link
                                        href="/profile"
                                        className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-left text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition duration-200"
                                    >
                                        <User size={15} className="text-slate-400" />
                                        Profil Saya
                                    </Link>
                                    <Link
                                        href="/admin/settings"
                                        className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-left text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition duration-200"
                                    >
                                        <Settings size={15} className="text-slate-400" />
                                        Pengaturan
                                    </Link>
                                    <hr className="border-slate-100 my-1 mx-2" />
                                    <button
                                        type="button"
                                        onClick={logout}
                                        className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-left text-xs font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 transition duration-200"
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
                        className="pointer-events-auto flex w-80 items-start gap-3 rounded-2xl border border-emerald-200 bg-white p-4 text-slate-800 shadow-xl transition-all duration-300"
                    >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <Bell size={18} className="animate-bounce" />
                        </div>
                        <div className="flex-1 min-w-0 font-sans">
                            <p className="text-xs font-black text-slate-900">{toast.message}</p>
                            {toast.submessage && (
                                <p className="mt-1 truncate text-[11px] font-medium text-slate-500">
                                    {toast.submessage}
                                </p>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                            className="text-slate-400 hover:text-slate-700 transition"
                        >
                            <X size={14} />
                        </button>
                    </div>
                ))}
            </div>
        </header>
    );
}
