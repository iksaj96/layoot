This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Supabase: profil dan pustaka gambar

Jalankan isi [`supabase/migrations/20261015000000_profiles_and_images.sql`](./supabase/migrations/20261015000000_profiles_and_images.sql) melalui SQL Editor Supabase. Migrasi ini membuat `profiles` yang disinkronkan dari `auth.users`, membuat `images` dengan `user_id`, menyiapkan kebijakan akses/storage, serta mengisi data profil dan gambar lama dari bucket `design-assets`.

Sesudah migrasi, unggahan gambar melalui pustaka, toolbar, maupun drag-and-drop menyimpan metadata pemilik ke tabel `public.images`. Pustaka hanya menampilkan gambar milik akun yang sedang masuk.

## Dashboard admin

Buka `/admin` secara langsung dan masuk menggunakan akun Supabase `aji@layoot.com`. Dashboard menyediakan ringkasan, daftar saran dan laporan masalah, serta manajemen akun pengguna. Tidak ada tautan dashboard admin di navigasi publik.

Jalankan [`supabase/migrations/20261016010000_admin_dashboard.sql`](./supabase/migrations/20261016010000_admin_dashboard.sql) setelah migrasi profil dan laporan masukan. Kebijakan RLS membatasi pembacaan seluruh profil dan laporan masukan ke email admin tersebut; akun pengguna lain tetap hanya dapat membaca datanya sendiri.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
