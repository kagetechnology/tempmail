import { listKeyboard } from '../keyboards.js';
import { formatDate } from '../../utils/html-to-text.js';

export async function handleList(chatId, db, tg, editMsgId = null) {
  const emails = await db.listEmails(chatId);

  if (emails.length === 0) {
    const text = '📭 <b>Belum ada email aktif.</b>\n\nBuat email baru dengan /new atau /custom &lt;nama&gt;';
    const kb = { inline_keyboard: [[{ text: '✉️ Buat Email Sekarang', callback_data: 'new' }]] };
    if (editMsgId) return tg.editMessage(chatId, editMsgId, text, { reply_markup: kb });
    return tg.sendMessage(chatId, text, { reply_markup: kb });
  }

  const lines = emails.map((e, i) => {
    const local = e.address.split('@')[0];
    const expiry = e.expires_at
      ? `⏱ Expire: ${formatDate(e.expires_at)}`
      : `♾ Permanen`;
    const unread = e.unread > 0 ? ` — 📬 <b>${e.unread} baru</b>` : '';
    return `${i + 1}. <code>${e.address}</code>${unread}\n   ${expiry} | 📩 ${e.total_msgs} pesan`;
  });

  const text = `📋 <b>Email Aktif Kamu (${emails.length}/10)</b>\n\n${lines.join('\n\n')}\n\n💡 Tap email di bawah untuk buka inbox-nya.`;

  if (editMsgId) return tg.editMessage(chatId, editMsgId, text, { reply_markup: listKeyboard(emails) });
  return tg.sendMessage(chatId, text, { reply_markup: listKeyboard(emails) });
}
