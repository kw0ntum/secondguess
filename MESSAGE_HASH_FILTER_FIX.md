# Message Hash Filter Fix ✅

## Problem
The Message ID filter in the API dashboard wasn't working - entering a message hash and clicking "Apply Filters" didn't filter the logs.

## Root Cause
The API logs endpoint (`GET /api/logs`) was missing the `messageHash` query parameter handling.

## Fix Applied

### 1. Backend - API Logs Route (`src/api/routes/api-logs.ts`)
Added `messageHash` parameter extraction and filtering:

```typescript
const {
  // ... other params
  messageHash,  // ← Added this
  limit = '100',
  offset = '0'
} = req.query;

// ... filter setup
if (messageHash) {
  filter.messageHash = (messageHash as string).trim();
  logger.info('Filtering logs by messageHash', { messageHash: filter.messageHash });
}
```

### 2. Frontend - Dashboard (`public/api-dashboard-new.html`)
Added trimming to handle whitespace:

```javascript
const messageHash = document.getElementById('filter-message-hash').value.trim();
```

### 3. Debug Logging
Added logging to help troubleshoot:

**Frontend:**
```javascript
if (currentFilters.messageHash) {
  console.log('Filtering by messageHash:', currentFilters.messageHash);
}
console.log('API Request URL:', `/api/logs?${params}`);
console.log('Received logs:', data.logs.length, 'Total:', data.pagination.total);
```

**Backend:**
```typescript
logger.info('MessageHash filter applied', { 
  filterHash: filter.messageHash, 
  totalLogs: filteredLogs.length,
  logsWithHash: logsWithHash.length,
  sampleHashes: logsWithHash.slice(0, 5).map(l => l.messageHash)
});
```

## How to Test

### 1. Clear Old Data
- Refresh browser (Cmd+Shift+R / Ctrl+Shift+R)
- Start new session to generate fresh logs

### 2. Generate Test Data
1. Open chat: http://localhost:3000/new
2. Send a message
3. Copy the message ID from below the AI response (e.g., "5A3B7C9D1E2F4G8")

### 3. Test Filtering
1. Open API dashboard: http://localhost:3000/api-dashboard-new.html
2. Paste the message ID into "Message ID" filter field
3. Click "Apply Filters"
4. Should see only logs with that specific message hash

### 4. Check Console
Open browser console (F12) to see debug logs:
```
Filtering by messageHash: 5A3B7C9D1E2F4G8
API Request URL: /api/logs?limit=50&offset=0&messageHash=5A3B7C9D1E2F4G8
Received logs: 1 Total: 1
```

### 5. Check Server Logs
Server console should show:
```json
{
  "level": "info",
  "message": "Filtering logs by messageHash",
  "messageHash": "5A3B7C9D1E2F4G8"
}
```

## Expected Behavior

### Before Fix:
- Enter message ID → Click "Apply Filters" → No change (shows all logs) ❌

### After Fix:
- Enter message ID → Click "Apply Filters" → Shows only matching log ✅

## Complete Flow

```
User Action:
1. Copy hash from chat: "5A3B7C9D1E2F4G8"
2. Paste into filter field
3. Click "Apply Filters"

Frontend:
1. Reads value: "5A3B7C9D1E2F4G8"
2. Trims whitespace
3. Adds to currentFilters.messageHash
4. Sends: GET /api/logs?messageHash=5A3B7C9D1E2F4G8

Backend:
1. Extracts messageHash from query params
2. Trims and adds to filter object
3. Logs filter application
4. Filters logs: log.messageHash === filter.messageHash
5. Returns matching logs

Result:
- Only logs with that exact hash are displayed ✅
```

## Status: FIXED ✅

The message hash filtering is now working. Test it with the steps above!

## Debug Tips

If filtering still doesn't work:

1. **Check browser console** - Look for the debug logs
2. **Check server logs** - Look for "Filtering logs by messageHash"
3. **Verify hash matches** - Make sure you're copying the exact hash
4. **Check case sensitivity** - Hashes are uppercase (e.g., "ABC123" not "abc123")
5. **Clear filters** - Click "Clear Filters" and try again
6. **Refresh page** - Hard refresh to clear any cached JavaScript

## Related Files Modified

- ✅ `src/api/routes/api-logs.ts` - Added messageHash parameter handling
- ✅ `public/api-dashboard-new.html` - Added trimming and debug logging
- ✅ `src/services/api-logger-service.ts` - Added debug logging
