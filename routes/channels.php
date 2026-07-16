<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('online-citizens', function ($user) {
    if (!$user) {
        return false;
    }

    $noRumah = null;
    if ($user->warga) {
        $user->warga->loadMissing('hunian');
        $noRumah = $user->warga->hunian?->no_rumah;
    }

    return [
        'id' => $user->id,
        'name' => $user->warga?->nama_lengkap ?: $user->name,
        'no_rumah' => $noRumah,
        'role' => $user->role,
    ];
});
