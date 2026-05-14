import { inboxKeyboard, messageKeyboard } from '../keyboards.js';
import { truncate, escapeHtml, formatDate } from '../../utils/html-to-text.js';

export async function handleInbox(chatId, db, tg, emailFilter = '', editMsgId = null) {
  const messages = await db.getInbox(chatId, emailFilter || null);

  if (messages.length === 0) {
    const filterText = emailFilter ? ` untuk <code>${emailFilter}</code>` : '';
    const text = `📭 <b>Inbox kosong${filterText}.</b>\n\nBagikan alamat emailmu dan tunggu pesan masuk!\nNotifikasi otomatis akan dikirim ke sini.`;
    const kb = { inline_keyboard: [[{ text: '🔄 Refresh', callback_data: `inbox:${emailFilter}` }, { text: '📋 Daftar Email', callback_data: 'list' }]] };
    if (editMsgId) return tg.editMessage(chatId, editMsgId, text, { reply_markup: kb });
    return tg.sendMessage(chatId, text, { reply_markup: kb });
  }

  const filterText = emailFilter ? `\n📧 Filter: <code>${emailFilter}</code>` : '';
  const lines = messages.map(m => {
    const icon = m.is_read ? '📩' : '📬';
    const subj = escapeHtml(m.subject.slice(0, 40));
    const from = escapeHtml(m.from_name || m.from_address);
    return `${icon} <b>#${m.id}</b> — ${subj}\n   👤 ${from} | 🕐 ${formatDate(m.received_at)}`;
  });

  const text = `📬 <b>Inbox (${messages.length} pesan)</b>${filterText}\n\n${lines.join('\n\n')}\n\n📖 Tap pesan di bawah untuk membaca.`;

  if (editMsgId) return tg.editMessage(chatId, editMsgId, text, { reply_markup: inboxKeyboard(messages, emailFilter) });
  return tg.sendMessage(chatId, text, { reply_markup: inboxKeyboard(messages, emailFilter) });
}

export async function handleRead(chatId, db, tg, arg, editMsgId = null) {
  const id = parseInt(arg);
  if (!id || isNaN(id)) {
    return tg.sendMessage(chatId, '❌ Format salah. Gunakan: /read &lt;id&gt;\nContoh: <code>/read 5</code>');
  }

  const msg = await db.getMessage(id, chatId);
  if (!msg) {
    return tg.sendMessage(chatId, `❌ Pesan #${id} tidak ditemukan atau bukan milikmu.`);
  }

  const from = escapeHtml(`${msg.from_name ? msg.from_name + ' ' : ''}<${msg.from_address}>`);
  const subject = escapeHtml(msg.subject);
  const body = escapeHtml(truncate(msg.body_text, 3000));

  const text = `📨 <b>Pesan #${msg.id}</b>

📧 <b>Ke:</b> <code>${msg.email_address}</code>
👤 <b>Dari:</b> ${from}
📌 <b>Subjek:</b> ${subject}
🕐 <b>Diterima:</b> ${formatDate(msg.received_at)}

─────────────────────
${body || '<i>(Pesan kosong)</i>'}`;

  if (editMsgId) return tg.editMessage(chatId, editMsgId, text, { reply_markup: messageKeyboard(msg.id, msg.from_address, msg.email_address) });
  return tg.sendMessage(chatId, text, { reply_markup: messageKeyboard(msg.id, msg.from_address, msg.email_address) });
}
