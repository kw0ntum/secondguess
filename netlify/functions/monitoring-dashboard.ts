import { Handler } from '@netlify/functions';

export const handler: Handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Mock dashboard data for hackathon demo
    const dashboardData = {
      health: {
        status: 'healthy',
        uptime: Date.now() - 1000 * 60 * 30, // 30 minutes
        metrics: {
          activeSessions: 0,
          totalRequests: 0,
          averageResponseTime: 150,
          errorRate: 0,
          memoryUsage: {
            heapUsed: 50 * 1024 * 1024,
            heapTotal: 100 * 1024 * 1024,
          },
          cpuUsage: 15,
        },
        services: {
          'Conversation Manager': { status: 'healthy' },
          'SOP Generator': { status: 'healthy' },
          'Speech-to-Text': { status: 'healthy' },
          'Text-to-Speech': { status: 'healthy' },
          'Document Exporter': { status: 'healthy' },
        },
        alerts: [],
      },
      serviceHealth: {
        totalServices: 5,
        healthyServices: 5,
        degradedServices: 0,
        unhealthyServices: 0,
      },
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(dashboardData),
    };
  } catch (error) {
    console.error('Dashboard error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to load dashboard data' }),
    };
  }
};
