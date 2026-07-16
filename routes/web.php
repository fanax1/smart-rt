<?php

use App\Http\Controllers\Admin\AdminDashboardController;
use App\Http\Controllers\Admin\AdminDokumenController;
use App\Http\Controllers\Admin\AdminEventController;
use App\Http\Controllers\Admin\AdminFinanceController;
use App\Http\Controllers\Admin\AdminPengaduanController;
use App\Http\Controllers\Admin\AdminPengajuanSuratController;
use App\Http\Controllers\Admin\AdminPengumumanController;
use App\Http\Controllers\Admin\AdminResidentController;
use App\Http\Controllers\Admin\CommitteeSettingController;
use App\Http\Controllers\Admin\RtSettingController;
use App\Http\Controllers\ChatbotController;
use App\Http\Controllers\HomepageController;
use App\Http\Controllers\TicketController;
use App\Http\Controllers\Admin\AdminTicketController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Warga\WargaController;
use App\Http\Controllers\Warga\WargaPengaduanController;
use App\Http\Controllers\Warga\WargaPengajuanSuratController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/

Route::get('/', [HomepageController::class, 'index'])->name('home');
Route::get('/documents/{dokumen}/download-main', [HomepageController::class, 'downloadMainFile'])->name('documents.download-main');
Route::get('/documents/{dokumen}/download-photos', [HomepageController::class, 'downloadActivityPhotos'])->name('documents.download-photos');
Route::get('/documents/{dokumen}/download-all', [HomepageController::class, 'downloadAll'])->name('documents.download-all');
Route::get('/documents/{dokumen}/files/{file}/preview', [HomepageController::class, 'previewFile'])->name('documents.files.preview');

Route::post('/chatbot/send-message', [ChatbotController::class, 'send'])
    ->middleware('throttle:30,1')
    ->name('chatbot.send');

Route::post('/tickets', [TicketController::class, 'store'])->name('tickets.store');
Route::get('/tickets/active', [TicketController::class, 'getActiveTicket'])->name('tickets.active');
Route::get('/tickets/{nomor_tiket}', [TicketController::class, 'show'])->name('tickets.show');
Route::post('/tickets/{nomor_tiket}/messages', [TicketController::class, 'sendMessage'])->name('tickets.messages.send');
Route::post('/tickets/{nomor_tiket}/typing', [TicketController::class, 'typing'])->name('tickets.typing');

/*
|--------------------------------------------------------------------------
| Dashboard Redirect
|--------------------------------------------------------------------------
*/

Route::get('/dashboard', function () {
    $user = request()->user();

    if ($user->role === 'admin') {
        return redirect()->route('admin.dashboard');
    }

    if ($user->role === 'warga') {
        return redirect()->route('warga.dashboard');
    }

    abort(403, 'Role akun tidak dikenali.');
})->middleware(['auth', 'verified'])->name('dashboard');

/*
|--------------------------------------------------------------------------
| Admin Routes
|--------------------------------------------------------------------------
*/

Route::middleware(['auth', 'verified', 'role:admin'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {
        Route::get('/', function () {
            return redirect()->route('admin.dashboard');
        });

        Route::get('/dashboard', [AdminDashboardController::class, 'index'])
            ->name('dashboard');

        Route::get('/residents', [AdminResidentController::class, 'index'])
            ->name('residents.index');

        Route::get('/resident-users', [AdminResidentController::class, 'users'])
            ->name('resident-users.index');

        Route::get('/profile-change-logs', [AdminResidentController::class, 'profileChangeLogs'])
            ->name('profile-change-logs.index');

        Route::patch('/profile-change-logs/{profileChangeLog}/read', [AdminResidentController::class, 'markLogAsRead'])
            ->name('profile-change-logs.read');

        Route::post('/profile-change-logs/read-all', [AdminResidentController::class, 'markAllLogsAsRead'])
            ->name('profile-change-logs.read-all');

        Route::patch('/resident-users/{user}/toggle-active', [AdminResidentController::class, 'toggleUserActive'])
            ->name('resident-users.toggle-active');

        Route::post('/resident-users/{user}/reset-password', [AdminResidentController::class, 'resetUserPassword'])
            ->name('resident-users.reset-password');

        Route::post('/residents', [AdminResidentController::class, 'store'])
            ->name('residents.store');

        Route::put('/residents/{hunian}', [AdminResidentController::class, 'update'])
            ->name('residents.update');

        Route::delete('/residents/{hunian}', [AdminResidentController::class, 'destroy'])
            ->name('residents.destroy');

        Route::post('/residents/{hunian}/create-account', [AdminResidentController::class, 'createAccount'])
            ->name('residents.create-account');

        Route::get('/events', [AdminEventController::class, 'index'])
            ->name('events.index');

        Route::post('/events', [AdminEventController::class, 'store'])
            ->name('events.store');

        Route::put('/events/{kegiatan}', [AdminEventController::class, 'update'])
            ->name('events.update');

        Route::delete('/events/{kegiatan}', [AdminEventController::class, 'destroy'])
            ->name('events.destroy');

        Route::post('/events/{kegiatan}/expenses', [AdminEventController::class, 'storeExpense'])
            ->name('events.expenses.store');

        Route::get('/announcements', [AdminPengumumanController::class, 'index'])
            ->name('announcements.index');

        Route::post('/announcements', [AdminPengumumanController::class, 'store'])
            ->name('announcements.store');

        Route::put('/announcements/{pengumuman}', [AdminPengumumanController::class, 'update'])
            ->name('announcements.update');

        Route::patch('/announcements/{pengumuman}/publish', [AdminPengumumanController::class, 'publish'])
            ->name('announcements.publish');

        Route::patch('/announcements/{pengumuman}/unpublish', [AdminPengumumanController::class, 'unpublish'])
            ->name('announcements.unpublish');

        Route::delete('/announcements/{pengumuman}', [AdminPengumumanController::class, 'destroy'])
            ->name('announcements.destroy');

        Route::delete('/announcements/files/{file}', [AdminPengumumanController::class, 'destroyFile'])
            ->name('announcements.files.destroy');

        Route::get('/finance', [AdminFinanceController::class, 'index'])
            ->name('finance.index');

        Route::post('/finance/components', [AdminFinanceController::class, 'storeComponent'])
            ->name('finance.components.store');

        Route::put('/finance/components/{component}', [AdminFinanceController::class, 'updateComponent'])
            ->name('finance.components.update');

        Route::patch('/finance/components/{component}/toggle', [AdminFinanceController::class, 'toggleComponent'])
            ->name('finance.components.toggle');

        Route::post('/finance/payments', [AdminFinanceController::class, 'storePayment'])
            ->name('finance.payments.store');

        Route::patch('/finance/payments/{payment}/verify', [AdminFinanceController::class, 'verifyPayment'])
            ->name('finance.payments.verify');

        Route::patch('/finance/payments/{payment}/reject', [AdminFinanceController::class, 'rejectPayment'])
            ->name('finance.payments.reject');

        Route::post('/finance/transactions', [AdminFinanceController::class, 'storeTransaction'])
            ->name('finance.transactions.store');

        Route::delete('/finance/transactions/{transaction}', [AdminFinanceController::class, 'destroyTransaction'])
            ->name('finance.transactions.destroy');

        Route::get('/pengajuan-surat', [AdminPengajuanSuratController::class, 'index'])
            ->name('pengajuan-surat.index');

        Route::post('/pengajuan-surat/{pengajuan}/status', [AdminPengajuanSuratController::class, 'updateStatus'])
            ->name('pengajuan-surat.status');

        Route::get('/security', [AdminPengajuanSuratController::class, 'index'])
            ->name('security.index');

        Route::get('/complaints', [AdminPengaduanController::class, 'index'])
            ->name('complaints.index');

        Route::patch('/complaints/{pengaduan}/status', [AdminPengaduanController::class, 'updateStatus'])
            ->name('complaints.status');

        Route::patch('/complaints/{pengaduan}/archive', [AdminPengaduanController::class, 'toggleArchive'])
            ->name('complaints.archive');

        Route::patch('/complaints/{pengaduan}/toggle-confirm', [AdminPengaduanController::class, 'toggleConfirm'])
            ->name('complaints.toggle-confirm');

        Route::delete('/complaints/{pengaduan}', [AdminPengaduanController::class, 'destroy'])
            ->name('complaints.destroy');

        Route::delete('/complaints/files/{file}', [AdminPengaduanController::class, 'destroyFile'])
            ->name('complaints.files.destroy');

        Route::get('/documents', [AdminDokumenController::class, 'index'])
            ->name('documents.index');

        Route::post('/documents', [AdminDokumenController::class, 'store'])
            ->name('documents.store');

        Route::put('/documents/{dokumen}', [AdminDokumenController::class, 'update'])
            ->name('documents.update');

        Route::patch('/documents/{dokumen}/publish', [AdminDokumenController::class, 'publish'])
            ->name('documents.publish');

        Route::patch('/documents/{dokumen}/unpublish', [AdminDokumenController::class, 'unpublish'])
            ->name('documents.unpublish');

        Route::patch('/documents/{dokumen}/archive', [AdminDokumenController::class, 'archive'])
            ->name('documents.archive');

        Route::delete('/documents/{dokumen}', [AdminDokumenController::class, 'destroy'])
            ->name('documents.destroy');

        // File routes — semua memerlukan {dokumen} untuk verifikasi relasi
        Route::get('/documents/{dokumen}/files/{file}/preview', [AdminDokumenController::class, 'previewFile'])
            ->name('documents.files.preview');

        Route::get('/documents/{dokumen}/files/{file}/download', [AdminDokumenController::class, 'downloadFile'])
            ->name('documents.files.download');

        Route::delete('/documents/{dokumen}/files/{file}', [AdminDokumenController::class, 'destroyFile'])
            ->name('documents.files.destroy');

        Route::get('/settings', [CommitteeSettingController::class, 'index'])
            ->name('settings.index');

        Route::post('/settings/committee-periods', [CommitteeSettingController::class, 'storePeriod'])
            ->name('settings.committee-periods.store');

        Route::put('/settings/committee-periods/{committeePeriod}', [CommitteeSettingController::class, 'updatePeriod'])
            ->name('settings.committee-periods.update');

        Route::delete('/settings/committee-periods/{committeePeriod}', [CommitteeSettingController::class, 'destroyPeriod'])
            ->name('settings.committee-periods.destroy');

        Route::post('/settings/committee-members', [CommitteeSettingController::class, 'storeMember'])
            ->name('settings.committee-members.store');

        Route::put('/settings/committee-members/{committeeMember}', [CommitteeSettingController::class, 'updateMember'])
            ->name('settings.committee-members.update');

        // Alias: POST to /committee-members/{id} handles PUT via _method
        Route::post('/settings/committee-members/{committeeMember}', [CommitteeSettingController::class, 'updateMember'])
            ->name('settings.committee-members.update-post');

        Route::delete('/settings/committee-members/{committeeMember}', [CommitteeSettingController::class, 'destroyMember'])
            ->name('settings.committee-members.destroy');

        // RT Settings (Profil RT, Tampilan, Footer)
        Route::post('/settings/rt', [RtSettingController::class, 'saveGroup'])
            ->name('settings.rt.save');

        Route::post('/settings/rt/logo', [RtSettingController::class, 'uploadLogo'])
            ->name('settings.rt.logo');

        // Emergency Contacts
        Route::post('/settings/emergency-contacts', [RtSettingController::class, 'storeContact'])
            ->name('settings.emergency-contacts.store');

        Route::put('/settings/emergency-contacts/{contact}', [RtSettingController::class, 'updateContact'])
            ->name('settings.emergency-contacts.update');

        Route::delete('/settings/emergency-contacts/{contact}', [RtSettingController::class, 'destroyContact'])
            ->name('settings.emergency-contacts.destroy');

        // Helpdesk Tickets admin routes
        Route::get('/tickets', [AdminTicketController::class, 'index'])
            ->name('tickets.index');
        Route::get('/tickets/{ticket}/details', [AdminTicketController::class, 'show'])
            ->name('tickets.show');
        Route::patch('/tickets/{ticket}/start', [AdminTicketController::class, 'startConversation'])
            ->name('tickets.start');
        Route::patch('/tickets/{ticket}/close', [AdminTicketController::class, 'closeTicket'])
            ->name('tickets.close');
        Route::post('/tickets/{ticket}/messages', [AdminTicketController::class, 'sendMessage'])
            ->name('tickets.messages.send');
        Route::post('/tickets/{ticket}/typing', [AdminTicketController::class, 'typing'])
            ->name('tickets.typing');
    });

/*
|--------------------------------------------------------------------------
| Warga Routes
|--------------------------------------------------------------------------
*/

Route::middleware(['auth', 'verified', 'role:warga'])
    ->prefix('warga')
    ->name('warga.')
    ->group(function () {
        Route::get('/', [WargaController::class, 'redirectToDashboard'])
            ->name('index');

        Route::get('/dashboard', [WargaController::class, 'dashboard'])
            ->name('dashboard');

        Route::get('/data-keluarga', [WargaController::class, 'dataKeluarga'])
            ->name('data-keluarga');

        Route::get('/iuran', [WargaController::class, 'iuran'])
            ->name('iuran');

        Route::post('/iuran/upload-bukti', [WargaController::class, 'uploadBuktiIuran'])
            ->name('iuran.upload-bukti');

        Route::get('/pengumuman', [WargaController::class, 'pengumuman'])
            ->name('pengumuman');

        Route::get('/kegiatan', [WargaController::class, 'kegiatan'])
            ->name('kegiatan');

        Route::post('/kegiatan/{kegiatan}/ikut', [WargaController::class, 'ikutKegiatan'])
            ->name('kegiatan.ikut');

        Route::delete('/kegiatan/{kegiatan}/batal', [WargaController::class, 'batalIkutKegiatan'])
            ->name('kegiatan.batal');

        Route::get('/pengaduan', [WargaController::class, 'pengaduan'])
            ->name('pengaduan');

        Route::post('/pengaduan', [WargaPengaduanController::class, 'store'])
            ->name('pengaduan.store');

        Route::patch('/pengaduan/{pengaduan}/batal', [WargaPengaduanController::class, 'cancel'])
            ->name('pengaduan.cancel');

        Route::get('/pengaduan/files/{file}/preview', [WargaPengaduanController::class, 'previewFile'])
            ->name('pengaduan.files.preview');

        Route::get('/ajukan-surat', [WargaController::class, 'ajukanSurat'])
            ->name('ajukan-surat');

        Route::post('/ajukan-surat', [WargaPengajuanSuratController::class, 'store'])
            ->name('ajukan-surat.store');

        Route::get('/profil', [WargaController::class, 'profil'])
            ->name('profil');

        Route::patch('/profil', [WargaController::class, 'updateProfil'])
            ->name('profil.update');

        Route::post('/profil/ganti-password', [WargaController::class, 'gantiPassword'])
            ->name('profil.ganti-password');

    });

/*
|--------------------------------------------------------------------------
| Profile Routes
|--------------------------------------------------------------------------
*/

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])
        ->name('profile.edit');

    Route::patch('/profile', [ProfileController::class, 'update'])
        ->name('profile.update');

    Route::delete('/profile', [ProfileController::class, 'destroy'])
        ->name('profile.destroy');
});

require __DIR__ . '/auth.php';