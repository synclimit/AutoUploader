/**
 * Formats raw backend or YouTube API error strings into clear, human-friendly Indonesian messages.
 */
export function humanizeUploadError(err) {
  if (!err) return '';
  const errStr = typeof err === 'string' ? err : JSON.stringify(err);
  const lower = errStr.toLowerCase();

  // 1. YouTube Daily Upload Limit Exceeded
  if (
    lower.includes('uploadlimitexceeded') || 
    lower.includes('exceeded the number of videos') ||
    lower.includes('upload limit exceeded')
  ) {
    return 'Batas upload harian YouTube untuk channel ini sudah habis (Daily Limit Exceeded). Silakan coba lagi besok (24 jam) atau gunakan channel lain.';
  }

  // 2. YouTube Data API Project Quota Exceeded (10k units cap)
  if (
    lower.includes('quotaexceeded') || 
    lower.includes('ratelimitexceeded') || 
    (lower.includes('quota') && lower.includes('exceeded'))
  ) {
    return 'Kuota harian YouTube Data API channel ini telah habis. Tunggu reset kuota besok atau beralih ke provider Browser.';
  }

  // 3. YouTube Tags Exceeded (500 chars limit)
  if (lower.includes('invalidtags') || lower.includes('invalid video keywords')) {
    return 'Tags video melebihi batas maksimal YouTube (500 karakter). Kurangi jumlah tag pada kolom Tags di sebelah kanan.';
  }

  // 4. Duplicate Video
  if (lower.includes('duplicate') && (lower.includes('video') || lower.includes('upload'))) {
    return 'Video ini terdeteksi duplikat oleh YouTube (sudah pernah diunggah sebelumnya ke channel ini).';
  }

  // 5. Title / Description Length Limits
  if (lower.includes('titletoolong') || (lower.includes('title') && lower.includes('exceeded'))) {
    return 'Judul video melebihi batas maksimal 100 karakter YouTube.';
  }
  if (lower.includes('descriptiontoolong') || (lower.includes('description') && lower.includes('exceeded'))) {
    return 'Deskripsi video melebihi batas maksimal 5000 karakter YouTube.';
  }

  // 6. OAuth Client deleted in Google Cloud Console
  if (lower.includes('deleted_client')) {
    return 'OAuth Client ID dihapus di Google Cloud Console. Harap unggah ulang file client_secret.json pada pengaturan channel.';
  }

  // 7. OAuth Token Expired / Revoked
  if (lower.includes('invalid_grant')) {
    return 'Sesi login YouTube telah kedaluwarsa atau dicabut oleh Google. Silakan Reconnect / Login ulang di menu Saluran/Channels.';
  }

  // 8. Channel not linked
  if (lower.includes('auth_required') || lower.includes('oauth token not found') || lower.includes('channel not found')) {
    return 'Channel belum terhubung dengan akun YouTube. Harap hubungkan akun di menu Saluran/Channels.';
  }

  // 9. Video file missing on local disk
  if (lower.includes('file not found') || lower.includes('source file not found')) {
    return 'File video tidak ditemukan di komputer. Pastikan drive/flashdisk terhubung dan file tidak dipindah.';
  }

  // 10. Video file not readable / permission issue
  if (lower.includes('source file not readable')) {
    return 'File video tidak dapat dibaca karena masalah izin file atau drive terputus.';
  }

  // 11. Network disconnection / reset
  if (
    lower.includes('connectionreseterror') || 
    lower.includes('10054') || 
    lower.includes('connection was forcibly closed') ||
    lower.includes('connectionerror')
  ) {
    return 'Koneksi internet terputus saat proses upload. Sistem akan mencoba kembali secara otomatis.';
  }

  // 12. Timeout
  if (lower.includes('timed out') || lower.includes('timeouterror')) {
    return 'Waktu koneksi upload habis (Timeout). Periksa kecepatan dan kestabilan koneksi internet Anda.';
  }

  // Fallback: Clean up standard wrappers and strip Python Traceback aggressively
  let clean = errStr.replace(/^MAX_RETRIES_EXCEEDED:\s*/i, '');

  // Strip anything starting with Traceback
  const tbIdx = clean.search(/traceback\s*\(most recent call last\):/i);
  if (tbIdx !== -1) {
    clean = clean.substring(0, tbIdx).trim();
  }

  // Extract human message from JSON details if present
  const detailsMsg = clean.match(/['"]message['"]\s*:\s*['"]([^'"]+)['"]/);
  if (detailsMsg && detailsMsg[1]) {
    clean = detailsMsg[1];
  } else {
    const retMsg = clean.match(/returned\s+["']([^"']+)["']/);
    if (retMsg && retMsg[1]) {
      clean = retMsg[1];
    }
  }

  clean = clean
    .replace(/^(API_UPLOAD_ERROR|PLAYWRIGHT_UPLOAD_ERROR|Exception):\s*/i, '')
    .replace(/^<HttpError \d+ [^>]+ returned "/i, '')
    .replace(/\. Details: "\[.*$/is, '')
    .replace(/"\>$/, '')
    .replace(/^"+|"+$/g, '')
    .trim();

  // If clean string is empty or contains raw code traces, provide a friendly default
  if (!clean || clean.includes('File "') || clean.includes('line ') || clean.includes('googleapiclient')) {
    return 'Terjadi kendala teknis saat mengunggah video ke YouTube. Silakan periksa koneksi atau coba sesaat lagi.';
  }

  return clean.length > 150 ? clean.substring(0, 147) + '...' : clean;
}

/**
 * Calculates YouTube keyword tags character cost.
 * In YouTube: tags with spaces are wrapped in quotes ("tag name"), and tags are separated by commas.
 */
export function calculateTagsCost(tagsArray) {
  if (!Array.isArray(tagsArray) || tagsArray.length === 0) return 0;
  return tagsArray.reduce((acc, t, idx) => {
    const cost = t.includes(' ') ? t.length + 2 : t.length;
    return acc + cost + (idx > 0 ? 1 : 0);
  }, 0);
}
