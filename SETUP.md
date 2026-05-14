# 🚀 KageMail Bot — Panduan Setup

Bot Telegram temp mail untuk domain `kagemail.my.id` menggunakan Cloudflare Workers + D1.

---

## Prasyarat

- [ ] Node.js 18+ terinstall
- [ ] Akun Cloudflare dengan domain `kagemail.my.id` aktif
- [ ] Bot Telegram sudah dibuat via [@BotFather](https://t.me/BotFather)
- [ ] Cloudflare Email Routing sudah diaktifkan di dashboard

---

## Langkah 1 — Install Dependencies

```bash
cd /home/sage/TempMail
npm install
```

---

## Langkah 2 — Login Wrangler & Buat Database

```bash
# Login ke Cloudflare
npx wrangler login

# Buat D1 database
npm run db:create
```

Setelah `db:create`, kamu akan mendapat output seperti:
```
✅ Successfully created DB 'kagemail-db'
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

**Salin `database_id` tersebut ke `wrangler.toml`** di baris:
```toml
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

---

## Langkah 3 — Jalankan Migrasi Database

```bash
# Local (untuk testing)
npm run db:migrate:local

# Remote (production)
npm run db:migrate:remote
```

---

## Langkah 4 — Set Environment Secrets

```bash
# Token dari @BotFather
npm run set:token
# Masukkan token bot kamu

# Secret untuk keamanan webhook (buat string acak, contoh: MySecr3tK3y!2024)
npm run set:secret
# Masukkan string acak yang akan dipakai sebagai webhook secret
```

---

## Langkah 5 — Deploy ke Cloudflare Workers

```bash
npm run deploy
```

Setelah deploy, kamu akan mendapat URL Worker seperti:
```
https://kagemail-bot.YOUR_SUBDOMAIN.workers.dev
```

---

## Langkah 6 — Register Webhook Telegram

```bash
curl -X POST https://kagemail-bot.YOUR_SUBDOMAIN.workers.dev/setup \
  -H "Authorization: Bearer YOUR_WEBHOOK_SECRET"
```

Ganti:
- `YOUR_SUBDOMAIN` dengan subdomain Cloudflare kamu
- `YOUR_WEBHOOK_SECRET` dengan secret yang di-set di Langkah 4

Response sukses:
```json
{"ok": true, "result": true, "description": "Webhook was set"}
```

---

## Langkah 7 — Setup Cloudflare Email Routing

1. Buka [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Pilih domain `kagemail.my.id`
3. Klik **Email** → **Email Routing**
4. Klik **Enable Email Routing** (jika belum aktif)
5. Cloudflare akan otomatis tambah MX records — klik **Add records automatically**
6. Pergi ke tab **Routing Rules**
7. Di bagian **Catch-all address**, klik **Edit**
8. Ubah action dari "Drop" ke **"Send to a Worker"**
9. Pilih worker: `kagemail-bot`
10. Klik **Save**

---

## Langkah 8 — Test Bot

1. Buka Telegram, cari bot kamu
2. Kirim `/start`
3. Kirim `/new` → kamu akan mendapat alamat email
4. Kirim email ke alamat tersebut dari Gmail/Yahoo/dll
5. Notifikasi harus muncul di Telegram dalam beberapa detik!

---

## Fitur Lengkap

| Perintah | Fungsi |
|---|---|
| `/start` | Menu utama & panduan |
| `/new` | Generate email acak |
| `/custom nama` | Buat email dengan nama sendiri |
| `/list` | Lihat semua email aktif |
| `/inbox` | Lihat semua pesan masuk |
| `/inbox email@kagemail.my.id` | Filter inbox per email |
| `/read <id>` | Baca pesan tertentu |
| `/delete email@kagemail.my.id` | Hapus email |
| `/delete_msg <id>` | Hapus pesan dari inbox |
| `/clear` | Hapus semua email |
| `/setexpiry <menit>` | Atur masa aktif default (0=permanen) |
| `/block sender@example.com` | Blokir pengirim |
| `/unblock sender@example.com` | Hapus blokir |
| `/stats` | Statistik penggunaan |

---

## Troubleshooting

### Email tidak masuk ke Telegram
- Pastikan MX record sudah propagasi (cek di [dnschecker.org](https://dnschecker.org))
- Pastikan catch-all rule sudah di-set ke Worker
- Cek log Worker di Cloudflare Dashboard → Workers → Logs

### Bot tidak merespons
- Pastikan webhook sudah terdaftar (ulangi Langkah 6)
- Cek `BOT_TOKEN` sudah di-set dengan benar

### Database error
- Pastikan `database_id` di `wrangler.toml` sudah diisi
- Ulangi `npm run db:migrate:remote`

---

## Struktur Project

```
TempMail/
├── wrangler.toml           # Cloudflare config
├── package.json
├── schema.sql              # Database schema
└── src/
    ├── index.js            # Entry point (HTTP + Email + Cron)
    ├── email-handler.js    # Proses email masuk
    ├── bot/
    │   ├── bot.js          # Webhook router
    │   ├── keyboards.js    # Inline keyboards
    │   └── commands/
    │       ├── start.js
    │       ├── new-email.js
    │       ├── list.js
    │       ├── inbox.js
    │       ├── delete.js
    │       ├── settings.js
    │       └── stats.js
    └── utils/
        ├── db.js           # Database helper (D1)
        ├── generate.js     # Random email generator
        ├── html-to-text.js # HTML converter
        └── telegram.js     # Telegram API client
```
