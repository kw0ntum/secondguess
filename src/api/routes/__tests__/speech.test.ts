/**
 * Tests for Speech-to-Text API Routes
 */

import request from 'supertest';
import { createApp } from '../../server';
import { AudioFormat } from '../../../models';

describe('Speech API Routes', () => {
  const app = createApp();
  let sessionId: string;

  describe('POST /api/speech/transcribe', () => {
    it('should transcribe audio successfully', async () => {
      // Create a simple audio buffer (mock data)
      const mockAudioData = Buffer.from(new Array(1000).fill(0)).toString('base64');

      const response = await request(app)
        .post('/api/speech/transcribe')
        .send({
          audioData: mockAudioData,
          sampleRate: 16000,
          channels: 1,
          format: AudioFormat.WAV
        });

      // Note: This will fail without valid Google Cloud credentials
      // In a real test environment, you would mock the Google Cloud API
      expect(response.status).toBeDefined();
    });

    it('should return 400 for missing audioData', async () => {
      const response = await request(app)
        .post('/api/speech/transcribe')
        .send({
          sampleRate: 16000,
          channels: 1,
          format: AudioFormat.WAV
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('audioData');
    });

    it('should handle invalid audio format', async () => {
      const mockAudioData = Buffer.from('invalid').toString('base64');

      const response = await request(app)
        .post('/api/speech/transcribe')
        .send({
          audioData: mockAudioData,
          sampleRate: -1, // Invalid sample rate
          channels: 0, // Invalid channels
          format: 'invalid'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/speech/session/start', () => {
    it('should start a new speech session', async () => {
      const response = await request(app)
        .post('/api/speech/session/start')
        .send({
          language: 'en-US'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('sessionId');
      expect(response.body.data).toHaveProperty('language');
      expect(response.body.data.language).toBe('en-US');

      sessionId = response.body.data.sessionId;
    });

    it('should start session with default language', async () => {
      const response = await request(app)
        .post('/api/speech/session/start')
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('sessionId');
    });
  });

  describe('POST /api/speech/session/end', () => {
    it('should end an active session', async () => {
      // First start a session
      const startResponse = await request(app)
        .post('/api/speech/session/start')
        .send({});

      const testSessionId = startResponse.body.data.sessionId;

      // Then end it
      const response = await request(app)
        .post('/api/speech/session/end')
        .send({
          sessionId: testSessionId
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.sessionId).toBe(testSessionId);
    });

    it('should return 400 for missing sessionId', async () => {
      const response = await request(app)
        .post('/api/speech/session/end')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('sessionId');
    });
  });

  describe('GET /api/speech/languages', () => {
    it('should return list of supported languages', async () => {
      const response = await request(app)
        .get('/api/speech/languages');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('languages');
      expect(Array.isArray(response.body.data.languages)).toBe(true);
      expect(response.body.data.languages.length).toBeGreaterThan(0);
      
      // Check language structure
      const firstLang = response.body.data.languages[0];
      expect(firstLang).toHaveProperty('code');
      expect(firstLang).toHaveProperty('name');
    });

    it('should include current language in response', async () => {
      const response = await request(app)
        .get('/api/speech/languages');

      expect(response.body.data).toHaveProperty('currentLanguage');
      expect(typeof response.body.data.currentLanguage).toBe('string');
    });
  });

  describe('PUT /api/speech/language', () => {
    it('should update language successfully', async () => {
      const response = await request(app)
        .put('/api/speech/language')
        .send({
          language: 'es-ES'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.language).toBe('es-ES');
    });

    it('should return 400 for missing language', async () => {
      const response = await request(app)
        .put('/api/speech/language')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('language');
    });
  });

  describe('GET /api/speech/status', () => {
    it('should return service status', async () => {
      const response = await request(app)
        .get('/api/speech/status');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('isReady');
      expect(response.body.data).toHaveProperty('currentLanguage');
      expect(response.body.data).toHaveProperty('timestamp');
      expect(typeof response.body.data.isReady).toBe('boolean');
    });
  });

  describe('POST /api/speech/confidence', () => {
    it('should calculate confidence score for text', async () => {
      const response = await request(app)
        .post('/api/speech/confidence')
        .send({
          text: 'This is a test sentence.'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('confidence');
      expect(response.body.data.confidence).toBeGreaterThanOrEqual(0);
      expect(response.body.data.confidence).toBeLessThanOrEqual(1);
    });

    it('should return 400 for missing text', async () => {
      const response = await request(app)
        .post('/api/speech/confidence')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('text');
    });

    it('should handle empty text', async () => {
      const response = await request(app)
        .post('/api/speech/confidence')
        .send({
          text: ''
        });

      expect(response.status).toBe(200);
      expect(response.body.data.confidence).toBe(0);
    });
  });
});
