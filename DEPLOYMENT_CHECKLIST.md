# 📋 Netlify Deployment Checklist

## Before You Deploy

- [ ] You have a Netlify account (free at https://netlify.com)
- [ ] You have a Gemini API key (get at https://makersuite.google.com/app/apikey)
- [ ] Your code is in the `secondguess/` folder

## Choose Your Deployment Method

### ✅ Method 1: CLI (Recommended for first-time)

- [ ] Run `setup-netlify.bat` (Windows) or `bash setup-netlify.sh` (Mac/Linux)
- [ ] Run `netlify login`
- [ ] Run `netlify init`
- [ ] Run `netlify env:set GEMINI_API_KEY "your-key"`
- [ ] Run `netlify env:set JWT_SECRET "any-random-string"`
- [ ] Run `netlify deploy --prod`
- [ ] Visit your live site!

### ✅ Method 2: GitHub (Recommended for ongoing development)

- [ ] Push code to GitHub
- [ ] Go to https://app.netlify.com/
- [ ] Click "Add new site" → "Import from Git"
- [ ] Select your repository
- [ ] Set build command: `npm run build`
- [ ] Set publish directory: `public`
- [ ] Set functions directory: `netlify/functions`
- [ ] Add environment variables in dashboard
- [ ] Deploy!

### ✅ Method 3: Drag & Drop (Simplest)

- [ ] Run `npm install` in `secondguess/`
- [ ] Run `npm install` in `secondguess/netlify/functions/`
- [ ] Go to https://app.netlify.com/drop
- [ ] Drag the `secondguess` folder
- [ ] Add environment variables in dashboard after deployment
- [ ] Trigger redeploy

## After Deployment

- [ ] Test main page: `https://your-site.netlify.app/`
- [ ] Test new interface: `https://your-site.netlify.app/new`
- [ ] Test API: `https://your-site.netlify.app/api/auth/guest`
- [ ] Test voice recording (click mic button)
- [ ] Test AI conversation (type or speak a message)
- [ ] Check function logs in Netlify dashboard

## Environment Variables Required

- [ ] `GEMINI_API_KEY` - Your Gemini API key
- [ ] `JWT_SECRET` - Any random string (e.g., "my-secret-123")
- [ ] `NODE_ENV` - Set to "production"

## Troubleshooting

If something doesn't work:

1. **Check function logs** in Netlify dashboard
2. **Verify environment variables** are set correctly
3. **Check browser console** for frontend errors
4. **Review build logs** if deployment fails

## Common Issues

**Build fails:**
- Make sure you ran `npm install` in both root and `netlify/functions/`
- Check that all dependencies are in `package.json`

**Functions return 500 error:**
- Verify `GEMINI_API_KEY` is set correctly
- Check function logs for specific error messages

**Voice recording doesn't work:**
- Netlify provides HTTPS automatically (required for mic access)
- Check browser permissions for microphone
- Try in Chrome/Edge (best support)

**AI responses are slow:**
- First request has "cold start" delay (~1-2 seconds)
- Subsequent requests are faster
- This is normal for serverless functions

## Success Criteria

Your deployment is successful when:

✅ Main page loads at your Netlify URL
✅ Voice recording button appears and works
✅ You can send messages and get AI responses
✅ No errors in browser console
✅ Function logs show successful requests

## Next Steps After Successful Deployment

1. **Share your URL** with others
2. **Test all features** thoroughly
3. **Monitor usage** in Netlify dashboard
4. **Consider upgrades** if you hit free tier limits
5. **Add custom domain** (optional, in Netlify settings)

## Need Help?

- **Quick Start:** See `NETLIFY_QUICK_START.md`
- **Full Guide:** See `NETLIFY_DEPLOYMENT.md`
- **Complete Info:** See `NETLIFY_COMPLETE.md`
- **Netlify Docs:** https://docs.netlify.com/

---

**Ready to deploy?** Pick a method above and check off the boxes as you go! 🚀
