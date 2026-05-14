import { confirmDeleteKeyboard, confirmClearKeyboard } from '../keyboards.js';

export async function handleDelete(chatId, db, tg, arg, editMsgId = null) {
  if (!arg) {
    return tg.sendMessage(chatId, '📝 <b>Cara penggunaan:</b>\n/delete &lt;email&gt;\n\nContoh: <code>/delete swift-fox-k2m9@kagemail.my.id</code>');
  }

  // Check ownership
  const email = await db.getEmail(arg.toLowerCase().trim());
  if (!email || email.telegram_id !== chatId) {
    return tg.sendMessage(chatId, `❌ Email <code>${arg}</code> tidak ditemukan atau bukan milikmu.`);
  }

  const text = `⚠️ <b>Konfirmasi Hapus Email</b>\n\n<code>${arg}</code>\n\n⚠️ Semua pesan inbox untuk email ini akan ikut terhapus!`;
  if (editMsgId) return tg.editMessage(chatId, editMsgId, text, { reply_markup: confirmDeleteKeyboard(arg) });
  return tg.sendMessage(chatId, text, { reply_markup: confirmDeleteKeyboard(arg) });
}

export async function handleDeleteExec(chatId, address, db, tg, editMsgId) {
  await db.deactivateEmail(address, chatId);
  const text = `✅ Email <code>${address}</code> berhasil dihapus!`;
  if (editMsgId) return tg.editMessage(chatId, editMsgId, text, {
    reply_markup: { inline_keyboard: [[{ text: '📋 Lihat Email Lain', callback_data: 'list' }]] }
  });
  return tg.sendMessage(chatId, text);
}

export async function handleClear(chatId, db, tg, editMsgId = null) {
  const emails = await db.listEmails(chatId);
  if (emails.length === 0) {
    const text = '📭 Tidak ada email aktif untuk dihapus.';
    if (editMsgId) return tg.editMessage(chatId, editMsgId, text);
    return tg.sendMessage(chatId, text);
  }

  const text = `⚠️ <b>Hapus Semua Email?</b>\n\nKamu punya <b>${emails.length} email aktif</b>.\nSemua email dan pesan inbox akan dihapus permanen!`;
  if (editMsgId) return tg.editMessage(chatId, editMsgId, text, { reply_markup: confirmClearKeyboard() });
  return tg.sendMessage(chatId, text, { reply_markup: confirmClearKeyboard() });
}

export async function handleClearExec(chatId, db, tg, editMsgId) {
  await db.deactivateAllEmails(chatId);
  const text = '✅ <b>Semua email berhasil dihapus!</b>\n\nGunakan /new untuk membuat email baru.';
  if (editMsgId) return tg.editMessage(chatId, editMsgId, text, {
    reply_markup: { inline_keyboard: [[{ text: '✉️ Buat Email Baru', callback_data: 'new' }]] }
  });
  return tg.sendMessage(chatId, text);
}

export async function handleDeleteMsg(chatId, db, tg, arg, editMsgId = null) {
  const id = parseInt(arg);
  if (!id || isNaN(id)) {
    return tg.sendMessage(chatId, '❌ Format salah. Gunakan: /delete_msg &lt;id&gt;');
  }

  // Get message info before deleting (to go back to correct inbox)
  const msg = await db.getMessage(id, chatId);
  if (!msg) {
    return tg.sendMessage(chatId, `❌ Pesan #${id} tidak ditemukan atau bukan milikmu.`);
  }

  const emailAddress = msg.email_address;
  await db.deleteMessage(id, chatId);

  const text = `🗑️ Pesan #${id} berhasil dihapus.`;
  const kb = { inline_keyboard: [[{ text: '◀️ Kembali ke Inbox', callback_data: `inbox:${emailAddress}` }]] };

  if (editMsgId) return tg.editMessage(chatId, editMsgId, text, { reply_markup: kb });
  return tg.sendMessage(chatId, text, { reply_markup: kb });
}
