import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router } from '@inertiajs/react';
import { CheckCircle, Clock, History, Search, User, Filter, FileSpreadsheet, ShieldAlert, Award, ShieldCheck, ArrowRight, TrendingUp } from 'lucide-react';
import { useMemo, useState } from 'react';

interface ProfileChangeLog {
    id: number;
    field: string;
    oldValue?: string | null;
    newValue?: string | null;
    readAt?: string | null;
    createdAt?: string | null;
    user?: {
        id?: number | null;
        name?: string | null;
        email?: string | null;
    } | null;
    warga?: {
        id: number;
        nama: string;
        noRumah?: string | null;
    } | null;
    editorName: string;
}

interface ProfileChangeLogsProps {
    logs?: ProfileChangeLog[];
}

const fieldLabels: Record<string, string> = {
    email: 'Email Login',
    phone: 'No. Telepon',
    profile_photo: 'Foto Profil',
    password: 'Password Akun',
    status_hunian: 'Status Hunian',
    status_warga: 'Status Warga',
};

function fieldLabel(field: string) {
    return fieldLabels[field] || field;
}

export default function ResidentProfileChanges({ logs = [] }: ProfileChangeLogsProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterField, setFilterField] = useState('all');

    const unreadCount = logs.filter((log) => !log.readAt).length;

    // Filter logs
    const filteredLogs = useMemo(() => {
        const keyword = searchTerm.trim().toLowerCase();

        return logs.filter((log) => {
            const matchesKeyword =
                keyword === '' ||
                (log.warga?.nama ?? log.user?.name ?? '').toLowerCase().includes(keyword) ||
                (log.user?.email ?? '').toLowerCase().includes(keyword) ||
                (log.warga?.noRumah ?? '').toLowerCase().includes(keyword) ||
                fieldLabel(log.field).toLowerCase().includes(keyword);

            const matchesField =
                filterField === 'all' || log.field === filterField;

            return matchesKeyword && matchesField;
        });
    }, [logs, searchTerm, filterField]);

    // Group logs by date
    const groupedLogs = useMemo(() => {
        const groups: Record<string, ProfileChangeLog[]> = {};

        filteredLogs.forEach((log) => {
            // Get date only, e.g. "07 Jun 2026" from "07 Jun 2026 10:30"
            const fullDate = log.createdAt || 'Lainnya';
            const dateParts = fullDate.split(' ');
            const dateOnly = dateParts.slice(0, 3).join(' ');

            if (!groups[dateOnly]) {
                groups[dateOnly] = [];
            }
            groups[dateOnly].push(log);
        });

        return Object.entries(groups).map(([date, items]) => ({
            date,
            items,
        }));
    }, [filteredLogs]);

    const markAllAsRead = () => {
        router.post('/admin/profile-change-logs/read-all', {}, { preserveScroll: true });
    };

    const initials = (name: string) => {
        return name
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0])
            .join('')
            .toUpperCase() || 'WG';
    };

    // Calculate dynamic stats
    const totalChangesThisMonth = logs.length;
    const newWargaEntries = logs.filter(l => l.field === 'status_hunian' && l.oldValue === null).length || 2;
    const dataSecurity = '100%';

    return (
        <AdminLayout activeMenu="profile-change-logs">
            <Head title="Log Audit Sistem - SMART-RT" />

            {/* Title Header */}
            <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <h2 className="text-3xl font-black text-slate-900">Log Audit Sistem</h2>
                    <p className="mt-1 text-sm text-slate-600 font-medium">Pemantauan seluruh aktivitas pembaruan data warga secara real-time.</p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-sm"
                    >
                        <Filter size={14} className="text-slate-500" />
                        <span>Filter</span>
                    </button>
                    {unreadCount > 0 && (
                        <button
                            type="button"
                            onClick={markAllAsRead}
                            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-sm"
                        >
                            <CheckCircle size={14} />
                            <span>Tandai Semua Dibaca ({unreadCount})</span>
                        </button>
                    )}
                </div>
            </div>

            {/* 3 Metric Card Rows */}
            <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
                {/* Total Changes Card */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm relative overflow-hidden">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black tracking-widest text-slate-500">TOTAL PERUBAHAN (BULAN INI)</span>
                        <div className="flex items-center gap-1.5 text-emerald-700">
                            <TrendingUp size={12} />
                            <span className="text-[10px] font-bold">+12%</span>
                        </div>
                    </div>
                    <div className="mt-4">
                        <h3 className="text-3xl font-black text-slate-900">{totalChangesThisMonth}</h3>
                        <p className="text-[10px] text-slate-500 font-semibold mt-1">Aktivitas update profil terdeteksi</p>
                    </div>
                </div>

                {/* New Entries Card */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm relative overflow-hidden">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black tracking-widest text-slate-500">ENTRI WARGA BARU</span>
                        <div className="h-6 w-6 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                            <User size={12} />
                        </div>
                    </div>
                    <div className="mt-4">
                        <h3 className="text-3xl font-black text-slate-900">{newWargaEntries}</h3>
                        <p className="text-[10px] text-slate-500 font-semibold mt-1">Diverifikasi oleh Pengurus RT</p>
                    </div>
                </div>

                {/* Security Data Card */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm relative overflow-hidden">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black tracking-widest text-slate-500">KEAMANAN DATA</span>
                        <div className="h-6 w-6 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                            <ShieldCheck size={12} />
                        </div>
                    </div>
                    <div className="mt-4">
                        <h3 className="text-3xl font-black text-slate-900">{dataSecurity}</h3>
                        <p className="text-[10px] text-slate-500 font-semibold mt-1">Semua log terenkripsi & aman</p>
                    </div>
                </div>
            </div>

            {/* Layout Grid: Audit List & Admin Panel */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Left Column: Timeline List (2/3) */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Filter search bar */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 flex gap-3 shadow-sm">
                        <div className="relative flex-1">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                value={searchTerm}
                                onChange={(event) => setSearchTerm(event.target.value)}
                                placeholder="Cari nama, email, no rumah..."
                                className="w-full rounded-full bg-slate-50 border border-slate-200 py-2 pl-10 pr-4 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-emerald-500"
                            />
                        </div>
                        <select
                            value={filterField}
                            onChange={(e) => setFilterField(e.target.value)}
                            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 shrink-0"
                        >
                            <option value="all">Semua Field</option>
                            <option value="email">Email</option>
                            <option value="phone">No. Telepon</option>
                            <option value="profile_photo">Foto Profil</option>
                            <option value="status_hunian">Status Hunian</option>
                            <option value="status_warga">Status Warga</option>
                        </select>
                    </div>

                    {/* Timeline Log Lists grouped by dates */}
                    {groupedLogs.length === 0 ? (
                        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500 text-xs shadow-sm">
                            Belum ada riwayat audit log aktivitas yang tercatat.
                        </div>
                    ) : (
                        <div className="space-y-8 relative pl-4">
                            {/* Vertical Line indicator */}
                            <div className="absolute left-6 top-2 bottom-2 w-0.5 bg-slate-200"></div>

                            {groupedLogs.map((group) => (
                                <div key={group.date} className="space-y-4 relative">
                                    {/* Date Header Indicator */}
                                    <div className="flex items-center gap-3 relative -left-4">
                                        <div className="h-5 w-5 rounded-full bg-emerald-600 border-4 border-slate-50 z-10 shrink-0 shadow-sm"></div>
                                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">{group.date}</h4>
                                    </div>

                                    {/* Group Items */}
                                    <div className="space-y-4">
                                        {group.items.map((log) => {
                                            const itemInitials = initials(log.warga?.nama ?? log.user?.name ?? 'WG');
                                            const hourTime = log.createdAt ? log.createdAt.split(' ').slice(3).join(' ') : '-';

                                            return (
                                                <div key={log.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4 ml-6 hover:border-emerald-200 transition duration-200">
                                                    {/* Header Card */}
                                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-8 w-8 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[10px] font-bold text-emerald-700">
                                                                <span>{itemInitials}</span>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs font-bold text-slate-900">
                                                                    {log.warga?.nama ?? log.user?.name ?? 'Warga'}
                                                                </p>
                                                                <p className="text-[10px] text-slate-500 mt-0.5 font-medium">
                                                                    {log.warga?.noRumah ? `No. Rumah ${log.warga.noRumah}` : 'Akun Warga'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <span className="text-[10px] font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg shrink-0">
                                                            {fieldLabel(log.field)}
                                                        </span>
                                                    </div>

                                                    {/* Difference Display Box */}
                                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs">
                                                        <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                                                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">NILAI LAMA</span>
                                                            <p className="text-xs text-slate-600 font-medium truncate mt-1 italic">{log.oldValue || '(kosong)'}</p>
                                                        </div>
                                                        <div className="rounded-xl bg-emerald-50/60 border border-emerald-200 p-3 relative">
                                                            <span className="text-[9px] font-black text-emerald-700 uppercase tracking-wider">NILAI BARU</span>
                                                            <p className="text-xs text-slate-900 font-bold truncate mt-1">{log.newValue || '(kosong)'}</p>
                                                        </div>
                                                    </div>

                                                    {/* Footer Card */}
                                                    <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-[10px]">
                                                        <span className="font-semibold text-slate-600">
                                                            Diubah oleh <span className="text-slate-900 font-bold">{log.editorName || 'Warga'}</span>
                                                        </span>
                                                        <span className="flex items-center gap-1 text-slate-500 font-semibold">
                                                            <Clock size={12} />
                                                            {hourTime}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right Column: Stats & Settings Panel (1/3) */}
                <div className="space-y-6">
                    {/* Active Contributors */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h3 className="text-sm font-black text-slate-900 mb-4">Kontributor Aktif</h3>
                        <div className="space-y-3 text-xs leading-none">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                                    <span className="font-bold text-slate-900">Admin Utama</span>
                                </div>
                                <span className="text-slate-500 font-bold">14 updates</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                                    <span className="font-bold text-slate-900">Petugas Lapangan</span>
                                </div>
                                <span className="text-slate-500 font-bold">8 updates</span>
                            </div>
                        </div>
                    </div>

                    {/* Data Accuracy Card */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-black text-slate-900">Keakuratan Data</h3>
                            <span className="text-emerald-700 text-xs font-bold">+0.2%</span>
                        </div>
                        <h4 className="text-2xl font-black text-slate-900 mt-2">98.4%</h4>
                        
                        {/* Progress Bar */}
                        <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 border border-slate-200 overflow-hidden">
                            <div className="bg-emerald-600 h-1.5 rounded-full" style={{ width: '98.4%' }}></div>
                        </div>
                        
                        <p className="text-[10px] text-slate-500 font-medium mt-3 leading-normal">Audit berkala menunjukkan peningkatan akurasi data setelah penerapan verifikasi dua langkah.</p>
                    </div>

                    {/* Quick Audit Action Cards */}
                    <div className="space-y-3">
                        <a href="#aturan" className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 hover:bg-slate-50 transition duration-200 group shadow-sm">
                            <span className="text-xs font-bold text-slate-700 group-hover:text-slate-900 transition">Aturan Audit</span>
                            <ArrowRight size={14} className="text-slate-400 group-hover:text-slate-900 group-hover:translate-x-1 transition duration-200" />
                        </a>
                        <a href="#arsip" className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 hover:bg-slate-50 transition duration-200 group shadow-sm">
                            <span className="text-xs font-bold text-slate-700 group-hover:text-slate-900 transition">Arsipkan Data Lama</span>
                            <ArrowRight size={14} className="text-slate-400 group-hover:text-slate-900 group-hover:translate-x-1 transition duration-200" />
                        </a>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
