# 📬 KageMail — Telegram Temp Mail Bot

A fully serverless temporary email bot for Telegram, powered by **Cloudflare Workers**, **Cloudflare Email Routing**, and **Cloudflare D1** — no VPS required.

Generate disposable email addresses on your own custom domain and receive emails directly in Telegram, in real-time.

---

## ✨ Features

- **Instant email generation** — random or custom address
- **Real-time notifications** — receive emails directly in Telegram as they arrive
- **Full inbox management** — read, delete messages per address
- **Multiple active emails** — up to 10 simultaneous addresses per user
- **Auto-expiry** — configurable TTL per user (or permanent)
- **Sender blocking** — block unwanted senders
- **Attachment detection** — lists attachment names and sizes
- **HTML → text conversion** — clean email body rendering
- **Usage statistics** — track your email activity
- **Hourly cleanup** — expired emails auto-deleted via cron

---

## 🤖 Bot Commands

| Command | Description |
|---|---|
| `/start` | Show welcome message and command list |
| `/new` | Generate a random temp email |
| `/custom <name>` | Create a custom email (e.g. `/custom mytemp`) |
| `/list` | List all active email addresses |
| `/inbox` | View all incoming messages |
| `/inbox <email>` | Filter inbox by specific address |
| `/read <id>` | Read a specific message |
| `/delete <email>` | Delete an email address |
| `/delete_msg <id>` | Delete a specific message |
| `/clear` | Delete all active emails |
| `/setexpiry <minutes>` | Set default email expiry (`0` = permanent) |
| `/block <email>` | Block a sender |
| `/unblock <email>` | Unblock a sender |
| `/stats` | View your usage statistics |

---

## 🏗️ Architecture

```
Incoming Email
     │
     ▼
[MX Record → Cloudflare Email Routing]
     │  catch-all → Email Worker
     ▼
[Cloudflare Email Worker]
     │  parse email (postal-mime)
     │  look up recipient in D1
     │  check blocked senders
     ▼
[Cloudflare D1 (SQLite)]
     │  save to inbox
     ▼
[Telegram Bot API]
     │  send real-time notification
     ▼
[User on Telegram]
```

**All components run on Cloudflare Free Tier:**

| Service | Role | Free Limit |
|---|---|---|
| Cloudflare Email Routing | Receive incoming emails | Unlimited |
| Cloudflare Workers | Bot webhook + email handler + cron | 100k req/day |
| Cloudflare D1 | Database (SQLite) | 5 GB |

---

## 🚀 Self-Hosting Guide

### Prerequisites

- Node.js 18+
- Cloudflare account with your domain active
- Telegram bot token from [@BotFather](https://t.me/BotFather)
- Cloudflare Email Routing enabled on your domain

### 1. Clone & Install

```bash
git clone https://github.com/kagetechnology/tempmail.git
cd tempmail
npm install
```

### 2. Configure

Copy the example config and fill in your values:

```bash
cp wrangler.toml.example wrangler.toml
```

Edit `wrangler.toml`:
- Set `DOMAIN` to your domain
- Set `pattern` under `[[routes]]` to your bot subdomain (e.g. `bot.yourdomain.com`)
- Fill in `database_id` after running the next step

### 3. Create Database

```bash
npx wrangler login
npm run db:create
# Copy the database_id output → paste into wrangler.toml
npm run db:migrate:remote
```

### 4. Set Secrets

```bash
npm run set:token     # Enter your Telegram Bot Token
npm run set:secret    # Enter a random secret string (use: openssl rand -hex 32)
```

### 5. Deploy

```bash
npm run deploy
```

### 6. Register Telegram Webhook

Open in your browser (replace values):
```
https://api.telegram.org/bot<BOT_TOKEN>/setWebhook?url=https://bot.yourdomain.com/webhook&secret_token=<WEBHOOK_SECRET>
```

### 7. Configure Cloudflare Email Routing

1. Cloudflare Dashboard → your domain → **Email** → **Email Routing**
2. Enable Email Routing (MX records added automatically)
3. Go to **Routing Rules** → **Catch-all** → Edit
4. Set action: **Send to a Worker** → select `kagemail-bot`
5. Save

---

## 📁 Project Structure

```
├── wrangler.toml.example   # Config template (copy to wrangler.toml)
├── package.json
├── schema.sql              # D1 database schema
├── SETUP.md                # Detailed setup guide (Bahasa Indonesia)
└── src/
    ├── index.js            # Entry point (HTTP + Email event + Cron)
    ├── email-handler.js    # Process incoming emails
    ├── bot/
    │   ├── bot.js          # Telegram webhook router
    │   ├── keyboards.js    # Inline keyboard layouts
    │   └── commands/
    │       ├── start.js    # /start, /help
    │       ├── new-email.js# /new, /custom
    │       ├── list.js     # /list
    │       ├── inbox.js    # /inbox, /read
    │       ├── delete.js   # /delete, /delete_msg, /clear
    │       ├── settings.js # /setexpiry, /block, /unblock
    │       └── stats.js    # /stats
    └── utils/
        ├── db.js           # Cloudflare D1 helper
        ├── generate.js     # Random email generator
        ├── html-to-text.js # HTML → plain text converter
        └── telegram.js     # Telegram Bot API client
```

---

## 🛡️ Security

- Bot token and webhook secret are stored as **Cloudflare Worker Secrets** (encrypted), never in source code
- Webhook requests are verified using `X-Telegram-Bot-Api-Secret-Token`
- `wrangler.toml` (containing `database_id`) is excluded from git via `.gitignore`

---

## 📄 License

MIT License — feel free to fork and use for your own domain.

---

## 🙏 Built With

- [Cloudflare Workers](https://workers.cloudflare.com/)
- [Cloudflare D1](https://developers.cloudflare.com/d1/)
- [Cloudflare Email Routing](https://developers.cloudflare.com/email-routing/)
- [postal-mime](https://github.com/postalsys/postal-mime) — Email parser
- [Telegram Bot API](https://core.telegram.org/bots/api)
