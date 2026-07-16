import { usePage } from '@inertiajs/react';
import axios from 'axios';
import {
    Bot,
    CalendarDays,
    CircleDollarSign,
    FileText,
    Loader2,
    MessageCircle,
    Mic,
    Minus,
    Paperclip,
    Phone,
    Send,
    Sparkles,
    X,
    Clock,
    CheckCircle,
    ArrowLeft,
} from 'lucide-react';
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';

type ChatMessage = {
    id: string;
    role: 'assistant' | 'user';
    content: string;
    createdAt: string;
};

type AuthUser = {
    id: number;
    name: string;
    email: string;
    role?: string | null;
    warga_id?: number | null;
    no_rumah?: string | null;
};

type SharedPageProps = {
    auth?: {
        user?: AuthUser | null;
    };
};

type SiteProfile = {
    rtName: string;
    title: string;
    subtitle: string;
    address?: string | null;
    email?: string | null;
    phone?: string | null;
    emergencyContacts?: Array<{ label: string; phone: string }>;
};

type StatItem = {
    label: string;
    value: string;
    unit: string;
};

type Announcement = {
    id: number;
    title: string;
    excerpt?: string;
    content?: string;
    category?: string;
    publishedAt?: string | null;
};

type EventItem = {
    id: number;
    title: string;
    date?: string | null;
    time?: string | null;
    location?: string | null;
    type?: string | null;
    description?: string | null;
    status?: string | null;
};

type PublicDocument = {
    id: number;
    title: string;
    description?: string | null;
    category?: string | null;
    type?: string | null;
    publishedAt?: string | null;
    fileName?: string | null;
};

type GalleryItem = {
    id: number;
    title: string;
    publishedAt?: string | null;
    description?: string | null;
    category?: string | null;
};

type CommitteePeriod = {
    id: string;
    tahun: string;
    label: string;
    status: string;
    anggota: Array<{
        id: number;
        nama: string;
        jabatan: string;
        phone?: string | null;
        email?: string | null;
        deskripsi?: string | null;
        isKetua?: boolean;
    }>;
};

type SmartRtChatbotProps = {
    site?: SiteProfile;
    stats?: StatItem[];
    announcements?: Announcement[];
    events?: EventItem[];
    documents?: PublicDocument[];
    gallery?: GalleryItem[];
    committeePeriods?: CommitteePeriod[];
};

const publicQuickActions = [
    'Cara daftar akun',
    'Hubungi Sekretariat RT',
    'Jadwal Kegiatan RT',
    'Lihat Pengumuman',
    'Dokumen Publik',
    'Kontak Pengurus',
];

const wargaQuickActions = [
    'Cek Iuran Saya',
    'Status Pengajuan Surat',
    'Hubungi Sekretariat RT',
    'Pengaduan Saya',
    'Kegiatan RT',
    'Pengumuman Warga',
];

const publicInfoCards = [
    {
        title: 'Daftar Akun',
        description: 'Akun warga dibuat oleh admin berdasarkan data KK dan warga yang sudah terdata.',
        icon: Phone,
    },
    {
        title: 'Pengumuman Publik',
        description: 'Lihat informasi resmi RT yang sudah dipublikasikan admin.',
        icon: FileText,
    },
    {
        title: 'Kegiatan RT',
        description: 'Pantau agenda dan kegiatan lingkungan yang tersedia untuk publik.',
        icon: CalendarDays,
    },
    {
        title: 'Dokumen Publik',
        description: 'Akses dokumen RT yang berstatus publik dan published.',
        icon: FileText,
    },
];

const wargaInfoCards = [
    {
        title: 'Iuran Saya',
        description: 'Cek informasi iuran dan arahan pembayaran melalui Portal Warga.',
        icon: CircleDollarSign,
    },
    {
        title: 'Pengajuan Surat',
        description: 'Ajukan surat pengantar dan pantau status pengajuan Anda.',
        icon: FileText,
    },
    {
        title: 'Pengaduan Saya',
        description: 'Buat dan pantau pengaduan warga secara digital.',
        icon: Phone,
    },
    {
        title: 'Kegiatan RT',
        description: 'Lihat agenda kegiatan dan partisipasi warga.',
        icon: CalendarDays,
    },
];

function nowTime() {
    return new Intl.DateTimeFormat('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date());
}

function createMessage(role: ChatMessage['role'], content: string): ChatMessage {
    return {
        id: `${role}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        role,
        content,
        createdAt: nowTime(),
    };
}

export default function SmartRtChatbot({
    site,
    stats = [],
    announcements = [],
    events = [],
    documents = [],
    gallery = [],
    committeePeriods = [],
}: SmartRtChatbotProps) {
    const { auth } = usePage().props as unknown as SharedPageProps;

    const authUser = auth?.user ?? null;
    const isLoggedIn = Boolean(authUser);
    const isAdmin = authUser?.role === 'admin';
    const isWarga = Boolean(authUser && !isAdmin && (authUser.role === 'warga' || authUser.warga_id));

    const chatbotMode = isWarga ? 'warga' : 'public';
    const endpoint = '/chatbot/send-message';
    const firstName = authUser?.name?.split(' ')[0] ?? 'Warga';

    const initialMessage =
        chatbotMode === 'warga'
            ? `Halo ${firstName}! Saya asisten SMART-RT untuk Portal Warga. Saya bisa membantu terkait iuran, pengajuan surat, pengaduan, kegiatan RT, dan pengumuman warga.`
            : 'Halo! Saya asisten SMART-RT untuk informasi publik. Saya bisa membantu terkait profil RT, struktur pengurus, pendaftaran akun, pengumuman publik, kegiatan RT, dokumen publik, jadwal, dan kontak pengurus.';

    const activeQuickActions = chatbotMode === 'warga' ? wargaQuickActions : publicQuickActions;
    const activeInfoCards = chatbotMode === 'warga' ? wargaInfoCards : publicInfoCards;

    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([createMessage('assistant', initialMessage)]);

    // Helpdesk ticket state
    const [chatView, setChatView] = useState<'ai_chat' | 'ticket_form' | 'ticket_status' | 'ticket_live_chat'>('ai_chat');
    const [activeTicket, setActiveTicket] = useState<any>(null);
    const [ticketMessages, setTicketMessages] = useState<any[]>([]);
    const [adminIsTyping, setAdminIsTyping] = useState(false);
    const [chatInput, setChatInput] = useState('');
    const [ticketLoading, setTicketLoading] = useState(false);

    // Form inputs state
    const [formNama, setFormNama] = useState(authUser?.name || '');
    const [formEmail, setFormEmail] = useState(authUser?.email || '');
    const [formWhatsapp, setFormWhatsapp] = useState('');
    const [formNoRumah, setFormNoRumah] = useState(authUser?.no_rumah || '');
    const [formKeperluan, setFormKeperluan] = useState('');
    const [formKategori, setFormKategori] = useState('Lainnya');
    const [formJudul, setFormJudul] = useState('');
    const [formPesan, setFormPesan] = useState('');
    const [formLampiran, setFormLampiran] = useState<File | null>(null);

    // Sync form inputs when authUser changes
    useEffect(() => {
        if (authUser) {
            setFormNama(authUser.name || '');
            setFormEmail(authUser.email || '');
            setFormNoRumah(authUser.no_rumah || '');
        } else {
            setFormNama('');
            setFormEmail('');
            setFormNoRumah('');
        }
    }, [authUser]);

    const chatBodyRef = useRef<HTMLDivElement | null>(null);

    // Global custom event to direct page clicks to ticket form
    useEffect(() => {
        const handleOpenHelpdesk = () => {
            setIsOpen(true);
            setChatView('ticket_form');
        };
        window.addEventListener('open-helpdesk-ticket', handleOpenHelpdesk);
        return () => {
            window.removeEventListener('open-helpdesk-ticket', handleOpenHelpdesk);
        };
    }, []);

    const historyPayload = useMemo(() => {
        return messages.slice(-10).map((message) => ({
            role: message.role,
            content: message.content,
        }));
    }, [messages]);

    const publicContext = useMemo(() => {
        const activeCommitteePeriod =
            committeePeriods.find((period) => period.status?.toLowerCase() === 'aktif') ??
            committeePeriods.find((period) => period.status?.toLowerCase() === 'active') ??
            committeePeriods[0] ??
            null;

        const ketuaRt = activeCommitteePeriod?.anggota?.find(
            (anggota) => anggota.isKetua || anggota.jabatan?.toLowerCase().includes('ketua'),
        );

        return {
            profil_rt: {
                nama_rt: site?.rtName ?? null,
                nama_aplikasi: site?.title ?? 'SMART-RT',
                deskripsi: site?.subtitle ?? null,
                alamat: site?.address ?? null,
                email: site?.email ?? null,
                telepon: site?.phone ?? null,
                kontak_darurat: site?.emergencyContacts ?? [],
            },
            statistik: stats.map((item) => ({
                label: item.label,
                nilai: item.value,
                satuan: item.unit,
            })),
            struktur_rt: {
                periode_aktif: activeCommitteePeriod
                    ? {
                          tahun: activeCommitteePeriod.tahun,
                          label: activeCommitteePeriod.label,
                          status: activeCommitteePeriod.status,
                      }
                    : null,
                ketua_rt: ketuaRt
                    ? {
                          nama: ketuaRt.nama,
                          jabatan: ketuaRt.jabatan,
                          phone: ketuaRt.phone ?? null,
                          email: ketuaRt.email ?? null,
                          deskripsi: ketuaRt.deskripsi ?? null,
                      }
                    : null,
                daftar_pengurus:
                    activeCommitteePeriod?.anggota?.map((anggota) => ({
                        nama: anggota.nama,
                        jabatan: anggota.jabatan,
                        phone: anggota.phone ?? null,
                        email: anggota.email ?? null,
                        deskripsi: anggota.deskripsi ?? null,
                    })) ?? [],
            },
            pengumuman_publik: announcements.slice(0, 8).map((item) => ({
                judul: item.title,
                kategori: item.category ?? null,
                tanggal_publish: item.publishedAt ?? null,
                ringkasan: item.excerpt ?? item.content ?? null,
            })),
            kegiatan_publik: events.slice(0, 8).map((item) => ({
                judul: item.title,
                tanggal: item.date ?? null,
                waktu: item.time ?? null,
                lokasi: item.location ?? null,
                tipe: item.type ?? null,
                status: item.status ?? null,
                deskripsi: item.description ?? null,
            })),
            dokumen_publik: documents.slice(0, 8).map((item) => ({
                judul: item.title,
                kategori: item.category ?? null,
                tipe: item.type ?? null,
                tanggal_publish: item.publishedAt ?? null,
                deskripsi: item.description ?? null,
                nama_file: item.fileName ?? null,
            })),
            galeri_publik: gallery.slice(0, 8).map((item) => ({
                judul: item.title,
                kategori: item.category ?? null,
                tanggal_publish: item.publishedAt ?? null,
                deskripsi: item.description ?? null,
            })),
        };
    }, [site, stats, announcements, events, documents, gallery, committeePeriods]);

    // Fetch active ticket on open or mount
    useEffect(() => {
        const fetchTicket = async () => {
            setTicketLoading(true);
            try {
                let ticketNo = localStorage.getItem('active_ticket_no');
                
                // If logged in, check db first
                if (isLoggedIn) {
                    const activeRes = await axios.get('/tickets/active');
                    if (activeRes.data?.ticket) {
                        ticketNo = activeRes.data.ticket.nomor_tiket;
                        localStorage.setItem('active_ticket_no', ticketNo || '');
                    }
                }

                if (ticketNo) {
                    const detailRes = await axios.get(`/tickets/${ticketNo}`);
                    if (detailRes.data?.ticket) {
                        setActiveTicket(detailRes.data.ticket);
                        setTicketMessages(detailRes.data.messages || []);
                        
                        if (detailRes.data.ticket.status === 'Menunggu Admin') {
                            setChatView('ticket_status');
                        } else {
                            setChatView('ticket_live_chat');
                        }
                    } else {
                        localStorage.removeItem('active_ticket_no');
                    }
                }
            } catch (err) {
                console.error('Failed to load active ticket:', err);
                localStorage.removeItem('active_ticket_no');
                setActiveTicket(null);
                setTicketMessages([]);
                setChatView('ai_chat');
            } finally {
                setTicketLoading(false);
            }
        };

        if (isOpen) {
            void fetchTicket();
        }
    }, [isOpen, isLoggedIn]);

    // WebSocket Echo listeners
    useEffect(() => {
        if (!activeTicket?.nomor_tiket) return;

        const echo = (window as any).Echo;
        if (!echo) return;

        const channelName = `ticket.${activeTicket.nomor_tiket}`;
        const channel = echo.channel(channelName);

        channel.listen('.App\\Events\\TicketStatusUpdated', (data: any) => {
            setActiveTicket((prev: any) => {
                if (!prev) return null;
                const updated = { ...prev, status: data.status };
                if (data.status === 'Diproses') {
                    setChatView('ticket_live_chat');
                }
                return updated;
            });
        });

        channel.listen('.App\\Events\\TicketMessageSent', (data: any) => {
            setTicketMessages((prev) => {
                if (prev.some((m) => m.id === data.message.id)) return prev;
                return [...prev, data.message];
            });
        });

        channel.listen('.App\\Events\\TicketTyping', (data: any) => {
            if (data.is_admin) {
                setAdminIsTyping(data.is_typing);
            }
        });

        return () => {
            echo.leave(channelName);
        };
    }, [activeTicket?.nomor_tiket]);

    // Auto-scroll to bottom of chat body
    useEffect(() => {
        if (!isOpen) return;
        const timeout = window.setTimeout(() => {
            if (chatBodyRef.current) {
                chatBodyRef.current.scrollTo({
                    top: chatBodyRef.current.scrollHeight,
                    behavior: 'smooth',
                });
            }
        }, 80);
        return () => window.clearTimeout(timeout);
    }, [isOpen, messages, isTyping, chatView, ticketMessages, adminIsTyping]);

    // Typing debouncer
    const isTypingRef = useRef(false);
    const typingTimeoutRef = useRef<any>(null);

    const handleChatInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setChatInput(e.target.value);

        if (!activeTicket) return;

        if (!isTypingRef.current) {
            isTypingRef.current = true;
            void axios.post(`/tickets/${activeTicket.nomor_tiket}/typing`, { is_typing: true });
        }

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
            isTypingRef.current = false;
            void axios.post(`/tickets/${activeTicket.nomor_tiket}/typing`, { is_typing: false });
        }, 2000);
    };

    const handleTicketSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setTicketLoading(true);

        const formData = new FormData();
        formData.append('nama_lengkap', formNama);
        formData.append('whatsapp', formWhatsapp);
        formData.append('kategori', isWarga ? formKategori : 'Lainnya');
        formData.append('judul', formJudul);
        if (formLampiran) {
            formData.append('lampiran', formLampiran);
        }

        if (isWarga) {
            formData.append('no_rumah', formNoRumah);
        } else {
            formData.append('email', formEmail);
            formData.append('keperluan', formKeperluan);
            formData.append('pesan', formPesan);
        }

        try {
            const res = await axios.post('/tickets', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (res.data?.success && res.data?.ticket) {
                const ticketData = res.data.ticket;
                localStorage.setItem('active_ticket_no', ticketData.nomor_tiket);
                
                const detailRes = await axios.get(`/tickets/${ticketData.nomor_tiket}`);
                setActiveTicket(detailRes.data.ticket);
                setTicketMessages(detailRes.data.messages || []);
                setChatView('ticket_status');
            }
        } catch (err) {
            console.error('Failed to submit ticket:', err);
            alert('Gagal mengirim tiket bantuan. Silakan periksa kembali berkas/lampiran Anda.');
        } finally {
            setTicketLoading(false);
        }
    };

    const handleSendChatMessage = async (e?: FormEvent) => {
        if (e) e.preventDefault();
        const msgText = chatInput.trim();
        if (!msgText || !activeTicket) return;

        setChatInput('');

        try {
            const res = await axios.post(`/tickets/${activeTicket.nomor_tiket}/messages`, {
                message: msgText
            });
            
            setTicketMessages((prev) => {
                if (prev.some((m) => m.id === res.data.id)) return prev;
                return [...prev, res.data];
            });
        } catch (err) {
            console.error('Failed to send message:', err);
        }
    };

    const handleClearActiveTicket = () => {
        localStorage.removeItem('active_ticket_no');
        setActiveTicket(null);
        setTicketMessages([]);
        setChatView('ai_chat');
        setFormJudul('');
        setFormPesan('');
        setFormKeperluan('');
        setFormLampiran(null);
    };

    const sendMessage = async (text?: string) => {
        const message = (text ?? input).trim();

        if (!message || isTyping) {
            return;
        }

        const lowerMessage = message.toLowerCase();
        if (lowerMessage === 'hubungi sekretariat rt' || lowerMessage.includes('hubungi sekretariat')) {
            setChatView('ticket_form');
            setInput('');
            return;
        }

        const userMessage = createMessage('user', message);

        setMessages((current) => [...current, userMessage]);
        setInput('');
        setIsTyping(true);

        try {
            const response = await axios.post(endpoint, {
                message,
                history: historyPayload.slice(-3),
                mode: chatbotMode,
                public_context: {
                    profil_rt: publicContext.profil_rt,
                    struktur_rt: publicContext.struktur_rt,
                    statistik: publicContext.statistik,
                    pengumuman_publik: publicContext.pengumuman_publik?.slice(0, 3),
                    kegiatan_publik: publicContext.kegiatan_publik?.slice(0, 3),
                    dokumen_publik: publicContext.dokumen_publik?.slice(0, 3),
                    galeri_publik: publicContext.galeri_publik?.slice(0, 3),
                },
            });

            const reply = response.data?.reply || 'Maaf, saya belum bisa menjawab pertanyaan itu.';
            setMessages((current) => [...current, createMessage('assistant', reply)]);
        } catch {
            setMessages((current) => [
                ...current,
                createMessage('assistant', 'Maaf, terjadi kendala koneksi. Silakan coba lagi beberapa saat.'),
            ]);
        } finally {
            setIsTyping(false);
        }
    };

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        void sendMessage();
    };

    return (
        <div className="fixed bottom-20 lg:bottom-6 right-4 lg:right-6 z-[80] flex flex-col items-end gap-3">
            {!isOpen && (
                <div className="relative hidden rounded-2xl border border-emerald-100 bg-white px-4 py-2 text-sm font-bold text-emerald-700 shadow-xl shadow-emerald-900/10 sm:block">
                    Butuh bantuan?
                    <span className="absolute -bottom-1.5 right-6 h-3 w-3 rotate-45 border-b border-r border-emerald-100 bg-white" />
                </div>
            )}

            {isOpen && (
                <div className="flex h-[calc(100vh-2rem)] w-[calc(100vw-1.5rem)] max-w-[430px] flex-col overflow-hidden rounded-[2rem] border border-white/60 bg-white/90 shadow-2xl shadow-slate-950/20 backdrop-blur-xl sm:h-[640px] sm:w-[430px]">
                    <header className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-600 px-5 py-4 text-white shadow-lg">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                {chatView !== 'ai_chat' && (
                                    <button
                                        type="button"
                                        onClick={() => setChatView('ai_chat')}
                                        className="mr-1 flex h-8 w-8 items-center justify-center rounded-full text-white hover:bg-white/10"
                                        aria-label="Kembali"
                                    >
                                        <ArrowLeft size={16} />
                                    </button>
                                )}
                                <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
                                    <Bot size={24} />
                                    <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-emerald-700 bg-emerald-300" />
                                </div>

                                <div>
                                    <h2 className="text-sm font-black leading-tight truncate max-w-[180px]">
                                        {chatView === 'ai_chat' && 'SMART-RT Assistant'}
                                        {chatView === 'ticket_form' && 'Form Tiket Bantuan'}
                                        {chatView === 'ticket_status' && 'Status Tiket Anda'}
                                        {chatView === 'ticket_live_chat' && `Live Chat: ${activeTicket?.nomor_tiket}`}
                                    </h2>
                                    <p className="text-[10px] font-semibold text-emerald-100">
                                        {chatView === 'ai_chat' && `Online • ${chatbotMode === 'warga' ? 'mode warga' : 'mode publik'}`}
                                        {chatView === 'ticket_form' && 'Hubungi Sekretariat'}
                                        {chatView === 'ticket_status' && activeTicket?.status}
                                        {chatView === 'ticket_live_chat' && 'Percakapan Aktif'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="flex h-9 w-9 items-center justify-center rounded-full text-white/90 transition hover:bg-white/10"
                                    aria-label="Minimize chatbot"
                                >
                                    <Minus size={18} />
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="flex h-9 w-9 items-center justify-center rounded-full text-white/90 transition hover:bg-white/10"
                                    aria-label="Tutup chatbot"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>
                    </header>

                    {/* Active Ticket Notification Bar in AI Chat */}
                    {activeTicket && chatView === 'ai_chat' && (
                        <div className="bg-emerald-50 border-b border-emerald-100 px-4 py-2.5 flex items-center justify-between text-xs text-emerald-800 font-bold shrink-0">
                            <span>Tiket Aktif: {activeTicket.nomor_tiket} ({activeTicket.status})</span>
                            <button
                                onClick={() => setChatView(activeTicket.status === 'Menunggu Admin' ? 'ticket_status' : 'ticket_live_chat')}
                                className="rounded bg-emerald-700 text-white px-2.5 py-1 font-bold hover:bg-emerald-800"
                            >
                                Buka Chat
                            </button>
                        </div>
                    )}

                    {/* Main Body View Switcher */}
                    {chatView === 'ai_chat' && (
                        <div
                            ref={chatBodyRef}
                            className="flex-1 space-y-4 overflow-y-auto bg-gradient-to-b from-slate-50 to-white px-4 py-5"
                        >
                            <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-4">
                                <div className="mb-3 flex items-center gap-2 text-sm font-black text-emerald-800">
                                    <Sparkles size={17} />
                                    {chatbotMode === 'warga' ? 'Layanan warga' : 'Layanan publik'}
                                </div>

                                <div className="grid gap-2 sm:grid-cols-2">
                                    {activeInfoCards.map((card) => {
                                        const Icon = card.icon;

                                        return (
                                            <div key={card.title} className="rounded-2xl bg-white p-3 shadow-sm">
                                                <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                                                    <Icon size={18} />
                                                </div>
                                                <p className="text-xs font-black text-slate-900">{card.title}</p>
                                                <p className="mt-1 text-[11px] leading-4 text-slate-500">
                                                    {card.description}
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {messages.map((message) => (
                                <div
                                    key={message.id}
                                    className={[
                                        'flex flex-col gap-1',
                                        message.role === 'user' ? 'items-end' : 'items-start',
                                    ].join(' ')}
                                >
                                    <div
                                        className={[
                                            'max-w-[86%] rounded-3xl px-4 py-3 text-sm leading-6 shadow-sm',
                                            message.role === 'user'
                                                ? 'rounded-br-md bg-gradient-to-br from-emerald-700 to-teal-600 text-white'
                                                : 'rounded-bl-md border border-slate-200 bg-white text-slate-700',
                                        ].join(' ')}
                                    >
                                        {message.content}
                                    </div>

                                    <span
                                        className={[
                                            'px-2 text-[10px] text-slate-400',
                                            message.role === 'user' ? 'text-right' : 'text-left',
                                        ].join(' ')}
                                    >
                                        {message.createdAt}
                                    </span>
                                </div>
                            ))}

                            {isTyping && (
                                <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-500 shadow-sm">
                                    <Loader2 className="animate-spin text-emerald-700" size={15} />
                                    SMART-RT Assistant sedang mengetik...
                                </div>
                            )}
                        </div>
                    )}

                    {/* TICKET FORM VIEW */}
                    {chatView === 'ticket_form' && (
                        <div className="flex-1 overflow-y-auto bg-white p-5 font-sans">
                            {isWarga ? (
                                /* FORM A - WARGA USER LOGIN */
                                <form onSubmit={handleTicketSubmit} className="space-y-4">
                                    <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center gap-2 mb-2">
                                        <Sparkles size={16} className="text-emerald-700 shrink-0" />
                                        <p className="text-[11px] text-emerald-800 font-bold leading-normal">
                                            Anda terhubung sebagai Warga RT setempat.
                                        </p>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Nama Lengkap</label>
                                        <input
                                            type="text"
                                            required
                                            disabled
                                            value={formNama}
                                            className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3 py-2.5 text-xs text-slate-500 cursor-not-allowed focus:outline-none transition font-semibold"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Nomor WhatsApp *</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="Contoh: 08123456789"
                                            value={formWhatsapp}
                                            onChange={(e) => setFormWhatsapp(e.target.value)}
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 transition"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">No Rumah</label>
                                        <input
                                            type="text"
                                            required
                                            disabled={Boolean(authUser?.no_rumah)}
                                            placeholder="Contoh: B-12"
                                            value={formNoRumah}
                                            onChange={(e) => setFormNoRumah(e.target.value)}
                                            className={`w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs focus:outline-none focus:border-emerald-500 transition ${
                                                authUser?.no_rumah
                                                    ? 'bg-slate-100 text-slate-500 cursor-not-allowed font-semibold'
                                                    : 'bg-slate-50 text-slate-800'
                                            }`}
                                        />
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Kategori *</label>
                                        <select
                                            value={formKategori}
                                            onChange={(e) => setFormKategori(e.target.value)}
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 transition"
                                        >
                                            <option value="Surat Pengantar">Surat Pengantar</option>
                                            <option value="Administrasi Kependudukan">Administrasi Kependudukan</option>
                                            <option value="Kegiatan RT">Kegiatan RT</option>
                                            <option value="Iuran">Iuran</option>
                                            <option value="Fasilitas Lingkungan">Fasilitas Lingkungan</option>
                                            <option value="Pengaduan">Pengaduan</option>
                                            <option value="Keamanan">Keamanan</option>
                                            <option value="Lainnya">Lainnya</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Judul Permasalahan *</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="Judul singkat keluhan/pertanyaan"
                                            value={formJudul}
                                            onChange={(e) => setFormJudul(e.target.value)}
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 transition"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Lampiran (Opsional)</label>
                                        <input
                                            type="file"
                                            accept=".pdf,.jpg,.jpeg,.png"
                                            onChange={(e) => setFormLampiran(e.target.files?.[0] || null)}
                                            className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                                        />
                                        <p className="text-[9px] text-slate-400 mt-1">Format: PDF/JPG/PNG, Max: 10MB</p>
                                    </div>

                                    <div className="flex gap-2 pt-2">
                                        <button
                                            type="button"
                                            onClick={() => setChatView('ai_chat')}
                                            className="flex-1 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 text-xs font-bold transition hover:bg-slate-50 flex items-center justify-center"
                                        >
                                            Batal
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={ticketLoading}
                                            className="flex-2 py-2.5 rounded-xl bg-emerald-700 text-white text-xs font-bold transition hover:bg-emerald-800 flex items-center justify-center gap-2 disabled:opacity-60"
                                        >
                                            {ticketLoading ? (
                                                <>
                                                    <Loader2 size={14} className="animate-spin" /> Mengirim...
                                                </>
                                            ) : (
                                                'Kirim Tiket'
                                            )}
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                /* FORM B - PUBLIC GUEST WITHOUT LOGIN */
                                <form onSubmit={handleTicketSubmit} className="space-y-4">
                                    <div className="p-3 rounded-2xl bg-teal-50 border border-teal-100 flex items-center gap-2 mb-2">
                                        <Sparkles size={16} className="text-teal-700 shrink-0" />
                                        <p className="text-[11px] text-teal-800 font-bold leading-normal">
                                            Anda terhubung sebagai Pengunjung Publik.
                                        </p>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Nama Lengkap *</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="Nama Lengkap Anda"
                                            value={formNama}
                                            onChange={(e) => setFormNama(e.target.value)}
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 transition"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Email *</label>
                                        <input
                                            type="email"
                                            required
                                            placeholder="Alamat Email Anda"
                                            value={formEmail}
                                            onChange={(e) => setFormEmail(e.target.value)}
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 transition"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">No WhatsApp *</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="Contoh: 08123456789"
                                            value={formWhatsapp}
                                            onChange={(e) => setFormWhatsapp(e.target.value)}
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 transition"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Keperluan *</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="Contoh: Pengurusan izin tinggal sementara"
                                            value={formKeperluan}
                                            onChange={(e) => setFormKeperluan(e.target.value)}
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 transition"
                                        />
                                    </div>


                                    <div>
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Judul *</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="Judul singkat keluhan/pertanyaan"
                                            value={formJudul}
                                            onChange={(e) => setFormJudul(e.target.value)}
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 transition"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Pesan *</label>
                                        <textarea
                                            required
                                            rows={3}
                                            placeholder="Deskripsikan masalah Anda secara detail"
                                            value={formPesan}
                                            onChange={(e) => setFormPesan(e.target.value)}
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 transition"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Lampiran (Opsional)</label>
                                        <input
                                            type="file"
                                            accept=".pdf,.jpg,.jpeg,.png"
                                            onChange={(e) => setFormLampiran(e.target.files?.[0] || null)}
                                            className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                                        />
                                        <p className="text-[9px] text-slate-400 mt-1">Format: PDF/JPG/PNG, Max: 10MB</p>
                                    </div>

                                    <div className="flex gap-2 pt-2">
                                        <button
                                            type="button"
                                            onClick={() => setChatView('ai_chat')}
                                            className="flex-1 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 text-xs font-bold transition hover:bg-slate-50 flex items-center justify-center"
                                        >
                                            Batal
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={ticketLoading}
                                            className="flex-2 py-2.5 rounded-xl bg-emerald-700 text-white text-xs font-bold transition hover:bg-emerald-800 flex items-center justify-center gap-2 disabled:opacity-60"
                                        >
                                            {ticketLoading ? (
                                                <>
                                                    <Loader2 size={14} className="animate-spin" /> Mengirim...
                                                </>
                                            ) : (
                                                'Kirim Tiket'
                                            )}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    )}

                    {/* TICKET STATUS / WAITING VIEW */}
                    {chatView === 'ticket_status' && (
                        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-white text-center font-sans">
                            <div className="h-16 w-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 border border-emerald-100 mb-5 animate-pulse">
                                <Clock size={32} />
                            </div>

                            <h3 className="text-base font-black text-slate-800">Tiket berhasil dibuat.</h3>
                            <p className="text-xs text-slate-400 font-mono mt-1 select-all">
                                Nomor Tiket: <span className="font-bold text-slate-900 bg-slate-50 px-1.5 py-0.5 rounded border">{activeTicket?.nomor_tiket}</span>
                            </p>
                            <p className="text-xs text-slate-500 font-semibold mt-3">
                                Status: <span className="text-emerald-600 font-bold">{activeTicket?.status}</span>
                            </p>

                            <div className="mt-8 p-4 rounded-2xl bg-slate-50 border text-left text-xs space-y-2 text-slate-600 w-full max-w-sm">
                                <div className="flex justify-between border-b pb-1.5 font-bold">
                                    <span>Nama</span>
                                    <span className="text-slate-800 font-normal">{activeTicket?.nama_lengkap}</span>
                                </div>
                                <div className="flex justify-between border-b pb-1.5 font-bold">
                                    <span>Kategori</span>
                                    <span className="text-slate-800 font-normal">{activeTicket?.kategori}</span>
                                </div>
                                <div className="flex justify-between pb-1.5 font-bold">
                                    <span>Subjek</span>
                                    <span className="text-slate-800 font-normal truncate max-w-[150px]">{activeTicket?.judul}</span>
                                </div>
                            </div>

                            <p className="text-xs leading-relaxed text-slate-400 mt-6 max-w-xs">
                                Mohon tunggu beberapa saat. Halaman ini akan beralih ke ruang live chat secara otomatis setelah Admin menyetujui tiket bantuan Anda.
                            </p>

                            <button
                                type="button"
                                onClick={() => setChatView('ai_chat')}
                                className="mt-8 px-5 py-2.5 rounded-xl border border-slate-200 text-slate-500 font-bold hover:bg-slate-50 text-xs transition"
                            >
                                Kembali ke Asisten AI
                            </button>
                        </div>
                    )}

                    {/* LIVE CHAT WORKSPACE */}
                    {chatView === 'ticket_live_chat' && (
                        <div className="flex-1 flex flex-col bg-white overflow-hidden font-sans">
                            {/* Chat messages box */}
                            <div
                                ref={chatBodyRef}
                                className="flex-1 overflow-y-auto bg-slate-50 p-4 space-y-4"
                            >
                                <div className="text-center my-2">
                                    <span className="inline-block bg-slate-200/60 text-[10px] font-black uppercase tracking-wider text-slate-500 rounded-full px-3 py-1 border border-slate-300/40">
                                        Percakapan Dimulai
                                    </span>
                                </div>

                                {ticketMessages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={[
                                            'flex flex-col gap-1',
                                            msg.is_admin ? 'items-start' : 'items-end',
                                        ].join(' ')}
                                    >
                                        <div
                                            className={[
                                                'max-w-[80%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-sm',
                                                msg.is_admin
                                                    ? 'bg-white border border-slate-200 text-slate-700 rounded-tl-none'
                                                    : 'bg-emerald-700 text-white rounded-tr-none',
                                            ].join(' ')}
                                        >
                                            <p>{msg.message}</p>
                                        </div>
                                        <span className="px-1 text-[9px] text-slate-400 font-bold">
                                            {msg.is_admin ? 'Admin' : 'Anda'} • {msg.created_at}
                                        </span>
                                    </div>
                                ))}

                                {adminIsTyping && (
                                    <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-500 shadow-sm w-max animate-pulse">
                                        <Loader2 className="animate-spin text-emerald-700" size={13} />
                                        Admin sedang mengetik...
                                    </div>
                                )}
                            </div>

                            {/* Ticket closed footer or standard input form */}
                            {activeTicket?.status === 'Selesai' ? (
                                <div className="border-t bg-slate-50 p-5 text-center flex flex-col items-center">
                                    <div className="h-10 w-10 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mb-2.5">
                                        <CheckCircle size={20} />
                                    </div>
                                    <h4 className="text-xs font-black text-slate-800">Tiket Telah Diselesaikan</h4>
                                    <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
                                        Admin telah menutup tiket bantuan ini. Chat ini sekarang bersifat baca-saja.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={handleClearActiveTicket}
                                        className="mt-4 w-full py-2.5 rounded-xl bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800 transition shadow-lg"
                                    >
                                        Buat Tiket Baru
                                    </button>
                                </div>
                            ) : (
                                <form
                                    onSubmit={handleSendChatMessage}
                                    className="border-t border-slate-200 bg-white p-3 flex items-center gap-2"
                                >
                                    <div className="flex-1 relative">
                                        <input
                                            type="text"
                                            value={chatInput}
                                            onChange={handleChatInputChange}
                                            placeholder="Tulis pesan Anda..."
                                            className="w-full rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 pr-10 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={!chatInput.trim()}
                                        className="h-9 w-9 shrink-0 flex items-center justify-center rounded-full bg-emerald-700 text-white shadow-md hover:bg-emerald-800 active:scale-95 transition disabled:opacity-50"
                                    >
                                        <Send size={15} />
                                    </button>
                                </form>
                            )}
                        </div>
                    )}

                    {/* Chatbot footer bottom brand for AI Chat view */}
                    {chatView === 'ai_chat' && (
                        <div className="border-t border-slate-200 bg-white px-4 py-3 shrink-0">
                            <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
                                {activeQuickActions.map((action) => (
                                    <button
                                        key={action}
                                        type="button"
                                        onClick={() => void sendMessage(action)}
                                        className="shrink-0 rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-xs font-bold text-emerald-700 transition hover:bg-emerald-50"
                                    >
                                        {action}
                                    </button>
                                ))}
                            </div>

                            <form
                                onSubmit={submit}
                                className="rounded-full border border-slate-200 bg-slate-50 p-1.5 transition focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-100"
                            >
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-white hover:text-emerald-700"
                                    >
                                        <Paperclip size={18} />
                                    </button>

                                    <input
                                        value={input}
                                        onChange={(event) => setInput(event.target.value)}
                                        placeholder={
                                            isLoggedIn
                                                ? 'Tulis pertanyaan layanan warga...'
                                                : 'Tulis pertanyaan layanan publik...'
                                        }
                                        className="min-w-0 flex-1 border-none bg-transparent px-1 text-sm text-slate-800 placeholder:text-slate-400 focus:ring-0 focus:outline-none"
                                    />

                                    <button
                                        type="button"
                                        className="hidden h-9 w-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-white hover:text-emerald-700 sm:flex"
                                    >
                                        <Mic size={18} />
                                    </button>

                                    <button
                                        type="submit"
                                        disabled={!input.trim() || isTyping}
                                        className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-700 text-white shadow-lg shadow-emerald-700/20 transition hover:bg-emerald-800 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <Send size={18} />
                                    </button>
                                </div>
                            </form>

                            <p className="mt-2 text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                                Secured by SMART-RT Digital Systems
                            </p>
                        </div>
                    )}
                </div>
            )}

            <button
                type="button"
                onClick={() => setIsOpen((current) => !current)}
                className="group relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-700 to-teal-500 text-white shadow-2xl shadow-emerald-700/30 transition hover:scale-110 active:scale-95"
                aria-label="Buka chatbot"
            >
                {!isOpen && <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-emerald-500 opacity-30" />}
                {isOpen ? <X size={28} /> : <MessageCircle size={28} />}
                {!isOpen && activeTicket && (
                    <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-red-500 text-[9px] font-black">
                        1
                    </span>
                )}
            </button>
        </div>
    );
}