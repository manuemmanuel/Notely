# Quick Setup Guide

## Prerequisites
- Node.js 18+ installed
- A Supabase account (free tier works)

## Step-by-Step Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be fully provisioned (takes ~2 minutes)

### 3. Set Up Database
1. In your Supabase project, go to **SQL Editor**
2. Click **New Query**
3. Copy and paste the contents of `supabase/migrations/001_initial_schema.sql`
4. Click **Run** to execute the SQL

### 4. Get API Credentials
1. In Supabase, go to **Settings** → **API**
2. Copy the following:
   - **Project URL** (under "Project URL")
   - **anon/public key** (under "Project API keys")

### 5. Configure Environment Variables
1. Create a `.env.local` file in the project root:
```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

2. Replace the placeholder values with your actual Supabase credentials

### 6. Enable Realtime (Important!)
1. In Supabase, go to **Database** → **Replication**
2. Find the `notes` table
3. Toggle **Realtime** to enabled (if not already enabled)

### 7. Run the App
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Testing Real-Time Collaboration

1. Open the app in two different browser windows (or incognito + regular)
2. Create a new note in one window
3. Start typing in the note
4. In the second window, navigate to the same note
5. Type in the second window - you should see updates appear in real-time in the first window!

## Troubleshooting

### "Supabase credentials not found" warning
- Make sure `.env.local` exists and has the correct variable names
- Restart the dev server after creating/updating `.env.local`

### Real-time updates not working
- Verify Realtime is enabled for the `notes` table in Supabase
- Check browser console for WebSocket connection errors
- Ensure your Supabase project is active (not paused)

### Editor not loading
- Check that all dependencies are installed: `npm install`
- Clear browser cache and restart dev server

### Database errors
- Verify the SQL migration ran successfully
- Check Supabase dashboard → Database → Tables to see if `notes` and `note_versions` exist

## Next Steps

- Read the full [README.md](./README.md) for architecture details
- Customize the UI with HeroUI themes
- Add authentication if needed (Supabase Auth)
- Deploy to Vercel for production use

