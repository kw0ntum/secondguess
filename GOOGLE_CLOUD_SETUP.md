# 🎤 What You Need to Do Next

You've already completed the first steps! Here's exactly what you need to do to finish the Speech-to-Text setup:

## ✅ What You've Already Done

1. ✅ Created a Google Cloud Platform project
2. ✅ Enabled the Speech-to-Text API
3. ✅ Created a service account
4. ✅ Generated a service account key (JSON file)

## 📋 What You Need to Do Now

### Step 1: Place Your Credentials File

You should have downloaded a JSON file from Google Cloud. It looks something like:
- `ai-voice-sop-agent-1234567890ab.json`
- `service-account-key.json`
- Or similar name

**Do this:**

1. **Rename** the file to: `google-credentials.json`

2. **Move** it to this location:
   ```
   V_secondguess/secondguess/google-credentials.json
   ```

3. **Verify** the file is in the right place:
   ```bash
   # On Windows PowerShell:
   Test-Path V_secondguess\secondguess\google-credentials.json
   
   # Should return: True
   ```

### Step 2: Verify the Credentials File Format

Open the `google-credentials.json` file and make sure it looks like this:

```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "your-service-account@your-project.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "..."
}
```

If it looks different or is missing fields, you may need to regenerate the key.

### Step 3: Update .gitignore (Important!)

Make sure your `.gitignore` file includes this line to prevent committing credentials:

```
google-credentials.json
```

This is **critical** for security!

### Step 4: Build and Test

Now let's test if everything works:

```bash
# Navigate to the project directory
cd V_secondguess\secondguess

# Install dependencies (if not already done)
npm install

# Build the project
npm run build

# Start the development server
npm run dev
```

The server should start on `http://localhost:3000`

### Step 5: Verify the Service is Working

Open a **new terminal** and run:

```bash
# Check service status
curl http://localhost:3000/api/speech/status
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "isReady": true,
    "currentLanguage": "en-US",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

If `isReady` is `true`, **you're all set!** 🎉

If `isReady` is `false`, see the troubleshooting section below.

### Step 6: Test with the Example Client

```bash
# Run the example client
node examples/speech-client-example.js
```

This will:
- Check service status
- List supported languages
- Start a session
- Test confidence scoring
- End the session

## 🔧 Troubleshooting

### Problem: "isReady: false"

**Check these:**

1. **File location**: Is `google-credentials.json` in the right place?
   ```bash
   dir V_secondguess\secondguess\google-credentials.json
   ```

2. **File content**: Open the file and verify it's valid JSON

3. **Environment variable**: Check your `.env` file has:
   ```
   GOOGLE_APPLICATION_CREDENTIALS=./google-credentials.json
   ```

4. **API enabled**: Go to [GCP Console](https://console.cloud.google.com/) and verify Speech-to-Text API is enabled

5. **Permissions**: Verify your service account has the "Cloud Speech Client" role

### Problem: "PERMISSION_DENIED" Error

**Solution:**

1. Go to [GCP Console](https://console.cloud.google.com/)
2. Navigate to "IAM & Admin" > "Service Accounts"
3. Find your service account
4. Click the three dots (⋮) > "Manage permissions"
5. Add role: **"Cloud Speech Client"** or **"Cloud Speech Administrator"**
6. Save changes
7. Wait 1-2 minutes for permissions to propagate
8. Restart your server

### Problem: "File not found" Error

**Solution:**

The path in `.env` is relative to where you run the command. Try:

```bash
# Option 1: Use absolute path
GOOGLE_APPLICATION_CREDENTIALS=C:\Users\YourName\dev\Kiroween\V_secondguess\secondguess\google-credentials.json

# Option 2: Use relative path (if running from project root)
GOOGLE_APPLICATION_CREDENTIALS=./google-credentials.json
```

### Problem: Can't Find the Downloaded JSON File

**Solution:**

1. Go back to [GCP Console](https://console.cloud.google.com/)
2. Navigate to "IAM & Admin" > "Service Accounts"
3. Find your service account
4. Click the three dots (⋮) > "Manage keys"
5. Click "Add Key" > "Create new key"
6. Choose JSON format
7. Download it again

## 📝 Quick Reference

### File Structure
```
V_secondguess/secondguess/
├── google-credentials.json  ← Your credentials file goes here
├── .env                      ← Already configured
├── src/
│   ├── api/routes/speech.ts ← API endpoints (already created)
│   └── services/speech-to-text-service.ts ← Service (already created)
├── examples/
│   └── speech-client-example.js ← Test client (already created)
└── docs/
    └── SPEECH_TO_TEXT_SETUP.md ← Full documentation (already created)
```

### API Endpoints Available

- `GET /api/speech/status` - Check if service is ready
- `GET /api/speech/languages` - List supported languages
- `POST /api/speech/session/start` - Start a transcription session
- `POST /api/speech/session/end` - End a session
- `POST /api/speech/transcribe` - Transcribe audio to text
- `PUT /api/speech/language` - Change language
- `POST /api/speech/confidence` - Get confidence score for text

### Environment Variables (Already Set)

```bash
GOOGLE_APPLICATION_CREDENTIALS=./google-credentials.json
SPEECH_LANGUAGE=en-US
SPEECH_CONFIDENCE_THRESHOLD=0.7
SPEECH_MODEL=latest_long
SPEECH_ENABLE_ENHANCED=true
```

## 🎯 Next Steps After Setup

Once the service is working:

1. **Test with real audio**: Record a WAV file and test transcription
   ```bash
   node examples/speech-client-example.js path/to/your/audio.wav
   ```

2. **Integrate with your app**: Use the API endpoints in your application

3. **Monitor usage**: Check your [GCP Console](https://console.cloud.google.com/) for API usage and costs

4. **Adjust settings**: Modify `.env` file to change language, confidence threshold, etc.

## 💰 Cost Information

- **Free Tier**: 60 minutes per month
- **Standard Model**: $0.006 per 15 seconds (~$1.44/hour)
- **Enhanced Model**: $0.009 per 15 seconds (~$2.16/hour)

Monitor your usage at: [GCP Console > Billing](https://console.cloud.google.com/billing)

## 📚 Additional Resources

- **Full Setup Guide**: See `docs/SPEECH_TO_TEXT_SETUP.md`
- **API Documentation**: See `docs/API.md` (if available)
- **Google Cloud Docs**: https://cloud.google.com/speech-to-text/docs

## ✅ Checklist

- [ ] Downloaded JSON credentials file from Google Cloud
- [ ] Renamed file to `google-credentials.json`
- [ ] Placed file in `V_secondguess/secondguess/` directory
- [ ] Verified file is valid JSON
- [ ] Added `google-credentials.json` to `.gitignore`
- [ ] Ran `npm install`
- [ ] Ran `npm run build`
- [ ] Started server with `npm run dev`
- [ ] Tested with `curl http://localhost:3000/api/speech/status`
- [ ] Verified `isReady: true` in response
- [ ] Ran example client: `node examples/speech-client-example.js`

## 🆘 Still Having Issues?

If you're still stuck:

1. Check the server logs in `logs/app.log`
2. Look for error messages in the terminal
3. Verify all steps above are completed
4. Check the full documentation in `docs/SPEECH_TO_TEXT_SETUP.md`
5. Review Google Cloud Console for any API errors

---

**That's it!** Once you place the credentials file and verify the service is ready, you're all set to use Speech-to-Text! 🎉
