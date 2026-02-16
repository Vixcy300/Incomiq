# 🚂 Railway Environment Variables Setup Guide

## Step-by-Step: Adding Environment Variables to Railway

### 1. Access Your Railway Project
1. Go to https://railway.app/dashboard
2. Click on your **Incomiq** project
3. Click on your **backend service** (the main card/tile)

---

## 2. Add Environment Variables

### Method A: Add Variables One by One (Recommended for beginners)

1. Click the **"Variables"** tab at the top
2. Click **"+ New Variable"** button
3. Add each variable below:

**📋 Open your local `backend/.env` file and copy each value:**

#### Variable 1: SUPABASE_URL
- **Variable Name:** `SUPABASE_URL`
- **Value:** Copy from your `backend/.env` file
- Click **"Add"**

#### Variable 2: SUPABASE_KEY
- **Variable Name:** `SUPABASE_KEY`
- **Value:** Copy from your `backend/.env` file (long JWT token starting with `eyJh...`)
- Click **"Add"**

#### Variable 3: SUPABASE_SERVICE_KEY
- **Variable Name:** `SUPABASE_SERVICE_KEY`
- **Value:** Copy from your `backend/.env` file (starts with `sb_secret_...`)
- Click **"Add"**

#### Variable 4: GROQ_API_KEY
- **Variable Name:** `GROQ_API_KEY`
- **Value:** Copy from your `backend/.env` file (starts with `gsk_...`)
- Click **"Add"**

#### Variable 5: SMTP_HOST
- **Variable Name:** `SMTP_HOST`
- **Value:** `smtp.gmail.com`
- Click **"Add"**

#### Variable 6: SMTP_PORT
- **Variable Name:** `SMTP_PORT`
- **Value:** `587`
- Click **"Add"**

#### Variable 7: SMTP_USER
- **Variable Name:** `SMTP_USER`
- **Value:** Copy your Gmail address from `backend/.env` file
- Click **"Add"**

#### Variable 8: SMTP_PASSWORD
- **Variable Name:** `SMTP_PASSWORD`
- **Value:** Copy your Gmail App Password from `backend/.env` file
- Click **"Add"**

---

### Method B: Use RAW Editor (Faster for experienced users)

1. In the **Variables** tab, click **"RAW Editor"** (top right)
2. **Open your local `backend/.env` file**
3. **Copy the entire contents** and paste into Railway's RAW Editor
4. Click **"Update Variables"**

**💡 Tip:** This copies all 8 variables at once from your local file!

---

## 3. Railway Will Auto-Deploy

After adding variables:
- Railway automatically detects the changes
- Your backend will **redeploy automatically** (takes ~1-2 minutes)
- Watch the **Deployments** tab to see progress

---

## 4. Verify Deployment

### A. Check Build Logs
1. Go to **"Deployments"** tab
2. Click on the latest deployment
3. Check logs for errors
4. Look for: `INFO: Uvicorn running on http://0.0.0.0:8000`

### B. Get Your Backend URL
1. Go to **"Settings"** tab
2. Scroll to **"Networking"** section
3. Copy your **Public Domain** (looks like: `incomiq-production-xxxx.up.railway.app`)

### C. Test Your Backend
1. Open your browser
2. Go to: `https://your-backend-url.railway.app/api/health`
3. Should see: `{"status":"healthy","version":"1.0.0"}`

✅ **Your backend is LIVE!**

---

## 5. Optional: Add More Variables Later

### Frontend URL (for CORS - add after deploying frontend)
Once you deploy to Vercel, add this variable:

- **Variable Name:** `FRONTEND_URL`
- **Value:** `https://your-app.vercel.app` (your Vercel domain)

### WhatsApp (Optional - if you want WhatsApp notifications)
- **Variable Name:** `GREEN_API_INSTANCE_ID`
- **Value:** `7103515331`

- **Variable Name:** `GREEN_API_TOKEN`
- **Value:** `2262d7e0a9ff4d13986f4340ce78535b11eb6ca5e7d141c3b6`

---

## 🔐 Security Notes

**✅ Safe:** TCopy from your `backend/.env` if you have it

- **Variable Name:** `GREEN_API_TOKEN`
- **Value:** Copy from your `backend/.env` if you have it
**✅ Environment-specific:** Each Railway environment (production/staging) can have different values

**⚠️ Important:** Never commit these values to GitHub!

---

## 🛠️ Troubleshooting

### "Deployment Failed"
- Check the **Deployments** logs for specific errors
- Common issues:
  - Missing `requirements.txt` in backend folder
  - Syntax error in `railway.toml`
  - Python version mismatch

### "Database Connection Error"
- Verify `SUPABASE_URL` is correct
- Check `SUPABASE_SERVICE_KEY` has no extra spaces
- Test Supabase connection in their dashboard

### "Module Not Found"
- Railway might be missing a dependency
- Add it to `backend/requirements.txt`
- Push to GitHub, Railway will auto-redeploy

### "Port Already in Use"
- Railway automatically sets `$PORT` environment variable
- Our app uses it in the start command: `--port $PORT`
- No action needed from you!

---

## 📊 What Each Variable Does

| Variable | Purpose | Where It's Used |
|----------|---------|-----------------|
| `SUPABASE_URL` | Database connection | All database queries |
| `SUPABASE_KEY` | Public API key | Frontend auth, public access |
| `SUPABASE_SERVICE_KEY` | Admin access | Backend admin operations |
| `GROQ_API_KEY` | AI chat | `/api/ai-chat` endpoint |
| `SMTP_HOST` | Email server | Sending notifications |
| `SMTP_PORT` | Email port | Email connection |
| `SMTP_USER` | Email login | Email authentication |
| `SMTP_PASSWORD` | Email password | Email authentication |

---

## 🚀 After Setup

1. **Backend URL:** Copy from Railway Settings → Networking
2. **Use for Vercel:** Set `VITE_API_URL` in Vercel to this URL
3. **Test endpoints:** Try `/api/health`, `/api/auth/demo`

---

## 📱 Quick Reference Commands

### View Current Variables
```bash
# In Railway dashboard → Variables tab → RAW Editor
```

### Update a Variable
```bash
# Click the variable → Edit → Save
# Railway auto-redeploys
```

### Delete a Variable
```bash
# Click the X next to the variable
# Confirm deletion
```

---

## ✅ Checklist

Before moving to Vercel deployment:

- [ ] All 8 variables added to Railway
- [ ] Deployment succeeded (check Deployments tab)
- [ ] Backend URL copied (from Settings → Networking)
- [ ] Health check returns `{"status":"healthy"}`
- [ ] Ready to deploy frontend to Vercel!

---

**Next Step:** Deploy your frontend to Vercel using your Railway backend URL!

Need help? Check [QUICKSTART.md](QUICKSTART.md) for the complete deployment flow.
