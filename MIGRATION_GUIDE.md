# Миграция kclub-mvp-v4 → новый GitHub / Supabase / Vercel

Статус на 2026-07-05. Что уже сделано мной и что нужно сделать вручную (я не подключён к GitHub API и не могу создавать репозитории/проекты за вас в этих сервисах).

---

## ⚠️ Важно прочитать в первую очередь (безопасность)

1. **В `packages/database/migrate.ts` в git-истории (коммит `ec75a34`) захардкожена реальная строка подключения к Postgres с паролем**, для проекта `fkupuelagoabnazqbamz.supabase.co` — это текущая боевая база (тот же URL стоит в `NEXT_PUBLIC_SUPABASE_URL` в `.env`/`.env.local`). Файлы `.env*` у вас в `.gitignore`, поэтому сами `.env`-файлы не в репозитории, но **этот пароль закоммичен именно в коде `migrate.ts` и уйдёт в новый GitHub-репозиторий вместе со всей историей**, если пушить как есть.
   - Рекомендация: **смените пароль этой базы** в Supabase Dashboard → Database → Settings → Reset password — как можно быстрее, независимо от переезда.
   - И уберите хардкод из `migrate.ts` (используйте только `process.env.DATABASE_URL_DIRECT`).
2. **Row Level Security выключен на всех 15 таблицах** в новом проекте `kclub_mvp` (это унаследовано из исходной schema — там тоже не было RLS-политик). Supabase-advisor пометил это как `CRITICAL`: любой, у кого есть anon-ключ, может читать/писать данные всех таблиц напрямую через PostgREST, включая `member_cards.card_number`. Я **не включал RLS сам** — это ломает доступ без готовых политик. SQL ниже — просто включает RLS без политик, добавляйте после того как напишете policies:
   ```sql
   ALTER TABLE public.admin_2fa ENABLE ROW LEVEL SECURITY;
   ALTER TABLE public.admin_config ENABLE ROW LEVEL SECURITY;
   ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;
   ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
   ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
   ALTER TABLE public.business_introductions ENABLE ROW LEVEL SECURITY;
   ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;
   ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
   ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
   ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;
   ALTER TABLE public.member_cards ENABLE ROW LEVEL SECURITY;
   ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;
   ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
   ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
   ALTER TABLE public.vip_subscriptions ENABLE ROW LEVEL SECURITY;
   ```
   Подробнее: https://supabase.com/docs/guides/database/postgres/row-level-security
3. **Новый Supabase-проект пустой** (вы выбрали «с нуля»). Реальные пользователи/бизнесы/подписки из текущей боевой базы (`fkupuelagoabnazqbamz`) **не переносятся**. Если приложение уже используется живыми людьми — учтите это перед тем, как переключать прод на новую базу.
4. В `apps/product-core/.env` захардкожены dev-флаги обхода авторизации: `AUTH_DEV_PHONE_BYPASS_ENABLED`, `AUTH_DEV_2FA_BYPASS_ENABLED`, `ADMIN_STAFF_DEV_OTP`, `ADMIN_STAFF_DEV_TOTP`. **Не переносите их в Vercel Production env** — они не должны быть включены в проде.

---

## 1. GitHub — нужно сделать вручную (у меня нет GitHub-коннектора)

Новый аккаунт: `https://github.com/KylyvnykClub` (создан 2026-07-03, репозиториев пока нет).

1. На GitHub создайте **пустой** приватный репозиторий (без README/.gitignore/license, чтобы не было конфликтов при пуше), например:
   `https://github.com/KylyvnykClub/kclub-mvp`
2. В терминале, в папке проекта:
   ```bash
   cd "G:\KYLYVNYK CLUB\kclub-mvp-v4"
   git remote rename origin origin-old
   git remote add origin https://github.com/KylyvnykClub/kclub-mvp.git
   git push -u origin --all
   git push origin --tags
   ```
3. Проверьте на GitHub, что все ветки на месте: `main`, `main-dev`, `main--dev-api`, `main--dev-business-admin`, `main--dev-hero-glide`, `feature-*` и т.д.
4. Если хотите **чистую историю без утёкшего пароля** из `migrate.ts` — вместо `git push --all` сделайте squash/orphan-ветку для `main`, либо прогоните `git filter-repo` / BFG Repo-Cleaner по всей истории перед пушем.

---

## 2. Supabase — сделано мной

Создан новый проект в организации **KylyvnykClub's Org** (`shphsulmbqbykszwtjdo`):

| | |
|---|---|
| Project ref | `ozuljiczwojkrwjmxaec` |
| Name | `kclub_mvp` |
| Region | `eu-central-1` |
| URL | `https://ozuljiczwojkrwjmxaec.supabase.co` |
| Publishable key | `sb_publishable_xviRGJGVlzh9glqGh0gOaw_X0ko3R5F` |
| Стоимость | $0/мес (free tier) |

Применена начальная схема из `packages/database/drizzle/0000_sharp_vulcan.sql` (15 таблиц, все enum-типы, индексы, внешние ключи) — **без данных**, как вы и просили.

### Осталось получить из Supabase Dashboard вручную (я не могу их прочитать через MCP):
- **Database password / connection string** → Project Settings → Database → Connection string (Transaction pooler порт 6543 и Session pooler порт 5432)
- **service_role key** → Project Settings → API
- **JWT secret** → Project Settings → API

Я уже проставил их как `TODO`-плейсхолдеры в `.env.local` обоих приложений локально — просто замените значения на реальные.

---

## 3. Vercel — нужно сделать через Dashboard (у моего Vercel-коннектора нет API для создания проектов, только для чтения/деплоя уже существующих)

Целевая команда: **kylyvnykclub-6893's projects** (сейчас там 0 проектов).

Репозиторий — монорепо на Bun/Turborepo с двумя Next.js приложениями. Нужно **два отдельных Vercel-проекта**, оба смотрят на один и тот же GitHub-репозиторий, но с разным Root Directory:

### Проект 1 — admin-app
- Import Git Repository → выбрать `KylyvnykClub/kclub-mvp` (после пункта 1)
- Root Directory: `apps/admin-app`
- Framework Preset: Next.js (автоопределится)
- Остальное (install/build command) подтянется из `apps/admin-app/vercel.json` автоматически
- Production Branch: `main`
- Environment Variables (Production):
  `ADMIN_APP_URL`, `ADMIN_JWT_SECRET`, `LOG_LEVEL`, `NEXT_PUBLIC_ADMIN_APP_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `PRODUCT_CORE_API_BASE_URL`, `TOTP_ENCRYPTION_KEY`

### Проект 2 — product-core
- Import того же репозитория ещё раз как отдельный проект
- Root Directory: `apps/product-core`
- Production Branch: `main`
- Environment Variables (Production):
  `DATABASE_URL`, `DATABASE_URL_DIRECT`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`, `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_VIP_ANNUAL`, `STRIPE_PRICE_BUSINESS_ANNUAL`, `STRIPE_PORTAL_CONFIGURATION_ID`, `CRON_SECRET`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`, `ADMIN_APP_URL`, `ADMIN_JWT_SECRET`, `NODE_ENV=production`
  **Не добавляйте**: `AUTH_DEV_*`, `ADMIN_STAFF_DEV_*` (dev-only bypass).

Значения (кроме новых Supabase) берите из текущего Vercel-проекта `kclub-mvp-v4` (команда `websphera`, если у вас есть туда доступ) или из локальных `apps/*/.env` / `.env.local`.

После создания обоих проектов подключите домены (если есть) в Settings → Domains для каждого проекта отдельно.

---

## 4. Чек-лист перед переключением прод-трафика

- [ ] Пароль базы `fkupuelagoabnazqbamz` сброшен (см. пункт «Важно» №1)
- [ ] `migrate.ts` больше не содержит хардкод пароля
- [ ] Новый GitHub-репозиторий содержит все нужные ветки
- [ ] Оба Vercel-проекта задеплоены и билд зелёный
- [ ] В `product-core` проставлены реальные `DATABASE_URL` / `DATABASE_URL_DIRECT` / `SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_JWT_SECRET` нового проекта
- [ ] Рассмотрены RLS-политики для 15 таблиц (пункт «Важно» №2)
- [ ] Домены переключены на новые Vercel-проекты
