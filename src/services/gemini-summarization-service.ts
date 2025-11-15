/**
 * Google Gemini Summarization Service
 * Handles AI-powered workflow summarization using Google Gemini
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '../utils/logger';
import { UserInput, WorkflowSummary } from '../models';

export interface SummarizationFeedback {
  summaryId: string;
  isApproved: boolean;
  userComments?: string;
  timestamp: Date;
}

export class GeminiSummarizationService {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private feedbackHistory: SummarizationFeedback[] = [];

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not set');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ 
      model: process.env.GEMINI_MODEL || 'gemini-2.5-pro' 
    });

    logger.info('Gemini Summarization Service initialized');
  }

  /**
   * Generate a workflow summary from conversation history
   */
  async generateWorkflowSummary(
    conversationHistory: UserInput[],
    workflowData: any
  ): Promise<WorkflowSummary & { 
    id: string; 
    sessionId: string; 
    missingInformation: string[]; 
    suggestedNextQuestions: string[];
    iterationNumber: number;
  }> {
    try {
      const prompt = this.buildSummarizationPrompt(conversationHistory, workflowData);
      
      logger.info('Generating workflow summary with Gemini', {
        messageCount: conversationHistory.length
      });

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const summaryText = response.text();

      // Parse the AI response into a structured summary
      const summary = this.parseSummaryResponse(summaryText, workflowData);

      logger.info('Workflow summary generated successfully', {
        completenessScore: summary.completenessScore
      });

      return summary;
    } catch (error) {
      logger.error('Failed to generate workflow summary:', error);
      throw new Error('Failed to generate workflow summary with Gemini');
    }
  }

  /**
   * Build the prompt for Gemini to generate a workflow summary
   */
  private buildSummarizationPrompt(
    conversationHistory: UserInput[],
    workflowData: any
  ): string {
    const conversationText = conversationHistory
      .map((input, index) => `[Message ${index + 1}] ${input.content}`)
      .join('\n');

    const feedbackContext = this.buildFeedbackContext();

    return `You are an AI assistant helping to create Standard Operating Procedures (SOPs). 
Your task is to analyze the conversation history and generate a comprehensive workflow summary.

CONVERSATION HISTORY:
${conversationText}

CURRENT WORKFLOW DATA:
- Title: ${workflowData.title || 'Not specified'}
- Description: ${workflowData.description || 'Not specified'}
- Steps: ${workflowData.steps?.length || 0} identified
- Inputs: ${workflowData.inputs?.length || 0} identified
- Outputs: ${workflowData.outputs?.length || 0} identified

${feedbackContext}

Please provide a structured summary in the following format:

SUMMARY:
[Provide a clear, concise summary of the workflow in 2-3 sentences]

KEY STEPS:
[List the main steps identified, one per line, starting with "-"]

INPUTS:
[List the required inputs, one per line, starting with "-"]

OUTPUTS:
[List the expected outputs, one per line, starting with "-"]

MISSING INFORMATION:
[List any critical information that is still missing or unclear, one per line, starting with "-"]

COMPLETENESS SCORE:
[Provide a score from 0-100 indicating how complete the workflow description is]

NEXT QUESTIONS:
[Suggest 2-3 specific questions to ask the user to fill gaps or clarify ambiguities]

Be specific, actionable, and focus on creating a clear, implementable workflow.`;
  }

  /**
   * Build feedback context from previous user feedback
   */
  private buildFeedbackContext(): string {
    if (this.feedbackHistory.length === 0) {
      return '';
    }

    const recentFeedback = this.feedbackHistory.slice(-3);
    const rejectedSummaries = recentFeedback.filter(f => !f.isApproved);

    if (rejectedSummaries.length === 0) {
      return '';
    }

    const feedbackText = rejectedSummaries
      .map(f => f.userComments || 'User rejected the summary')
      .join('\n- ');

    return `\nUSER FEEDBACK FROM PREVIOUS SUMMARIES:
The user has provided the following feedback on previous summaries:
- ${feedbackText}

Please take this feedback into account when generating the new summary.`;
  }

  /**
   * Parse the Gemini response into a structured WorkflowSummary with extended metadata
   */
  private parseSummaryResponse(summaryText: string, workflowData: any): WorkflowSummary & { 
    id: string; 
    sessionId: string; 
    missingInformation: string[]; 
    suggestedNextQuestions: string[];
    iterationNumber: number;
  } {
    const sections = this.extractSections(summaryText);

    return {
      id: `summary-${Date.now()}`,
      sessionId: workflowData.id || '',
      title: workflowData.title || 'Workflow Process',
      description: sections.summary || 'Workflow summary in progress',
      keySteps: sections.keySteps || [],
      identifiedInputs: sections.inputs || [],
      identifiedOutputs: sections.outputs || [],
      missingInformation: sections.missingInfo || [],
      completenessScore: sections.completenessScore || 0,
      suggestedNextQuestions: sections.nextQuestions || [],
      lastUpdated: new Date(),
      iterationNumber: 0
    };
  }

  /**
   * Extract structured sections from the AI response
   */
  private extractSections(text: string): any {
    const sections: any = {};

    // Extract summary
    const summaryMatch = text.match(/SUMMARY:\s*\n([\s\S]*?)(?=\n\n|KEY STEPS:|$)/i);
    sections.summary = summaryMatch ? summaryMatch[1]?.trim() || '' : '';

    // Extract key steps
    const stepsMatch = text.match(/KEY STEPS:\s*\n([\s\S]*?)(?=\n\n|INPUTS:|$)/i);
    sections.keySteps = stepsMatch && stepsMatch[1]
      ? this.extractListItems(stepsMatch[1])
      : [];

    // Extract inputs
    const inputsMatch = text.match(/INPUTS:\s*\n([\s\S]*?)(?=\n\n|OUTPUTS:|$)/i);
    sections.inputs = inputsMatch && inputsMatch[1]
      ? this.extractListItems(inputsMatch[1])
      : [];

    // Extract outputs
    const outputsMatch = text.match(/OUTPUTS:\s*\n([\s\S]*?)(?=\n\n|MISSING INFORMATION:|$)/i);
    sections.outputs = outputsMatch && outputsMatch[1]
      ? this.extractListItems(outputsMatch[1])
      : [];

    // Extract missing information
    const missingMatch = text.match(/MISSING INFORMATION:\s*\n([\s\S]*?)(?=\n\n|COMPLETENESS SCORE:|$)/i);
    sections.missingInfo = missingMatch && missingMatch[1]
      ? this.extractListItems(missingMatch[1])
      : [];

    // Extract completeness score
    const scoreMatch = text.match(/COMPLETENESS SCORE:\s*\n?(\d+)/i);
    sections.completenessScore = scoreMatch && scoreMatch[1]
      ? parseInt(scoreMatch[1], 10)
      : 50;

    // Extract next questions
    const questionsMatch = text.match(/NEXT QUESTIONS:\s*\n([\s\S]*?)$/i);
    sections.nextQuestions = questionsMatch && questionsMatch[1]
      ? this.extractListItems(questionsMatch[1])
      : [];

    return sections;
  }

  /**
   * Extract list items from text (lines starting with -, *, or numbers)
   */
  private extractListItems(text: string): string[] {
    return text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.match(/^[-*\d.]/))
      .map(line => line.replace(/^[-*\d.]\s*/, '').trim())
      .filter(line => line.length > 0);
  }

  /**
   * Record user feedback on a summary
   */
  recordFeedback(feedback: SummarizationFeedback): void {
    this.feedbackHistory.push(feedback);
    
    logger.info('User feedback recorded', {
      summaryId: feedback.summaryId,
      isApproved: feedback.isApproved,
      hasComments: !!feedback.userComments
    });

    // Keep only last 10 feedback entries
    if (this.feedbackHistory.length > 10) {
      this.feedbackHistory = this.feedbackHistory.slice(-10);
    }
  }

  /**
   * Get feedback statistics
   */
  getFeedbackStats(): { approved: number; rejected: number; total: number } {
    const approved = this.feedbackHistory.filter(f => f.isApproved).length;
    const rejected = this.feedbackHistory.filter(f => !f.isApproved).length;
    
    return {
      approved,
      rejected,
      total: this.feedbackHistory.length
    };
  }
}
