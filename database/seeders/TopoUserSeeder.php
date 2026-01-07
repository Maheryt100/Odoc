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
            'username' => 'topo',
            'email' => 'topo@gmail.com',
            'full_name' => 'Topo',
            'hashed_password' => Hash::make('password'),
            'role' => 'operator',
            'is_active' => true,
            'created_at' => now(),
        ]);
    }
}