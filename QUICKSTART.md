# ⚡ Quick Deploy - Incomiq

## 🎯 What You Need (Already Have ✅)

1. ✅ GitHub Repository: https://github.com/Vixcy300/Incomiq.git
2. ✅ Supabase Account + Database
3. ✅ All API Keys (Supabase, Groq, Gmail)

## Step 1: Deploy Backend to Railway (3 minutes)

### A. Sign Up & Connect
1. Go to **https://railway.app**
2. Click "Login" → Choose "Login with GitHub"
3. Authorize Railway to access your GitHub

### B. Create New Project
1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose: **Vixcy300/Incomiq**
4. Railway auto-detects Python using `nixpacks.toml` config

**⚠️ If Build Fails with "pip: command not found":**
- Go to **Settings** → Set **Root Directory** to `backend`
- Click **"Redeploy"** at the top

### C. Add Environment Variables
1. Click on your service/project card
2. Click **"Variables"** tab
3. Click **"+ New Variable"** and add EACH ONE from your `backend/.env` file:

**📋 Copy these from your local `backend/.env` file:**
```
SUPABASE_URL=<from your backend/.env>
SUPABASE_KEY=<from your backend/.env>
SUPABASE_SERVICE_KEY=<from your backend/.env>
GROQ_API_KEY=<from your backend/.env>
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=<your email from backend/.env>
SMTP_PASSWORD=<your gmail app password from backend/.env>
```

**💡 Tip:** Open your local `backend/.env` file and copy-paste each value into Railway.

### D. Get Your Backend URL
1. Wait 1-2 minutes for deployment
2. Click **"Settings"** → **"Networking"**
3. Copy the public URL (looks like: `https://incomiq-production-xxxx.up.railway.app`)
4. **SAVE THIS URL** - you'll need it for Vercel!

### E. Test Backend
Open in browser: `https://your-backend-url.railway.app/api/health`

Should show:
```json
{"status":"healthy","version":"1.0.0"}
```

✅ **Backend is LIVE!**

---

## Step 2: Deploy Frontend to Vercel (2 minutes)

### A. Sign Up & Connect
1. Go to **https://vercel.com**
2. Click "Sign Up" → Choose "Continue with GitHub"
3. Authorize Vercel to access your GitHub

### B. Import Project
1. Click **"Add New..."** → **"Project"**
2. Find and click **"Import"** next to `Vixcy300/Incomiq`
3. If you don't see it, click "Adjust GitHub App Permissions" and grant access

### C. Configure Build Settings
Vercel auto-detects most settings. Verify these:

- **Framework Preset:** Vite
- **Root Directory:** `frontend` ← **IMPORTANT!**
- **Build Command:** `npm run build` (auto-filled)
- **Output Directory:** `dist` (auto-filled)

### D. Add Environment Variable
1. Before clicking Deploy, expand **"Environment Variables"**
2. Add one variable:
   - **Name:** `VITE_API_URL`
   - **Value:** `https://your-backend-url.railway.app` (from Railway Step D)
   - Click "Add"

### E. Deploy
1. Click **"Deploy"**
2. Wait 1-2 minutes (watch the build logs if interested)
3. Once done, you'll see 🎉 **Congratulations!**
4. Click **"Visit"** to open your app

✅ **Frontend is LIVE!**

---

## Step 3: Setup Supabase Database (1 minute)

### A. Run Database Schema
1. Go to **https://supabase.com/dashboard**
2. Select your project
3. Click **"SQL Editor"** in left sidebar
4. Click **"New query"**
5. Go to your local project → Open `backend/schema.sql`
6. **Copy ALL contents** and paste into Supabase SQL Editor
7. Click **"Run"** (or press Ctrl+Enter)
8. Should see: "Success. No rows returned"

### B. Verify Tables Created
1. Click **"Table Editor"** in left sidebar
2. You should see these tables:
   - users
   - incomes
   - expenses
   - rules
   - goals
   - investments

✅ **Database is ready!**

---

## Step 4: Update Backend CORS (30 seconds)

### A. Get Your Vercel Domain
Your app URL will be like: `https://incomiq-xxxx.vercel.app`

### B. Add to Railway
1. Go back to **Railway Dashboard**
2. Click your backend service
3. Click **"Variables"** tab
4. Add new variable:
   - **Name:** `FRONTEND_URL`
   - **Value:** `https://your-app.vercel.app` (your Vercel domain)
5. Save

Railway will auto-redeploy (takes 30 seconds)

---

## 🎉 You're LIVE!

### Test Your App

1. **Open your Vercel URL:** `https://your-app.vercel.app`
2. Click **"Sign Up"**
3. Create account:
   - Email: `test@example.com`
   - Password: `password123`
   - Name: `Test User`
4. You should see the Dashboard!

### Try These Features:
- ✅ Add an income entry
- ✅ Add an expense
- ✅ Check the analytics dashboard
- ✅ Ask AI Chat a question
- ✅ Create a savings goal

---

## 🔧 Troubleshooting

### "Failed to connect to backend"
- Check that VITE_API_URL in Vercel matches your Railway URL
- Verify Railway backend is running (check health endpoint)
- Check browser console for CORS errors

### "Database connection failed"
- Verify you ran schema.sql in Supabase
- Check SUPABASE_URL and keys are correct in Railway

### "Email notifications not working"
- Gmail SMTP password must be an "App Password" (not your regular password)
- Enable 2FA on Gmail first, then generate app password

---

## 📊 Your Deployment Summary

| Service | Status | URL |
|---------|--------|-----|
| **Frontend** | ✅ Vercel | https://your-app.vercel.app |
| **Backend** | ✅ Railway | https://your-backend.railway.app |
| **Database** | ✅ Supabase | Check your Supabase dashboard |

### Monthly Cost: ~$5
- Supabase: FREE (500MB)
- Railway: $5 (includes $5 credit)
- Vercel: FREE (100GB bandwidth)
- Groq API: FREE
- Gmail SMTP: FREE

---

## 🚀 Next Steps

1. ✅ Share your app with friends!
2. ✅ Add custom domain (optional):
   - Vercel: Settings → Domains
   - Railway: Settings → Networking
3. ✅ Enable Supabase Row Level Security (RLS) for production
4. ✅ Monitor usage in Railway/Vercel dashboards
5. ✅ Check analytics to see real user behavior

---

## 📱 Mobile App (Future)

Want to turn this into an Android app with real-time SMS transaction tracking?
- Check out the notes in your project about SMS parsing & Notification Listeners
- Use React Native or Flutter to wrap your web app
- Add notification permissions for UPI tracking

---

## 🆘 Need Help?

- **Railway Docs:** https://docs.railway.app
- **Vercel Docs:** https://vercel.com/docs
- **Supabase Docs:** https://supabase.com/docs

Happy deploying! 🎊
