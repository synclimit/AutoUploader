/**
 * Formats raw backend or YouTube API error strings into clear, human-friendly Indonesian messages.
 */
export function humanizeUploadError(err) {
  if (!err) return '';
  const errStr = typeof err === 'string' ? err : JSON.stringify(err);
  const lower = errStr.toLowerCase();

  if (lower.includes('invalidtags') || lower.includes('invalid video keywords')) {
    return 'Tags video melebihi batas maksimal YouTube (500 karakter). Kurangi jumlah tag pada kolom Tags.';
  }
  if (lower.includes('quotaexceeded') || lower.includes('ratelimitexceeded') || (lower.includes('quota') && lower.includes('exceeded'))) {
    return 'Kuota harian YouTube Data API channel ini telah habis (Daily Quota Exceeded). Tunggu reset kuota besok atau beralih ke provider Browser.';
  }
  if (lower.includes('deleted_client')) {
    return 'OAuth Client ID telah dihapus di Google Cloud Console. Harap unggah ulang file client_secret.json yang valid pada pengaturan channel.';
  }
  if (lower.includes('invalid_grant')) {
    return 'Sesi login YouTube telah kedaluwarsa atau dicabut oleh Google. Silakan Reconnect / Login ulang di menu Saluran/Channels.';
  }
  if (lower.includes('auth_required') || lower.includes('oauth token not found')) {
    return 'Channel belum terhubung dengan akun YouTube. Harap hubungkan akun di menu Saluran/Channels.';
  }
  if (lower.includes('file not found') || lower.includes('source file not found')) {
    return 'File video tidak ditemukan di penyimpanan lokal. Pastikan drive/flashdisk terhubung dan file tidak dipindah.';
  }
  if (lower.includes('source file not readable')) {
    return 'File video tidak dapat dibaca karena masalah izin file atau drive terputus.';
  }
  if (lower.includes('connectionreseterror') || lower.includes('10054') || lower.includes('connection was forcibly closed')) {
    return 'Koneksi jaringan terputus saat proses upload. Sistem akan mencoba kembali secara otomatis.';
  }

  // Cleanup standard Python error wrappers if any
  let clean = errStr
    .replace(/^API_UPLOAD_ERROR:\s*/i, '')
    .replace(/^<HttpError \d+ when requesting [^>]+ returned "/i, '')
    .replace(/\. Details: "\[.*$/i, '')
    .replace(/"\>$/, '');

  return clean || errStr;
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
