# FinTrack — Catatan Finansial
Static app (HTML + Supabase). Tanpa build step, langsung deploy ke Vercel.

1. Supabase: buat project → SQL Editor → jalankan `supabase/schema.sql`.
2. (Opsional) Authentication → Providers → Email → matikan "Confirm email" untuk testing.
3. Buka `index.html`, isi `SUPABASE_URL` & `SUPABASE_KEY` (anon/public key — aman karena dilindungi RLS).
4. Push ke GitHub → Vercel → Import Project → Deploy (Framework: Other).
5. Supabase → Authentication → URL Configuration → isi Site URL dengan domain Vercel.

Logika hutang-piutang: hutang = uang masuk ke rekening (bukan pemasukan), bayar hutang = uang keluar. Piutang kebalikannya. Keduanya tidak masuk grafik pemasukan/pengeluaran, tapi saldo rekening tetap akurat.

## v3: struktur & deploy aman
```
src/index.html  src/style.css  src/app.js   <- source (di GitHub)
build.mjs  package.json  vercel.json        <- build + security headers
```
Vercel: Settings → Environment Variables → tambahkan `SUPABASE_URL` dan `SUPABASE_ANON_KEY`. Build Command & Output sudah diatur di `vercel.json` (`npm run build` → `dist/`). Jangan pernah memakai `service_role` key di sini.

#Link Claude.AI
https://claude.ai/chat/90c5aff4-1381-47c2-9f57-83c2440fa5cf
