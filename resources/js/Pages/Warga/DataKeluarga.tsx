import WargaLayout, { WargaProfile } from '@/Layouts/WargaLayout';
import { Head, Link } from '@inertiajs/react';
import { 
    ArrowLeft, 
    CheckCircle, 
    Eye, 
    EyeOff, 
    User, 
    Shield, 
    FileText, 
    Activity, 
    Check, 
    ChevronRight,
    Users
} from 'lucide-react';
import { useState } from 'react';

type KartuKeluarga = {
    noKK?: string | null;
    namaKepala?: string | null;
    alamat?: string | null;
    rt?: string | null;
    rw?: string | null;
    kelurahan?: string | null;
    kecamatan?: string | null;
    kota?: string | null;
    provinsi?: string | null;
    kodePos?: string | null;
    statusHunian?: string | null;
    statusWarga?: string | null;
};

type AnggotaKeluarga = {
    id: number;
    nama?: string | null;
    nik?: string | null;
    jk?: string | null;
    tempatLahir?: string | null;
    tanggalLahir?: string | null;
    agama?: string | null;
    pendidikan?: string | null;
    pekerjaan?: string | null;
    statusPerkawinan?: string | null;
    hubungan?: string | null;
    kewarganegaraan?: string | null;
    namaAyah?: string | null;
    namaIbu?: string | null;
};

type ActivityLog = {
    id: string | number;
    title: string;
    description: string;
    date: string;
    editor: string;
};

type Props = {
    profile?: WargaProfile;
    kartuKeluarga?: KartuKeluarga | null;
    anggotaKeluarga?: AnggotaKeluarga[];
    recentActivities?: ActivityLog[];
};

const fallbackProfile: WargaProfile = {
    name: 'Warga',
    initials: 'WG',
    houseNumber: '-',
    hasLinkedWarga: false,
};

function maskNumber(value?: string | null) {
    const clean = String(value || '').replace(/\D/g, '');
    if (clean.length <= 8) return value || '-';
    return `${clean.slice(0, 4)} **** **** ${clean.slice(-4)}`;
}

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

function getAge(birthDateString?: string | null) {
    if (!birthDateString) return null;
    const birthDate = new Date(birthDateString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}

export default function DataKeluarga({ 
    profile = fallbackProfile, 
    kartuKeluarga = null, 
    anggotaKeluarga = [],
    recentActivities = []
}: Props) {
    const safeProfile = profile ?? fallbackProfile;
    const members = Array.isArray(anggotaKeluarga) ? anggotaKeluarga : [];
    const activities = Array.isArray(recentActivities) ? recentActivities : [];

    const [showHeadNIK, setShowHeadNIK] = useState(false);
    const [showMemberNIK, setShowMemberNIK] = useState<Record<number, boolean>>({});
    const [expandedMemberId, setExpandedMemberId] = useState<number | null>(null);

    // Identify the head of family
    const headOfFamily = members.find((m) => m.hubungan === 'Kepala Keluarga') || members[0];
    const otherMembers = members.filter((m) => m.id !== headOfFamily?.id);

    // Calculate completeness of profile
    const calculateCompleteness = () => {
        if (members.length === 0) return 100;
        let totalFields = 0;
        let filledFields = 0;
        members.forEach((m) => {
            const fields = [
                m.nik,
                m.jk,
                m.tempatLahir,
                m.tanggalLahir,
                m.agama,
                m.pendidikan,
                m.pekerjaan,
                m.statusPerkawinan,
                m.hubungan,
            ];
            totalFields += fields.length;
            filledFields += fields.filter((f) => f !== null && f !== undefined && f !== '').length;
        });
        return Math.round((filledFields / totalFields) * 100);
    };

    const completenessPercentage = calculateCompleteness();

    const getInitials = (name?: string | null) => {
        if (!name) return 'WG';
        const words = name.trim().split(/\s+/);
        if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
        return (words[0][0] + (words[1] ? words[1][0] : '')).toUpperCase();
    };

    return (
        <WargaLayout profile={safeProfile} title="Data Keluarga">
            <Head title="Data Keluarga" />

            <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 lg:px-8 lg:py-8">
                {/* Header Back & Titles */}
                <div className="flex items-center gap-3">
                    <Link href="/warga/dashboard" className="rounded-xl bg-[#131b2e] border border-slate-800 p-2 text-slate-400 hover:text-slate-200 transition">
                        <ArrowLeft size={16} />
                    </Link>
                    <div>
                        <h1 className="text-xl font-black text-slate-100 tracking-tight">Informasi Kartu Keluarga</h1>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Nomor KK: <span className="font-mono text-emerald-400 font-bold">{kartuKeluarga?.noKK || '-'}</span>
                        </p>
                    </div>
                </div>

                {/* Banner Verification Notice */}
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                    <div className="flex gap-3">
                        <div className="mt-0.5 md:mt-0 flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                            <CheckCircle size={15} />
                        </div>
                        <div>
                            <p className="text-xs font-black text-emerald-400">Profil Terverifikasi</p>
                            <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5 max-w-3xl">
                                Mohon diperhatikan bahwa data Kartu Keluarga yang telah terverifikasi tidak dapat diubah secara mandiri melalui portal ini. Apabila terdapat perubahan data, silakan hubungi Sekretariat RT untuk proses pemutakhiran data secara resmi.
                            </p>
                        </div>
                    </div>
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap self-end md:self-auto">
                        Updated 2 days ago
                    </span>
                </div>

                {/* Main Two-Column Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column (Head of Family Detail) */}
                    <div className="lg:col-span-2">
                        {headOfFamily ? (
                            <div className="rounded-3xl border border-slate-800 bg-[#0b1220] p-6 shadow-xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/5 rounded-full blur-3xl group-hover:bg-emerald-500/10 transition"></div>
                                
                                <div className="flex flex-col md:flex-row items-center md:items-start gap-6 pb-6 border-b border-slate-800/80">
                                    <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-emerald-500/20 bg-[#131b2e] shadow-md">
                                        <span className="text-2xl font-black text-emerald-400">{getInitials(headOfFamily.nama)}</span>
                                    </div>
                                    
                                    <div className="text-center md:text-left space-y-2 flex-1 min-w-0">
                                        <div className="flex flex-col md:flex-row md:items-center gap-2">
                                            <h2 className="text-lg font-black text-slate-100 truncate">{headOfFamily.nama}</h2>
                                            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md px-2 py-0.5 text-[10px] font-extrabold tracking-wide uppercase self-center md:self-auto">
                                                Kepala Keluarga
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 pt-2 text-xs">
                                            <div className="flex items-center gap-2">
                                                <span className="text-slate-500 w-24 shrink-0">NIK</span>
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <span className="font-mono text-slate-300 font-bold truncate">
                                                        {showHeadNIK ? headOfFamily.nik : maskNumber(headOfFamily.nik)}
                                                    </span>
                                                    <button 
                                                        type="button" 
                                                        onClick={() => setShowHeadNIK(!showHeadNIK)}
                                                        className="text-slate-500 hover:text-slate-300 transition shrink-0"
                                                    >
                                                        {showHeadNIK ? <EyeOff size={13} /> : <Eye size={13} />}
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <span className="text-slate-500 w-24 shrink-0">Pekerjaan</span>
                                                <span className="text-slate-300 truncate font-semibold">{headOfFamily.pekerjaan || '-'}</span>
                                            </div>

                                            <div className="flex items-center gap-2 md:col-span-2">
                                                <span className="text-slate-500 w-24 shrink-0">Tempat/Tgl Lahir</span>
                                                <span className="text-slate-300 font-semibold truncate">
                                                    {headOfFamily.tempatLahir || '-'}, {formatDate(headOfFamily.tanggalLahir)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="rounded-3xl border border-dashed border-slate-800 p-8 text-center text-xs text-slate-500 bg-[#0b1220]">
                                Hubungkan data warga terlebih dahulu.
                            </div>
                        )}
                    </div>

                    {/* Right Column (Other Family Members list) */}
                    <div>
                        <div className="rounded-3xl border border-slate-800 bg-[#0b1220] p-5 shadow-xl flex flex-col h-full justify-between">
                            <div>
                                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800/80">
                                    <div className="flex items-center gap-2">
                                        <Users size={16} className="text-emerald-400" />
                                        <h3 className="text-xs font-black text-slate-300 uppercase tracking-wider">Daftar Anggota</h3>
                                    </div>
                                    <span className="bg-[#131b2e] text-emerald-400 border border-slate-800 rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase">
                                        {members.length} Orang
                                    </span>
                                </div>

                                <div className="space-y-3">
                                    {otherMembers.length === 0 ? (
                                        <div className="text-center py-6 text-xs text-slate-500 border border-dashed border-slate-800 rounded-2xl">
                                            Tidak ada anggota keluarga lain.
                                        </div>
                                    ) : (
                                        otherMembers.map((member) => {
                                            const age = getAge(member.tanggalLahir);
                                            const hasFullData = member.nik && member.tempatLahir && member.tanggalLahir && member.pekerjaan;
                                            const expanded = expandedMemberId === member.id;

                                            return (
                                                <div 
                                                    key={member.id}
                                                    className={`overflow-hidden rounded-2xl border transition-all duration-200 ${
                                                        expanded 
                                                            ? 'border-slate-700 bg-[#131b2e]/50 shadow-md' 
                                                            : 'border-slate-800 bg-[#131b2e]/30 hover:border-slate-750'
                                                    }`}
                                                >
                                                    <button
                                                        type="button"
                                                        onClick={() => setExpandedMemberId(expanded ? null : member.id)}
                                                        className="flex w-full items-center justify-between p-3 text-left transition"
                                                    >
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs font-bold text-slate-300">
                                                                {getInitials(member.nama)}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="truncate text-xs font-bold text-slate-200">{member.nama}</p>
                                                                <p className="text-[10px] text-slate-500 mt-0.5">
                                                                    {member.hubungan} {age !== null ? `· ${age} Thn` : ''}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-2 shrink-0">
                                                            <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] font-extrabold tracking-wide uppercase ${
                                                                hasFullData 
                                                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                                                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                                            }`}>
                                                                {hasFullData ? <Check size={8} className="stroke-[3]" /> : null}
                                                                {hasFullData ? 'Verified' : 'Menunggu'}
                                                            </span>
                                                            <ChevronRight size={14} className={`text-slate-500 transition-transform duration-200 ${expanded ? 'rotate-90 text-emerald-400' : ''}`} />
                                                        </div>
                                                    </button>

                                                    {expanded && (
                                                        <div className="border-t border-slate-800/65 bg-[#080d19]/40 p-4 space-y-3">
                                                            <div className="grid grid-cols-2 gap-3 text-[11px] text-slate-400">
                                                                <div>
                                                                    <span className="text-slate-500">NIK</span>
                                                                    <div className="flex items-center gap-1.5 mt-0.5">
                                                                        <span className="font-mono text-slate-300 font-bold">
                                                                            {showMemberNIK[member.id] ? member.nik : maskNumber(member.nik)}
                                                                        </span>
                                                                        <button 
                                                                            type="button" 
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setShowMemberNIK(prev => ({ ...prev, [member.id]: !prev[member.id] }));
                                                                            }}
                                                                            className="text-slate-500 hover:text-slate-300 transition"
                                                                        >
                                                                            {showMemberNIK[member.id] ? <EyeOff size={12} /> : <Eye size={12} />}
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <span className="text-slate-500">Pekerjaan</span>
                                                                    <p className="text-slate-300 font-semibold mt-0.5">{member.pekerjaan || '-'}</p>
                                                                </div>
                                                                <div className="col-span-2">
                                                                    <span className="text-slate-500">Tempat, Tanggal Lahir</span>
                                                                    <p className="text-slate-300 font-semibold mt-0.5">{member.tempatLahir || '-'}, {formatDate(member.tanggalLahir)}</p>
                                                                </div>
                                                                <div>
                                                                    <span className="text-slate-500">Agama</span>
                                                                    <p className="text-slate-300 font-semibold mt-0.5">{member.agama || '-'}</p>
                                                                </div>
                                                                <div>
                                                                    <span className="text-slate-500">Pendidikan</span>
                                                                    <p className="text-slate-300 font-semibold mt-0.5">{member.pendidikan || '-'}</p>
                                                                </div>
                                                                <div>
                                                                    <span className="text-slate-500">Status Kawin</span>
                                                                    <p className="text-slate-300 font-semibold mt-0.5">{member.statusPerkawinan || '-'}</p>
                                                                </div>
                                                                <div>
                                                                    <span className="text-slate-500">Kewarganegaraan</span>
                                                                    <p className="text-slate-300 font-semibold mt-0.5">{member.kewarganegaraan || '-'}</p>
                                                                </div>
                                                                <div>
                                                                    <span className="text-slate-500">Nama Ayah</span>
                                                                    <p className="text-slate-300 font-semibold mt-0.5">{member.namaAyah || '-'}</p>
                                                                </div>
                                                                <div>
                                                                    <span className="text-slate-500">Nama Ibu</span>
                                                                    <p className="text-slate-300 font-semibold mt-0.5">{member.namaIbu || '-'}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Row Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Bottom Card 1: Ringkasan Verifikasi */}
                    <div className="rounded-3xl border border-slate-800 bg-[#0b1220] p-5 shadow-xl flex flex-col justify-between hover:border-slate-700/60 transition group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl group-hover:bg-emerald-500/10 transition"></div>
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xs font-black text-slate-300 uppercase tracking-wider">Ringkasan Verifikasi</h3>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-slate-400">Status Akun</span>
                                    <span className="text-xs font-extrabold text-emerald-400 uppercase tracking-wide">
                                        Aktif & Terverifikasi
                                    </span>
                                </div>

                                <div className="space-y-2 pt-2">
                                    <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
                                        <span>Progress Kelengkapan</span>
                                        <span>{completenessPercentage}%</span>
                                    </div>
                                    <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden border border-slate-800/40">
                                        <div 
                                            className="h-full rounded-full bg-emerald-400 transition-all duration-500 shadow-[0_0_8px_rgba(52,211,153,0.3)]"
                                            style={{ width: `${completenessPercentage}%` }}
                                        />
                                    </div>
                                    <p className="text-[10px] text-slate-500 leading-normal mt-1">
                                        {completenessPercentage === 100 
                                            ? 'Data Kartu Keluarga Anda sudah terisi dengan lengkap dan diverifikasi.' 
                                            : `Kelengkapan data keluarga mencapai ${completenessPercentage}%. Perbarui data Anda untuk mencapai 100%.`}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-slate-800/80 pt-4 mt-6 flex justify-between items-center relative">
                            <Link href="/warga/profil" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-emerald-400 transition">
                                <span>Perbarui Profile</span>
                                <ArrowLeft size={14} className="rotate-180" />
                            </Link>
                            <div className="p-2 rounded-xl bg-emerald-500/5 text-emerald-400">
                                <Shield size={16} />
                            </div>
                        </div>
                    </div>

                    {/* Bottom Card 2: Aktivitas Terakhir */}
                    <div className="rounded-3xl border border-slate-800 bg-[#0b1220] p-5 shadow-xl hover:border-slate-700/60 transition flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xs font-black text-slate-300 uppercase tracking-wider">Aktivitas Terakhir</h3>
                            </div>

                            <div className="space-y-4">
                                {activities.length === 0 ? (
                                    <div className="text-center py-6 text-xs text-slate-500">
                                        Belum ada riwayat aktivitas log.
                                    </div>
                                ) : (
                                    activities.slice(0, 2).map((log, idx) => (
                                        <div key={log.id || idx} className="flex gap-3 items-start text-xs border-b border-slate-800/60 pb-3 last:border-none last:pb-0">
                                            <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-lg bg-[#131b2e] text-emerald-400 border border-slate-800 shrink-0">
                                                <Activity size={12} />
                                            </div>
                                            <div className="min-w-0 flex-1 space-y-0.5">
                                                <p className="font-bold text-slate-300 leading-tight">{log.title}</p>
                                                <p className="text-[10px] text-slate-500 leading-normal">{log.description}</p>
                                                <p className="text-[9px] text-slate-500 font-semibold pt-1">
                                                    {log.date} · Oleh {log.editor}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </WargaLayout>
    );
}