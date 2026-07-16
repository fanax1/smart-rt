<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_screen_can_be_rendered(): void
    {
        $response = $this->get('/login');

        $response->assertStatus(200);
    }

    public function test_users_can_authenticate_using_the_login_screen(): void
    {
        $user = User::factory()->create();

        $response = $this->post('/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect(route('dashboard', absolute: false));
    }

    public function test_users_can_not_authenticate_with_invalid_password(): void
    {
        $user = User::factory()->create();

        $this->post('/login', [
            'email' => $user->email,
            'password' => 'wrong-password',
        ]);

        $this->assertGuest();
    }

    public function test_users_can_logout(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post('/logout');

        $this->assertGuest();
        $response->assertRedirect('/');
    }

    public function test_guest_accessing_admin_is_redirected_to_admin_login(): void
    {
        $response = $this->get('/admin/dashboard');

        $response->assertRedirect(route('login.admin'));
    }

    public function test_guest_accessing_warga_is_redirected_to_citizen_login(): void
    {
        $response = $this->get('/warga/dashboard');

        $response->assertRedirect(route('login'));
    }

    public function test_guest_accessing_exact_admin_path_is_redirected_to_admin_login(): void
    {
        $response = $this->get('/admin');

        $response->assertRedirect(route('login.admin'));
    }

    public function test_admin_logout_redirects_to_admin_login(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->actingAs($admin)->post('/logout');

        $this->assertGuest();
        $response->assertRedirect(route('login.admin'));
    }
}
