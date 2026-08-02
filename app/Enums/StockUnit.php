<?php

namespace App\Enums;

enum StockUnit: string
{
    case PCS = 'pcs';
    case KG = 'kg';
    case G = 'g';
    case LTR = 'ltr';
    case ML = 'ml';
    case M = 'm';
    case CM = 'cm';
    case BOX = 'box';
    case PACK = 'pack';
    case SET = 'set';
    case PAIR = 'pair';
    case DOZEN = 'dozen';

    /**
     * Get array of all string values.
     *
     * @return array<int, string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    /**
     * Get human-readable label for a stock unit.
     */
    public function label(): string
    {
        return match ($this) {
            self::PCS => 'PCS — Pieces',
            self::KG => 'KG — Kilogram',
            self::G => 'G — Gram',
            self::LTR => 'LTR — Litre',
            self::ML => 'ML — Millilitre',
            self::M => 'M — Meter',
            self::CM => 'CM — Centimeter',
            self::BOX => 'BOX — Box',
            self::PACK => 'PACK — Pack',
            self::SET => 'SET — Set',
            self::PAIR => 'PAIR — Pair',
            self::DOZEN => 'DOZEN — Dozen',
        };
    }

    /**
     * Get formatted options list for UI dropdowns.
     *
     * @return array<int, array{id: string, name: string, code: string, label: string}>
     */
    public static function options(): array
    {
        return array_map(fn (self $unit) => [
            'id' => $unit->value,
            'name' => $unit->label(),
            'code' => $unit->value,
            'label' => $unit->label(),
        ], self::cases());
    }
}
