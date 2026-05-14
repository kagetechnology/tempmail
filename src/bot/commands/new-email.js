import { generateRandomEmail, validateLocalPart, normalizeLocalPart } from '../../utils/generate.js';
import { emailCreatedKeyboard } from '../keyboards.js';
import { formatDate } from '../../utils/html-to-text.js';

async function createEmail(chatId, address, db, tg, user) {
  const userData = await db.upsertUser(chatId, user.username, user.first_name);
  const expiry = userData?.default_expiry ?? 60;

  await db.createEmail(address, chatId, expiry);

  const expiryText = expiry > 0
    ? `⏱️ Aktif selama: <b>${expiry} menit</b>`
    : `♾️ Aktif: <b>Permanen</b>`;

  const text = `✅ <b>Email berhasil dibuat!</b>

📧 <b>Alamat Email:</b>
<code>${address}</code>
(klik untuk copy)

${expiryText}
📩 Kamu akan mendapat notifikasi saat ada email masuk.

💡 Gunakan /setexpiry untuk ubah durasi default.`;

  return tg.sendMessage(chatId, text, { reply_markup: emailCreatedKeyboard(address) });
}

export async function handleNew(chatId, user, db, tg, env) {
  // Check active email limit (max 10)
  const existing = await db.listEmails(chatId);
  if (existing.length >= 10) {
    return tg.sendMessage(chatId,
      '⚠️ Kamu sudah punya <b>10 email aktif</b> (batas maksimum).\n\nHapus beberapa email dulu dengan /delete atau /clear.',
      { reply_markup: { inline_keyboard: [[{ text: '📋 Lihat Email Saya', callback_data: 'list' }]] } }
    );
  }

  const address = generateRandomEmail(env.DOMAIN);
  return createEmail(chatId, address, db, tg, user);
}

export async function handleCustom(chatId, user, db, tg, env, arg) {
  if (!arg) {
    return tg.sendMessage(chatId,
      '📝 <b>Cara penggunaan:</b>\n/custom &lt;nama_email&gt;\n\n<b>Contoh:</b>\n<code>/custom mytemp</code>\n→ akan membuat <code>mytemp@kagemail.my.id</code>\n\n<b>Aturan:</b>\n• 3–30 karakter\n• Hanya huruf, angka, titik, strip, underscore\n• Tidak bisa dimulai/diakhiri karakter spesial'
    );
  }

  const local = normalizeLocalPart(arg);
  if (!validateLocalPart(local)) {
    return tg.sendMessage(chatId,
      `❌ <b>Nama tidak valid:</b> <code>${arg}</code>\n\n• Minimal 3 karakter, maksimal 30\n• Hanya huruf kecil, angka, titik (.), strip (-), underscore (_)\n• Tidak boleh diawali/diakhiri titik/strip/underscore`
    );
  }

  const address = `${local}@${env.DOMAIN}`;

  // Check if already taken
  const taken = await db.emailExists(address);
  if (taken) {
    return tg.sendMessage(chatId,
      `❌ Email <code>${address}</code> sudah digunakan.\n\nCoba nama lain atau gunakan /new untuk email acak.`
    );
  }

  const existing = await db.listEmails(chatId);
  if (existing.length >= 10) {
    return tg.sendMessage(chatId,
      '⚠️ Batas 10 email aktif tercapai. Hapus dulu dengan /delete atau /clear.'
    );
  }

  return createEmail(chatId, address, db, tg, user);
}
