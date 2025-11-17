# API Logging and Monitoring Feature

## Overview
Comprehensive API logging system that tracks all API calls with performance metrics, network statistics, and provides a dashboard for monitoring and real-time API testing.

## Features Implemented

### 1. API Logging Middleware (`src/api/middleware/api-logger.ts`)
- Automatically logs all API requests and responses
- Captures performance metrics:
  - Latency (time to first byte)
  - Processing time (server processing)
  - Total request time
  - Request/response sizes
  - Throughput (bytes per second)
- Sanitizes sensitive data (passwords, tokens, API keys)
- Skips health checks and static files
- Unique log ID for each request

### 2. API Logger Service (`src/services/api-logger-service.ts`)
- In-memory storage of API logs (last 10,000 entries)
- Filtering capabilities:
  - Date range (startDate, endDate)
  - HTTP method
  - Endpoint path
  - Status code
  - Duration range
  - User ID / Session ID
  - Error status
- Statistics calculation:
  - Total/successful/failed requests
  - Average latency and processing time
  - Throughput metrics
  - Slowest/fastest/most-used endpoints
  - Error rate percentage
- Pagination support

### 3. API Log Routes (`src/api/routes/api-logs.ts`)

#### GET /api/logs
Get API logs with filtering and pagination
```
Query Parameters:
- startDate, endDate: Date range filter
- method: HTTP method (GET, POST, etc.)
- endpoint: Endpoint path filter
- statusCode: HTTP status code
- minDuration, maxDuration: Duration range (ms)
- userId, sessionId: User/session filter
- hasError: true/false
- limit: Results per page (default 100)
- offset: Pagination offset (default 0)
```

#### GET /api/logs/stats
Get aggregated statistics
```
Query Parameters:
- startDate, endDate: Date range
- method: HTTP method filter
- endpoint: Endpoint filter
```

#### GET /api/logs/:id
Get specific log entry by ID

#### DELETE /api/logs
Clear all logs (admin only)

#### GET /api/logs/endpoints/list
Get list of all endpoints with their statistics

### 4. Data Models (`src/models/api-log-models.ts`)

**ApiLogEntry:**
- id, timestamp
- method, endpoint, statusCode
- requestBody, responseBody
- requestHeaders, responseHeaders
- userId, sessionId
- duration
- networkMetrics (latency, processingTime, totalTime, sizes, throughput)
- error (if applicable)

**NetworkMetrics:**
- latency: Time to first byte
- processingTime: Server processing time
- totalTime: Total request time
- requestSize, responseSize: In bytes
- throughput: Bytes per second

**ApiLogFilter:**
- Multiple filter options for querying logs

**ApiLogStats:**
- Aggregated statistics across logs

**ApiEndpointInfo:**
- Per-endpoint statistics and metadata

## Usage

### Accessing Logs via API

```javascript
// Get recent logs
fetch('/api/logs?limit=50')
  .then(res => res.json())
  .then(data => console.log(data.logs));

// Get logs with filters
fetch('/api/logs?method=POST&minDuration=1000&hasError=true')
  .then(res => res.json())
  .then(data => console.log(data.logs));

// Get statistics
fetch('/api/logs/stats')
  .then(res => res.json())
  .then(data => console.log(data.stats));

// Get endpoints list
fetch('/api/logs/endpoints/list')
  .then(res => res.json())
  .then(data => console.log(data.endpoints));
```

### Dashboard Integration

The existing dashboard at `/dashboard` shows:
- System health and uptime
- Performance metrics
- Service health status
- Active alerts

**To Add (Next Steps):**
1. API Logs tab with filtering UI
2. Real-time log streaming
3. API testing interface
4. Performance charts and graphs
5. Export logs functionality

## Security Features

### Data Sanitization
- Passwords → `[REDACTED]`
- Tokens → `[REDACTED]`
- API Keys → `[REDACTED]`
- Authorization headers → `[REDACTED]`
- Cookies → `[REDACTED]`

### Access Control
- All log endpoints require authentication
- Admin-only operations (clear logs)
- User can only see their own session logs (future enhancement)

## Performance Considerations

### Memory Management
- Stores last 10,000 logs in memory
- Automatic cleanup of old logs
- Configurable retention limit

### Optimization
- Skips logging for health checks
- Skips logging for static files
- Efficient filtering with early returns
- Pagination to limit response size

## Future Enhancements

### 1. Enhanced Dashboard
```html
<!-- API Logs Tab -->
<div class="api-logs-section">
  <div class="filters">
    <input type="date" id="startDate">
    <input type="date" id="endDate">
    <select id="method">
      <option>All Methods</option>
      <option>GET</option>
      <option>POST</option>
      <option>PUT</option>
      <option>DELETE</option>
    </select>
    <input type="text" id="endpoint" placeholder="Filter by endpoint">
    <button onclick="applyFilters()">Apply Filters</button>
  </div>
  
  <div class="logs-table">
    <!-- Logs displayed here -->
  </div>
</div>
```

### 2. Real-Time API Testing
```html
<div class="api-tester">
  <h3>API Tester</h3>
  <select id="testMethod">
    <option>GET</option>
    <option>POST</option>
    <option>PUT</option>
    <option>DELETE</option>
  </select>
  <input type="text" id="testEndpoint" placeholder="/api/endpoint">
  <textarea id="testBody" placeholder="Request body (JSON)"></textarea>
  <button onclick="testAPI()">Send Request</button>
  
  <div class="test-results">
    <h4>Response:</h4>
    <pre id="testResponse"></pre>
    <div class="test-metrics">
      <span>Status: <strong id="testStatus"></strong></span>
      <span>Time: <strong id="testTime"></strong>ms</span>
      <span>Size: <strong id="testSize"></strong> bytes</span>
    </div>
  </div>
</div>
```

### 3. Performance Charts
- Response time trends
- Request volume over time
- Error rate trends
- Endpoint usage distribution
- Network throughput graphs

### 4. Database Persistence
```typescript
interface LogRepository {
  save(log: ApiLogEntry): Promise<void>;
  find(filter: ApiLogFilter): Promise<ApiLogEntry[]>;
  getStats(filter: ApiLogFilter): Promise<ApiLogStats>;
  delete(id: string): Promise<void>;
  cleanup(olderThan: Date): Promise<number>;
}
```

Benefits:
- Survives server restarts
- Unlimited log retention
- Better for horizontal scaling
- Advanced querying capabilities
- Audit trail compliance

### 5. Real-Time Updates
```javascript
// WebSocket connection for live logs
const ws = new WebSocket('ws://localhost:3000/api/logs/stream');

ws.onmessage = (event) => {
  const log = JSON.parse(event.data);
  appendLogToTable(log);
};
```

### 6. Export Functionality
- Export logs as CSV
- Export logs as JSON
- Export filtered results
- Schedule automated exports

### 7. Alerting
- Alert on high error rates
- Alert on slow endpoints
- Alert on unusual traffic patterns
- Email/Slack notifications

## Testing

### Test Log Creation
```bash
# Make some API calls
curl http://localhost:3000/api/sessions -X POST -H "Content-Type: application/json" -d '{"userId":"test"}'

# View logs
curl http://localhost:3000/api/logs

# View stats
curl http://localhost:3000/api/logs/stats
```

### Test Filtering
```bash
# Filter by method
curl "http://localhost:3000/api/logs?method=POST"

# Filter by duration
curl "http://localhost:3000/api/logs?minDuration=100"

# Filter by error status
curl "http://localhost:3000/api/logs?hasError=true"
```

## Configuration

### Environment Variables
```bash
# Maximum logs to keep in memory
MAX_API_LOGS=10000

# Enable/disable API logging
ENABLE_API_LOGGING=true

# Log sensitive data (dev only!)
LOG_SENSITIVE_DATA=false
```

### Middleware Configuration
```typescript
// Skip certain paths
const skipPaths = [
  '/api/monitoring/health',
  '/dashboard/assets',
  '/favicon.ico'
];

// Custom sanitization rules
const sensitiveFields = [
  'password',
  'token',
  'apiKey',
  'secret'
];
```

## Monitoring Best Practices

1. **Regular Review**: Check logs daily for errors
2. **Performance Tracking**: Monitor average response times
3. **Error Investigation**: Investigate spikes in error rates
4. **Capacity Planning**: Use throughput data for scaling decisions
5. **Security Auditing**: Review access patterns for anomalies

## Related Documentation

- [SECURITY_FIXES.md](./SECURITY_FIXES.md) - XSS vulnerability fixes
- [PRIVACY_FIX.md](./PRIVACY_FIX.md) - Session-scoped feedback storage
- [GEMINI_INTEGRATION.md](./GEMINI_INTEGRATION.md) - AI summarization feature
