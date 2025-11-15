# Project Structure

## Directory Organization

```
src/
├── api/                 # REST API layer
│   ├── routes/          # Route handlers (session, conversation, sop, monitoring, auth, dashboard)
│   ├── middleware/      # Express middleware (auth, rate-limiter, error-handler, monitoring, validation)
│   ├── services/        # API-specific services (auth.service.ts)
│   ├── types/           # API type definitions
│   ├── server.ts        # Express app configuration
│   └── __tests__/       # API integration tests
│
├── services/            # Core business logic (singleton pattern via ServiceContainer)
│   ├── conversation-manager-service.ts
│   ├── sop-generator-service.ts
│   ├── document-exporter-service.ts
│   ├── visual-generator-service.ts
│   ├── document-versioning-service.ts
│   ├── feedback-processor-service.ts
│   ├── voice-user-interface-service.ts
│   ├── service-container.ts      # Singleton service instances
│   └── __tests__/                # Service unit tests
│
├── models/              # Data models and type definitions
│   ├── conversation-models.ts    # Session, conversation types
│   ├── workflow-models.ts        # Workflow definitions
│   ├── sop-models.ts            # SOP document structure
│   ├── chart-models.ts          # Visualization types
│   ├── validation-models.ts     # Validation results
│   ├── versioning-models.ts     # Version control types
│   ├── feedback-models.ts       # Feedback types
│   ├── enums.ts                 # Shared enumerations
│   └── __tests__/               # Model tests
│
├── interfaces/          # Service interfaces (contracts)
│   ├── conversation-manager.ts
│   ├── sop-generator.ts
│   ├── document-exporter.ts
│   ├── visual-generator.ts
│   ├── speech-to-text-service.ts
│   ├── text-to-speech-service.ts
│   └── voice-user-interface.ts
│
├── utils/               # Utility functions and system components
│   ├── logger.ts               # Winston-based logging
│   ├── config.ts               # Configuration management
│   ├── service-monitor.ts      # Service call monitoring
│   ├── system-monitor.ts       # System health monitoring
│   ├── alerting.ts            # Alert management
│   ├── error-recovery.ts      # Error handling utilities
│   ├── validation-utils.ts    # Validation helpers
│   ├── audio-utils.ts         # Audio processing
│   └── __tests__/             # Utility tests
│
├── ui/                  # Frontend components (React-based)
│   ├── components/      # Reusable UI components
│   ├── styles/          # Component styling
│   └── __tests__/       # UI component tests
│
├── test/                # Test configuration
│   └── setup.ts         # Jest setup
│
└── index.ts            # Application entry point
```

## Architectural Patterns

### Service Container Pattern
All core services use singleton pattern via `ServiceContainer` to maintain shared state across routes:
```typescript
ServiceContainer.getConversationManager()
ServiceContainer.getSOPGenerator()
ServiceContainer.getDocumentExporter()
ServiceContainer.getVisualGenerator()
```

### Layered Architecture
1. **API Layer** (`src/api/`) - HTTP endpoints, middleware, request/response handling
2. **Service Layer** (`src/services/`) - Business logic, orchestration
3. **Model Layer** (`src/models/`) - Data structures, type definitions
4. **Interface Layer** (`src/interfaces/`) - Service contracts
5. **Utility Layer** (`src/utils/`) - Cross-cutting concerns (logging, monitoring, config)

### Middleware Stack (in order)
1. Security (Helmet)
2. CORS
3. Compression
4. Body parsing
5. Comprehensive monitoring
6. Rate limiting (route-specific)
7. Route-specific monitoring
8. Authentication (where required)
9. Route handlers
10. Error tracking
11. Global error handler

## File Naming Conventions

- **Services**: `{name}-service.ts` (e.g., `conversation-manager-service.ts`)
- **Models**: `{domain}-models.ts` (e.g., `conversation-models.ts`)
- **Routes**: `{resource}.ts` or `{resource}.routes.ts`
- **Middleware**: `{purpose}.ts` (e.g., `auth.ts`, `rate-limiter.ts`)
- **Tests**: `{name}.test.ts` in `__tests__/` subdirectories
- **Interfaces**: `{service-name}.ts` (e.g., `conversation-manager.ts`)

## Import Patterns

Use path aliases for cleaner imports:
```typescript
import { ConversationSession } from '@/models/conversation-models';
import { logger } from '@/utils/logger';
import { IConversationManager } from '@/interfaces/conversation-manager';
import { ConversationManagerService } from '@/services/conversation-manager-service';
```

## Testing Organization

- Tests colocated with source in `__tests__/` subdirectories
- Test types: unit, integration, end-to-end, performance, system
- Test helpers in `src/api/__tests__/test-helpers.ts`
- Jest configuration in `jest.config.js`
- Test setup in `src/test/setup.ts`

## Output Directories

- `dist/` - Compiled TypeScript output (gitignored)
- `exports/` - Generated SOP documents
- `logs/` - Application logs (gitignored)
- `temp/` - Temporary files for processing (gitignored)
- `public/` - Static files (HTML, diagnostic pages)
