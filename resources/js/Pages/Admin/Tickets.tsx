import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router } from '@inertiajs/react';
import axios from 'axios';
import {
    Clock,
    CheckCircle,
    MessageSquare,
    Search,
    User,
    Phone,
    Mail,
    FileText,
    Download,
    AlertCircle,
    Loader2,
    Send,
    ChevronRight,
    MessageCircle,
} from 'lucide-react';
import { FormEvent, useEffect, useRef, useState } from 'react';

type Ticket = {
    id: number;
    nomor_tiket: string;
    nama_lengkap: string;
    whatsapp: string;
    no_rumah?: string | null;
    email?: string | null;
    keperluan?: string | null;
    kategori: string;
    judul: string;
    pesan?: string | null;
    status: 'Menunggu Admin' | 'Diproses' | 'Selesai';
    lampiran_url?: string | null;
    lampiran_name?: string | null;
    created_at: string;
};

type Props = {
    tickets?: {
        data: Ticket[];
        current_page: number;
        last_page: number;
        links: Array<{ url: string | null; label: string; active: boolean }>;
    };
    filters?: {
        search?: string;
        status?: string;
    };
    summary?: {
        total: number;
        baru: number;
        proses: number;
        selesai: number;
    };
};

export default function Tickets({
    tickets,
    filters,
    summary = { total: 0, baru: 0, proses: 0, selesai: 0 },
}: Props) {
    const [searchTerm, setSearchTerm] = useState(filters?.search ?? '');
    const [statusFilter, setStatusFilter] = useState(filters?.status ?? 'all');
    
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [chatMessages, setChatMessages] = useState<any[]>([]);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [chatInput, setChatInput] = useState('');
    const [userIsTyping, setUserIsTyping] = useState(false);

    const chatBodyRef = useRef<HTMLDivElement | null>(null);

    // Debounced search & filter refresh
    useEffect(() => {
        const timeout = window.setTimeout(() => {
            router.get(
                '/admin/tickets',
                { search: searchTerm, status: statusFilter },
                { preserveState: true, preserveScroll: true, replace: true }
            );
        }, 300);
        return () => window.clearTimeout(timeout);
    }, [searchTerm, statusFilter]);

    // Fetch details & message history when selecting a ticket
    const handleSelectTicket = async (ticket: Ticket) => {
        setLoadingDetails(true);
        setSelectedTicket(ticket);
        try {
            const res = await axios.get(`/admin/tickets/${ticket.id}/details`);
            if (res.data?.ticket) {
                setSelectedTicket(res.data.ticket);
                setChatMessages(res.data.messages || []);
            }
        } catch (err) {
            console.error('Failed to load ticket details:', err);
        } finally {
            setLoadingDetails(false);
        }
    };

    // WebSocket Echo channel subscription
    useEffect(() => {
        if (!selectedTicket?.nomor_tiket) {
            setChatMessages([]);
            return;
        }

        const echo = (window as any).Echo;
        if (!echo) return;

        const channelName = `ticket.${selectedTicket.nomor_tiket}`;
        const channel = echo.channel(channelName);

        channel.listen('.App\\Events\\TicketMessageSent', (data: any) => {
            setChatMessages((prev) => {
                if (prev.some((m) => m.id === data.message.id)) return prev;
                return [...prev, data.message];
            });
        });

        channel.listen('.App\\Events\\TicketTyping', (data: any) => {
            if (!data.is_admin) {
                setUserIsTyping(data.is_typing);
            }
        });

        return () => {
            echo.leave(channelName);
        };
    }, [selectedTicket?.nomor_tiket]);

    // Auto-scroll chat body
    useEffect(() => {
        if (chatBodyRef.current) {
            chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
        }
    }, [chatMessages, userIsTyping, selectedTicket]);

    // Actions
    const handleStartConversation = async () => {
        if (!selectedTicket) return;
        setLoadingDetails(true);
        try {
            const res = await axios.patch(`/admin/tickets/${selectedTicket.id}/start`);
            if (res.data?.success) {
                setSelectedTicket((prev: any) => prev ? { ...prev, status: 'Diproses' } : null);
                if (res.data.system_message) {
                    setChatMessages((prev) => [...prev, res.data.system_message]);
                }
                router.reload({ only: ['tickets', 'summary', 'auth'] });
            }
        } catch (err) {
            console.error('Failed to start conversation:', err);
        } finally {
            setLoadingDetails(false);
        }
    };

    const handleCloseTicket = async () => {
        if (!selectedTicket) return;
        if (!window.confirm('Yakin ingin menyelesaikan & menutup tiket bantuan ini?')) return;
        setLoadingDetails(true);
        try {
            const res = await axios.patch(`/admin/tickets/${selectedTicket.id}/close`);
            if (res.data?.success) {
                setSelectedTicket((prev: any) => prev ? { ...prev, status: 'Selesai' } : null);
                if (res.data.system_message) {
                    setChatMessages((prev) => [...prev, res.data.system_message]);
                }
                router.reload({ only: ['tickets', 'summary', 'auth'] });
            }
        } catch (err) {
            console.error('Failed to close ticket:', err);
        } finally {
            setLoadingDetails(false);
        }
    };

    const handleSendChatMessage = async (e?: FormEvent) => {
        if (e) e.preventDefault();
        const msgText = chatInput.trim();
        if (!msgText || !selectedTicket) return;

        setChatInput('');

        try {
            const res = await axios.post(`/admin/tickets/${selectedTicket.id}/messages`, {
                message: msgText,
            });

            setChatMessages((prev) => {
                if (prev.some((m) => m.id === res.data.id)) return prev;
                return [...prev, res.data];
            });
        } catch (err) {
            console.error('Failed to send message:', err);
        }
    };

    // Typing debouncer
    const isTypingRef = useRef(false);
    const typingTimeoutRef = useRef<any>(null);

    const handleChatInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setChatInput(e.target.value);

        if (!selectedTicket) return;

        if (!isTypingRef.current) {
            isTypingRef.current = true;
            void axios.post(`/admin/tickets/${selectedTicket.id}/typing`, { is_typing: true });
        }

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
            isTypingRef.current = false;
            void axios.post(`/admin/tickets/${selectedTicket.id}/typing`, { is_typing: false });
        }, 2000);
    };

    return (
        <AdminLayout activeMenu="tickets">
            <Head title="Helpdesk Tiket & Dukungan" />

            {/* Page Header */}
            <div className="mb-6">
                <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-1">
                    Layanan Dukungan
                </p>
                <h2 className="text-2xl font-black text-slate-900">Helpdesk Tiket</h2>
                <p className="text-slate-600 text-sm mt-1 font-medium">
                    Kelola tiket pengaduan, surat, iuran, dan kegiatan dari warga atau publik secara real-time.
                </p>
            </div>

            {/* Metrics Header */}
            <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 col-span-2 lg:col-span-1 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-blue-50 border border-blue-200 p-3">
                            <MessageCircle size={22} className="text-blue-700" />
                        </div>
                        <div>
                            <p className="text-3xl font-black text-slate-900">{summary.total}</p>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Tiket</p>
                        </div>
                    </div>
                </div>

                {[
                    { label: 'Tiket Baru (Menunggu)', value: summary.baru, color: 'text-blue-700', filter: 'Menunggu Admin', icon: Clock },
                    { label: 'Sedang Diproses', value: summary.proses, color: 'text-amber-700', filter: 'Diproses', icon: AlertCircle },
                    { label: 'Selesai', value: summary.selesai, color: 'text-emerald-700', filter: 'Selesai', icon: CheckCircle },
                ].map(({ label, value, color, filter, icon: Icon }) => (
                    <button
                        key={label}
                        onClick={() => setStatusFilter(statusFilter === filter ? 'all' : filter)}
                        className={`text-left rounded-2xl border p-5 transition shadow-sm ${
                            statusFilter === filter ? 'border-emerald-500 bg-emerald-50/60' : 'border-slate-200 bg-white hover:bg-slate-50'
                        }`}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
                            <Icon size={14} className={color} />
                        </div>
                        <p className={`text-2xl font-black ${color}`}>{value}</p>
                    </button>
                ))}
            </div>

            {/* Main Content Workspace Split-Pane */}
            <div className="flex flex-col gap-6 lg:flex-row h-[600px]">
                {/* Left pane: ticket search and list */}
                <div className="flex-1 flex flex-col rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                    {/* Search and status tabs header */}
                    <div className="p-4 border-b border-slate-200 space-y-3 bg-slate-50">
                        <div className="relative">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Cari nomor tiket, nama pengirim, subjek..."
                                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                            />
                        </div>

                        <div className="flex gap-2">
                            {[
                                { value: 'all', label: 'Semua Tiket' },
                                { value: 'Menunggu Admin', label: 'Tiket Baru' },
                                { value: 'Diproses', label: 'Diproses' },
                                { value: 'Selesai', label: 'Selesai' },
                            ].map((tab) => (
                                <button
                                    key={tab.value}
                                    onClick={() => setStatusFilter(tab.value)}
                                    className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                                        statusFilter === tab.value
                                            ? 'bg-emerald-600 text-white shadow-sm'
                                            : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Scrollable list */}
                    <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                        {(!tickets || tickets.data.length === 0) ? (
                            <div className="p-8 text-center text-slate-500 flex flex-col items-center justify-center h-full">
                                <MessageSquare size={36} className="text-slate-400 mb-2" />
                                <p className="text-sm">Tidak ada tiket bantuan yang sesuai.</p>
                            </div>
                        ) : (
                            tickets.data.map((ticket) => {
                                const isSelected = selectedTicket?.id === ticket.id;
                                const initials = ticket.nama_lengkap
                                    .split(' ')
                                    .slice(0, 2)
                                    .map((n) => n[0])
                                    .join('')
                                    .toUpperCase() || 'TK';

                                return (
                                    <button
                                        key={ticket.id}
                                        onClick={() => void handleSelectTicket(ticket)}
                                        className={`w-full p-4 text-left flex items-start gap-3 transition ${
                                            isSelected ? 'bg-emerald-50/80 border-l-4 border-emerald-600' : 'hover:bg-slate-50'
                                        }`}
                                    >
                                        <div className="h-10 w-10 shrink-0 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-sm font-black text-emerald-700">
                                            {initials}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start gap-1">
                                                <h4 className="text-xs font-bold text-slate-900 truncate max-w-[150px]">{ticket.nama_lengkap}</h4>
                                                <span className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                                                    ticket.status === 'Menunggu Admin'
                                                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                                        : ticket.status === 'Diproses'
                                                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                }`}>
                                                    {ticket.status === 'Menunggu Admin' ? 'BARU' : ticket.status}
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-slate-500 font-mono mt-0.5">{ticket.nomor_tiket} · {ticket.kategori}</p>
                                            <p className="text-xs text-slate-700 font-bold truncate mt-1">{ticket.judul}</p>
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Right pane: ticket detail and live chat workspace */}
                <div className="w-full lg:w-[480px] shrink-0 flex flex-col rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                    {selectedTicket ? (
                        <>
                            {/* Selected ticket header details */}
                            <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col gap-2">
                                <div className="flex items-center justify-between">
                                    <p className="text-[10px] font-bold font-mono text-slate-500">{selectedTicket.nomor_tiket}</p>
                                    <span className={`text-[10px] font-black rounded-lg px-2 py-0.5 ${
                                        selectedTicket.status === 'Menunggu Admin'
                                            ? 'bg-blue-100 text-blue-800'
                                            : selectedTicket.status === 'Diproses'
                                            ? 'bg-amber-100 text-amber-800'
                                            : 'bg-emerald-100 text-emerald-800'
                                    }`}>
                                        {selectedTicket.status}
                                    </span>
                                </div>
                                <h3 className="text-sm font-black text-slate-900 leading-snug">{selectedTicket.judul}</h3>
                                <p className="text-[11px] text-slate-600 font-medium">{selectedTicket.kategori} · {selectedTicket.created_at}</p>

                                <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-200 text-xs">
                                    <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                                        <User size={13} className="text-slate-400" />
                                        <span className="truncate">{selectedTicket.nama_lengkap}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                                        <Phone size={13} className="text-slate-400" />
                                        <span className="truncate">{selectedTicket.whatsapp}</span>
                                    </div>
                                    {selectedTicket.no_rumah && (
                                        <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                                            <FileText size={13} className="text-slate-400" />
                                            <span>Rumah {selectedTicket.no_rumah}</span>
                                        </div>
                                    )}
                                    {selectedTicket.email && (
                                        <div className="flex items-center gap-1.5 text-slate-700 font-medium col-span-2">
                                            <Mail size={13} className="text-slate-400" />
                                            <span className="truncate">{selectedTicket.email}</span>
                                        </div>
                                    )}
                                </div>

                                {selectedTicket.keperluan && (
                                    <p className="text-[11px] text-slate-700 bg-white p-2 rounded-lg mt-1 border border-slate-200 font-medium">
                                        <span className="font-bold text-slate-900 block mb-0.5">Keperluan:</span>
                                        {selectedTicket.keperluan}
                                    </p>
                                )}
                            </div>

                            {/* Detail / Chat Body switcher */}
                            {selectedTicket.status === 'Menunggu Admin' ? (
                                <div className="flex-1 p-5 overflow-y-auto space-y-4 flex flex-col justify-between">
                                    <div className="space-y-4">
                                        <div>
                                            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Isi Keluhan / Pesan</h4>
                                            <p className="whitespace-pre-line rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-relaxed text-slate-800 font-medium">
                                                {selectedTicket.pesan || 'Tidak ada isi pesan detail.'}
                                            </p>
                                        </div>

                                        {selectedTicket.lampiran_url && (
                                            <div>
                                                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Lampiran Berkas</h4>
                                                <div className="flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50 p-3">
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-xs font-bold text-slate-900 truncate">{selectedTicket.lampiran_name}</p>
                                                    </div>
                                                    <a
                                                        href={selectedTicket.lampiran_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold px-2.5 py-1 rounded transition"
                                                    >
                                                        <Download size={11} /> Buka
                                                    </a>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-3 pt-4 border-t border-slate-200">
                                        <button
                                            onClick={handleCloseTicket}
                                            className="flex-1 py-2.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold transition flex items-center justify-center gap-1.5"
                                        >
                                            Tolak / Tutup Tiket
                                        </button>
                                        <button
                                            onClick={handleStartConversation}
                                            className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
                                        >
                                            Mulai Percakapan
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                /* Chat View for status Diproses & Selesai */
                                <div className="flex-1 flex flex-col overflow-hidden">
                                    <div
                                        ref={chatBodyRef}
                                        className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50"
                                    >
                                        {/* Ticket description card */}
                                        <div className="bg-white border border-slate-200 rounded-xl p-3 text-[11px] text-slate-700 shadow-sm">
                                            <p className="font-bold text-slate-900">Deskripsi Kasus:</p>
                                            <p className="mt-1 font-medium">{selectedTicket.pesan}</p>
                                            {selectedTicket.lampiran_url && (
                                                <a
                                                    href={selectedTicket.lampiran_url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="mt-2 text-emerald-700 inline-flex items-center gap-1 hover:underline font-bold"
                                                >
                                                    <Download size={10} /> {selectedTicket.lampiran_name}
                                                </a>
                                            )}
                                        </div>

                                        {chatMessages.map((msg) => (
                                            <div
                                                key={msg.id}
                                                className={`flex flex-col ${msg.is_admin ? 'items-end' : 'items-start'}`}
                                            >
                                                <div
                                                    className={`max-w-[80%] rounded-xl px-3.5 py-2 text-xs leading-relaxed shadow-sm ${
                                                        msg.is_admin
                                                            ? 'bg-emerald-600 text-white font-medium rounded-tr-none'
                                                            : 'bg-white border border-slate-200 text-slate-800 font-medium rounded-tl-none'
                                                    }`}
                                                >
                                                    <p>{msg.message}</p>
                                                </div>
                                                <span className="text-[9px] text-slate-400 mt-1 px-1 font-medium">
                                                    {msg.is_admin ? 'Anda' : 'Warga'} • {msg.created_at}
                                                </span>
                                            </div>
                                        ))}

                                        {userIsTyping && (
                                            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm w-max animate-pulse">
                                                <Loader2 className="animate-spin text-emerald-600" size={12} />
                                                Warga sedang mengetik...
                                            </div>
                                        )}
                                    </div>

                                    {/* Action footer */}
                                    {selectedTicket.status === 'Selesai' ? (
                                        <div className="p-4 bg-slate-50 border-t border-slate-200 text-center">
                                            <span className="text-xs text-slate-500 font-bold">
                                                Tiket Bantuan Ini Telah Diselesaikan.
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="p-3 bg-white border-t border-slate-200 flex flex-col gap-2">
                                            <form onSubmit={handleSendChatMessage} className="flex items-center gap-2">
                                                <div className="flex-1 relative">
                                                    <input
                                                        type="text"
                                                        value={chatInput}
                                                        onChange={handleChatInputChange}
                                                        placeholder="Ketik balasan Anda..."
                                                        className="w-full rounded-full border border-slate-200 bg-slate-50 py-2 pl-4 pr-10 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                                                    />
                                                </div>
                                                <button
                                                    type="submit"
                                                    disabled={!chatInput.trim()}
                                                    className="h-8 w-8 shrink-0 flex items-center justify-center rounded-full bg-emerald-600 hover:bg-emerald-700 text-white transition disabled:opacity-50 shadow-sm"
                                                >
                                                    <Send size={14} />
                                                </button>
                                            </form>
                                            <div className="flex justify-between items-center px-1">
                                                <span className="text-[9px] text-slate-500 font-bold">
                                                    Saluran Obrolan Reverb Aktif
                                                </span>
                                                <button
                                                    onClick={handleCloseTicket}
                                                    className="text-[10px] text-red-600 hover:text-red-700 font-bold"
                                                >
                                                    Tutup Tiket
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-500 text-center">
                            <MessageCircle size={48} className="text-slate-300 mb-3" />
                            <h4 className="text-sm font-bold text-slate-900">Buka Tiket</h4>
                            <p className="text-xs mt-1 max-w-xs text-slate-600 font-medium">
                                Pilih tiket bantuan dari daftar di sebelah kiri untuk melihat detail masalah dan memulai live chat real-time.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
