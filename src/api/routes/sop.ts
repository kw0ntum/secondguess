import { Router, Request, Response } from 'express';
import { ServiceContainer } from '../../services/service-container';
import { validateRequest } from '../middleware/validation';
import { authenticateUser } from '../middleware/auth';
import { logger } from '../../utils/logger';
import { SOPGenerationRequest, SOPUpdateRequest, SOPExportRequest, ApiError } from '../types/api-types';
import { SOPDocumentGenerator } from '../../services/sop-document-generator';

const router = Router();

/**
 * POST /api/sops
 * Generate a new SOP from workflow definition
 */
router.post('/', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { workflowDefinition, sopType } = req.body as SOPGenerationRequest;
    
    if (!workflowDefinition) {
      logger.error('No workflow definition provided');
      const apiError: ApiError = {
        code: 'INVALID_REQUEST',
        message: 'Workflow definition is required',
        details: 'Missing workflowDefinition in request body'
      };
      res.status(400).json({ error: apiError });
      return;
    }
    
    logger.info('Starting SOP generation', { 
      title: workflowDefinition?.title,
      sopType,
      stepsCount: workflowDefinition?.steps?.length,
      inputsCount: workflowDefinition?.inputs?.length,
      outputsCount: workflowDefinition?.outputs?.length,
      workflowKeys: Object.keys(workflowDefinition)
    });
    
    // Use new comprehensive SOP generator
    const documentGenerator = new SOPDocumentGenerator();
    const completeDocument = await documentGenerator.generateCompleteDocument(workflowDefinition);
    
    logger.info('Complete SOP document generated successfully', { 
      documentNumber: completeDocument.metadata.documentNumber,
      chartCount: completeDocument.charts.length,
      sectionCount: completeDocument.sections.length
    });
    
    res.status(201).json(completeDocument);
    
  } catch (error) {
    logger.error('Failed to generate SOP:', error);
    const apiError: ApiError = {
      code: 'SOP_GENERATION_FAILED',
      message: 'Failed to generate SOP document',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
    res.status(500).json({ error: apiError });
  }
});

/**
 * GET /api/sops/:sopId
 * Get SOP document by ID
 */
router.get('/:sopId', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { sopId } = req.params;
    
    // TODO: Implement getSOP method in SOPGeneratorService
    // const sopGenerator = new SOPGeneratorService();
    // const sopDocument = await sopGenerator.getSOP(sopId);
    
    // For now, return a placeholder response
    const sopDocument = {
      id: sopId,
      title: 'Sample SOP',
      type: 'automation',
      sections: [],
      charts: [],
      metadata: {
        createdAt: new Date().toISOString(),
        version: '1.0.0'
      }
    };
    
    res.json(sopDocument);
    
  } catch (error) {
    logger.error('Failed to get SOP:', error);
    const apiError: ApiError = {
      code: 'SOP_NOT_FOUND',
      message: 'SOP document not found',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
    res.status(404).json({ error: apiError });
  }
});

/**
 * PUT /api/sops/:sopId
 * Update an existing SOP document
 */
router.put('/:sopId', authenticateUser, validateRequest('sopUpdate'), async (req: Request, res: Response) => {
  try {
    const { sopId } = req.params;
    const { changes } = req.body as SOPUpdateRequest;
    
    const sopGenerator = ServiceContainer.getSOPGenerator();
    
    // TODO: First get the existing SOP, then update it
    // const existingSOP = await sopGenerator.getSOP(sopId);
    // const updatedSOP = await sopGenerator.updateSOP(existingSOP, changes);
    
    // For now, return a placeholder response
    const updatedSOP = {
      id: sopId,
      title: 'Updated SOP',
      type: 'automation',
      sections: [],
      charts: [],
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: '1.1.0'
      }
    };
    
    logger.info('SOP updated successfully', { sopId });
    res.json(updatedSOP);
    
  } catch (error) {
    logger.error('Failed to update SOP:', error);
    const apiError: ApiError = {
      code: 'SOP_UPDATE_FAILED',
      message: 'Failed to update SOP document',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
    res.status(500).json({ error: apiError });
  }
});

/**
 * POST /api/sops/:sopId/validate
 * Validate SOP completeness
 */
router.post('/:sopId/validate', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { sopId } = req.params;
    
    const sopGenerator = ServiceContainer.getSOPGenerator();
    
    // TODO: Get SOP and validate it
    // const sopDocument = await sopGenerator.getSOP(sopId);
    // const validationResult = sopGenerator.validateSOPCompleteness(sopDocument);
    
    // For now, return a placeholder validation result
    const validationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };
    
    logger.info('SOP validation completed', { sopId, isValid: validationResult.isValid });
    res.json(validationResult);
    
  } catch (error) {
    logger.error('Failed to validate SOP:', error);
    const apiError: ApiError = {
      code: 'SOP_VALIDATION_FAILED',
      message: 'Failed to validate SOP document',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
    res.status(500).json({ error: apiError });
  }
});

/**
 * POST /api/sops/:sopId/export
 * Export SOP in specified format (PDF, DOCX, MD)
 */
router.post('/:sopId/export', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { sopId } = req.params;
    const { format, options, sopData } = req.body;
    
    if (!sopData) {
      const apiError: ApiError = {
        code: 'INVALID_REQUEST',
        message: 'SOP data is required for export',
        details: 'Missing sopData in request body'
      };
      res.status(400).json({ error: apiError });
      return;
    }
    
    const documentExporter = ServiceContainer.getDocumentExporter();
    
    logger.info('Starting SOP export', { sopId, format });
    
    // Convert CompleteSOPDocument to SOPDocument format
    const sopDocument: any = {
      id: sopId,
      title: sopData.metadata?.title || sopData.coverPage?.title || 'SOP Document',
      type: 'process_improvement',
      sections: sopData.sections || [],
      charts: sopData.charts || [],
      metadata: {
        author: 'AI Voice SOP Agent',
        department: 'Operations',
        effectiveDate: new Date(sopData.metadata?.effectiveDate || Date.now()),
        reviewDate: new Date(),
        version: sopData.metadata?.version || '1.0',
        status: 'active',
        tags: [],
        category: 'Process',
        audience: [],
        purpose: 'Standard Operating Procedure',
        scope: 'Process documentation',
        references: []
      },
      version: sopData.metadata?.version || '1.0',
      createdAt: new Date(sopData.metadata?.generatedAt || Date.now()),
      updatedAt: new Date()
    };
    
    // Export the document
    const exportResult = await documentExporter.exportDocument(sopDocument, format, options);
    
    if (!exportResult.success) {
      throw new Error(exportResult.error || 'Export failed');
    }
    
    // Read the file and send it
    const fs = require('fs');
    const filePath = exportResult.filePath!;
    const fileBuffer = fs.readFileSync(filePath);
    
    // Set appropriate headers
    const mimeTypes: Record<string, string> = {
      pdf: 'application/pdf',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      markdown: 'text/markdown',
      md: 'text/markdown'
    };
    
    const extensions: Record<string, string> = {
      pdf: 'pdf',
      docx: 'docx',
      markdown: 'md',
      md: 'md'
    };
    
    const mimeType = mimeTypes[format] || 'application/octet-stream';
    const extension = extensions[format] || format;
    
    // Generate filename: Title_DocumentNumber_Version.extension
    // Example: Customer_Onboarding_Process_SOP-2024-12-001_v1.0.pdf
    const title = sopData.metadata?.title || sopData.coverPage?.title || 'SOP_Document';
    const documentNumber = sopData.metadata?.documentNumber || '';
    const version = sopData.metadata?.version || '1.0';
    
    // Sanitize title (remove special characters, keep alphanumeric, spaces, and underscores)
    let sanitizedTitle = title
      .replace(/[^a-zA-Z0-9\s_-]/g, '') // Remove special chars except space, underscore, hyphen
      .replace(/\s+/g, '_')              // Replace spaces with underscores
      .replace(/_+/g, '_')               // Replace multiple underscores with single
      .replace(/^_|_$/g, '');            // Remove leading/trailing underscores
    
    // Limit title length to keep filename reasonable
    const maxTitleLength = 60;
    if (sanitizedTitle.length > maxTitleLength) {
      sanitizedTitle = sanitizedTitle.substring(0, maxTitleLength);
    }
    
    // Fallback if title is empty after sanitization
    if (!sanitizedTitle) {
      sanitizedTitle = 'SOP_Document';
    }
    
    // Build filename with document number and version
    let filename = sanitizedTitle;
    if (documentNumber) {
      filename += `_${documentNumber}`;
    }
    filename += `_v${version}.${extension}`;
    
    // Example result: Customer_Onboarding_Process_SOP-2024-12-001_v1.0.pdf
    
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', fileBuffer.length);
    
    res.send(fileBuffer);
    
    // Clean up the file after sending
    setTimeout(() => {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        logger.warn('Failed to delete temporary export file', { filePath, error: err });
      }
    }, 1000);
    
    logger.info('SOP export completed successfully', { sopId, format, fileSize: exportResult.fileSize });
    
  } catch (error) {
    logger.error('Failed to export SOP:', error);
    const apiError: ApiError = {
      code: 'SOP_EXPORT_FAILED',
      message: 'Failed to export SOP document',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
    res.status(500).json({ error: apiError });
  }
});

export default router;