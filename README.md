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

## Endpoints overview

- `POST /auth/register`, `POST /auth/login`
- `GET /users/me` (authenticated)
- `GET|POST|PATCH|DELETE /categories` (write restricted to admin)
- `GET|POST|PATCH|DELETE /products` (write restricted to admin; listing supports `category`, `search`, `page`, `limit` filters)
- `GET /cart`, `POST /cart/items`, `PATCH /cart/items/:productId`, `DELETE /cart/items/:productId`, `DELETE /cart` (authenticated)
- `POST /orders` (checkout from cart), `GET /orders`, `GET /orders/:id`, `PATCH /orders/:id/status` (status update restricted to admin)

Full request/response details are available in Swagger (`/docs`).
