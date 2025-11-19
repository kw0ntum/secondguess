/**
 * Example Speech-to-Text Client
 * Demonstrates how to use the Speech API endpoints
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_BASE_URL = 'http://localhost:3000/api/speech';

class SpeechClient {
  constructor(baseUrl = API_BASE_URL) {
    this.baseUrl = baseUrl;
    this.sessionId = null;
  }

  /**
   * Check if the speech service is ready
   */
  async checkStatus() {
    try {
      const response = await axios.get(`${this.baseUrl}/status`);
      console.log('Service Status:', response.data.data);
      return response.data.data.isReady;
    } catch (error) {
      console.error('Error checking status:', error.message);
      return false;
    }
  }

  /**
   * Get list of supported languages
   */
  async getSupportedLanguages() {
    try {
      const response = await axios.get(`${this.baseUrl}/languages`);
      console.log('\nSupported Languages:');
      response.data.data.languages.forEach(lang => {
        console.log(`  ${lang.code}: ${lang.name}`);
      });
      return response.data.data.languages;
    } catch (error) {
      console.error('Error getting languages:', error.message);
      return [];
    }
  }

  /**
   * Set the transcription language
   */
  async setLanguage(languageCode) {
    try {
      const response = await axios.put(`${this.baseUrl}/language`, {
        language: languageCode
      });
      console.log(`Language set to: ${response.data.data.language}`);
      return true;
    } catch (error) {
      console.error('Error setting language:', error.message);
      return false;
    }
  }

  /**
   * Start a new transcription session
   */
  async startSession(language = 'en-US') {
    try {
      const response = await axios.post(`${this.baseUrl}/session/start`, {
        language
      });
      this.sessionId = response.data.data.sessionId;
      console.log(`\nSession started: ${this.sessionId}`);
      console.log(`Language: ${response.data.data.language}`);
      return this.sessionId;
    } catch (error) {
      console.error('Error starting session:', error.message);
      return null;
    }
  }

  /**
   * End the current session
   */
  async endSession() {
    if (!this.sessionId) {
      console.log('No active session to end');
      return false;
    }

    try {
      const response = await axios.post(`${this.baseUrl}/session/end`, {
        sessionId: this.sessionId
      });
      console.log(`\nSession ended: ${this.sessionId}`);
      this.sessionId = null;
      return true;
    } catch (error) {
      console.error('Error ending session:', error.message);
      return false;
    }
  }

  /**
   * Transcribe audio from a file
   */
  async transcribeFile(audioFilePath) {
    try {
      // Check if file exists
      if (!fs.existsSync(audioFilePath)) {
        throw new Error(`Audio file not found: ${audioFilePath}`);
      }

      // Read audio file
      console.log(`\nReading audio file: ${audioFilePath}`);
      const audioBuffer = fs.readFileSync(audioFilePath);
      const audioData = audioBuffer.toString('base64');

      // Determine format from file extension
      const ext = path.extname(audioFilePath).toLowerCase().substring(1);
      const format = ext === 'wav' ? 'wav' : 
                    ext === 'flac' ? 'flac' : 
                    ext === 'mp3' ? 'mp3' : 
                    ext === 'ogg' ? 'ogg' : 'wav';

      console.log(`Audio format: ${format}`);
      console.log(`Audio size: ${(audioBuffer.length / 1024).toFixed(2)} KB`);

      // Transcribe
      const response = await axios.post(`${this.baseUrl}/transcribe`, {
        audioData,
        sampleRate: 16000,
        channels: 1,
        format,
        sessionId: this.sessionId
      });

      const result = response.data.data;
      console.log('\n=== Transcription Result ===');
      console.log(`Text: "${result.text}"`);
      console.log(`Confidence: ${(result.confidence * 100).toFixed(2)}%`);
      console.log(`Language: ${result.language}`);
      console.log(`Segments: ${result.segments.length}`);
      
      if (result.segments.length > 0) {
        console.log('\nWord-level details:');
        result.segments.slice(0, 10).forEach((segment, i) => {
          console.log(`  ${i + 1}. "${segment.text}" (${(segment.confidence * 100).toFixed(1)}%) [${segment.startTime.toFixed(2)}s - ${segment.endTime.toFixed(2)}s]`);
        });
        if (result.segments.length > 10) {
          console.log(`  ... and ${result.segments.length - 10} more segments`);
        }
      }

      return result;
    } catch (error) {
      if (error.response) {
        console.error('API Error:', error.response.data);
      } else {
        console.error('Error transcribing file:', error.message);
      }
      return null;
    }
  }

  /**
   * Transcribe audio from base64 data
   */
  async transcribeBase64(audioData, options = {}) {
    try {
      const {
        sampleRate = 16000,
        channels = 1,
        format = 'wav'
      } = options;

      const response = await axios.post(`${this.baseUrl}/transcribe`, {
        audioData,
        sampleRate,
        channels,
        format,
        sessionId: this.sessionId
      });

      return response.data.data;
    } catch (error) {
      console.error('Error transcribing audio:', error.message);
      return null;
    }
  }

  /**
   * Get confidence score for text
   */
  async getConfidenceScore(text) {
    try {
      const response = await axios.post(`${this.baseUrl}/confidence`, {
        text
      });
      const confidence = response.data.data.confidence;
      console.log(`Confidence for "${text}": ${(confidence * 100).toFixed(2)}%`);
      return confidence;
    } catch (error) {
      console.error('Error getting confidence:', error.message);
      return 0;
    }
  }
}

/**
 * Example usage
 */
async function main() {
  console.log('=== Speech-to-Text Client Example ===\n');

  const client = new SpeechClient();

  // 1. Check service status
  console.log('1. Checking service status...');
  const isReady = await client.checkStatus();
  
  if (!isReady) {
    console.error('\n❌ Speech service is not ready!');
    console.error('Please check:');
    console.error('  - Google Cloud credentials are configured');
    console.error('  - Speech-to-Text API is enabled');
    console.error('  - Service account has correct permissions');
    process.exit(1);
  }

  console.log('✅ Service is ready!\n');

  // 2. Get supported languages
  console.log('2. Getting supported languages...');
  await client.getSupportedLanguages();

  // 3. Start a session
  console.log('\n3. Starting transcription session...');
  await client.startSession('en-US');

  // 4. Transcribe audio file (if provided)
  const audioFilePath = process.argv[2];
  if (audioFilePath) {
    console.log('\n4. Transcribing audio file...');
    await client.transcribeFile(audioFilePath);
  } else {
    console.log('\n4. No audio file provided');
    console.log('Usage: node speech-client-example.js <path-to-audio-file.wav>');
    console.log('\nTo test transcription, provide a WAV audio file as an argument.');
  }

  // 5. Test confidence scoring
  console.log('\n5. Testing confidence scoring...');
  await client.getConfidenceScore('This is a well-formed sentence.');
  await client.getConfidenceScore('thisisnotgood');
  await client.getConfidenceScore('');

  // 6. End session
  console.log('\n6. Ending session...');
  await client.endSession();

  console.log('\n=== Example Complete ===');
}

// Run the example
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = SpeechClient;
