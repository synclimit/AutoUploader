import json

with open(r'd:\AutoUploader\frontend\app\src\i18n\translations.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# We will just write a new translations.ts file with extensive keys.
new_ts = """export const translations = {
  en: {
    // Sidebar
    'nav.dashboard': 'Dashboard',
    'nav.upload': 'Upload',
    'nav.complete': 'Complete',
    'nav.review': 'Review',
    'nav.channels': 'Channels',
    'nav.analytics': 'Analytics',
    'nav.settings': 'Settings',

    // Settings General
    'settings.title': 'Preferences',
    'settings.subtitle': 'Configure the Raynz PitStop application, upload engine, AI services and desktop experience.',
    
    'settings.group.app': 'Application',
    'settings.group.engine': 'Upload Engine',
    'settings.group.system': 'System',
    
    'settings.cat.general': 'General',
    'settings.cat.appearance': 'Appearance',
    'settings.cat.notifications': 'Notifications',
    'settings.cat.uploads': 'Uploads',
    'settings.cat.youtube': 'YouTube Defaults',
    'settings.cat.ai': 'AI Metadata',
    'settings.cat.performance': 'Performance',
    'settings.cat.advanced': 'Advanced',
    'settings.cat.about': 'About',

    'settings.general.title': 'General Settings',
    'settings.general.desc': 'Global application preferences, language, and startup behaviour.',
    'settings.general.lang': 'Application Language',
    'settings.general.lang.desc': 'Select the display language for the application interface.',
    'settings.general.startup': 'Launch on Startup',
    'settings.general.startup.desc': 'Automatically start Raynz PitStop in the background when Windows boots.',
    'settings.general.update': 'Automatic Updates',
    'settings.general.update.desc': 'Download and install software updates automatically.',

    'settings.appearance.title': 'Appearance',
    'settings.appearance.desc': 'Visual density, scaling, and animations.',
    'settings.appearance.theme': 'Color Theme',
    'settings.appearance.theme.desc': 'Choose the visual theme of the workspace.',
    'settings.appearance.density': 'UI Density',
    'settings.appearance.density.desc': 'Adjust the compactness of rows and lists globally.',
    
    'settings.backup.title': 'Backup & Restore',
    'settings.backup.btn': 'Backup Configuration',
    'settings.restore.btn': 'Restore Configuration',
    'settings.reset.btn': 'Factory Reset',
    'settings.default.btn': 'Restore Default',
    
    'settings.save': 'Save Changes',
    'settings.saving': 'Saving...',

    // Dashboard
    'dashboard.welcome': 'Welcome back to Raynz PitStop.',
    'dashboard.stats.today': 'Uploads Today',
    'dashboard.stats.queue': 'In Queue',
    'dashboard.stats.failed': 'Failed Tasks',
    'dashboard.stats.storage': 'Local Storage',
    'dashboard.recent_activity': 'Recent Activity',
    'dashboard.quick_actions': 'Quick Actions',
    'dashboard.action.manual': 'Manual Upload',
    'dashboard.action.manual.desc': 'Upload single video',
    'dashboard.action.bulk': 'Bulk Import',
    'dashboard.action.bulk.desc': 'Import folder',
    'dashboard.action.channels': 'Manage Channels',
    'dashboard.action.channels.desc': 'Add or edit accounts',
    'dashboard.action.logs': 'Activity Logs',
    'dashboard.action.logs.desc': 'View system logs',

    // Uploads
    'uploads.title': 'Upload Center',
    'uploads.dropzone': 'Drag & Drop video files here',
    'uploads.dropzone.sub': 'or click to browse files',
    'uploads.select_channel': 'Select Target Channel',
    'uploads.metadata': 'Metadata Editor',
    'uploads.btn.upload': 'Start Upload',
    'uploads.btn.draft': 'Save as Draft',
    'uploads.queue': 'Upload Queue',

    // Channels
    'channels.title': 'Channel Management',
    'channels.add': 'Add New Channel',
    'channels.edit': 'Edit Channel',
    'channels.delete': 'Delete Channel',
    'channels.sync': 'Sync Status',
    'channels.active': 'Active',
    'channels.auth_needed': 'Authentication Needed',
    
    // Review
    'review.title': 'Review Videos',
    'review.approve': 'Approve',
    'review.reject': 'Reject',
    'review.bulk_approve': 'Bulk Approve',
    'review.bulk_delete': 'Bulk Delete',
    'review.filter.all': 'All Videos',
    'review.filter.needs_attention': 'Needs Attention',

    // Common
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.search': 'Search...',
    'common.success': 'Success',
    'common.error': 'Error',
    'common.warning': 'Warning',
    'common.info': 'Info'
  },
  id: {
    // Sidebar
    'nav.dashboard': 'Dasbor',
    'nav.upload': 'Unggah',
    'nav.complete': 'Selesai',
    'nav.review': 'Tinjauan',
    'nav.channels': 'Saluran',
    'nav.analytics': 'Analitik',
    'nav.settings': 'Pengaturan',

    // Settings General
    'settings.title': 'Pengaturan',
    'settings.subtitle': 'Konfigurasi aplikasi Raynz PitStop, mesin pengunggah, layanan AI, dan antarmuka.',
    
    'settings.group.app': 'Aplikasi',
    'settings.group.engine': 'Mesin Unggah',
    'settings.group.system': 'Sistem',
    
    'settings.cat.general': 'Umum',
    'settings.cat.appearance': 'Tampilan',
    'settings.cat.notifications': 'Notifikasi',
    'settings.cat.uploads': 'Unggahan',
    'settings.cat.youtube': 'Bawaan YouTube',
    'settings.cat.ai': 'Metadata AI',
    'settings.cat.performance': 'Performa',
    'settings.cat.advanced': 'Lanjutan',
    'settings.cat.about': 'Tentang',

    'settings.general.title': 'Pengaturan Umum',
    'settings.general.desc': 'Preferensi aplikasi global, bahasa, dan perilaku saat startup.',
    'settings.general.lang': 'Bahasa Aplikasi',
    'settings.general.lang.desc': 'Pilih bahasa tampilan untuk antarmuka aplikasi.',
    'settings.general.startup': 'Jalankan saat Startup',
    'settings.general.startup.desc': 'Mulai Raynz PitStop secara otomatis di latar belakang saat Windows menyala.',
    'settings.general.update': 'Pembaruan Otomatis',
    'settings.general.update.desc': 'Unduh dan pasang pembaruan perangkat lunak secara otomatis.',

    'settings.appearance.title': 'Tampilan',
    'settings.appearance.desc': 'Kerapatan visual, skala, dan animasi.',
    'settings.appearance.theme': 'Tema Warna',
    'settings.appearance.theme.desc': 'Pilih tema visual untuk ruang kerja.',
    'settings.appearance.density': 'Kerapatan UI',
    'settings.appearance.density.desc': 'Sesuaikan tingkat kekompakan baris dan daftar secara global.',
    
    'settings.backup.title': 'Cadangkan & Pulihkan',
    'settings.backup.btn': 'Cadangkan Konfigurasi',
    'settings.restore.btn': 'Pulihkan Konfigurasi',
    'settings.reset.btn': 'Setel Ulang Pabrik',
    'settings.default.btn': 'Kembalikan Bawaan',
    
    'settings.save': 'Simpan Perubahan',
    'settings.saving': 'Menyimpan...',

    // Dashboard
    'dashboard.welcome': 'Selamat datang kembali di Raynz PitStop.',
    'dashboard.stats.today': 'Unggahan Hari Ini',
    'dashboard.stats.queue': 'Dalam Antrean',
    'dashboard.stats.failed': 'Tugas Gagal',
    'dashboard.stats.storage': 'Penyimpanan Lokal',
    'dashboard.recent_activity': 'Aktivitas Terbaru',
    'dashboard.quick_actions': 'Aksi Cepat',
    'dashboard.action.manual': 'Unggah Manual',
    'dashboard.action.manual.desc': 'Unggah satu video',
    'dashboard.action.bulk': 'Impor Massal',
    'dashboard.action.bulk.desc': 'Impor dari folder',
    'dashboard.action.channels': 'Kelola Saluran',
    'dashboard.action.channels.desc': 'Tambah atau edit akun',
    'dashboard.action.logs': 'Log Aktivitas',
    'dashboard.action.logs.desc': 'Lihat log sistem',

    // Uploads
    'uploads.title': 'Pusat Unggahan',
    'uploads.dropzone': 'Seret & Lepas file video di sini',
    'uploads.dropzone.sub': 'atau klik untuk mencari file',
    'uploads.select_channel': 'Pilih Saluran Tujuan',
    'uploads.metadata': 'Editor Metadata',
    'uploads.btn.upload': 'Mulai Mengunggah',
    'uploads.btn.draft': 'Simpan sebagai Draf',
    'uploads.queue': 'Antrean Unggahan',

    // Channels
    'channels.title': 'Manajemen Saluran',
    'channels.add': 'Tambah Saluran Baru',
    'channels.edit': 'Edit Saluran',
    'channels.delete': 'Hapus Saluran',
    'channels.sync': 'Status Sinkronisasi',
    'channels.active': 'Aktif',
    'channels.auth_needed': 'Butuh Otentikasi',
    
    // Review
    'review.title': 'Tinjau Video',
    'review.approve': 'Setujui',
    'review.reject': 'Tolak',
    'review.bulk_approve': 'Setujui Massal',
    'review.bulk_delete': 'Hapus Massal',
    'review.filter.all': 'Semua Video',
    'review.filter.needs_attention': 'Butuh Perhatian',

    // Common
    'common.cancel': 'Batal',
    'common.save': 'Simpan',
    'common.delete': 'Hapus',
    'common.edit': 'Edit',
    'common.search': 'Cari...',
    'common.success': 'Sukses',
    'common.error': 'Galat',
    'common.warning': 'Peringatan',
    'common.info': 'Info'
  }
}
"""

with open(r'd:\AutoUploader\frontend\app\src\i18n\translations.ts', 'w', encoding='utf-8') as f:
    f.write(new_ts)
