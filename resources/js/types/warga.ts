export interface WargaProfile {
    name: string;
    initials: string;
    email?: string | null;
    phone?: string | null;
    houseNumber?: string | null;
    rt?: string | null;
    rw?: string | null;
    statusHunian?: string | null;
    statusWarga?: string | null;
    address?: string | null;
    profilePhotoUrl?: string | null;
    hasLinkedWarga: boolean;
    jenisKelamin?: string | null;
    hubunganKeluarga?: string | null;
    nik?: string | null;
}

export interface KartuKeluargaData {
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
}

export interface AnggotaKeluargaData {
    id: number;
    nama: string;
    nik?: string | null;
    jk?: string | null;
    tempatLahir?: string | null;
    tanggalLahir?: string | null;
    agama?: string | null;
    pendidikan?: string | null;
    pekerjaan?: string | null;
    statusPerkawinan?: string | null;
    hubungan?: string | null;
    kewarganegaraan?: string | null;
    namaAyah?: string | null;
    namaIbu?: string | null;
}

export interface WargaEventData {
    id: number;
    title: string;
    date?: string | null;
    time?: string | null;
    location?: string | null;
    category?: string | null;
    status?: string | null;
    description?: string | null;
    mandatory?: boolean;
}

export interface WargaAnnouncementData {
    id: number;
    title: string;
    date?: string | null;
    category?: string | null;
    content?: string | null;
    important?: boolean;
}

export interface WargaBillData {
    id: number;
    title: string;
    period?: string | null;
    amount: number;
    dueDate?: string | null;
    status?: string | null;
}

export interface WargaPaymentData {
    id: number;
    title: string;
    date?: string | null;
    amount: number;
    method?: string | null;
    status?: string | null;
}

export interface WargaComplaintData {
    id: number;
    title: string;
    category?: string | null;
    date?: string | null;
    status?: string | null;
    response?: string | null;
}

export interface WargaLetterRequestData {
    id: number;
    title: string;
    date?: string | null;
    status?: string | null;
    notes?: string | null;
}
