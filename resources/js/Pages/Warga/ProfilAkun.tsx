import WargaLayout, { WargaProfile } from '@/Layouts/WargaLayout';
import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    CheckCircle,
    ChevronRight,
    Eye,
    EyeOff,
    Info,
    Lock,
    LogOut,
    Phone,
    Shield,
    User,
    Camera,
    Trash2,
    Check,
    AlertTriangle,
    X,
    LockKeyhole,
    MapPin,
    AlertCircle,
    Mail
} from 'lucide-react';
import { useState, useRef, useEffect, FormEvent, ChangeEvent } from 'react';

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
};

type Props = {
    profile?: WargaProfile;
    kartuKeluarga?: KartuKeluarga | null;
    anggotaKeluarga?: AnggotaKeluarga[];
};

const fallbackProfile: WargaProfile = {
    name: 'Warga',
    initials: 'WG',
    houseNumber: '-',
    hasLinkedWarga: false,
};

const inputCls = 'w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-emerald-500 focus:outline-none transition disabled:opacity-60 disabled:bg-slate-100';
const labelCls = 'mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600';

export default function ProfilAkun({
    profile = fallbackProfile,
    kartuKeluarga = null,
    anggotaKeluarga = [],
}: Props) {
    const safeProfile = profile ?? fallbackProfile;
    const fileInputRef = useRef<HTMLInputElement>(null);

    /* ── State Edit Profil ── */
    const [isEditing, setIsEditing] = useState(false);
    const [emailForm, setEmailForm] = useState(safeProfile.email || '');
    const [phoneForm, setPhoneForm] = useState(safeProfile.phone || '');
    const [processing, setProcessing] = useState(false);

    /* ── State Ganti Password ── */
    const [openChangePassword, setOpenChangePassword] = useState(false);
    const [showCurrentPw, setShowCurrentPw] = useState(false);
    const [showNewPw, setShowNewPw] = useState(false);
    const [showConfirmPw, setShowConfirmPw] = useState(false);
    const [passwordForm, setPasswordForm] = useState({
        current_password: '',
        new_password: '',
        new_password_confirmation: '',
    });
    const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
    const [processingPassword, setProcessingPassword] = useState(false);

    /* ── State Hubungi Sekretariat RT ── */
    const [showSekretariatModal, setShowSekretariatModal] = useState(false);

    // Sync input values if profile prop updates
    useEffect(() => {
        setEmailForm(safeProfile.email || '');
        setPhoneForm(safeProfile.phone || '');
    }, [safeProfile]);

    const handleLogout = () => {
        router.post('/logout');
    };

    const handleEditToggle = () => {
        if (isEditing) {
            // Cancel clicked, reset forms
            setEmailForm(safeProfile.email || '');
            setPhoneForm(safeProfile.phone || '');
            setIsEditing(false);
        } else {
            setIsEditing(true);
        }
    };

    const submitProfile = () => {
        const payload = new FormData();
        payload.append('_method', 'patch');
        payload.append('email', emailForm);
        payload.append('phone', phoneForm || '');
        setProcessing(true);
        router.post('/warga/profil', payload, {
            onSuccess: () => setIsEditing(false),
            onFinish: () => setProcessing(false),
        });
    };

    const handlePhotoUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const payload = new FormData();
        payload.append('_method', 'patch');
        payload.append('photo', file);
        setProcessing(true);
        router.post('/warga/profil', payload, {
            onFinish: () => setProcessing(false),
        });
    };

    const handlePhotoDelete = () => {
        if (!confirm('Apakah Anda yakin ingin menghapus foto profil?')) return;
        const payload = new FormData();
        payload.append('_method', 'patch');
        payload.append('delete_photo', '1');
        setProcessing(true);
        router.post('/warga/profil', payload, {
            onFinish: () => setProcessing(false),
        });
    };

    const submitPassword = (e: FormEvent) => {
        e.preventDefault();
        setPasswordErrors({});
        setProcessingPassword(true);
        router.put('/password', passwordForm, {
            onSuccess: () => {
                setPasswordForm({ current_password: '', new_password: '', new_password_confirmation: '' });
                setOpenChangePassword(false);
            },
            onError: (errors) => setPasswordErrors(errors as Record<string, string>),
            onFinish: () => setProcessingPassword(false),
        });
    };

    return (
        <WargaLayout profile={safeProfile} title="Profil Akun">
            <Head title="Pengaturan Profil" />

            <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 lg:px-8 lg:py-8">
                {/* Header Title */}
                <div className="flex items-center gap-3">
                    <Link href="/warga/dashboard" className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-500 hover:text-slate-900 transition shadow-sm">
                        <ArrowLeft size={18} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight lg:text-3xl">Pengaturan Profil</h1>
                        <p className="text-xs text-slate-600 mt-1">Ubah informasi akun dan kelola keamanan sandi</p>
                    </div>
                </div>

                {!safeProfile.hasLinkedWarga && (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-semibold text-amber-800 flex items-center gap-2">
                        <AlertCircle size={16} />
                        Akun Anda belum terhubung dengan data warga. Hubungi Sekretariat RT.
                    </div>
                )}

                {/* 2-Column Split Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    
                    {/* Left Column: Profile Card */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col items-center text-center relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl"></div>
                            
                            {/* Round Avatar Container */}
                            <div className="relative mb-5">
                                <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-4 border-slate-200 bg-emerald-50 shadow-md">
                                    {safeProfile.profilePhotoUrl ? (
                                        <img
                                            src={safeProfile.profilePhotoUrl}
                                            alt={safeProfile.name}
                                            className="h-full w-full object-cover object-center"
                                        />
                                    ) : (
                                        <span className="text-3xl font-black text-emerald-700">{safeProfile.initials}</span>
                                    )}
                                </div>
                                <div className="absolute -bottom-1 -right-1 p-2 rounded-full bg-emerald-600 text-white border-4 border-white shadow">
                                    <Camera size={14} className="stroke-[2.5]" />
                                </div>
                            </div>

                            <h2 className="text-lg font-black text-slate-900 tracking-tight">{safeProfile.name}</h2>
                            <p className="text-xs text-slate-600 mt-1 leading-normal">
                                Blok {safeProfile.houseNumber || '-'}, Perumahan Asri Jaya
                            </p>

                            {/* Verification Badge */}
                            <div className="mt-4">
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 text-[10px] font-bold uppercase tracking-wider">
                                    <CheckCircle size={11} /> Warga Terverifikasi
                                </span>
                            </div>

                            {/* Photo Action Buttons */}
                            <div className="mt-6 flex items-center justify-center gap-2 w-full pt-4 border-t border-slate-100">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handlePhotoChange}
                                    className="hidden"
                                />
                                <button
                                    type="button"
                                    onClick={handlePhotoUploadClick}
                                    disabled={processing}
                                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-700 py-2.5 transition active:scale-98"
                                >
                                    Ubah Foto
                                </button>
                                <button
                                    type="button"
                                    onClick={handlePhotoDelete}
                                    className="rounded-xl border border-slate-200 hover:border-red-200 bg-slate-50 hover:bg-red-50 p-2.5 text-slate-500 hover:text-red-600 transition"
                                    title="Hapus Foto Profil"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Logout card link */}
                        <button
                            type="button"
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 hover:bg-red-100 p-3.5 text-xs font-bold text-red-700 transition"
                        >
                            <LogOut size={14} /> Keluar dari Akun
                        </button>
                    </div>

                    {/* Right Column: Profile Info & Safety */}
                    <div className="lg:col-span-3 space-y-6">
                        
                        {/* Informasi Pribadi */}
                        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                <div className="flex items-center gap-2">
                                    <User size={18} className="text-emerald-700" />
                                    <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Informasi Pribadi</h2>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleEditToggle}
                                    className="rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 px-3.5 py-1.5 text-xs font-bold text-emerald-700 transition"
                                >
                                    {isEditing ? 'Batal' : 'Ubah Data'}
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Nama Lengkap (Read-only) */}
                                    <div>
                                        <label className={labelCls}>Nama Lengkap</label>
                                        <input
                                            disabled
                                            value={safeProfile.name}
                                            className={inputCls}
                                        />
                                    </div>

                                    {/* Email */}
                                    <div>
                                        <label className={labelCls}>Alamat Email</label>
                                        <input
                                            type="email"
                                            disabled={!isEditing}
                                            value={emailForm}
                                            onChange={(e) => setEmailForm(e.target.value)}
                                            className={inputCls}
                                        />
                                    </div>

                                    {/* Nomor Telepon */}
                                    <div>
                                        <label className={labelCls}>Nomor Telepon</label>
                                        <input
                                            type="tel"
                                            disabled={!isEditing}
                                            value={phoneForm}
                                            onChange={(e) => setPhoneForm(e.target.value)}
                                            className={inputCls}
                                        />
                                    </div>

                                    {/* NIK (Read-only) */}
                                    <div>
                                        <label className={labelCls}>Nomor KTP (NIK)</label>
                                        <input
                                            disabled
                                            value={safeProfile.nik || '3275010022334455'}
                                            className={inputCls}
                                        />
                                    </div>
                                </div>

                                {/* Alamat Lengkap (Read-only) */}
                                <div>
                                    <label className={labelCls}>Alamat Lengkap</label>
                                    <textarea
                                        disabled
                                        rows={3}
                                        value={safeProfile.address || 'Jl. Melati No. 45, Blok A-12, Perumahan Asri Jaya, Kelurahan Indah, Kota Makmur'}
                                        className={inputCls}
                                    />
                                </div>

                                {isEditing && (
                                    <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                                        <button
                                            type="button"
                                            onClick={handleEditToggle}
                                            className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                                        >
                                            Batal
                                        </button>
                                        <button
                                            type="button"
                                            disabled={processing}
                                            onClick={submitProfile}
                                            className="rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-xs font-black text-white uppercase tracking-wider transition"
                                        >
                                            {processing ? 'Menyimpan...' : 'Simpan'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Keamanan Akun */}
                        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                                <Shield size={18} className="text-emerald-700" />
                                <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Keamanan Akun</h2>
                            </div>

                            <button
                                type="button"
                                onClick={() => setOpenChangePassword(true)}
                                className="w-full flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4 hover:border-emerald-500/40 transition group text-left"
                            >
                                <div className="flex items-center gap-3 min-w-0 pr-2">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
                                        <LockKeyhole size={18} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold text-slate-900">Ubah Kata Sandi</p>
                                        <p className="text-[10px] text-slate-500 mt-0.5">Terakhir diubah 3 bulan yang lalu</p>
                                    </div>
                                </div>
                                <ChevronRight size={16} className="text-slate-400 group-hover:text-slate-700 transition shrink-0" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Warning Banner at Bottom */}
                <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-start gap-4 text-left">
                        <div className="p-3 rounded-2xl bg-amber-100 text-amber-800 border border-amber-200 shrink-0">
                            <AlertTriangle size={20} />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-xs font-black text-amber-900 uppercase tracking-wider">Peringatan Penting</h3>
                            <p className="text-[11px] text-slate-700 leading-relaxed max-w-2xl">
                                Untuk mengubah data resmi (Nama Lengkap, NIK, atau Alamat), harap hubungi Sekretariat RT secara langsung atau melalui layanan pengajuan surat untuk verifikasi data resmi.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => window.dispatchEvent(new CustomEvent('open-helpdesk-ticket'))}
                        className="w-full md:w-auto shrink-0 rounded-2xl border border-amber-300 bg-white hover:bg-amber-100 px-4 py-2.5 text-xs font-bold text-amber-900 transition whitespace-nowrap shadow-sm"
                    >
                        Hubungi Sekretariat
                    </button>
                </div>
            </div>

            {/* Modal: Ganti Password */}
            {openChangePassword && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
                    <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl flex flex-col">
                        
                        {/* Modal Header */}
                        <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4 z-10">
                            <div>
                                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Ubah Kata Sandi</h3>
                                <p className="text-[10px] text-slate-500 mt-0.5">Perbarui kredensial keamanan akun</p>
                            </div>
                            <button 
                                type="button" 
                                onClick={() => setOpenChangePassword(false)} 
                                className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Modal Form */}
                        <form onSubmit={submitPassword} className="p-6 space-y-4">
                            {/* Current Password */}
                            <div>
                                <label className={labelCls}>Kata Sandi Saat Ini</label>
                                <div className="relative">
                                    <input
                                        required
                                        type={showCurrentPw ? 'text' : 'password'}
                                        value={passwordForm.current_password}
                                        onChange={(e) => setPasswordForm((p) => ({ ...p, current_password: e.target.value }))}
                                        className={inputCls}
                                        placeholder="Masukkan kata sandi lama Anda"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowCurrentPw((v) => !v)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition"
                                    >
                                        {showCurrentPw ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                                {passwordErrors.current_password && (
                                    <p className="mt-1 text-xs text-red-600 font-medium">{passwordErrors.current_password}</p>
                                )}
                            </div>

                            {/* New Password */}
                            <div>
                                <label className={labelCls}>Kata Sandi Baru</label>
                                <div className="relative">
                                    <input
                                        required
                                        type={showNewPw ? 'text' : 'password'}
                                        value={passwordForm.new_password}
                                        onChange={(e) => setPasswordForm((p) => ({ ...p, new_password: e.target.value }))}
                                        className={inputCls}
                                        placeholder="Minimal 8 karakter"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPw((v) => !v)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition"
                                    >
                                        {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                                {passwordErrors.new_password && (
                                    <p className="mt-1 text-xs text-red-600 font-medium">{passwordErrors.new_password}</p>
                                )}
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label className={labelCls}>Konfirmasi Kata Sandi Baru</label>
                                <div className="relative">
                                    <input
                                        required
                                        type={showConfirmPw ? 'text' : 'password'}
                                        value={passwordForm.new_password_confirmation}
                                        onChange={(e) => setPasswordForm((p) => ({ ...p, new_password_confirmation: e.target.value }))}
                                        className={inputCls}
                                        placeholder="Ulangi kata sandi baru"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPw((v) => !v)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition"
                                    >
                                        {showConfirmPw ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-3 border-t border-slate-200 pt-4 mt-6">
                                <button 
                                    type="button" 
                                    onClick={() => setOpenChangePassword(false)} 
                                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
                                >
                                    Batal
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={processingPassword} 
                                    className="rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2.5 text-xs font-black text-white uppercase tracking-wider transition disabled:opacity-50"
                                >
                                    {processingPassword ? 'Menyimpan...' : 'Ubah Sandi'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Hubungi Sekretariat RT */}
            {showSekretariatModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
                    <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl flex flex-col">
                        
                        {/* Modal Header */}
                        <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4 z-10">
                            <div>
                                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Kontak Sekretariat RT</h3>
                                <p className="text-[10px] text-slate-500 mt-0.5">Detail kontak pengurus RT aktif</p>
                            </div>
                            <button 
                                type="button" 
                                onClick={() => setShowSekretariatModal(false)} 
                                className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Modal Details */}
                        <div className="p-6 space-y-4">
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-4 text-xs">
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Ketua RT</p>
                                    <p className="text-sm font-black text-slate-900 mt-1">Andi Wijaya</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                                        <Phone size={15} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">No. Telepon / WhatsApp</p>
                                        <p className="font-bold text-slate-800 mt-0.5">+62 812-3456-7890</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
                                        <MapPin size={15} className="mt-0.5" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Alamat Sekretariat</p>
                                        <p className="font-bold text-slate-800 mt-0.5 leading-relaxed">
                                            Jl. Melati Raya No. 45, Komplek Asri Jaya, RT 04 / RW 02
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Direct Call to Action */}
                            <a
                                href="https://wa.me/6281234567890"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 text-xs font-black uppercase tracking-wider transition shadow-sm"
                            >
                                Kirim Pesan WhatsApp
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </WargaLayout>
    );
}