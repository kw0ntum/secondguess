import { Handler } from '@netlify/functions';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// In-memory storage (use Redis/DB in production)
const sessions = new Map();

export const handler: Handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Extract session ID from path
    const pathParts = event.path.split('/');
    const sessionId = pathParts[pathParts.length - 2];

    const body = JSON.parse(event.body || '{}');
    const userMessage = body.text;

    if (!userMessage) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Message text is required' }),
      };
    }

    // Get or create session
    let session = sessions.get(sessionId);
    if (!session) {
      session = {
        sessionId,
        conversationHistory: [],
        createdAt: new Date().toISOString(),
      };
      sessions.set(sessionId, session);
    }

    // Add user message to history
    session.conversationHistory.push({
      role: 'user',
      content: userMessage,
    });

    // Call Gemini API
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const prompt = `You are an AI assistant helping users create Standard Operating Procedures (SOPs).

User message: ${userMessage}

Analyze the user's input and provide a helpful response. If they're describing a workflow or process, ask clarifying questions to gather more details about:
- Steps involved
- Required inputs
- Expected outputs
- Decision points
- Error handling

Respond in a conversational, helpful manner.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const aiMessage = response.text();

    // Add AI response to history
    session.conversationHistory.push({
      role: 'assistant',
      content: aiMessage,
    });

    // Generate message hash
    const messageHash = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create metadata
    const metadata = {
      messageHash,
      timestamp: new Date().toISOString(),
      summary: {
        description: 'Conversation in progress',
        completenessScore: Math.min(session.conversationHistory.length * 10, 100),
        keySteps: [],
        identifiedInputs: [],
        identifiedOutputs: [],
        missingInformation: [],
        suggestedNextQuestions: [
          'Can you provide more details about the process?',
          'What are the main steps involved?',
          'What inputs are required?',
        ],
      },
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: aiMessage,
        metadata,
        sessionId,
      }),
    };
  } catch (error) {
    console.error('Conversation error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to process message',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
    };
  }
};
