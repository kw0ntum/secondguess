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

      // ALWAYS generate all three diagrams
      
      // 1. Generate main process flowchart
      const flowchart = await this.generateFlowchart(input);
      charts.push(flowchart);

      // 2. Generate event diagram (always, even with single actor)
      const eventDiagram = await this.generateSwimlane(input);
      charts.push(eventDiagram);

      // 3. Always generate data flow diagram
      const dataFlow = await this.generateDataFlow(input);
      charts.push(dataFlow);

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
5. Keep labels VERY SHORT (max 30 characters)
6. NO special characters in labels except spaces, hyphens, and periods
7. NO line breaks within labels
8. NO quotes within labels
9. Include start and end nodes
10. Keep it COMPACT - max 8 nodes total
11. Combine similar steps if needed to keep diagram focused
12. Use only alphanumeric characters and basic punctuation in node IDs

Example format:
flowchart TD
    start(["Start"])
    step1["Gather data"]
    decision1{"Valid?"}
    step2["Process"]
    step3["Reject"]
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
      caption: `Complete process flow with all steps and decision points`
    };
  }

  /**
   * Generate event diagram for multi-actor processes (replacing swimlane)
   */
  private async generateSwimlane(input: ChartGenerationInput): Promise<GeneratedChart> {
    const prompt = `You are an expert in creating event-driven process diagrams for Standard Operating Procedures (SOPs).

Generate a Mermaid sequence diagram showing the event flow and interactions between actors:

TITLE: ${input.title}
DESCRIPTION: ${input.description}

ACTORS: ${input.actors?.join(', ')}

STEPS:
${input.steps.map((step, i) => `${i + 1}. ${step.description || step.title || step}${step.actor ? ` (Actor: ${step.actor})` : ''}`).join('\n')}

CRITICAL Requirements - MUST FOLLOW EXACTLY:
1. Use ONLY Mermaid sequence diagram syntax: sequenceDiagram
2. Show events and interactions between actors
3. Use participant declarations for each actor
4. Show message flow with arrows (->>, ->, -->>)
5. Include activation boxes for active processes
6. Keep labels SHORT (max 40 characters)
7. Show the temporal sequence of events
8. Max 3-4 actors, 6-8 interactions

EXACT FORMAT - COPY THIS STRUCTURE:
sequenceDiagram
    participant E as Employee
    participant M as Manager
    participant S as System
    
    E->>M: Submit request
    activate M
    M->>E: Request info
    deactivate M
    E->>M: Provide details
    activate M
    M->>S: Process request
    activate S
    S-->>M: Confirmation
    deactivate S
    M->>E: Send approval
    deactivate M

IMPORTANT: 
- Each actor is a participant
- Show clear event flow with arrows
- Use activate/deactivate for processing
- Keep it focused on key events

Return ONLY valid Mermaid code, no explanations.`;

    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    let mermaidCode = response.text().trim();

    mermaidCode = this.cleanMermaidCode(mermaidCode);

    return {
      type: 'sequence',
      title: 'Event Flow Diagram',
      description: 'Shows the sequence of events and interactions between actors',
      mermaidCode,
      caption: `Event-driven process flow showing actor interactions`
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
${input.steps.slice(0, 5).map((step, i) => `${i + 1}. ${step.description || step.title || step}`).join('\n')}

OUTPUTS:
${input.outputs.map((out, i) => `${i + 1}. ${out.name || out}${out.description ? `: ${out.description}` : ''}`).join('\n')}

Requirements:
1. Use ONLY Mermaid flowchart syntax: flowchart LR
2. Simple node IDs without spaces (inp1, proc1, out1, etc.)
3. VERY SHORT labels (max 25 characters)
4. Use this EXACT syntax:
   - Input nodes: inp1[/"Input name"/]
   - Process nodes: proc1["Process step"]
   - Output nodes: out1[\"Output name"\]
5. Flow left to right: inputs --> process --> outputs
6. Keep it SIMPLE - max 3 inputs, 3 processes, 3 outputs
7. Group multiple similar items into one node if needed

Example format:
flowchart LR
    inp1[/"Customer Data"/]
    inp2[/"Requirements"/]
    proc1["Validate"]
    proc2["Process"]
    out1[\"Report"\]
    out2[\"Notification"\]
    
    inp1 --> proc1
    inp2 --> proc1
    proc1 --> proc2
    proc2 --> out1
    proc2 --> out2

Return ONLY valid Mermaid code, no explanations or markdown.`;

    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    let mermaidCode = response.text().trim();

    mermaidCode = this.cleanMermaidCode(mermaidCode);

    return {
      type: 'flowchart',
      title: 'Input-Process-Output Diagram',
      description: 'Shows the flow of information from inputs through processing to outputs',
      mermaidCode,
      caption: `Data flow from inputs through processing to final outputs`
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
