# Netlify Deployment Guide

## What I've Set Up For You

I've converted your Express backend to **Netlify Functions** so your app can run on Netlify!

### Files Created:
```
secondguess/
├── netlify.toml                          # Netlify configuration
├── netlify/functions/
│   ├── package.json                      # Function dependencies
│   ├── auth-guest.ts                     # Authentication
│   ├── sessions.ts                       # Session management
│   ├── conversation-input.ts             # AI conversations (Gemini)
│   └── logs.ts                           # API logging
└── public/                               # Your frontend (unchanged)
```

## How It Works

**Before (Express):**
```
User → Express Server → Routes → Controllers
```

**Now (Netlify):**
```
User → Netlify CDN → Serverless Functions → Response
```

Each API endpoint is now a separate serverless function:
- `/api/auth/guest` → `netlify/functions/auth-guest.ts`
- `/api/sessions` → `netlify/functions/sessions.ts`
- `/api/conversations/:id/input` → `netlify/functions/conversation-input.ts`
- `/api/logs` → `netlify/functions/logs.ts`

## Deployment Steps

### Method 1: Netlify CLI (Recommended)

1. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify**
   ```bash
   netlify login
   ```

3. **Initialize project**
   ```bash
   cd secondguess
   netlify init
   ```

4. **Follow prompts:**
   - Create & configure a new site? `Yes`
   - Team: (select your team)
   - Site name: (choose a name, e.g., `my-sop-agent`)
   - Build command: `npm run build`
   - Directory to deploy: `public`
   - Netlify functions folder: `netlify/functions`

5. **Set environment variables**
   ```bash
   netlify env:set GEMINI_API_KEY "your-gemini-api-key"
   netlify env:set JWT_SECRET "your-jwt-secret"
   netlify env:set NODE_ENV "production"
   ```

6. **Deploy**
   ```bash
   netlify deploy --prod
   ```

### Method 2: GitHub Integration

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Add Netlify Functions"
   git push origin main
   ```

2. **Connect to Netlify**
   - Go to https://app.netlify.com/
   - Click "Add new site" → "Import an existing project"
   - Choose GitHub and select your repository
   - Configure build settings:
     - **Build command:** `npm run build`
     - **Publish directory:** `public`
     - **Functions directory:** `netlify/functions`

3. **Add Environment Variables**
   - Go to Site settings → Environment variables
   - Add:
     - `GEMINI_API_KEY` = your Gemini API key
     - `JWT_SECRET` = any random string (e.g., `my-secret-key-123`)
     - `NODE_ENV` = `production`

4. **Deploy**
   - Click "Deploy site"
   - Wait for build to complete
   - Your site will be live at `https://your-site-name.netlify.app`

### Method 3: Drag & Drop (Simplest)

1. **Build the project locally**
   ```bash
   cd secondguess
   npm install
   npm run build
   ```

2. **Install function dependencies**
   ```bash
   cd netlify/functions
   npm install
   cd ../..
   ```

3. **Create deployment folder**
   ```bash
   # Create a folder with both public files and functions
   mkdir netlify-deploy
   cp -r public netlify-deploy/
   cp -r netlify netlify-deploy/
   cp netlify.toml netlify-deploy/
   ```

4. **Drag & Drop**
   - Go to https://app.netlify.com/drop
   - Drag the `netlify-deploy` folder
   - Wait for deployment

5. **Add Environment Variables** (after deployment)
   - Go to your site dashboard
   - Site settings → Environment variables
   - Add `GEMINI_API_KEY` and `JWT_SECRET`
   - Trigger a redeploy

## What Works on Netlify

✅ **Frontend**
- All HTML pages
- Voice recording (Web Speech API)
- UI interactions

✅ **Backend Functions**
- Authentication (`/api/auth/guest`)
- Session management (`/api/sessions`)
- AI conversations (`/api/conversations/:id/input`)
- API logging (`/api/logs`)

✅ **Features**
- Voice-to-text (browser-based)
- AI-powered SOP generation
- Real-time conversations

## Limitations

⚠️ **In-Memory Storage**
- Sessions stored in memory (lost on function restart)
- For production, add Redis or database

⚠️ **Function Timeout**
- 10 seconds on free tier
- 26 seconds on Pro tier
- Long AI responses might timeout

⚠️ **Cold Starts**
- First request after inactivity is slower (~1-2 seconds)
- Subsequent requests are fast

⚠️ **Missing Features** (not yet implemented)
- SOP export (`/api/sops/:id/export`)
- Monitoring dashboard
- System metrics

## Testing Your Deployment

After deployment, test these URLs:

1. **Main page**
   ```
   https://your-site.netlify.app/
   ```

2. **New interface**
   ```
   https://your-site.netlify.app/new
   ```

3. **Health check** (test function)
   ```
   https://your-site.netlify.app/api/auth/guest
   ```
   Should return: `{"token":"...","userId":"guest-...","expiresIn":"24h"}`

4. **Test conversation**
   - Go to `/new`
   - Click mic button or type a message
   - Should get AI response

## Troubleshooting

### Build fails
```bash
# Check build logs in Netlify dashboard
# Common issues:
- Missing dependencies in package.json
- TypeScript errors
- Environment variables not set
```

### Functions return 500 error
```bash
# Check function logs in Netlify dashboard
# Common issues:
- GEMINI_API_KEY not set
- Function timeout (response too slow)
- Missing dependencies in netlify/functions/package.json
```

### API calls fail with CORS error
```bash
# Check that netlify.toml has correct redirects
# Verify functions have CORS headers
```

### Voice recording doesn't work
```bash
# Requires HTTPS (Netlify provides this automatically)
# Check browser console for errors
# Ensure microphone permissions granted
```

## Upgrading to Production

For a production deployment, you should:

1. **Add Database**
   - Use Netlify Blobs for simple storage
   - Or connect to MongoDB Atlas (free tier)
   - Or use Supabase (free tier)

2. **Add Redis** (for sessions)
   - Upstash Redis (free tier)
   - Configure in functions

3. **Implement Missing Features**
   - SOP export function
   - Monitoring endpoints
   - User authentication (beyond guest)

4. **Optimize Functions**
   - Add caching
   - Reduce cold starts
   - Optimize bundle size

## Cost Estimate

**Netlify Free Tier:**
- 100GB bandwidth/month
- 125,000 function requests/month
- 300 build minutes/month

**Should be enough for:**
- ~10,000 conversations/month
- ~50,000 page views/month
- Development and testing

**Upgrade to Pro ($19/month) if you need:**
- More bandwidth
- Longer function timeouts
- More build minutes
- Team collaboration

## Next Steps

1. Deploy using one of the methods above
2. Test all features
3. Add environment variables
4. Share your live URL!

Need help? Check the Netlify docs: https://docs.netlify.com/
