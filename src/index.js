import { handleWebhook } from './bot/bot.js';
import { handleEmail } from './email-handler.js';
import { Database } from './utils/db.js';
import { TelegramAPI } from './utils/telegram.js';

export default {
  // ── HTTP: Telegram Webhook + Admin Endpoints ──────────────────────────────
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Health check
    if (url.pathname === '/') {
      return new Response(
        JSON.stringify({ status: 'ok', bot: 'KageMail', domain: env.DOMAIN }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Telegram webhook
    if (url.pathname === '/webhook') {
      return handleWebhook(request, env);
    }

    // Admin: register webhook (call once after deploy)
    if (url.pathname === '/setup' && request.method === 'POST') {
      const authHeader = request.headers.get('Authorization');
      if (authHeader !== `Bearer ${env.WEBHOOK_SECRET}`) {
        return new Response('Unauthorized', { status: 401 });
      }
      const tg = new TelegramAPI(env.BOT_TOKEN);
      const webhookUrl = `https://${url.hostname}/webhook`;
      const result = await tg.setWebhook(webhookUrl, env.WEBHOOK_SECRET);
      return new Response(JSON.stringify(result), { headers: { 'Content-Type': 'application/json' } });
    }

    // Admin: cleanup expired emails (can be triggered by cron or manually)
    if (url.pathname === '/cleanup' && request.method === 'POST') {
      const authHeader = request.headers.get('Authorization');
      if (authHeader !== `Bearer ${env.WEBHOOK_SECRET}`) {
        return new Response('Unauthorized', { status: 401 });
      }
      const db = new Database(env.DB);
      const expired = await db.cleanupExpired();
      // Notify users about expired emails
      if (expired.length > 0) {
        const tg = new TelegramAPI(env.BOT_TOKEN);
        const notified = new Set();
        for (const e of expired) {
          if (!notified.has(e.telegram_id)) {
            notified.add(e.telegram_id);
          }
          await tg.sendMessage(e.telegram_id,
            `⏱️ Email <code>${e.address}</code> telah kedaluwarsa dan dihapus otomatis.`
          ).catch(() => {});
        }
      }
      return new Response(JSON.stringify({ cleaned: expired.length }), { headers: { 'Content-Type': 'application/json' } });
    }

    return new Response('Not Found', { status: 404 });
  },

  // ── Email: Cloudflare Email Routing ───────────────────────────────────────
  async email(message, env, ctx) {
    ctx.waitUntil(handleEmail(message, env));
  },

  // ── Cron: Auto-cleanup expired emails every hour ──────────────────────────
  async scheduled(event, env, ctx) {
    ctx.waitUntil((async () => {
      const db = new Database(env.DB);
      const tg = new TelegramAPI(env.BOT_TOKEN);
      const expired = await db.cleanupExpired();
      for (const e of expired) {
        await tg.sendMessage(e.telegram_id,
          `⏱️ Email <code>${e.address}</code> telah kedaluwarsa dan dihapus otomatis.`
        ).catch(() => {});
      }
      console.log(`[Cron] Cleaned ${expired.length} expired emails.`);
    })());
  },
};
