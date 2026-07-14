import os
import re

replacements = {
    # ChannelsWorkspace
    "Channel Overview": "Ikhtisar Saluran",
    "Monitor API sync status": "Pantau status sinkronisasi API",
    "Channels": "Saluran",
    "Add Channel": "Tambah Saluran",
    "Sync Status": "Status Sinkronisasi",
    "Total Uploads": "Total Unggahan",
    "Manage and authenticate your YouTube channels.": "Kelola dan otentikasi saluran YouTube Anda.",
    "Add New Channel": "Tambah Saluran Baru",
    
    # UploadsWorkspace
    "Upload Center": "Pusat Unggahan",
    "Prepare, edit metadata, and push": "Siapkan, edit metadata, dan dorong",
    "Drag & drop video files here": "Seret & lepas file video di sini",
    "or click to browse": "atau klik untuk menelusuri",
    "Select Target Channel": "Pilih Saluran Tujuan",
    "Start Upload": "Mulai Unggah",
    "Save Draft": "Simpan Draf",
    
    # ReviewWorkspace
    "Review Videos": "Tinjau Video",
    "Approve and modify metadata": "Setujui dan modifikasi metadata",
    "Bulk Approve": "Setujui Massal",
    "Bulk Delete": "Hapus Massal",
    "Needs Attention": "Butuh Perhatian",
    "Show All": "Tampilkan Semua",
    "Watched": "Ditonton",
    "Scheduled": "Dijadwalkan",
    "Uploading": "Mengunggah",
    "Completed": "Selesai",
    "Failed": "Gagal",
    "Cancelled": "Dibatalkan",
    
    # CompletedWorkspace
    "Upload History": "Riwayat Unggahan",
    "View completed and failed uploads.": "Lihat unggahan yang berhasil dan gagal.",
    "Export Log": "Ekspor Log",
    
    # Analytics
    "Analytics": "Analitik",
    "View channel performance": "Lihat performa saluran",
    "Total Views": "Total Tayangan",
    "Subscribers": "Pelanggan",
    
    # General Tab
    "Channel Information": "Informasi Saluran",
    "Channel Name": "Nama Saluran",
    
    # Upload Settings
    "Upload Settings": "Pengaturan Unggahan",
    "Visibility": "Visibilitas",
    "Public": "Publik",
    "Private": "Pribadi",
    "Unlisted": "Tidak Publik",
    
    # Common
    "Cancel": "Batal",
    "Save": "Simpan",
    "Delete": "Hapus",
    "Edit": "Edit",
    "Close": "Tutup",
}

def translate_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
        
    original = content
    for en, id in replacements.items():
        # Only replace if surrounded by > < or " " or ' ' to avoid breaking code
        # Actually, simple replace is fine for these specific strings if we are careful
        content = content.replace(f">{en}<", f">{id}<")
        content = content.replace(f"'{en}'", f"'{id}'")
        content = content.replace(f'"{en}"', f'"{id}"')
        
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Translated: {filepath}")

search_dir = r"d:\AutoUploader\frontend\app\src\components"
for root, _, files in os.walk(search_dir):
    for file in files:
        if file.endswith(('.jsx', '.js')):
            translate_file(os.path.join(root, file))

