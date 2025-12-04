# Deployment Guide - Vercel

## Prerequisites
- GitHub account
- Vercel account (free)

## Method 1: Vercel CLI (Fastest)

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy from project directory**
   ```bash
   cd secondguess
   vercel
   ```

4. **Follow prompts:**
   - Set up and deploy? `Y`
   - Which scope? (select your account)
   - Link to existing project? `N`
   - Project name? (press Enter for default)
   - Directory? `./` (press Enter)
   - Override settings? `N`

5. **Set environment variables** (after first deploy)
   ```bash
   vercel env add GEMINI_API_KEY
   vercel env add JWT_SECRET
   # Add other env vars from .env file
   ```

6. **Redeploy with env vars**
   ```bash
   vercel --prod
   ```

## Method 2: GitHub Integration (Recommended for CI/CD)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Import to Vercel**
   - Go to https://vercel.com/new
   - Click "Import Git Repository"
   - Select your GitHub repo
   - Configure:
     - Framework Preset: Other
     - Build Command: `npm run vercel-build`
     - Output Directory: `dist`
     - Install Command: `npm install`

3. **Add Environment Variables**
   - In Vercel dashboard → Settings → Environment Variables
   - Add all variables from your `.env` file:
     - `GEMINI_API_KEY`
     - `JWT_SECRET`
     - `NODE_ENV=production`
     - `SPEECH_PROVIDER=google` (or `mock` for testing)
     - etc.

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Your app will be live at `https://your-project.vercel.app`

## Important Notes

### Environment Variables
Copy these from your `.env` file to Vercel:
- `GEMINI_API_KEY` - Required for AI features
- `JWT_SECRET` - Required for authentication
- `NODE_ENV` - Set to `production`
- `SPEECH_PROVIDER` - Set to `mock` (Google Cloud won't work on serverless)

### Limitations on Vercel Free Tier
- 10 second timeout per function
- No persistent file storage
- Cold starts (first request slower)

### Google Cloud Speech-to-Text
**Won't work on Vercel** because:
- Requires credentials file
- Serverless functions are ephemeral
- Use Web Speech API instead (already working!)

### Database
Currently using in-memory storage. For production:
- Add Redis (Upstash has free tier)
- Or use Vercel KV storage
- Or use external database (MongoDB, PostgreSQL)

## Troubleshooting

### Build fails
- Check build logs in Vercel dashboard
- Ensure all dependencies are in `package.json`
- Verify TypeScript compiles: `npm run build`

### API routes return 404
- Check `vercel.json` routes configuration
- Ensure `dist/index.js` exists after build

### Environment variables not working
- Redeploy after adding env vars
- Check variable names match exactly
- Restart deployment

## Testing Deployment

After deployment, test these endpoints:
- `https://your-app.vercel.app/` - Main page
- `https://your-app.vercel.app/new` - New interface
- `https://your-app.vercel.app/api/monitoring/health` - Health check
- `https://your-app.vercel.app/dashboard` - Dashboard

## Alternative: Railway (If Vercel doesn't work)

Railway is better for traditional server apps:

```bash
npm i -g @railway/cli
railway login
railway init
railway up
```

Railway advantages:
- No serverless limitations
- Persistent storage
- Better for long-running processes
- Free tier: $5/month credit
