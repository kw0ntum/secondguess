/**
 * SOP Text Generator Service
 * Uses Gemini to generate ISO-formatted SOP documentation
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '../utils/logger';

export interface SOPTextInput {
  title: string;
  description: string;
  steps: any[];
  inputs: any[];
  outputs: any[];
  actors?: string[];
  risks?: any[];
  dependencies?: any[];
}

export interface SOPSection {
  number: string;
  title: string;
  content: string;
  subsections?: SOPSection[];
}

export interface GeneratedSOPText {
  title: string;
  documentNumber: string;
  version: string;
  effectiveDate: string;
  sections: SOPSection[];
}

export class SOPTextGenerator {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not set');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    // Use flash model for text generation (pro not available in free tier)
    this.model = this.genAI.getGenerativeModel({ 
      model: process.env.GEMINI_TEXT_MODEL || 'gemini-2.0-flash-lite' 
    });

    logger.info('SOP Text Generator initialized');
  }

  /**
   * Generate complete ISO-formatted SOP text
   */
  async generateSOPText(input: SOPTextInput): Promise<GeneratedSOPText> {
    try {
      logger.info('Generating SOP text', { title: input.title });

      const prompt = this.buildSOPPrompt(input);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const sopDocument = this.parseSOPResponse(text, input);

      logger.info('SOP text generated successfully');
      return sopDocument;
    } catch (error) {
      logger.error('Failed to generate SOP text:', error);
      throw new Error('Failed to generate SOP text');
    }
  }

  /**
   * Build comprehensive prompt for SOP generation
   */
  private buildSOPPrompt(input: SOPTextInput): string {
    return `You are an expert technical writer specializing in Standard Operating Procedures (SOPs) following ISO 9001 standards.

Generate a comprehensive, professional SOP document with the following information:

PROCESS TITLE: ${input.title}
DESCRIPTION: ${input.description}

PROCESS STEPS:
${input.steps.map((step, i) => `${i + 1}. ${step.description || step.title || step}`).join('\n')}

INPUTS REQUIRED:
${input.inputs.map((inp, i) => `${i + 1}. ${inp.name || inp}${inp.description ? ` - ${inp.description}` : ''}`).join('\n')}

EXPECTED OUTPUTS:
${input.outputs.map((out, i) => `${i + 1}. ${out.name || out}${out.description ? ` - ${out.description}` : ''}`).join('\n')}

${input.actors && input.actors.length > 0 ? `ROLES/ACTORS INVOLVED:\n${input.actors.join(', ')}` : ''}

${input.risks && input.risks.length > 0 ? `IDENTIFIED RISKS:\n${input.risks.map((r, i) => `${i + 1}. ${r.description || r}`).join('\n')}` : ''}

Create a complete SOP document following ISO 9001 structure with these sections:

1. PURPOSE
   - Clear statement of why this SOP exists
   - Scope of application
   - Benefits and objectives

2. SCOPE
   - What is covered by this SOP
   - What is NOT covered
   - Applicable departments/areas

3. DEFINITIONS AND ABBREVIATIONS
   - Key terms used in the document
   - Acronyms and their meanings
   - Technical terminology

4. RESPONSIBILITIES
   - Roles and their specific responsibilities
   - Authority levels
   - Accountability matrix

5. PROCEDURE
   - Detailed step-by-step instructions
   - Prerequisites for each step
   - Expected outcomes
   - Decision points and criteria
   - Quality checkpoints

6. REQUIRED RESOURCES
   - Materials and supplies
   - Equipment and tools
   - Personnel requirements
   - Information systems

7. DOCUMENTATION AND RECORDS
   - Forms to be completed
   - Records to be maintained
   - Retention periods
   - Storage requirements

8. QUALITY CONTROL
   - Quality standards
   - Inspection points
   - Acceptance criteria
   - Non-conformance handling

9. SAFETY AND COMPLIANCE
   - Safety precautions
   - Regulatory requirements
   - Environmental considerations
   - Risk mitigation measures

10. REFERENCES
    - Related SOPs
    - Regulatory standards
    - Supporting documents

11. REVISION HISTORY
    - Version tracking
    - Change log

Requirements:
- Use professional, clear, and concise language
- Write in imperative mood for procedures (e.g., "Complete the form", not "The form should be completed")
- Include specific details and avoid ambiguity
- Use numbered lists for sequential steps
- Use bullet points for non-sequential items
- Maintain consistent formatting
- Include quality checkpoints
- Address potential issues and their solutions

Format your response as structured sections with clear headings. Use "###" for section titles and "####" for subsection titles.`;
  }

  /**
   * Parse AI response into structured SOP document
   */
  private parseSOPResponse(text: string, input: SOPTextInput): GeneratedSOPText {
    const sections: SOPSection[] = [];
    const lines = text.split('\n');
    
    let currentSection: SOPSection | null = null;
    let currentSubsection: SOPSection | null = null;
    let sectionNumber = 1;
    let subsectionNumber = 1;

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Main section (### Title)
      if (trimmedLine.startsWith('###') && !trimmedLine.startsWith('####')) {
        if (currentSection) {
          sections.push(currentSection);
        }
        
        const title = trimmedLine.replace(/^###\s*/, '').replace(/^\d+\.\s*/, '').trim();
        currentSection = {
          number: `${sectionNumber}`,
          title,
          content: '' as string,
          subsections: []
        };
        sectionNumber++;
        subsectionNumber = 1;
        currentSubsection = null;
      }
      // Subsection (#### Title)
      else if (trimmedLine.startsWith('####')) {
        if (currentSection) {
          const title = trimmedLine.replace(/^####\s*/, '').replace(/^\d+\.\d+\s*/, '').trim();
          currentSubsection = {
            number: `${currentSection.number}.${subsectionNumber}`,
            title,
            content: '' as string
          };
          currentSection.subsections = currentSection.subsections || [];
          currentSection.subsections.push(currentSubsection);
          subsectionNumber++;
        }
      }
      // Content
      else if (trimmedLine.length > 0) {
        if (currentSubsection) {
          currentSubsection.content = (currentSubsection.content || '') + line + '\n';
        } else if (currentSection) {
          currentSection.content = (currentSection.content || '') + line + '\n';
        }
      }
    }

    // Add last section
    if (currentSection) {
      sections.push(currentSection);
    }

    // Generate document metadata
    const now = new Date();
    const documentNumber = `SOP-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;

    return {
      title: input.title,
      documentNumber,
      version: '1.0',
      effectiveDate: now.toISOString().split('T')[0] as string,
      sections: sections as SOPSection[]
    };
  }
}
