import { ReactNode, useState } from 'react';
import { Header } from '@/Components/Admin/Header';
import { Sidebar } from '@/Components/Admin/Sidebar';

interface AdminLayoutProps {
    activeMenu: string;
    children: ReactNode;
}

export default function AdminLayout({ activeMenu, children }: AdminLayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-[#090E1A] text-slate-100 font-sans antialiased">
            {/* Sidebar drawer backdrop for mobile */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <Sidebar activeMenu={activeMenu} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <Header onMenuClick={() => setSidebarOpen(true)} />

            <main className="transition-all duration-300 lg:ml-64 mt-20 p-4 sm:p-6 lg:p-8">
                {children}
            </main>
        </div>
    );
}
