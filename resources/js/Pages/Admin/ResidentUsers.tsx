import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { Search, Plus, ShieldAlert, CheckCircle, ShieldX, Key } from 'lucide-react';

interface ResidentUser {
    id: number;
    name: string;
    email: string;
    phone?: string | null;
    isActive: boolean;
    profilePhotoUrl?: string | null;
    warga?: {
        id: number;
        nama: string;
        noRumah?: string | null;
    } | null;
    lastLoginAt?: string | null;
    loginCount: number;
}

interface ResidentUsersProps {
    residentUsers?: ResidentUser[];
}

export default function ResidentUsers({
    residentUsers = [],
}: ResidentUsersProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending' | 'suspended'>('all');

    // Calculate dynamic stats
    const totalActive = residentUsers.filter(u => u.isActive).length;
    const totalPending = residentUsers.filter(u => !u.isActive && u.loginCount === 0).length;
    const totalSuspended = residentUsers.filter(u => !u.isActive && u.loginCount > 0).length;

    const filteredUsers = useMemo(() => {
        const keyword = searchTerm.trim().toLowerCase();

        return residentUsers.filter((user) => {
            const matchesKeyword =
                keyword === '' ||
                (user.warga?.nama ?? user.name).toLowerCase().includes(keyword) ||
                user.email.toLowerCase().includes(keyword) ||
                (user.phone ?? '').toLowerCase().includes(keyword) ||
                (user.warga?.noRumah ?? '').toLowerCase().includes(keyword);

            let matchesStatus = true;
            if (statusFilter === 'active') {
                matchesStatus = user.isActive;
            } else if (statusFilter === 'pending') {
                matchesStatus = !user.isActive && user.loginCount === 0;
            } else if (statusFilter === 'suspended') {
                matchesStatus = !user.isActive && user.loginCount > 0;
            }

            return matchesKeyword && matchesStatus;
        });
    }, [residentUsers, searchTerm, statusFilter]);

    const initials = (name: string) => {
        return name
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0])
            .join('')
            .toUpperCase() || 'WG';
    };

    const toggleResidentUserStatus = (user: ResidentUser) => {
        router.patch(
            `/admin/resident-users/${user.id}/toggle-active`,
            {},
            {
                preserveScroll: true,
            },
        );
    };

    const resetResidentUserPassword = (user: ResidentUser) => {
        const confirmed = window.confirm(
            `Reset password ${user.warga?.nama ?? user.name} ke password123?`,
        );

        if (!confirmed) {
            return;
        }

        router.post(
            `/admin/resident-users/${user.id}/reset-password`,
            {},
            {
                preserveScroll: true,
            },
        );
    };

    return (
        <AdminLayout activeMenu="resident-users">
            <Head title="User Warga - SMART-RT" />

            {/* Title Header */}
            <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <h2 className="text-3xl font-black text-slate-900">User Warga</h2>
                    <p className="mt-1 text-sm text-slate-600 font-medium">Kelola akun warga, status akses, dan riwayat login.</p>
                </div>
            </div>

            {/* 3 Metric Card Rows */}
            <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
                {/* Active Card */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm relative overflow-hidden">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">AKTIF</span>
                        <div className="h-7 w-7 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shadow-sm">
                            <CheckCircle size={15} />
                        </div>
                    </div>
                    <div className="mt-4">
                        <h3 className="text-3xl font-black text-slate-900">{totalActive}</h3>
                        <p className="text-[10px] text-slate-500 font-semibold mt-1">Akun Warga Aktif di Sistem</p>
                    </div>
                </div>

                {/* Pending Card */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm relative overflow-hidden">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">TERTUNDA</span>
                        <div className="h-7 w-7 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shadow-sm">
                            <ShieldAlert size={15} />
                        </div>
                    </div>
                    <div className="mt-4">
                        <h3 className="text-3xl font-black text-slate-900">{totalPending}</h3>
                        <p className="text-[10px] text-slate-500 font-semibold mt-1">Akun Menunggu Verifikasi / Login Pertama</p>
                    </div>
                </div>

                {/* Suspended Card */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm relative overflow-hidden">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">DITANGGUHKAN</span>
                        <div className="h-7 w-7 rounded-full bg-red-50 border border-red-200 flex items-center justify-center text-red-700 shadow-sm">
                            <ShieldX size={15} />
                        </div>
                    </div>
                    <div className="mt-4">
                        <h3 className="text-3xl font-black text-slate-900">{totalSuspended}</h3>
                        <p className="text-[10px] text-slate-500 font-semibold mt-1">Akun yang Dinonaktifkan Sementara</p>
                    </div>
                </div>
            </div>

            {/* Users Table Card */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm mb-8">
                {/* Table Filters */}
                <div className="border-b border-slate-200 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Daftar Akun Pengguna</h3>
                            <p className="mt-1 text-xs text-slate-600 font-medium">Data akun login warga yang sinkron dengan hunian.</p>
                        </div>

                        <div className="flex gap-2 sm:flex-row">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(event) => setSearchTerm(event.target.value)}
                                    placeholder="Cari nama, email, rumah..."
                                    className="w-full rounded-full bg-slate-50 border border-slate-200 py-2 pl-9 pr-4 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-emerald-500 sm:w-64 transition duration-200"
                                />
                            </div>

                            <select
                                value={statusFilter}
                                onChange={(event) => setStatusFilter(event.target.value as any)}
                                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 focus:bg-white focus:outline-none focus:border-emerald-500"
                            >
                                <option value="all">Semua Status</option>
                                <option value="active">Aktif</option>
                                <option value="pending">Tertunda</option>
                                <option value="suspended">Ditangguhkan</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Table Data */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs min-w-[800px]">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                                <th className="px-5 py-3.5">WARGA</th>
                                <th className="px-5 py-3.5">EMAIL LOGIN</th>
                                <th className="px-5 py-3.5">NO. TELEPON</th>
                                <th className="px-5 py-3.5">STATUS AKUN</th>
                                <th className="px-5 py-3.5">LOGIN TERAKHIR</th>
                                <th className="px-5 py-3.5">JUMLAH LOGIN</th>
                                <th className="px-5 py-3.5 text-right">AKSI</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                            {filteredUsers.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-5 py-12 text-center text-slate-500">
                                        Data akun warga tidak ditemukan.
                                    </td>
                                </tr>
                            )}

                            {filteredUsers.map((user) => {
                                const userInit = initials(user.warga?.nama ?? user.name);
                                
                                // Determine label & colors based on state
                                let badgeClass = 'bg-emerald-50 text-emerald-700 border border-emerald-200';
                                let statusText = 'AKTIF';
                                let actionText = 'Nonaktifkan';
                                let actionClass = 'border border-red-200 text-red-700 bg-white hover:bg-red-50';

                                if (!user.isActive) {
                                    if (user.loginCount === 0) {
                                        badgeClass = 'bg-amber-50 text-amber-700 border border-amber-200';
                                        statusText = 'PENDING';
                                        actionText = 'Verifikasi';
                                        actionClass = 'border border-emerald-200 text-emerald-700 bg-white hover:bg-emerald-50';
                                    } else {
                                        badgeClass = 'bg-red-50 text-red-700 border border-red-200';
                                        statusText = 'SUSPENDED';
                                        actionText = 'Aktifkan';
                                        actionClass = 'border border-emerald-200 text-emerald-700 bg-white hover:bg-emerald-50';
                                    }
                                }

                                return (
                                    <tr
                                        key={user.id}
                                        className="transition hover:bg-slate-50/80 text-slate-700"
                                    >
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-700">
                                                    {user.profilePhotoUrl ? (
                                                        <img
                                                            src={user.profilePhotoUrl}
                                                            alt={user.warga?.nama ?? user.name}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : (
                                                        userInit
                                                    )}
                                                </div>

                                                <div>
                                                    <p className="font-bold text-slate-900">
                                                        {user.warga?.nama ?? user.name}
                                                    </p>
                                                    <p className="text-[10px] text-slate-500 mt-0.5">
                                                        No. Rumah {user.warga?.noRumah ?? '-'}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-5 py-4 font-semibold text-slate-700">{user.email}</td>
                                        <td className="px-5 py-4 text-slate-600">{user.phone || '-'}</td>

                                        <td className="px-5 py-4">
                                            <span className={`rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase ${badgeClass}`}>
                                                {statusText}
                                            </span>
                                        </td>

                                        <td className="px-5 py-4 text-slate-600">
                                            {user.lastLoginAt || 'Belum pernah login'}
                                        </td>

                                        <td className="px-5 py-4 text-slate-700 font-semibold">
                                            {user.loginCount} kali
                                        </td>

                                        <td className="px-5 py-4">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => toggleResidentUserStatus(user)}
                                                    className={`rounded-xl px-3 py-1.5 text-[10px] font-bold transition duration-200 ${actionClass}`}
                                                >
                                                    {actionText}
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => resetResidentUserPassword(user)}
                                                    className="rounded-xl border border-amber-200 px-3 py-1.5 text-[10px] font-bold text-amber-700 bg-white hover:bg-amber-50 transition duration-200 flex items-center gap-1"
                                                >
                                                    <Key size={10} />
                                                    <span>Reset</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Floating Action Button */}
            <button
                type="button"
                onClick={() => router.visit('/admin/residents')}
                className="fixed bottom-8 right-8 h-14 w-14 rounded-full bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg flex items-center justify-center transition duration-200 hover:scale-105 z-30"
            >
                <Plus size={24} />
            </button>
        </AdminLayout>
    );
}
