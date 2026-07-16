<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@smart-rt.test'],
            [
                'name' => 'Admin RT',
                'password' => Hash::make('password'),
                'role' => 'admin',
                'warga_id' => null,
                'is_active' => true,
            ]
        );
    }
}