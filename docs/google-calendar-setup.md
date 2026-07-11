# Google Calendar API — Setup Guide

## Langkah 1: Buat Project di Google Cloud Console

1. Buka [Google Cloud Console](https://console.cloud.google.com/)
2. Klik **Select a project** → **New Project**
3. Nama project: `Life OS Calendar`
4. Klik **Create**

## Langkah 2: Aktifkan Google Calendar API

1. Di sidebar kiri, buka **APIs & Services** → **Library**
2. Cari **Google Calendar API**
3. Klik **Enable**

## Langkah 3: Buat OAuth 2.0 Credentials

1. Buka **APIs & Services** → **Credentials**
2. Klik **Create Credentials** → **OAuth Client ID**
3. Jika diminta, konfigurasi **OAuth Consent Screen** dulu:
   - User Type: **External**
   - App name: `Life OS`
   - User support email: (email kamu)
   - Developer contact: (email kamu)
   - Scopes: tambahkan `https://www.googleapis.com/auth/calendar.readonly` dan `https://www.googleapis.com/auth/calendar.events`
4. Kembali ke Credentials, pilih **Web application**
5. Nama: `Life OS Web`
6. Authorized JavaScript origins:
   - `http://localhost:3000` (development)
   - `https://your-domain.com` (production)
7. Authorized redirect URIs:
   - `http://localhost:3000` (development)
8. Klik **Create**
9. **Copy Client ID** yang muncul

## Langkah 4: Tambahkan ke Environment Variables

Buat/edit file `.env.local` di root project:

```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
NEXT_PUBLIC_GOOGLE_API_KEY=your-api-key-here
```

Untuk API Key:
1. Di Credentials, klik **Create Credentials** → **API Key**
2. Restrict key ke **Google Calendar API** saja
3. Copy dan paste ke `.env.local`

## Langkah 5: Cara Kerja di Life OS

### Authentication Flow
```
User klik "Sync Google Calendar"
  → Google OAuth popup muncul
  → User login & izinkan akses
  → Life OS dapat access token
  → Fetch events dari Google Calendar
  → Tampilkan di Planning timeline
```

### Two-Way Sync
1. **Pull**: Ambil event dari Google Calendar → tampilkan di Planning
2. **Push**: Plan yang dibuat di Life OS → buat event di Google Calendar

### Kode Integrasi

File `src/lib/google-calendar.ts` berisi:
- `initGoogleCalendar()` — Load Google API client
- `signInGoogle()` — Trigger OAuth login
- `signOutGoogle()` — Revoke access
- `fetchCalendarEvents(startDate, endDate)` — GET events
- `createCalendarEvent(plan)` — POST event
- `deleteCalendarEvent(eventId)` — DELETE event

## Langkah 6: Testing

1. Jalankan `npm run dev`
2. Buka halaman Planning
3. Klik "Sync Google Calendar"
4. Login dengan akun Google
5. Events dari Google Calendar akan muncul di timeline

## Catatan Penting

> ⚠️ Google Calendar API memerlukan HTTPS untuk production.
> Untuk development, `localhost` diizinkan tanpa HTTPS.

> ⚠️ OAuth consent screen dalam mode "Testing" hanya bisa diakses oleh
> email yang ditambahkan sebagai test user. Untuk akses publik, perlu
> submit untuk verifikasi Google.

> 💡 Quota gratis Google Calendar API: 1,000,000 queries/hari — lebih
> dari cukup untuk penggunaan personal.
