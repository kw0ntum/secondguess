import { Handler } from '@netlify/functions';
import { v4 as uuidv4 } from 'uuid';

// In-memory storage (for demo - use Redis/DB in production)
const sessions = new Map();

export const handler: Handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
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
    const body = JSON.parse(event.body || '{}');
    const sessionId = uuidv4();
    
    const session = {
      sessionId,
      userId: body.userId,
      createdAt: new Date().toISOString(),
      conversationHistory: [],
    };

    sessions.set(sessionId, session);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        sessionId,
        createdAt: session.createdAt,
      }),
    };
  } catch (error) {
    console.error('Session creation error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to create session' }),
    };
  }
};
