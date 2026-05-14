import { mainKeyboard } from '../keyboards.js';

export async function handleStart(chatId, user, db, tg) {
  await db.upsertUser(chatId, user.username, user.first_name);
  const name = user.first_name || user.username || 'Pengguna';

  const text = `👋 Halo, <b>${name}</b>! Selamat datang di <b>KageMail</b>!

🌐 Bot untuk membuat email sementara dengan domain <code>@kagemail.my.id</code>

<b>📋 Perintah:</b>
• /new — Buat email acak
• /custom &lt;nama&gt; — Buat email dengan nama sendiri
• /list — Daftar email aktif
• /inbox — Lihat pesan masuk
• /read &lt;id&gt; — Baca pesan
• /delete &lt;email&gt; — Hapus email
• /clear — Hapus semua email
• /setexpiry &lt;menit&gt; — Atur masa aktif (0 = permanen)
• /block &lt;email&gt; — Blokir pengirim
• /stats — Statistik penggunaan
• /help — Tampilkan bantuan ini`;

  return tg.sendMessage(chatId, text, { reply_markup: mainKeyboard() });
}
