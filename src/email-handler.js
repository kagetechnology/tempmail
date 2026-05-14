import PostalMime from 'postal-mime';
import { Database } from './utils/db.js';
import { TelegramAPI } from './utils/telegram.js';
import { htmlToText, truncate, escapeHtml, formatDate } from './utils/html-to-text.js';
import { messageKeyboard } from './bot/keyboards.js';

export async function handleEmail(message, env) {
  const db = new Database(env.DB);
  const tg = new TelegramAPI(env.BOT_TOKEN);

  // Parse raw email
  const rawBuffer = await new Response(message.raw).arrayBuffer();
  const parser = new PostalMime();
  const email = await parser.parse(rawBuffer);

  // Normalize recipient address
  const toAddress = (message.to || '').toLowerCase().trim();

  // Look up email address in DB
  const emailRecord = await db.getEmail(toAddress);
  if (!emailRecord) {
    console.log(`[Email] No active record for: ${toAddress}, dropping.`);
    return message.setReject('User not found');
  }

  const telegramId = emailRecord.telegram_id;
  const fromAddress = (email.from?.address || message.from || '').toLowerCase();
  const fromName = email.from?.name || '';

  // Check if sender is blocked
  const blocked = await db.isBlocked(telegramId, fromAddress);
  if (blocked) {
    console.log(`[Email] Blocked sender ${fromAddress} for user ${telegramId}`);
    return;
  }

  // Extract body
  const bodyText = email.text || htmlToText(email.html) || '';
  const subject = email.subject || '(no subject)';

  // Save to inbox
  const result = await db.saveMessage(toAddress, fromAddress, fromName, subject, bodyText);
  const newMsgId = result.meta?.last_row_id;

  // Build notification
  const fromDisplay = escapeHtml(fromName ? `${fromName} <${fromAddress}>` : fromAddress);
  const preview = escapeHtml(truncate(bodyText, 200));
  const attachments = email.attachments || [];
  const attachText = attachments.length > 0
    ? `\n📎 <b>Lampiran (${attachments.length}):</b>\n` +
      attachments.map(a => `• ${escapeHtml(a.filename || 'file')} (${formatSize(a.content?.byteLength || 0)})`).join('\n')
    : '';

  const notifText = `📬 <b>Email Baru Masuk!</b>

📧 <b>Ke:</b> <code>${toAddress}</code>
👤 <b>Dari:</b> ${fromDisplay}
📌 <b>Subjek:</b> ${escapeHtml(subject)}
🕐 <b>Waktu:</b> ${formatDate(new Date().toISOString())}
${attachText}
─────────────────────
${preview || '<i>(Pesan kosong)</i>'}`;

  const kb = newMsgId
    ? messageKeyboard(newMsgId, fromAddress, toAddress)
    : undefined;

  await tg.sendMessage(telegramId, notifText, kb ? { reply_markup: kb } : {});
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
