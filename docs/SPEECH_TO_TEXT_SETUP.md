# Speech-to-Text Service Setup Guide

This guide will walk you through setting up the Google Cloud Speech-to-Text service for the AI Voice SOP Agent.

## Prerequisites

- Node.js 18+ installed
- A Google Cloud Platform (GCP) account
- Project dependencies installed (`npm install`)

## Step 1: Google Cloud Platform Setup

### 1.1 Create a GCP Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top
3. Click "New Project"
4. Enter a project name (e.g., "ai-voice-sop-agent")
5. Click "Create"

### 1.2 Enable Speech-to-Text API

1. In the GCP Console, go to "APIs & Services" > "Library"
2. Search for "Cloud Speech-to-Text API"
3. Click on it and press "Enable"
4. Wait for the API to be enabled (usually takes a few seconds)

### 1.3 Create Service Account

1. Go to "IAM & Admin" > "Service Accounts"
2. Click "Create Service Account"
3. Enter details:
   - **Name**: `speech-to-text-service`
   - **Description**: `Service account for Speech-to-Text API access`
4. Click "Create and Continue"
5. Grant the role: **Cloud Speech Client** or **Cloud Speech Administrator**
6. Click "Continue" then "Done"

### 1.4 Create and Download Service Account Key

1. Find your newly created service account in the list
2. Click on the three dots (⋮) on the right
3. Select "Manage keys"
4. Click "Add Key" > "Create new key"
5. Choose "JSON" format
6. Click "Create"
7. The JSON key file will download automatically
8. **IMPORTANT**: Keep this file secure and never commit it to version control!

## Step 2: Project Configuration

### 2.1 Place the Credentials File

1. Rename the downloaded JSON file to `google-credentials.json`
2. Place it in the root directory of your project:
   ```
   V_secondguess/secondguess/google-credentials.json
   ```

### 2.2 Update .gitignore

Make sure your `.gitignore` includes:
```
google-credentials.json
*.json
!package.json
!package-lock.json
!tsconfig.json
```

### 2.3 Configure Environment Variables

Your `.env` file should already have these settings (already configured):

```bash
# Google Cloud Speech-to-Text
GOOGLE_APPLICATION_CREDENTIALS=./google-credentials.json
SPEECH_LANGUAGE=en-US
SPEECH_CONFIDENCE_THRESHOLD=0.7
SPEECH_MODEL=latest_long
SPEECH_ENABLE_ENHANCED=true
SPEECH_MAX_ALTERNATIVES=1
SPEECH_PROFANITY_FILTER=false
SPEECH_ENABLE_WORD_TIME_OFFSETS=true
SPEECH_ENABLE_AUTOMATIC_PUNCTUATION=true
```

## Step 3: Verify Installation

### 3.1 Build the Project

```bash
npm run build
```

### 3.2 Start the Development Server

```bash
npm run dev
```

### 3.3 Check Service Status

Open a new terminal and run:

```bash
curl http://localhost:3000/api/speech/status
```

You should see:
```json
{
  "success": true,
  "data": {
    "isReady": true,
    "currentLanguage": "en-US",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

If `isReady` is `false`, check:
- Your credentials file path is correct
- The credentials file is valid JSON
- The Speech-to-Text API is enabled in GCP
- Your service account has the correct permissions

## Step 4: Test the Service

### 4.1 Get Supported Languages

```bash
curl http://localhost:3000/api/speech/languages
```

### 4.2 Start a Speech Session

```bash
curl -X POST http://localhost:3000/api/speech/session/start \
  -H "Content-Type: application/json" \
  -d '{"language": "en-US"}'
```

### 4.3 Test Transcription

Create a test script `test-transcription.js`:

```javascript
const fs = require('fs');
const axios = require('axios');

async function testTranscription() {
  // Read an audio file (you'll need a WAV file for testing)
  const audioBuffer = fs.readFileSync('./test-audio.wav');
  const audioData = audioBuffer.toString('base64');

  try {
    const response = await axios.post('http://localhost:3000/api/speech/transcribe', {
      audioData,
      sampleRate: 16000,
      channels: 1,
      format: 'wav'
    });

    console.log('Transcription Result:');
    console.log('Text:', response.data.data.text);
    console.log('Confidence:', response.data.data.confidence);
    console.log('Segments:', response.data.data.segments.length);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testTranscription();
```

Run it:
```bash
node test-transcription.js
```

## API Endpoints

### POST /api/speech/transcribe
Transcribe audio to text.

**Request:**
```json
{
  "audioData": "base64-encoded-audio",
  "sampleRate": 16000,
  "channels": 1,
  "format": "wav",
  "sessionId": "optional-session-id"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "text": "transcribed text",
    "confidence": 0.95,
    "segments": [...],
    "language": "en-US",
    "sessionId": "session-123",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

### POST /api/speech/session/start
Start a new transcription session.

**Request:**
```json
{
  "language": "en-US"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "session-123",
    "language": "en-US",
    "startTime": "2024-01-01T00:00:00.000Z"
  }
}
```

### POST /api/speech/session/end
End an active session.

**Request:**
```json
{
  "sessionId": "session-123"
}
```

### GET /api/speech/languages
Get list of supported languages.

### PUT /api/speech/language
Update the transcription language.

**Request:**
```json
{
  "language": "es-ES"
}
```

### GET /api/speech/status
Check service status and readiness.

### POST /api/speech/confidence
Calculate confidence score for text.

**Request:**
```json
{
  "text": "sample text"
}
```

## Supported Audio Formats

- **WAV** (Recommended): Uncompressed, best quality
- **FLAC**: Lossless compression
- **MP3**: Lossy compression, smaller files
- **OGG**: Ogg Opus format

### Recommended Audio Settings

- **Sample Rate**: 16000 Hz (minimum), 48000 Hz (optimal)
- **Channels**: 1 (mono) for speech
- **Bit Depth**: 16-bit
- **Format**: WAV or FLAC for best results

## Supported Languages

The service supports 100+ languages. Common ones include:

- English: `en-US`, `en-GB`, `en-AU`, `en-CA`
- Spanish: `es-ES`, `es-MX`, `es-AR`
- French: `fr-FR`, `fr-CA`
- German: `de-DE`
- Italian: `it-IT`
- Portuguese: `pt-BR`, `pt-PT`
- Japanese: `ja-JP`
- Korean: `ko-KR`
- Chinese: `zh-CN`, `zh-TW`
- Russian: `ru-RU`
- Arabic: `ar-SA`
- Hindi: `hi-IN`

[Full list of supported languages](https://cloud.google.com/speech-to-text/docs/languages)

## Troubleshooting

### Error: "Speech-to-Text service is not ready"

**Causes:**
- Credentials file not found or invalid
- API not enabled in GCP
- Service account lacks permissions

**Solutions:**
1. Verify credentials file path in `.env`
2. Check file exists: `ls -la google-credentials.json`
3. Verify API is enabled in GCP Console
4. Check service account has "Cloud Speech Client" role

### Error: "PERMISSION_DENIED"

**Solution:**
- Go to GCP Console > IAM & Admin > Service Accounts
- Find your service account
- Add role: "Cloud Speech Client" or "Cloud Speech Administrator"

### Error: "INVALID_ARGUMENT"

**Causes:**
- Invalid audio format
- Incorrect sample rate
- Corrupted audio data

**Solutions:**
- Verify audio format matches the specified format
- Ensure sample rate is at least 8000 Hz
- Check audio data is properly base64 encoded

### Low Confidence Scores

**Solutions:**
- Use higher sample rate (48000 Hz)
- Reduce background noise
- Use better quality microphone
- Speak clearly and at moderate pace
- Enable enhanced models in configuration

### High API Costs

**Solutions:**
- Use standard models instead of enhanced
- Reduce sample rate to 16000 Hz
- Implement caching for repeated phrases
- Use shorter audio clips
- Monitor usage in GCP Console

## Cost Estimation

Google Cloud Speech-to-Text pricing (as of 2024):

- **Standard Models**: $0.006 per 15 seconds
- **Enhanced Models**: $0.009 per 15 seconds
- **Data Logging**: Free tier available

**Example:**
- 1 hour of audio with standard model: ~$1.44
- 1 hour of audio with enhanced model: ~$2.16

[Current pricing](https://cloud.google.com/speech-to-text/pricing)

## Best Practices

1. **Audio Quality**: Use high-quality audio (16+ kHz, mono, WAV/FLAC)
2. **Session Management**: Reuse sessions for related transcriptions
3. **Error Handling**: Implement retry logic for network failures
4. **Confidence Thresholds**: Set appropriate thresholds (0.7-0.8)
5. **Language Detection**: Use correct language codes for best results
6. **Monitoring**: Track API usage and costs regularly
7. **Security**: Never commit credentials to version control
8. **Caching**: Cache common phrases to reduce API calls

## Production Deployment

### Environment Variables

For production, use environment variables instead of `.env` file:

```bash
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/credentials.json
export SPEECH_LANGUAGE=en-US
export SPEECH_CONFIDENCE_THRESHOLD=0.8
```

### Using Google Cloud Secret Manager

For better security in production:

1. Store credentials in Secret Manager
2. Grant service access to secrets
3. Load credentials at runtime

### Monitoring

Set up monitoring for:
- API usage and costs
- Error rates
- Transcription confidence scores
- Response times

## Additional Resources

- [Google Cloud Speech-to-Text Documentation](https://cloud.google.com/speech-to-text/docs)
- [Node.js Client Library](https://github.com/googleapis/nodejs-speech)
- [Best Practices Guide](https://cloud.google.com/speech-to-text/docs/best-practices)
- [Supported Languages](https://cloud.google.com/speech-to-text/docs/languages)
- [Pricing Calculator](https://cloud.google.com/products/calculator)

## Support

If you encounter issues:

1. Check the logs: `tail -f logs/app.log`
2. Verify service status: `GET /api/speech/status`
3. Review GCP Console for API errors
4. Check service account permissions
5. Consult Google Cloud documentation
