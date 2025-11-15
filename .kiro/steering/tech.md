# Technology Stack

## Runtime & Language

- **Node.js 18+** (LTS recommended)
- **TypeScript 5.7+** with strict mode enabled
- **Target**: ES2020, CommonJS modules

## Core Framework & Libraries

### Backend
- **Express.js** - Web framework with comprehensive middleware
- **Socket.io** - Real-time communication
- **JWT + bcrypt** - Authentication and password hashing
- **Joi** - Request validation
- **Winston** - Structured logging

### Document Processing
- **Puppeteer** - PDF generation
- **docx** - Word document generation
- **pdf-lib** - PDF manipulation
- **marked** - Markdown processing

### Visualization
- **Mermaid** - Diagram generation
- **D3.js** - Data visualization
- **Chart.js** - Chart generation

### Security & Performance
- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing
- **Compression** - Response compression
- **express-rate-limit** - Rate limiting

### Testing
- **Jest** - Testing framework
- **ts-jest** - TypeScript support for Jest
- **Supertest** - HTTP assertion library

## Build System

### Build Tools
- **TypeScript Compiler (tsc)** - Transpilation
- **tsc-alias** - Path alias resolution
- **ts-node** - Development execution
- **tsconfig-paths** - Path mapping support

### Code Quality
- **ESLint** - Linting with TypeScript plugin
- **@typescript-eslint/parser** - TypeScript parsing
- **@typescript-eslint/eslint-plugin** - TypeScript rules

## Common Commands

```bash
# Development
npm run dev              # Start dev server with hot reload
npm run build            # Build for production
npm start                # Start production server

# Testing
npm test                 # Run all tests
npm run test:watch       # Run tests in watch mode

# Code Quality
npm run lint             # Check code style
npm run lint:fix         # Fix linting issues

# Deployment
npm run vercel-build     # Build for Vercel deployment
```

## Path Aliases

The project uses TypeScript path aliases for cleaner imports:

```typescript
@/*              -> src/*
@/interfaces/*   -> src/interfaces/*
@/models/*       -> src/models/*
@/services/*     -> src/services/*
@/utils/*        -> src/utils/*
```

## TypeScript Configuration

- **Strict mode enabled** - All strict checks active
- **No implicit any** - Explicit typing required
- **Strict null checks** - Null safety enforced
- **No unchecked indexed access** - Array/object safety
- **Exact optional properties** - Precise optional handling
- **Source maps** - Debugging support
- **Declaration files** - Type definitions generated

## Environment Variables

Key configuration via `.env` file:
- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port (default: 3000)
- `JWT_SECRET` - Authentication secret
- `LOG_LEVEL` - Logging verbosity (debug/info/warn/error)
- Rate limiting, monitoring, and performance thresholds
