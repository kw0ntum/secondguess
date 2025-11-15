import { Router, Request, Response } from 'express';
import { ServiceContainer } from '../../services/service-container';
import { authenticateUser } from '../middleware/auth';
import { logger } from '../../utils/logger';
import { ApiError } from '../types/api-types';
import { GeminiSummarizationService } from '../../services/gemini-summarization-service';

const router = Router();
const geminiService = new GeminiSummarizationService();

/**
 * POST /api/summarization/:sessionId/generate
 * Generate AI-powered workflow summary
 */
router.post('/:sessionId/generate', authenticateUser, async (req: Request, res: Response): Promise<void> => {
  try {
    const sessionId = req.params.sessionId!;
    const conversationManager = ServiceContainer.getConversationManager();
    
    // Get session data
    const session = await conversationManager.getSession(sessionId);
    if (!session) {
      const apiError: ApiError = {
        code: 'SESSION_NOT_FOUND',
        message: 'Session not found',
        details: `No session found with ID: ${sessionId}`
      };
      res.status(404).json({ error: apiError });
      return;
    }

    // Generate summary using Gemini with session-scoped feedback
    const summary = await geminiService.generateWorkflowSummary(
      sessionId,
      session.conversationHistory,
      session.workflowData
    );

    logger.info('AI workflow summary generated', { 
      sessionId, 
      summaryId: summary.id,
      completenessScore: summary.completenessScore 
    });

    res.json({
      success: true,
      summary,
      message: 'Workflow summary generated successfully'
    });
    
  } catch (error) {
    logger.error('Failed to generate AI summary:', error);
    const apiError: ApiError = {
      code: 'SUMMARY_GENERATION_FAILED',
      message: 'Failed to generate workflow summary',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
    res.status(500).json({ error: apiError });
  }
});

/**
 * POST /api/summarization/:sessionId/feedback
 * Submit feedback on a generated summary
 */
router.post('/:sessionId/feedback', authenticateUser, async (req: Request, res: Response): Promise<void> => {
  try {
    const sessionId = req.params.sessionId!;
    const { summaryId, isApproved, userComments } = req.body;

    if (!summaryId || typeof isApproved !== 'boolean') {
      const apiError: ApiError = {
        code: 'INVALID_FEEDBACK',
        message: 'Invalid feedback data',
        details: 'summaryId and isApproved are required'
      };
      res.status(400).json({ error: apiError });
      return;
    }

    // Record feedback for this session only
    geminiService.recordFeedback(sessionId, {
      summaryId,
      isApproved,
      userComments,
      timestamp: new Date()
    });

    logger.info('Summary feedback recorded', { 
      sessionId, 
      summaryId, 
      isApproved 
    });

    // If rejected, generate a new summary with feedback
    let newSummary = null;
    if (!isApproved) {
      const conversationManager = ServiceContainer.getConversationManager();
      const session = await conversationManager.getSession(sessionId);
      
      if (session) {
        newSummary = await geminiService.generateWorkflowSummary(
          sessionId,
          session.conversationHistory,
          session.workflowData
        );
        
        logger.info('New summary generated after rejection', { 
          sessionId, 
          newSummaryId: newSummary.id 
        });
      }
    }

    res.json({
      success: true,
      message: isApproved 
        ? 'Thank you for your feedback! The summary has been approved.' 
        : 'Thank you for your feedback! I\'ve generated an improved summary.',
      newSummary,
      feedbackStats: geminiService.getFeedbackStats(sessionId)
    });
    
  } catch (error) {
    logger.error('Failed to process feedback:', error);
    const apiError: ApiError = {
      code: 'FEEDBACK_PROCESSING_FAILED',
      message: 'Failed to process feedback',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
    res.status(500).json({ error: apiError });
  }
});

/**
 * GET /api/summarization/:sessionId/stats
 * Get feedback statistics for a specific session
 */
router.get('/:sessionId/stats', authenticateUser, async (req: Request, res: Response) => {
  try {
    const sessionId = req.params.sessionId!;
    const stats = geminiService.getFeedbackStats(sessionId);
    
    res.json({
      success: true,
      sessionId,
      stats
    });
    
  } catch (error) {
    logger.error('Failed to get feedback stats:', error);
    const apiError: ApiError = {
      code: 'STATS_RETRIEVAL_FAILED',
      message: 'Failed to retrieve feedback statistics',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
    res.status(500).json({ error: apiError });
  }
});

export default router;
