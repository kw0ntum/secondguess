import { Handler } from '@netlify/functions';

// Simple in-memory log storage
const logs: any[] = [];

export const handler: Handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, DELETE, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod === 'DELETE') {
    // Clear logs
    logs.length = 0;
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'Logs cleared successfully' }),
    };
  }

  if (event.httpMethod === 'GET') {
    // Return logs
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ logs }),
    };
  }

  return {
    statusCode: 405,
    headers,
    body: JSON.stringify({ error: 'Method not allowed' }),
  };
};
