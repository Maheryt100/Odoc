<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\District;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $districts = District::limit(3)->get();

        if ($districts->isEmpty()) {
            $this->command->warn('Aucun district trouvé. Créez d\'abord les districts.');
            return;
        }

        $superAdmin = User::updateOrCreate(
            ['email' => 'admin@foncier.mg'],
            [
                'name' => 'Super Administrateur',
                'password' => Hash::make('password'),
                'role' => User::ROLE_SUPER_ADMIN,
                'id_district' => null,
                'status' => true,
            ]
        );
        $this->command->info("✓ Super Admin créé : admin@foncier.mg / password");
    }
}
