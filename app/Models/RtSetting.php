<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RtSetting extends Model
{
    protected $fillable = ['key', 'value', 'type', 'label', 'group'];

    /** Get a setting value by key. */
    public static function get(string $key, mixed $default = null): mixed
    {
        $setting = static::where('key', $key)->first();
        return $setting ? $setting->value : $default;
    }

    /** Set a setting value by key (upsert). */
    public static function set(string $key, mixed $value): void
    {
        static::where('key', $key)->update(['value' => $value]);
    }

    /** Return all settings for a group as key=>value array. */
    public static function group(string $group): array
    {
        return static::where('group', $group)
            ->pluck('value', 'key')
            ->toArray();
    }
}
