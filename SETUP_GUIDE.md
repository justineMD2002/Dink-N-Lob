# Supabase Setup Guide

This guide will walk you through setting up Supabase for your pickleball booking system.

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in:
   - **Name**: `pickleball-booking` (or your preferred name)
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Choose closest to your location
5. Click "Create new project" (wait 2-3 minutes for setup)

## Step 2: Get Your API Keys

1. In your project dashboard, click "Project Settings" (gear icon)
2. Click "API" in the sidebar
3. Copy these values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: Long string starting with `eyJ...`

4. Add them to your `.env` file:
   ```env
   NEXT_PUBLIC_SUPABASE_URL="https://xxxxx.supabase.co"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
   ```

## Step 3: Run Database Schema

1. In Supabase dashboard, click "SQL Editor" (in sidebar)
2. Click "New query"
3. Open `supabase-schema.sql` from your project
4. Copy ALL the SQL code
5. Paste it into the SQL Editor
6. Click "Run" (or press Ctrl/Cmd + Enter)
7. You should see "Success. No rows returned"

This creates all your tables:
- `admin_users` - Admin accounts (linked to Supabase Auth)
- `courts` - Your pickleball courts (2 sample courts created)
- `bookings` - Customer bookings
- `payments` - Payment verification records
- `settings` - App configuration

## Step 4: Create Your First Admin User

### 4.1 Create Auth User
1. In Supabase dashboard, click "Authentication" (in sidebar)
2. Click "Users" tab
3. Click "Add User" button (top right)
4. Enter:
   - **Email**: Your admin email (e.g., `admin@yourdomain.com`)
   - **Password**: Create a strong password
   - Leave "Auto Confirm User" checked
5. Click "Create User"

### 4.2 Link to Admin Table
1. You'll see your new user in the list
2. Click on the user row to expand it
3. Copy the `id` (UUID) - it looks like: `a1b2c3d4-e5f6-...`
4. Go back to "SQL Editor"
5. Create a new query and run:
   ```sql
   INSERT INTO admin_users (user_id, name)
   VALUES ('paste-your-uuid-here', 'Your Name');
   ```
   Replace `paste-your-uuid-here` with the UUID you copied
6. Click "Run"

Done! You can now log in to the admin panel with the email/password you created.

## Step 5: Configure Email (Optional but Recommended)

By default, Supabase sends emails from their domain. To use your own:

1. Go to "Authentication" > "Email Templates"
2. Customize confirmation, reset password, and magic link templates
3. Go to "Settings" > "Authentication"
4. Configure SMTP settings with your email provider

## Step 6: Test Admin Login

1. Start your dev server: `npm run dev`
2. Go to: [http://localhost:3000/admin/login](http://localhost:3000/admin/login)
3. Enter your admin email and password
4. You should be redirected to the admin dashboard

## Troubleshooting

### "You do not have admin access"
- Make sure you ran the INSERT query in Step 4.2
- Check that the UUID matches the user ID in Authentication > Users
- Verify in Table Editor > admin_users that your record exists

### "Invalid login credentials"
- Check email and password are correct
- Verify user was created in Authentication > Users
- Make sure user is confirmed (green checkmark)

### SQL errors when running schema
- If types already exist, the schema will drop and recreate them
- If you get foreign key errors, make sure you're running the FULL schema, not parts of it

### Can't sign in after creating user
- Go to Authentication > Users
- Find your user and click the "..." menu
- Select "Send verification email" if needed
- Or manually confirm the user

## Next Steps

1. ✅ Database setup complete
2. ✅ Admin user created
3. 🔄 Configure e-wallet QR codes in `.env`
4. 🔄 Build out booking calendar functionality
5. 🔄 Implement payment verification UI
6. 🔄 Add reports and analytics

## Security Notes

- Never commit your `.env` file
- Use environment variables in production (Vercel, etc.)
- The `anon` key is safe to expose in client-side code
- Keep your database password and service role key private
- Supabase Auth handles password hashing and security automatically

## Useful Supabase Features

- **Table Editor**: View and edit data visually
- **Database** > **Backups**: Automatic daily backups on paid plans
- **Logs**: See all queries and errors
- **API Docs**: Auto-generated API documentation for your tables
