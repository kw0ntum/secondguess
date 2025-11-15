# Quick Setup Instructions

## Step 1: Get Your Google Gemini API Key

1. Go to https://makersuite.google.com/app/apikey
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated API key

## Step 2: Add API Key to Environment

Create or edit your `.env` file in the `secondguess` directory:

```bash
# Add these lines to your .env file
GEMINI_API_KEY=your-actual-api-key-here
GEMINI_MODEL=gemini-2.5-pro
```

Replace `your-actual-api-key-here` with the API key you copied.

## Step 3: Install Dependencies (Already Done)

The Google Generative AI package has been installed:
```bash
npm install @google/generative-ai
```

## Step 4: Start the Server

```bash
npm run dev
```

## Step 5: Test the Integration

1. Open your application in a browser
2. Start a conversation session
3. Type a message describing a workflow (e.g., "I need to create a process for onboarding new employees")
4. Click the **Send** button
5. You should see:
   - Your message appear in the chat
   - An AI-generated summary with workflow details
   - Two buttons: "✓ Approve" and "✗ Provide Feedback"
6. Click "Approve" to accept the summary, or "Provide Feedback" to request improvements

## What Was Implemented

✅ **Backend API**
- `/api/summarization/:sessionId/generate` - Generate AI summaries
- `/api/summarization/:sessionId/feedback` - Submit user feedback
- `/api/summarization/stats` - Get feedback statistics

✅ **Frontend Integration**
- Send button triggers automatic summarization
- Conversational approve/reject buttons
- Feedback loop for continuous improvement

✅ **AI Service**
- Google Gemini integration
- Structured prompt engineering
- Feedback history tracking

✅ **Environment Configuration**
- API key management
- Model configuration

## Troubleshooting

**Issue: "GEMINI_API_KEY environment variable is not set"**
- Solution: Make sure you created the `.env` file in the `secondguess` directory
- Restart your server after adding the API key

**Issue: Summary not appearing**
- Check browser console for errors
- Verify your API key is valid
- Ensure you're logged in (authentication required)

**Issue: "Failed to generate summary"**
- Check your internet connection
- Verify API key has Gemini API access enabled
- Check Google Cloud Console for API quota limits

## Next Steps

- Review `GEMINI_INTEGRATION.md` for detailed documentation
- Customize the summary format in `gemini-summarization-service.ts`
- Adjust summary frequency in `ConversationDisplay.ts`
- Monitor API usage at https://makersuite.google.com/

## Support

For issues or questions:
1. Check the error logs in your terminal
2. Review browser console for frontend errors
3. Verify all environment variables are set correctly
