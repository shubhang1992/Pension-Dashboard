# Pension Dashboard (India)

Internal web dashboard to track Indian pension market data, built with Next.js, TypeScript, Tailwind CSS, Prisma, PostgreSQL, and Recharts.

## Getting Started

1. Install dependencies:

   ```bash
   npm install next@latest react@latest react-dom@latest
   npm install -D typescript@latest @types/node@latest @types/react@latest @types/react-dom@latest
   npm install tailwindcss@latest postcss@latest autoprefixer@latest
   npm install prisma@latest @prisma/client@latest
   npm install recharts@latest
   npm install -D eslint@latest eslint-config-next@latest
   ```

2. Initialize Tailwind CSS (already wired in config files here).

3. Ensure PostgreSQL is running locally and that the `DATABASE_URL` in `.env` points to a valid database.

4. Generate the Prisma client:

   ```bash
   npx prisma generate
   ```

5. Run the development server:

   ```bash
   npm run dev
   ```

6. Open http://localhost:3000 in your browser.

### Ask the reports (optional)

To enable natural-language questions over the dashboard data (e.g. “What is the total AUM?”, “How many subscribers in Maharashtra?”), set `OPENAI_API_KEY` in your `.env`. The **Ask the reports** button in the header opens a chat panel; answers are grounded in your actual PFRDA data (M1, A22, A6, M7). Without the key, the button still works but will prompt you to configure it.

