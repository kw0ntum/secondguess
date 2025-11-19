/**
 * Speech-to-Text API Routes
 * Handles audio transcription and speech processing endpoints
 */

import { Router, Request, Response } from 'express';
import { SpeechToTextServiceImpl } from '../../services/speech-to-text-service';
import { AudioStream, AudioFormat } from '../../models';
import { logger } from '../../utils/logger';
import { validateAudioStream } from '../../models/conversation-models';

const router = Router();
const speechService = new SpeechToTextServiceImpl();

/**
 * POST /api/speech/transcribe
 * Transcribe audio to text
 */
router.post('/transcribe', async (req: Request, res: Response) => {
  try {
    const { audioData, sampleRate, channels, format, sessionId } = req.body;

    // Validate required fields
    if (!audioData) {
      res.status(400).json({
        success: false,
        error: 'Missing required field: audioData'
      });
      return;
    }

    // Convert base64 audio data to ArrayBuffer
    const buffer = Buffer.from(audioData, 'base64');
    
    // Check if buffer has data
    if (buffer.length === 0) {
      res.status(400).json({
        success: false,
        error: 'Audio data is empty'
      });
      return;
    }
    
    // Convert Buffer to ArrayBuffer properly
    const arrayBuffer = buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength
    );

    // Normalize format to lowercase
    const normalizedFormat = format ? format.toLowerCase() : 'wav';
    
    // Create AudioStream object
    const audioStream: AudioStream = {
      data: arrayBuffer,
      sampleRate: sampleRate || 16000,
      channels: channels || 1,
      format: (normalizedFormat as AudioFormat) || AudioFormat.WAV,
      timestamp: new Date()
    };

    // Validate audio stream
    if (!validateAudioStream(audioStream)) {
      res.status(400).json({
        success: false,
        error: 'Invalid audio stream data',
        details: {
          hasData: !!audioStream.data,
          dataLength: arrayBuffer.byteLength,
          sampleRate: audioStream.sampleRate,
          channels: audioStream.channels,
          format: audioStream.format
        }
      });
      return;
    }

    // Check if service is ready
    if (!speechService.isReady()) {
      res.status(503).json({
        success: false,
        error: 'Speech-to-Text service is not ready. Please check your Google Cloud credentials.'
      });
      return;
    }

    // Perform transcription
    const result = await speechService.transcribe(audioStream);

    logger.info('Transcription completed', {
      sessionId: sessionId || result.sessionId,
      textLength: result.text.length,
      confidence: result.confidence,
      segmentCount: result.segments.length
    });

    res.json({
      success: true,
      data: {
        text: result.text,
        confidence: result.confidence,
        segments: result.segments,
        language: result.language,
        sessionId: result.sessionId,
        timestamp: result.timestamp
      }
    });

  } catch (error: any) {
    logger.error('Transcription failed:', error);
    res.status(500).json({
      success: false,
      error: 'Transcription failed',
      message: error.message
    });
  }
});

/**
 * POST /api/speech/session/start
 * Start a new speech-to-text session
 */
router.post('/session/start', async (req: Request, res: Response) => {
  try {
    const { language } = req.body;

    // Set language if provided
    if (language) {
      speechService.setLanguage(language);
    }

    // Start session
    const sessionId = await speechService.startSession();

    logger.info('Speech session started', {
      sessionId,
      language: speechService.getCurrentLanguage()
    });

    res.json({
      success: true,
      data: {
        sessionId,
        language: speechService.getCurrentLanguage(),
        startTime: new Date()
      }
    });

  } catch (error: any) {
    logger.error('Failed to start speech session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start session',
      message: error.message
    });
  }
});

/**
 * POST /api/speech/session/end
 * End an active speech-to-text session
 */
router.post('/session/end', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      res.status(400).json({
        success: false,
        error: 'Missing required field: sessionId'
      });
      return;
    }

    await speechService.endSession(sessionId);

    logger.info('Speech session ended', { sessionId });

    res.json({
      success: true,
      data: {
        sessionId,
        endTime: new Date()
      }
    });

  } catch (error: any) {
    logger.error('Failed to end speech session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to end session',
      message: error.message
    });
  }
});

/**
 * GET /api/speech/languages
 * Get list of supported languages
 */
router.get('/languages', (req: Request, res: Response) => {
  const supportedLanguages = [
    { code: 'en-US', name: 'English (US)' },
    { code: 'en-GB', name: 'English (UK)' },
    { code: 'es-ES', name: 'Spanish (Spain)' },
    { code: 'es-MX', name: 'Spanish (Mexico)' },
    { code: 'fr-FR', name: 'French (France)' },
    { code: 'de-DE', name: 'German (Germany)' },
    { code: 'it-IT', name: 'Italian (Italy)' },
    { code: 'pt-BR', name: 'Portuguese (Brazil)' },
    { code: 'pt-PT', name: 'Portuguese (Portugal)' },
    { code: 'ja-JP', name: 'Japanese (Japan)' },
    { code: 'ko-KR', name: 'Korean (South Korea)' },
    { code: 'zh-CN', name: 'Chinese (Simplified)' },
    { code: 'zh-TW', name: 'Chinese (Traditional)' },
    { code: 'ru-RU', name: 'Russian (Russia)' },
    { code: 'ar-SA', name: 'Arabic (Saudi Arabia)' },
    { code: 'hi-IN', name: 'Hindi (India)' }
  ];

  res.json({
    success: true,
    data: {
      languages: supportedLanguages,
      currentLanguage: speechService.getCurrentLanguage()
    }
  });
});

/**
 * PUT /api/speech/language
 * Update the language for transcription
 */
router.put('/language', (req: Request, res: Response) => {
  try {
    const { language } = req.body;

    if (!language) {
      res.status(400).json({
        success: false,
        error: 'Missing required field: language'
      });
      return;
    }

    speechService.setLanguage(language);

    logger.info('Language updated', { language });

    res.json({
      success: true,
      data: {
        language: speechService.getCurrentLanguage()
      }
    });

  } catch (error: any) {
    logger.error('Failed to update language:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update language',
      message: error.message
    });
  }
});

/**
 * GET /api/speech/status
 * Check speech service status
 */
router.get('/status', (req: Request, res: Response) => {
  const isReady = speechService.isReady();
  const currentLanguage = speechService.getCurrentLanguage();

  res.json({
    success: true,
    data: {
      isReady,
      currentLanguage,
      timestamp: new Date()
    }
  });
});

/**
 * POST /api/speech/confidence
 * Get confidence score for a text segment
 */
router.post('/confidence', (req: Request, res: Response) => {
  try {
    const { text } = req.body;

    if (!text) {
      res.status(400).json({
        success: false,
        error: 'Missing required field: text'
      });
      return;
    }

    const confidence = speechService.getConfidenceScore(text);

    res.json({
      success: true,
      data: {
        text,
        confidence
      }
    });

  } catch (error: any) {
    logger.error('Failed to calculate confidence:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate confidence',
      message: error.message
    });
  }
});

export default router;
