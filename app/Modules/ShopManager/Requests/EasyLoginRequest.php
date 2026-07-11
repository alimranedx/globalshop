<?php

namespace App\Modules\ShopManager\Requests;

use Illuminate\Foundation\Http\FormRequest;

class EasyLoginRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'shop_id' => ['required', 'integer', 'exists:shops,id'],
            'user_id' => ['required', 'integer', 'exists:users,id'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'shop_id.required' => 'A shop selection is required to login.',
            'shop_id.exists' => 'The selected shop does not exist.',
            'user_id.required' => 'A user selection is required to login.',
            'user_id.exists' => 'The selected user does not exist.',
        ];
    }
}
