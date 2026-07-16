import { useEffect, useMemo, useState } from 'react';
import { Calendar, Mail, Phone, X, FileText, MapPin } from 'lucide-react';

type CommitteeMember = {
    id: number;
    nama: string;
    jabatan: string;
    jabatanSingkat?: string;
    phone?: string | null;
    email?: string | null;
    avatar?: string;
    foto?: string | null;
    deskripsi?: string | null;
    isKetua?: boolean;
};

type CommitteePeriod = {
    id: string;
    tahun: string;
    label: string;
    status: 'aktif' | 'selesai' | string;
    anggota: CommitteeMember[];
};

type Props = {
    periods?: CommitteePeriod[];
};

function initials(name: string) {
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase();
}

function positionLabel(member: CommitteeMember) {
    return member.jabatanSingkat || member.jabatan;
}

function isCleanValue(val: any) {
    if (val === null || val === undefined) return false;
    const cleanStr = String(val).trim().toLowerCase();
    if (cleanStr === '' || cleanStr === 'null' || cleanStr === 'undefined' || cleanStr === '-' || cleanStr === 'n/a') return false;
    return true;
}

type OfficialCardProps = {
    member: CommitteeMember;
    onClick: (member: CommitteeMember) => void;
};

function OfficialCard({ member, onClick }: OfficialCardProps) {
    const photoUrl = member.foto;
    return (
        <button
            type="button"
            onClick={() => onClick(member)}
            aria-label={`Lihat detail profil ${member.nama}`}
            className="relative flex w-full cursor-pointer flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-center transition duration-200 hover:-translate-y-1 hover:border-emerald-400/60 hover:shadow-lg hover:shadow-emerald-500/5 focus:outline-none focus:ring-2 focus:ring-emerald-400 min-w-[145px] snap-center sm:min-w-0"
        >
            <div className="h-20 w-20 overflow-hidden rounded-full border-2 border-emerald-400/40 p-0.5 sm:h-24 sm:w-24 shrink-0 mb-3 flex items-center justify-center bg-slate-950">
                {photoUrl ? (
                    <img
                        src={photoUrl}
                        alt={member.nama}
                        className="h-full w-full rounded-full object-cover"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center rounded-full bg-emerald-500/15 text-2xl font-black text-emerald-400 uppercase">
                        {initials(member.nama)}
                    </div>
                )}
            </div>
            <h4 className="text-sm sm:text-base font-semibold leading-tight text-white break-words w-full">
                {member.nama}
            </h4>
            <p className="mt-1 text-[11px] sm:text-xs font-bold uppercase tracking-wide text-emerald-400">
                {positionLabel(member)}
            </p>
        </button>
    );
}

type DetailModalProps = {
    member: CommitteeMember | null;
    period: CommitteePeriod | null;
    onClose: () => void;
};

function OfficialDetailModal({ member, period, onClose }: DetailModalProps) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    if (!member) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
            
            <div className="relative w-full max-w-md max-h-[calc(100vh-2rem)] overflow-y-auto rounded-2xl border border-slate-800 bg-slate-950 p-6 text-slate-200 shadow-2xl z-10 no-scrollbar">
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Tutup Detail"
                    className="absolute right-4 top-4 rounded-xl p-2 text-slate-400 hover:bg-slate-900 hover:text-white transition"
                >
                    <X size={20} />
                </button>

                <div className="flex flex-col items-center text-center">
                    <div className="h-24 w-24 overflow-hidden rounded-full border-2 border-emerald-400/40 p-0.5 mb-4 shrink-0 bg-slate-900">
                        {member.foto ? (
                            <img
                                src={member.foto}
                                alt={member.nama}
                                className="h-full w-full rounded-full object-cover"
                            />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center rounded-full bg-emerald-500/15 text-3xl font-black text-emerald-400 uppercase">
                                {initials(member.nama)}
                            </div>
                        )}
                    </div>

                    <h3 className="text-xl font-black text-white px-2 break-words w-full">
                        {member.nama}
                    </h3>
                    <p className="mt-1.5 text-xs font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3.5 py-1 rounded-full">
                        {positionLabel(member)}
                    </p>
                </div>

                <div className="mt-6 space-y-4 border-t border-slate-800/60 pt-5 text-sm">
                    {period && (
                        <div className="flex items-start gap-3">
                            <Calendar size={16} className="text-slate-400 mt-0.5 shrink-0" />
                            <div>
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Periode Jabatan</p>
                                <p className="text-slate-300 font-semibold mt-0.5">{period.tahun} • {period.status === 'aktif' ? 'Aktif Menjabat' : 'Selesai Menjabat'}</p>
                            </div>
                        </div>
                    )}

                    {isCleanValue(member.deskripsi) && (
                        <div className="flex items-start gap-3">
                            <FileText size={16} className="text-slate-400 mt-0.5 shrink-0" />
                            <div>
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Deskripsi Tugas</p>
                                <p className="text-slate-300 leading-relaxed mt-0.5">{member.deskripsi}</p>
                            </div>
                        </div>
                    )}

                    {isCleanValue(member.phone) && (
                        <div className="flex items-start gap-3">
                            <Phone size={16} className="text-slate-400 mt-0.5 shrink-0" />
                            <div>
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Nomor Telepon</p>
                                <a href={`tel:${member.phone}`} className="inline-block text-emerald-400 hover:underline font-semibold mt-0.5">
                                    {member.phone}
                                </a>
                            </div>
                        </div>
                    )}

                    {isCleanValue(member.email) && (
                        <div className="flex items-start gap-3">
                            <Mail size={16} className="text-slate-400 mt-0.5 shrink-0" />
                            <div>
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Email</p>
                                <a href={`mailto:${member.email}`} className="inline-block text-emerald-400 hover:underline font-semibold mt-0.5">
                                    {member.email}
                                </a>
                            </div>
                        </div>
                    )}

                    {isCleanValue((member as any).alamat) && (
                        <div className="flex items-start gap-3">
                            <MapPin size={16} className="text-slate-400 mt-0.5 shrink-0" />
                            <div>
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Alamat</p>
                                <p className="text-slate-300 mt-0.5">{(member as any).alamat}</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="mt-8">
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-full rounded-xl bg-slate-900 border border-slate-800 py-2.5 text-center text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition duration-200"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
}

type AllOfficialsModalProps = {
    open: boolean;
    periods: CommitteePeriod[];
    selectedPeriodId: string;
    onPeriodChange: (id: string) => void;
    onClose: () => void;
    onOfficialClick: (member: CommitteeMember) => void;
};

function AllOfficialsModal({
    open,
    periods,
    selectedPeriodId,
    onPeriodChange,
    onClose,
    onOfficialClick,
}: AllOfficialsModalProps) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    if (!open) return null;

    const currentPeriod = periods.find((p) => p.id === selectedPeriodId) || periods[0];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
            <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
            
            <div className="relative w-full max-w-5xl max-h-[calc(100vh-2rem)] overflow-y-auto rounded-2xl border border-slate-800 bg-slate-950 p-6 text-slate-200 shadow-2xl z-10 no-scrollbar">
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Tutup Daftar Pengurus"
                    className="absolute right-4 top-4 rounded-xl p-2 text-slate-400 hover:bg-slate-900 hover:text-white transition"
                >
                    <X size={20} />
                </button>

                <div className="mb-6">
                    <h3 className="text-xl font-black text-white">Struktur Kepengurusan Lengkap</h3>
                    <p className="text-xs text-slate-400 mt-1">Daftar lengkap seluruh pengurus RT 004 untuk setiap periode kepengurusan.</p>
                </div>

                {/* Period switcher inside modal */}
                {periods.length > 1 && (
                    <div className="mb-6 flex flex-wrap gap-2 border-b border-slate-800/60 pb-4">
                        {periods.map((p) => (
                            <button
                                key={p.id}
                                type="button"
                                onClick={() => onPeriodChange(p.id)}
                                className={[
                                    'inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition active:scale-95',
                                    selectedPeriodId === p.id
                                        ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/10'
                                        : 'border border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-slate-200',
                                ].join(' ')}
                            >
                                <Calendar size={13} />
                                {p.tahun}
                                {p.status === 'aktif' && (
                                    <span className="rounded-full bg-slate-950/20 px-1.5 py-0.5 text-[9px] uppercase tracking-wider font-extrabold text-emerald-950">
                                        Aktif
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                )}

                {currentPeriod ? (
                    <div>
                        <div className="mb-4 rounded-xl border border-slate-800/60 bg-slate-900/40 p-4 text-xs font-bold text-slate-400">
                            Periode {currentPeriod.tahun} • Terdiri dari {currentPeriod.anggota.length} Pengurus RT
                        </div>
                        
                        <div className="grid grid-cols-1 min-[360px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {currentPeriod.anggota.map((member) => (
                                <OfficialCard
                                    key={member.id}
                                    member={member}
                                    onClick={onOfficialClick}
                                />
                            ))}
                        </div>
                    </div>
                ) : (
                    <p className="text-center text-sm text-slate-500 py-12">Belum ada data pengurus.</p>
                )}

                <div className="mt-8 flex justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl border border-slate-800 bg-slate-900 px-5 py-2.5 text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-850 transition"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function StrukturKeanggotaan({ periods = [] }: Props) {
    const safePeriods = Array.isArray(periods) ? periods : [];
    
    // Period switcher states
    const [selectedPeriodId, setSelectedPeriodId] = useState(safePeriods.find(p => p.status === 'aktif')?.id ?? safePeriods[0]?.id ?? '');
    const [selectedOfficial, setSelectedOfficial] = useState<CommitteeMember | null>(null);
    const [showAllOfficials, setShowAllOfficials] = useState(false);

    const activePeriod = useMemo(() => {
        return safePeriods.find((p) => p.status === 'aktif') ?? safePeriods[0] ?? null;
    }, [safePeriods]);

    const displayPeriod = useMemo(() => {
        return safePeriods.find((p) => p.id === selectedPeriodId) ?? activePeriod;
    }, [safePeriods, selectedPeriodId, activePeriod]);

    // Filter main 3 leaders for active period
    const mainMembers = useMemo(() => {
        if (!activePeriod) return { ketua: undefined, wakil: undefined, sekretaris: undefined, all: [] };
        
        const getRoleRank = (m: CommitteeMember) => {
            // Normalize: lowercase + collapse multiple spaces → single space
            const title = (m.jabatan || '').toLowerCase().replace(/\s+/g, ' ').trim();
            const shortTitle = (m.jabatanSingkat || '').toLowerCase().replace(/\s+/g, ' ').trim();
            
            const isKetua = (title === 'ketua rt' || title === 'ketua' || title.startsWith('ketua rt') || shortTitle === 'ketua rt' || shortTitle === 'ketua') && !title.includes('wakil');
            const isWakil = title.includes('wakil') || shortTitle.includes('wakil') || title.includes('wkl') || shortTitle.includes('wkl');
            const isSekretaris = title.includes('sekretaris') || title.includes('sekertaris') || shortTitle.includes('sekretaris') || shortTitle.includes('sekertaris');
            
            if (isKetua) return { rank: 1, key: 'ketua' };
            if (isWakil) return { rank: 2, key: 'wakil' };
            if (isSekretaris) return { rank: 3, key: 'sekretaris' };
            return null;
        };

        let ketua: CommitteeMember | undefined;
        let wakil: CommitteeMember | undefined;
        let sekretaris: CommitteeMember | undefined;

        activePeriod.anggota.forEach(m => {
            const info = getRoleRank(m);
            if (!info) return;
            if (info.key === 'ketua' && !ketua) ketua = m;
            if (info.key === 'wakil' && !wakil) wakil = m;
            if (info.key === 'sekretaris' && !sekretaris) sekretaris = m;
        });

        const all: CommitteeMember[] = [];
        if (ketua) all.push(ketua);
        if (wakil) all.push(wakil);
        if (sekretaris) all.push(sekretaris);
        
        return { ketua, wakil, sekretaris, all };
    }, [activePeriod]);

    if (safePeriods.length === 0 || !activePeriod) {
        return (
            <section className="bg-slate-950 py-20 text-slate-100">
                <div className="mx-auto max-w-container-max px-margin-mobile md:px-margin-desktop">
                    <div className="mx-auto max-w-3xl text-center">
                        <p className="text-xs font-bold uppercase tracking-[0.28em] text-emerald-400">Organisasi</p>
                        <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-white md:text-5xl">Struktur Kepengurusan RT</h2>
                        <p className="mt-4 text-sm leading-7 text-slate-400">
                            Data struktur pengurus belum tersedia. Setelah admin menambahkan periode dan anggota pengurus, bagian ini akan tampil otomatis.
                        </p>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="relative overflow-hidden bg-slate-950 py-20 text-slate-100">
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute left-[-10rem] top-[-10rem] h-96 w-96 rounded-full bg-emerald-500/5 blur-3xl" />
                <div className="absolute right-[-10rem] top-36 h-96 w-96 rounded-full bg-emerald-500/5 blur-3xl" />
            </div>

            <div className="relative mx-auto max-w-container-max px-margin-mobile md:px-margin-desktop">
                <div className="mx-auto max-w-3xl text-center mb-10">
                    <p className="text-xs font-bold uppercase tracking-[0.28em] text-emerald-400">Organisasi</p>
                    <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-white md:text-5xl">Struktur Kepengurusan RT 004</h2>
                    <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-400 md:text-base">
                        Susunan pengurus utama RT. Klik kartu untuk melihat detail profil dan informasi kontak.
                    </p>
                </div>

                {/* Pyramid Layout: Ketua (top center) → Wakil & Sekretaris (bottom row) */}
                {mainMembers.all.length > 0 ? (
                    <div className="mx-auto max-w-2xl">
                        {/* Top Row: Ketua RT centered */}
                        {mainMembers.ketua && (
                            <div className="flex justify-center mb-2">
                                <div className="w-full max-w-[220px] sm:max-w-[240px]">
                                    <OfficialCard
                                        member={mainMembers.ketua}
                                        onClick={setSelectedOfficial}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Connector line */}
                        {mainMembers.ketua && (mainMembers.wakil || mainMembers.sekretaris) && (
                            <div className="flex justify-center">
                                <div className="flex flex-col items-center">
                                    <div className="h-5 w-px bg-emerald-500/30" />
                                    <div className="h-px w-40 sm:w-64 bg-emerald-500/30" />
                                </div>
                            </div>
                        )}

                        {/* Bottom Row: Wakil (left) + Sekretaris (right) */}
                        {(mainMembers.wakil || mainMembers.sekretaris) && (
                            <div className="flex justify-center gap-5 mt-2">
                                {/* Left branch line */}
                                {mainMembers.wakil && (
                                    <div className="flex flex-col items-center w-full max-w-[220px] sm:max-w-[240px]">
                                        {mainMembers.ketua && (
                                            <div className="h-4 w-px bg-emerald-500/30 mb-2" />
                                        )}
                                        <OfficialCard
                                            member={mainMembers.wakil}
                                            onClick={setSelectedOfficial}
                                        />
                                    </div>
                                )}
                                {/* Right branch line */}
                                {mainMembers.sekretaris && (
                                    <div className="flex flex-col items-center w-full max-w-[220px] sm:max-w-[240px]">
                                        {mainMembers.ketua && (
                                            <div className="h-4 w-px bg-emerald-500/30 mb-2" />
                                        )}
                                        <OfficialCard
                                            member={mainMembers.sekretaris}
                                            onClick={setSelectedOfficial}
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="mx-auto max-w-3xl text-center py-10 rounded-2xl border border-dashed border-slate-800 bg-slate-900/20 text-slate-500 text-sm">
                        Belum ada data pengurus utama (Ketua RT, Wakil Ketua RT, Sekretaris) yang terkonfigurasi untuk periode aktif ini.
                    </div>
                )}

                {/* "Lihat Semua Pengurus" Button */}
                <div className="mt-10 flex justify-center">
                    <button
                        type="button"
                        onClick={() => setShowAllOfficials(true)}
                        className="inline-flex min-h-11 items-center justify-center rounded-xl border border-emerald-400/40 px-6 py-2.5 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-400/10 active:scale-95 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    >
                        Lihat Semua Pengurus
                    </button>
                </div>
            </div>

            {/* Modal Detail Pengurus */}
            <OfficialDetailModal
                member={selectedOfficial}
                period={displayPeriod}
                onClose={() => setSelectedOfficial(null)}
            />

            {/* Modal Semua Pengurus */}
            <AllOfficialsModal
                open={showAllOfficials}
                periods={safePeriods}
                selectedPeriodId={selectedPeriodId}
                onPeriodChange={setSelectedPeriodId}
                onClose={() => setShowAllOfficials(false)}
                onOfficialClick={setSelectedOfficial}
            />
        </section>
    );
}