<?php


namespace App\Rules;

use Illuminate\Contracts\Validation\Rule;

class ValidCIN implements Rule
{
    public function passes($attribute, $value)
    {
        // Validation stricte du CIN
        return preg_match('/^\d{12}$/', $value);
    }

    public function message()
    {
        return 'Le CIN doit contenir exactement 12 chiffres.';
    }
}
