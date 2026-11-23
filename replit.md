# API Liga 1 Indonesia

API read-only untuk data BRI SUPER LEAGUE 2026-27 dari iLeague: jadwal mendatang, live score, hasil selesai, klasemen, ranking pemain, logo klub, dan detail pertandingan.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Sumber data eksternal: `https://ileague.id`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/api-server/src/lib/ileague.ts` — scraper, parser, cache, dan scheduler data iLeague
- `artifacts/api-server/src/routes/league.ts` — endpoint Liga 1
- `lib/api-spec/openapi.yaml` — kontrak API sumber tunggal
- `lib/api-zod/src/index.ts` — barrel Zod yang sengaja mengecualikan export type path parameter duplikat

## Architecture decisions

- Data disegarkan otomatis setiap 30 detik dan snapshot terakhir dipakai sebagai fallback jika iLeague sedang gagal diakses.
- Jadwal mendatang memilih pekan terdekat yang memiliki pertandingan; scraper membaca pekan sebelumnya untuk hasil selesai dan beberapa pekan berikutnya untuk fallback.
- Detail pertandingan diambil saat diminta dan di-cache singkat agar linimasa, statistik, dan susunan pemain tidak membebani refresh snapshot.
- Semua tanggal/jam pertandingan dipublikasikan dengan timezone `Asia/Jakarta` dan sumber URL iLeague dipertahankan pada respons.

## Product

Klien dapat memakai snapshot lengkap atau endpoint terpisah untuk fixture, live, standings, top scorer, klub, dan detail pertandingan.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Setelah mengubah OpenAPI, jalankan codegen; generator menambahkan kembali wildcard export Zod sehingga `lib/api-zod/src/index.ts` perlu mempertahankan export eksplisit untuk menghindari konflik `GetLiga1MatchDetailParams`.
- Sumber iLeague memakai `15:30` untuk jadwal dan `FT 1:3`/`LIVE 1:0` untuk skor pada elemen HTML yang sama.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
