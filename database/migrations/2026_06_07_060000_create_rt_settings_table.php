<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rt_settings', function (Blueprint $table) {
            $table->id();
            $table->string('key', 100)->unique();
            $table->text('value')->nullable();
            $table->enum('type', ['text', 'textarea', 'image', 'boolean', 'json'])->default('text');
            $table->string('label', 255)->nullable();
            $table->string('group', 100)->default('profil_rt');
            $table->timestamps();
        });

        // Seed default settings
        $defaults = [
            // Profil RT
            ['key' => 'rt_name',       'label' => 'Nama RT',           'group' => 'profil_rt', 'type' => 'text',     'value' => null],
            ['key' => 'rt_number',     'label' => 'Nomor RT',          'group' => 'profil_rt', 'type' => 'text',     'value' => null],
            ['key' => 'rw_number',     'label' => 'Nomor RW',          'group' => 'profil_rt', 'type' => 'text',     'value' => null],
            ['key' => 'kelurahan',     'label' => 'Kelurahan / Desa',  'group' => 'profil_rt', 'type' => 'text',     'value' => null],
            ['key' => 'kecamatan',     'label' => 'Kecamatan',         'group' => 'profil_rt', 'type' => 'text',     'value' => null],
            ['key' => 'kota',          'label' => 'Kota / Kabupaten',  'group' => 'profil_rt', 'type' => 'text',     'value' => null],
            ['key' => 'provinsi',      'label' => 'Provinsi',          'group' => 'profil_rt', 'type' => 'text',     'value' => null],
            ['key' => 'alamat_kantor', 'label' => 'Alamat Kantor',     'group' => 'profil_rt', 'type' => 'textarea', 'value' => null],
            ['key' => 'gmaps_url',     'label' => 'Link Google Maps',  'group' => 'profil_rt', 'type' => 'text',     'value' => 'https://goo.gl/maps/th65nWubhMEtRcAX8?g_st=ac'],
            ['key' => 'gmaps_embed_url', 'label' => 'Maps Embed URL',  'group' => 'profil_rt', 'type' => 'text',     'value' => 'https://maps.google.com/maps?q=-6.191065,107.023565&z=16&output=embed'],
            ['key' => 'telepon_rt',    'label' => 'No. Telepon RT',    'group' => 'profil_rt', 'type' => 'text',     'value' => null],
            ['key' => 'email_rt',      'label' => 'Email RT',          'group' => 'profil_rt', 'type' => 'text',     'value' => null],
            // Tampilan
            ['key' => 'site_name',     'label' => 'Nama Situs',        'group' => 'tampilan',  'type' => 'text',     'value' => 'SMART-RT'],
            ['key' => 'tagline',       'label' => 'Tagline / Slogan',  'group' => 'tampilan',  'type' => 'text',     'value' => null],
            ['key' => 'deskripsi',     'label' => 'Deskripsi Singkat', 'group' => 'tampilan',  'type' => 'textarea', 'value' => null],
            ['key' => 'logo_path',     'label' => 'Logo RT',           'group' => 'tampilan',  'type' => 'image',    'value' => null],
            ['key' => 'warna_aksen',   'label' => 'Warna Aksen',       'group' => 'tampilan',  'type' => 'text',     'value' => '#10B981'],
            // Footer
            ['key' => 'footer_text',   'label' => 'Teks Footer',       'group' => 'footer',    'type' => 'text',     'value' => null],
            ['key' => 'copyright',     'label' => 'Teks Copyright',    'group' => 'footer',    'type' => 'text',     'value' => null],
            ['key' => 'wa_link',       'label' => 'WhatsApp Group',    'group' => 'footer',    'type' => 'text',     'value' => null],
            ['key' => 'instagram',     'label' => 'Instagram',         'group' => 'footer',    'type' => 'text',     'value' => null],
            ['key' => 'facebook',      'label' => 'Facebook',          'group' => 'footer',    'type' => 'text',     'value' => null],
            ['key' => 'youtube',       'label' => 'YouTube',           'group' => 'footer',    'type' => 'text',     'value' => null],
            ['key' => 'email_publik',  'label' => 'Email Publik',      'group' => 'footer',    'type' => 'text',     'value' => null],
        ];

        foreach ($defaults as $item) {
            DB::table('rt_settings')->insert([
                'key'        => $item['key'],
                'value'      => $item['value'],
                'type'       => $item['type'],
                'label'      => $item['label'],
                'group'      => $item['group'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('rt_settings');
    }
};
