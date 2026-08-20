import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import * as Dialog from '@radix-ui/react-dialog';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import * as Popover from '@radix-ui/react-popover';
import {
    Calendar,
    Edit,
    Eye,
    FileText,
    Home,
    MapPin,
    MoreVertical,
    Phone,
    Plus,
    Search,
    Trash2,
    Users,
    UserPlus,
    X,
    TrendingUp,
    Map,
    History,
} from 'lucide-react';
import { FormEvent, ReactNode, useMemo, useState } from 'react';

type NullableString = string | null;

interface FamilyMember {
    name: string;
    nik: string;
    gender: NullableString;
    birthPlace: NullableString;
    birthDate: NullableString;
    religion: NullableString;
    education: NullableString;
    occupation: NullableString;
    maritalStatus: NullableString;
    relationship: NullableString;
    citizenship: NullableString;
    father?: NullableString;
    mother?: NullableString;
}

interface Resident {
    id: number;
    houseNumber: string;
    headOfFamily: string;
    kkNumber: string;
    occupancyStatus: string;
    residentStatus: string;
    phone?: NullableString;
    address?: NullableString;
    headWargaId?: number | null;
    hasAccount?: boolean;
    accountEmail?: NullableString;
    kkDetail?: {
        kkNumber: string;
        headOfFamily: string;
        address?: NullableString;
        rt?: NullableString;
        rw?: NullableString;
        village?: NullableString;
        district?: NullableString;
        city?: NullableString;
        province?: NullableString;
        postalCode?: NullableString;
    } | null;
    occupancyDetails?: {
        owner?: NullableString;
        ownerContact?: NullableString;
        ownerAddress?: NullableString;
        startDate?: NullableString;
        contractEnd?: NullableString;
        boardingHouse?: NullableString;
        roomNumber?: NullableString;
        notes?: NullableString;
    } | null;
    familyMembers?: FamilyMember[];
}

interface LatestChange {
    id: number;
    wargaName: string;
    field: string;
    newValue: string;
    createdAt: string;
}

interface ResidentsProps {
    residents?: Resident[];
    latestChanges?: LatestChange[];
    stats?: {
        total_tetap: number;
        total_kontrak: number;
        total_pending: number;
    };
}

interface FamilyMemberForm {
    nama_lengkap: string;
    nik: string;
    jenis_kelamin: string;
    tempat_lahir: string;
    tanggal_lahir: string;
    agama: string;
    pendidikan: string;
    pekerjaan: string;
    status_perkawinan: string;
    hubungan_keluarga: string;
    kewarganegaraan: string;
    nama_ayah: string;
    nama_ibu: string;
}

interface ResidentFormData {
    no_rumah: string;
    status_hunian: string;
    status_warga: string;
    kontak_penghuni: string;
    alamat_hunian: string;
    pemilik_nama: string;
    pemilik_kontak: string;
    pemilik_alamat: string;
    tanggal_mulai_menempati: string;
    masa_kontrak_selesai: string;
    nama_kos: string;
    nomor_kamar: string;
    catatan_hunian: string;
    no_kk: string;
    nama_kepala_keluarga: string;
    kk_alamat: string;
    rt: string;
    rw: string;
    kelurahan_desa: string;
    kecamatan: string;
    kabupaten_kota: string;
    provinsi: string;
    kode_pos: string;
    family_members: FamilyMemberForm[];
}

interface AccountFormData {
    email: string;
    password: string;
}

const occupancyOptions = ['Milik Sendiri', 'Kontrak/Sewa', 'Kos', 'Ikut Keluarga', 'Rumah Dinas', 'Lainnya'];
const residentStatusOptions = ['Warga Tetap', 'Warga Kontrak', 'Warga Kos', 'Warga Domisili', 'Pendatang', 'Nonaktif'];
const genderOptions = ['Laki-laki', 'Perempuan'];
const relationshipOptions = ['Kepala Keluarga', 'Istri', 'Suami', 'Anak', 'Menantu', 'Cucu', 'Orang Tua', 'Mertua', 'Famili Lain', 'Lainnya'];
const maritalOptions = ['Belum Kawin', 'Kawin', 'Cerai Hidup', 'Cerai Mati', 'Kawin Tercatat', 'Kawin Belum Tercatat'];
const religionOptions = ['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Konghucu', 'Lainnya'];

function emptyMember(relationship = 'Anak'): FamilyMemberForm {
    return {
        nama_lengkap: '',
        nik: '',
        jenis_kelamin: 'Laki-laki',
        tempat_lahir: '',
        tanggal_lahir: '',
        agama: 'Islam',
        pendidikan: '',
        pekerjaan: '',
        status_perkawinan: 'Belum Kawin',
        hubungan_keluarga: relationship,
        kewarganegaraan: 'WNI',
        nama_ayah: '',
        nama_ibu: '',
    };
}

function emptyForm(): ResidentFormData {
    return {
        no_rumah: '',
        status_hunian: 'Milik Sendiri',
        status_warga: 'Warga Tetap',
        kontak_penghuni: '',
        alamat_hunian: '',
        pemilik_nama: '',
        pemilik_kontak: '',
        pemilik_alamat: '',
        tanggal_mulai_menempati: '',
        masa_kontrak_selesai: '',
        nama_kos: '',
        nomor_kamar: '',
        catatan_hunian: '',
        no_kk: '',
        nama_kepala_keluarga: '',
        kk_alamat: '',
        rt: '003',
        rw: '005',
        kelurahan_desa: 'Kelurahan Bahagia',
        kecamatan: '',
        kabupaten_kota: '',
        provinsi: 'Jawa Barat',
        kode_pos: '',
        family_members: [emptyMember('Kepala Keluarga')],
    };
}

function residentToForm(resident: Resident): ResidentFormData {
    const members = resident.familyMembers?.length
        ? resident.familyMembers.map((member) => ({
            nama_lengkap: member.name ?? '',
            nik: member.nik ?? '',
            jenis_kelamin: member.gender ?? 'Laki-laki',
            tempat_lahir: member.birthPlace ?? '',
            tanggal_lahir: member.birthDate ?? '',
            agama: member.religion ?? 'Islam',
            pendidikan: member.education ?? '',
            pekerjaan: member.occupation ?? '',
            status_perkawinan: member.maritalStatus ?? 'Belum Kawin',
            hubungan_keluarga: member.relationship ?? 'Anak',
            kewarganegaraan: member.citizenship ?? 'WNI',
            nama_ayah: member.father ?? '',
            nama_ibu: member.mother ?? '',
        }))
        : [emptyMember('Kepala Keluarga')];

    return {
        no_rumah: resident.houseNumber ?? '',
        status_hunian: resident.occupancyStatus ?? 'Milik Sendiri',
        status_warga: resident.residentStatus ?? 'Warga Tetap',
        kontak_penghuni: resident.phone ?? '',
        alamat_hunian: resident.address ?? '',
        pemilik_nama: resident.occupancyDetails?.owner ?? '',
        pemilik_kontak: resident.occupancyDetails?.ownerContact ?? '',
        pemilik_alamat: resident.occupancyDetails?.ownerAddress ?? '',
        tanggal_mulai_menempati: resident.occupancyDetails?.startDate ?? '',
        masa_kontrak_selesai: resident.occupancyDetails?.contractEnd ?? '',
        nama_kos: resident.occupancyDetails?.boardingHouse ?? '',
        nomor_kamar: resident.occupancyDetails?.roomNumber ?? '',
        catatan_hunian: resident.occupancyDetails?.notes ?? '',
        no_kk: resident.kkDetail?.kkNumber ?? '',
        nama_kepala_keluarga: resident.kkDetail?.headOfFamily ?? resident.headOfFamily ?? '',
        kk_alamat: resident.kkDetail?.address ?? resident.address ?? '',
        rt: resident.kkDetail?.rt ?? '003',
        rw: resident.kkDetail?.rw ?? '005',
        kelurahan_desa: resident.kkDetail?.village ?? '',
        kecamatan: resident.kkDetail?.district ?? '',
        kabupaten_kota: resident.kkDetail?.city ?? '',
        provinsi: resident.kkDetail?.province ?? '',
        kode_pos: resident.kkDetail?.postalCode ?? '',
        family_members: members,
    };
}

function formatDate(value?: NullableString) {
    if (!value) return '-';
    return new Date(value).toLocaleDateString('id-ID');
}

function getOccupancyBadgeColor(status: string) {
    switch (status) {
        case 'Milik Sendiri': return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
        case 'Kontrak/Sewa': return 'bg-blue-50 text-blue-700 border border-blue-200';
        case 'Kos': return 'bg-purple-50 text-purple-700 border border-purple-200';
        case 'Ikut Keluarga': return 'bg-pink-50 text-pink-700 border border-pink-200';
        default: return 'bg-slate-100 text-slate-700 border border-slate-200';
    }
}

function getResidentBadgeColor(status: string) {
    switch (status) {
        case 'Warga Tetap': return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
        case 'Warga Kontrak': return 'bg-amber-50 text-amber-700 border border-amber-200';
        case 'Warga Kos': return 'bg-blue-50 text-blue-700 border border-blue-200';
        case 'Warga Domisili': return 'bg-purple-50 text-purple-700 border border-purple-200';
        default: return 'bg-slate-100 text-slate-700 border border-slate-200';
    }
}

type ErrorBag = Partial<Record<string, string>>;

interface ResidentFormModalProps {
    open: boolean;
    title: string;
    submitLabel: string;
    data: ResidentFormData;
    errors: ErrorBag;
    processing: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (event: FormEvent) => void;
    setField: <K extends keyof ResidentFormData>(field: K, value: ResidentFormData[K]) => void;
}

function ResidentFormModal({ open, title, submitLabel, data, errors, processing, onOpenChange, onSubmit, setField }: ResidentFormModalProps) {
    const setMember = (index: number, field: keyof FamilyMemberForm, value: string) => {
        const members = [...data.family_members];
        members[index] = { ...members[index], [field]: value };
        setField('family_members', members);
    };

    const addMember = () => {
        setField('family_members', [...data.family_members, emptyMember('Anak')]);
    };

    const removeMember = (index: number) => {
        if (data.family_members.length === 1) return;
        setField('family_members', data.family_members.filter((_, memberIndex) => memberIndex !== index));
    };

    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm" />
                <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[92vh] w-[96vw] max-w-6xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl border border-slate-200 bg-white text-slate-900 shadow-2xl">
                    <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
                        <Dialog.Title className="text-xl font-black text-slate-900">{title}</Dialog.Title>
                        <Dialog.Close asChild>
                            <button className="rounded-xl p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-900 transition"><X size={20} /></button>
                        </Dialog.Close>
                    </div>

                    <form onSubmit={onSubmit} className="space-y-7 p-6">
                        {errors.family_members && (
                            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errors.family_members}</div>
                        )}

                        <section className="space-y-4">
                            <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-emerald-700">
                                <Home size={16} /> 1. Informasi Data Hunian
                            </h3>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                                <Input label="No. Rumah *" value={data.no_rumah} error={errors.no_rumah} onChange={(val) => setField('no_rumah', val)} />
                                <SelectInput label="Status Hunian *" value={data.status_hunian} error={errors.status_hunian} options={occupancyOptions} onChange={(val) => setField('status_hunian', val)} />
                                <SelectInput label="Status Warga *" value={data.status_warga} error={errors.status_warga} options={residentStatusOptions} onChange={(val) => setField('status_warga', val)} />
                                <Input label="No HP / Kontak Penghuni *" value={data.kontak_penghuni} error={errors.kontak_penghuni} onChange={(val) => setField('kontak_penghuni', val)} />
                                <Textarea label="Alamat Lengkap Hunian" value={data.alamat_hunian} error={errors.alamat_hunian} className="sm:col-span-2" onChange={(val) => setField('alamat_hunian', val)} />
                            </div>
                        </section>

                        {data.status_hunian !== 'Milik Sendiri' && (
                            <section className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                                <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">
                                    2. Detail Kepemilikan (Khusus Kontrak / Kos)
                                </h3>
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                                    <Input label="Nama Pemilik Rumah" value={data.pemilik_nama} error={errors.pemilik_nama} onChange={(val) => setField('pemilik_nama', val)} />
                                    <Input label="Kontak Pemilik Rumah" value={data.pemilik_kontak} error={errors.pemilik_kontak} onChange={(val) => setField('pemilik_kontak', val)} />
                                    <Input label="Alamat Pemilik Rumah" value={data.pemilik_alamat} error={errors.pemilik_alamat} onChange={(val) => setField('pemilik_alamat', val)} />
                                    <Input label="Tanggal Mulai Menempati" type="date" value={data.tanggal_mulai_menempati} error={errors.tanggal_mulai_menempati} onChange={(val) => setField('tanggal_mulai_menempati', val)} />
                                    <Input label="Masa Kontrak Selesai" type="date" value={data.masa_kontrak_selesai} error={errors.masa_kontrak_selesai} onChange={(val) => setField('masa_kontrak_selesai', val)} />
                                    {data.status_hunian === 'Kos' && (
                                        <>
                                            <Input label="Nama Kos / Wisma" value={data.nama_kos} error={errors.nama_kos} onChange={(val) => setField('nama_kos', val)} />
                                            <Input label="Nomor Kamar Kos" value={data.nomor_kamar} error={errors.nomor_kamar} onChange={(val) => setField('nomor_kamar', val)} />
                                        </>
                                    )}
                                    <Textarea label="Catatan Hunian Tambahan" value={data.catatan_hunian} error={errors.catatan_hunian} className="sm:col-span-2" onChange={(val) => setField('catatan_hunian', val)} />
                                </div>
                            </section>
                        )}

                        <section className="space-y-4">
                            <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-emerald-700">
                                <FileText size={16} /> Data Kartu Keluarga (KK)
                            </h3>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                                <Input label="Nomor KK *" value={data.no_kk} error={errors.no_kk} onChange={(val) => setField('no_kk', val)} />
                                <Input label="Nama Kepala Keluarga *" value={data.nama_kepala_keluarga} error={errors.nama_kepala_keluarga} onChange={(val) => setField('nama_kepala_keluarga', val)} />
                                <Textarea label="Alamat KK *" value={data.kk_alamat} error={errors.kk_alamat} className="sm:col-span-3" onChange={(val) => setField('kk_alamat', val)} />
                                <Input label="RT *" value={data.rt} error={errors.rt} onChange={(val) => setField('rt', val)} />
                                <Input label="RW *" value={data.rw} error={errors.rw} onChange={(val) => setField('rw', val)} />
                                <Input label="Kelurahan / Desa *" value={data.kelurahan_desa} error={errors.kelurahan_desa} onChange={(val) => setField('kelurahan_desa', val)} />
                                <Input label="Kecamatan *" value={data.kecamatan} error={errors.kecamatan} onChange={(val) => setField('kecamatan', val)} />
                                <Input label="Kabupaten / Kota *" value={data.kabupaten_kota} error={errors.kabupaten_kota} onChange={(val) => setField('kabupaten_kota', val)} />
                                <Input label="Provinsi *" value={data.provinsi} error={errors.provinsi} onChange={(val) => setField('provinsi', val)} />
                                <Input label="Kode Pos" value={data.kode_pos} error={errors.kode_pos} onChange={(val) => setField('kode_pos', val)} />
                            </div>
                        </section>

                        <section className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-emerald-700">
                                    <Users size={16} /> Anggota Keluarga ({data.family_members.length})
                                </h3>
                                <button type="button" onClick={addMember} className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition">
                                    <Plus size={14} /> Tambah Anggota
                                </button>
                            </div>

                            <div className="space-y-5">
                                {data.family_members.map((member, index) => (
                                    <div key={index} className="rounded-2xl border border-slate-200 bg-slate-50 p-5 relative">
                                        <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-2">
                                            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                                                Anggota #{index + 1} — {member.hubungan_keluarga || 'Anggota'}
                                            </span>
                                            {data.family_members.length > 1 && (
                                                <button type="button" onClick={() => removeMember(index)} className="rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 transition" title="Hapus Anggota">
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                                            <Input label="Nama Lengkap *" value={member.nama_lengkap} error={errors[`family_members.${index}.nama_lengkap`]} onChange={(val) => setMember(index, 'nama_lengkap', val)} />
                                            <Input label="NIK *" value={member.nik} error={errors[`family_members.${index}.nik`]} onChange={(val) => setMember(index, 'nik', val)} />
                                            <SelectInput label="Jenis Kelamin *" value={member.jenis_kelamin} options={['Laki-laki', 'Perempuan']} onChange={(val) => setMember(index, 'jenis_kelamin', val)} />
                                            <Input label="Tempat Lahir *" value={member.tempat_lahir} onChange={(val) => setMember(index, 'tempat_lahir', val)} />
                                            <Input label="Tanggal Lahir *" type="date" value={member.tanggal_lahir} onChange={(val) => setMember(index, 'tanggal_lahir', val)} />
                                            <SelectInput label="Agama *" value={member.agama} options={religionOptions} onChange={(val) => setMember(index, 'agama', val)} />
                                            <Input label="Pendidikan *" value={member.pendidikan} onChange={(val) => setMember(index, 'pendidikan', val)} />
                                            <Input label="Pekerjaan *" value={member.pekerjaan} onChange={(val) => setMember(index, 'pekerjaan', val)} />
                                            <SelectInput label="Status Perkawinan *" value={member.status_perkawinan} options={maritalOptions} onChange={(val) => setMember(index, 'status_perkawinan', val)} />
                                            <SelectInput label="Hubungan Keluarga *" value={member.hubungan_keluarga} options={relationshipOptions} onChange={(val) => setMember(index, 'hubungan_keluarga', val)} />
                                            <SelectInput label="Kewarganegaraan *" value={member.kewarganegaraan} options={['WNI', 'WNA']} onChange={(val) => setMember(index, 'kewarganegaraan', val)} />
                                            <Input label="Nama Ayah *" value={member.nama_ayah} onChange={(val) => setMember(index, 'nama_ayah', val)} />
                                            <Input label="Nama Ibu *" value={member.nama_ibu} onChange={(val) => setMember(index, 'nama_ibu', val)} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <div className="sticky bottom-0 -mx-6 flex justify-end gap-3 border-t border-slate-200 bg-white px-6 py-4">
                            <button type="button" onClick={() => onOpenChange(false)} className="rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition">Batal</button>
                            <button type="submit" disabled={processing} className="rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-60 transition shadow-sm">
                                {processing ? 'Menyimpan...' : submitLabel}
                            </button>
                        </div>
                    </form>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}

interface InputProps {
    label: string;
    value: string;
    error?: string;
    type?: string;
    className?: string;
    onChange: (value: string) => void;
}

function Input({ label, value, error, type = 'text', className = '', onChange }: InputProps) {
    return (
        <div className={className}>
            <label className="mb-1.5 block text-xs font-bold text-slate-700">{label}</label>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full rounded-xl bg-slate-50 border border-slate-200 px-4 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
            />
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
    );
}

function Textarea({ label, value, error, className = '', onChange }: InputProps) {
    return (
        <div className={className}>
            <label className="mb-1.5 block text-xs font-bold text-slate-700">{label}</label>
            <textarea
                rows={3}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full rounded-xl bg-slate-50 border border-slate-200 px-4 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
            />
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
    );
}

interface SelectInputProps extends InputProps {
    options: string[];
}

function SelectInput({ label, value, error, options, className = '', onChange }: SelectInputProps) {
    return (
        <div className={className}>
            <label className="mb-1.5 block text-xs font-bold text-slate-700">{label}</label>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full rounded-xl bg-slate-50 border border-slate-200 px-4 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
            >
                {options.map((option) => <option key={option} value={option} className="bg-white text-slate-900">{option}</option>)}
            </select>
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
    );
}

interface InfoProps {
    label: string;
    value?: string | number | null;
}

function Info({ label, value }: InfoProps) {
    return (
        <div className="border-b border-slate-100 py-2">
            <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">{label}</span>
            <p className="text-xs font-bold text-slate-900 mt-0.5">{value || '-'}</p>
        </div>
    );
}

export default function Residents({
    residents = [],
    latestChanges = [],
    stats = { total_tetap: 0, total_kontrak: 0, total_pending: 0 },
}: ResidentsProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterOccupancy, setFilterOccupancy] = useState('all');
    const [filterResident, setFilterResident] = useState('all');
    const [selectedKK, setSelectedKK] = useState<Resident | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<Resident | null>(null);
    const [detailResident, setDetailResident] = useState<Resident | null>(null);
    const [editResident, setEditResident] = useState<Resident | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [accountResident, setAccountResident] = useState<Resident | null>(null);

    const createForm = useForm<ResidentFormData>(emptyForm());
    const editForm = useForm<ResidentFormData>(emptyForm());
    const accountForm = useForm<AccountFormData>({ email: '', password: 'password123' });

    const filteredResidents = useMemo(() => {
        return residents.filter((resident) => {
            const search = searchTerm.toLowerCase();
            const matchSearch =
                resident.headOfFamily.toLowerCase().includes(search) ||
                resident.houseNumber.toLowerCase().includes(search) ||
                resident.kkNumber.toLowerCase().includes(search);

            const matchOccupancy = filterOccupancy === 'all' || resident.occupancyStatus === filterOccupancy;
            const matchResident = filterResident === 'all' || resident.residentStatus === filterResident;

            return matchSearch && matchOccupancy && matchResident;
        });
    }, [residents, searchTerm, filterOccupancy, filterResident]);

    const openCreate = () => {
        createForm.setData(emptyForm());
        createForm.clearErrors();
        setShowCreateModal(true);
    };

    const openEdit = (resident: Resident) => {
        editForm.setData(residentToForm(resident));
        editForm.clearErrors();
        setEditResident(resident);
    };

    const submitCreate = (event: FormEvent) => {
        event.preventDefault();
        createForm.post('/admin/residents', {
            preserveScroll: true,
            onSuccess: () => {
                createForm.reset();
                setShowCreateModal(false);
            },
        });
    };

    const submitEdit = (event: FormEvent) => {
        event.preventDefault();
        if (!editResident) return;
        editForm.put(`/admin/residents/${editResident.id}`, {
            preserveScroll: true,
            onSuccess: () => setEditResident(null),
        });
    };

    const openCreateAccount = (resident: Resident) => {
        accountForm.setData({ email: '', password: 'password123' });
        accountForm.clearErrors();
        setAccountResident(resident);
    };

    const submitCreateAccount = (event: FormEvent) => {
        event.preventDefault();
        if (!accountResident) return;
        accountForm.post(`/admin/residents/${accountResident.id}/create-account`, {
            preserveScroll: true,
            onSuccess: () => {
                accountForm.reset();
                setAccountResident(null);
            },
        });
    };

    const submitDelete = () => {
        if (!deleteConfirm) return;
        router.delete(`/admin/residents/${deleteConfirm.id}`, {
            preserveScroll: true,
            onSuccess: () => setDeleteConfirm(null),
        });
    };

    // Calculate real stats dynamically
    const totalUnitsCount = residents.length;
    const occupiedUnitsCount = residents.filter(r => r.headOfFamily !== '-' && r.occupancyStatus !== 'Kosong').length;
    const emptyUnitsCount = totalUnitsCount - occupiedUnitsCount;
    const occupancyRate = totalUnitsCount > 0 ? Math.round((occupiedUnitsCount / totalUnitsCount) * 100) : 0;
    const permanentCount = residents.filter(r => r.occupancyStatus === 'Milik Sendiri').length;
    const contractCount = residents.filter(r => ['Kontrak/Sewa', 'Kos'].includes(r.occupancyStatus)).length;

    // Grid map calculation (generate cells based on residents)
    const mapCells = useMemo(() => {
        return residents.slice(0, 16).map(r => {
            let colorClass = 'bg-slate-100 border border-slate-200 text-slate-700'; // Default kosong
            if (r.occupancyStatus === 'Milik Sendiri') colorClass = 'bg-emerald-50 border border-emerald-200 text-emerald-700';
            else if (['Kontrak/Sewa', 'Kos'].includes(r.occupancyStatus)) colorClass = 'bg-blue-50 border border-blue-200 text-blue-700';
            return {
                id: r.id,
                unit: r.houseNumber,
                headOfFamily: r.headOfFamily,
                colorClass,
                resident: r
            };
        });
    }, [residents]);

    return (
        <AdminLayout activeMenu="residents">
            <Head title="Data Hunian & KK - SMART-RT" />

            {/* Title Header Section */}
            <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <h2 className="text-3xl font-black text-slate-900">Data Warga</h2>
                    <p className="mt-1 text-sm text-slate-600 font-medium">Manajemen unit perumahan, status okupansi, dan data keluarga.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button type="button" onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 transition duration-200 shadow-sm">
                        <Plus size={14} />
                        <span>Tambah Unit</span>
                    </button>
                </div>
            </div>

            {/* 3 Metric Card Rows */}
            <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
                {/* Status Tetap Card */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm relative overflow-hidden">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">STATUS TETAP</span>
                        <div className="h-2.5 w-2.5 rounded-full bg-emerald-500"></div>
                    </div>
                    <div className="mt-4">
                        <h3 className="text-3xl font-black text-slate-900">{stats.total_tetap}</h3>
                        <p className="text-[10px] text-slate-500 font-semibold mt-1">
                            {Math.round((stats.total_tetap / (residents.length || 1)) * 100)}% Kapasitas
                        </p>
                    </div>
                </div>

                {/* Status Kontrak Card */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm relative overflow-hidden">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">STATUS KONTRAK</span>
                        <div className="h-2.5 w-2.5 rounded-full bg-amber-500"></div>
                    </div>
                    <div className="mt-4">
                        <h3 className="text-3xl font-black text-slate-900">{stats.total_kontrak}</h3>
                        <p className="text-[10px] text-slate-500 font-semibold mt-1">Berdasarkan Status</p>
                    </div>
                </div>

                {/* Data Pending Card */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm relative overflow-hidden">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">DATA PENDING</span>
                        <div className="h-2.5 w-2.5 rounded-full bg-red-500"></div>
                    </div>
                    <div className="mt-4">
                        <h3 className="text-3xl font-black text-slate-900">{stats.total_pending}</h3>
                        <p className="text-[10px] text-slate-500 font-semibold mt-1">{stats.total_pending} Data Baru</p>
                    </div>
                </div>
            </div>

            {/* Content Layout Grid */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Left Column: Data Table (2/3) */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                        {/* Table Header / Filters */}
                        <div className="border-b border-slate-200 p-4">
                            <div className="flex flex-col gap-3 sm:flex-row">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input
                                        type="text"
                                        placeholder="Cari kepala keluarga, no rumah, atau no KK..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full rounded-full bg-slate-50 border border-slate-200 py-2 pl-10 pr-4 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                                    />
                                </div>
                                <div className="flex gap-2 shrink-0">
                                    <select value={filterOccupancy} onChange={(e) => setFilterOccupancy(e.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 focus:bg-white focus:outline-none focus:border-emerald-500">
                                        <option value="all">Semua Hunian</option>
                                        {occupancyOptions.map((option) => <option key={option} value={option} className="bg-white">{option}</option>)}
                                    </select>
                                    <select value={filterResident} onChange={(e) => setFilterResident(e.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 focus:bg-white focus:outline-none focus:border-emerald-500">
                                        <option value="all">Semua Status</option>
                                        {residentStatusOptions.map((option) => <option key={option} value={option} className="bg-white">{option}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Responsive Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-left min-w-[800px]">
                                <thead>
                                    <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                                        <th className="px-5 py-3.5">KEPALA KELUARGA</th>
                                        <th className="px-5 py-3.5">STATUS RUMAH</th>
                                        <th className="px-5 py-3.5">KONTAK DARURAT</th>
                                        <th className="w-24 px-5 py-3.5 text-right">AKSI</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredResidents.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-5 py-12 text-center text-slate-500 text-xs">
                                                Belum ada data warga/hunian yang terdaftar.
                                            </td>
                                        </tr>
                                    )}
                                    {filteredResidents.map((resident) => {
                                        const fullAddress = resident.address || `Jl. Melati No. ${resident.houseNumber}, Blok A1, RT 003/RW 005`;
                                        const badgeClass = getResidentBadgeColor(resident.residentStatus);

                                        return (
                                            <tr key={resident.id} className="text-xs transition hover:bg-slate-50/80 text-slate-700">
                                                <td className="px-5 py-4">
                                                    <div className="max-w-md">
                                                        <button
                                                            type="button"
                                                            onClick={() => setSelectedKK(resident)}
                                                            className="font-bold text-slate-900 hover:text-emerald-700 hover:underline text-left transition"
                                                        >
                                                            {resident.headOfFamily}
                                                        </button>
                                                        <span className="text-[10px] text-slate-500 font-semibold block mt-1">
                                                            {fullAddress}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider whitespace-nowrap ${badgeClass}`}>
                                                        {resident.residentStatus}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-1.5 text-slate-600">
                                                        <Phone size={12} className="text-slate-400" />
                                                        <span>{resident.phone || '-'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4 text-right">
                                                    <div className="flex justify-end items-center gap-1">
                                                        <button
                                                            type="button"
                                                            onClick={() => openEdit(resident)}
                                                            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-emerald-700 transition"
                                                            title="Edit"
                                                        >
                                                            <Edit size={14} />
                                                        </button>

                                                        <DropdownMenu.Root>
                                                            <DropdownMenu.Trigger asChild>
                                                                <button className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition">
                                                                    <MoreVertical size={14} />
                                                                </button>
                                                            </DropdownMenu.Trigger>
                                                            <DropdownMenu.Portal>
                                                                <DropdownMenu.Content className="z-50 w-48 overflow-hidden rounded-2xl border border-slate-200 bg-white py-1 shadow-xl text-slate-800" sideOffset={5}>
                                                                    <DropdownMenu.Item onClick={() => setDetailResident(resident)} className="flex cursor-pointer items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-slate-700 outline-none hover:bg-slate-50 hover:text-emerald-700 transition duration-150">
                                                                        <Eye size={14} /> Lihat Detail
                                                                    </DropdownMenu.Item>
                                                                    <DropdownMenu.Item onClick={() => setSelectedKK(resident)} className="flex cursor-pointer items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-slate-700 outline-none hover:bg-slate-50 hover:text-emerald-700 transition duration-150">
                                                                        <FileText size={14} /> Kartu Keluarga
                                                                    </DropdownMenu.Item>
                                                                    {resident.hasAccount ? (
                                                                        <DropdownMenu.Item className="flex cursor-default items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-slate-400 outline-none" onSelect={(event) => event.preventDefault()}>
                                                                            <UserPlus size={14} /> Akun Terhubung
                                                                        </DropdownMenu.Item>
                                                                    ) : (
                                                                        <DropdownMenu.Item onClick={() => openCreateAccount(resident)} className="flex cursor-pointer items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-amber-700 outline-none hover:bg-amber-50 transition duration-150">
                                                                            <UserPlus size={14} /> Buat Akun Warga
                                                                        </DropdownMenu.Item>
                                                                    )}
                                                                    <DropdownMenu.Separator className="my-1 h-px bg-slate-100" />
                                                                    <DropdownMenu.Item onClick={() => setDeleteConfirm(resident)} className="flex cursor-pointer items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-red-700 outline-none hover:bg-red-50 transition duration-150">
                                                                        <Trash2 size={14} /> Hapus
                                                                    </DropdownMenu.Item>
                                                                </DropdownMenu.Content>
                                                            </DropdownMenu.Portal>
                                                        </DropdownMenu.Root>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Right Column: Peta Hunian & Update Terkini (1/3) */}
                <div className="space-y-6">
                    {/* Peta Hunian Grid Card */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2"><Map size={16} className="text-emerald-700" /> Peta Hunian RT</h3>
                            <span className="text-[10px] text-slate-500 font-bold">16 Unit Terdekat</span>
                        </div>

                        {/* Grid Map layout */}
                        <div className="grid grid-cols-4 gap-2.5 py-2">
                            {mapCells.map((c) => (
                                <Popover.Root key={c.id}>
                                    <Popover.Trigger asChild>
                                        <button
                                            type="button"
                                            className={`h-11 rounded-lg text-[9px] font-black transition duration-200 hover:scale-105 flex flex-col items-center justify-center ${c.colorClass}`}
                                        >
                                            {c.unit}
                                        </button>
                                    </Popover.Trigger>
                                    <Popover.Portal>
                                        <Popover.Content className="z-50 w-64 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl text-xs text-slate-700" sideOffset={5}>
                                            <p className="font-black text-slate-900 text-xs">Unit {c.unit}</p>
                                            <p className="mt-1.5 font-semibold text-slate-600">Kepala Keluarga: <span className="text-slate-900 font-bold">{c.headOfFamily}</span></p>
                                            <p className="mt-0.5 text-slate-600 font-medium">Status: <span className="text-emerald-700 font-bold">{c.resident.occupancyStatus}</span></p>
                                            <Popover.Arrow className="fill-white stroke-slate-200" />
                                        </Popover.Content>
                                    </Popover.Portal>
                                </Popover.Root>
                            ))}
                        </div>

                        {/* Map Legend */}
                        <div className="mt-4 flex items-center justify-between text-[9px] font-bold text-slate-500 border-t border-slate-100 pt-3">
                            <div className="flex items-center gap-1.5">
                                <span className="h-2 w-2 rounded bg-emerald-600"></span>
                                <span>Permanen</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="h-2 w-2 rounded bg-blue-600"></span>
                                <span>Kontrak/Sewa</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="h-2 w-2 rounded bg-slate-200 border border-slate-300"></span>
                                <span>Kosong</span>
                            </div>
                        </div>
                    </div>

                    {/* Update Terkini Audit Logs */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2"><History size={16} className="text-emerald-700" /> Update Terkini</h3>
                        </div>

                        <div className="space-y-4 flex-1">
                            {latestChanges.length === 0 ? (
                                <p className="text-slate-500 text-xs italic py-4">Belum ada perubahan profil yang tercatat.</p>
                            ) : (
                                latestChanges.map((log) => {
                                    // Custom visual tags based on field
                                    let dotColor = 'bg-emerald-600';
                                    if (log.field === 'email') dotColor = 'bg-blue-600';
                                    else if (log.field === 'password') dotColor = 'bg-red-600';

                                    return (
                                        <div key={log.id} className="flex gap-3 text-xs leading-normal">
                                            <div className="relative flex flex-col items-center shrink-0">
                                                <span className={`h-2.5 w-2.5 rounded-full mt-1.5 ${dotColor}`}></span>
                                                <span className="w-px bg-slate-200 flex-1 mt-2"></span>
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900">
                                                    {log.field === 'status_hunian' ? 'Perubahan Status Hunian' : (log.field === 'status_warga' ? 'Perubahan Status Warga' : 'Pembaruan Profil')}
                                                </p>
                                                <p className="text-[10px] text-slate-600 mt-0.5">
                                                    Warga: <span className="text-slate-900 font-bold">{log.wargaName}</span>
                                                </p>
                                                <p className="text-[10px] text-slate-500 mt-1 font-semibold">{log.createdAt}</p>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        <Link
                            href="/admin/profile-change-logs"
                            className="mt-6 block w-full rounded-xl border border-slate-200 py-2.5 text-center text-xs font-bold text-slate-700 hover:bg-slate-50 transition duration-200"
                        >
                            Lihat Semua Riwayat
                        </Link>
                    </div>
                </div>
            </div>

            {/* Render form and detail modals inside dark mode layout */}
            <ResidentFormModal
                open={showCreateModal}
                title="Tambah Data Warga / Hunian"
                submitLabel="Simpan Data"
                data={createForm.data}
                errors={createForm.errors as ErrorBag}
                processing={createForm.processing}
                onOpenChange={setShowCreateModal}
                onSubmit={submitCreate}
                setField={createForm.setData}
            />

            <ResidentFormModal
                open={editResident !== null}
                title="Edit Data Warga / Hunian"
                submitLabel="Simpan Perubahan"
                data={editForm.data}
                errors={editForm.errors as ErrorBag}
                processing={editForm.processing}
                onOpenChange={(open) => !open && setEditResident(null)}
                onSubmit={submitEdit}
                setField={editForm.setData}
            />

            {/* Kartu Keluarga Modal */}
            <Dialog.Root open={selectedKK !== null} onOpenChange={(open) => !open && setSelectedKK(null)}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm" />
                    <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[96vw] max-w-6xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl border border-slate-200 bg-white text-slate-900 shadow-2xl">
                        <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
                            <Dialog.Title className="text-xl font-black text-slate-900">KARTU KELUARGA</Dialog.Title>
                            <Dialog.Close asChild><button className="rounded-xl p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-900 transition"><X size={20} /></button></Dialog.Close>
                        </div>

                        {selectedKK && (
                            <div className="p-6 space-y-6">
                                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                                    <div className="grid grid-cols-1 gap-4 text-xs md:grid-cols-2">
                                        <Info label="Nomor Kartu Keluarga" value={selectedKK.kkDetail?.kkNumber} />
                                        <Info label="Nama Kepala Keluarga" value={selectedKK.kkDetail?.headOfFamily} />
                                        <Info label="Alamat" value={selectedKK.kkDetail?.address ?? selectedKK.address} />
                                        <Info label="RT/RW" value={`${selectedKK.kkDetail?.rt ?? '-'} / ${selectedKK.kkDetail?.rw ?? '-'}`} />
                                        <Info label="Kelurahan/Desa" value={selectedKK.kkDetail?.village} />
                                        <Info label="Kecamatan" value={selectedKK.kkDetail?.district} />
                                        <Info label="Kabupaten/Kota" value={selectedKK.kkDetail?.city} />
                                        <Info label="Provinsi" value={selectedKK.kkDetail?.province} />
                                        <Info label="Kode Pos" value={selectedKK.kkDetail?.postalCode} />
                                    </div>
                                </div>

                                <div>
                                    <h3 className="mb-4 flex items-center gap-2 font-black text-slate-900 text-xs"><Users size={16} className="text-emerald-700" /> DAFTAR ANGGOTA KELUARGA</h3>
                                    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
                                        <table className="w-full text-left text-[11px] min-w-[1200px]">
                                            <thead>
                                                <tr className="border-b border-slate-200 bg-slate-50 text-[9px] font-bold uppercase text-slate-600">
                                                    {['No', 'Nama Lengkap', 'NIK', 'JK', 'Tempat Lahir', 'Tanggal Lahir', 'Agama', 'Pendidikan', 'Pekerjaan', 'Status Perkawinan', 'Hub. Keluarga', 'Kewarganegaraan'].map((header) => <th key={header} className="px-3 py-2">{header}</th>)}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {selectedKK.familyMembers?.map((member, index) => (
                                                    <tr key={`${member.nik}-${index}`} className="hover:bg-slate-50 text-slate-700">
                                                        <td className="px-3 py-3 text-slate-500 font-bold">{index + 1}</td>
                                                        <td className="px-3 py-3 font-bold text-slate-900">{member.name}</td>
                                                        <td className="px-3 py-3 font-mono">{member.nik}</td>
                                                        <td className="px-3 py-3">{member.gender}</td>
                                                        <td className="px-3 py-3">{member.birthPlace}</td>
                                                        <td className="px-3 py-3">{formatDate(member.birthDate)}</td>
                                                        <td className="px-3 py-3">{member.religion}</td>
                                                        <td className="px-3 py-3">{member.education}</td>
                                                        <td className="px-3 py-3">{member.occupation}</td>
                                                        <td className="px-3 py-3">{member.maritalStatus}</td>
                                                        <td className="px-3 py-3">{member.relationship}</td>
                                                        <td className="px-3 py-3">{member.citizenship}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>

            {/* Detail Warga Modal */}
            <Dialog.Root open={detailResident !== null} onOpenChange={(open) => !open && setDetailResident(null)}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm" />
                    <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[96vw] max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl border border-slate-200 bg-white text-slate-900 shadow-2xl">
                        <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
                            <Dialog.Title className="text-xl font-black text-slate-900">DETAIL UNIT & KK</Dialog.Title>
                            <Dialog.Close asChild><button className="rounded-xl p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-900 transition"><X size={20} /></button></Dialog.Close>
                        </div>

                        {detailResident && (
                            <div className="p-6 space-y-6">
                                <div className="grid grid-cols-1 gap-4 text-xs sm:grid-cols-2">
                                    <Info label="No. Rumah" value={detailResident.houseNumber} />
                                    <Info label="Kontak Darurat" value={detailResident.phone} />
                                    <Info label="Status Hunian" value={detailResident.occupancyStatus} />
                                    <Info label="Status Warga" value={detailResident.residentStatus} />
                                    <div className="col-span-2">
                                        <Info label="Alamat Hunian" value={detailResident.address} />
                                    </div>
                                </div>

                                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-4">
                                    <h4 className="text-xs font-black text-emerald-700 uppercase tracking-wider">Detail Kepemilikan</h4>
                                    <div className="grid grid-cols-1 gap-4 text-xs sm:grid-cols-2">
                                        <Info label="Nama Pemilik" value={detailResident.occupancyDetails?.owner} />
                                        <Info label="Kontak Pemilik" value={detailResident.occupancyDetails?.ownerContact} />
                                        <div className="col-span-2">
                                            <Info label="Alamat Pemilik" value={detailResident.occupancyDetails?.ownerAddress} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>

            {/* Create Account Modal */}
            <Dialog.Root open={accountResident !== null} onOpenChange={(open) => !open && setAccountResident(null)}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm" />
                    <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[96vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-slate-200 bg-white text-slate-900 shadow-2xl p-6">
                        <Dialog.Title className="text-lg font-black text-slate-900 mb-1">Buat Akun Warga</Dialog.Title>
                        {accountResident && (
                            <p className="text-xs text-slate-600 mb-4">
                                Membuat akun untuk kepala keluarga unit <span className="font-bold text-slate-900">{accountResident.houseNumber}</span> — <span className="font-bold text-emerald-700">{accountResident.headOfFamily}</span>
                            </p>
                        )}
                        <form onSubmit={submitCreateAccount} className="space-y-4">
                            {(accountForm.errors as Record<string, string>).account && (
                                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
                                    {(accountForm.errors as Record<string, string>).account}
                                </div>
                            )}
                            <Input label="Email Login *" type="email" value={accountForm.data.email} error={accountForm.errors.email} onChange={(val) => accountForm.setData('email', val)} />
                            <Input label="Password *" type="password" value={accountForm.data.password} error={accountForm.errors.password} onChange={(val) => accountForm.setData('password', val)} />

                            <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-200">
                                <button type="button" onClick={() => setAccountResident(null)} className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition">Batal</button>
                                <button type="submit" disabled={accountForm.processing} className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-60 transition">
                                    {accountForm.processing ? 'Membuat...' : 'Buat Akun'}
                                </button>
                            </div>
                        </form>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>

            {/* Delete Confirmation Modal */}
            <Dialog.Root open={deleteConfirm !== null} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm" />
                    <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[96vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-slate-200 bg-white text-slate-900 shadow-2xl p-6">
                        <Dialog.Title className="text-lg font-black text-slate-900 mb-2">Hapus Data Warga?</Dialog.Title>
                        <p className="text-xs text-slate-600 leading-relaxed">
                            Apakah Anda yakin ingin menghapus data warga unit <span className="text-slate-900 font-bold">{deleteConfirm?.houseNumber}</span> (KK: {deleteConfirm?.headOfFamily})? Tindakan ini tidak dapat dibatalkan.
                        </p>
                        <div className="flex justify-end gap-2.5 pt-6 mt-4 border-t border-slate-200">
                            <button type="button" onClick={() => setDeleteConfirm(null)} className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition">Batal</button>
                            <button type="button" onClick={submitDelete} className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 transition">Hapus Data</button>
                        </div>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>
        </AdminLayout>
    );
}
