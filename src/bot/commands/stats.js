import { mainKeyboard } from '../keyboards.js';

export async function handleStats(chatId, db, tg, editMsgId = null) {
  const stats = await db.getStats(chatId);
  const user = await db.upsertUser(chatId, '', '');

  const expiryText = user?.default_expiry === 0 ? 'Permanen' : `${user?.default_expiry ?? 60} menit`;

  const text = `📊 <b>Statistik KageMail Kamu</b>

📧 <b>Email Aktif:</b> ${stats.activeEmails}
📁 <b>Total Email Dibuat:</b> ${stats.totalEmails}
📬 <b>Pesan Belum Dibaca:</b> ${stats.unreadMessages}
📩 <b>Total Pesan Diterima:</b> ${stats.totalMessages}
🚫 <b>Pengirim Diblokir:</b> ${stats.blockedSenders}
⏱️ <b>Default Expire:</b> ${expiryText}

─────────────────────
🌐 Domain: <code>@kagemail.my.id</code>
🤖 Bot: @KageMailBot`;

  const kb = { inline_keyboard: [[{ text: '📋 Lihat Email', callback_data: 'list' }, { text: '📬 Inbox', callback_data: 'inbox:' }]] };

  if (editMsgId) return tg.editMessage(chatId, editMsgId, text, { reply_markup: kb });
  return tg.sendMessage(chatId, text, { reply_markup: kb });
}
