import { FormEvent, useMemo, useRef, useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import {
    Award,
    Calendar,
    CheckCircle,
    ChevronDown,
    ChevronRight,
    Clock,
    Edit,
    Globe,
    History,
    Mail,
    MapPin,
    Phone,
    PhoneCall,
    Plus,
    Save,
    Shield,
    Trash2,
    Upload,
    User,
    Users,
    X,
    Zap,
} from 'lucide-react';

const Instagram = (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className}>
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
);

const Youtube = (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className}>
        <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
        <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
    </svg>
);

/* ── Types ── */
type PeriodStatus = 'draft' | 'active' | 'completed';
type MemberCategory = 'core' | 'division' | 'member';

interface RtSettingItem {
    key: string;
    value: string | null;
    type: 'text' | 'textarea' | 'image' | 'boolean' | 'json';
    label: string;
    group: string;
}

interface EmergencyContact {
    id: number;
    name: string;
    phone: string;
    role: string | null;
    description: string | null;
    sort_order: number;
    is_active: boolean;
}

interface CommitteeMember {
    id: number;
    committee_period_id: number;
    name: string;
    position: string;
    category: MemberCategory;
    phone: string | null;
    email: string | null;
    photo_path: string | null;
    photo_url: string | null;
    description: string | null;
    sort_order: number;
    is_active: boolean;
}

interface CommitteePeriod {
    id: number;
    name: string;
    start_year: number | null;
    end_year: number | null;
    status: PeriodStatus;
    is_active: boolean;
    description: string | null;
    members: CommitteeMember[];
}

interface PageProps {
    committeePeriods: CommitteePeriod[];
    activePeriod: CommitteePeriod | null;
    previousPeriods: CommitteePeriod[];
    rtSettings: RtSettingItem[];
    logoUrl: string | null;
    emergencyContacts: EmergencyContact[];
    flash?: {
        success?: string | null;
        error?: string | null;
    };
    errors?: Record<string, string>;
}

interface PeriodForm { name: string; start_year: string; end_year: string; status: PeriodStatus; description: string; }
interface MemberForm { committee_period_id: string; name: string; position: string; category: MemberCategory; phone: string; email: string; photo: File | null; description: string; sort_order: string; is_active: boolean; _method: '' | 'put'; }

/* ── Tab definitions ── */
const tabs = [
    { key: 'Struktur Kepengurusan', icon: Users, label: 'Struktur RT' },
    { key: 'Profil RT', icon: Shield, label: 'Profil RT' },
    { key: 'Tampilan', icon: Zap, label: 'Tampilan' },
    { key: 'Kontak Darurat', icon: PhoneCall, label: 'Kontak Darurat' },
    { key: 'Footer & Sosial Media', icon: Globe, label: 'Footer & Sosmed' },
];

const periodStatusOptions: { value: PeriodStatus; label: string }[] = [
    { value: 'active', label: 'Aktif' },
    { value: 'completed', label: 'Selesai' },
    { value: 'draft', label: 'Draft' },
];
const memberCategoryOptions: { value: MemberCategory; label: string }[] = [
    { value: 'core', label: 'Pengurus Inti' },
    { value: 'division', label: 'Seksi / Divisi' },
    { value: 'member', label: 'Anggota' },
];

/* ── Helpers ── */
function getInitials(name: string) {
    return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase()).join('');
}
function statusLabel(status: PeriodStatus) {
    return status === 'active' ? 'Aktif' : status === 'completed' ? 'Selesai' : 'Draft';
}
function statusConfig(status: PeriodStatus) {
    if (status === 'active') return { cls: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30', dot: 'bg-emerald-400', icon: CheckCircle };
    if (status === 'completed') return { cls: 'bg-purple-500/20 text-purple-300 border border-purple-500/30', dot: 'bg-purple-400', icon: History };
    return { cls: 'bg-slate-500/20 text-slate-400 border border-slate-500/30', dot: 'bg-slate-400', icon: Clock };
}
function categoryConfig(category: MemberCategory) {
    if (category === 'core') return { cls: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', label: 'Pengurus Inti' };
    if (category === 'division') return { cls: 'bg-blue-500/20 text-blue-300 border-blue-500/30', label: 'Seksi / Divisi' };
    return { cls: 'bg-slate-500/20 text-slate-400 border-slate-500/30', label: 'Anggota' };
}
function formatPeriod(period: CommitteePeriod) {
    if (period.start_year && period.end_year) return `${period.start_year} – ${period.end_year}`;
    if (period.start_year) return `${period.start_year}`;
    return 'Tahun belum diisi';
}

const inputCls = 'w-full rounded-xl border border-[#1C2541]/60 bg-[#0B132B]/80 px-3 py-2.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition text-sm';
const labelCls = 'mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400';

export default function Pengaturan({
    activePeriod, previousPeriods, committeePeriods,
    rtSettings = [], logoUrl, emergencyContacts = [],
    flash, errors,
}: PageProps) {
    const [activeTab, setActiveTab] = useState('Profil RT');
    const [periodModal, setPeriodModal] = useState<{ mode: 'create' | 'edit'; period?: CommitteePeriod } | null>(null);
    const [memberModal, setMemberModal] = useState<{ mode: 'create' | 'edit'; member?: CommitteeMember } | null>(null);
    const [expandedPeriodId, setExpandedPeriodId] = useState<number | null>(null);
    const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
    const [contactModal, setContactModal] = useState<{ mode: 'create' | 'edit'; contact?: EmergencyContact } | null>(null);
    const logoInputRef = useRef<HTMLInputElement | null>(null);

    /* Build settings lookup */
    const settingsMap = useMemo(() => {
        const map: Record<string, string> = {};
        rtSettings.forEach(s => { map[s.key] = s.value ?? ''; });
        return map;
    }, [rtSettings]);

    const settingsByGroup = useMemo(() => {
        const map: Record<string, RtSettingItem[]> = {};
        rtSettings.forEach(s => {
            if (!map[s.group]) map[s.group] = [];
            map[s.group].push(s);
        });
        return map;
    }, [rtSettings]);

    /* RT Settings form state */
    const [profilValues, setProfilValues] = useState<Record<string, string>>(() => {
        const m: Record<string, string> = {};
        rtSettings.filter(s => s.group === 'profil_rt').forEach(s => { m[s.key] = s.value ?? ''; });
        return m;
    });
    const [tampilanValues, setTampilanValues] = useState<Record<string, string>>(() => {
        const m: Record<string, string> = {};
        rtSettings.filter(s => s.group === 'tampilan').forEach(s => { m[s.key] = s.value ?? ''; });
        return m;
    });
    const [footerValues, setFooterValues] = useState<Record<string, string>>(() => {
        const m: Record<string, string> = {};
        rtSettings.filter(s => s.group === 'footer').forEach(s => { m[s.key] = s.value ?? ''; });
        return m;
    });
    const [savingGroup, setSavingGroup] = useState<string | null>(null);

    const saveGroup = (group: string, values: Record<string, string>) => {
        setSavingGroup(group);
        router.post('/admin/settings/rt', { group, ...values }, {
            preserveScroll: true,
            onFinish: () => setSavingGroup(null),
        });
    };

    const uploadLogo = (file: File) => {
        const fd = new FormData();
        fd.append('logo', file);
        router.post('/admin/settings/rt/logo', fd, { forceFormData: true, preserveScroll: true });
    };

    /* Committee Period handlers */
    const periodForm = useForm<PeriodForm>({ name: '', start_year: '', end_year: '', status: 'active', description: '' });
    const memberForm = useForm<MemberForm>({ committee_period_id: activePeriod?.id ? String(activePeriod.id) : '', name: '', position: '', category: 'member', phone: '', email: '', photo: null, description: '', sort_order: '0', is_active: true, _method: '' });

    const openCreatePeriod = () => {
        periodForm.clearErrors();
        periodForm.setData({ name: '', start_year: '', end_year: '', status: activePeriod ? 'draft' : 'active', description: '' });
        setPeriodModal({ mode: 'create' });
    };
    const openEditPeriod = (period: CommitteePeriod) => {
        periodForm.clearErrors();
        periodForm.setData({ name: period.name ?? '', start_year: period.start_year ? String(period.start_year) : '', end_year: period.end_year ? String(period.end_year) : '', status: period.status, description: period.description ?? '' });
        setPeriodModal({ mode: 'edit', period });
    };
    const submitPeriod = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!periodModal) return;
        if (periodModal.mode === 'create') periodForm.post('/admin/settings/committee-periods', { preserveScroll: true, onSuccess: () => setPeriodModal(null) });
        else if (periodModal.period) periodForm.put(`/admin/settings/committee-periods/${periodModal.period.id}`, { preserveScroll: true, onSuccess: () => setPeriodModal(null) });
    };
    const deletePeriod = (period: CommitteePeriod) => {
        if (period.is_active) { alert('Periode aktif tidak dapat dihapus.'); return; }
        if (!confirm(`Hapus periode "${period.name}"?`)) return;
        router.delete(`/admin/settings/committee-periods/${period.id}`, { preserveScroll: true });
    };

    const openCreateMember = (periodId?: number) => {
        memberForm.clearErrors();
        memberForm.setData({ committee_period_id: periodId ? String(periodId) : (activePeriod?.id ? String(activePeriod.id) : ''), name: '', position: '', category: 'member', phone: '', email: '', photo: null, description: '', sort_order: '0', is_active: true, _method: '' });
        setMemberModal({ mode: 'create' });
    };
    const openEditMember = (member: CommitteeMember) => {
        memberForm.clearErrors();
        memberForm.setData({ committee_period_id: String(member.committee_period_id), name: member.name ?? '', position: member.position ?? '', category: member.category, phone: member.phone ?? '', email: member.email ?? '', photo: null, description: member.description ?? '', sort_order: String(member.sort_order ?? 0), is_active: member.is_active, _method: 'put' });
        setMemberModal({ mode: 'edit', member });
    };
    const submitMember = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!memberModal) return;
        const opts = { preserveScroll: true, forceFormData: true, onSuccess: () => setMemberModal(null) };
        if (memberModal.mode === 'create') memberForm.post('/admin/settings/committee-members', opts);
        else if (memberModal.member) memberForm.post(`/admin/settings/committee-members/${memberModal.member.id}`, opts);
    };
    const deleteMember = (member: CommitteeMember) => {
        if (!confirm(`Hapus anggota "${member.name}"?`)) return;
        router.delete(`/admin/settings/committee-members/${member.id}`, { preserveScroll: true });
    };

    /* Emergency contact handlers */
    const [contactForm, setContactForm] = useState({ name: '', phone: '', role: '', description: '', sort_order: '0', is_active: true });
    const [contactProcessing, setContactProcessing] = useState(false);

    const openCreateContact = () => {
        setContactForm({ name: '', phone: '', role: '', description: '', sort_order: '0', is_active: true });
        setContactModal({ mode: 'create' });
    };
    const openEditContact = (c: EmergencyContact) => {
        setContactForm({ name: c.name, phone: c.phone, role: c.role ?? '', description: c.description ?? '', sort_order: String(c.sort_order), is_active: c.is_active });
        setContactModal({ mode: 'edit', contact: c });
    };
    const submitContact = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!contactModal) return;
        setContactProcessing(true);
        const payload = { ...contactForm, sort_order: Number(contactForm.sort_order) };
        const url = contactModal.mode === 'create' ? '/admin/settings/emergency-contacts' : `/admin/settings/emergency-contacts/${contactModal.contact!.id}`;
        const method = contactModal.mode === 'create' ? 'post' : 'put';
        router[method](url, payload, { preserveScroll: true, onSuccess: () => setContactModal(null), onFinish: () => setContactProcessing(false) });
    };
    const deleteContact = (c: EmergencyContact) => {
        if (!confirm(`Hapus kontak "${c.name}"?`)) return;
        router.delete(`/admin/settings/emergency-contacts/${c.id}`, { preserveScroll: true });
    };

    const activeMembers = useMemo(() => activePeriod?.members ?? [], [activePeriod]);
    const coreMembers = useMemo(() => activeMembers.filter(m => m.category === 'core'), [activeMembers]);
    const divisionMembers = useMemo(() => activeMembers.filter(m => m.category === 'division'), [activeMembers]);
    const generalMembers = useMemo(() => activeMembers.filter(m => m.category === 'member'), [activeMembers]);

    return (
        <AdminLayout activeMenu="settings">
            <Head title="Pengaturan Admin" />

            {/* Header */}
            <div className="mb-6 flex items-start justify-between flex-wrap gap-3">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400 mb-1">Admin Panel</p>
                    <h2 className="text-2xl font-black text-white">Konfigurasi Lingkungan RT</h2>
                    <p className="text-slate-400 text-sm mt-1">Kelola profil RT, struktur kepengurusan, dan konfigurasi notifikasi di satu dashboard.</p>
                </div>
                {activeTab === 'Struktur Kepengurusan' && (
                    <div className="flex items-center gap-3">
                        <button onClick={openCreatePeriod} className="flex items-center gap-2 rounded-xl border border-[#1C2541]/60 bg-[#0B132B]/60 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:text-white transition">
                            <Calendar size={15} /> + Periode
                        </button>
                        <button onClick={() => openCreateMember()} disabled={committeePeriods.length === 0} className="flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-[#0B132B] hover:bg-emerald-400 transition disabled:opacity-40">
                            <Plus size={16} /> Tambah Anggota
                        </button>
                    </div>
                )}
                {activeTab === 'Kontak Darurat' && (
                    <button onClick={openCreateContact} className="flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-[#0B132B] hover:bg-emerald-400 transition">
                        <Plus size={16} /> Tambah Kontak
                    </button>
                )}
            </div>

            {/* Flash Messages */}
            {flash?.success && (
                <div className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                    {flash.success}
                </div>
            )}
            {flash?.error && (
                <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                    {flash.error}
                </div>
            )}

            {/* Tab Nav */}
            <div className="mb-6 flex gap-1 overflow-x-auto rounded-2xl border border-[#1C2541]/60 bg-[#0B132B]/60 p-1.5">
                {tabs.map(({ key, icon: Icon, label }) => (
                    <button key={key} onClick={() => setActiveTab(key)}
                        className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold whitespace-nowrap transition ${activeTab === key ? 'bg-emerald-500 text-[#0B132B] shadow-lg shadow-emerald-500/20' : 'text-slate-400 hover:text-white hover:bg-[#111A2E]/60'}`}>
                        <Icon size={15} />{label}
                    </button>
                ))}
            </div>

            {/* ── TAB: Profil RT ── */}
            {activeTab === 'Profil RT' && (
                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Form */}
                    <div className="lg:col-span-2 rounded-2xl border border-[#1C2541]/60 bg-[#0B132B]/60 overflow-hidden">
                        <div className="border-b border-[#1C2541]/40 px-5 py-4 flex items-center gap-2">
                            <Shield size={16} className="text-emerald-400" />
                            <h3 className="text-sm font-bold text-white">Profil Wilayah RT</h3>
                            <span className="ml-auto text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-lg">TERVERIFIKASI</span>
                        </div>
                        <div className="p-5 space-y-4">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                {(settingsByGroup['profil_rt'] || []).filter(s => s.key !== 'gmaps_embed_url').map(setting => (
                                    <div key={setting.key} className={setting.type === 'textarea' ? 'col-span-2' : ''}>
                                        <label className={labelCls}>{setting.label}</label>
                                        {setting.type === 'textarea' ? (
                                            <textarea
                                                rows={3}
                                                value={profilValues[setting.key] ?? ''}
                                                onChange={e => setProfilValues(prev => ({ ...prev, [setting.key]: e.target.value }))}
                                                className={inputCls}
                                                placeholder={setting.label}
                                            />
                                        ) : (
                                            <input
                                                type="text"
                                                value={profilValues[setting.key] ?? ''}
                                                onChange={e => setProfilValues(prev => ({ ...prev, [setting.key]: e.target.value }))}
                                                className={inputCls}
                                                placeholder={setting.label}
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-end pt-2">
                                <button
                                    onClick={() => saveGroup('profil_rt', profilValues)}
                                    disabled={savingGroup === 'profil_rt'}
                                    className="flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-[#0B132B] hover:bg-emerald-400 transition disabled:opacity-60"
                                >
                                    <Save size={15} />{savingGroup === 'profil_rt' ? 'Menyimpan...' : 'Simpan Perubahan'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Preview card */}
                    <div className="space-y-4">
                        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-3">Preview RT</h4>
                            <div className="space-y-2">
                                {[
                                    { label: 'Nama RT', key: 'rt_name' },
                                    { label: 'RT / RW', key: 'rt_number', special: true },
                                    { label: 'Kelurahan', key: 'kelurahan' },
                                    { label: 'Kota', key: 'kota' },
                                    { label: 'Telepon', key: 'telepon_rt' },
                                ].map(({ label, key, special }) => (
                                    <div key={key}>
                                        <p className="text-[10px] text-slate-500">{label}</p>
                                        <p className="text-sm font-semibold text-white">
                                            {special ? `RT ${profilValues['rt_number'] || '-'} / RW ${profilValues['rw_number'] || '-'}` : (profilValues[key] || '-')}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="rounded-2xl border border-[#1C2541]/60 bg-[#0B132B]/60 p-5">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Alamat Kantor</h4>
                            <p className="text-sm text-slate-400 leading-relaxed">{profilValues['alamat_kantor'] || 'Belum diisi'}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* ── TAB: Tampilan ── */}
            {activeTab === 'Tampilan' && (
                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2 rounded-2xl border border-[#1C2541]/60 bg-[#0B132B]/60 overflow-hidden">
                        <div className="border-b border-[#1C2541]/40 px-5 py-4 flex items-center gap-2">
                            <Zap size={16} className="text-emerald-400" />
                            <h3 className="text-sm font-bold text-white">Konfigurasi Tampilan</h3>
                        </div>
                        <div className="p-5 space-y-4">
                            {(settingsByGroup['tampilan'] || []).filter(s => s.type !== 'image').map(setting => (
                                <div key={setting.key}>
                                    <label className={labelCls}>{setting.label}</label>
                                    {setting.type === 'textarea' ? (
                                        <textarea rows={3} value={tampilanValues[setting.key] ?? ''} onChange={e => setTampilanValues(prev => ({ ...prev, [setting.key]: e.target.value }))} className={inputCls} placeholder={setting.label} />
                                    ) : (
                                        <input type="text" value={tampilanValues[setting.key] ?? ''} onChange={e => setTampilanValues(prev => ({ ...prev, [setting.key]: e.target.value }))} className={inputCls} placeholder={setting.label} />
                                    )}
                                </div>
                            ))}
                            <div className="flex justify-end pt-2">
                                <button onClick={() => saveGroup('tampilan', tampilanValues)} disabled={savingGroup === 'tampilan'} className="flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-[#0B132B] hover:bg-emerald-400 transition disabled:opacity-60">
                                    <Save size={15} />{savingGroup === 'tampilan' ? 'Menyimpan...' : 'Simpan Tampilan'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Logo upload panel */}
                    <div className="rounded-2xl border border-[#1C2541]/60 bg-[#0B132B]/60 overflow-hidden">
                        <div className="border-b border-[#1C2541]/40 px-5 py-4">
                            <h3 className="text-sm font-bold text-white">Logo Unit RT</h3>
                            <p className="text-xs text-slate-500 mt-0.5">Visuel branding di seluruh halaman</p>
                        </div>
                        <div className="p-5 flex flex-col items-center gap-4">
                            {/* Current logo */}
                            <div className="flex h-28 w-28 items-center justify-center rounded-2xl border-2 border-dashed border-[#1C2541]/60 bg-[#111A2E]/60 overflow-hidden">
                                {logoUrl ? (
                                    <img src={logoUrl} alt="Logo RT" className="h-full w-full object-contain p-2" />
                                ) : (
                                    <div className="text-center">
                                        <Upload size={24} className="text-slate-600 mx-auto mb-1" />
                                        <p className="text-[10px] text-slate-600">Belum ada logo</p>
                                    </div>
                                )}
                            </div>
                            <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) uploadLogo(f); }} />
                            <button onClick={() => logoInputRef.current?.click()} className="flex items-center gap-2 rounded-xl border border-[#1C2541]/60 px-4 py-2.5 text-sm font-bold text-slate-300 hover:text-white hover:border-emerald-500/30 transition">
                                <Upload size={14} /> {logoUrl ? 'Ganti Logo' : 'Upload Logo'}
                            </button>
                            <p className="text-[10px] text-slate-600 text-center">Format JPG/PNG/WebP/SVG, maks. 2 MB</p>
                        </div>
                    </div>
                </div>
            )}

            {/* ── TAB: Kontak Darurat ── */}
            {activeTab === 'Kontak Darurat' && (
                <div className="space-y-4">
                    {emergencyContacts.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-[#1C2541]/60 bg-[#0B132B]/40 py-14 text-center">
                            <PhoneCall size={36} className="text-slate-600 mx-auto mb-3" />
                            <p className="text-slate-500 font-semibold">Belum ada kontak darurat.</p>
                            <p className="text-sm text-slate-600 mt-1">Tambahkan kontak Ketua RT, Keamanan, Puskesmas, dll.</p>
                            <button onClick={openCreateContact} className="mt-5 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-[#0B132B] hover:bg-emerald-400 transition">+ Tambah Kontak</button>
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-[#1C2541]/60 bg-[#0B132B]/60 overflow-hidden">
                            <div className="border-b border-[#1C2541]/40 px-5 py-4 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <PhoneCall size={16} className="text-emerald-400" />
                                    <h3 className="text-sm font-bold text-white">Daftar Kontak Darurat</h3>
                                </div>
                                <span className="text-xs text-slate-500">{emergencyContacts.length} kontak</span>
                            </div>
                            <div className="divide-y divide-[#1C2541]/30">
                                {emergencyContacts.map(contact => (
                                    <div key={contact.id} className="flex items-center gap-4 px-5 py-4 hover:bg-[#111A2E]/50 transition group">
                                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${contact.is_active ? 'bg-emerald-500/15 border-emerald-500/20' : 'bg-slate-500/15 border-slate-500/20'}`}>
                                            <Phone size={16} className={contact.is_active ? 'text-emerald-400' : 'text-slate-500'} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-bold text-white">{contact.name}</p>
                                                {contact.role && <span className="text-[10px] font-bold border border-blue-500/30 bg-blue-500/10 text-blue-300 px-2 py-0.5 rounded-lg">{contact.role}</span>}
                                                {!contact.is_active && <span className="text-[10px] font-bold border border-slate-500/30 bg-slate-500/10 text-slate-500 px-2 py-0.5 rounded-lg">Nonaktif</span>}
                                            </div>
                                            <p className="text-xs text-emerald-400 font-semibold mt-0.5">{contact.phone}</p>
                                            {contact.description && <p className="text-[10px] text-slate-500 mt-0.5">{contact.description}</p>}
                                        </div>
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                                            <button onClick={() => openEditContact(contact)} className="rounded-xl border border-[#1C2541]/60 px-3 py-1.5 text-xs font-bold text-slate-400 hover:text-white transition"><Edit size={12} /></button>
                                            <button onClick={() => deleteContact(contact)} className="rounded-xl border border-red-500/30 px-3 py-1.5 text-xs font-bold text-red-400 hover:bg-red-500/10 transition"><Trash2 size={12} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ── TAB: Footer & Sosmed ── */}
            {activeTab === 'Footer & Sosial Media' && (
                <form onSubmit={(e) => { e.preventDefault(); saveGroup('footer', footerValues); }} className="grid gap-6 lg:grid-cols-2">
                    <div className="rounded-2xl border border-[#1C2541]/60 bg-[#0B132B]/60 overflow-hidden">
                        <div className="border-b border-[#1C2541]/40 px-5 py-4 flex items-center gap-2">
                            <Globe size={16} className="text-emerald-400" />
                            <h3 className="text-sm font-bold text-white">Teks Footer</h3>
                        </div>
                        <div className="p-5 space-y-4">
                            {(settingsByGroup['footer'] || []).filter(s => ['footer_text', 'copyright', 'email_publik'].includes(s.key)).map(setting => (
                                <div key={setting.key}>
                                    <label htmlFor={setting.key} className={labelCls}>{setting.label}</label>
                                    <input
                                        type="text"
                                        id={setting.key}
                                        name={setting.key}
                                        value={footerValues[setting.key] ?? ''}
                                        onChange={e => setFooterValues(prev => ({ ...prev, [setting.key]: e.target.value }))}
                                        className={`${inputCls} ${errors?.[setting.key] ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                                        placeholder={setting.label}
                                    />
                                    {errors?.[setting.key] && (
                                        <p className="mt-1 text-xs text-red-500">{errors[setting.key]}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-[#1C2541]/60 bg-[#0B132B]/60 overflow-hidden">
                        <div className="border-b border-[#1C2541]/40 px-5 py-4 flex items-center gap-2">
                            <Instagram size={16} className="text-pink-400" />
                            <h3 className="text-sm font-bold text-white">Link Sosial Media</h3>
                        </div>
                        <div className="p-5 space-y-4">
                            {[
                                { key: 'wa_link', label: 'WhatsApp Group', icon: Phone, placeholder: 'https://chat.whatsapp.com/...' },
                                { key: 'instagram', label: 'Instagram', icon: Instagram, placeholder: '@handle_rt' },
                                { key: 'facebook', label: 'Facebook', icon: Globe, placeholder: 'https://facebook.com/...' },
                                { key: 'youtube', label: 'YouTube', icon: Youtube, placeholder: 'https://youtube.com/@...' },
                            ].map(({ key, label, icon: Icon, placeholder }) => (
                                <div key={key}>
                                    <label htmlFor={key} className={labelCls}>{label}</label>
                                    <div className="relative">
                                        <Icon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                        <input
                                            type="text"
                                            id={key}
                                            name={key}
                                            value={footerValues[key] ?? ''}
                                            onChange={e => setFooterValues(prev => ({ ...prev, [key]: e.target.value }))}
                                            className={`${inputCls} pl-9 ${errors?.[key] ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                                            placeholder={placeholder}
                                        />
                                    </div>
                                    {errors?.[key] && (
                                        <p className="mt-1 text-xs text-red-500">{errors[key]}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="lg:col-span-2 flex justify-end">
                        <button type="submit" disabled={savingGroup === 'footer'} className="flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-[#0B132B] hover:bg-emerald-400 transition disabled:opacity-60">
                            <Save size={15} />{savingGroup === 'footer' ? 'Menyimpan...' : 'Simpan Footer & Sosmed'}
                        </button>
                    </div>
                </form>
            )}

            {/* ── TAB: Struktur Kepengurusan ── */}
            {activeTab === 'Struktur Kepengurusan' && (
                <div className="space-y-6">
                    {activePeriod ? (
                        <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-500/10 to-[#0B132B]/60 p-6">
                            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl" />
                            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-1">
                                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-300">Periode Aktif</span>
                                    </div>
                                    <h3 className="text-xl font-black text-white">{activePeriod.name}</h3>
                                    <p className="text-sm text-slate-400 mt-0.5">Masa bhakti {formatPeriod(activePeriod)} · {activeMembers.length} anggota</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex rounded-xl border border-[#1C2541]/60 bg-[#0B132B]/60 p-1">
                                        <button onClick={() => setViewMode('card')} className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${viewMode === 'card' ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-500 hover:text-slate-300'}`}>Kartu</button>
                                        <button onClick={() => setViewMode('table')} className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${viewMode === 'table' ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-500 hover:text-slate-300'}`}>Tabel</button>
                                    </div>
                                    <button onClick={() => openEditPeriod(activePeriod)} className="flex items-center gap-1.5 rounded-xl border border-[#1C2541]/60 bg-[#0B132B]/60 px-4 py-2 text-sm font-bold text-slate-300 hover:text-white transition">
                                        <Edit size={14} /> Edit
                                    </button>
                                </div>
                            </div>
                            <div className="mt-4 grid grid-cols-3 gap-3">
                                {[
                                    { label: 'Pengurus Inti', value: coreMembers.length, color: 'text-emerald-400', icon: Award },
                                    { label: 'Seksi/Divisi', value: divisionMembers.length, color: 'text-blue-400', icon: Users },
                                    { label: 'Anggota', value: generalMembers.length, color: 'text-slate-300', icon: User },
                                ].map(({ label, value, color, icon: Icon }) => (
                                    <div key={label} className="rounded-xl border border-[#1C2541]/40 bg-[#0B132B]/60 p-3 flex items-center gap-3">
                                        <Icon size={18} className={color} />
                                        <div>
                                            <p className={`text-lg font-black ${color}`}>{value}</p>
                                            <p className="text-[10px] text-slate-500">{label}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-dashed border-[#1C2541]/60 bg-[#0B132B]/40 p-10 text-center">
                            <Calendar size={40} className="text-slate-600 mx-auto mb-3" />
                            <p className="text-base font-bold text-slate-500">Belum ada periode kepengurusan aktif.</p>
                            <button onClick={openCreatePeriod} className="mt-5 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-[#0B132B] hover:bg-emerald-400 transition">+ Tambah Periode</button>
                        </div>
                    )}

                    {activePeriod && activeMembers.length > 0 && (
                        viewMode === 'card' ? (
                            <div className="space-y-6">
                                {coreMembers.length > 0 && <MemberGroup title="Pengurus Inti" members={coreMembers} accentColor="emerald" onEdit={openEditMember} onDelete={deleteMember} />}
                                {divisionMembers.length > 0 && <MemberGroup title="Seksi / Divisi" members={divisionMembers} accentColor="blue" onEdit={openEditMember} onDelete={deleteMember} />}
                                {generalMembers.length > 0 && <MemberGroup title="Anggota" members={generalMembers} accentColor="slate" onEdit={openEditMember} onDelete={deleteMember} />}
                            </div>
                        ) : (
                            <div className="rounded-2xl border border-[#1C2541]/60 bg-[#0B132B]/60 overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[800px]">
                                        <thead>
                                            <tr className="border-b border-[#1C2541]/40">
                                                {['Anggota', 'Jabatan', 'Kategori', 'WhatsApp', 'Status', 'Aksi'].map(h => (
                                                    <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-500">{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {activeMembers.map(member => {
                                                const catConf = categoryConfig(member.category);
                                                return (
                                                    <tr key={member.id} className="border-b border-[#1C2541]/30 hover:bg-[#111A2E]/50 transition group">
                                                        <td className="px-4 py-4">
                                                            <div className="flex items-center gap-3">
                                                                {member.photo_url ? (
                                                                    <img src={member.photo_url} alt={member.name} className="h-9 w-9 rounded-xl object-cover border border-[#1C2541]/60" />
                                                                ) : (
                                                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/20 text-xs font-black text-emerald-300">{getInitials(member.name)}</div>
                                                                )}
                                                                <p className="text-sm font-bold text-white">{member.name}</p>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-4 text-sm text-slate-300">{member.position}</td>
                                                        <td className="px-4 py-4">
                                                            <span className={`inline-flex rounded-lg border px-2.5 py-1 text-[10px] font-bold ${catConf.cls}`}>{catConf.label}</span>
                                                        </td>
                                                        <td className="px-4 py-4 text-xs text-slate-400">{member.phone || '-'}</td>
                                                        <td className="px-4 py-4"><span className={`inline-block w-2 h-2 rounded-full ${member.is_active ? 'bg-emerald-400' : 'bg-slate-500'}`} /></td>
                                                        <td className="px-4 py-4">
                                                            <div className="flex gap-2">
                                                                <button onClick={() => openEditMember(member)} className="rounded-xl border border-[#1C2541]/60 px-3 py-1.5 text-xs text-slate-400 hover:text-white transition">Edit</button>
                                                                <button onClick={() => deleteMember(member)} className="rounded-xl border border-red-500/30 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 transition">Hapus</button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )
                    )}

                    {committeePeriods.length > 0 && (
                        <div className="rounded-2xl border border-[#1C2541]/60 bg-[#0B132B]/60 overflow-hidden">
                            <div className="border-b border-[#1C2541]/40 px-5 py-4 flex items-center justify-between">
                                <div className="flex items-center gap-2"><History size={16} className="text-slate-400" /><h3 className="text-sm font-bold text-white">Semua Periode</h3></div>
                                <span className="text-xs text-slate-500">{committeePeriods.length} periode</span>
                            </div>
                            <div className="divide-y divide-[#1C2541]/30">
                                {committeePeriods.map(period => {
                                    const sc = statusConfig(period.status);
                                    const StatusIcon = sc.icon;
                                    const isExpanded = expandedPeriodId === period.id;
                                    return (
                                        <div key={period.id}>
                                            <button type="button" onClick={() => setExpandedPeriodId(isExpanded ? null : period.id)} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left hover:bg-[#111A2E]/50 transition">
                                                <div className="flex items-center gap-4">
                                                    <div className={`flex h-9 w-9 items-center justify-center rounded-xl border ${period.is_active ? 'bg-emerald-500/15 border-emerald-500/30' : 'bg-[#111A2E] border-[#1C2541]/60'}`}>
                                                        <StatusIcon size={16} className={period.is_active ? 'text-emerald-400' : 'text-slate-500'} />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-white">{period.name}</p>
                                                        <p className="text-xs text-slate-500">Masa bhakti {formatPeriod(period)} · {period.members.length} anggota</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-bold ${sc.cls}`}><span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />{statusLabel(period.status)}</span>
                                                    {isExpanded ? <ChevronDown size={16} className="text-slate-500" /> : <ChevronRight size={16} className="text-slate-500" />}
                                                </div>
                                            </button>
                                            {isExpanded && (
                                                <div className="border-t border-[#1C2541]/30 bg-[#060A14]/40 px-5 py-5">
                                                    <div className="mb-4 flex justify-end gap-2">
                                                        <button onClick={() => openEditPeriod(period)} className="flex items-center gap-1.5 rounded-xl border border-[#1C2541]/60 px-3 py-1.5 text-xs font-bold text-slate-400 hover:text-white transition"><Edit size={12} /> Edit</button>
                                                        <button onClick={() => deletePeriod(period)} className="flex items-center gap-1.5 rounded-xl border border-red-500/30 px-3 py-1.5 text-xs font-bold text-red-400 hover:bg-red-500/10 transition"><Trash2 size={12} /> Hapus</button>
                                                    </div>
                                                    {period.members.length > 0 ? (
                                                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                                            {period.members.map(member => {
                                                                const catConf = categoryConfig(member.category);
                                                                return (
                                                                    <div key={member.id} className="group relative flex items-center gap-3 rounded-xl border border-[#1C2541]/40 bg-[#0B132B]/60 p-3 hover:border-emerald-500/20 transition">
                                                                        {member.photo_url ? <img src={member.photo_url} alt={member.name} className="h-8 w-8 rounded-lg object-cover" /> : <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 text-xs font-black text-emerald-300">{getInitials(member.name)}</div>}
                                                                        <div className="flex-1 min-w-0 pr-12 group-hover:pr-20 transition-all">
                                                                            <p className="text-xs font-bold text-white truncate">{member.name}</p>
                                                                            <p className="text-[10px] text-slate-500 truncate">{member.position}</p>
                                                                        </div>
                                                                        <span className={`shrink-0 rounded-lg border px-1.5 py-0.5 text-[9px] font-bold ${catConf.cls} group-hover:hidden transition-all`}>{catConf.label.split('/')[0].trim()}</span>
                                                                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition duration-150">
                                                                            <button type="button" onClick={() => openEditMember(member)} className="rounded bg-[#1C2541] hover:bg-emerald-500 hover:text-[#0B132B] p-1 text-[10px] font-bold text-slate-400 transition" title="Edit">
                                                                                <Edit size={12} />
                                                                            </button>
                                                                            <button type="button" onClick={() => deleteMember(member)} className="rounded bg-[#1C2541] hover:bg-red-500 hover:text-white p-1 text-[10px] font-bold text-red-400 transition" title="Hapus">
                                                                                <Trash2 size={12} />
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    ) : <p className="text-sm text-slate-500 text-center py-4">Belum ada anggota.</p>}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ── Period Modal ── */}
            {periodModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                    <div className="w-full max-w-2xl rounded-2xl border border-[#1C2541]/60 bg-[#090E1A] shadow-2xl">
                        <div className="flex items-start justify-between border-b border-[#1C2541]/40 px-6 py-5">
                            <h2 className="text-lg font-black text-white">{periodModal.mode === 'create' ? 'Tambah' : 'Edit'} Periode Kepengurusan</h2>
                            <button onClick={() => setPeriodModal(null)} className="rounded-xl p-2 text-slate-400 hover:text-white hover:bg-[#1C2541]/60 transition"><X size={18} /></button>
                        </div>
                        <form onSubmit={submitPeriod} className="space-y-4 p-6">
                            <div><label className={labelCls}>Nama Periode</label><input type="text" value={periodForm.data.name} onChange={e => periodForm.setData('name', e.target.value)} className={inputCls} placeholder="Masa Bhakti 2025 – 2028" />{periodForm.errors.name && <p className="mt-1 text-xs text-red-400">{periodForm.errors.name}</p>}</div>
                            <div className="grid grid-cols-3 gap-3">
                                <div><label className={labelCls}>Tahun Mulai</label><input type="number" value={periodForm.data.start_year} onChange={e => periodForm.setData('start_year', e.target.value)} className={inputCls} placeholder="2025" /></div>
                                <div><label className={labelCls}>Tahun Selesai</label><input type="number" value={periodForm.data.end_year} onChange={e => periodForm.setData('end_year', e.target.value)} className={inputCls} placeholder="2028" /></div>
                                <div><label className={labelCls}>Status</label><select value={periodForm.data.status} onChange={e => periodForm.setData('status', e.target.value as PeriodStatus)} className={inputCls}>{periodStatusOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
                            </div>
                            <div><label className={labelCls}>Keterangan</label><textarea rows={3} value={periodForm.data.description} onChange={e => periodForm.setData('description', e.target.value)} className={inputCls} /></div>
                            <div className="flex justify-end gap-3 border-t border-[#1C2541]/40 pt-4">
                                <button type="button" onClick={() => setPeriodModal(null)} className="rounded-xl border border-[#1C2541]/60 px-4 py-2.5 text-sm text-slate-400 hover:text-white transition">Batal</button>
                                <button type="submit" disabled={periodForm.processing} className="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-[#0B132B] hover:bg-emerald-400 transition disabled:opacity-60">{periodForm.processing ? 'Menyimpan...' : 'Simpan'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Member Modal ── */}
            {memberModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 backdrop-blur-sm p-4">
                    <div className="my-8 w-full max-w-3xl rounded-2xl border border-[#1C2541]/60 bg-[#090E1A] shadow-2xl">
                        <div className="flex items-start justify-between border-b border-[#1C2541]/40 px-6 py-5">
                            <h2 className="text-lg font-black text-white">{memberModal.mode === 'create' ? 'Tambah' : 'Edit'} Anggota Pengurus</h2>
                            <button onClick={() => setMemberModal(null)} className="rounded-xl p-2 text-slate-400 hover:text-white hover:bg-[#1C2541]/60 transition"><X size={18} /></button>
                        </div>
                        <form onSubmit={submitMember} className="space-y-4 p-6">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div><label className={labelCls}>Periode</label><select value={memberForm.data.committee_period_id} onChange={e => memberForm.setData('committee_period_id', e.target.value)} className={inputCls}><option value="">Pilih periode</option>{committeePeriods.map(p => <option key={p.id} value={String(p.id)}>{p.name}</option>)}</select>{memberForm.errors.committee_period_id && <p className="mt-1 text-xs text-red-400">{memberForm.errors.committee_period_id}</p>}</div>
                                <div><label className={labelCls}>Nama Pengurus</label><input type="text" value={memberForm.data.name} onChange={e => memberForm.setData('name', e.target.value)} className={inputCls} placeholder="Nama lengkap" />{memberForm.errors.name && <p className="mt-1 text-xs text-red-400">{memberForm.errors.name}</p>}</div>
                                <div><label className={labelCls}>Jabatan</label><input type="text" value={memberForm.data.position} onChange={e => memberForm.setData('position', e.target.value)} className={inputCls} placeholder="Ketua RT / Sekretaris" /></div>
                                <div><label className={labelCls}>Kategori</label><select value={memberForm.data.category} onChange={e => memberForm.setData('category', e.target.value as MemberCategory)} className={inputCls}>{memberCategoryOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
                                <div><label className={labelCls}>WhatsApp</label><input type="text" value={memberForm.data.phone} onChange={e => memberForm.setData('phone', e.target.value)} className={inputCls} placeholder="+62..." /></div>
                                <div><label className={labelCls}>Email</label><input type="email" value={memberForm.data.email} onChange={e => memberForm.setData('email', e.target.value)} className={inputCls} placeholder="email@domain.com" /></div>
                                <div><label className={labelCls}>Urutan Tampil</label><input type="number" min={0} value={memberForm.data.sort_order} onChange={e => memberForm.setData('sort_order', e.target.value)} className={inputCls} /></div>
                                <div>
                                    <label className={labelCls}>Foto Pengurus</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={e => memberForm.setData('photo', e.currentTarget.files?.[0] ?? null)}
                                        className={inputCls + ' file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-500/15 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-emerald-300'}
                                    />
                                    <p className="mt-1 text-[10px] text-slate-500">Format: JPG, JPEG, PNG, atau WebP. Maks. 2 MB & maks. resolusi 2000x2000px.</p>
                                    {memberForm.errors.photo && <p className="mt-1 text-xs text-red-400">{memberForm.errors.photo}</p>}
                                </div>
                            </div>
                            <div><label className={labelCls}>Deskripsi Tugas</label><textarea rows={3} value={memberForm.data.description} onChange={e => memberForm.setData('description', e.target.value)} className={inputCls} /></div>
                            <label className="flex items-center gap-3 rounded-xl border border-[#1C2541]/60 bg-[#0B132B]/60 px-4 py-3 cursor-pointer">
                                <input type="checkbox" checked={memberForm.data.is_active} onChange={e => memberForm.setData('is_active', e.target.checked)} className="accent-emerald-500 w-4 h-4" />
                                <span className="text-sm font-semibold text-slate-300">Status anggota aktif</span>
                            </label>
                            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 border-t border-[#1C2541]/40 pt-4">
                                <button type="button" onClick={() => setMemberModal(null)} className="w-full sm:w-auto rounded-xl border border-[#1C2541]/60 px-4 py-2.5 text-sm text-slate-400 hover:text-white transition">Batal</button>
                                <button type="submit" disabled={memberForm.processing} className="w-full sm:w-auto rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-[#0B132B] hover:bg-emerald-400 transition disabled:opacity-60">{memberForm.processing ? 'Menyimpan...' : 'Simpan'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Emergency Contact Modal ── */}
            {contactModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                    <div className="w-full max-w-lg rounded-2xl border border-[#1C2541]/60 bg-[#090E1A] shadow-2xl">
                        <div className="flex items-start justify-between border-b border-[#1C2541]/40 px-6 py-5">
                            <h2 className="text-lg font-black text-white">{contactModal.mode === 'create' ? 'Tambah' : 'Edit'} Kontak Darurat</h2>
                            <button onClick={() => setContactModal(null)} className="rounded-xl p-2 text-slate-400 hover:text-white hover:bg-[#1C2541]/60 transition"><X size={18} /></button>
                        </div>
                        <form onSubmit={submitContact} className="space-y-4 p-6">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div><label className={labelCls}>Nama</label><input type="text" value={contactForm.name} onChange={e => setContactForm(p => ({ ...p, name: e.target.value }))} className={inputCls} placeholder="Ketua RT / Puskesmas..." required /></div>
                                <div><label className={labelCls}>No. Telepon / WA</label><input type="text" value={contactForm.phone} onChange={e => setContactForm(p => ({ ...p, phone: e.target.value }))} className={inputCls} placeholder="+62..." required /></div>
                                <div><label className={labelCls}>Peran / Jabatan</label><input type="text" value={contactForm.role} onChange={e => setContactForm(p => ({ ...p, role: e.target.value }))} className={inputCls} placeholder="Keamanan / Kesehatan..." /></div>
                                <div><label className={labelCls}>Urutan</label><input type="number" min={0} value={contactForm.sort_order} onChange={e => setContactForm(p => ({ ...p, sort_order: e.target.value }))} className={inputCls} /></div>
                            </div>
                            <div><label className={labelCls}>Keterangan</label><input type="text" value={contactForm.description} onChange={e => setContactForm(p => ({ ...p, description: e.target.value }))} className={inputCls} placeholder="Keterangan singkat..." /></div>
                            <label className="flex items-center gap-3 rounded-xl border border-[#1C2541]/60 bg-[#0B132B]/60 px-4 py-3 cursor-pointer">
                                <input type="checkbox" checked={contactForm.is_active} onChange={e => setContactForm(p => ({ ...p, is_active: e.target.checked }))} className="accent-emerald-500 w-4 h-4" />
                                <span className="text-sm font-semibold text-slate-300">Kontak aktif</span>
                            </label>
                            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 border-t border-[#1C2541]/40 pt-4">
                                <button type="button" onClick={() => setContactModal(null)} className="w-full sm:w-auto rounded-xl border border-[#1C2541]/60 px-4 py-2.5 text-sm text-slate-400 hover:text-white transition">Batal</button>
                                <button type="submit" disabled={contactProcessing} className="w-full sm:w-auto rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-[#0B132B] hover:bg-emerald-400 transition disabled:opacity-60">{contactProcessing ? 'Menyimpan...' : 'Simpan'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}

/* ── Member Group Card Component ── */
type AccentColor = 'emerald' | 'blue' | 'slate';

function MemberGroup({ title, members, accentColor, onEdit, onDelete }: {
    title: string; members: CommitteeMember[]; accentColor: AccentColor;
    onEdit: (m: CommitteeMember) => void; onDelete: (m: CommitteeMember) => void;
}) {
    const accentMap: Record<AccentColor, { header: string; badge: string; dot: string; avatar: string }> = {
        emerald: { header: 'border-emerald-500/20 bg-emerald-500/5', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', dot: 'bg-emerald-400', avatar: 'bg-emerald-500/15 border-emerald-500/20 text-emerald-300' },
        blue: { header: 'border-blue-500/20 bg-blue-500/5', badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30', dot: 'bg-blue-400', avatar: 'bg-blue-500/15 border-blue-500/20 text-blue-300' },
        slate: { header: 'border-[#1C2541]/60 bg-[#0B132B]/40', badge: 'bg-slate-500/20 text-slate-400 border-slate-500/30', dot: 'bg-slate-400', avatar: 'bg-slate-500/15 border-slate-500/20 text-slate-400' },
    };
    const acc = accentMap[accentColor];
    return (
        <div className="rounded-2xl border border-[#1C2541]/60 bg-[#0B132B]/60 overflow-hidden">
            <div className={`flex items-center justify-between border-b border-[#1C2541]/40 px-5 py-3 ${acc.header}`}>
                <div className="flex items-center gap-2"><span className={`inline-block w-2 h-2 rounded-full ${acc.dot}`} /><span className="text-sm font-bold text-white">{title}</span></div>
                <span className={`inline-flex rounded-lg border px-2.5 py-0.5 text-[10px] font-bold ${acc.badge}`}>{members.length} orang</span>
            </div>
            <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {members.map(member => (
                    <div key={member.id} className="group flex flex-col items-center rounded-xl border border-[#1C2541]/40 bg-[#111A2E]/60 p-4 text-center hover:border-emerald-500/20 transition">
                        {member.photo_url ? (
                            <img src={member.photo_url} alt={member.name} className="mb-3 h-16 w-16 rounded-2xl object-cover border-2 border-[#1C2541]/60 group-hover:border-emerald-500/30 transition" />
                        ) : (
                            <div className={`mb-3 flex h-16 w-16 items-center justify-center rounded-2xl border-2 text-xl font-black ${acc.avatar}`}>{getInitials(member.name)}</div>
                        )}
                        <p className="text-sm font-bold text-white leading-tight">{member.name}</p>
                        <p className="mt-0.5 text-xs text-slate-400">{member.position}</p>
                        {member.phone && <p className="mt-1 flex items-center gap-1 text-[10px] text-slate-500"><Phone size={9} />{member.phone}</p>}
                        <div className="mt-3 flex gap-2 opacity-0 group-hover:opacity-100 transition">
                            <button onClick={() => onEdit(member)} className="rounded-lg border border-[#1C2541]/60 px-3 py-1 text-[10px] font-bold text-slate-400 hover:text-white transition">Edit</button>
                            <button onClick={() => onDelete(member)} className="rounded-lg border border-red-500/30 px-3 py-1 text-[10px] font-bold text-red-400 hover:bg-red-500/10 transition">Hapus</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}