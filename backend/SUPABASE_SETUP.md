# Supabase Setup Guide

## Step 1: Create Supabase Account

1. Go to **https://supabase.com**
2. Click **"Start your project"**
3. Sign up with GitHub (recommended) or email
4. No credit card required ✅

## Step 2: Create New Project

1. Click **"New Project"**
2. Fill in:
   - **Name**: `pdftolink` (or whatever you prefer)
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose closest to your users (e.g., `us-east-1`, `eu-west-1`)
   - **Pricing Plan**: Free (sufficient for now)
3. Click **"Create new project"**
4. Wait ~2 minutes for provisioning

## Step 3: Get Database Connection String

1. In your project dashboard, click **"Settings"** (gear icon in sidebar)
2. Click **"Database"**
3. Scroll to **"Connection string"**
4. Select **"URI"** tab
5. Copy the connection string - it looks like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres
   ```
6. **Important**: Replace `[YOUR-PASSWORD]` with the actual password from Step 2

## Step 4: Configure Backend

1. Open `backend/.env` (create if doesn't exist)
2. Add this line with your actual connection string:
   ```bash
   DATABASE_URL="postgresql://postgres:YOUR_ACTUAL_PASSWORD@db.xxx.supabase.co:5432/postgres"
   ```
3. Save the file

## Step 5: Run Database Migration

```bash
cd backend
npm run db:generate    # Generate Prisma client
npm run db:migrate     # Create tables
```

When prompted for migration name, enter: `init`

## Step 6: Verify Setup

```bash
# Open Prisma Studio (visual database editor)
npm run db:studio
```

You should see:
- `documents` table
- `users` table  
- `analytics_events` table
- `page_stats` table

## Step 7: Test Connection

```bash
# Start the backend server
npm run dev
```

Server should start without database errors ✅

---

## Troubleshooting

**Error: "Can't reach database server"**
- Check your internet connection
- Verify DATABASE_URL is correct
- Make sure you replaced `[YOUR-PASSWORD]`

**Error: "Authentication failed"**
- Double-check your database password
- Copy connection string again from Supabase dashboard

**Error: "Migration failed"**
- Run `npm run db:generate` first
- Check if `.env` file exists in `backend/` directory

---

## Next Steps After Setup

Once migration succeeds:
1. ✅ Database tables created
2. Update `src/store.js` to use Prisma instead of Maps
3. Test uploads with real database
4. Deploy!

---

**Need help?** Let me know what step you're on and any error messages!
