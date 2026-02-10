# 🚀 Deployment Guide - Productivity Quest

This guide will help you deploy your game to Render (backend) and Vercel (frontend) so you can play it on your iPhone!

## Prerequisites
- GitHub account (free)
- Render account (free tier)
- Vercel account (free tier)
- Your Anthropic API key

---

## Step 1: Push Code to GitHub

1. **Initialize git** (if not already done):
   ```bash
   cd c:\Sites\Game\productivity-game
   git init
   ```

2. **Add all files**:
   ```bash
   git add .
   ```

3. **Commit**:
   ```bash
   git commit -m "Initial commit - Productivity Quest game"
   ```

4. **Create a new repository on GitHub**:
   - Go to https://github.com/new
   - Name it `productivity-quest`
   - Don't initialize with README (we already have code)
   - Click "Create repository"

5. **Push to GitHub**:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/productivity-quest.git
   git branch -M main
   git push -u origin main
   ```

---

## Step 2: Deploy Backend to Render

1. **Go to Render**: https://render.com/
   - Sign up/login (free account)

2. **Click "New +" → "Web Service"**

3. **Connect your GitHub repository**:
   - Select `productivity-quest`

4. **Configure the service**:
   - **Name**: `productivity-quest-api`
   - **Region**: Choose closest to you (e.g., Oregon for West Coast)
   - **Branch**: `main`
   - **Root Directory**: leave blank
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Plan**: **Free** (important!)

5. **Add Environment Variable**:
   - Click "Advanced"
   - Add environment variable:
     - **Key**: `ANTHROPIC_API_KEY`
     - **Value**: `your-api-key-here` (paste your actual key)

6. **Click "Create Web Service"**

7. **Wait for deployment** (2-5 minutes)
   - It will show you a URL like: `https://productivity-quest-api.onrender.com`
   - **Copy this URL** - you'll need it!

---

## Step 3: Deploy Frontend to Vercel

1. **Update the config file** with your Render backend URL:
   - Open `src/config.js`
   - Replace `'https://your-backend.onrender.com'` with your actual Render URL from Step 2

2. **Commit the change**:
   ```bash
   git add src/config.js
   git commit -m "Update API URL for production"
   git push
   ```

3. **Go to Vercel**: https://vercel.com/
   - Sign up/login with GitHub (free account)

4. **Click "Add New" → "Project"**

5. **Import your repository**:
   - Find `productivity-quest`
   - Click "Import"

6. **Configure project**:
   - **Framework Preset**: Vite
   - **Root Directory**: leave blank
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - Leave everything else as default

7. **Click "Deploy"**

8. **Wait for deployment** (1-2 minutes)
   - You'll get a URL like: `https://productivity-quest.vercel.app`

---

## Step 4: Test on Your iPhone! 📱

1. **Open Safari on your iPhone**

2. **Go to your Vercel URL**: `https://productivity-quest.vercel.app`

3. **Add to Home Screen** (optional but recommended):
   - Tap the Share button
   - Scroll down and tap "Add to Home Screen"
   - Now it works like a real app!

4. **Test the game**:
   - ✅ Drag your finger to move
   - ✅ Tap the Task Master NPC
   - ✅ Submit a task description
   - ✅ Get a verification request from Claude
   - ✅ **Take a photo** with your camera (this is the key feature!)
   - ✅ Get XP and level up!

---

## Troubleshooting

### "Failed to generate verification"
- Check Render logs: Go to your Render dashboard → Logs
- Make sure ANTHROPIC_API_KEY is set correctly
- Make sure you have API credits ($5)

### Camera doesn't open on iPhone
- Make sure you're using HTTPS (Vercel provides this automatically)
- Check Safari permissions: Settings → Safari → Camera

### Game doesn't load
- Check browser console for errors (Safari → Develop → Show JavaScript Console)
- Make sure the API URL in `src/config.js` matches your Render URL

### Backend sleeping (slow first request)
- Render free tier sleeps after 15 minutes of inactivity
- First request might take 30-60 seconds to wake up
- Subsequent requests will be fast

---

## Cost Breakdown 💰

- **Render**: FREE (500 hours/month)
- **Vercel**: FREE (unlimited)
- **Claude API**: ~$0.01-0.10 per task submission
- **Your $5 credit**: Should last for 50-500 tasks!

---

## Next Steps

Once it's working on your iPhone, you can:

1. **Share with friends**: Just send them the Vercel URL!
2. **Add more features**: Pixel art, combat, raids, etc.
3. **Convert to native app**: Use Capacitor or React Native later
4. **Add PWA features**: Offline support, notifications, etc.

---

## Need Help?

If something goes wrong, check:
1. Render logs (backend errors)
2. Browser console (frontend errors)
3. Make sure both deployments succeeded
4. Verify environment variables are set

Good luck! 🎮✨
