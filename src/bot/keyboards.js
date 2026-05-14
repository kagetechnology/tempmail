// Inline keyboards for bot interactions
export function mainKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: '✉️ Email Baru', callback_data: 'new' },
        { text: '📋 Daftar Email', callback_data: 'list' },
      ],
      [
        { text: '📬 Inbox', callback_data: 'inbox:' },
        { text: '📊 Statistik', callback_data: 'stats' },
      ],
    ],
  };
}

export function emailCreatedKeyboard(address) {
  return {
    inline_keyboard: [
      [{ text: '📬 Lihat Inbox', callback_data: `inbox:${address}` }],
      [
        { text: '✉️ Email Baru Lagi', callback_data: 'new' },
        { text: '📋 Semua Email', callback_data: 'list' },
      ],
    ],
  };
}

export function inboxKeyboard(messages, emailFilter = '') {
  const rows = messages.map(m => ([{
    text: `${m.is_read ? '📩' : '📬'} #${m.id} — ${m.subject.slice(0, 28)}`,
    callback_data: `read:${m.id}`,
  }]));
  rows.push([
    { text: '🔄 Refresh', callback_data: `inbox:${emailFilter}` },
    { text: '🏠 Menu', callback_data: 'start' },
  ]);
  return { inline_keyboard: rows };
}

export function messageKeyboard(msgId, fromAddress, emailAddress) {
  return {
    inline_keyboard: [
      [
        { text: '🗑️ Hapus Pesan', callback_data: `del_msg:${msgId}` },
        { text: '🚫 Blokir Pengirim', callback_data: `block:${fromAddress}` },
      ],
      [
        { text: '◀️ Kembali ke Inbox', callback_data: `inbox:${emailAddress}` },
      ],
    ],
  };
}

export function listKeyboard(emails) {
  const rows = emails.map(e => {
    const badge = e.unread > 0 ? ` (${e.unread} baru)` : '';
    const label = e.address.split('@')[0];
    return [{ text: `📧 ${label}${badge}`, callback_data: `inbox:${e.address}` }];
  });
  rows.push([
    { text: '✉️ Buat Email Baru', callback_data: 'new' },
    { text: '🔄 Refresh', callback_data: 'list' },
  ]);
  return { inline_keyboard: rows };
}

export function confirmDeleteKeyboard(address) {
  return {
    inline_keyboard: [
      [
        { text: '✅ Ya, Hapus', callback_data: `del_exec:${address}` },
        { text: '❌ Batal', callback_data: 'list' },
      ],
    ],
  };
}

export function confirmClearKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: '✅ Ya, Hapus Semua', callback_data: 'clear_exec' },
        { text: '❌ Batal', callback_data: 'list' },
      ],
    ],
  };
}
