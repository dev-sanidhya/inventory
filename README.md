# Inventory Management System

A modern, full-stack inventory management system built with Next.js and Supabase. Easily manage rooms and items, with real-time cloud sync for all users.

## Features
- Add, edit, and delete rooms
- Add, edit, and delete items within rooms
- See total value per room and overall inventory
- All data is stored in the cloud (Supabase) and shared across all users
- Responsive, clean UI with dark mode support

## Tech Stack
- [Next.js](https://nextjs.org/) (App Router)
- [Supabase](https://supabase.com/) (PostgreSQL, Realtime)
- [React](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [next-themes](https://github.com/pacocoursey/next-themes) (dark mode)

## Getting Started

1. **Clone the repository:**
   ```sh
   git clone https://github.com/<your-username>/inventory.git
   cd inventory
   ```

2. **Install dependencies:**
   ```sh
   npm install
   # or
   pnpm install
   ```

3. **Set up Supabase:**
   - Create a free project at [supabase.com](https://supabase.com/)
   - Create `rooms` and `items` tables (see `/lib/supabaseClient.ts` for schema)
   - Enable Row Level Security and add public policies for all operations
   - Get your Supabase project URL and anon key

4. **Configure environment:**
   - Update `lib/supabaseClient.ts` with your Supabase URL and anon key

5. **Run the development server:**
   ```sh
   npm run dev
   # or
   pnpm dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment
- Deploy easily to [Vercel](https://vercel.com/) or [Netlify](https://netlify.com/)
- Set your Supabase URL and anon key as environment variables if needed

## License
MIT 