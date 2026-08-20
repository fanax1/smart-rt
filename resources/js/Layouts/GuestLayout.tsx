import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link } from '@inertiajs/react';
import { PropsWithChildren } from 'react';

export default function Guest({ children }: PropsWithChildren) {
    return (
        <div className="flex min-h-screen flex-col items-center bg-slate-50 pt-6 sm:justify-center sm:pt-0 text-slate-900 font-sans">
            <div>
                <Link href="/">
                    <ApplicationLogo className="h-16 w-16 text-emerald-600" />
                </Link>
            </div>

            <div className="mt-6 w-full overflow-hidden border border-slate-200 bg-white px-6 py-8 shadow-xl sm:max-w-md sm:rounded-2xl">
                {children}
            </div>
        </div>
    );
}
