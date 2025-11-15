# Google Gemini AI Summarization Integration

## Overview

This implementation integrates Google Gemini AI to provide intelligent workflow summarization with user feedback loops.

## Features

- **AI-Powered Summarization**: Automatically generates workflow summaries after each user input
- **Conversational Feedback**: Users can approve or reject summaries through conversational buttons
- **Feedback Loop**: Rejected summaries trigger improved regeneration based on user comments
- **Chat Rules Preserved**: All existing chat functionality remains intact

## Setup

### 1. Install Dependencies

The Google Generative AI package has been added to your project:

```bash
npm install @google/generative-ai
```

### 2. Configure API Key

Add your Google Gemini API key to your `.env` file:

```bash
GEMINI_API_KEY=your-gemini-api-key-here
GEMINI_MODEL=gemini-2.5-pro
```

To get your API key:
1. Visit https://makersuite.google.com/app/apikey
2. Create a new API key
3. Copy it to your `.env` file

### 3. Start the Server

```bash
npm run dev
```

## How It Works

### User Flow

1. **User sends a message** → The send button triggers the message
2. **AI generates summary** → Gemini analyzes the conversation and creates a structured summary
3. **Summary displayed** → The summary appears in the chat with key information:
   - Workflow description
   - Key steps identified
   - Missing information
   - Completeness score
4. **User provides feedback** → Two buttons appear:
   - ✓ **Approve**: Confirms the summary is accurate
   - ✗ **Provide Feedback**: Allows user to explain what needs improvement
5. **Feedback loop** → If rejected, a new improved summary is generated

### API Endpoints

#### Generate Summary
```
POST /api/summarization/:sessionId/generate
```

Generates an AI-powered workflow summary based on conversation history.

**Response:**
```json
{
  "success": true,
  "summary": {
    "id": "summary-1234567890",
    "sessionId": "session-xyz",
    "title": "Workflow Title",
    "description": "Comprehensive workflow description",
    "keySteps": ["Step 1", "Step 2", "Step 3"],
    "identifiedInputs": ["Input 1", "Input 2"],
    "identifiedOutputs": ["Output 1", "Output 2"],
    "missingInformation": ["Missing item 1"],
    "completenessScore": 75,
    "suggestedNextQuestions": ["Question 1", "Question 2"]
  }
}
```

#### Submit Feedback
```
POST /api/summarization/:sessionId/feedback
```

Submit user feedback on a generated summary.

**Request Body:**
```json
{
  "summaryId": "summary-1234567890",
  "isApproved": false,
  "userComments": "Please include more details about step 3"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Thank you for your feedback! I've generated an improved summary.",
  "newSummary": { /* new summary object */ },
  "feedbackStats": {
    "approved": 5,
    "rejected": 2,
    "total": 7
  }
}
```

#### Get Feedback Statistics
```
GET /api/summarization/stats
```

Retrieve feedback statistics.

## Architecture

### Components

1. **GeminiSummarizationService** (`src/services/gemini-summarization-service.ts`)
   - Handles communication with Google Gemini API
   - Manages feedback history
   - Generates structured summaries from AI responses

2. **Summarization Routes** (`src/api/routes/summarization.ts`)
   - REST API endpoints for summary generation and feedback
   - Integrates with conversation manager

3. **ConversationDisplay** (`src/ui/components/ConversationDisplay.ts`)
   - Updated to trigger summarization on send
   - Displays summaries with approve/reject buttons
   - Handles feedback submission

### Feedback Loop

The system learns from user feedback:
- Rejected summaries are stored with user comments
- Future summaries include context from previous rejections
- The AI adapts its responses based on user preferences

## Customization

### Adjust Summary Frequency

Currently, summaries are generated after every user message. To change this:

Edit `ConversationDisplay.ts`:
```typescript
// Generate summary every 2 messages
if (this.messages.filter(m => m.type === 'user').length % 2 === 0) {
  await this.generateAndDisplaySummary();
}
```

### Modify Summary Format

Edit the prompt in `GeminiSummarizationService.buildSummarizationPrompt()` to customize:
- Summary structure
- Level of detail
- Specific focus areas

### Change AI Model

Update your `.env` file:
```bash
GEMINI_MODEL=gemini-2.5-pro  # or gemini-pro-vision for image support
```

## Troubleshooting

### API Key Issues
- Ensure your API key is valid and has Gemini API access enabled
- Check that the `.env` file is loaded correctly

### Summary Not Generating
- Check browser console for errors
- Verify the session is active
- Ensure authentication token is valid

### Rate Limiting
- Google Gemini has rate limits on free tier
- Consider implementing caching for repeated requests
- Add rate limiting configuration if needed

## Future Enhancements

Potential improvements (currently not implemented):
- **Streaming responses**: Display summary as it's being generated
- **Rate limiting**: Prevent excessive API calls
- **Caching**: Store and reuse recent summaries
- **Multi-language support**: Summarize in user's preferred language
- **Export summaries**: Download summaries as documents

## Testing

To test the integration:

1. Start a conversation session
2. Send a message describing a workflow
3. Observe the AI-generated summary
4. Click "Approve" or "Provide Feedback"
5. If rejected, provide comments and see the improved summary

## Cost Considerations

- Google Gemini API has a free tier with limits
- Monitor your usage at https://makersuite.google.com/
- Consider implementing request caching to reduce API calls
- Set up billing alerts if using paid tier
