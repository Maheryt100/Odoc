<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class TopoUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('topo_users')->insert([
            'username' => 'mahery',
            'email' => 'mahery@gmail.com',
            'full_name' => 'Mahery',
            'hashed_password' => Hash::make('password'),
            'role' => 'operator',
            'is_active' => true,
            'created_at' => now(),
        ]);
    }
}