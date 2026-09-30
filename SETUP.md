# Step Squad — setup

Two parts: **1)** a free shared database (Supabase), **2)** a free live URL (Vercel).
Both take about 10 minutes total. Do them once; after that you just use the site.

Until you do part 1, the app still works — it just saves to whichever phone is
using it, instead of one shared database everyone sees.

## 1. The shared database (Supabase) — ~5 min

1. Go to [supabase.com](https://supabase.com) → **Start your project** → sign in with GitHub or Google.
2. **New project** — name it `step-squad`, pick any password (you won't need it again), pick a region near India, click **Create**. Wait ~2 min for it to spin up.
3. In the left sidebar: **SQL Editor** → **New query**.
4. Open [`supabase/schema.sql`](supabase/schema.sql) from this folder, copy the whole file, paste it in, click **Run**.
   - This creates the two tables, seeds the squad's names, turns on live sync, and sets up screenshot storage.
5. Left sidebar → **Project Settings** → **API**. You need two values:
   - **Project URL**
   - **anon public** key
6. In this project folder, copy `.env.example` to `.env.local` and paste those two values in.

```
cp .env.example .env.local
```

That's it for the database — every phone that loads the deployed site now reads/writes the same data.

## 2. Going live (Vercel) — ~5 min

The easiest path is GitHub → Vercel, so it also auto-deploys forever after (push a change, site updates itself).

1. Create a free GitHub repo and push this folder to it:
   ```
   git init
   git add .
   git commit -m "Step Squad"
   git branch -M main
   git remote add origin <your-repo-url>
   git push -u origin main
   ```
2. Go to [vercel.com](https://vercel.com) → sign in with GitHub → **Add New → Project** → pick this repo → **Import**.
3. Before deploying, expand **Environment Variables** and add the same two values from `.env.local`:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. **Deploy**. In ~1 minute you get a URL like `step-squad.vercel.app`.
5. Send that link to the group. Everyone taps it, picks their name once, and can add it to their phone's home screen (Share → Add to Home Screen) so it feels like an app.

## Daily use

- **Everybody**: open the site → **Today** tab → tap your name → type steps → optionally attach a screenshot → Save.
- The **Today** tab also has a **Yesterday** toggle, so logging a day you forgot the night before takes one tap — no need to dig into the Enter tab for it.
- **You (fast entry for everyone)**: **Enter** tab → type each person's number → Tab/Enter to move down the list → **Save all**. Or paste lines straight from the group chat ("Delilah 8200, Rasika 5400...") into the paste box and it'll fill the grid for you to double check before saving.
- The **Enter** tab has a date picker and "Needs filling" chips, so backfilling a day you missed takes seconds.
- **Board** shows the leaderboard (all-time / last 7 / today). **Trends** shows the points race, a streak grid per person, and squad-wide stats.
- The day rolls over automatically at midnight IST — no refresh needed.

## The rules, as built

Everyday count — nothing below 8,000.

| Steps | Points |
|---|---|
| Under 8,000 | 0 |
| 8,000+ | 10 |
| 10,000+ | 15 |
| 12,000+ | 20 |

Bonus: **+10** to whoever logs the most total steps in a calendar month (Oct, Nov, Dec each pay
out separately). Ties get the bonus too.

Challenge window: **Oct 1 – Dec 29, 2026** (90 days), day boundary at midnight IST.
