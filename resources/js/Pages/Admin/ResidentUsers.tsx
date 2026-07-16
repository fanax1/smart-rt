import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { Search, Plus, Download, Mail, ShieldAlert, CheckCircle, ShieldX, Key } from 'lucide-react';

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
                    <h2 className="text-3xl font-black text-white">User Warga</h2>
                    <p className="mt-1 text-sm text-slate-400 font-medium">Kelola akun warga, status akses, dan riwayat login.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button type="button" className="inline-flex items-center gap-2 rounded-xl border border-[#1C2541] bg-[#111A2E] px-4 py-2.5 text-xs font-bold text-slate-300 hover:bg-[#1C2541]/70 transition duration-200">
                        <Download size={14} className="text-slate-400" />
                        <span>Ekspor Data</span>
                    </button>
                    <button type="button" className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-black text-[#0B132B] hover:bg-emerald-400 transition duration-200 shadow-lg shadow-emerald-500/10">
                        <Mail size={14} />
                        <span>Undang Warga</span>
                    </button>
                </div>
            </div>

            {/* 3 Metric Card Rows */}
            <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
                {/* Active Card */}
                <div className="rounded-2xl border border-[#1C2541]/50 bg-[#111A2E]/60 p-6 relative overflow-hidden">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black tracking-widest text-slate-400">AKTIF</span>
                        <div className="h-6 w-6 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                            <CheckCircle size={14} />
                        </div>
                    </div>
                    <div className="mt-4">
                        <h3 className="text-3xl font-black text-white">{totalActive}</h3>
                        <p className="text-[10px] text-slate-500 font-semibold mt-1">Akun Warga Aktif di Sistem</p>
                    </div>
                </div>

                {/* Pending Card */}
                <div className="rounded-2xl border border-[#1C2541]/50 bg-[#111A2E]/60 p-6 relative overflow-hidden">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black tracking-widest text-slate-400">TERTUNDA</span>
                        <div className="h-6 w-6 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                            <ShieldAlert size={14} />
                        </div>
                    </div>
                    <div className="mt-4">
                        <h3 className="text-3xl font-black text-white">{totalPending}</h3>
                        <p className="text-[10px] text-slate-500 font-semibold mt-1">Akun Menunggu Verifikasi / Login Pertama</p>
                    </div>
                </div>

                {/* Suspended Card */}
                <div className="rounded-2xl border border-[#1C2541]/50 bg-[#111A2E]/60 p-6 relative overflow-hidden">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black tracking-widest text-slate-400">DITANGGUHKAN</span>
                        <div className="h-6 w-6 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                            <ShieldX size={14} />
                        </div>
                    </div>
                    <div className="mt-4">
                        <h3 className="text-3xl font-black text-white">{totalSuspended}</h3>
                        <p className="text-[10px] text-slate-500 font-semibold mt-1">Akun yang Dinonaktifkan Sementara</p>
                    </div>
                </div>
            </div>

            {/* Users Table Card */}
            <div className="rounded-2xl border border-[#1C2541]/50 bg-[#111A2E]/50 shadow-md mb-8">
                {/* Table Filters */}
                <div className="border-b border-[#1C2541]/40 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h3 className="text-sm font-black text-white uppercase tracking-wider">Daftar Akun Pengguna</h3>
                            <p className="mt-1 text-xs text-slate-400 font-medium">Data akun login warga yang sinkron dengan hunian.</p>
                        </div>

                        <div className="flex gap-2 sm:flex-row">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(event) => setSearchTerm(event.target.value)}
                                    placeholder="Cari nama, email, rumah..."
                                    className="w-full rounded-full bg-[#111A2E] border border-[#1C2541]/75 py-2 pl-9 pr-4 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 sm:w-64 transition duration-200"
                                />
                            </div>

                            <select
                                value={statusFilter}
                                onChange={(event) => setStatusFilter(event.target.value as any)}
                                className="rounded-xl border border-[#1C2541] bg-[#111A2E] px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
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
                            <tr className="border-b border-[#1C2541]/50 bg-[#111A2E]/20 text-[10px] font-black uppercase tracking-wider text-slate-400">
                                <th className="px-5 py-3.5">WARGA</th>
                                <th className="px-5 py-3.5">EMAIL LOGIN</th>
                                <th className="px-5 py-3.5">NO. TELEPON</th>
                                <th className="px-5 py-3.5">STATUS AKUN</th>
                                <th className="px-5 py-3.5">LOGIN TERAKHIR</th>
                                <th className="px-5 py-3.5">JUMLAH LOGIN</th>
                                <th className="px-5 py-3.5 text-right">AKSI</th>
                            </tr>
                        </thead>

                        <tbody>
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
                                let badgeClass = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
                                let statusText = 'AKTIF';
                                let actionText = 'Nonaktifkan';
                                let actionClass = 'border-red-500/30 text-red-400 hover:bg-red-950/20';

                                if (!user.isActive) {
                                    if (user.loginCount === 0) {
                                        badgeClass = 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
                                        statusText = 'PENDING';
                                        actionText = 'Verifikasi';
                                        actionClass = 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-950/20';
                                    } else {
                                        badgeClass = 'bg-red-500/10 text-red-400 border border-red-500/20';
                                        statusText = 'SUSPENDED';
                                        actionText = 'Aktifkan';
                                        actionClass = 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-950/20';
                                    }
                                }

                                return (
                                    <tr
                                        key={user.id}
                                        className="border-b border-[#1C2541]/40 transition hover:bg-[#111A2E]/30 text-slate-300"
                                    >
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-400">
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
                                                    <p className="font-bold text-white">
                                                        {user.warga?.nama ?? user.name}
                                                    </p>
                                                    <p className="text-[10px] text-slate-500 mt-0.5">
                                                        No. Rumah {user.warga?.noRumah ?? '-'}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-5 py-4 font-semibold text-slate-300">{user.email}</td>
                                        <td className="px-5 py-4 text-slate-400">{user.phone || '-'}</td>

                                        <td className="px-5 py-4">
                                            <span className={`rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase ${badgeClass}`}>
                                                {statusText}
                                            </span>
                                        </td>

                                        <td className="px-5 py-4 text-slate-400">
                                            {user.lastLoginAt || 'Belum pernah login'}
                                        </td>

                                        <td className="px-5 py-4 text-slate-400 font-semibold">
                                            {user.loginCount} kali
                                        </td>

                                        <td className="px-5 py-4">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => toggleResidentUserStatus(user)}
                                                    className={`rounded-xl border px-3 py-1.5 text-[10px] font-black transition duration-200 ${actionClass}`}
                                                >
                                                    {actionText}
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => resetResidentUserPassword(user)}
                                                    className="rounded-xl border border-amber-500/30 px-3 py-1.5 text-[10px] font-black text-amber-400 hover:bg-amber-950/20 transition duration-200 flex items-center gap-1"
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
                className="fixed bottom-8 right-8 h-14 w-14 rounded-full bg-emerald-500 text-[#0B132B] hover:bg-emerald-400 shadow-xl shadow-emerald-500/20 flex items-center justify-center transition duration-200 hover:scale-105 z-30"
            >
                <Plus size={24} />
            </button>
        </AdminLayout>
    );
}
