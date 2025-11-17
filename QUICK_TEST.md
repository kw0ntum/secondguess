# Quick Testing Guide

## Server Status
✅ Server running on http://localhost:3000

## Test Checklist

### 1. Main Chat App (http://localhost:3000/new)
- [ ] Page loads with welcome message
- [ ] Type a message and send
- [ ] Receive AI response
- [ ] Send multiple messages
- [ ] Click "Generate SOP" button
- [ ] Verify SOP is displayed

### 2. System Dashboard (http://localhost:3000/dashboard)
- [ ] Page loads with metrics
- [ ] All service health indicators show
- [ ] Service statistics display correctly
- [ ] Auto-refresh checkbox works
- [ ] Manual refresh button works
- [ ] Navigation links work

### 3. API Logs (http://localhost:3000/api-dashboard-new.html)
- [ ] Overview tab shows statistics
- [ ] API Logs tab displays logs
- [ ] Click "View" on a log entry
- [ ] Modal opens with full details
- [ ] Click copy buttons
- [ ] Verify content is copied
- [ ] Close modal (× or click outside)
- [ ] Test API Tester tab

### 4. Navigation
- [ ] Click Home link from any page
- [ ] Click System Dashboard from any page
- [ ] Click API Logs from any page
- [ ] Verify active page is highlighted

## Common Issues

**Chat not working?**
- Check browser console (F12)
- Verify server is running
- Check session was created

**Dashboard not loading?**
- Refresh the page
- Check /api/monitoring/dashboard endpoint
- Verify auto-refresh is enabled

**Modal not showing?**
- Check if logs exist
- Try clicking View on different log
- Check browser console for errors

## Quick Commands

```bash
# Start server
cd secondguess
npm run dev

# Check server status
curl http://localhost:3000/api/monitoring/health

# View logs
tail -f logs/app.log
```

## Success Indicators
- ✅ Messages send and receive
- ✅ SOP generation works
- ✅ Log details show in modal
- ✅ Copy buttons work
- ✅ Dashboard shows all metrics
- ✅ Navigation works everywhere
