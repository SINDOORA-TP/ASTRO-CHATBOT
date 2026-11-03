# 🔭 Jothidam AI Astrology Chatbot

> **Tamil AI-powered Jathagam (birth chart) chatbot** with Gemini interpretation, slot booking, and astrologer admin panel.

## Quick Start

### 1. Server Requirements
- PHP 8.0+
- MySQL 8.0+
- Apache / Nginx with mod_rewrite
- PHP extensions: PDO, pdo_mysql, fileinfo, session

### 2. Database Setup
```bash
mysql -u root -p < db/schema.sql
```

### 3. Configure
Edit `api/config.php`:
```php
define('DB_PASS', 'your_mysql_password');
define('GEMINI_API_KEY', 'your_gemini_api_key');
```
> ⚠️ Never commit `config.php` to git. Add it to `.gitignore`.

### 4. Get a Gemini API Key
1. Go to https://aistudio.google.com/app/apikey
2. Create a key
3. Paste into `api/config.php`

### 5. UPI QR Code
Place your UPI QR code image at: `assets/qr.png`

### 6. Folder Permissions
```bash
chmod 755 uploads/payments/
```

---

## Project Structure
```
astro-chatbot/
├── index.html              ← Chatbot UI
├── assets/
│   ├── css/style.css       ← Animations + chat UI
│   ├── js/
│   │   ├── astronomy.min.js  ← Ephemeris (extracted from GuruAgasthiya-5.9.html)
│   │   ├── chart.js          ← Phase 1: Chart calculation engine
│   │   ├── dosha.js          ← Phase 1: Dosha & Yogam rules
│   │   ├── chat.js           ← Phase 3: Chatbot + Tamil voice
│   │   └── booking.js        ← Phase 4: Booking form + QR
│   └── qr.png              ← Your UPI QR code (add this)
├── api/
│   ├── config.php          ← DB + Gemini key (keep private)
│   ├── gemini.php          ← Phase 2: Gemini proxy endpoint
│   ├── prompts.php         ← Tamil prompt templates
│   ├── cities.php          ← City search endpoint
│   ├── booking.php         ← Phase 4: Slot booking (atomic lock)
│   └── upload.php          ← Phase 4: Payment screenshot upload
├── admin/
│   ├── index.php           ← Login (default: admin / astro2025)
│   ├── dashboard.php       ← Bookings list
│   ├── review.php          ← Approve/reject + PDF export
│   ├── auth.php            ← Session guard
│   └── logout.php
├── data/
│   └── cities.json         ← Indian + overseas cities with timezones
├── db/
│   └── schema.sql          ← MySQL tables
└── uploads/
    └── payments/           ← Payment screenshots (writable)
```

---

## Phases

| Phase | Description | Status |
|-------|-------------|--------|
| 1 | Calculation engine (Lagna, Rasi, Nakshatra, Dasha, Doshas) | ✅ Built |
| 2 | Gemini AI interpretation (PHP proxy, Tamil replies) | ✅ Built |
| 3 | Chatbot + Tamil voice input | ✅ Built |
| 4 | Slot booking + UPI payment + screenshot upload | ✅ Built |
| 5 | Astrologer admin panel | ✅ Built |
| 6 | Testing + launch | 🔲 Pending |

---

## Admin Panel
URL: `http://yoursite.com/admin/`
Default credentials: `admin` / `astro2025`
> Change the password hash in `admin/auth.php` before going live!

---

## Testing Charts (Phase 6)
Edit `tests/charts.test.js` with 10–20 known charts from your astrologer and run:
```bash
# Open test harness in browser
open tests/index.html
```

---

## Security Checklist Before Launch
- [ ] Change admin password
- [ ] Move `api/config.php` outside webroot (or restrict via `.htaccess`)
- [ ] Set `php_flag display_errors off` in production
- [ ] Enable HTTPS (SSL certificate)
- [ ] Set `uploads/payments/` to not be publicly listable
- [ ] Add rate limiting on `api/gemini.php`
- [ ] Add "Guidance only — not medical/legal advice" disclaimer prominently

---

## Disclaimer
All astrological interpretations are for **guidance purposes only** (வழிகாட்டுதல் மட்டுமே). Not a substitute for medical, legal, or financial advice.

