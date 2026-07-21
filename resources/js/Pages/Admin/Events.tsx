import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router, useForm } from '@inertiajs/react';
import {
    Calendar,
    CalendarCheck,
    CalendarClock,
    CalendarX,
    ChevronLeft,
    ChevronRight,
    DollarSign,
    Edit,
    Eye,
    FilterX,
    Image,
    MapPin,
    MoreVertical,
    Plus,
    Search,
    Trash2,
    Users,
    Wallet,
    X,
    Zap,
    Clock,
    TrendingUp,
} from 'lucide-react';
import { FormEvent, useMemo, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

export interface BudgetItem {
    id?: number;
    name: string;
    quantity: number;
    unitPrice: number;
    subtotal?: number;
    notes?: string | null;
}

export interface Expense {
    id: number;
    date: string;
    name: string;
    category: string;
    amount: number;
    paymentMethod: string;
    hasProof: boolean;
    notes?: string | null;
}

export interface EventItem {
    id: number;
    title: string;
    date: string;
    location: string;
    category: string;
    needsBudget: boolean;
    estimatedCost: number;
    status: 'Draft' | 'Dijadwalkan' | 'Berlangsung' | 'Selesai' | 'Dibatalkan' | string;
    startTime?: string | null;
    endTime?: string | null;
    description?: string | null;
    responsible?: string | null;
    targetParticipants?: number | null;
    mandatory?: boolean;
    budgetSource?: string | null;
    financeResponsible?: string | null;
    budgetNotes?: string | null;
    posterUrl?: string | null;
    notes?: string | null;
    hasilKegiatan?: string | null;
    fotoDokumentasiUrls?: string[];
    budgetItems?: BudgetItem[];
    expenses?: Expense[];
    actualCost?: number;
}

interface EventsProps {
    events?: EventItem[];
    flash?: {
        success?: string;
        error?: string;
    };
}

type BudgetFormItem = {
    name: string;
    quantity: string;
    unit_price: string;
    notes: string;
};

type EventFormData = {
    judul: string;
    tanggal: string;
    jam_mulai: string;
    jam_selesai: string;
    lokasi: string;
    kategori: string;
    memerlukan_dana: boolean;
    estimasi_biaya: string;
    status_kegiatan: string;
    deskripsi: string;
    penanggung_jawab: string;
    target_peserta: string;
    wajib_hadir: boolean;
    sumber_dana: string;
    penanggung_jawab_dana: string;
    catatan_anggaran: string;
    poster: File | null;
    catatan: string;
    foto_dokumentasi: File[] | null;
    budget_items: BudgetFormItem[];
};

type ExpenseFormData = {
    tanggal_pengeluaran: string;
    nama_pengeluaran: string;
    kategori_pengeluaran: string;
    nominal: string;
    metode_pembayaran: string;
    bukti_pembayaran: File | null;
    keterangan: string;
};

function emptyBudgetItem(): BudgetFormItem {
    return { name: '', quantity: '1', unit_price: '0', notes: '' };
}

function emptyForm(): EventFormData {
    return {
        judul: '', tanggal: '', jam_mulai: '', jam_selesai: '', lokasi: '',
        kategori: 'Kerja Bakti', memerlukan_dana: false, estimasi_biaya: '0',
        status_kegiatan: 'Draft', deskripsi: '', penanggung_jawab: '',
        target_peserta: '', wajib_hadir: false, sumber_dana: '',
        penanggung_jawab_dana: '', catatan_anggaran: '', poster: null,
        catatan: '', foto_dokumentasi: null, budget_items: [emptyBudgetItem()],
    };
}

function emptyExpenseForm(): ExpenseFormData {
    return {
        tanggal_pengeluaran: '', nama_pengeluaran: '', kategori_pengeluaran: 'Konsumsi',
        nominal: '', metode_pembayaran: 'Tunai', bukti_pembayaran: null, keterangan: '',
    };
}

function formatCurrency(amount: number) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount || 0);
}

function formatDate(value?: string | null) {
    if (!value) return '-';
    return new Date(value).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatShortDate(value?: string | null) {
    if (!value) return '-';
    return new Date(value).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
}

function toTimeInputValue(value?: string | null) {
    if (!value) return '';
    return value.slice(0, 5);
}

function normalizeEventPayload(data: EventFormData, method?: 'put') {
    return {
        ...data,
        jam_mulai: toTimeInputValue(data.jam_mulai),
        jam_selesai: toTimeInputValue(data.jam_selesai),
        memerlukan_dana: data.memerlukan_dana ? '1' : '0',
        wajib_hadir: data.wajib_hadir ? '1' : '0',
        estimasi_biaya: data.estimasi_biaya || '0',
        target_peserta: data.target_peserta || '',
        ...(method ? { _method: method } : {}),
    };
}

function getStatusConfig(status: string) {
    switch (status) {
        case 'Draft':
            return { cls: 'bg-slate-500/20 text-slate-300 border border-slate-500/30', dot: 'bg-slate-400' };
        case 'Dijadwalkan':
            return { cls: 'bg-blue-500/20 text-blue-300 border border-blue-500/30', dot: 'bg-blue-400' };
        case 'Berlangsung':
            return { cls: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30', dot: 'bg-emerald-400' };
        case 'Selesai':
            return { cls: 'bg-purple-500/20 text-purple-300 border border-purple-500/30', dot: 'bg-purple-400' };
        case 'Dibatalkan':
            return { cls: 'bg-red-500/20 text-red-300 border border-red-500/30', dot: 'bg-red-400' };
        default:
            return { cls: 'bg-slate-500/20 text-slate-300 border border-slate-500/30', dot: 'bg-slate-400' };
    }
}

function getCategoryColor(category: string) {
    const map: Record<string, string> = {
        'Kerja Bakti': 'text-green-400 bg-green-400/10',
        'Rapat Warga': 'text-blue-400 bg-blue-400/10',
        'Keamanan/Ronda': 'text-orange-400 bg-orange-400/10',
        'Kesehatan': 'text-pink-400 bg-pink-400/10',
        'Sosial': 'text-yellow-400 bg-yellow-400/10',
        'Keagamaan': 'text-purple-400 bg-purple-400/10',
        'Pendidikan': 'text-cyan-400 bg-cyan-400/10',
        'Olahraga': 'text-emerald-400 bg-emerald-400/10',
    };
    return map[category] || 'text-slate-400 bg-slate-400/10';
}

function getBudgetStatus(event: EventItem) {
    const actualCost = event.actualCost || 0;
    if (!event.needsBudget) return 'Tanpa Dana';
    if (actualCost === event.estimatedCost) return 'Sesuai Anggaran';
    if (actualCost > event.estimatedCost) return 'Melebihi Anggaran';
    return 'Sisa Dana';
}

/* ── Dark Form Field ── */
const inputCls = 'w-full rounded-xl border border-[#1C2541]/60 bg-[#0B132B]/80 px-3 py-2.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition text-sm';
const labelCls = 'mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400';

export default function Events({ events = [], flash }: EventsProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterBudget, setFilterBudget] = useState('all');
    const [calendarMonth, setCalendarMonth] = useState(() => new Date());
    const [showDetailModal, setShowDetailModal] = useState<EventItem | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState<EventItem | null>(null);
    const [showBudgetModal, setShowBudgetModal] = useState<EventItem | null>(null);
    const [showFormModal, setShowFormModal] = useState(false);
    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
    const [editingId, setEditingId] = useState<number | null>(null);
    const [expenseEventId, setExpenseEventId] = useState<number | null>(null);

    const form = useForm<EventFormData>(emptyForm());
    const expenseForm = useForm<ExpenseFormData>(emptyExpenseForm());

    const filteredEvents = useMemo(() => {
        return events.filter((event) => {
            const keyword = searchTerm.toLowerCase().trim();
            const matchSearch = keyword === '' || event.title.toLowerCase().includes(keyword) ||
                (event.location || '').toLowerCase().includes(keyword) ||
                (event.responsible || '').toLowerCase().includes(keyword);
            const matchCategory = filterCategory === 'all' || event.category === filterCategory;
            const matchStatus = filterStatus === 'all' || event.status === filterStatus;
            const matchBudget = filterBudget === 'all' ||
                (filterBudget === 'Ya' && event.needsBudget) ||
                (filterBudget === 'Tidak' && !event.needsBudget);
            return matchSearch && matchCategory && matchStatus && matchBudget;
        });
    }, [events, searchTerm, filterCategory, filterStatus, filterBudget]);

    const summary = useMemo(() => ({
        total: events.length,
        aktif: events.filter(e => e.status === 'Dijadwalkan' || e.status === 'Berlangsung').length,
        dijadwalkan: events.filter(e => e.status === 'Dijadwalkan').length,
        selesai: events.filter(e => e.status === 'Selesai').length,
        perluDana: events.filter(e => e.needsBudget).length,
        totalEstimasi: events.reduce((s, e) => s + (e.estimatedCost || 0), 0),
        totalAktual: events.reduce((s, e) => s + (e.actualCost || 0), 0),
    }), [events]);

    /* Calendar helpers */
    const calYear = calendarMonth.getFullYear();
    const calMon = calendarMonth.getMonth();
    const firstDayOfMonth = new Date(calYear, calMon, 1).getDay();
    const daysInMonth = new Date(calYear, calMon + 1, 0).getDate();
    const eventDates = new Set(events.map(e => e.date));
    const upcomingEvents = events
        .filter(e => e.status === 'Dijadwalkan' || e.status === 'Berlangsung')
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, 5);
    const monthNames = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

    const resetFilters = () => { setSearchTerm(''); setFilterCategory('all'); setFilterStatus('all'); setFilterBudget('all'); };
    const budgetPreviewTotal = useMemo(() => form.data.budget_items.reduce((s, i) => s + Number(i.quantity || 0) * Number(i.unit_price || 0), 0), [form.data.budget_items]);

    const resetForm = () => { form.setData(emptyForm()); form.clearErrors(); setEditingId(null); setFormMode('create'); };
    const openCreateModal = () => { resetForm(); setShowFormModal(true); };
    const openEditModal = (event: EventItem) => {
        setEditingId(event.id); setFormMode('edit');
        form.setData({
            judul: event.title || '', tanggal: event.date || '',
            jam_mulai: toTimeInputValue(event.startTime), jam_selesai: toTimeInputValue(event.endTime),
            lokasi: event.location || '', kategori: event.category || 'Kerja Bakti',
            memerlukan_dana: event.needsBudget || false, estimasi_biaya: String(event.estimatedCost || 0),
            status_kegiatan: event.status || 'Draft', deskripsi: event.description || '',
            penanggung_jawab: event.responsible || '',
            target_peserta: event.targetParticipants ? String(event.targetParticipants) : '',
            wajib_hadir: event.mandatory || false, sumber_dana: event.budgetSource || '',
            penanggung_jawab_dana: event.financeResponsible || '', catatan_anggaran: event.budgetNotes || '',
            poster: null, catatan: event.notes || '', foto_dokumentasi: null,
            budget_items: event.budgetItems && event.budgetItems.length > 0
                ? event.budgetItems.map(i => ({ name: i.name || '', quantity: String(i.quantity || 1), unit_price: String(i.unitPrice || 0), notes: i.notes || '' }))
                : [emptyBudgetItem()],
        });
        form.clearErrors(); setShowFormModal(true);
    };
    const closeFormModal = () => { setShowFormModal(false); resetForm(); };
    const openExpenseModal = (event: EventItem) => { setExpenseEventId(event.id); expenseForm.setData(emptyExpenseForm()); expenseForm.clearErrors(); setShowExpenseModal(true); };
    const closeExpenseModal = () => { setShowExpenseModal(false); setExpenseEventId(null); expenseForm.setData(emptyExpenseForm()); expenseForm.clearErrors(); };
    const updateBudgetItem = (index: number, field: keyof BudgetFormItem, value: string) => {
        const nextItems = [...form.data.budget_items];
        nextItems[index] = { ...nextItems[index], [field]: value };
        form.setData('budget_items', nextItems);
    };
    const addBudgetItem = () => form.setData('budget_items', [...form.data.budget_items, emptyBudgetItem()]);
    const removeBudgetItem = (index: number) => {
        if (form.data.budget_items.length === 1) { form.setData('budget_items', [emptyBudgetItem()]); return; }
        form.setData('budget_items', form.data.budget_items.filter((_, i) => i !== index));
    };
    const submitForm = (e: FormEvent) => {
        e.preventDefault();
        const payload = normalizeEventPayload(form.data, formMode === 'edit' ? 'put' : undefined);
        if (formMode === 'edit' && editingId !== null) {
            router.post(route('admin.events.update', { kegiatan: editingId }), payload, { forceFormData: true, preserveScroll: true, onSuccess: () => closeFormModal(), onError: (errors) => form.setError(errors) });
            return;
        }
        router.post(route('admin.events.store'), payload, { forceFormData: true, preserveScroll: true, onSuccess: () => closeFormModal(), onError: (errors) => form.setError(errors) });
    };
    const submitExpense = (e: FormEvent) => {
        e.preventDefault();
        if (expenseEventId === null) return;
        expenseForm.post(route('admin.events.expenses.store', { kegiatan: expenseEventId }), { forceFormData: true, preserveScroll: true, onSuccess: () => closeExpenseModal() });
    };
    const handleDelete = () => {
        if (!showDeleteModal) return;
        router.delete(route('admin.events.destroy', { kegiatan: showDeleteModal.id }), { preserveScroll: true, onSuccess: () => setShowDeleteModal(null) });
    };

    return (
        <AdminLayout activeMenu="events">
            <Head title="Manajemen Kegiatan" />

            {/* ── Page Header ── */}
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400 mb-1">RT Management</p>
                    <h2 className="text-2xl font-black text-white">Manajemen Kegiatan</h2>
                    <p className="text-slate-400 text-sm mt-1">Kelola agenda, anggaran, dan dokumentasi kegiatan warga RT.</p>
                </div>
                <div className="flex items-center gap-3">
                    {(filterCategory !== 'all' || filterStatus !== 'all' || filterBudget !== 'all' || searchTerm) && (
                        <button onClick={resetFilters} className="flex items-center gap-2 rounded-xl border border-[#1C2541]/60 bg-[#0B132B]/50 px-4 py-2.5 text-sm text-slate-400 hover:text-white transition">
                            <FilterX size={16} /> Reset
                        </button>
                    )}
                    <button onClick={openCreateModal} className="flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-[#0B132B] shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 transition">
                        <Plus size={18} /> Tambah Kegiatan
                    </button>
                </div>
            </div>

            {/* ── Flash Messages ── */}
            {flash?.success && <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">{flash.success}</div>}
            {flash?.error && <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{flash.error}</div>}

            {/* ── Stats Row ── */}
            <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
                {[
                    { icon: CalendarClock, label: 'Total Kegiatan', value: summary.total, color: 'text-blue-400', bg: 'bg-blue-400/10 border-blue-400/20' },
                    { icon: CalendarCheck, label: 'Kegiatan Aktif', value: summary.aktif, color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/20' },
                    { icon: CalendarX, label: 'Telah Selesai', value: summary.selesai, color: 'text-purple-400', bg: 'bg-purple-400/10 border-purple-400/20' },
                    { icon: Wallet, label: 'Perlu Dana', value: summary.perluDana, color: 'text-amber-400', bg: 'bg-amber-400/10 border-amber-400/20' },
                ].map(({ icon: Icon, label, value, color, bg }) => (
                    <div key={label} className="rounded-2xl border border-[#1C2541]/60 bg-[#0B132B]/60 p-5 backdrop-blur-sm">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
                            <div className={`rounded-lg border p-2 ${bg}`}>
                                <Icon size={16} className={color} />
                            </div>
                        </div>
                        <p className={`text-3xl font-black ${color}`}>{value}</p>
                    </div>
                ))}
            </div>

            {/* ── Main Content: Calendar + Table ── */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Calendar + Upcoming */}
                <div className="lg:col-span-1 space-y-4">
                    {/* Mini Calendar */}
                    <div className="rounded-2xl border border-[#1C2541]/60 bg-[#0B132B]/60 p-5 backdrop-blur-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-white">{monthNames[calMon]} {calYear}</h3>
                            <div className="flex gap-1">
                                <button onClick={() => setCalendarMonth(new Date(calYear, calMon - 1))} className="rounded-lg p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-emerald-400/10 transition">
                                    <ChevronLeft size={16} />
                                </button>
                                <button onClick={() => setCalendarMonth(new Date(calYear, calMon + 1))} className="rounded-lg p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-emerald-400/10 transition">
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                        <div className="grid grid-cols-7 mb-2">
                            {['Min','Sen','Sel','Rab','Kam','Jum','Sab'].map(d => (
                                <div key={d} className="text-center text-[10px] font-bold text-slate-500 py-1">{d}</div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7 gap-0.5">
                            {Array.from({ length: firstDayOfMonth }, (_, i) => (
                                <div key={`empty-${i}`} />
                            ))}
                            {Array.from({ length: daysInMonth }, (_, i) => {
                                const day = i + 1;
                                const dateStr = `${calYear}-${String(calMon + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                const hasEvent = eventDates.has(dateStr);
                                const isToday = dateStr === new Date().toISOString().split('T')[0];
                                return (
                                    <div key={day} className={`relative flex items-center justify-center rounded-lg text-xs font-medium h-8 transition cursor-default
                                        ${isToday ? 'bg-emerald-500 text-[#0B132B] font-black' : hasEvent ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:bg-[#111A2E]'}`}>
                                        {day}
                                        {hasEvent && !isToday && <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-400" />}
                                    </div>
                                );
                            })}
                        </div>
                        <div className="mt-3 pt-3 border-t border-[#1C2541]/40 flex items-center gap-3 text-[10px] text-slate-500">
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Hari ini</span>
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400/40 border border-emerald-500/30 inline-block" /> Ada kegiatan</span>
                        </div>
                    </div>

                    {/* Agenda Mendatang */}
                    <div className="rounded-2xl border border-[#1C2541]/60 bg-[#0B132B]/60 p-5 backdrop-blur-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-white">Agenda Mendatang</h3>
                            <span className="text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">TOTAL: {summary.aktif}</span>
                        </div>
                        {upcomingEvents.length === 0 ? (
                            <p className="text-xs text-slate-500 text-center py-4">Tidak ada agenda mendatang</p>
                        ) : (
                            <div className="space-y-3">
                                {upcomingEvents.map(event => {
                                    const statusConf = getStatusConfig(event.status);
                                    return (
                                        <div key={event.id} className="flex gap-3 p-3 rounded-xl bg-[#111A2E]/60 border border-[#1C2541]/40 hover:border-emerald-500/20 transition">
                                            <div className="flex-shrink-0 text-center">
                                                <div className="text-[10px] font-bold text-emerald-400 uppercase">{new Date(event.date).toLocaleDateString('id-ID', { month: 'short' })}</div>
                                                <div className="text-lg font-black text-white leading-none">{new Date(event.date).getDate()}</div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold text-white truncate">{event.title}</p>
                                                <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5"><MapPin size={10} />{event.location}</p>
                                                <span className={`mt-1 inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusConf.cls}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${statusConf.dot}`} />{event.status}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Budget Summary */}
                    {summary.perluDana > 0 && (
                        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
                            <div className="flex items-center gap-2 mb-3">
                                <TrendingUp size={16} className="text-amber-400" />
                                <h3 className="text-sm font-bold text-white">Ringkasan Anggaran</h3>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-400">Total Estimasi</span>
                                    <span className="font-bold text-amber-300">{formatCurrency(summary.totalEstimasi)}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-400">Total Aktual</span>
                                    <span className="font-bold text-white">{formatCurrency(summary.totalAktual)}</span>
                                </div>
                                <div className="h-px bg-[#1C2541]/60 my-1" />
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-400">Selisih</span>
                                    <span className={`font-bold ${summary.totalAktual > summary.totalEstimasi ? 'text-red-400' : 'text-emerald-400'}`}>
                                        {formatCurrency(Math.abs(summary.totalEstimasi - summary.totalAktual))}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Events Table */}
                <div className="lg:col-span-2">
                    <div className="rounded-2xl border border-[#1C2541]/60 bg-[#0B132B]/60 backdrop-blur-sm overflow-hidden">
                        {/* Filters */}
                        <div className="p-4 border-b border-[#1C2541]/40">
                            <div className="flex flex-col gap-3 sm:flex-row">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
                                    <input
                                        type="text"
                                        placeholder="Cari kegiatan, lokasi, PJ..."
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        className="w-full rounded-xl border border-[#1C2541]/60 bg-[#111A2E]/60 py-2.5 pl-9 pr-4 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                                    />
                                </div>
                                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="rounded-xl border border-[#1C2541]/60 bg-[#111A2E]/60 px-3 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500 transition">
                                    <option value="all">Semua Status</option>
                                    <option value="Draft">Draft</option>
                                    <option value="Dijadwalkan">Dijadwalkan</option>
                                    <option value="Berlangsung">Berlangsung</option>
                                    <option value="Selesai">Selesai</option>
                                    <option value="Dibatalkan">Dibatalkan</option>
                                </select>
                                <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="rounded-xl border border-[#1C2541]/60 bg-[#111A2E]/60 px-3 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500 transition">
                                    <option value="all">Semua Kategori</option>
                                    <option value="Kerja Bakti">Kerja Bakti</option>
                                    <option value="Rapat Warga">Rapat Warga</option>
                                    <option value="Keamanan/Ronda">Keamanan/Ronda</option>
                                    <option value="Kesehatan">Kesehatan</option>
                                    <option value="Sosial">Sosial</option>
                                    <option value="Keagamaan">Keagamaan</option>
                                    <option value="Pendidikan">Pendidikan</option>
                                    <option value="Olahraga">Olahraga</option>
                                    <option value="Lainnya">Lainnya</option>
                                </select>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[800px]">
                                <thead>
                                    <tr className="border-b border-[#1C2541]/40">
                                        <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-500">Kegiatan</th>
                                        <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-500">Tanggal</th>
                                        <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-500">Kategori</th>
                                        <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-500">Anggaran</th>
                                        <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-500">Status</th>
                                        <th className="w-12 px-4 py-3" />
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredEvents.map(event => {
                                        const statusConf = getStatusConfig(event.status);
                                        const catCls = getCategoryColor(event.category);
                                        return (
                                            <tr key={event.id} className="border-b border-[#1C2541]/30 hover:bg-[#111A2E]/50 transition group">
                                                <td className="px-4 py-4">
                                                    <p className="text-sm font-bold text-white group-hover:text-emerald-300 transition">{event.title}</p>
                                                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><MapPin size={10} />{event.location || '-'}</p>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-1.5">
                                                        <Calendar size={12} className="text-emerald-400" />
                                                        <span className="text-xs text-slate-300">{formatShortDate(event.date)}</span>
                                                    </div>
                                                    {event.startTime && <p className="text-[10px] text-slate-500 mt-0.5">{event.startTime} - {event.endTime || '?'}</p>}
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] font-bold ${catCls}`}>
                                                        <Zap size={10} />{event.category}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4">
                                                    {event.needsBudget ? (
                                                        <div>
                                                            <p className="text-xs font-bold text-amber-300">{formatCurrency(event.estimatedCost)}</p>
                                                            <p className="text-[10px] text-slate-500">estimasi</p>
                                                        </div>
                                                    ) : (
                                                        <span className="text-[10px] text-slate-600">Tanpa Dana</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-bold ${statusConf.cls}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${statusConf.dot}`} />{event.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <DropdownMenu.Root>
                                                        <DropdownMenu.Trigger asChild>
                                                            <button type="button" className="rounded-lg p-2 text-slate-500 hover:text-emerald-400 hover:bg-emerald-400/10 transition">
                                                                <MoreVertical size={16} />
                                                            </button>
                                                        </DropdownMenu.Trigger>
                                                        <DropdownMenu.Portal>
                                                            <DropdownMenu.Content className="z-50 w-48 rounded-xl border border-[#1C2541]/60 bg-[#0B132B] py-1.5 shadow-2xl" sideOffset={5}>
                                                                <DropdownMenu.Item className="flex cursor-pointer items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-slate-300 outline-none hover:bg-emerald-500/10 hover:text-emerald-300 transition" onClick={() => setShowDetailModal(event)}>
                                                                    <Eye size={14} /> Detail
                                                                </DropdownMenu.Item>
                                                                <DropdownMenu.Item className="flex cursor-pointer items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-slate-300 outline-none hover:bg-blue-500/10 hover:text-blue-300 transition" onClick={() => openEditModal(event)}>
                                                                    <Edit size={14} /> Edit
                                                                </DropdownMenu.Item>
                                                                <DropdownMenu.Item className="flex cursor-pointer items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-slate-300 outline-none hover:bg-amber-500/10 hover:text-amber-300 transition" onClick={() => setShowBudgetModal(event)}>
                                                                    <DollarSign size={14} /> Kelola Dana
                                                                </DropdownMenu.Item>
                                                                <DropdownMenu.Item className="flex cursor-pointer items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-slate-300 outline-none hover:bg-purple-500/10 hover:text-purple-300 transition" onClick={() => setShowDetailModal(event)}>
                                                                    <Image size={14} /> Dokumentasi
                                                                </DropdownMenu.Item>
                                                                <DropdownMenu.Separator className="my-1 h-px bg-[#1C2541]/60" />
                                                                <DropdownMenu.Item className="flex cursor-pointer items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-red-400 outline-none hover:bg-red-500/10 transition" onClick={() => setShowDeleteModal(event)}>
                                                                    <Trash2 size={14} /> Hapus
                                                                </DropdownMenu.Item>
                                                            </DropdownMenu.Content>
                                                        </DropdownMenu.Portal>
                                                    </DropdownMenu.Root>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        {filteredEvents.length === 0 && (
                            <div className="py-16 text-center">
                                <CalendarClock size={40} className="text-slate-600 mx-auto mb-3" />
                                <p className="text-slate-500 text-sm">Belum ada kegiatan yang sesuai filter.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── MODALS (dark theme) ── */}

            {/* Create / Edit Form Modal */}
            <Dialog.Root open={showFormModal} onOpenChange={open => !open && closeFormModal()}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" />
                    <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[92vh] w-full max-w-5xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-[#1C2541]/60 bg-[#090E1A] shadow-2xl">
                        <div className="sticky top-0 flex items-center justify-between border-b border-[#1C2541]/40 bg-[#090E1A]/95 backdrop-blur-sm px-6 py-4 z-10">
                            <div>
                                <Dialog.Title className="text-lg font-black text-white">{formMode === 'create' ? 'Tambah Kegiatan' : 'Edit Kegiatan'}</Dialog.Title>
                                <Dialog.Description className="text-xs text-slate-400 mt-0.5">Isi data kegiatan RT di bawah ini</Dialog.Description>
                            </div>
                            <Dialog.Close asChild>
                                <button type="button" className="rounded-xl p-2 text-slate-400 hover:text-white hover:bg-[#1C2541]/60 transition"><X size={20} /></button>
                            </Dialog.Close>
                        </div>
                        <form onSubmit={submitForm} className="space-y-6 p-6">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="md:col-span-2">
                                    <label className={labelCls}>Judul Kegiatan</label>
                                    <input type="text" value={form.data.judul} onChange={e => form.setData('judul', e.target.value)} className={inputCls} placeholder="Nama kegiatan RT" />
                                    {form.errors.judul && <p className="mt-1 text-xs text-red-400">{form.errors.judul}</p>}
                                </div>
                                <div>
                                    <label className={labelCls}>Tanggal</label>
                                    <input type="date" value={form.data.tanggal} onChange={e => form.setData('tanggal', e.target.value)} className={inputCls} />
                                </div>
                                <div>
                                    <label className={labelCls}>Kategori</label>
                                    <select value={form.data.kategori} onChange={e => form.setData('kategori', e.target.value)} className={inputCls}>
                                        {['Kerja Bakti','Rapat Warga','Keamanan/Ronda','Kesehatan','Sosial','Keagamaan','Pendidikan','Olahraga','Lainnya'].map(k => <option key={k} value={k}>{k}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className={labelCls}>Jam Mulai</label>
                                    <input type="time" value={form.data.jam_mulai} onChange={e => form.setData('jam_mulai', e.target.value)} className={inputCls} />
                                </div>
                                <div>
                                    <label className={labelCls}>Jam Selesai</label>
                                    <input type="time" value={form.data.jam_selesai} onChange={e => form.setData('jam_selesai', e.target.value)} className={inputCls} />
                                </div>
                                <div className="md:col-span-2">
                                    <label className={labelCls}>Lokasi</label>
                                    <input type="text" value={form.data.lokasi} onChange={e => form.setData('lokasi', e.target.value)} className={inputCls} placeholder="Alamat atau nama tempat" />
                                </div>
                                <div>
                                    <label className={labelCls}>Penanggung Jawab</label>
                                    <input type="text" value={form.data.penanggung_jawab} onChange={e => form.setData('penanggung_jawab', e.target.value)} className={inputCls} />
                                </div>
                                <div>
                                    <label className={labelCls}>Target Peserta</label>
                                    <input type="number" min="0" value={form.data.target_peserta} onChange={e => form.setData('target_peserta', e.target.value)} className={inputCls} />
                                </div>
                                <div>
                                    <label className={labelCls}>Status Kegiatan</label>
                                    <select value={form.data.status_kegiatan} onChange={e => form.setData('status_kegiatan', e.target.value)} className={inputCls}>
                                        {['Draft','Dijadwalkan','Berlangsung','Selesai','Dibatalkan'].map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div className="flex items-center gap-6 rounded-xl border border-[#1C2541]/60 bg-[#0B132B]/60 px-4 py-3">
                                    <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                                        <input type="checkbox" checked={form.data.wajib_hadir} onChange={e => form.setData('wajib_hadir', e.target.checked)} className="accent-emerald-500" />
                                        Wajib Hadir
                                    </label>
                                    <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                                        <input type="checkbox" checked={form.data.memerlukan_dana} onChange={e => form.setData('memerlukan_dana', e.target.checked)} className="accent-emerald-500" />
                                        Memerlukan Dana
                                    </label>
                                </div>
                                <div className="md:col-span-2">
                                    <label className={labelCls}>Deskripsi Kegiatan</label>
                                    <textarea rows={4} value={form.data.deskripsi} onChange={e => form.setData('deskripsi', e.target.value)} className={inputCls} />
                                </div>
                                <div className="md:col-span-2">
                                    <label className={labelCls}>Upload Poster (JPG/PNG)</label>
                                    <input type="file" accept=".jpg,.jpeg,.png,.webp" onChange={e => form.setData('poster', e.target.files?.[0] ?? null)} className={inputCls} />
                                </div>
                                <div className="md:col-span-2">
                                    <label className={labelCls}>Hasil Kegiatan / Catatan <span className="text-slate-600 font-normal normal-case">(teks rangkuman hasil)</span></label>
                                    <textarea rows={3} value={form.data.catatan} onChange={e => form.setData('catatan', e.target.value)} className={inputCls} placeholder="Tuliskan hasil, catatan, atau rangkuman kegiatan di sini..." />
                                </div>

                                <div className="md:col-span-2 space-y-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                                    <div className="flex items-center gap-2">
                                        <Image size={14} className="text-emerald-400" />
                                        <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Foto Dokumentasi Kegiatan</h4>
                                        <span className="text-[10px] text-slate-500">(maks. 10 foto, JPG/PNG/WEBP)</span>
                                    </div>
                                    <input
                                        type="file"
                                        accept=".jpg,.jpeg,.png,.webp"
                                        multiple
                                        onChange={e => form.setData('foto_dokumentasi', Array.from(e.target.files || []))}
                                        className={inputCls}
                                    />
                                    {/* Preview foto yang sudah ada (saat edit) */}
                                    {formMode === 'edit' && (() => {
                                        const editingEvent = events.find(e => e.id === editingId);
                                        const existingFotos = editingEvent?.fotoDokumentasiUrls ?? [];
                                        return existingFotos.length > 0 ? (
                                            <div className="space-y-2">
                                                <p className="text-[10px] text-slate-500 font-bold">Foto tersimpan ({existingFotos.length}):</p>
                                                <div className="grid grid-cols-4 gap-2">
                                                    {existingFotos.map((url, idx) => (
                                                        <div key={idx} className="relative rounded-lg overflow-hidden border border-slate-700 aspect-video bg-[#0B132B]">
                                                            <img src={url} alt={`Foto ${idx+1}`} className="w-full h-full object-cover" />
                                                        </div>
                                                    ))}
                                                </div>
                                                <p className="text-[10px] text-amber-400">Upload baru akan ditambahkan ke foto yang ada.</p>
                                            </div>
                                        ) : null;
                                    })()}
                                </div>
                            </div>

                            {form.data.memerlukan_dana && (
                                <div className="space-y-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
                                    <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2"><Wallet size={16} /> Informasi Anggaran</h3>
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <div>
                                            <label className={labelCls}>Sumber Dana</label>
                                            <select value={form.data.sumber_dana} onChange={e => form.setData('sumber_dana', e.target.value)} className={inputCls}>
                                                <option value="">Pilih sumber dana</option>
                                                {['Kas RT','Iuran Warga','Donasi Warga','Sponsor','Lainnya'].map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className={labelCls}>PJ Dana</label>
                                            <input type="text" value={form.data.penanggung_jawab_dana} onChange={e => form.setData('penanggung_jawab_dana', e.target.value)} className={inputCls} />
                                        </div>
                                        <div>
                                            <label className={labelCls}>Estimasi Total Biaya</label>
                                            <input type="number" min="0" value={form.data.estimasi_biaya} onChange={e => form.setData('estimasi_biaya', e.target.value)} className={inputCls} />
                                            <p className="mt-1 text-xs text-amber-400">Preview: {formatCurrency(budgetPreviewTotal)}</p>
                                        </div>
                                        <div>
                                            <label className={labelCls}>Catatan Anggaran</label>
                                            <textarea rows={2} value={form.data.catatan_anggaran} onChange={e => form.setData('catatan_anggaran', e.target.value)} className={inputCls} />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="mb-3 flex items-center justify-between">
                                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Rincian Kebutuhan Dana</h4>
                                            <button type="button" onClick={addBudgetItem} className="flex items-center gap-1 rounded-xl bg-emerald-500 px-3 py-1.5 text-xs font-bold text-[#0B132B] hover:bg-emerald-400 transition">
                                                <Plus size={14} /> Tambah Item
                                            </button>
                                        </div>
                                        <div className="space-y-3">
                                            {form.data.budget_items.map((item, index) => {
                                                const subtotal = Number(item.quantity || 0) * Number(item.unit_price || 0);
                                                return (
                                                    <div key={index} className="rounded-xl border border-[#1C2541]/60 bg-[#0B132B]/60 p-4">
                                                        <div className="grid grid-cols-12 gap-3">
                                                            <div className="col-span-4">
                                                                <label className={labelCls}>Nama</label>
                                                                <input type="text" value={item.name} onChange={e => updateBudgetItem(index, 'name', e.target.value)} className={inputCls} />
                                                            </div>
                                                            <div className="col-span-2">
                                                                <label className={labelCls}>Qty</label>
                                                                <input type="number" min="1" value={item.quantity} onChange={e => updateBudgetItem(index, 'quantity', e.target.value)} className={inputCls} />
                                                            </div>
                                                            <div className="col-span-3">
                                                                <label className={labelCls}>Harga Satuan</label>
                                                                <input type="number" min="0" value={item.unit_price} onChange={e => updateBudgetItem(index, 'unit_price', e.target.value)} className={inputCls} />
                                                            </div>
                                                            <div className="col-span-2">
                                                                <label className={labelCls}>Subtotal</label>
                                                                <div className="rounded-xl border border-[#1C2541]/60 bg-[#111A2E] px-3 py-2.5 text-xs font-bold text-amber-300">{formatCurrency(subtotal)}</div>
                                                            </div>
                                                            <div className="col-span-1 flex items-end">
                                                                <button type="button" onClick={() => removeBudgetItem(index)} className="w-full rounded-xl border border-red-500/30 py-2.5 text-xs text-red-400 hover:bg-red-500/10 transition">×</button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {Object.keys(form.errors).length > 0 && (
                                <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
                                    <div className="font-bold mb-2">Periksa kesalahan berikut:</div>
                                    <ul className="list-disc pl-4 space-y-1 text-xs">
                                        {Object.entries(form.errors).map(([field, message]) => <li key={field}>{message}</li>)}
                                    </ul>
                                </div>
                            )}

                            <div className="flex justify-end gap-3 border-t border-[#1C2541]/40 pt-4">
                                <button type="button" onClick={closeFormModal} className="rounded-xl border border-[#1C2541]/60 px-5 py-2.5 text-sm text-slate-400 hover:text-white hover:border-[#1C2541] transition">Batal</button>
                                <button type="submit" disabled={form.processing} className="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-[#0B132B] shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 transition disabled:opacity-60">
                                    {form.processing ? 'Menyimpan...' : formMode === 'create' ? 'Simpan Kegiatan' : 'Update Kegiatan'}
                                </button>
                            </div>
                        </form>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>

            {/* Expense Modal */}
            <Dialog.Root open={showExpenseModal} onOpenChange={open => !open && closeExpenseModal()}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" />
                    <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[#1C2541]/60 bg-[#090E1A] shadow-2xl">
                        <div className="flex items-center justify-between border-b border-[#1C2541]/40 px-6 py-4">
                            <div>
                                <Dialog.Title className="text-lg font-black text-white">Tambah Pengeluaran</Dialog.Title>
                                <Dialog.Description className="sr-only">Form tambah pengeluaran aktual kegiatan.</Dialog.Description>
                            </div>
                            <Dialog.Close asChild>
                                <button type="button" className="rounded-xl p-2 text-slate-400 hover:text-white hover:bg-[#1C2541]/60 transition"><X size={20} /></button>
                            </Dialog.Close>
                        </div>
                        <form onSubmit={submitExpense} className="space-y-4 p-6">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div><label className={labelCls}>Tanggal</label><input type="date" value={expenseForm.data.tanggal_pengeluaran} onChange={e => expenseForm.setData('tanggal_pengeluaran', e.target.value)} className={inputCls} /></div>
                                <div><label className={labelCls}>Nama Pengeluaran</label><input type="text" value={expenseForm.data.nama_pengeluaran} onChange={e => expenseForm.setData('nama_pengeluaran', e.target.value)} className={inputCls} /></div>
                                <div><label className={labelCls}>Kategori</label><select value={expenseForm.data.kategori_pengeluaran} onChange={e => expenseForm.setData('kategori_pengeluaran', e.target.value)} className={inputCls}>{['Konsumsi','Peralatan','Transportasi','Dekorasi','Dokumentasi','Honor/Jasa','Lainnya'].map(k => <option key={k} value={k}>{k}</option>)}</select></div>
                                <div><label className={labelCls}>Nominal</label><input type="number" min="0" value={expenseForm.data.nominal} onChange={e => expenseForm.setData('nominal', e.target.value)} className={inputCls} /></div>
                                <div><label className={labelCls}>Metode Pembayaran</label><select value={expenseForm.data.metode_pembayaran} onChange={e => expenseForm.setData('metode_pembayaran', e.target.value)} className={inputCls}>{['Tunai','Transfer','QRIS','Lainnya'].map(m => <option key={m} value={m}>{m}</option>)}</select></div>
                                <div><label className={labelCls}>Bukti Pembayaran</label><input type="file" accept=".jpg,.jpeg,.png,.pdf,.webp" onChange={e => expenseForm.setData('bukti_pembayaran', e.target.files?.[0] ?? null)} className={inputCls} /></div>
                                <div className="md:col-span-2"><label className={labelCls}>Keterangan</label><textarea rows={3} value={expenseForm.data.keterangan} onChange={e => expenseForm.setData('keterangan', e.target.value)} className={inputCls} /></div>
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={closeExpenseModal} className="rounded-xl border border-[#1C2541]/60 px-4 py-2.5 text-sm text-slate-400 hover:text-white transition">Batal</button>
                                <button type="submit" disabled={expenseForm.processing} className="rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-[#0B132B] hover:bg-emerald-400 transition disabled:opacity-60">
                                    {expenseForm.processing ? 'Menyimpan...' : 'Simpan Pengeluaran'}
                                </button>
                            </div>
                        </form>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>

            {/* Detail Modal */}
            <Dialog.Root open={showDetailModal !== null} onOpenChange={open => !open && setShowDetailModal(null)}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" />
                    <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-full max-w-3xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-[#1C2541]/60 bg-[#090E1A] shadow-2xl">
                        <div className="sticky top-0 flex items-center justify-between border-b border-[#1C2541]/40 bg-[#090E1A]/95 px-6 py-4 z-10">
                            <div>
                                <Dialog.Title className="text-lg font-black text-white">Detail Kegiatan</Dialog.Title>
                                <Dialog.Description className="sr-only">Detail kegiatan RT.</Dialog.Description>
                            </div>
                            <Dialog.Close asChild>
                                <button className="rounded-xl p-2 text-slate-400 hover:text-white hover:bg-[#1C2541]/60 transition"><X size={20} /></button>
                            </Dialog.Close>
                        </div>
                        {showDetailModal && (
                            <div className="space-y-5 p-6">
                                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5">
                                    <div className="flex items-start justify-between gap-3 mb-4">
                                        <h2 className="text-xl font-black text-white">{showDetailModal.title}</h2>
                                        <span className={`shrink-0 inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold ${getStatusConfig(showDetailModal.status).cls}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${getStatusConfig(showDetailModal.status).dot}`} />{showDetailModal.status}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        {[
                                            ['Kategori', showDetailModal.category],
                                            ['Tanggal', formatDate(showDetailModal.date)],
                                            ['Waktu', `${showDetailModal.startTime || '-'} - ${showDetailModal.endTime || '-'}`],
                                            ['Lokasi', showDetailModal.location],
                                            ['Penanggung Jawab', showDetailModal.responsible || '-'],
                                            ['Target Peserta', `${showDetailModal.targetParticipants || 0} orang`],
                                            ['Kehadiran', showDetailModal.mandatory ? 'Wajib Hadir' : 'Tidak Wajib'],
                                        ].map(([label, value]) => (
                                            <div key={label}>
                                                <p className="text-slate-500 text-xs">{label}</p>
                                                <p className="font-semibold text-white text-sm mt-0.5">{value}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Deskripsi Kegiatan</h3>
                                    <p className="rounded-xl bg-[#111A2E]/60 border border-[#1C2541]/40 p-4 text-sm text-slate-300 leading-relaxed">{showDetailModal.description || '-'}</p>
                                </div>
                                <div>
                                    <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Hasil Kegiatan / Catatan</h3>
                                    <p className="rounded-xl bg-[#111A2E]/60 border border-[#1C2541]/40 p-4 text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                                        {showDetailModal.hasilKegiatan || showDetailModal.notes || 'Belum ada hasil kegiatan yang dicatat.'}
                                    </p>
                                </div>
                                <div>
                                    <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                                        Foto Dokumentasi ({showDetailModal.fotoDokumentasiUrls?.length || 0})
                                    </h3>
                                    {(showDetailModal.fotoDokumentasiUrls?.length ?? 0) > 0 ? (
                                        <div className="grid grid-cols-3 gap-3">
                                            {showDetailModal.fotoDokumentasiUrls!.map((url, idx) => (
                                                <a key={idx} href={url} target="_blank" rel="noreferrer" className="group relative rounded-xl overflow-hidden border border-slate-700 aspect-video bg-[#0B132B] hover:border-emerald-500/50 transition">
                                                    <img src={url} alt={`Dokumentasi ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                                                </a>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="rounded-xl bg-[#111A2E]/40 border border-dashed border-[#1C2541]/40 p-4 text-center text-xs text-slate-500">
                                            Belum ada foto dokumentasi yang di-upload.
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>

            {/* Budget Modal */}
            <Dialog.Root open={showBudgetModal !== null} onOpenChange={open => !open && setShowBudgetModal(null)}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" />
                    <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-full max-w-5xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-[#1C2541]/60 bg-[#090E1A] shadow-2xl">
                        <div className="sticky top-0 flex items-center justify-between border-b border-[#1C2541]/40 bg-[#090E1A]/95 px-6 py-4 z-10">
                            <div>
                                <Dialog.Title className="text-lg font-black text-white">Kelola Dana Kegiatan</Dialog.Title>
                                <Dialog.Description className="sr-only">Kelola dana dan pengeluaran kegiatan.</Dialog.Description>
                            </div>
                            <Dialog.Close asChild>
                                <button className="rounded-xl p-2 text-slate-400 hover:text-white hover:bg-[#1C2541]/60 transition"><X size={20} /></button>
                            </Dialog.Close>
                        </div>
                        {showBudgetModal && (
                            <div className="space-y-6 p-6">
                                <div className="rounded-xl border border-[#1C2541]/60 bg-[#0B132B]/60 p-4">
                                    <h3 className="text-base font-black text-white mb-1">{showBudgetModal.title}</h3>
                                    <div className="flex gap-4 text-xs text-slate-400">
                                        <span>{formatDate(showBudgetModal.date)}</span>
                                        <span>Sumber: {showBudgetModal.budgetSource || '-'}</span>
                                        <span className="text-emerald-400 font-semibold">{getBudgetStatus(showBudgetModal)}</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                                    {[
                                        { label: 'Estimasi', value: showBudgetModal.estimatedCost, color: 'text-blue-300', bg: 'bg-blue-500/10 border-blue-500/20' },
                                        { label: 'Dana Tersedia', value: showBudgetModal.estimatedCost, color: 'text-emerald-300', bg: 'bg-emerald-500/10 border-emerald-500/20' },
                                        { label: 'Aktual', value: showBudgetModal.actualCost || 0, color: 'text-amber-300', bg: 'bg-amber-500/10 border-amber-500/20' },
                                        { label: 'Selisih', value: Math.abs(showBudgetModal.estimatedCost - (showBudgetModal.actualCost || 0)), color: 'text-slate-300', bg: 'bg-[#0B132B]/60 border-[#1C2541]/60' },
                                    ].map(({ label, value, color, bg }) => (
                                        <div key={label} className={`rounded-xl border p-4 ${bg}`}>
                                            <p className="text-xs text-slate-500 mb-1">{label}</p>
                                            <p className={`text-lg font-black ${color}`}>{formatCurrency(value)}</p>
                                        </div>
                                    ))}
                                </div>
                                <div>
                                    <div className="mb-3 flex items-center justify-between">
                                        <h3 className="text-sm font-bold text-white">Rincian Pengeluaran</h3>
                                        <button type="button" onClick={() => openExpenseModal(showBudgetModal)} className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-2 text-xs font-bold text-[#0B132B] hover:bg-emerald-400 transition">
                                            <Plus size={14} /> Tambah
                                        </button>
                                    </div>
                                    <div className="overflow-x-auto rounded-xl border border-[#1C2541]/60">
                                        <table className="w-full text-xs min-w-[700px]">
                                            <thead>
                                                <tr className="border-b border-[#1C2541]/40 bg-[#0B132B]/60">
                                                    {['Tanggal','Nama','Kategori','Nominal','Metode','Bukti','Ket'].map(h => <th key={h} className="px-4 py-3 text-left font-bold uppercase tracking-wider text-slate-500">{h}</th>)}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {(showBudgetModal.expenses || []).map(expense => (
                                                    <tr key={expense.id} className="border-b border-[#1C2541]/30 hover:bg-[#111A2E]/50 transition">
                                                        <td className="px-4 py-3 text-slate-400">{formatShortDate(expense.date)}</td>
                                                        <td className="px-4 py-3 font-semibold text-white">{expense.name}</td>
                                                        <td className="px-4 py-3"><span className="rounded-lg bg-[#111A2E] px-2 py-0.5 text-slate-400">{expense.category}</span></td>
                                                        <td className="px-4 py-3 font-bold text-amber-300">{formatCurrency(expense.amount)}</td>
                                                        <td className="px-4 py-3 text-slate-400">{expense.paymentMethod}</td>
                                                        <td className="px-4 py-3"><span className={`rounded-lg px-2 py-0.5 font-semibold ${expense.hasProof ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>{expense.hasProof ? 'Ada' : 'Tidak'}</span></td>
                                                        <td className="px-4 py-3 text-slate-500">{expense.notes || '-'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        {(showBudgetModal.expenses || []).length === 0 && (
                                            <div className="p-8 text-center text-sm text-slate-500">Belum ada pengeluaran aktual.</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>

            {/* Delete Modal */}
            <Dialog.Root open={showDeleteModal !== null} onOpenChange={open => !open && setShowDeleteModal(null)}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" />
                    <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[#1C2541]/60 bg-[#090E1A] shadow-2xl">
                        <div className="p-6">
                            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20">
                                <Trash2 size={22} className="text-red-400" />
                            </div>
                            <Dialog.Title className="mb-2 text-lg font-black text-white">Hapus Kegiatan?</Dialog.Title>
                            <Dialog.Description className="mb-6 text-sm text-slate-400">
                                {showDeleteModal ? `Data kegiatan "${showDeleteModal.title}" akan dihapus permanen dan tidak bisa dikembalikan.` : 'Data kegiatan akan dihapus.'}
                            </Dialog.Description>
                            <div className="flex justify-end gap-3">
                                <Dialog.Close asChild>
                                    <button className="rounded-xl border border-[#1C2541]/60 px-4 py-2.5 text-sm text-slate-400 hover:text-white transition">Batal</button>
                                </Dialog.Close>
                                <button type="button" onClick={handleDelete} className="rounded-xl bg-red-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-400 transition">
                                    Ya, Hapus
                                </button>
                            </div>
                        </div>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>
        </AdminLayout>
    );
}
