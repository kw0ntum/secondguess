# Netlify Quick Start - 3 Methods

## ⚡ Method 1: CLI (Fastest - 5 minutes)

```bash
# 1. Setup
npm install -g netlify-cli
cd secondguess
npm run setup-netlify.bat  # Windows
# or
bash setup-netlify.sh      # Mac/Linux

# 2. Login & Deploy
netlify login
netlify init
netlify env:set GEMINI_API_KEY "your-gemini-key"
netlify env:set JWT_SECRET "any-random-string"
netlify deploy --prod

# Done! Your site is live 🎉
```

## 🔗 Method 2: GitHub (Best for CI/CD)

```bash
# 1. Push to GitHub
git add .
git commit -m "Add Netlify support"
git push origin main

# 2. Go to Netlify
# - Visit: https://app.netlify.com/
# - Click: "Add new site" → "Import from Git"
# - Select your repo
# - Build settings:
#   - Build command: npm run build
#   - Publish directory: public
#   - Functions directory: netlify/functions

# 3. Add environment variables in Netlify dashboard
# - GEMINI_API_KEY
# - JWT_SECRET

# Done! Auto-deploys on every push 🚀
```

## 🖱️ Method 3: Drag & Drop (No Git Required)

```bash
# 1. Build locally
cd secondguess
npm install
cd netlify/functions && npm install && cd ../..

# 2. Go to Netlify Drop
# Visit: https://app.netlify.com/drop

# 3. Drag the entire 'secondguess' folder

# 4. Add environment variables after deployment
# - Go to Site settings → Environment variables
# - Add GEMINI_API_KEY and JWT_SECRET
# - Trigger redeploy

# Done! 🎊
```

## 🔑 Required Environment Variables

```bash
GEMINI_API_KEY=your-gemini-api-key-here
JWT_SECRET=any-random-string-like-abc123xyz
NODE_ENV=production
```

## ✅ Test Your Deployment

After deployment, visit:
- `https://your-site.netlify.app/new` - Main app
- `https://your-site.netlify.app/api/auth/guest` - Test API

## 🆘 Troubleshooting

**Build fails?**
- Check you ran `npm install` in both root and `netlify/functions`

**Functions return errors?**
- Verify environment variables are set in Netlify dashboard
- Check function logs in Netlify dashboard

**Voice recording doesn't work?**
- Netlify provides HTTPS automatically, so it should work
- Check browser console for errors

## 📊 What You Get (Free Tier)

- ✅ 100GB bandwidth/month
- ✅ 125,000 function requests/month
- ✅ Automatic HTTPS
- ✅ CDN (fast worldwide)
- ✅ Continuous deployment from Git

## 🎯 Recommended: Method 2 (GitHub)

Why? Because:
- Auto-deploys on every push
- Easy rollbacks
- Preview deployments for branches
- Team collaboration
- Free SSL certificates

Choose the method that works best for you!
