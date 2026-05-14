import { Database } from '../utils/db.js';
import { TelegramAPI } from '../utils/telegram.js';
import { handleStart } from './commands/start.js';
import { handleNew, handleCustom } from './commands/new-email.js';
import { handleList } from './commands/list.js';
import { handleInbox, handleRead } from './commands/inbox.js';
import { handleDelete, handleDeleteExec, handleClear, handleClearExec, handleDeleteMsg } from './commands/delete.js';
import { handleSetExpiry, handleBlock, handleUnblock } from './commands/settings.js';
import { handleStats } from './commands/stats.js';

export async function handleWebhook(request, env) {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const secret = request.headers.get('X-Telegram-Bot-Api-Secret-Token');
  if (env.WEBHOOK_SECRET && secret !== env.WEBHOOK_SECRET) {
    return new Response('Unauthorized', { status: 401 });
  }

  const update = await request.json();
  const db = new Database(env.DB);
  const tg = new TelegramAPI(env.BOT_TOKEN);

  try {
    if (update.message) {
      await handleMessage(update.message, db, tg, env);
    } else if (update.callback_query) {
      await handleCallback(update.callback_query, db, tg, env);
    }
  } catch (err) {
    console.error('Update processing error:', err);
  }

  return new Response('OK', { status: 200 });
}

// ─── Message Handler ─────────────────────────────────────────────────────────
async function handleMessage(msg, db, tg, env) {
  const text = (msg.text || '').trim();
  const chatId = msg.chat.id;
  const user = msg.from;

  const spaceIdx = text.indexOf(' ');
  const command = (spaceIdx > -1 ? text.slice(0, spaceIdx) : text).toLowerCase().split('@')[0];
  const arg = spaceIdx > -1 ? text.slice(spaceIdx + 1).trim() : '';

  switch (command) {
    case '/start':
    case '/help':
      return handleStart(chatId, user, db, tg);
    case '/new':
      return handleNew(chatId, user, db, tg, env);
    case '/custom':
      return handleCustom(chatId, user, db, tg, env, arg);
    case '/list':
      return handleList(chatId, db, tg);
    case '/inbox':
      return handleInbox(chatId, db, tg, arg);
    case '/read':
      return handleRead(chatId, db, tg, arg);
    case '/delete':
      return handleDelete(chatId, db, tg, arg);
    case '/delete_msg':
      return handleDeleteMsg(chatId, db, tg, arg);
    case '/clear':
      return handleClear(chatId, db, tg);
    case '/setexpiry':
      return handleSetExpiry(chatId, db, tg, arg);
    case '/block':
      return handleBlock(chatId, db, tg, arg);
    case '/unblock':
      return handleUnblock(chatId, db, tg, arg);
    case '/stats':
      return handleStats(chatId, db, tg);
    default:
      if (text.startsWith('/')) {
        return tg.sendMessage(chatId, '❓ Perintah tidak dikenali. Ketik /help untuk bantuan.');
      }
  }
}

// ─── Callback Query Handler ───────────────────────────────────────────────────
async function handleCallback(query, db, tg, env) {
  const data = query.data || '';
  const chatId = query.message.chat.id;
  const msgId = query.message.message_id;
  const user = query.from;

  await tg.answerCallback(query.id);

  const colonIdx = data.indexOf(':');
  const action = colonIdx > -1 ? data.slice(0, colonIdx) : data;
  const param = colonIdx > -1 ? data.slice(colonIdx + 1) : '';

  switch (action) {
    case 'start':
      return handleStart(chatId, user, db, tg);
    case 'new':
      return handleNew(chatId, user, db, tg, env);
    case 'list':
      return handleList(chatId, db, tg, msgId);
    case 'inbox':
      return handleInbox(chatId, db, tg, param, msgId);
    case 'read':
      return handleRead(chatId, db, tg, param, msgId);
    case 'del_msg':
      return handleDeleteMsg(chatId, db, tg, param, msgId);
    case 'del_confirm':
      return handleDelete(chatId, db, tg, param, msgId);
    case 'del_exec':
      return handleDeleteExec(chatId, param, db, tg, msgId);
    case 'clear':
      return handleClear(chatId, db, tg, msgId);
    case 'clear_exec':
      return handleClearExec(chatId, db, tg, msgId);
    case 'block':
      return handleBlock(chatId, db, tg, param);
    case 'stats':
      return handleStats(chatId, db, tg, msgId);
    case 'cancel':
      return tg.editMessage(chatId, msgId, '❌ Dibatalkan.');
  }
}
