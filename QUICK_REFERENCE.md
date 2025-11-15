# Quick Reference Guide

## Files Created/Modified

### New Files
- `src/services/gemini-summarization-service.ts` - AI summarization service
- `src/api/routes/summarization.ts` - API endpoints for summarization
- `GEMINI_INTEGRATION.md` - Detailed documentation
- `SETUP_INSTRUCTIONS.md` - Quick setup guide
- `STREAMING_EXPLANATION.md` - Explanation of streaming responses

### Modified Files
- `src/api/server.ts` - Added summarization routes
- `src/ui/components/ConversationDisplay.ts` - Added AI summary integration
- `src/services/conversation-manager-service.ts` - Added getSession method
- `.env.example` - Added Gemini API configuration
- `package.json` - Added @google/generative-ai dependency

## Environment Variables

Add to your `.env` file:
```bash
GEMINI_API_KEY=your-api-key-here
GEMINI_MODEL=gemini-pro
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/summarization/:sessionId/generate` | POST | Generate AI summary |
| `/api/summarization/:sessionId/feedback` | POST | Submit feedback |
| `/api/summarization/stats` | GET | Get feedback stats |

## Key Features

✅ **Automatic Summarization**
- Triggers on send button click
- Analyzes conversation history
- Generates structured summaries

✅ **Conversational Feedback**
- Approve button (✓)
- Reject button (✗)
- Optional user comments

✅ **Feedback Loop**
- Learns from rejections
- Improves future summaries
- Tracks statistics

✅ **Preserved Functionality**
- All existing chat features work
- No breaking changes
- Backward compatible

## User Flow

```
1. User types message
   ↓
2. Clicks Send button
   ↓
3. Message appears in chat
   ↓
4. AI generates summary
   ↓
5. Summary appears with buttons
   ↓
6. User clicks Approve or Reject
   ↓
7a. If Approved: Confirmation message
7b. If Rejected: Prompt for feedback → New summary
```

## Testing Checklist

- [ ] API key added to .env
- [ ] Server starts without errors
- [ ] Can send messages in chat
- [ ] Summary appears after sending
- [ ] Approve button works
- [ ] Reject button prompts for feedback
- [ ] New summary generated after rejection
- [ ] No console errors

## Common Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Check for errors
npm run lint
```

## Customization Points

### Change Summary Trigger
File: `src/ui/components/ConversationDisplay.ts`
Method: `handleSendMessage()`

### Modify Summary Format
File: `src/services/gemini-summarization-service.ts`
Method: `buildSummarizationPrompt()`

### Adjust Feedback Handling
File: `src/api/routes/summarization.ts`
Route: `POST /:sessionId/feedback`

### Update UI Styling
File: `src/ui/components/ConversationDisplay.ts`
Method: `addStyles()`

## Troubleshooting Quick Fixes

**Summary not generating?**
```bash
# Check if API key is set
echo $GEMINI_API_KEY

# Restart server
npm run dev
```

**Build errors?**
```bash
# Clean and rebuild
rm -rf dist node_modules
npm install
npm run build
```

**TypeScript errors?**
```bash
# Check diagnostics
npx tsc --noEmit
```

## Support Resources

- Google Gemini Docs: https://ai.google.dev/docs
- API Key Management: https://makersuite.google.com/
- Project Documentation: See GEMINI_INTEGRATION.md

## Next Steps

1. ✅ Add API key to .env
2. ✅ Start server
3. ✅ Test basic flow
4. 📝 Customize prompts (optional)
5. 📝 Adjust UI styling (optional)
6. 📝 Add rate limiting (future)
7. 📝 Implement caching (future)
8. 📝 Add streaming (future)
