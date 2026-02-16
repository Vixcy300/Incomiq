# 🚀 Incomiq - Deployment Guide

## Quick Deploy (5 Minutes)

### Prerequisites
- Supabase account ✅ (configured)
- Railway account (sign up with GitHub)
- Vercel account (sign up with GitHub)
- GitHub repository ✅ (https://github.com/Vixcy300/Incomiq.git)

---

## Step 1: Setup Supabase Database

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. **Run Database Schema:**
   - Go to Supabase Dashboard → SQL Editor
   - Copy content from `backend/schema.sql`
   - Click "Run" to create all tables

---

## Step 2: Deploy Backend to Railway

### A. Connect Railway to GitHub

1. Go to https://railway.app
2. Click "Login" → Sign in with GitHub
3. Click "New Project"
4. Select "Deploy from GitHub repo"
5. Choose: `Vixcy300/Incomiq`
6. Railway will detect Python automatically

### B. Configure Environment Variables

In Railway Dashboard → Your Project → Variables tab, add:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key-here
SUPABASE_SERVICE_KEY=your-service-role-key-here
GROQ_API_KEY=gsk_your-groq-key-here
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-gmail-app-password
```

**⚠️ Important:** Replace all placeholder values with your actual credentials from:
- Supabase: Dashboard → Settings → API
- Groq: https://console.groq.com → API Keys
- Gmail: Generate App Password in Google Account settings

### C. Configure Build Settings

1. Click "Settings"
2. **Root Directory:** Leave empty (railway.toml handles it)
3. **Start Command:** (should auto-detect from railway.toml)
   ```bash
   cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```

### D. Deploy & Get URL

1. Railway will auto-deploy in ~2 minutes
2. Copy your backend URL (e.g., `https://incomiq-production.up.railway.app`)
3. Test: Visit `https://your-backend.railway.app/api/health`
   - Should return: `{"status":"healthy","version":"1.0.0"}`

---

## Step 3: Deploy Frontend to Vercel

### A. Connect Vercel to GitHub

1. Go to https://vercel.com
2. Click "Login" → Sign in with GitHub
3. Click "Add New" → "Project"
4. Import: `Vixcy300/Incomiq`

### B. Configure Build Settings

**Framework Preset:** Vite
**Root Directory:** `frontend`
**Build Command:** `npm run build`
**Output Directory:** `dist`
**Install Command:** `npm install`

### C. Add Environment Variable

In Vercel → Settings → Environment Variables:

```bash
VITE_API_URL=https://your-backend.railway.app
```

⚠️ **Replace with your actual Railway backend URL**

### D. Deploy

1. Click "Deploy"
2. Vercel will build and deploy in ~1-2 minutes
3. Your app will be live at: `https://incomiq.vercel.app` (or similar)

---

## Step 4: Update Backend CORS

After getting Vercel URL, update backend to allow your frontend domain:

1. In Railway Dashboard, add environment variable:
   ```bash
   FRONTEND_URL=https://your-app.vercel.app
   ```

2. Or manually edit `backend/app/main.py` on GitHub and push:
   ```python
   allow_origins=[
       "http://localhost:5173",
       "https://your-app.vercel.app",  # Add your Vercel URL
       "https://incomiq-*.vercel.app",  # Preview deployments
   ],
   ```

---

## Step 5: Verify Deployment

### Test Backend
```bash
curl https://your-backend.railway.app/api/health
# Should return: {"status":"healthy","version":"1.0.0"}
```

### Test Frontend
1. Visit your Vercel URL
2. Click "Sign Up"
3. Create account: `test@example.com` / `password123`
4. Should successfully log in and see dashboard

---

## 🔐 Environment Variables Summary

### Backend (Railway)
| Variable | Value | Required |
|----------|-------|----------|
| SUPABASE_URL | https://your-project.supabase.co | ✅ Yes |
| SUPABASE_KEY | eyJhbGc... (from Supabase Dashboard) | ✅ Yes |
| SUPABASE_SERVICE_KEY | sb_secret_... (from Supabase) | ✅ Yes |
| GROQ_API_KEY | gsk_... (from Groq Console) | ✅ Yes |
| SMTP_HOST | smtp.gmail.com | ✅ Yes |
| SMTP_PORT | 587 | ✅ Yes |
| SMTP_USER | your-email@gmail.com | ✅ Yes |
| SMTP_PASSWORD | your-gmail-app-password | ✅ Yes |

### Frontend (Vercel)
| Variable | Value | Required |
|----------|-------|----------|
| VITE_API_URL | https://your-backend.railway.app | ✅ Yes |

---

## 📊 Cost Estimate

- **Supabase:** FREE (500MB DB, sufficient for MVP)
- **Railway:** $5/month (includes $5 credit)
- **Vercel:** FREE (100GB bandwidth)
- **Groq API:** FREE (30 req/min)
- **Gmail SMTP:** FREE (500 emails/day)

**Total: ~$5/month**

---

## 🔧 Troubleshooting

### Backend won't start on Railway
- Check logs: Railway Dashboard → Deployments → View Logs
- Verify all environment variables are set
- Make sure `requirements.txt` includes `pydantic-settings`

### Frontend can't connect to backend
- Check browser console for errors
- Verify `VITE_API_URL` is set correctly in Vercel
- Check CORS settings in backend

### Database connection fails
- Verify Supabase URL and keys
- Check if schema.sql was run successfully
- Go to Supabase Dashboard → Table Editor to verify tables exist

---

## 🎯 Next Steps After Deployment

1. ✅ Test all features (login, add income, add expense)
2. ✅ Enable Supabase Row Level Security (RLS) for production
3. ✅ Set up custom domain (optional)
4. ✅ Configure email templates
5. ✅ Add monitoring/analytics

---

## 📱 Custom Domains (Optional)

### Add Custom Domain to Vercel
1. Vercel Dashboard → Your Project → Settings → Domains
2. Add domain: `incomiq.yourdomain.com`
3. Update DNS records as instructed

### Add Custom Domain to Railway
1. Railway Dashboard → Settings → Networking
2. Add custom domain
3. Update DNS CNAME record

---

## 🚨 Important Security Notes

1. ✅ Never commit `.env` file to GitHub (already in .gitignore)
2. ✅ Use Service Role Key only on backend
3. ✅ Enable Supabase RLS policies before going public
4. ✅ Rotate API keys if accidentally exposed
5. ✅ Enable 2FA on all service accounts

---

## Support

- **Backend URL:** https://your-backend.railway.app
- **Frontend URL:** https://your-app.vercel.app
- **Database:** Check your Supabase Dashboard

Happy deploying! 🎉
