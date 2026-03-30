This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Docker (Recommended Local Setup)

1. Start app + Postgres (schema auto-applies on first boot):

```bash
docker compose up --build -d
```

2. Open the app:

- [http://localhost:3000](http://localhost:3000)

3. Stop everything:

```bash
docker compose down
```

To also remove Postgres data volume:

```bash
docker compose down -v
```

Note: Postgres init scripts in `docker-entrypoint-initdb.d/` only run when the database volume is empty.
If you change `db/schema.sql` and want it to re-apply, run `docker compose down -v` and start again.

## Local Non-Docker Setup

1. Install dependencies:

```bash
npm install
```

2. Set environment variables in `.env.local`:

```bash
DATABASE_URL=postgres://USER:PASSWORD@HOST:5432/DB_NAME
TEMP_OWNER_ID=local-dev-owner
```

3. Create the database schema:

```bash
psql "$DATABASE_URL" -f db/schema.sql
```

4. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
