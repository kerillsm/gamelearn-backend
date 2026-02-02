# Copilot Instructions for gamelearn-backend

## Build & Run Commands

```bash
# Development (HTTPS with local certs)
yarn dev

# Build
yarn build

# Production start (runs migrations first)
yarn start

# Database migrations
npx prisma migrate dev          # Create/apply migrations in dev
npx prisma migrate deploy       # Apply migrations in production
npx prisma generate             # Regenerate Prisma client
```

## Architecture

This is a Koa.js REST API backend for a gaming mentorship platform, using Prisma with PostgreSQL.

### Project Structure

```
src/
├── routes/           # Koa Router definitions - mount controllers to HTTP endpoints
├── controllers/      # Each controller is a folder with index.ts + controller.ts
├── services/
│   ├── in/          # Business logic services (write operations, complex flows)
│   └── out/         # Data access services (direct Prisma queries, simple reads)
├── lib/
│   ├── decorators/  # Method decorators (@AuthRequired, @Validate)
│   ├── middleware/  # Koa middleware (auth, error handling)
│   ├── formatters/  # HttpError class and utilities
│   ├── orm/         # Prisma client singleton
│   └── config/      # Environment helpers (getSafeEnv)
└── config/          # App configuration (appConfig.ts)
```

### Service Layer Pattern

- **`services/out/`**: Thin data-access wrappers around Prisma. Named after entities (e.g., `user.service.ts`, `mentorProfile.service/`).
- **`services/in/`**: Business logic services for specific use cases. Named descriptively (e.g., `upsert-mentor-profile.service/`, `authorize-user.service/`).

Services in `in/` may have their own folder containing:
- `*.service.ts` - Main service class
- `*.dto.ts` - Data transfer object interface
- Utility files specific to that service

### Controller Pattern

Controllers are static class methods decorated with:
- `@AuthRequired()` - Requires authenticated user (checks `ctx.state.user`)
- `@Validate(JoiSchema)` - Validates `ctx.request.body` against Joi schema

```typescript
export class UserController {
  @AuthRequired()
  @Validate(Joi.object({ name: Joi.string().optional() }))
  static async updateCurrentUser(ctx: Context) {
    const user = ctx.state.user!;
    // ...
  }
}
```

### Key Conventions

- Use `HttpError` class for throwing HTTP errors: `throw new HttpError(404, "Not found")`
- Access authenticated user via `ctx.state.user`
- Environment variables are accessed via `getSafeEnv()` which throws if undefined
- All timestamps use `@db.Timestamptz` in Prisma schema
- Prisma uses the pg adapter (`@prisma/adapter-pg`) for PostgreSQL
