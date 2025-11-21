/**
 * SOP Document Generator Service
 * Orchestrates chart and text generation to create complete SOP documents
 */

import { SOPChartGenerator, GeneratedChart, ChartGenerationInput } from './sop-chart-generator';
import { SOPTextGenerator, GeneratedSOPText, SOPTextInput } from './sop-text-generator';
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

  constructor() {
    this.chartGenerator = new SOPChartGenerator();
    this.textGenerator = new SOPTextGenerator();
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

      // Generate charts and text in parallel
      const [charts, sopText] = await Promise.all([
        this.chartGenerator.generateCharts(chartInput),
        this.textGenerator.generateSOPText(textInput)
      ]);

      // Create cover page
      const coverPage = this.generateCoverPage(sopText);

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
   * Generate cover page information
   */
  private generateCoverPage(sopText: GeneratedSOPText): {
    title: string;
    subtitle: string;
    imagePrompt: string;
  } {
    return {
      title: sopText.title,
      subtitle: `Document No: ${sopText.documentNumber} | Version ${sopText.version}`,
      imagePrompt: `Professional abstract background for a Standard Operating Procedure document about ${sopText.title}. 
Modern, clean, corporate style with blue and gray tones. Geometric patterns suggesting organization and process flow. 
High quality, suitable for business documentation.`
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

    // Add charts section
    if (charts.length > 0) {
      const chartsEntry: TableOfContentsEntry = {
        number: '0',
        title: 'Process Diagrams',
        subsections: charts.map((chart, index) => ({
          number: `0.${index + 1}`,
          title: chart.title
        }))
      };
      toc.push(chartsEntry);
    }

    // Add text sections
    sopText.sections.forEach((section) => {
      const entry: TableOfContentsEntry = {
        number: section.number,
        title: section.title,
        subsections: section.subsections ? section.subsections.map((sub: any) => ({
          number: sub.number,
          title: sub.title
        })) : undefined
      };
      toc.push(entry);
    });

    return toc;
  }
}
