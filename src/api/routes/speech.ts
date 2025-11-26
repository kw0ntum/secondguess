/**
 * Speech API Routes
 */

import { Router, Request, Response } from 'express';
import { SpeechService } from '@/services/speech-service';
import { logger } from '@/utils/logger';

const router = Router();
const speechService = new SpeechService();

/**
 * POST /api/speech/transcribe
 * Transcribe audio to text
 */
router.post('/transcribe', async (req: Request, res: Response): Promise<void> => {
  try {
    const { audioData, format, sampleRate, channels } = req.body;

    if (!audioData) {
      res.status(400).json({ error: 'Audio data is required' });
      return;
    }

    // Convert base64 audio data to ArrayBuffer
    const buffer = Buffer.from(audioData, 'base64');
    const audioStream = {
      data: buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength),
      sampleRate: sampleRate || 16000,
      channels: channels || 1,
      format: format || 'webm',
      timestamp: new Date()
    };

    const result = await speechService.transcribe(audioStream);

    res.json({
      text: result.text,
      confidence: result.confidence,
      segments: result.segments,
      language: result.language
    });
  } catch (error) {
    logger.error('Speech transcription error:', error);
    res.status(500).json({ error: 'Transcription failed' });
  }
});

export default router;
