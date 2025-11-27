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

### PURPOSE
   - Clear statement of why this SOP exists
   - Scope of application
   - Benefits and objectives

### SCOPE
   - What is covered by this SOP
   - What is NOT covered
   - Applicable departments/areas

### DEFINITIONS AND ABBREVIATIONS
   - Key terms used in the document
   - Acronyms and their meanings
   - Technical terminology

### RESPONSIBILITIES
   - Roles and their specific responsibilities
   - Authority levels
   - Accountability matrix

### PROCEDURE
   CRITICAL FORMATTING REQUIREMENTS:
   - Main steps MUST use format: "1. Step Title - Brief description" (ALL on ONE LINE)
   - Number, title, dash, and description MUST be on ONE LINE (no line breaks)
   - Related sub-steps MUST use indented sub-numbering: "   1.1", "   1.2", "   1.3" with 3 spaces indent
   - Sub-steps are additional details, warnings, or notes for the main step
   - Each sub-step on its own line with proper indentation and numbering
   
   EXACT FORMAT TO FOLLOW (copy this exactly):
   
1. Prepare Materials - Gather all required materials and tools
   1.1 Check material quality and expiration dates
   1.2 Verify quantities match requirements
   1.3 Organize materials in work area

2. Execute Process - Follow the documented procedure
   2.1 Monitor progress at each checkpoint
   2.2 Record observations and measurements
   2.3 Address any deviations immediately

3. Complete Documentation - Record all results and observations
   3.1 Fill out required forms
   3.2 Sign and date all documents
   3.3 File records in appropriate location

### REQUIRED RESOURCES
   - Materials and supplies
   - Equipment and tools
   - Personnel requirements
   - Information systems

### DOCUMENTATION AND RECORDS
   - Forms to be completed
   - Records to be maintained
   - Retention periods
   - Storage requirements

### QUALITY CONTROL
   CRITICAL FORMATTING FOR QUALITY CONTROL:
   - Main quality items use bullet points (-)
   - Sub-items MUST be indented with 3 spaces and use different bullet (•)
   
   EXACT FORMAT TO FOLLOW:
   
- Quality standards and specifications
   • Detailed specification 1
   • Detailed specification 2
- Inspection points and checkpoints
   • Checkpoint 1 details
   • Checkpoint 2 details
- Acceptance criteria
   • Criteria 1
   • Criteria 2
- Non-conformance handling procedures
   • Step 1 for handling issues
   • Step 2 for handling issues

### SAFETY AND COMPLIANCE
   - Safety precautions
   - Regulatory requirements
   - Environmental considerations
   - Risk mitigation measures

### REFERENCES
    - Related SOPs
    - Regulatory standards
    - Supporting documents

### REVISION HISTORY
    - Create a table with columns: Version, Date, Description, Author
    - Add ONE row: Version 1.0, today's date (${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}), Initial release, AI Voice SOP Agent
    - Use markdown table format

Requirements:
- Use professional, clear, and concise language
- Write in imperative mood for procedures (e.g., "Complete the form", not "The form should be completed")
- Include specific details and avoid ambiguity

CRITICAL FORMATTING RULES (MUST FOLLOW EXACTLY):

1. SECTION HEADERS:
   - Format: "### Section Title" (ONE line, NO numbers, NO line breaks)
   - Example: "### PURPOSE" NOT "### 1. PURPOSE" or "###\nPURPOSE"
   - All headers must have consistent spacing (one blank line before and after)

2. PROCEDURE SECTION NUMBERING:
   - Main steps: "1. Step Title - Brief description" (ALL on ONE line)
   - Sub-steps: "   1.1 Sub-step description" (3 spaces indent, sub-number, description)
   - Format example:
   
1. Prepare Materials - Gather all required materials and tools
   1.1 Check material quality and expiration dates
   1.2 Verify quantities match requirements
   1.3 Organize materials in work area

2. Execute Process - Follow the documented procedure
   2.1 Monitor progress at each checkpoint
   2.2 Record observations and measurements
   2.3 Address any deviations immediately

3. QUALITY CONTROL BULLETS:
   - Main items: "- Main quality item"
   - Sub-items: "   • Sub-item detail" (3 spaces indent, bullet •)
   - Format example:
   
- Quality standards and specifications
   • Detailed specification 1
   • Detailed specification 2
- Inspection points and checkpoints
   • Checkpoint 1 details
   • Checkpoint 2 details

4. OTHER SECTIONS:
   - Use bullet points (- not *) for non-sequential items
   - Use numbered lists (1. 2. 3.) only in PROCEDURE section
   - Maintain consistent formatting throughout

5. SPACING:
   - One blank line before each section header
   - One blank line after each section header
   - NO extra line breaks within headers
   - Consistent margins for all sections

Format your response as structured sections with clear headings. Use "###" for section titles and "####" for subsection titles. DO NOT include section numbers in the headings. Keep all headers on a single line with NO line breaks.`;
  }

  /**
   * Parse AI response into structured SOP document
   */
  private parseSOPResponse(text: string, input: SOPTextInput): GeneratedSOPText {
    const sections: SOPSection[] = [];
    const lines = text.split('\n');
    
    let currentSection: SOPSection | null = null;
    let currentSubsection: SOPSection | null = null;
    let sectionNumber = 2; // Start from 2 since Process Diagrams will be section 1
    let subsectionNumber = 1;

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Main section (### Title or ### 1. Title)
      if (trimmedLine.startsWith('###') && !trimmedLine.startsWith('####')) {
        if (currentSection) {
          sections.push(currentSection);
        }
        
        // Remove ### and any existing numbering, also remove line breaks
        const title = trimmedLine
          .replace(/^###\s*/, '')
          .replace(/^\d+\.\s*/, '')
          .replace(/^\d+\s+/, '')
          .replace(/\n/g, ' ')
          .trim();
        
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
      // Subsection (#### Title or #### 1.1 Title)
      else if (trimmedLine.startsWith('####')) {
        if (currentSection) {
          // Remove #### and any existing numbering, also remove line breaks
          const title = trimmedLine
            .replace(/^####\s*/, '')
            .replace(/^\d+\.\d+\s*/, '')
            .replace(/^\d+\.\d+\.\s*/, '')
            .replace(/\n/g, ' ')
            .trim();
          
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
