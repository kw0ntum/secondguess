/**
 * SOP Chart Generator Service
 * Uses Gemini to generate Mermaid flowcharts for SOP documentation
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '../utils/logger';

export interface ChartGenerationInput {
  title: string;
  description: string;
  steps: any[];
  inputs: any[];
  outputs: any[];
  actors?: string[];
  dependencies?: any[];
}

export interface GeneratedChart {
  type: 'flowchart' | 'sequence' | 'swimlane';
  title: string;
  description: string;
  mermaidCode: string;
  caption: string;
}

export class SOPChartGenerator {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not set');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    // Use flash-lite model for chart generation
    this.model = this.genAI.getGenerativeModel({ 
      model: process.env.GEMINI_CHART_MODEL || 'gemini-2.0-flash-lite' 
    });

    logger.info('SOP Chart Generator initialized');
  }

  /**
   * Generate multiple charts for the SOP
   */
  async generateCharts(input: ChartGenerationInput): Promise<GeneratedChart[]> {
    try {
      logger.info('Generating SOP charts', { title: input.title });

      const charts: GeneratedChart[] = [];

      // Generate main process flowchart
      const flowchart = await this.generateFlowchart(input);
      charts.push(flowchart);

      // Generate swimlane diagram if there are multiple actors
      if (input.actors && input.actors.length > 1) {
        const swimlane = await this.generateSwimlane(input);
        charts.push(swimlane);
      }

      // Generate data flow diagram if there are inputs/outputs
      if (input.inputs.length > 0 || input.outputs.length > 0) {
        const dataFlow = await this.generateDataFlow(input);
        charts.push(dataFlow);
      }

      logger.info('Charts generated successfully', { count: charts.length });
      return charts;
    } catch (error) {
      logger.error('Failed to generate charts:', error);
      throw new Error('Failed to generate SOP charts');
    }
  }

  /**
   * Generate main process flowchart
   */
  private async generateFlowchart(input: ChartGenerationInput): Promise<GeneratedChart> {
    const prompt = `You are an expert in creating process flowcharts for Standard Operating Procedures (SOPs).

Generate a Mermaid flowchart diagram for the following process:

TITLE: ${input.title}
DESCRIPTION: ${input.description}

STEPS:
${input.steps.map((step, i) => `${i + 1}. ${step.description || step.title || step}`).join('\n')}

INPUTS: ${input.inputs.map(i => i.name || i).join(', ')}
OUTPUTS: ${input.outputs.map(o => o.name || o).join(', ')}

Requirements:
1. Use ONLY Mermaid flowchart syntax: flowchart TD
2. Use simple node IDs without spaces (e.g., start, step1, decision1, end)
3. Use this exact syntax for nodes:
   - Rectangle: nodeId["Label text"]
   - Diamond: nodeId{"Decision text?"}
   - Start/End: nodeId(["Label"])
4. Use arrows: nodeId1 --> nodeId2
5. Keep labels SHORT and simple (max 50 characters)
6. NO special characters in labels except spaces and basic punctuation
7. NO line breaks within labels
8. Include start and end nodes

Example format:
flowchart TD
    start(["Start"])
    step1["Process step"]
    decision1{"Check condition?"}
    step2["Action A"]
    step3["Action B"]
    end1(["End"])
    
    start --> step1
    step1 --> decision1
    decision1 -->|Yes| step2
    decision1 -->|No| step3
    step2 --> end1
    step3 --> end1

Return ONLY valid Mermaid code, no explanations or markdown blocks.`;

    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    let mermaidCode = response.text().trim();

    // Clean up the response
    mermaidCode = this.cleanMermaidCode(mermaidCode);

    return {
      type: 'flowchart',
      title: 'Process Flowchart',
      description: 'Main process flow showing all steps and decision points',
      mermaidCode,
      caption: `Figure 1: ${input.title} - Process Flowchart`
    };
  }

  /**
   * Generate swimlane diagram for multi-actor processes
   */
  private async generateSwimlane(input: ChartGenerationInput): Promise<GeneratedChart> {
    const prompt = `You are an expert in creating swimlane diagrams for Standard Operating Procedures (SOPs).

Generate a Mermaid swimlane diagram showing responsibilities across different actors:

TITLE: ${input.title}
DESCRIPTION: ${input.description}

ACTORS: ${input.actors?.join(', ')}

STEPS:
${input.steps.map((step, i) => `${i + 1}. ${step.description || step.title || step}${step.actor ? ` (Actor: ${step.actor})` : ''}`).join('\n')}

Requirements:
1. Use ONLY Mermaid flowchart syntax: flowchart TD
2. Use subgraph for each actor/role
3. Simple node IDs without spaces
4. Short labels (max 40 characters)
5. Use this syntax:
   - subgraph ActorName
   - nodeId["Action"]
   - end
6. Connect nodes across subgraphs with arrows

Example format:
flowchart TD
    subgraph Actor1
        a1["Step 1"]
        a2["Step 2"]
    end
    
    subgraph Actor2
        b1["Step 3"]
        b2["Step 4"]
    end
    
    a1 --> a2
    a2 --> b1
    b1 --> b2

Return ONLY valid Mermaid code, no explanations.`;

    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    let mermaidCode = response.text().trim();

    mermaidCode = this.cleanMermaidCode(mermaidCode);

    return {
      type: 'swimlane',
      title: 'Responsibility Matrix',
      description: 'Process flow showing responsibilities across different roles',
      mermaidCode,
      caption: `Figure 2: ${input.title} - Swimlane Diagram`
    };
  }

  /**
   * Generate data flow diagram
   */
  private async generateDataFlow(input: ChartGenerationInput): Promise<GeneratedChart> {
    const prompt = `You are an expert in creating data flow diagrams for Standard Operating Procedures (SOPs).

Generate a Mermaid flowchart showing data inputs, processing, and outputs:

TITLE: ${input.title}

INPUTS:
${input.inputs.map((inp, i) => `${i + 1}. ${inp.name || inp}${inp.description ? `: ${inp.description}` : ''}`).join('\n')}

PROCESS STEPS:
${input.steps.map((step, i) => `${i + 1}. ${step.description || step.title || step}`).join('\n')}

OUTPUTS:
${input.outputs.map((out, i) => `${i + 1}. ${out.name || out}${out.description ? `: ${out.description}` : ''}`).join('\n')}

Requirements:
1. Use ONLY Mermaid flowchart syntax: flowchart LR
2. Simple node IDs without spaces
3. Short labels (max 40 characters)
4. Use this syntax:
   - Input: inp1[/"Input name"/]
   - Process: proc1["Process"]
   - Output: out1[\"Output name"\]
5. Flow left to right: inputs --> process --> outputs

Example format:
flowchart LR
    inp1[/"Input A"/]
    inp2[/"Input B"/]
    proc1["Process"]
    out1[\"Output X"\]
    
    inp1 --> proc1
    inp2 --> proc1
    proc1 --> out1

Return ONLY valid Mermaid code, no explanations.`;

    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    let mermaidCode = response.text().trim();

    mermaidCode = this.cleanMermaidCode(mermaidCode);

    return {
      type: 'flowchart',
      title: 'Data Flow Diagram',
      description: 'Flow of data through the process from inputs to outputs',
      mermaidCode,
      caption: `Figure 3: ${input.title} - Data Flow Diagram`
    };
  }

  /**
   * Clean and validate Mermaid code
   */
  private cleanMermaidCode(code: string): string {
    // Remove markdown code blocks if present
    code = code.replace(/```mermaid\n?/g, '');
    code = code.replace(/```\n?/g, '');
    
    // Trim whitespace
    code = code.trim();
    
    // Remove any explanatory text before or after the diagram
    const lines = code.split('\n');
    let diagramStart = -1;
    
    // Find where the actual diagram starts
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line && line.match(/^(flowchart|graph|sequenceDiagram|classDiagram|stateDiagram|erDiagram|journey|gantt|pie)/)) {
        diagramStart = i;
        break;
      }
    }
    
    if (diagramStart === -1) {
      // No diagram type found, assume flowchart TD
      code = 'flowchart TD\n' + code;
    } else if (diagramStart > 0) {
      // Remove text before diagram
      code = lines.slice(diagramStart).join('\n');
    }
    
    // Remove any text after the diagram ends (look for empty lines or non-diagram text)
    const cleanedLines = code.split('\n');
    const finalLines: string[] = [];
    let inDiagram = false;
    
    for (const line of cleanedLines) {
      const trimmed = line.trim();
      
      // Start of diagram
      if (trimmed.match(/^(flowchart|graph)/)) {
        inDiagram = true;
        finalLines.push(line);
        continue;
      }
      
      // Skip empty lines at the start
      if (!inDiagram && !trimmed) continue;
      
      // If we're in the diagram, include the line if it looks like diagram syntax
      if (inDiagram) {
        // Check if it's a valid diagram line
        if (trimmed && (
          trimmed.match(/^\w+/) || // Node definition or connection
          trimmed.match(/^subgraph/) ||
          trimmed.match(/^end$/) ||
          trimmed.includes('-->') ||
          trimmed.includes('---')
        )) {
          finalLines.push(line);
        } else if (!trimmed) {
          // Allow empty lines within diagram
          finalLines.push(line);
        }
        // Skip lines that look like explanatory text
      }
    }
    
    code = finalLines.join('\n').trim();
    
    // Basic validation - if code is too short or looks invalid, return a simple fallback
    if (code.length < 20 || !code.includes('-->')) {
      logger.warn('Generated Mermaid code appears invalid, using fallback');
      return `flowchart TD
    start(["Start Process"])
    step1["Review workflow steps"]
    end1(["End Process"])
    
    start --> step1
    step1 --> end1`;
    }
    
    return code;
  }
}
