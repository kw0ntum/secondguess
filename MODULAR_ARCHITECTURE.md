## Modular Speech-to-Text Architecture

This document explains the modular architecture implemented for the speech-to-text functionality.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     API Route Layer                          │
│                  (src/api/routes/speech.ts)                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   Factory Layer                              │
│            (src/services/speech-to-text-factory.ts)          │
│                                                              │
│  • Creates appropriate adapter based on config               │
│  • Manages fallback logic                                    │
│  • Provides dependency injection                             │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  Provider Adapters                           │
│           (src/services/speech-providers/)                   │
│                                                              │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │ GoogleCloudAdapter│  │   MockAdapter    │                │
│  └──────────────────┘  └──────────────────┘                │
│                                                              │
│  All implement: SpeechToTextService interface               │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   Utility Layer                              │
│                (src/utils/audio/)                            │
│                                                              │
│  • AudioQualityAnalyzer                                      │
│  • AudioFormatMapper                                         │
│  • AudioDurationEstimator                                    │
│  • TimeParser                                                │
└─────────────────────────────────────────────────────────────┘
```

## Components

### 1. Utility Modules (`src/utils/audio/`)

**Purpose:** Single-responsibility utilities for audio processing

#### AudioQualityAnalyzer
- Analyzes audio quality metrics
- Skips analysis for compressed formats
- Returns default metrics for WebM/MP3/OGG

#### AudioFormatMapper
- Maps internal formats to provider-specific encodings
- Supports Google Cloud, AWS (future)
- Validates format support

#### AudioDurationEstimator
- Estimates audio duration from stream data
- Handles both compressed and uncompressed formats

#### TimeParser
- Parses time objects from various providers
- Converts between time formats

### 2. Provider Adapters (`src/services/speech-providers/`)

**Purpose:** Implement SpeechToTextService for different providers

#### GoogleCloudAdapter
- Uses Google Cloud Speech-to-Text API
- Production-ready implementation
- Handles real transcription

#### MockAdapter
- For testing and development
- No API calls or credentials needed
- Returns mock transcriptions instantly

**Future Adapters:**
- AWSAdapter (AWS Transcribe)
- AzureAdapter (Azure Speech)
- WhisperAdapter (OpenAI Whisper)

### 3. Factory (`src/services/speech-to-text-factory.ts`)

**Purpose:** Create and manage service instances

**Features:**
- Creates adapter based on configuration
- Supports fallback providers
- Singleton pattern for efficiency
- Dependency injection

### 4. Interface (`src/interfaces/speech-to-text-service.ts`)

**Purpose:** Define contract for all adapters

All adapters must implement:
- `transcribe(audioStream): Promise<TranscriptionResult>`
- `getConfidenceScore(segment): number`
- `setLanguage(language): void`
- `getCurrentLanguage(): string`
- `isReady(): boolean`
- `startSession(): Promise<string>`
- `endSession(sessionId): Promise<void>`

## Configuration

### Environment Variables

```env
# Primary provider
SPEECH_PROVIDER=google          # or 'mock'

# Fallback configuration
SPEECH_FALLBACK_PROVIDER=mock
SPEECH_ENABLE_FALLBACK=true
```

### Usage Examples

#### Use Google Cloud (Production)
```env
SPEECH_PROVIDER=google
SPEECH_ENABLE_FALLBACK=false
```

#### Use Mock (Testing)
```env
SPEECH_PROVIDER=mock
```

#### Use Google with Mock Fallback
```env
SPEECH_PROVIDER=google
SPEECH_FALLBACK_PROVIDER=mock
SPEECH_ENABLE_FALLBACK=true
```

## Benefits

### ✅ Modularity
- Each component has a single responsibility
- Easy to understand and maintain
- Changes are isolated

### ✅ Testability
- Use MockAdapter for tests
- No API calls or credentials needed
- Fast, reliable tests

### ✅ Flexibility
- Switch providers with one config change
- Add new providers without changing existing code
- Fallback support for reliability

### ✅ Maintainability
- Bug in one adapter doesn't affect others
- Clear separation of concerns
- Easy to add features

### ✅ Scalability
- Add new providers easily
- Support multiple providers simultaneously
- Load balancing (future)

## Adding a New Provider

To add a new speech-to-text provider:

1. **Create adapter** in `src/services/speech-providers/`
   ```typescript
   export class NewProviderAdapter implements SpeechToTextService {
     // Implement all interface methods
   }
   ```

2. **Add to factory** in `speech-to-text-factory.ts`
   ```typescript
   case 'newprovider':
     return new NewProviderAdapter();
   ```

3. **Add format mapping** in `audio-format-mapper.ts`
   ```typescript
   static toNewProviderEncoding(format: string): string {
     // Map formats
   }
   ```

4. **Update config** in `.env`
   ```env
   SPEECH_PROVIDER=newprovider
   ```

That's it! No changes to routes or other code needed.

## Testing

### Unit Tests
```typescript
// Use MockAdapter for fast, reliable tests
const service = new MockAdapter();
const result = await service.transcribe(audioStream);
expect(result.text).toBeDefined();
```

### Integration Tests
```typescript
// Use factory to test with real provider
const service = SpeechToTextFactory.create({ provider: 'google' });
const result = await service.transcribe(audioStream);
```

### Fallback Tests
```typescript
// Test fallback behavior
const service = SpeechToTextFactory.createWithFallback({
  provider: 'google',
  fallbackProvider: 'mock',
  enableFallback: true
});
```

## Migration from Old Code

### Before (Tightly Coupled)
```typescript
import { SpeechToTextServiceImpl } from '../../services/speech-to-text-service';
const speechService = new SpeechToTextServiceImpl();
```

### After (Modular)
```typescript
import { SpeechToTextFactory } from '../../services/speech-to-text-factory';
const speechService = SpeechToTextFactory.createWithFallback();
```

## Files Created

```
src/
├── utils/audio/
│   ├── audio-quality-analyzer.ts
│   ├── audio-format-mapper.ts
│   ├── audio-duration-estimator.ts
│   ├── time-parser.ts
│   └── index.ts
├── services/
│   ├── speech-providers/
│   │   ├── google-cloud-adapter.ts
│   │   ├── mock-adapter.ts
│   │   └── index.ts
│   └── speech-to-text-factory.ts
```

## Files Modified

```
src/api/routes/speech.ts          # Now uses factory
.env                                # Added provider config
```

## Next Steps

1. **Add more providers** (AWS, Azure, Whisper)
2. **Implement caching** for repeated transcriptions
3. **Add metrics** to track provider performance
4. **Load balancing** across multiple providers
5. **Rate limiting** per provider
6. **Cost optimization** by choosing cheapest provider

## Summary

The modular architecture makes the speech-to-text functionality:
- **Flexible** - Easy to switch providers
- **Testable** - Mock adapter for fast tests
- **Maintainable** - Clear separation of concerns
- **Scalable** - Easy to add new providers
- **Reliable** - Fallback support

All without changing the API or breaking existing functionality!
