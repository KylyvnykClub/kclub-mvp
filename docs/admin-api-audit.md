# Аудит admin API resources (шаг 6)

> Дата: 2026-07-20
> Цель: вход для Refine dataProvider (шаги 7–8). Зафиксировать envelope, пагинацию, CRUD vs domain commands, proxy-путь, permissions.

---

## Proxy-архитектура

**Файл:** `apps/admin-app/src/app/api/proxy/[...path]/route.ts`

### Формула URL

```
Client:   /api/proxy/<path>?<query>
Upstream: ${PRODUCT_CORE_API_BASE_URL}/api/admin/v1/<path>?<query>
```

`PRODUCT_CORE_API_BASE_URL` → fallback `PRODUCT_CORE_ADMIN_API_URL` → fallback `http://localhost:3000`.

**Пример:** `GET /api/proxy/users?page=1&limit=20` → `GET http://…/api/admin/v1/users?page=1&limit=20`

### Методы

GET, POST, PUT, PATCH, DELETE — каждый экспортирован отдельным handler'ом.

### Auth bridge

1. `readStaffSession()` читает httpOnly cookie `kclub_staff_session` (JWT, 8h TTL)
2. Если сессии нет → `401 { code: 'UNAUTHENTICATED' }`
3. Инжектирует `Authorization: Bearer <token>` на upstream
4. Ответ upstream возвращается клиенту as-is (status code + body)

### Вывод для dataProvider

Refine dataProvider будет вызывать `/api/proxy/<resource>` — это автоматически проксируется в `/api/admin/v1/<resource>` с Bearer токеном. Никакого дополнительного auth-кода в dataProvider не нужно.

---

## Стандартный envelope

**Файл:** `packages/contracts/src/api.ts`

```typescript
type ApiResponse<T> = {
  data: T | null;
  meta?: ApiMeta;
  error: ApiError | null;   // null при успехе
};

type ApiMeta = {
  page?: number;
  limit?: number;
  total?: number;
  timestamp?: string;       // всегда инжектируется withTimestamp()
};

type ApiListResponse<T> = ApiResponse<T[]>;
```

Все серверные route'ы используют `jsonSuccess(data, meta?)`. `error` всегда присутствует (null при успехе).

### Маппинг для Refine dataProvider

```
Refine getList  → { data: response.data, total: response.meta?.total ?? response.data.length }
Refine getOne   → { data: response.data }
Refine create   → { data: response.data }
Refine update   → { data: response.data }
Refine delete   → { data: response.data }
HttpError       → { code: response.error.code, message: response.error.message, statusCode }
```

---

## Permission-система

**Файлы:**
- `packages/contracts/src/permissions.ts` — `STAFF_PERMISSIONS` enum
- `packages/domain/src/rbac-policy.ts` — `hasStaffPermission()`, `STAFF_ROLE_PERMISSIONS`
- `apps/product-core/src/server/admin-guard.ts` — `adminGuard(request, permission)`

### Приоритет effective permissions

```
deny override  >  grant override  >  role defaults
```

`permission_overrides: { granted: string[], denied: string[] }` — JSONB на `adminUsers`.

### Role → permission matrix

| Permission | OWNER | ADMIN | MODERATOR |
|---|:---:|:---:|:---:|
| `DASHBOARD_METRICS_READ` | ✓ | ✓ | ✓ |
| `FINANCE_METRICS_READ` | ✓ | ✓ | — |
| `USERS_READ` | ✓ | ✓ | — |
| `USERS_BLOCK` | ✓ | ✓ | — |
| `CARDS_READ` | ✓ | ✓ | — |
| `CARDS_REISSUE` | ✓ | ✓ | — |
| `CARDS_REVOKE` | ✓ | ✓ | — |
| `SUBSCRIPTIONS_READ` | ✓ | ✓ | ✓ |
| `SUBSCRIPTIONS_CANCEL_ADMIN` | ✓ | ✓ | — |
| `BUSINESSES_MODERATE` | ✓ | ✓ | ✓ |
| `INTRODUCTIONS_MODERATE` | ✓ | ✓ | ✓ |
| `TAXONOMY_MANAGE` | ✓ | ✓ | ✓ |
| `FEATURED_BUSINESSES_MANAGE` | ✓ | ✓ | ✓ |
| `STRIPE_PRICES_MANAGE` | ✓ | ✓ | — |
| `STAFF_MANAGE` | ✓ | — | — |
| `AUDIT_READ` | ✓ | ✓ | — |
| `INTERNAL_NOTES_CREATE` | ✓ | ✓ | ✓ |

UI-route гейтинг (`route-permissions.ts`) работает по ролям, а не по permissions — отдельная карта `DASHBOARD_ROUTE_ROLES`.

---

## Ресурсы: детальный аудит

### 1. categories

| | |
|---|---|
| **Proxy path** | `/api/proxy/categories` |
| **Permission** | `TAXONOMY_MANAGE` |
| **Тип** | Full CRUD |

| Операция | Method | Server path | Тело |
|---|---|---|---|
| List | GET | `/categories` | — |
| Get | GET | `/categories/:id` | — |
| Create | POST | `/categories` | `createCategorySchema` |
| Update | PUT | `/categories/:id` | `updateCategorySchema` |
| Delete | DELETE | `/categories/:id` | — |

**Envelope list:** `{ data: CategoryDto[], meta: { timestamp }, error: null }` — **нет `total/page/limit`**
**List-параметры:** нет (unpaginated full fetch)

---

### 2. countries

| | |
|---|---|
| **Proxy path** | `/api/proxy/countries` |
| **Permission** | `TAXONOMY_MANAGE` |
| **Тип** | Full CRUD |

| Операция | Method | Server path | Тело |
|---|---|---|---|
| List | GET | `/countries` | — |
| Get | GET | `/countries/:id` | — |
| Create | POST | `/countries` | schema |
| Update | PUT | `/countries/:id` | schema |
| Delete | DELETE | `/countries/:id` | — |

**Envelope list:** `{ data: CountryDto[], meta: { timestamp }, error: null }` — **нет `total/page/limit`**
**List-параметры:** нет

---

### 3. cities

| | |
|---|---|
| **Proxy path** | `/api/proxy/cities` |
| **Permission** | `TAXONOMY_MANAGE` |
| **Тип** | Full CRUD |

| Операция | Method | Server path | Тело |
|---|---|---|---|
| List | GET | `/cities` | — |
| Get | GET | `/cities/:id` | — |
| Create | POST | `/cities` | schema |
| Update | PUT | `/cities/:id` | schema |
| Delete | DELETE | `/cities/:id` | — |

**Envelope list:** `{ data: CityDto[], meta: { timestamp }, error: null }` — **нет `total/page/limit`**
**List-параметры:** нет

> **Taxonomy-ресурсы (1–3) структурно идентичны.** Все — полный CRUD, без пагинации, одно permission `TAXONOMY_MANAGE`.

---

### 4. businesses (он же catalog)

| | |
|---|---|
| **Proxy path** | `/api/proxy/businesses` |
| **Permission** | `BUSINESSES_MODERATE` (featured: `FEATURED_BUSINESSES_MANAGE`) |
| **Тип** | CRUD + domain commands |

> Feature `catalog` в admin-app — это клиентская обёртка над тем же серверным ресурсом `businesses`.

| Операция | Method | Server path | Тип | Тело |
|---|---|---|---|---|
| List | GET | `/businesses` | CRUD | — |
| Get | GET | `/businesses/:id` | CRUD | — |
| Update | **PATCH** | `/businesses/:id` | CRUD | `adminBusinessUpdateSchema` |
| Approve | POST | `/businesses/:id/approve` | **Domain** | `businessApproveSchema` |
| Reject | POST | `/businesses/:id/reject` | **Domain** | `businessRejectSchema` |
| Hide | POST | `/businesses/:id/hide` | **Domain** | `businessHideSchema` |
| Publish | POST | `/businesses/:id/publish` | **Domain** | нет тела |
| Featured | POST | `/businesses/:id/featured` | **Domain** | `businessFeaturedSchema` |

**Envelope list:** `{ data: T[], meta: { page, limit, total, timestamp }, error: null }` — **✓ полная пагинация**
**List-параметры:** `page`, `limit`, `status` (через `adminBusinessListSchema`)

> Единственный ресурс с PATCH (не PUT). Нет Create и Delete.

---

### 5. cards

| | |
|---|---|
| **Proxy path** | `/api/proxy/cards` |
| **Permission** | `CARDS_READ` (reissue: `CARDS_REISSUE`, revoke: `CARDS_REVOKE`) |
| **Тип** | Read + domain commands |

| Операция | Method | Server path | Тип | Тело |
|---|---|---|---|---|
| List | GET | `/cards` | CRUD | — |
| Get | GET | `/cards/:id` | CRUD | — |
| Reissue | POST | `/cards/:id/reissue` | **Domain** | `reissueCardSchema` |
| Revoke | POST | `/cards/:id/revoke` | **Domain** | `revokeCardSchema` |

**Envelope list:** `{ data: T[], meta: { page, limit, total, timestamp }, error: null }` — **✓ полная пагинация**
**List-параметры:** `page`, `limit`, `search`, `status`, `membershipTier`

> Нет update/create/delete. Только чтение + команды.

---

### 6. introductions

| | |
|---|---|
| **Proxy path** | `/api/proxy/introductions` |
| **Permission** | `INTRODUCTIONS_MODERATE` |
| **Тип** | Read + domain commands |

| Операция | Method | Server path | Тип | Тело |
|---|---|---|---|---|
| List | GET | `/introductions` | CRUD | — |
| Get | GET | `/introductions/:id` | CRUD | — |
| Approve | POST | `/introductions/:id/approve` | **Domain** | `introductionApproveSchema` |
| Reject | POST | `/introductions/:id/reject` | **Domain** | `introductionRejectSchema` |
| Complete | POST | `/introductions/:id/complete` | **Domain** | нет тела |

**Envelope list:** `{ data: T[], meta: { timestamp }, error: null }` — **⚠️ НЕТ `total/page/limit`**
**List-параметры:** только `businessId` (server-side, вручную из `searchParams.get`)

> **Проблема для dataProvider:** нет пагинации. dataProvider.getList ожидает `total` — придётся возвращать `data.length`.

---

### 7. users

| | |
|---|---|
| **Proxy path** | `/api/proxy/users` |
| **Permission** | `USERS_READ` (block/unblock: `USERS_BLOCK`, sync-vip: `SUBSCRIPTIONS_CANCEL_ADMIN`) |
| **Тип** | Read + domain commands + sub-resource |

| Операция | Method | Server path | Тип | Тело |
|---|---|---|---|---|
| List | GET | `/users` | CRUD | — |
| Get | GET | `/users/:id` | CRUD | — |
| Block | POST | `/users/:id/block` | **Domain** | `blockUserSchema` |
| Unblock | POST | `/users/:id/unblock` | **Domain** | `unblockUserSchema` |
| Sync VIP | POST | `/users/:id/sync-vip` | **Domain** | нет тела |
| Invoices | GET | `/users/:id/invoices` | Sub-resource | — |

**Envelope list:** `{ data: T[], meta: { page, limit, total, timestamp }, error: null }` — **✓ полная пагинация**
**List-параметры:** `page`, `limit`, `search`, `status`, `membershipTier`

---

### 8. staff

| | |
|---|---|
| **Proxy path** | `/api/proxy/staff` |
| **Permission** | `STAFF_MANAGE` (всё) |
| **Тип** | CRUD + domain commands |

| Операция | Method | Server path | Тип | Тело |
|---|---|---|---|---|
| List | GET | `/staff` | CRUD | — |
| Create | POST | `/staff` | CRUD | `adminStaffCreateSchema` |
| Get | GET | `/staff/:id` | CRUD | — |
| Deactivate | POST | `/staff/:id/deactivate` | **Domain** | `staffDeactivateSchema` |
| Password reset | POST | `/staff/:id/password-reset` | **Domain** | `staffPasswordResetSchema` |
| Update permissions | PUT | `/staff/:id/permissions` | **Domain** | `staffPermissionOverridesUpdateSchema` |
| Update role | PUT | `/staff/:id/role` | **Domain** | `staffRoleUpdateSchema` |

**Envelope list:** `{ data: T[], meta: { timestamp }, error: null }` — **⚠️ НЕТ `total/page/limit`**
**List-параметры:** нет

---

### 9. audit

| | |
|---|---|
| **Proxy path** | `/api/proxy/audit` |
| **Permission** | `AUDIT_READ` |
| **Тип** | Read-only |

| Операция | Method | Server path | Тип |
|---|---|---|---|
| List | GET | `/audit` | Read-only query |

**Envelope list:** `{ data: T[], meta: { page, limit, total, timestamp }, error: null }` — **✓ полная пагинация**
**List-параметры:** `page`, `limit`, `action`, `actorRole`, `entityType`, `dateFrom`, `dateTo`

> **⚠️ Баг:** клиент отправляет `actorStaffId`, но сервер (`auditLogListSchema`) его не парсит — фильтр игнорируется.

---

### 10. subscriptions

| | |
|---|---|
| **Proxy path** | `/api/proxy/subscriptions` |
| **Permission** | `SUBSCRIPTIONS_READ` (cancel: `SUBSCRIPTIONS_CANCEL_ADMIN`) |
| **Тип** | Read + domain command |

| Операция | Method | Server path | Тип | Тело |
|---|---|---|---|---|
| List | GET | `/subscriptions` | CRUD | — |
| Get | GET | `/subscriptions/:id` | CRUD | — |
| Cancel | POST | `/subscriptions/:id/cancel` | **Domain** | нет тела |

**Envelope list:** `{ data: T[], meta: { timestamp }, error: null }` — **⚠️ НЕТ `total/page/limit`**
**List-параметры:** нет

---

### 11. memberships

| | |
|---|---|
| **Proxy path** | `/api/proxy/memberships` |
| **Permission** | `SUBSCRIPTIONS_READ` |
| **Тип** | Read-only |

| Операция | Method | Server path | Тип |
|---|---|---|---|
| List | GET | `/memberships` | Read-only |

**Envelope list:** `{ data: T[], meta: { timestamp }, error: null }` — **нет `total/page/limit`**
**List-параметры:** нет

---

### 12. stripe-prices

| | |
|---|---|
| **Proxy path** | `/api/proxy/stripe-prices` |
| **Permission** | `STRIPE_PRICES_MANAGE` |
| **Тип** | Read + bulk update |

| Операция | Method | Server path | Тип | Тело |
|---|---|---|---|---|
| List | GET | `/stripe-prices` | CRUD | — |
| Bulk update | PUT | `/stripe-prices` | **Domain** (batch config write) | key-value pairs |

**Envelope list:** `{ data: T[], meta: { timestamp }, error: null }` — нет пагинации
**List-параметры:** нет

> Клиент фактически использует `PUT /admin-config/:key` per-key (через stripe-prices form), а не bulk PUT.

---

### 13. admin-config

| | |
|---|---|
| **Proxy path** | `/api/proxy/admin-config/:key` |
| **Permission** | `STRIPE_PRICES_MANAGE` |
| **Тип** | Single-resource CRUD |

| Операция | Method | Server path | Тело |
|---|---|---|---|
| Get | GET | `/admin-config/:key` | — |
| Update | PUT | `/admin-config/:key` | `adminConfigUpdateSchema` |

Адресуется по ключу, не по id. Потребитель — `StripePricesForm`.

---

### 14. dashboard-metrics

| | |
|---|---|
| **Proxy path** | `/api/proxy/dashboard-metrics` |
| **Permission** | `DASHBOARD_METRICS_READ` |
| **Тип** | Read-only aggregation |

| Операция | Method | Server path |
|---|---|---|
| Get metrics | GET | `/dashboard-metrics` |

Единственный объект, не список. Не является ресурсом для Refine.

---

### 15. finance-metrics

| | |
|---|---|
| **Proxy path** | `/api/proxy/finance-metrics` |
| **Permission** | `FINANCE_METRICS_READ` |
| **Тип** | Read-only aggregation |

| Операция | Method | Server path |
|---|---|---|
| Get metrics | GET | `/finance-metrics` |

Единственный объект. Клиент использует 60s таймаут (Stripe invoice aggregation). Не является ресурсом для Refine.

---

### 16. staff-auth

| | |
|---|---|
| **Proxy path** | `/api/proxy/staff-auth/*` |
| **Permission** | нет (pre-auth) |
| **Тип** | Auth lifecycle (domain commands) |

| Операция | Method | Server path | Статус |
|---|---|---|---|
| Get session | GET | `/staff-auth/session` | Active |
| Logout | POST | `/staff-auth/logout` | Active |
| Register password | POST | `/staff-auth/password/register` | Active |
| Sign in | POST | `/staff-auth/password/sign-in` | Active |
| Phone OTP send | POST | `/staff-auth/phone-otp/send` | **410 GONE** |
| Phone OTP verify | POST | `/staff-auth/phone-otp/verify` | **410 GONE** |
| TOTP setup | GET | `/staff-auth/totp/setup` | **410 GONE** |
| TOTP verify | POST | `/staff-auth/totp/verify` | **410 GONE** |

> Остаётся на server actions навсегда. Не мигрируется в Refine.

---

### 17–18. account / billing / settings (контейнеры)

Эти features **не имеют собственных `api.ts`**. Это UI-контейнеры, которые:

- **account** — отображает данные staff-профиля (SSR props). Единственный API-вызов: `PATCH /api/proxy/staff/me` (displayName).
- **billing** — компонует `SubscriptionsTable`, `MembershipsView`, `StripePricesForm`. Все данные из SSR props.
- **settings** — компонует `AuditLogs`, `CategoriesTable`, `PlatformSettings`. Все данные из SSR props.

---

## Сводная таблица

| # | Ресурс | List pagination | List params | CRUD ops | Domain commands | Permission |
|---|---|---|---|---|---|---|
| 1 | categories | ❌ нет | — | list/get/create/update/delete | — | `TAXONOMY_MANAGE` |
| 2 | countries | ❌ нет | — | list/get/create/update/delete | — | `TAXONOMY_MANAGE` |
| 3 | cities | ❌ нет | — | list/get/create/update/delete | — | `TAXONOMY_MANAGE` |
| 4 | businesses | ✅ page/limit/total | page, limit, status | list/get/update(PATCH) | approve, reject, hide, publish, featured | `BUSINESSES_MODERATE` |
| 5 | cards | ✅ page/limit/total | page, limit, search, status, membershipTier | list/get | reissue, revoke | `CARDS_READ` |
| 6 | introductions | ❌ нет | businessId | list/get | approve, reject, complete | `INTRODUCTIONS_MODERATE` |
| 7 | users | ✅ page/limit/total | page, limit, search, status, membershipTier | list/get | block, unblock, sync-vip | `USERS_READ` |
| 8 | staff | ❌ нет | — | list/get/create | deactivate, pwd-reset, permissions, role | `STAFF_MANAGE` |
| 9 | audit | ✅ page/limit/total | page, limit, action, actorRole, entityType, dateFrom, dateTo | list (read-only) | — | `AUDIT_READ` |
| 10 | subscriptions | ❌ нет | — | list/get | cancel | `SUBSCRIPTIONS_READ` |
| 11 | memberships | ❌ нет | — | list (read-only) | — | `SUBSCRIPTIONS_READ` |
| 12 | stripe-prices | ❌ нет | — | list | bulk update | `STRIPE_PRICES_MANAGE` |
| 13 | admin-config | N/A | key | get/update (per key) | — | `STRIPE_PRICES_MANAGE` |
| 14 | dashboard-metrics | N/A | — | get (singleton) | — | `DASHBOARD_METRICS_READ` |
| 15 | finance-metrics | N/A | — | get (singleton) | — | `FINANCE_METRICS_READ` |
| 16 | staff-auth | N/A | — | — | auth lifecycle | нет (pre-auth) |

---

## Расхождения, требующие нормализации (вход для шага 7)

### Критичные для dataProvider

1. **introductions: нет пагинации.** Единственный list-ресурс без `meta.total` среди "больших списков". dataProvider.getList должен возвращать `total` — придётся либо добавить пагинацию на сервере, либо хардкодить `total: data.length` в dataProvider.

2. **subscriptions: нет пагинации.** Аналогично — нет `meta.total`, нет page/limit.

3. **staff: нет пагинации.** Нет query-параметров вообще.

4. **Taxonomy (categories/countries/cities): нет пагинации.** Допустимо — это малые справочники. dataProvider может вернуть `total: data.length`.

### Баги

5. **audit: `actorStaffId` не парсится сервером.** Клиент отправляет параметр, сервер его игнорирует (нет в `auditLogListSchema`). Нужно либо добавить на сервер, либо убрать из клиента.

### Несогласованности в параметрах

6. **businesses vs cards vs users — разные наборы фильтров:**
   - businesses: `page, limit, status` (нет `search`, нет `membershipTier`)
   - cards: `page, limit, search, status, membershipTier`
   - users: `page, limit, search, status, membershipTier`

   Не блокер для dataProvider (Refine передаёт filters как есть), но стоит отметить.

7. **introductions: `businessId` вытаскивается через `searchParams.get()` вручную**, а не через Zod-схему — нет валидации.

### Не требуют нормализации

- Taxonomy без пагинации — справочники малого размера, ОК.
- dashboard-metrics / finance-metrics — синглтоны, не Refine-ресурсы.
- staff-auth — auth lifecycle, остаётся на server actions.
- admin-config — key-based доступ, не list-ресурс.

---

## Рекомендации для шага 7

**Минимальный scope нормализации:**

1. **introductions** — добавить `page/limit` + `meta: { page, limit, total }` в серверный `GET /introductions`. Это нужно для dataProvider и для UI-пагинации.

2. **audit** — добавить `actorStaffId` в `auditLogListSchema` (или убрать из клиента, если фильтр не нужен).

**Можно отложить:**

3. subscriptions / staff / memberships — малые списки, `total: data.length` в dataProvider достаточно на текущем объёме данных.
4. Добавление `search` в businesses — когда понадобится.

---

## CRUD vs Domain commands: классификация для dataProvider

### Generic CRUD → dataProvider methods

```
getList, getOne, create, update, deleteOne
```

Ресурсы: categories, countries, cities, businesses (list/get/update), cards (list/get), users (list/get), staff (list/get/create), audit (list), subscriptions (list/get), memberships (list), stripe-prices (list).

### Domain commands → useCustomMutation

Все domain commands используют **POST** (кроме staff permissions/role — **PUT**). Не вносить в dataProvider.

| Resource | Command | Method | Path |
|---|---|---|---|
| businesses | approve | POST | `/:id/approve` |
| businesses | reject | POST | `/:id/reject` |
| businesses | hide | POST | `/:id/hide` |
| businesses | publish | POST | `/:id/publish` |
| businesses | featured | POST | `/:id/featured` |
| cards | reissue | POST | `/:id/reissue` |
| cards | revoke | POST | `/:id/revoke` |
| introductions | approve | POST | `/:id/approve` |
| introductions | reject | POST | `/:id/reject` |
| introductions | complete | POST | `/:id/complete` |
| users | block | POST | `/:id/block` |
| users | unblock | POST | `/:id/unblock` |
| users | sync-vip | POST | `/:id/sync-vip` |
| staff | deactivate | POST | `/:id/deactivate` |
| staff | password-reset | POST | `/:id/password-reset` |
| staff | permissions | PUT | `/:id/permissions` |
| staff | role | PUT | `/:id/role` |
| subscriptions | cancel | POST | `/:id/cancel` |
| stripe-prices | bulk update | PUT | `/stripe-prices` |
