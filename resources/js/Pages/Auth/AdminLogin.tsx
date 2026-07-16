import { FormEventHandler, useState } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';

type LoginProps = {
    status?: string;
    canResetPassword: boolean;
};

type LoginForm = {
    email: string;
    password: string;
    remember: boolean;
};

export default function AdminLogin({ status, canResetPassword }: LoginProps) {
    const { rtSettings } = usePage().props as any;
    const [showPassword, setShowPassword] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm<LoginForm>({
        email: '',
        password: '',
        remember: false,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('login.admin'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <>
            <Head title="Masuk Portal Admin" />

            <div className="min-h-screen bg-[#090b14] text-slate-100 selection:bg-emerald-400/30 md:flex">
                <section
                    className="relative hidden overflow-hidden p-10 md:flex md:w-1/2 lg:w-3/5 flex-col justify-between"
                    style={{
                        background:
                            'radial-gradient(circle at top left, #120e2e 0%, #0c0b16 48%, #08070e 100%)',
                    }}
                >
                    <div
                        className="absolute inset-0 opacity-45"
                        style={{
                            backgroundImage:
                                'radial-gradient(rgba(139, 92, 246, 0.12) 1px, transparent 1px)',
                            backgroundSize: '32px 32px',
                        }}
                    />

                    <div className="relative z-10 flex items-center gap-3">
                        {rtSettings?.logoUrl ? (
                            <img src={rtSettings.logoUrl} alt={rtSettings.siteName} className="h-11 w-11 rounded-2xl object-cover" />
                        ) : (
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500 shadow-lg shadow-indigo-500/20">
                                <HomeIcon className="h-6 w-6 text-indigo-950" />
                            </div>
                        )}

                        <div>
                            <p className="text-xl font-bold tracking-tight text-indigo-100">
                                {rtSettings?.siteName || 'SMART-RT 004'}
                            </p>
                            <p className="text-xs font-medium uppercase tracking-[0.3em] text-indigo-300/80">
                                Portal Administrasi {rtSettings?.rtName || 'RT'}
                            </p>
                        </div>
                    </div>

                    <div className="relative z-10 max-w-xl">
                        <div className="mb-6 inline-flex rounded-full border border-indigo-300/20 bg-indigo-300/10 px-4 py-2 text-sm font-semibold text-indigo-100 backdrop-blur">
                            Sistem Pengelolaan Administrasi Utama
                        </div>

                        <h1 className="mb-5 text-5xl font-bold leading-tight tracking-tight text-indigo-50">
                            Dashboard Kendali Sistem SMART-RT
                        </h1>

                        <p className="mb-12 text-lg leading-8 text-slate-300">
                            Halaman otentikasi khusus untuk administrator dan pengurus RT. Kelola persetujuan surat, aduan warga, keuangan, serta inventaris secara aman dan tersentralisasi.
                        </p>

                        <div className="grid grid-cols-1 gap-4">
                            <FeatureCard
                                icon={<UsersIcon className="h-6 w-6" />}
                                title="Verifikasi Data Warga"
                                description="Setujui permohonan perubahan data dan pembuatan akun."
                                color="indigo"
                            />

                            <FeatureCard
                                icon={<CalendarIcon className="h-6 w-6" />}
                                title="Atur Kegiatan & Keuangan"
                                description="Kelola pengeluaran, iuran bulanan, serta pengumuman warga."
                                color="purple"
                            />

                            <FeatureCard
                                icon={<DocumentIcon className="h-6 w-6" />}
                                title="Proses Pengajuan Surat"
                                description="Tinjau, tanda tangani, dan publikasikan dokumen warga secara daring."
                                color="pink"
                            />
                        </div>
                    </div>

                    <p className="relative z-10 text-xs text-slate-500">
                        © 2024 RT 004. Pusat Kontrol Area Admin.
                    </p>

                    <div className="absolute -right-20 bottom-0 h-96 w-96 rounded-full bg-indigo-500/10 blur-[100px]" />
                    <div className="absolute -left-20 top-1/2 h-64 w-64 rounded-full bg-purple-500/10 blur-[80px]" />
                </section>

                <main className="flex min-h-screen w-full items-center justify-center px-5 py-10 md:w-1/2 lg:w-2/5">
                    <div className="w-full max-w-md">
                        <div className="mb-10 flex items-center gap-3 md:hidden">
                            {rtSettings?.logoUrl ? (
                                <img src={rtSettings.logoUrl} alt={rtSettings.siteName} className="h-10 w-10 rounded-2xl object-cover" />
                            ) : (
                                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500">
                                    <HomeIcon className="h-5 w-5 text-indigo-950" />
                                </div>
                            )}

                            <div>
                                <p className="text-lg font-bold text-indigo-100">{rtSettings?.siteName || 'SMART-RT'}</p>
                                <p className="text-xs text-slate-400">Admin Control Center</p>
                            </div>
                        </div>

                        <div className="mb-8 text-center md:text-left">
                            <h2 className="mb-3 text-3xl font-bold tracking-tight text-white">
                                Login Administrator
                            </h2>
                            <p className="text-sm leading-6 text-slate-400">
                                Silakan masuk menggunakan kredensial administrator terdaftar.
                            </p>
                        </div>

                        {status && (
                            <div className="mb-5 rounded-2xl border border-indigo-400/20 bg-indigo-400/10 px-4 py-3 text-sm font-medium text-indigo-200">
                                {status}
                            </div>
                        )}

                        <div className="rounded-2xl sm:rounded-[32px] border border-white/10 bg-[#141525] p-6 sm:p-8 shadow-2xl shadow-black/30">
                            <form onSubmit={submit} className="space-y-6">
                                <div>
                                    <label
                                        htmlFor="email"
                                        className="mb-2 ml-1 block text-sm font-semibold text-slate-300"
                                    >
                                        Email Administrator
                                    </label>

                                    <div className="group relative">
                                        <MailIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500 transition group-focus-within:text-indigo-400" />

                                        <input
                                            id="email"
                                            type="email"
                                            name="email"
                                            value={data.email}
                                            className="h-14 w-full rounded-2xl border border-white/10 bg-[#1e1f37] pl-12 pr-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-indigo-450 focus:ring-4 focus:ring-indigo-500/10"
                                            placeholder="admin@email.com"
                                            autoComplete="username"
                                            onChange={(e) => setData('email', e.target.value)}
                                        />
                                    </div>

                                    {errors.email && (
                                        <p className="mt-2 text-sm text-red-300">{errors.email}</p>
                                    )}
                                </div>

                                <div>
                                    <div className="mb-2 flex items-center justify-between px-1">
                                        <label
                                            htmlFor="password"
                                            className="text-sm font-semibold text-slate-300"
                                        >
                                            Kata Sandi
                                        </label>

                                        {canResetPassword && (
                                            <Link
                                                href={route('password.request')}
                                                className="text-sm font-semibold text-indigo-300 transition hover:text-indigo-200 hover:underline"
                                            >
                                                Lupa kata sandi?
                                            </Link>
                                        )}
                                    </div>

                                    <div className="group relative">
                                        <LockIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500 transition group-focus-within:text-indigo-400" />

                                        <input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            name="password"
                                            value={data.password}
                                            className="h-14 w-full rounded-2xl border border-white/10 bg-[#1e1f37] pl-12 pr-12 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-indigo-450 focus:ring-4 focus:ring-indigo-500/10"
                                            placeholder="••••••••"
                                            autoComplete="current-password"
                                            onChange={(e) => setData('password', e.target.value)}
                                        />

                                        <button
                                            type="button"
                                            onClick={() => setShowPassword((value) => !value)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-200"
                                            aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                                        >
                                            {showPassword ? (
                                                <EyeOffIcon className="h-5 w-5" />
                                            ) : (
                                                <EyeIcon className="h-5 w-5" />
                                            )}
                                        </button>
                                    </div>

                                    {errors.password && (
                                        <p className="mt-2 text-sm text-red-300">{errors.password}</p>
                                    )}
                                </div>

                                <label className="flex cursor-pointer items-center gap-3 px-1">
                                    <input
                                        type="checkbox"
                                        name="remember"
                                        checked={data.remember}
                                        onChange={(e) => setData('remember', e.target.checked)}
                                        className="h-5 w-5 rounded-md border-white/10 bg-[#1e1f37] text-indigo-500 focus:ring-indigo-400/20"
                                    />

                                    <span className="select-none text-sm text-slate-300">
                                        Ingat saya di perangkat ini
                                    </span>
                                </label>

                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-indigo-500 text-base font-bold text-white shadow-lg shadow-indigo-550/15 transition hover:bg-indigo-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
                                >
                                    {processing && (
                                        <span className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-950/30 border-t-white" />
                                    )}

                                    <span>{processing ? 'Memproses...' : 'Masuk ke Panel Kontrol'}</span>
                                </button>
                            </form>

                            <div className="relative my-8">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-white/10" />
                                </div>

                                <div className="relative flex justify-center">
                                    <span className="bg-[#141525] px-4 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                                        Kembali
                                    </span>
                                </div>
                            </div>

                            <p className="text-center text-sm text-slate-400">
                                Bukan Administrator?{' '}
                                <Link
                                    href={route('login')}
                                    className="font-bold text-indigo-300 transition hover:text-indigo-200 hover:underline"
                                >
                                    Masuk Portal Warga
                                </Link>
                            </p>
                        </div>

                        <div className="mt-8 flex justify-center gap-4 opacity-60 transition hover:opacity-90">
                            <div className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-xs text-slate-300">
                                <PhoneIcon className="h-4 w-4" />
                                <span>Siap Seluler</span>
                            </div>

                            <div className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-xs text-slate-300">
                                <ShieldIcon className="h-4 w-4" />
                                <span>Akses Aman</span>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
}

function FeatureCard({
    icon,
    title,
    description,
    color,
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
    color: 'indigo' | 'purple' | 'pink';
}) {
    const colorClass = {
        indigo: 'bg-indigo-400/10 text-indigo-350',
        purple: 'bg-purple-400/10 text-purple-350',
        pink: 'bg-pink-400/10 text-pink-350',
    }[color];

    return (
        <div className="flex items-center gap-4 rounded-2xl border border-indigo-300/10 bg-[#141525]/75 p-6 backdrop-blur transition duration-300 hover:translate-x-2">
            <div className={`flex h-12 w-12 items-center justify-center rounded-full ${colorClass}`}>
                {icon}
            </div>

            <div>
                <h3 className="text-lg font-bold text-white">{title}</h3>
                <p className="text-sm text-slate-450">{description}</p>
            </div>
        </div>
    );
}

function HomeIcon({ className = '' }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
            <path d="M3 11.5L12 4l9 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M5.5 10.5V20h13v-9.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M9.5 20v-6h5v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function UsersIcon({ className = '' }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
            <path d="M16 11a4 4 0 1 0-8 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M4 20a8 8 0 0 1 16 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M19 9.5a3 3 0 0 1 2 2.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M3 12.3a3 3 0 0 1 2-2.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );
}

function CalendarIcon({ className = '' }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
            <path d="M7 3v3M17 3v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M4 8h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        </svg>
    );
}

function DocumentIcon({ className = '' }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
            <path d="M7 3h7l4 4v14H7V3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            <path d="M14 3v5h5M9 13h6M9 17h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function MailIcon({ className = '' }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
            <path d="M4 6h16v12H4V6Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            <path d="m4 7 8 6 8-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function LockIcon({ className = '' }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
            <path d="M7 11V8a5 5 0 0 1 10 0v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M6 11h12v10H6V11Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        </svg>
    );
}

function EyeIcon({ className = '' }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
            <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" stroke="currentColor" strokeWidth="2" />
        </svg>
    );
}

function EyeOffIcon({ className = '' }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
            <path d="M3 3l18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M10.6 10.6A2 2 0 0 0 12 14a2 2 0 0 0 1.4-.6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M9.9 5.3A10.8 10.8 0 0 1 12 5c6.5 0 10 7 10 7a17.8 17.8 0 0 1-3 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M6.2 6.8C3.5 8.7 2 12 2 12s3.5 7 10 7c1.4 0 2.6-.3 3.7-.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );
}

function PhoneIcon({ className = '' }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
            <path d="M8 2h8a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="2" />
            <path d="M11 18h2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );
}

function ShieldIcon({ className = '' }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
            <path d="M12 3 20 6v6c0 5-3.4 8-8 9-4.6-1-8-4-8-9V6l8-3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            <path d="m9 12 2 2 4-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}
