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
    const { audioData, format } = req.body;

    if (!audioData) {
      res.status(400).json({ error: 'Audio data is required' });
      return;
    }

    const result = await speechService.transcribe(audioData, format || 'webm');

    res.json({
      transcript: result.transcript,
      confidence: result.confidence,
    });
  } catch (error) {
    logger.error('Speech transcription error:', error);
    res.status(500).json({ error: 'Transcription failed' });
  }
});

export default router;
