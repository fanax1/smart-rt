<?php

namespace Database\Seeders;

use App\Models\Hunian;
use App\Models\KartuKeluarga;
use App\Models\User;
use App\Models\Warga;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class HunianKkSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Clean up previous seeded families to prevent duplicates
        $emails = [
            'ahmad@smart-rt.test',
            'budi@smart-rt.test',
            'hendra@smart-rt.test',
            'joko@smart-rt.test',
            'fajar@smart-rt.test',
            'rian@smart-rt.test',
            'agus@smart-rt.test'
        ];
        User::whereIn('email', $emails)->delete();
        
        $noRumahs = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', 'D-01', 'D-02', 'D-03', 'D-04', 'D-05', 'D-06', 'D-07', 'D-08', 'D-09', 'D-10'];
        Hunian::whereIn('no_rumah', $noRumahs)->each(function($hunian) {
            $hunian->wargas()->delete();
            $hunian->kartuKeluarga()->delete();
            $hunian->delete();
        });

        // 2. Define 10 families data with specific address patterns and ownership details
        $familiesData = [
            [
                'no_rumah' => '01',
                'status_hunian' => 'Milik Sendiri',
                'status_warga' => 'Warga Tetap',
                'kontak_penghuni' => '081298765431',
                'no_kk' => '3216061234560001',
                'alamat' => 'KP UJUNG HARAPAN RT004/RW005, NO –01, KEL.BAHAGIA, KEC. BABELAN, BEKASI',
                'kepala' => [
                    'nama' => 'Ahmad Subarjo',
                    'nik' => '3216061203800001',
                    'jk' => 'Laki-laki',
                    'tempat_lahir' => 'Bekasi',
                    'tanggal_lahir' => '1980-03-12',
                    'agama' => 'Islam',
                    'pendidikan' => 'S1 Teknik',
                    'pekerjaan' => 'Pegawai Negeri Sipil',
                    'perkawinan' => 'Kawin',
                    'ayah' => 'Suwito Subarjo',
                    'ibu' => 'Sumarni',
                ],
                'anggota' => [
                    [
                        'nama' => 'Siti Aminah',
                        'nik' => '3216065504820001',
                        'jk' => 'Perempuan',
                        'tempat_lahir' => 'Bandung',
                        'tanggal_lahir' => '1982-04-15',
                        'agama' => 'Islam',
                        'pendidikan' => 'SMA',
                        'pekerjaan' => 'Mengurus Rumah Tangga',
                        'perkawinan' => 'Kawin',
                        'hubungan' => 'Istri',
                        'ayah' => 'Rahmat',
                        'ibu' => 'Aminah',
                    ],
                    [
                        'nama' => 'Rizky Subarjo',
                        'nik' => '3216061010100001',
                        'jk' => 'Laki-laki',
                        'tempat_lahir' => 'Bekasi',
                        'tanggal_lahir' => '2010-10-10',
                        'agama' => 'Islam',
                        'pendidikan' => 'SMP',
                        'pekerjaan' => 'Pelajar',
                        'perkawinan' => 'Belum Kawin',
                        'hubungan' => 'Anak',
                        'ayah' => 'Ahmad Subarjo',
                        'ibu' => 'Siti Aminah',
                    ]
                ],
                'email' => 'ahmad@smart-rt.test',
                'pemilik' => null,
            ],
            [
                'no_rumah' => '02',
                'status_hunian' => 'Milik Sendiri',
                'status_warga' => 'Warga Tetap',
                'kontak_penghuni' => '081298765432',
                'no_kk' => '3216061234560002',
                'alamat' => 'KP UJUNG HARAPAN RT004/RW005, NO –02, KEL.BAHAGIA, KEC. BABELAN, BEKASI',
                'kepala' => [
                    'nama' => 'Budi Hartono',
                    'nik' => '3216061506850002',
                    'jk' => 'Laki-laki',
                    'tempat_lahir' => 'Semarang',
                    'tanggal_lahir' => '1985-06-15',
                    'agama' => 'Kristen',
                    'pendidikan' => 'D3 Bisnis',
                    'pekerjaan' => 'Wiraswasta',
                    'perkawinan' => 'Kawin',
                    'ayah' => 'Yohanes Hartono',
                    'ibu' => 'Maria',
                ],
                'anggota' => [
                    [
                        'nama' => 'Lia Indriani',
                        'nik' => '3216064508880002',
                        'jk' => 'Perempuan',
                        'tempat_lahir' => 'Surabaya',
                        'tanggal_lahir' => '1988-08-05',
                        'agama' => 'Kristen',
                        'pendidikan' => 'S1 Ekonomi',
                        'pekerjaan' => 'Karyawan Swasta',
                        'perkawinan' => 'Kawin',
                        'hubungan' => 'Istri',
                        'ayah' => 'Hartanto',
                        'ibu' => 'Indah',
                    ],
                    [
                        'nama' => 'Devi Hartono',
                        'nik' => '3216065212140002',
                        'jk' => 'Perempuan',
                        'tempat_lahir' => 'Bekasi',
                        'tanggal_lahir' => '2014-12-12',
                        'agama' => 'Kristen',
                        'pendidikan' => 'SD',
                        'pekerjaan' => 'Pelajar',
                        'perkawinan' => 'Belum Kawin',
                        'hubungan' => 'Anak',
                        'ayah' => 'Budi Hartono',
                        'ibu' => 'Lia Indriani',
                    ]
                ],
                'email' => 'budi@smart-rt.test',
                'pemilik' => null,
            ],
            [
                'no_rumah' => '03',
                'status_hunian' => 'Kontrak/Sewa',
                'status_warga' => 'Warga Kontrak',
                'kontak_penghuni' => '081298765433',
                'no_kk' => '3216061234560003',
                'alamat' => 'KP UJUNG HARAPAN RT004/RW005, NO –03, KEL.BAHAGIA, KEC. BABELAN, BEKASI',
                'kepala' => [
                    'nama' => 'Hendra Wijaya',
                    'nik' => '3216062104880003',
                    'jk' => 'Laki-laki',
                    'tempat_lahir' => 'Bogor',
                    'tanggal_lahir' => '1988-04-21',
                    'agama' => 'Islam',
                    'pendidikan' => 'D3 Komputer',
                    'pekerjaan' => 'Karyawan Swasta',
                    'perkawinan' => 'Kawin',
                    'ayah' => 'Tirto Wijaya',
                    'ibu' => 'Kartini',
                ],
                'anggota' => [
                    [
                        'nama' => 'Dewi Lestari',
                        'nik' => '3216065911900003',
                        'jk' => 'Perempuan',
                        'tempat_lahir' => 'Cirebon',
                        'tanggal_lahir' => '1990-11-19',
                        'agama' => 'Islam',
                        'pendidikan' => 'SMA',
                        'pekerjaan' => 'Karyawan Swasta',
                        'perkawinan' => 'Kawin',
                        'hubungan' => 'Istri',
                        'ayah' => 'Subandi',
                        'ibu' => 'Sulasmi',
                    ]
                ],
                'email' => 'hendra@smart-rt.test',
                'pemilik' => [
                    'nama' => 'Budiman',
                    'kontak' => '081288887777',
                    'alamat' => 'KP UJUNG HARAPAN RT004/RW005, NO – 22, KEL.BAHAGIA, KEC. BABELAN, BEKASI',
                ],
            ],
            [
                'no_rumah' => '04',
                'status_hunian' => 'Milik Sendiri',
                'status_warga' => 'Warga Tetap',
                'kontak_penghuni' => '081298765434',
                'no_kk' => '3216061234560004',
                'alamat' => 'KP UJUNG HARAPAN RT004/RW005, NO –04, KEL.BAHAGIA, KEC. BABELAN, BEKASI',
                'kepala' => [
                    'nama' => 'Joko Prasetyo',
                    'nik' => '3216060101780004',
                    'jk' => 'Laki-laki',
                    'tempat_lahir' => 'Solo',
                    'tanggal_lahir' => '1978-01-01',
                    'agama' => 'Islam',
                    'pendidikan' => 'S1 Hukum',
                    'pekerjaan' => 'Pegawai Negeri Sipil',
                    'perkawinan' => 'Kawin',
                    'ayah' => 'Siswanto',
                    'ibu' => 'Ningsih',
                ],
                'anggota' => [
                    [
                        'nama' => 'Rina Wulandari',
                        'nik' => '3216064205810004',
                        'jk' => 'Perempuan',
                        'tempat_lahir' => 'Yogyakarta',
                        'tanggal_lahir' => '1981-05-02',
                        'agama' => 'Islam',
                        'pendidikan' => 'S1 Administrasi',
                        'pekerjaan' => 'Mengurus Rumah Tangga',
                        'perkawinan' => 'Kawin',
                        'hubungan' => 'Istri',
                        'ayah' => 'Sunardi',
                        'ibu' => 'Pujiati',
                    ]
                ],
                'email' => 'joko@smart-rt.test',
                'pemilik' => null,
            ],
            [
                'no_rumah' => '05',
                'status_hunian' => 'Kontrak/Sewa',
                'status_warga' => 'Warga Kontrak',
                'kontak_penghuni' => '081298765435',
                'no_kk' => '3216061234560005',
                'alamat' => 'KP UJUNG HARAPAN RT004/RW005, NO –05, KEL.BAHAGIA, KEC. BABELAN, BEKASI',
                'kepala' => [
                    'nama' => 'Fajar Nugroho',
                    'nik' => '3216061909920005',
                    'jk' => 'Laki-laki',
                    'tempat_lahir' => 'Bekasi',
                    'tanggal_lahir' => '1992-09-19',
                    'agama' => 'Islam',
                    'pendidikan' => 'SMA',
                    'pekerjaan' => 'Karyawan Swasta',
                    'perkawinan' => 'Kawin',
                    'ayah' => 'Supriyadi',
                    'ibu' => 'Ratna',
                ],
                'anggota' => [
                    [
                        'nama' => 'Yanti Purwanti',
                        'nik' => '3216066203940005',
                        'jk' => 'Perempuan',
                        'tempat_lahir' => 'Karawang',
                        'tanggal_lahir' => '1994-03-22',
                        'agama' => 'Islam',
                        'pendidikan' => 'SMA',
                        'pekerjaan' => 'Karyawan Swasta',
                        'perkawinan' => 'Kawin',
                        'hubungan' => 'Istri',
                        'ayah' => 'Kusnadi',
                        'ibu' => 'Aisyah',
                    ]
                ],
                'email' => 'fajar@smart-rt.test',
                'pemilik' => [
                    'nama' => 'Hj. Maryam',
                    'kontak' => '081377776666',
                    'alamat' => 'KP UJUNG HARAPAN RT004/RW005, NO – 35, KEL.BAHAGIA, KEC. BABELAN, BEKASI',
                ],
            ],
            [
                'no_rumah' => '06',
                'status_hunian' => 'Kos',
                'status_warga' => 'Warga Kos',
                'kontak_penghuni' => '081298765436',
                'no_kk' => '3216061234560006',
                'alamat' => 'KP UJUNG HARAPAN RT004/RW005, NO –06, KEL.BAHAGIA, KEC. BABELAN, BEKASI',
                'kepala' => [
                    'nama' => 'Rian Hidayat',
                    'nik' => '3216062508980006',
                    'jk' => 'Laki-laki',
                    'tempat_lahir' => 'Medan',
                    'tanggal_lahir' => '1998-08-25',
                    'agama' => 'Islam',
                    'pendidikan' => 'S1 Sedang Kuliah',
                    'pekerjaan' => 'Pelajar/Mahasiswa',
                    'perkawinan' => 'Belum Kawin',
                    'ayah' => 'Syamsul Hidayat',
                    'ibu' => 'Fatimah',
                ],
                'anggota' => [],
                'email' => 'rian@smart-rt.test',
                'pemilik' => [
                    'nama' => 'Pak Saino',
                    'kontak' => '081122223333',
                    'alamat' => 'KP UJUNG HARAPAN RT004/RW005, NO – 09, KEL.BAHAGIA, KEC. BABELAN, BEKASI',
                    'nama_kos' => 'Kos Barokah Babelan',
                    'nomor_kamar' => 'Kamar 06',
                ],
            ],
            [
                'no_rumah' => '07',
                'status_hunian' => 'Milik Sendiri',
                'status_warga' => 'Warga Tetap',
                'kontak_penghuni' => '081298765437',
                'no_kk' => '3216061234560007',
                'alamat' => 'KP UJUNG HARAPAN RT004/RW005, NO –07, KEL.BAHAGIA, KEC. BABELAN, BEKASI',
                'kepala' => [
                    'nama' => 'Agus Saputra',
                    'nik' => '3216061212820007',
                    'jk' => 'Laki-laki',
                    'tempat_lahir' => 'Malang',
                    'tanggal_lahir' => '1982-12-12',
                    'agama' => 'Islam',
                    'pendidikan' => 'D3 Militer',
                    'pekerjaan' => 'Tentara Nasional Indonesia',
                    'perkawinan' => 'Kawin',
                    'ayah' => 'Sujatmiko',
                    'ibu' => 'Endang',
                ],
                'anggota' => [
                    [
                        'nama' => 'Sri Wahyuni',
                        'nik' => '3216064505850007',
                        'jk' => 'Perempuan',
                        'tempat_lahir' => 'Kediri',
                        'tanggal_lahir' => '1985-05-05',
                        'agama' => 'Islam',
                        'pendidikan' => 'SMA',
                        'pekerjaan' => 'Mengurus Rumah Tangga',
                        'perkawinan' => 'Kawin',
                        'hubungan' => 'Istri',
                        'ayah' => 'Purnomo',
                        'ibu' => 'Suprihatin',
                    ]
                ],
                'email' => 'agus@smart-rt.test',
                'pemilik' => null,
            ],
            [
                'no_rumah' => '08',
                'status_hunian' => 'Milik Sendiri',
                'status_warga' => 'Warga Tetap',
                'kontak_penghuni' => '081298765438',
                'no_kk' => '3216061234560008',
                'alamat' => 'KP UJUNG HARAPAN RT004/RW005, NO –08, KEL.BAHAGIA, KEC. BABELAN, BEKASI',
                'kepala' => [
                    'nama' => 'Dedi Kurniawan',
                    'nik' => '3216061405830008',
                    'jk' => 'Laki-laki',
                    'tempat_lahir' => 'Palembang',
                    'tanggal_lahir' => '1983-05-14',
                    'agama' => 'Islam',
                    'pendidikan' => 'S1 Teknik',
                    'pekerjaan' => 'Karyawan Swasta',
                    'perkawinan' => 'Kawin',
                    'ayah' => 'Burhanuddin',
                    'ibu' => 'Rosidah',
                ],
                'anggota' => [
                    [
                        'nama' => 'Mega Utami',
                        'nik' => '3216065409860008',
                        'jk' => 'Perempuan',
                        'tempat_lahir' => 'Lampung',
                        'tanggal_lahir' => '1986-09-14',
                        'agama' => 'Islam',
                        'pendidikan' => 'S1 Komunikasi',
                        'pekerjaan' => 'Mengurus Rumah Tangga',
                        'perkawinan' => 'Kawin',
                        'hubungan' => 'Istri',
                        'ayah' => 'Syarif',
                        'ibu' => 'Ratna',
                    ]
                ],
                'email' => null,
                'pemilik' => null,
            ],
            [
                'no_rumah' => '09',
                'status_hunian' => 'Kontrak/Sewa',
                'status_warga' => 'Warga Kontrak',
                'kontak_penghuni' => '081298765439',
                'no_kk' => '3216061234560009',
                'alamat' => 'KP UJUNG HARAPAN RT004/RW005, NO –09, KEL.BAHAGIA, KEC. BABELAN, BEKASI',
                'kepala' => [
                    'nama' => 'Edi Susanto',
                    'nik' => '3216061706890009',
                    'jk' => 'Laki-laki',
                    'tempat_lahir' => 'Cianjur',
                    'tanggal_lahir' => '1989-06-17',
                    'agama' => 'Islam',
                    'pendidikan' => 'SMP',
                    'pekerjaan' => 'Buruh Harian Lepas',
                    'perkawinan' => 'Kawin',
                    'ayah' => 'Junaedi',
                    'ibu' => 'Aminah',
                ],
                'anggota' => [
                    [
                        'nama' => 'Nurul Hidayah',
                        'nik' => '3216064208910009',
                        'jk' => 'Perempuan',
                        'tempat_lahir' => 'Garut',
                        'tanggal_lahir' => '1991-08-02',
                        'agama' => 'Islam',
                        'pendidikan' => 'SMP',
                        'pekerjaan' => 'Buruh Pabrik',
                        'perkawinan' => 'Kawin',
                        'hubungan' => 'Istri',
                        'ayah' => 'Mulyadi',
                        'ibu' => 'Halimah',
                    ]
                ],
                'email' => null,
                'pemilik' => [
                    'nama' => 'Saino',
                    'kontak' => '081255554444',
                    'alamat' => 'KP UJUNG HARAPAN RT004/RW005, NO – 18, KEL.BAHAGIA, KEC. BABELAN, BEKASI',
                ],
            ],
            [
                'no_rumah' => '10',
                'status_hunian' => 'Milik Sendiri',
                'status_warga' => 'Warga Tetap',
                'kontak_penghuni' => '081298765440',
                'no_kk' => '3216061234560010',
                'alamat' => 'KP UJUNG HARAPAN RT004/RW005, NO – 10, KEL.BAHAGIA, KEC. BABELAN, BEKASI',
                'kepala' => [
                    'nama' => 'Yusuf Maulana',
                    'nik' => '3216061010770010',
                    'jk' => 'Laki-laki',
                    'tempat_lahir' => 'Tasikmalaya',
                    'tanggal_lahir' => '1977-10-10',
                    'agama' => 'Islam',
                    'pendidikan' => 'SMA',
                    'pekerjaan' => 'Pensiunan',
                    'perkawinan' => 'Kawin',
                    'ayah' => 'Kurnia',
                    'ibu' => 'Kokom',
                ],
                'anggota' => [
                    [
                        'nama' => 'Fatimah',
                        'nik' => '3216064112790010',
                        'jk' => 'Perempuan',
                        'tempat_lahir' => 'Garut',
                        'tanggal_lahir' => '1979-12-01',
                        'agama' => 'Islam',
                        'pendidikan' => 'SMA',
                        'pekerjaan' => 'Mengurus Rumah Tangga',
                        'perkawinan' => 'Kawin',
                        'hubungan' => 'Istri',
                        'ayah' => 'Ujang',
                        'ibu' => 'Euis',
                    ]
                ],
                'email' => null,
                'pemilik' => null,
            ],
        ];

        $accountCount = 0;

        foreach ($familiesData as $fam) {
            // 3. Create Hunian
            $hunianData = [
                'no_rumah' => $fam['no_rumah'],
                'status_hunian' => $fam['status_hunian'],
                'status_warga' => $fam['status_warga'],
                'kontak_penghuni' => $fam['kontak_penghuni'],
                'alamat_hunian' => $fam['alamat'],
            ];

            if ($fam['pemilik']) {
                $hunianData['pemilik_nama'] = $fam['pemilik']['nama'];
                $hunianData['pemilik_kontak'] = $fam['pemilik']['kontak'];
                $hunianData['pemilik_alamat'] = $fam['pemilik']['alamat'];
                if (isset($fam['pemilik']['nama_kos'])) {
                    $hunianData['nama_kos'] = $fam['pemilik']['nama_kos'];
                    $hunianData['nomor_kamar'] = $fam['pemilik']['nomor_kamar'];
                }
            }

            $hunian = Hunian::create($hunianData);

            // 4. Create Kartu Keluarga
            $kk = KartuKeluarga::create([
                'hunian_id' => $hunian->id,
                'no_kk' => $fam['no_kk'],
                'nama_kepala_keluarga' => $fam['kepala']['nama'],
                'alamat' => $fam['alamat'],
                'rt' => '004',
                'rw' => '005',
                'kelurahan_desa' => 'Bahagia',
                'kecamatan' => 'Babelan',
                'kabupaten_kota' => 'Bekasi',
                'provinsi' => 'Jawa Barat',
                'kode_pos' => '17612',
            ]);

            // 5. Create Kepala Keluarga (Warga)
            $kepala = Warga::create([
                'hunian_id' => $hunian->id,
                'kartu_keluarga_id' => $kk->id,
                'nama_lengkap' => $fam['kepala']['nama'],
                'nik' => $fam['kepala']['nik'],
                'jenis_kelamin' => $fam['kepala']['jk'],
                'tempat_lahir' => $fam['kepala']['tempat_lahir'],
                'tanggal_lahir' => $fam['kepala']['tanggal_lahir'],
                'agama' => $fam['kepala']['agama'],
                'pendidikan' => $fam['kepala']['pendidikan'],
                'pekerjaan' => $fam['kepala']['pekerjaan'],
                'status_perkawinan' => $fam['kepala']['perkawinan'],
                'hubungan_keluarga' => 'Kepala Keluarga',
                'kewarganegaraan' => 'WNI',
                'nama_ayah' => $fam['kepala']['ayah'],
                'nama_ibu' => $fam['kepala']['ibu'],
                'is_kepala_keluarga' => true,
            ]);

            // 6. Create Anggota Keluarga (Warga)
            foreach ($fam['anggota'] as $mem) {
                Warga::create([
                    'hunian_id' => $hunian->id,
                    'kartu_keluarga_id' => $kk->id,
                    'nama_lengkap' => $mem['nama'],
                    'nik' => $mem['nik'],
                    'jenis_kelamin' => $mem['jk'],
                    'tempat_lahir' => $mem['tempat_lahir'],
                    'tanggal_lahir' => $mem['tanggal_lahir'],
                    'agama' => $mem['agama'],
                    'pendidikan' => $mem['pendidikan'],
                    'pekerjaan' => $mem['pekerjaan'],
                    'status_perkawinan' => $mem['perkawinan'],
                    'hubungan_keluarga' => $mem['hubungan'],
                    'kewarganegaraan' => 'WNI',
                    'nama_ayah' => $mem['ayah'],
                    'nama_ibu' => $mem['ibu'],
                    'is_kepala_keluarga' => false,
                ]);
            }

            // 7. Create User Account (Max 7 accounts)
            if ($fam['email'] && $accountCount < 7) {
                User::create([
                    'name' => $fam['kepala']['nama'],
                    'email' => $fam['email'],
                    'phone' => $fam['kontak_penghuni'],
                    'password' => Hash::make('password'),
                    'role' => 'warga',
                    'warga_id' => $kepala->id,
                    'is_active' => true,
                ]);
                $accountCount++;
            }
        }
    }
}
