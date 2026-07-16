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

export default function Login({ status, canResetPassword }: LoginProps) {
    const { rtSettings } = usePage().props as any;
    const [showPassword, setShowPassword] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm<LoginForm>({
        email: '',
        password: '',
        remember: false,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <>
            <Head title="Masuk Portal Warga" />

            <div className="min-h-screen bg-[#060e20] text-slate-100 selection:bg-emerald-400/30 md:flex">
                <section
                    className="relative hidden overflow-hidden p-10 md:flex md:w-1/2 lg:w-3/5 flex-col justify-between"
                    style={{
                        background:
                            'radial-gradient(circle at top left, #006c49 0%, #0b1326 48%, #060e20 100%)',
                    }}
                >
                    <div
                        className="absolute inset-0 opacity-40"
                        style={{
                            backgroundImage:
                                'radial-gradient(rgba(78, 222, 163, 0.12) 1px, transparent 1px)',
                            backgroundSize: '32px 32px',
                        }}
                    />

                    <div className="relative z-10 flex items-center gap-3">
                        {rtSettings?.logoUrl ? (
                            <img src={rtSettings.logoUrl} alt={rtSettings.siteName} className="h-11 w-11 rounded-2xl object-cover" />
                        ) : (
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-400 shadow-lg shadow-emerald-400/20">
                                <HomeIcon className="h-6 w-6 text-[#003824]" />
                            </div>
                        )}

                        <div>
                            <p className="text-xl font-bold tracking-tight text-emerald-100">
                                {rtSettings?.siteName || 'SMART-RT 004'}
                            </p>
                            <p className="text-xs font-medium uppercase tracking-[0.3em] text-emerald-300/80">
                                {rtSettings?.kelurahan || 'Kelurahan Bahagia'} {rtSettings?.kota || 'Bekasi'}
                            </p>
                        </div>
                    </div>

                    <div className="relative z-10 max-w-xl">
                        <div className="mb-6 inline-flex rounded-full border border-emerald-300/20 bg-emerald-300/10 px-4 py-2 text-sm font-semibold text-emerald-100 backdrop-blur">
                            Sistem Informasi Layanan Warga
                        </div>

                        <h1 className="mb-5 text-5xl font-bold leading-tight tracking-tight text-emerald-50">
                            Solusi Cerdas Lingkungan Bahagia
                        </h1>

                        <p className="mb-12 text-lg leading-8 text-slate-300">
                            Layanan digital warga dalam satu sistem untuk mewujudkan tata kelola lingkungan yang transparan,
                            modern, dan mudah diakses.
                        </p>

                        <div className="grid grid-cols-1 gap-4">
                            <FeatureCard
                                icon={<UsersIcon className="h-6 w-6" />}
                                title="Kelola data warga"
                                description="Data kependudukan terintegrasi and aman."
                                color="emerald"
                            />

                            <FeatureCard
                                icon={<CalendarIcon className="h-6 w-6" />}
                                title="Pantau kegiatan RT"
                                description="Informasi rapat dan kerja bakti lebih tertata."
                                color="cyan"
                            />

                            <FeatureCard
                                icon={<DocumentIcon className="h-6 w-6" />}
                                title="Administrasi lebih mudah"
                                description="Pengajuan dan layanan warga dalam satu sistem."
                                color="amber"
                            />
                        </div>
                    </div>

                    <p className="relative z-10 text-xs text-slate-400">
                        © 2024 RT 004. Digital Neighborhood Management System.
                    </p>

                    <div className="absolute -right-20 bottom-0 h-96 w-96 rounded-full bg-emerald-400/10 blur-[100px]" />
                    <div className="absolute -left-20 top-1/2 h-64 w-64 rounded-full bg-cyan-400/10 blur-[80px]" />
                </section>

                <main className="flex min-h-screen w-full items-center justify-center px-5 py-10 md:w-1/2 lg:w-2/5">
                    <div className="w-full max-w-md">
                        <div className="mb-10 flex items-center gap-3 md:hidden">
                            {rtSettings?.logoUrl ? (
                                <img src={rtSettings.logoUrl} alt={rtSettings.siteName} className="h-10 w-10 rounded-2xl object-cover" />
                            ) : (
                                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-400">
                                    <HomeIcon className="h-5 w-5 text-[#003824]" />
                                </div>
                            )}

                            <div>
                                <p className="text-lg font-bold text-emerald-100">{rtSettings?.siteName || 'SMART-RT'}</p>
                                <p className="text-xs text-slate-400">{rtSettings?.rtName || 'Layanan Digital Warga'}</p>
                            </div>
                        </div>

                        <div className="mb-8 text-center md:text-left">
                            <h2 className="mb-3 text-3xl font-bold tracking-tight text-white">
                                Selamat Datang Kembali
                            </h2>
                            <p className="text-sm leading-6 text-slate-400">
                                Masuk ke akun Anda untuk melanjutkan akses layanan digital RT.
                            </p>
                        </div>

                        {status && (
                            <div className="mb-5 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm font-medium text-emerald-200">
                                {status}
                            </div>
                        )}

                        <div className="rounded-2xl sm:rounded-[32px] border border-white/10 bg-[#171f33] p-6 sm:p-8 shadow-2xl shadow-black/30">
                            <form onSubmit={submit} className="space-y-6">
                                <div>
                                    <label
                                        htmlFor="email"
                                        className="mb-2 ml-1 block text-sm font-semibold text-slate-300"
                                    >
                                        Alamat Email
                                    </label>

                                    <div className="group relative">
                                        <MailIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500 transition group-focus-within:text-emerald-300" />

                                        <input
                                            id="email"
                                            type="email"
                                            name="email"
                                            value={data.email}
                                            className="h-14 w-full rounded-2xl border border-white/10 bg-[#222a3d] pl-12 pr-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-300/10"
                                            placeholder="nama@email.com"
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
                                                className="text-sm font-semibold text-emerald-300 transition hover:text-emerald-200 hover:underline"
                                            >
                                                Lupa kata sandi?
                                            </Link>
                                        )}
                                    </div>

                                    <div className="group relative">
                                        <LockIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500 transition group-focus-within:text-emerald-300" />

                                        <input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            name="password"
                                            value={data.password}
                                            className="h-14 w-full rounded-2xl border border-white/10 bg-[#222a3d] pl-12 pr-12 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-300/10"
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
                                        className="h-5 w-5 rounded-md border-white/10 bg-[#222a3d] text-emerald-400 focus:ring-emerald-300/20"
                                    />

                                    <span className="select-none text-sm text-slate-300">
                                        Ingat saya di perangkat ini
                                    </span>
                                </label>

                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-400 text-base font-bold text-[#003824] shadow-lg shadow-emerald-400/10 transition hover:bg-emerald-300 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
                                >
                                    {processing && (
                                        <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#003824]/30 border-t-[#003824]" />
                                    )}

                                    <span>{processing ? 'Memproses...' : 'Masuk'}</span>
                                </button>
                            </form>

                            <div className="relative my-8">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-white/10" />
                                </div>

                                <div className="relative flex justify-center">
                                    <span className="bg-[#171f33] px-4 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                                        Atau
                                    </span>
                                </div>
                            </div>

                            <p className="text-center text-sm text-slate-400">
                                Belum punya akun? Daftar gratis untuk warga setempat{' '}
                                <a
                                    href="https://wa.me/6282210176042?text=Halo%20Sekretariat%20RT%2C%20saya%20ingin%20mendaftar%20akun%20SMART-RT."
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-bold text-emerald-300 transition hover:text-emerald-200 hover:underline"
                                >
                                    Hubungi Sekretariat RT
                                </a>
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
    color: 'emerald' | 'cyan' | 'amber';
}) {
    const colorClass = {
        emerald: 'bg-emerald-400/10 text-emerald-300',
        cyan: 'bg-cyan-400/10 text-cyan-300',
        amber: 'bg-amber-400/10 text-amber-300',
    }[color];

    return (
        <div className="flex items-center gap-4 rounded-2xl border border-emerald-300/10 bg-[#171f33]/70 p-6 backdrop-blur transition duration-300 hover:translate-x-2">
            <div className={`flex h-12 w-12 items-center justify-center rounded-full ${colorClass}`}>
                {icon}
            </div>

            <div>
                <h3 className="text-lg font-bold text-white">{title}</h3>
                <p className="text-sm text-slate-400">{description}</p>
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