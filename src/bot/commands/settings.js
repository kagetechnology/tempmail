export async function handleSetExpiry(chatId, db, tg, arg) {
  const minutes = parseInt(arg);

  if (arg === '' || isNaN(minutes) || minutes < 0) {
    return tg.sendMessage(chatId,
      `⏱️ <b>Atur Masa Aktif Email Default</b>\n\n<b>Cara penggunaan:</b>\n/setexpiry &lt;menit&gt;\n\n<b>Contoh:</b>\n• <code>/setexpiry 30</code> → aktif 30 menit\n• <code>/setexpiry 60</code> → aktif 1 jam\n• <code>/setexpiry 0</code> → permanen\n\n<i>Berlaku untuk email baru yang dibuat setelahnya.</i>`
    );
  }

  await db.updateExpiry(chatId, minutes);

  const displayText = minutes === 0 ? 'Permanen ♾️' : `${minutes} menit`;
  return tg.sendMessage(chatId,
    `✅ <b>Masa aktif default diubah ke: ${displayText}</b>\n\nEmail yang dibuat berikutnya akan otomatis expire dalam waktu tersebut.`
  );
}

export async function handleBlock(chatId, db, tg, arg) {
  if (!arg) {
    const blocked = await db.listBlocked(chatId);
    if (blocked.length === 0) {
      return tg.sendMessage(chatId,
        `🚫 <b>Daftar Blokir</b>\n\nKamu belum memblokir siapapun.\n\n<b>Cara blokir:</b>\n/block &lt;email_pengirim&gt;\nContoh: <code>/block spam@example.com</code>`
      );
    }
    const list = blocked.map((b, i) => `${i + 1}. <code>${b.sender_email}</code>`).join('\n');
    return tg.sendMessage(chatId,
      `🚫 <b>Daftar Blokir (${blocked.length})</b>\n\n${list}\n\n<b>Cara unblokir:</b>\n/unblock &lt;email&gt;`
    );
  }

  const email = arg.toLowerCase().trim();
  if (!email.includes('@')) {
    return tg.sendMessage(chatId, `❌ Format email tidak valid: <code>${arg}</code>`);
  }

  await db.blockSender(chatId, email);
  return tg.sendMessage(chatId,
    `✅ <code>${email}</code> berhasil diblokir.\n\nEmail dari pengirim ini tidak akan masuk ke inbox kamu.`
  );
}

export async function handleUnblock(chatId, db, tg, arg) {
  if (!arg) {
    return tg.sendMessage(chatId, '📝 Cara penggunaan: /unblock &lt;email&gt;');
  }
  const email = arg.toLowerCase().trim();
  await db.unblockSender(chatId, email);
  return tg.sendMessage(chatId, `✅ <code>${email}</code> berhasil di-unblokir.`);
}
