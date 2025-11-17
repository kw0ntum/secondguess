# URL Guide - Quick Reference

## New Modern Pages (Recommended)

| Page | URL | Description |
|------|-----|-------------|
| **Home** | http://localhost:3000/new | Modern chat interface with AI |
| **API Dashboard** | http://localhost:3000/api-dashboard-new.html | API monitoring and testing |
| **Test Page** | http://localhost:3000/test | Automated API connection tests |
| **Diagnostic** | http://localhost:3000/diagnostic | Connection diagnostic tool |

## Original Pages (Legacy)

| Page | URL | Description |
|------|-----|-------------|
| Home (Old) | http://localhost:3000/ | Original interface |
| API Dashboard (Old) | http://localhost:3000/api-dashboard.html | Original dashboard |
| Test (Old) | http://localhost:3000/test.html | Original test page |
| Diagnostic (Old) | http://localhost:3000/diagnostic.html | Original diagnostic |

## System Pages

| Page | URL | Description |
|------|-----|-------------|
| System Dashboard | http://localhost:3000/dashboard | System monitoring dashboard |
| Health Check | http://localhost:3000/api/monitoring/health | API health endpoint |

## Navigation Flow

```
┌─────────────────────────────────────────────────────┐
│                    All Pages Have                    │
│                                                      │
│  🏠 Home  →  /new                                   │
│  📈 System Dashboard  →  /dashboard                 │
│  🔍 API Logs  →  /api-dashboard-new.html           │
└─────────────────────────────────────────────────────┘
```

## Quick Start

1. **Start the server:**
   ```bash
   cd secondguess
   npm run dev
   ```

2. **Open your browser:**
   - Main app: http://localhost:3000/new
   - Monitor APIs: http://localhost:3000/api-dashboard-new.html

3. **Test everything:**
   - Run tests: http://localhost:3000/test
   - Diagnose issues: http://localhost:3000/diagnostic

## Tips

- All new pages have consistent navigation in the header
- Click any navigation link to move between pages
- The active page is highlighted in the navigation
- All pages are fully responsive and work on mobile
- Use Ctrl/Cmd + Shift + R to hard refresh if you see old content
