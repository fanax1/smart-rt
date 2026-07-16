import AdminLayout from "@/Layouts/AdminLayout";
import { Head, router, useForm } from "@inertiajs/react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  AlertCircle,
  Check,
  CheckCircle,
  Download,
  Eye,
  FileText,
  Plus,
  Search,
  Users,
  Wallet,
  X,
  XCircle,
} from "lucide-react";
import { FormEvent, ReactNode, useMemo, useState } from "react";

type PaymentStatus =
  | "Belum Bayar"
  | "Menunggu Verifikasi"
  | "Sudah Bayar"
  | "Kurang Bayar"
  | "Ditolak";

type NullableString = string | null;

interface MonthlyFee {
  id: number;
  name: string;
  amount: number;
  note?: NullableString;
}

interface FeeComponent extends MonthlyFee {
  order: number;
  isActive: boolean;
}

interface PaymentHistory {
  id: number;
  date?: NullableString;
  amount: number;
  method: string;
  status: PaymentStatus;
  verificationStatus: "pending" | "verified" | "rejected";
  proofUrl?: NullableString;
  notes?: NullableString;
  verificationNotes?: NullableString;
}

interface Payment {
  id: number;
  kartuKeluargaId: number;
  houseNumber: string;
  headOfFamily: string;
  kkNumber: string;
  period: string;
  periodValue: string;
  totalBill: number;
  status: PaymentStatus;
  paymentDate?: NullableString;
  paymentMethod?: NullableString;
  hasProof: boolean;
  proofUrl?: NullableString;
  paidAmount: number;
  verificationNotes?: NullableString;
  paymentHistory: PaymentHistory[];
}

interface FamilyOption {
  id: number;
  houseNumber: string;
  headOfFamily: string;
  kkNumber: string;
}

interface FinanceProps {
  selectedMonth: string;
  monthlyFees: MonthlyFee[];
  payments: Payment[];
  familyOptions: FamilyOption[];
  feeComponents: FeeComponent[];
  financeStats?: {
    totalKasBalance: number;
    pemasukanBulanIni: number;
    pengeluaranBulanIni: number;
    sumberPemasukan: {
      Iuran: number;
      Donasi: number;
      Sponsorship: number;
      'Lain-lain': number;
    };
    arusKasData: Array<{ label: string; pemasukan: number; pengeluaran: number }>;
    transactions: Array<{
      id: number;
      tipe: 'pemasukan' | 'pengeluaran';
      kategori: string;
      jumlah: number;
      deskripsi: string;
      tanggal: string;
      status: string;
    }>;
  };
}

interface ComponentFormData {
  nama: string;
  nominal: string;
  keterangan: string;
  urutan: string;
}

interface PaymentFormData {
  kartu_keluarga_id: string;
  periode: string;
  jumlah_dibayar: string;
  tanggal_bayar: string;
  metode_pembayaran: string;
  status_verifikasi: string;
  bukti_pembayaran: File | null;
  catatan: string;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount || 0);
}

function formatDate(value?: NullableString) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getStatusBadge(status: string) {
  switch (status) {
    case "Belum Bayar":
      return "bg-red-500/10 text-red-400 border border-red-500/20";
    case "Menunggu Verifikasi":
      return "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20";
    case "Sudah Bayar":
      return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
    case "Kurang Bayar":
      return "bg-orange-500/10 text-orange-400 border border-orange-500/20";
    case "Ditolak":
      return "bg-slate-500/10 text-slate-400 border border-slate-500/20";
    default:
      return "bg-slate-500/10 text-slate-400 border border-slate-500/20";
  }
}

export default function Finance({
  selectedMonth,
  monthlyFees,
  payments,
  familyOptions,
  feeComponents,
  financeStats = {
    totalKasBalance: 0,
    pemasukanBulanIni: 0,
    pengeluaranBulanIni: 0,
    sumberPemasukan: { Iuran: 0, Donasi: 0, Sponsorship: 0, 'Lain-lain': 0 },
    arusKasData: [],
    transactions: []
  }
}: FinanceProps) {
  const [activeTab, setActiveTab] = useState<'ringkasan' | 'iuran' | 'komponen'>('ringkasan');
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showProofModal, setShowProofModal] = useState(false);
  const [currentProof, setCurrentProof] = useState<string>("");
  const [showComponentModal, setShowComponentModal] = useState(false);
  const [editingComponent, setEditingComponent] = useState<FeeComponent | null>(null);

  // General Cash Transaction State
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const transactionForm = useForm({
    tipe: 'pemasukan',
    kategori: 'Donasi',
    jumlah: '',
    deskripsi: '',
    tanggal: new Date().toISOString().slice(0, 10),
  });

  const componentForm = useForm<ComponentFormData>({
    nama: "",
    nominal: "",
    keterangan: "",
    urutan: "0",
  });

  const paymentForm = useForm<PaymentFormData>({
    kartu_keluarga_id: "",
    periode: selectedMonth,
    jumlah_dibayar: "",
    tanggal_bayar: new Date().toISOString().slice(0, 10),
    metode_pembayaran: "Tunai",
    status_verifikasi: "verified",
    bukti_pembayaran: null,
    catatan: "",
  });

  const totalMonthlyFee = monthlyFees.reduce((sum, fee) => sum + Number(fee.amount), 0);
  const filteredPayments = payments.filter((payment) => {
    const matchStatus = selectedStatus === "all" || payment.status === selectedStatus;
    const search = searchTerm.toLowerCase();
    const matchSearch = payment.headOfFamily.toLowerCase().includes(search) || payment.houseNumber.toLowerCase().includes(search) || payment.kkNumber.toLowerCase().includes(search);
    return matchStatus && matchSearch;
  });

  const totalKK = payments.length;
  const sudahBayar = payments.filter((p) => p.status === "Sudah Bayar").length;
  const belumBayar = payments.filter((p) => p.status === "Belum Bayar").length;
  const totalTunggakan = payments.filter((p) => p.status === "Belum Bayar" || p.status === "Kurang Bayar").reduce((sum, p) => sum + Math.max(Number(p.totalBill) - Number(p.paidAmount || 0), 0), 0);

  const changeMonth = (month: string) => {
    router.get(route("admin.finance.index"), { month }, { preserveScroll: true, preserveState: false });
  };

  const submitPayment = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    paymentForm.post(route("admin.finance.payments.store"), {
      forceFormData: true,
      preserveScroll: true,
      onSuccess: () => {
        setShowAddPayment(false);
        paymentForm.reset("kartu_keluarga_id", "bukti_pembayaran", "catatan");
      },
    });
  };

  const verifyPayment = (historyId: number) => {
    router.patch(route("admin.finance.payments.verify", { payment: historyId }), {}, { preserveScroll: true });
  };

  const rejectPayment = (historyId: number) => {
    const note = window.prompt("Catatan penolakan pembayaran:") ?? "";
    router.patch(route("admin.finance.payments.reject", { payment: historyId }), { catatan_verifikasi: note }, { preserveScroll: true });
  };

  const openCreateComponent = () => {
    setEditingComponent(null);
    componentForm.clearErrors();
    componentForm.setData({ nama: "", nominal: "", keterangan: "", urutan: String((feeComponents?.length || 0) + 1) });
    setShowComponentModal(true);
  };

  const openEditComponent = (component: FeeComponent) => {
    setEditingComponent(component);
    componentForm.clearErrors();
    componentForm.setData({ nama: component.name, nominal: String(component.amount), keterangan: component.note || "", urutan: String(component.order || 0) });
    setShowComponentModal(true);
  };

  const submitComponent = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (editingComponent) {
      componentForm.put(route("admin.finance.components.update", { component: editingComponent.id }), { preserveScroll: true, onSuccess: () => setShowComponentModal(false) });
      return;
    }
    componentForm.post(route("admin.finance.components.store"), { preserveScroll: true, onSuccess: () => setShowComponentModal(false) });
  };

  const toggleComponent = (component: FeeComponent) => {
    router.patch(route("admin.finance.components.toggle", { component: component.id }), {}, { preserveScroll: true });
  };

  const submitTransaction = (event: FormEvent) => {
    event.preventDefault();
    transactionForm.post(route('admin.finance.transactions.store'), {
      preserveScroll: true,
      onSuccess: () => {
        setShowAddTransaction(false);
        transactionForm.reset('jumlah', 'deskripsi');
      }
    });
  };

  const deleteTransaction = (id: number) => {
    if (!confirm('Hapus transaksi ini?')) return;
    router.delete(route('admin.finance.transactions.destroy', { transaction: id }), {
      preserveScroll: true
    });
  };

  const arusKas = financeStats.arusKasData || [];
  const maxVal = Math.max(...arusKas.map(d => Math.max(d.pemasukan, d.pengeluaran)), 1000000);

  const pointsPemasukan = arusKas.map((d, i) => ({
    x: (i / 11) * 420 + 40,
    y: 150 - (d.pemasukan / maxVal) * 110
  }));

  const pointsPengeluaran = arusKas.map((d, i) => ({
    x: (i / 11) * 420 + 40,
    y: 150 - (d.pengeluaran / maxVal) * 110
  }));

  const pathPemasukan = pointsPemasukan.reduce((acc, p, i) => i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`, '');
  const pathPengeluaran = pointsPengeluaran.reduce((acc, p, i) => i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`, '');

  const fillPemasukan = pointsPemasukan.length > 0
    ? `${pathPemasukan} L ${pointsPemasukan[pointsPemasukan.length - 1].x} 150 L ${pointsPemasukan[0].x} 150 Z`
    : '';
  const fillPengeluaran = pointsPengeluaran.length > 0
    ? `${pathPengeluaran} L ${pointsPengeluaran[pointsPengeluaran.length - 1].x} 150 L ${pointsPengeluaran[0].x} 150 Z`
    : '';

  return (
    <AdminLayout activeMenu="finance">
      <Head title="Keuangan & Kas - SMART-RT" />

      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-3xl font-black text-white">Detail Keuangan & Kas</h2>
          <p className="mt-1 text-sm text-slate-400 font-medium">Laporan keuangan warga, Oktober 2023</p>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" className="inline-flex items-center gap-2 rounded-xl border border-[#1C2541] bg-[#111A2E] px-4 py-2.5 text-xs font-bold text-slate-300 hover:bg-[#1C2541]/70 transition duration-200">
            <span>Ekspor PDF</span>
          </button>
          <button
            type="button"
            onClick={() => setShowAddTransaction(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-black text-[#0B132B] hover:bg-emerald-400 transition duration-200 shadow-lg shadow-emerald-500/10"
          >
            <Plus size={14} />
            <span>Tambah Baru</span>
          </button>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-[#1C2541]/50 bg-[#111A2E]/60 p-6 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black tracking-widest text-slate-400">TOTAL SALDO KAS</span>
            <div className="h-6 w-6 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Wallet size={14} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-white">{formatCurrency(financeStats.totalKasBalance)}</h3>
            <p className="text-[10px] text-emerald-400 font-semibold mt-1">Kenaikan 12% dari bulan lalu</p>
          </div>
        </div>

        <div className="rounded-2xl border border-[#1C2541]/50 bg-[#111A2E]/60 p-6 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black tracking-widest text-slate-400">PENGELUARAN BULAN INI</span>
            <div className="h-6 w-6 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
              <AlertCircle size={14} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-white">{formatCurrency(financeStats.pengeluaranBulanIni)}</h3>
            <p className="text-[10px] text-slate-500 font-semibold mt-1">Semua pengeluaran terdata</p>
          </div>
        </div>

        <div className="rounded-2xl border border-[#1C2541]/50 bg-[#111A2E]/60 p-6 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black tracking-widest text-slate-400">PEMASUKAN BULAN INI</span>
            <div className="h-6 w-6 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <CheckCircle size={14} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-white">{formatCurrency(financeStats.pemasukanBulanIni)}</h3>
            <p className="text-[10px] text-slate-500 font-semibold mt-1">Termasuk iuran & donasi</p>
          </div>
        </div>
      </div>

      <div className="mb-6 flex border-b border-[#1C2541]/40">
        {[
          { id: 'ringkasan', label: 'Ringkasan & Kas' },
          { id: 'iuran', label: 'Verifikasi Iuran' },
          { id: 'komponen', label: 'Komponen Iuran' }
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={`border-b-2 px-6 py-3 text-xs font-bold transition duration-200 -mb-px ${
              activeTab === tab.id
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'ringkasan' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 rounded-2xl border border-[#1C2541]/50 bg-[#111A2E]/50 p-6 shadow-md">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-black text-white">Arus Kas Bulanan (2026)</h3>
                <div className="flex items-center gap-4 text-[10px] font-bold">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded bg-emerald-500"></span>
                    <span className="text-slate-400">Pemasukan</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded bg-amber-500"></span>
                    <span className="text-slate-400">Pengeluaran</span>
                  </div>
                </div>
              </div>

              <div className="h-48 relative w-full flex items-center justify-center">
                <svg viewBox="0 0 500 170" className="w-full h-full text-slate-400" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="gradPemasukan" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10B981" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                    </linearGradient>
                    <linearGradient id="gradPengeluaran" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  
                  <line x1="40" y1="30" x2="460" y2="30" stroke="#1C2541" strokeOpacity="0.2" strokeDasharray="4 4" />
                  <line x1="40" y1="90" x2="460" y2="90" stroke="#1C2541" strokeOpacity="0.2" strokeDasharray="4 4" />
                  <line x1="40" y1="150" x2="460" y2="150" stroke="#1C2541" strokeOpacity="0.4" />

                  {fillPemasukan && <path d={fillPemasukan} fill="url(#gradPemasukan)" />}
                  {fillPengeluaran && <path d={fillPengeluaran} fill="url(#gradPengeluaran)" />}

                  {pathPemasukan && <path d={pathPemasukan} fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" />}
                  {pathPengeluaran && <path d={pathPengeluaran} fill="none" stroke="#F59E0B" strokeWidth="2" strokeDasharray="4 4" strokeLinecap="round" />}
                </svg>
              </div>

              <div className="flex justify-between px-8 text-[9px] font-bold text-slate-500 mt-2">
                {arusKas.map((d, idx) => (
                  <span key={idx}>{d.label}</span>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-[#1C2541]/50 bg-[#111A2E]/50 p-6 shadow-md flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-black text-white mb-5">Sumber Pemasukan</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-[11px] font-bold mb-1.5">
                      <span className="text-slate-400">Iuran Warga</span>
                      <span className="text-emerald-400">{financeStats.sumberPemasukan.Iuran}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-[#0B132B] rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${financeStats.sumberPemasukan.Iuran}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] font-bold mb-1.5">
                      <span className="text-slate-400">Donasi</span>
                      <span className="text-amber-400">{financeStats.sumberPemasukan.Donasi}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-[#0B132B] rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: `${financeStats.sumberPemasukan.Donasi}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] font-bold mb-1.5">
                      <span className="text-slate-400">Sponsorship</span>
                      <span className="text-blue-400">{financeStats.sumberPemasukan.Sponsorship}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-[#0B132B] rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${financeStats.sumberPemasukan.Sponsorship}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] font-bold mb-1.5">
                      <span className="text-slate-400">Lain-lain</span>
                      <span className="text-purple-400">{financeStats.sumberPemasukan['Lain-lain']}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-[#0B132B] rounded-full overflow-hidden">
                      <div className="h-full bg-purple-500 rounded-full" style={{ width: `${financeStats.sumberPemasukan['Lain-lain']}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 border-t border-[#1C2541]/40 pt-4 text-[10px] text-slate-400 font-semibold leading-relaxed">
                Pengulangan transaksi terkendali. Total pengeluaran bulan ini lebih kecil dari rata-rata saldo kas bulanan.
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#1C2541]/50 bg-[#111A2E]/50 shadow-md">
            <div className="border-b border-[#1C2541]/40 p-5 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider">Transaksi Terbaru</h3>
                <p className="mt-1 text-xs text-slate-500 font-medium">Buku kas umum pencatatan operasional, iuran, donasi, dan pengeluaran.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddTransaction(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-2 text-xs font-bold text-emerald-400 hover:bg-emerald-500 hover:text-[#0B132B] transition duration-200"
              >
                <Plus size={12} />
                <span>Transaksi Baru</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[800px]">
                <thead>
                  <tr className="border-b border-[#1C2541]/50 bg-[#111A2E]/20 text-[10px] font-black uppercase tracking-wider text-slate-400">
                    <th className="px-5 py-3.5">TANGGAL</th>
                    <th className="px-5 py-3.5">DESKRIPSI</th>
                    <th className="px-5 py-3.5">KATEGORI</th>
                    <th className="px-5 py-3.5">STATUS</th>
                    <th className="px-5 py-3.5">JUMLAH</th>
                    <th className="w-20 px-5 py-3.5 text-right">AKSI</th>
                  </tr>
                </thead>
                <tbody>
                  {financeStats.transactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-12 text-center text-slate-500">
                        Belum ada data transaksi kas tercatat.
                      </td>
                    </tr>
                  ) : (
                    financeStats.transactions.map((t) => {
                      const isIncome = t.tipe === 'pemasukan';
                      return (
                        <tr key={t.id} className="border-b border-[#1C2541]/40 transition hover:bg-[#111A2E]/30 text-slate-300">
                          <td className="px-5 py-4 font-semibold text-slate-400">{formatDate(t.tanggal)}</td>
                          <td className="px-5 py-4 font-bold text-slate-200">{t.deskripsi}</td>
                          <td className="px-5 py-4">
                            <span className={`rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase ${
                              isIncome ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}>
                              {t.kategori}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span className="text-emerald-400 font-bold flex items-center gap-1">
                              ● Berhasil
                            </span>
                          </td>
                          <td className={`px-5 py-4 font-black ${isIncome ? 'text-emerald-400' : 'text-red-400'}`}>
                            {isIncome ? '+ ' : '- '}{formatCurrency(t.jumlah)}
                          </td>
                          <td className="px-5 py-4 text-right">
                            <button
                              type="button"
                              onClick={() => deleteTransaction(t.id)}
                              className="rounded-lg p-1.5 text-red-400 hover:bg-red-950/20 transition"
                              title="Hapus"
                            >
                              <X size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'iuran' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-[#1C2541]/50 bg-[#111A2E]/50 p-4 shadow-md">
            <div className="flex flex-col gap-3 lg:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input
                  type="text"
                  placeholder="Cari kepala keluarga, nomor rumah, atau nomor KK..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="w-full rounded-full bg-[#111A2E] border border-[#1C2541]/70 py-2 pl-10 pr-4 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(event) => changeMonth(event.target.value)}
                  className="rounded-xl border border-[#1C2541] bg-[#111A2E] px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
                />

                <select
                  value={selectedStatus}
                  onChange={(event) => setSelectedStatus(event.target.value)}
                  className="rounded-xl border border-[#1C2541] bg-[#111A2E] px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
                >
                  <option value="all">Semua Status</option>
                  <option value="Belum Bayar">Belum Bayar</option>
                  <option value="Menunggu Verifikasi">Menunggu Verifikasi</option>
                  <option value="Sudah Bayar">Sudah Bayar</option>
                  <option value="Kurang Bayar">Kurang Bayar</option>
                </select>

                <button
                  onClick={() => setShowAddPayment(true)}
                  className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-black text-[#0B132B] hover:bg-emerald-400 transition duration-200 shadow-lg shadow-emerald-500/10"
                >
                  <Plus size={14} />
                  Input Pembayaran Manual
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="rounded-xl border border-[#1C2541]/40 bg-[#111A2E]/40 p-4">
              <span className="text-[10px] font-black text-slate-500 tracking-wider">TOTAL KK</span>
              <p className="text-2xl font-black text-white mt-1">{totalKK}</p>
            </div>
            <div className="rounded-xl border border-[#1C2541]/40 bg-[#111A2E]/40 p-4">
              <span className="text-[10px] font-black text-emerald-400 tracking-wider">SUDAH BAYAR</span>
              <p className="text-2xl font-black text-emerald-400 mt-1">{sudahBayar}</p>
            </div>
            <div className="rounded-xl border border-[#1C2541]/40 bg-[#111A2E]/40 p-4">
              <span className="text-[10px] font-black text-red-400 tracking-wider">BELUM BAYAR</span>
              <p className="text-2xl font-black text-red-400 mt-1">{belumBayar}</p>
            </div>
            <div className="rounded-xl border border-[#1C2541]/40 bg-[#111A2E]/40 p-4">
              <span className="text-[10px] font-black text-amber-400 tracking-wider">TOTAL TUNGGAKAN</span>
              <p className="text-2xl font-black text-amber-400 mt-1">{formatCurrency(totalTunggakan)}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-[#1C2541]/50 bg-[#111A2E]/50 shadow-md">
            <div className="border-b border-[#1C2541]/40 p-5">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Data Pembayaran Iuran Warga</h3>
              <p className="mt-1 text-xs text-slate-500 font-medium">Verifikasi pembayaran transfer bank / bukti iuran bulanan dari dashboard warga.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[800px]">
                <thead>
                  <tr className="border-b border-[#1C2541]/50 bg-[#111A2E]/20 text-[10px] font-black uppercase tracking-wider text-slate-400">
                    <th className="px-5 py-3.5">NO. RUMAH</th>
                    <th className="px-5 py-3.5">KEPALA KELUARGA</th>
                    <th className="px-5 py-3.5">TOTAL TAGIHAN</th>
                    <th className="px-5 py-3.5">STATUS PEMBAYARAN</th>
                    <th className="px-5 py-3.5">TANGGAL BAYAR</th>
                    <th className="px-5 py-3.5">METODE</th>
                    <th className="px-5 py-3.5">BUKTI TRANSAKSI</th>
                    <th className="w-20 px-5 py-3.5 text-right">AKSI</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-12 text-center text-slate-500">
                        Tidak ada data pembayaran yang ditemukan.
                      </td>
                    </tr>
                  ) : (
                    filteredPayments.map((payment) => (
                      <tr key={payment.id} className="border-b border-[#1C2541]/40 transition hover:bg-[#111A2E]/30 text-slate-300">
                        <td className="px-5 py-4 font-bold text-white">{payment.houseNumber}</td>
                        <td className="px-5 py-4 font-semibold text-slate-200">{payment.headOfFamily}</td>
                        <td className="px-5 py-4 font-semibold text-slate-300">{formatCurrency(payment.totalBill)}</td>
                        <td className="px-5 py-4">
                          <span className={`rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase ${getStatusBadge(payment.status)}`}>
                            {payment.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-slate-400">{formatDate(payment.paymentDate)}</td>
                        <td className="px-5 py-4 text-slate-400">{payment.paymentMethod || "-"}</td>
                        <td className="px-5 py-4">
                          {payment.hasProof && payment.proofUrl ? (
                            <button
                              onClick={() => {
                                setCurrentProof(payment.proofUrl || "");
                                setShowProofModal(true);
                              }}
                              className="text-blue-400 hover:text-blue-300 hover:underline font-bold transition"
                            >
                              Lihat Bukti
                            </button>
                          ) : (
                            <span className="text-slate-500">Belum ada</span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => setSelectedPayment(payment)}
                            className="inline-flex items-center gap-1 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-[10px] font-bold text-emerald-400 hover:bg-emerald-500 hover:text-[#0B132B] transition"
                          >
                            <Eye size={12} />
                            Detail
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'komponen' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-[#1C2541]/50 bg-[#111A2E]/50 p-6 shadow-md">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-2">Rincian Iuran Bulanan per Kepala Keluarga</h3>
              </div>
              <button
                onClick={openCreateComponent}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-xs font-bold text-emerald-400 hover:bg-emerald-500 hover:text-[#0B132B] transition"
              >
                <Plus size={14} />
                <span>Tambah Komponen</span>
              </button>
            </div>

            <div className="mb-6 rounded-2xl border border-[#1C2541]/40 bg-[#0B132B]/80 p-5">
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Iuran Bulanan Aktif</p>
              <p className="text-3xl font-black text-emerald-400 mt-2">{formatCurrency(totalMonthlyFee)}</p>
            </div>

            {monthlyFees.length > 0 ? (
              <div className="space-y-4">
                <p className="text-xs font-bold text-slate-400 tracking-wider">KOMPONEN TERAKTIFKAN:</p>
                {monthlyFees.map((fee) => (
                  <div key={fee.id} className="flex items-start justify-between border-b border-[#1C2541]/30 pb-3 last:border-0 last:pb-0">
                    <div className="flex-1 pr-4">
                      <p className="text-xs font-bold text-slate-200">{fee.name}</p>
                      {fee.note && <p className="mt-1 text-[11px] text-slate-500 leading-normal">{fee.note}</p>}
                    </div>
                    <p className="text-xs font-black text-slate-200">{formatCurrency(fee.amount)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[#1C2541]/40 p-6 text-center text-xs text-slate-500">
                Belum ada komponen iuran aktif.
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-[#1C2541]/50 bg-[#111A2E]/50 shadow-md">
            <div className="p-5 border-b border-[#1C2541]/40">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Kelola Komponen Iuran</h3>
              <p className="mt-1 text-xs text-slate-500 font-medium">Komponen aktif akan otomatis terakumulasi sebagai total tagihan KK setiap bulannya.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[800px]">
                <thead>
                  <tr className="border-b border-[#1C2541]/50 bg-[#111A2E]/20 text-[10px] font-black uppercase tracking-wider text-slate-400">
                    <th className="px-5 py-3.5">URUTAN</th>
                    <th className="px-5 py-3.5">NAMA KOMPONEN</th>
                    <th className="px-5 py-3.5">NOMINAL</th>
                    <th className="px-5 py-3.5">CATATAN</th>
                    <th className="px-5 py-3.5">STATUS</th>
                    <th className="w-48 px-5 py-3.5 text-right">AKSI</th>
                  </tr>
                </thead>
                <tbody>
                  {feeComponents.map((component) => (
                    <tr key={component.id} className="border-b border-[#1C2541]/40 transition hover:bg-[#111A2E]/30 text-slate-300">
                      <td className="px-5 py-4 font-bold text-slate-400">{component.order}</td>
                      <td className="px-5 py-4 font-bold text-slate-200">{component.name}</td>
                      <td className="px-5 py-4 font-black text-slate-300">{formatCurrency(component.amount)}</td>
                      <td className="px-5 py-4 text-slate-400">{component.note || "-"}</td>
                      <td className="px-5 py-4">
                        <span className={`rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase ${
                          component.isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                        }`}>
                          {component.isActive ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openEditComponent(component)}
                            className="rounded-xl border border-[#1C2541] px-3 py-1.5 text-[10px] font-bold text-slate-300 hover:bg-[#1C2541]/60 transition"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => toggleComponent(component)}
                            className={`rounded-xl px-3 py-1.5 text-[10px] font-black text-[#0B132B] transition ${
                              component.isActive ? 'bg-red-500 hover:bg-red-400' : 'bg-emerald-500 hover:bg-emerald-400'
                            }`}
                          >
                            {component.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <Dialog.Root open={showAddTransaction} onOpenChange={setShowAddTransaction}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[96vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-[#1C2541] bg-[#0B132B] p-6 text-slate-200 shadow-2xl">
            <Dialog.Title className="text-lg font-black text-white mb-4">Input Transaksi Kas Baru</Dialog.Title>
            <form onSubmit={submitTransaction} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-300">Tipe Transaksi</label>
                <select
                  value={transactionForm.data.tipe}
                  onChange={(e) => transactionForm.setData('tipe', e.target.value)}
                  className="w-full rounded-xl bg-[#111A2E] border border-[#1C2541] px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="pemasukan">Pemasukan (Cash In)</option>
                  <option value="pengeluaran">Pengeluaran (Cash Out)</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-300">Kategori</label>
                <select
                  value={transactionForm.data.kategori}
                  onChange={(e) => transactionForm.setData('kategori', e.target.value)}
                  className="w-full rounded-xl bg-[#111A2E] border border-[#1C2541] px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="Iuran">Iuran Warga</option>
                  <option value="Donasi">Donasi</option>
                  <option value="Sponsorship">Sponsorship</option>
                  <option value="Operasional">Operasional</option>
                  <option value="Kegiatan">Kegiatan RT</option>
                  <option value="Lain-lain">Lain-lain</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-300">Jumlah Uang (Rp)</label>
                <input
                  type="number"
                  required
                  value={transactionForm.data.jumlah}
                  onChange={(e) => transactionForm.setData('jumlah', e.target.value)}
                  placeholder="Contoh: 250000"
                  className="w-full rounded-xl bg-[#111A2E] border border-[#1C2541] px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-300">Tanggal Transaksi</label>
                <input
                  type="date"
                  required
                  value={transactionForm.data.tanggal}
                  onChange={(e) => transactionForm.setData('tanggal', e.target.value)}
                  className="w-full rounded-xl bg-[#111A2E] border border-[#1C2541] px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-300">Deskripsi / Catatan</label>
                <textarea
                  required
                  rows={2}
                  value={transactionForm.data.deskripsi}
                  onChange={(e) => transactionForm.setData('deskripsi', e.target.value)}
                  placeholder="Keterangan transaksi secara jelas..."
                  className="w-full rounded-xl bg-[#111A2E] border border-[#1C2541] px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 pt-4 border-t border-[#1C2541]/40">
                <button
                  type="button"
                  onClick={() => setShowAddTransaction(false)}
                  className="w-full sm:w-auto rounded-xl border border-[#1C2541] px-4 py-2 text-xs font-bold text-slate-400 hover:text-white transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={transactionForm.processing}
                  className="w-full sm:w-auto rounded-xl bg-emerald-500 px-4 py-2 text-xs font-black text-[#0B132B] hover:bg-emerald-400 transition"
                >
                  Simpan Transaksi
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Dialog.Root open={showAddPayment} onOpenChange={setShowAddPayment}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[96vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-[#1C2541] bg-[#0B132B] p-6 text-slate-200 shadow-2xl">
            <Dialog.Title className="text-lg font-black text-white mb-4">Input Pembayaran Manual</Dialog.Title>
            <form onSubmit={submitPayment} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-300">Pilih Rumah / Keluarga</label>
                <select
                  required
                  value={paymentForm.data.kartu_keluarga_id}
                  onChange={(e) => paymentForm.setData('kartu_keluarga_id', e.target.value)}
                  className="w-full rounded-xl bg-[#111A2E] border border-[#1C2541] px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="">-- Pilih KK / Rumah --</option>
                  {familyOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      Unit {opt.houseNumber} - KK {opt.headOfFamily}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-300">Periode Bulan</label>
                  <input
                    type="month"
                    required
                    value={paymentForm.data.periode}
                    onChange={(e) => paymentForm.setData('periode', e.target.value)}
                    className="w-full rounded-xl bg-[#111A2E] border border-[#1C2541] px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-300">Tanggal Bayar</label>
                  <input
                    type="date"
                    required
                    value={paymentForm.data.tanggal_bayar}
                    onChange={(e) => paymentForm.setData('tanggal_bayar', e.target.value)}
                    className="w-full rounded-xl bg-[#111A2E] border border-[#1C2541] px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-300">Jumlah Dibayar (Rp)</label>
                  <input
                    type="number"
                    required
                    value={paymentForm.data.jumlah_dibayar}
                    onChange={(e) => paymentForm.setData('jumlah_dibayar', e.target.value)}
                    className="w-full rounded-xl bg-[#111A2E] border border-[#1C2541] px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-300">Metode Pembayaran</label>
                  <select
                    value={paymentForm.data.metode_pembayaran}
                    onChange={(e) => paymentForm.setData('metode_pembayaran', e.target.value)}
                    className="w-full rounded-xl bg-[#111A2E] border border-[#1C2541] px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Tunai">Tunai</option>
                    <option value="Transfer Bank">Transfer Bank</option>
                    <option value="E-Wallet">E-Wallet</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-300">Status Verifikasi</label>
                <select
                  value={paymentForm.data.status_verifikasi}
                  onChange={(e) => paymentForm.setData('status_verifikasi', e.target.value)}
                  className="w-full rounded-xl bg-[#111A2E] border border-[#1C2541] px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="verified">Langsung Verifikasi (verified)</option>
                  <option value="pending">Menunggu Verifikasi (pending)</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-300">Bukti Pembayaran (Opsional)</label>
                <input
                  type="file"
                  onChange={(e) => paymentForm.setData('bukti_pembayaran', e.target.files?.[0] || null)}
                  className="w-full rounded-xl bg-[#111A2E] border border-[#1C2541] px-4 py-2 text-xs text-slate-200 focus:outline-none"
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 pt-4 border-t border-[#1C2541]/40">
                <button
                  type="button"
                  onClick={() => setShowAddPayment(false)}
                  className="w-full sm:w-auto rounded-xl border border-[#1C2541] px-4 py-2 text-xs font-bold text-slate-400 hover:text-white transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={paymentForm.processing}
                  className="w-full sm:w-auto rounded-xl bg-emerald-500 px-4 py-2 text-xs font-black text-[#0B132B] hover:bg-emerald-400 transition"
                >
                  Simpan Pembayaran
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Dialog.Root open={selectedPayment !== null} onOpenChange={(open) => !open && setSelectedPayment(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[96vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-[#1C2541] bg-[#0B132B] p-6 text-slate-200 shadow-2xl">
            <Dialog.Title className="text-lg font-black text-white mb-4">Verifikasi Pembayaran Iuran</Dialog.Title>
            {selectedPayment && (
              <div className="space-y-4 text-xs">
                <div className="rounded-xl bg-[#111A2E]/50 border border-[#1C2541]/50 p-4 space-y-2">
                  <div className="flex justify-between"><span className="text-slate-500 font-bold uppercase">No. Rumah</span><span className="font-bold text-white">{selectedPayment.houseNumber}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500 font-bold uppercase">Kepala Keluarga</span><span className="font-bold text-slate-200">{selectedPayment.headOfFamily}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500 font-bold uppercase">Jumlah Iuran</span><span className="font-bold text-emerald-400">{formatCurrency(selectedPayment.totalBill)}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500 font-bold uppercase">Sudah Dibayar</span><span className="font-bold text-emerald-400">{formatCurrency(selectedPayment.paidAmount)}</span></div>
                </div>

                {selectedPayment.paymentHistory.map((history) => (
                  <div key={history.id} className="rounded-xl bg-[#111A2E]/50 border border-[#1C2541]/40 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-400">{formatDate(history.date)}</span>
                      <span className={`rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase ${getStatusBadge(history.status)}`}>{history.status}</span>
                    </div>
                    <div className="flex justify-between"><span className="text-slate-500">Jumlah Setor:</span><span className="font-bold text-white">{formatCurrency(history.amount)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Metode:</span><span className="font-semibold text-slate-300">{history.method}</span></div>
                    
                    {history.notes && <div className="text-slate-500 bg-[#0B132B] p-2.5 rounded-lg border border-[#1C2541]/30">{history.notes}</div>}
                    
                    {history.proofUrl && (
                      <div className="pt-2">
                        <a href={history.proofUrl} target="_blank" rel="noreferrer" className="text-blue-400 font-bold hover:underline">
                          Lihat Bukti Lampiran File
                        </a>
                      </div>
                    )}

                    {history.verificationStatus === 'pending' && (
                      <div className="flex gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            verifyPayment(history.id);
                            setSelectedPayment(null);
                          }}
                          className="flex-1 rounded-lg bg-emerald-500 py-2 text-center text-xs font-black text-[#0B132B] hover:bg-emerald-400 transition"
                        >
                          Verifikasi / Setujui
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            rejectPayment(history.id);
                            setSelectedPayment(null);
                          }}
                          className="flex-1 rounded-lg bg-red-500 py-2 text-center text-xs font-black text-white hover:bg-red-400 transition"
                        >
                          Tolak
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Dialog.Root open={showComponentModal} onOpenChange={setShowComponentModal}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[96vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-[#1C2541] bg-[#0B132B] p-6 text-slate-200 shadow-2xl">
            <Dialog.Title className="text-lg font-black text-white mb-4">
              {editingComponent ? 'Edit Komponen Iuran' : 'Tambah Komponen Iuran'}
            </Dialog.Title>
            <form onSubmit={submitComponent} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-300">Nama Komponen</label>
                <input
                  type="text"
                  required
                  value={componentForm.data.nama}
                  onChange={(e) => componentForm.setData('nama', e.target.value)}
                  className="w-full rounded-xl bg-[#111A2E] border border-[#1C2541] px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-300">Nominal Bulanan (Rp)</label>
                <input
                  type="number"
                  required
                  value={componentForm.data.nominal}
                  onChange={(e) => componentForm.setData('nominal', e.target.value)}
                  className="w-full rounded-xl bg-[#111A2E] border border-[#1C2541] px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-300">Urutan Tampil</label>
                <input
                  type="number"
                  value={componentForm.data.urutan}
                  onChange={(e) => componentForm.setData('urutan', e.target.value)}
                  className="w-full rounded-xl bg-[#111A2E] border border-[#1C2541] px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-300">Keterangan / Deskripsi</label>
                <textarea
                  rows={2}
                  value={componentForm.data.keterangan}
                  onChange={(e) => componentForm.setData('keterangan', e.target.value)}
                  className="w-full rounded-xl bg-[#111A2E] border border-[#1C2541] px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-[#1C2541]/40">
                <button
                  type="button"
                  onClick={() => setShowComponentModal(false)}
                  className="rounded-xl border border-[#1C2541] px-4 py-2 text-xs font-bold text-slate-400 hover:text-white transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={componentForm.processing}
                  className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-black text-[#0B132B] hover:bg-emerald-400 transition"
                >
                  Simpan Komponen
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Dialog.Root open={showProofModal} onOpenChange={setShowProofModal}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[96vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-[#1C2541] bg-[#0B132B] p-6 text-slate-200 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1C2541]/40 pb-4 mb-4">
              <Dialog.Title className="text-lg font-black text-white">Bukti Pembayaran</Dialog.Title>
              <Dialog.Close asChild>
                <button className="rounded-xl p-2 transition hover:bg-[#111A2E] text-slate-400 hover:text-white border border-[#1C2541]/40">
                  <X size={18} />
                </button>
              </Dialog.Close>
            </div>
            <Dialog.Description className="sr-only">
              Bukti pembayaran transfer atau tunai
            </Dialog.Description>
            <div className="flex justify-center items-center p-2 rounded-2xl bg-[#111A2E]/50 border border-[#1C2541]/30 overflow-hidden">
              {currentProof && currentProof.toLowerCase().endsWith(".pdf") ? (
                <a
                  href={currentProof}
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-400 font-bold hover:underline flex items-center gap-2 py-4"
                >
                  <FileText size={20} /> Buka File Bukti Pembayaran (PDF)
                </a>
              ) : (
                currentProof && (
                  <img
                    src={currentProof}
                    alt="Bukti Pembayaran"
                    className="h-auto max-h-[60vh] w-full rounded-xl object-contain"
                  />
                )
              )}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </AdminLayout>
  );
}

function SummaryCard({
  icon,
  iconClass,
  value,
  label,
  valueClass = "text-slate-800",
}: {
  icon: ReactNode;
  iconClass: string;
  value: ReactNode;
  label: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className={`rounded-lg p-2 ${iconClass}`}>{icon}</div>
      </div>
      <p className={`text-2xl font-bold ${valueClass}`}>{value}</p>
      <p className="text-sm text-slate-600">{label}</p>
    </div>
  );
}

function TableHead({ children }: { children: ReactNode }) {
  return (
    <th className="px-4 py-3 text-left text-sm text-slate-700">{children}</th>
  );
}

function Info({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-slate-600">{label}</p>
      <p className="font-semibold text-slate-800">{value}</p>
    </div>
  );
}

function Row({
  label,
  value,
  valueClass = "text-slate-800",
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-600">{label}</span>
      <span className={valueClass}>{value}</span>
    </div>
  );
}

function FormInput({
  label,
  type,
  value,
  onChange,
  error,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        required
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
