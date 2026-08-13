# Music & Coffee Shop API

API for a shop that combines music (CDs, vinyl, band posters, t-shirts, mugs) and a coffee shop (coffee, tea) in a single catalog. Supports registration/login, building a cart and placing orders.

Stack: TypeScript, Fastify, Zod, Prisma, PostgreSQL, Swagger, Docker.

## Running with Docker (recommended)

```bash
docker compose up --build
```

This starts Postgres, applies migrations and runs the seed automatically. The API is available at `http://localhost:3000` and the Swagger docs at `http://localhost:3000/docs`.

Users created by the seed:
- Admin: `admin@musicandcoffee.com` / `admin123`
- Customer: `customer@example.com` / `customer123`

> The compose Postgres is exposed on host port `5434` (the container itself still listens on `5432`) to avoid clashing with other local databases.

## Running locally without Docker

1. `cp .env.example .env` and adjust `DATABASE_URL` if needed.
2. Start a Postgres instance (you can use `docker compose up postgres`).
3. `npm install`
4. `npm run prisma:migrate` (first time) or `npm run prisma:deploy`
5. `npm run prisma:seed`
6. `npm run dev`

## Scripts

- `npm run dev` — dev server in watch mode
- `npm run build` / `npm start` — build and run in production
- `npm run typecheck` — type checking
- `npm run prisma:studio` — opens Prisma Studio
- `npm test` — runs the automated API test suite (see below)

## Automated tests

The `tests/` folder holds two API test suites that share the same route paths (`tests/selectors/endpoints.ts`) and payload builders (`tests/fixtures/`), so both suites test the exact same scenarios through different transports:

- **Vitest suite** (`tests/*.spec.ts`, POM in `tests/api/pom/`) — drives the app in-process via Fastify's `inject()`, no HTTP port needed. Fastest option, good for local development.
- **Playwright suite** (`tests/playwright/`, POM in `tests/playwright/pom/`) — drives a real running instance of the API over HTTP (Playwright's `webServer` boots it automatically), closer to how the API is actually consumed.

Both suites share the same structure:

- **Page Object Model** — one class per resource (`AuthApi`, `ProductsApi`, `CartApi`, `OrderApi`, ...), each wrapping the HTTP calls for that resource, extending a shared `BaseApi`.
- **Reusable selector dictionary** (`tests/selectors/endpoints.ts`) — every route path lives in one place and is consumed by all Page Objects in both suites.
- **Fixtures** (`tests/fixtures/`) — builders for valid request payloads (users, categories, products) so each test can override just the field it cares about.
- **Hooks** (`beforeAll`/`beforeEach`/`afterAll`) — shared setup (fresh customer/product per test) instead of repeating it in every test.
- **`describe()` blocks** grouping tests by resource and then by endpoint.
- Both **positive and negative scenarios** per endpoint, always asserting the HTTP status code **and** the message returned by the API.

Both suites run against a real, isolated Postgres database — not mocks.

To run them:

```bash
docker compose up -d postgres-test   # starts the isolated test database (first time only)
npm test                             # Vitest: applies migrations + seed, then runs the suite
npm run test:playwright              # Playwright: applies migrations + seed, boots the API, then runs the suite
```

Both scripts are safe to re-run — migrations and the seed are idempotent. Use `npm run test:watch` during development on the Vitest suite.

## Endpoints overview

- `POST /auth/register`, `POST /auth/login`
- `GET /users/me` (authenticated)
- `GET|POST|PATCH|DELETE /categories` (write restricted to admin)
- `GET|POST|PATCH|DELETE /products` (write restricted to admin; listing supports `category`, `search`, `page`, `limit` filters)
- `GET /cart`, `POST /cart/items`, `PATCH /cart/items/:productId`, `DELETE /cart/items/:productId`, `DELETE /cart` (authenticated)
- `POST /orders` (checkout from cart), `GET /orders`, `GET /orders/:id`, `PATCH /orders/:id/status` (status update restricted to admin)

Full request/response details are available in Swagger (`/docs`).
