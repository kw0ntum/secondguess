/**
 * SOP Document Generator Service
 * Orchestrates chart and text generation to create complete SOP documents
 */

import { SOPChartGenerator, GeneratedChart, ChartGenerationInput } from './sop-chart-generator';
import { SOPTextGenerator, GeneratedSOPText, SOPTextInput } from './sop-text-generator';
import { SOPImageGenerator, GeneratedImage, ImageGenerationInput } from './sop-image-generator';
import { logger } from '../utils/logger';

export interface CompleteSOPDocument {
  metadata: {
    title: string;
    documentNumber: string;
    version: string;
    effectiveDate: string;
    generatedAt: string;
  };
  coverPage: {
    title: string;
    subtitle: string;
    imagePrompt: string;
    coverImage?: GeneratedImage;
  };
  tableOfContents: TableOfContentsEntry[];
  charts: GeneratedChart[];
  sections: any[];
}

export interface TableOfContentsEntry {
  number: string;
  title: string;
  page?: number;
  subsections?: TableOfContentsEntry[] | undefined;
}

export class SOPDocumentGenerator {
  private chartGenerator: SOPChartGenerator;
  private textGenerator: SOPTextGenerator;
  private imageGenerator: SOPImageGenerator;

  constructor() {
    this.chartGenerator = new SOPChartGenerator();
    this.textGenerator = new SOPTextGenerator();
    this.imageGenerator = new SOPImageGenerator();
    logger.info('SOP Document Generator initialized');
  }

  /**
   * Generate complete SOP document with charts and text
   */
  async generateCompleteDocument(workflowData: any): Promise<CompleteSOPDocument> {
    try {
      logger.info('Generating complete SOP document', { 
        title: workflowData.title 
      });

      // Prepare input data
      const chartInput: ChartGenerationInput = {
        title: workflowData.title || 'Standard Operating Procedure',
        description: workflowData.description || '',
        steps: workflowData.steps || [],
        inputs: workflowData.inputs || [],
        outputs: workflowData.outputs || [],
        actors: this.extractActors(workflowData),
        dependencies: workflowData.dependencies || []
      };

      const textInput: SOPTextInput = {
        title: workflowData.title || 'Standard Operating Procedure',
        description: workflowData.description || '',
        steps: workflowData.steps || [],
        inputs: workflowData.inputs || [],
        outputs: workflowData.outputs || [],
        actors: this.extractActors(workflowData),
        risks: workflowData.risks || [],
        dependencies: workflowData.dependencies || []
      };

      // Prepare image generation input
      const imageInput: ImageGenerationInput = {
        title: workflowData.title || 'Standard Operating Procedure',
        description: workflowData.description || '',
        industry: workflowData.industry || workflowData.category,
        processType: workflowData.type || 'Business Process',
        keywords: this.extractKeywords(workflowData)
      };

      // Generate charts, text, and cover image in parallel
      const [charts, sopText, coverImage] = await Promise.all([
        this.chartGenerator.generateCharts(chartInput),
        this.textGenerator.generateSOPText(textInput),
        this.imageGenerator.generateCoverImage(imageInput)
      ]);

      // Create cover page with generated image
      const coverPage = this.generateCoverPage(sopText, coverImage);

      // Generate table of contents
      const tableOfContents = this.generateTableOfContents(sopText, charts);

      // Merge everything into complete document
      const completeDocument: CompleteSOPDocument = {
        metadata: {
          title: sopText.title,
          documentNumber: sopText.documentNumber,
          version: sopText.version,
          effectiveDate: sopText.effectiveDate,
          generatedAt: new Date().toISOString()
        },
        coverPage,
        tableOfContents,
        charts,
        sections: sopText.sections
      };

      logger.info('Complete SOP document generated successfully', {
        documentNumber: sopText.documentNumber,
        chartCount: charts.length,
        sectionCount: sopText.sections.length
      });

      return completeDocument;
    } catch (error) {
      logger.error('Failed to generate complete SOP document:', error);
      throw new Error('Failed to generate SOP document');
    }
  }

  /**
   * Extract actors/roles from workflow data
   */
  private extractActors(workflowData: any): string[] {
    const actors = new Set<string>();

    // From steps
    if (workflowData.steps) {
      workflowData.steps.forEach((step: any) => {
        if (step.actor) actors.add(step.actor);
        if (step.role) actors.add(step.role);
        if (step.responsible) actors.add(step.responsible);
      });
    }

    // From explicit actors field
    if (workflowData.actors) {
      workflowData.actors.forEach((actor: string) => actors.add(actor));
    }

    // Default actors if none found
    if (actors.size === 0) {
      actors.add('Process Owner');
      actors.add('Operator');
    }

    return Array.from(actors);
  }

  /**
   * Extract keywords from workflow data for image generation
   */
  private extractKeywords(workflowData: any): string[] {
    const keywords: string[] = [];
    
    // From title
    if (workflowData.title) {
      keywords.push(...workflowData.title.toLowerCase().split(' ').filter((w: string) => w.length > 3));
    }
    
    // From tags
    if (workflowData.tags) {
      keywords.push(...workflowData.tags);
    }
    
    // From category
    if (workflowData.category) {
      keywords.push(workflowData.category);
    }
    
    // Default keywords
    if (keywords.length === 0) {
      keywords.push('process', 'workflow', 'quality', 'efficiency');
    }
    
    return [...new Set(keywords)].slice(0, 5); // Unique, max 5
  }

  /**
   * Generate cover page information with AI-generated image
   */
  private generateCoverPage(sopText: GeneratedSOPText, coverImage: GeneratedImage): {
    title: string;
    subtitle: string;
    imagePrompt: string;
    coverImage: GeneratedImage;
  } {
    return {
      title: sopText.title,
      subtitle: `Document No: ${sopText.documentNumber} | Version ${sopText.version}`,
      imagePrompt: coverImage.prompt,
      coverImage: coverImage
    };
  }

  /**
   * Generate table of contents
   */
  private generateTableOfContents(
    sopText: GeneratedSOPText, 
    charts: GeneratedChart[]
  ): TableOfContentsEntry[] {
    const toc: TableOfContentsEntry[] = [];

    // Add charts section FIRST (always include, even if empty for consistency)
    const chartsEntry: TableOfContentsEntry = {
      number: '1',
      title: 'Process Diagrams',
      subsections: charts.length > 0 ? charts.map((chart, index) => ({
        number: `1.${index + 1}`,
        title: chart.title
      })) : undefined
    };
    toc.push(chartsEntry);

    // Add text sections (renumber starting from 2)
    sopText.sections.forEach((section, index) => {
      const sectionNumber = index + 2; // Start from 2 since Process Diagrams is 1
      const entry: TableOfContentsEntry = {
        number: `${sectionNumber}`,
        title: section.title,
        subsections: section.subsections ? section.subsections.map((sub: any, subIndex: number) => ({
          number: `${sectionNumber}.${subIndex + 1}`,
          title: sub.title
        })) : undefined
      };
      toc.push(entry);
    });

    return toc;
  }
}
