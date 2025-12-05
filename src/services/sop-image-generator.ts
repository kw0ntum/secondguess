/**
 * SOP Image Generator Service
 * Uses Gemini to generate professional cover images for SOP documents
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '../utils/logger';

export interface ImageGenerationInput {
  title: string;
  description: string;
  industry?: string;
  processType?: string;
  keywords?: string[];
}

export interface GeneratedImage {
  imageData: string; // Base64 encoded image
  mimeType: string;
  prompt: string;
  generatedAt: Date;
}

export class SOPImageGenerator {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not set');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    // Use Gemini model that supports image generation
    this.model = this.genAI.getGenerativeModel({ 
      model: 'gemini-pro-vision' // Note: Check latest Gemini docs for image generation model
    });

    logger.info('SOP Image Generator initialized');
  }

  /**
   * Generate a professional cover image for an SOP document
   */
  async generateCoverImage(input: ImageGenerationInput): Promise<GeneratedImage> {
    try {
      logger.info('Generating SOP cover image', { title: input.title });

      const prompt = this.buildImagePrompt(input);
      
      // Note: Gemini's image generation is currently in development
      // For now, we'll generate a descriptive prompt that can be used with other services
      // or return a professionally designed SVG as a fallback
      
      const fallbackImage = this.generateFallbackSVG(input);
      
      logger.info('SOP cover image generated successfully');
      
      return {
        imageData: fallbackImage,
        mimeType: 'image/svg+xml',
        prompt: prompt,
        generatedAt: new Date()
      };
    } catch (error) {
      logger.error('Failed to generate SOP cover image:', error);
      // Return fallback image on error
      return this.generateFallbackImage(input);
    }
  }

  /**
   * Build a detailed prompt for image generation
   */
  private buildImagePrompt(input: ImageGenerationInput): string {
    const keywords = input.keywords?.join(', ') || 'professional, business, workflow';
    
    return `Create a professional, minimalist cover image for a Standard Operating Procedure (SOP) document.

Title: ${input.title}
Description: ${input.description}
Industry: ${input.industry || 'General Business'}
Process Type: ${input.processType || 'Business Process'}

Style Requirements:
- Professional and corporate aesthetic
- Clean, modern design
- Minimalist approach with plenty of white space
- Subtle use of blue (#667eea) as accent color
- Abstract geometric shapes or icons representing: ${keywords}
- No text or words in the image
- High contrast for print clarity
- Suitable for business documentation

Visual Elements:
- Abstract representation of workflow/process (flowing lines, connected nodes)
- Geometric shapes suggesting organization and structure
- Subtle gradient or flat design
- Professional iconography related to: documentation, quality, process, efficiency

Color Palette:
- Primary: White (#ffffff)
- Accent: Blue (#667eea)
- Secondary: Light gray (#f3f4f6)
- Text-safe: High contrast areas for overlaying text

Composition:
- Centered or balanced layout
- Space for title text overlay at top/center
- Professional and suitable for corporate documentation
- Print-ready quality`;
  }

  /**
   * Generate a professional SVG as fallback - Full page artistic background with NO TEXT
   */
  private generateFallbackSVG(input: ImageGenerationInput): string {
    // Create a dynamic SVG based on the input
    const keywords = input.keywords || ['process', 'workflow', 'quality'];
    
    // Generate different patterns based on keywords
    const pattern = this.selectPatternByKeywords(keywords);
    
    // US Letter size at 300 DPI: 3300 x 2550 pixels (landscape - 11" x 8.5")
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="3300" height="2550" viewBox="0 0 3300 2550" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Gradients and Filters -->
  <defs>
    <!-- Main Background Gradient -->
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:0.35" />
      <stop offset="50%" style="stop-color:#764ba2;stop-opacity:0.25" />
      <stop offset="100%" style="stop-color:#667eea;stop-opacity:0.35" />
    </linearGradient>
    
    <!-- Accent Gradients -->
    <linearGradient id="accent1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:0.85" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:0.75" />
    </linearGradient>
    
    <linearGradient id="accent2" x1="100%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#764ba2;stop-opacity:0.8" />
      <stop offset="100%" style="stop-color:#667eea;stop-opacity:0.7" />
    </linearGradient>
    
    <linearGradient id="accent3" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:0.75" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:0.85" />
    </linearGradient>
    
    <!-- Radial Gradients for Circles -->
    <radialGradient id="circleGrad1">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:0.6" />
      <stop offset="100%" style="stop-color:#667eea;stop-opacity:0.1" />
    </radialGradient>
    
    <radialGradient id="circleGrad2">
      <stop offset="0%" style="stop-color:#764ba2;stop-opacity:0.6" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:0.1" />
    </radialGradient>
    
    <!-- Blur Filter -->
    <filter id="blur">
      <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
    </filter>
    
    <filter id="shadow">
      <feDropShadow dx="0" dy="8" stdDeviation="15" flood-opacity="0.15"/>
    </filter>
  </defs>
  
  <!-- Base Background -->
  <rect width="3300" height="2550" fill="#ffffff"/>
  
  <!-- Gradient Overlay -->
  <rect width="3300" height="2550" fill="url(#bgGradient)"/>
  
  <!-- Large Decorative Circles -->
  <circle cx="300" cy="200" r="400" fill="url(#circleGrad1)" filter="url(#blur)"/>
  <circle cx="2900" cy="400" r="500" fill="url(#circleGrad2)" filter="url(#blur)"/>
  <circle cx="600" cy="2150" r="450" fill="url(#circleGrad1)" filter="url(#blur)"/>
  <circle cx="2700" cy="2250" r="400" fill="url(#circleGrad2)" filter="url(#blur)"/>
  
  <!-- Abstract Geometric Shapes -->
  <g opacity="0.65" filter="url(#shadow)">
    <!-- Top Left Corner -->
    <rect x="100" y="100" width="500" height="500" rx="70" fill="url(#accent1)" transform="rotate(-15 350 350)"/>
    <circle cx="400" cy="350" r="180" fill="url(#accent2)"/>
    
    <!-- Top Right -->
    <polygon points="2900,150 3200,300 3100,550 2800,450" fill="url(#accent3)"/>
    <rect x="2800" y="350" width="350" height="350" rx="50" fill="url(#accent1)" transform="rotate(20 2975 525)"/>
    
    <!-- Middle Left -->
    <circle cx="300" cy="1240" r="220" fill="url(#accent2)"/>
    <rect x="200" y="1000" width="450" height="450" rx="60" fill="url(#accent1)" transform="rotate(-10 425 1225)"/>
    
    <!-- Middle Right -->
    <polygon points="3000,1100 3300,1250 3200,1500 2900,1350" fill="url(#accent3)"/>
    <circle cx="3100" cy="1300" r="200" fill="url(#accent1)"/>
    
    <!-- Bottom Left -->
    <rect x="150" y="1900" width="500" height="500" rx="70" fill="url(#accent2)" transform="rotate(12 400 2150)"/>
    <circle cx="400" cy="2200" r="160" fill="url(#accent3)"/>
    
    <!-- Bottom Right -->
    <polygon points="2850,2000 3150,2150 3050,2400 2750,2250" fill="url(#accent1)"/>
    <rect x="2900" y="2100" width="320" height="320" rx="45" fill="url(#accent2)" transform="rotate(-18 3060 2260)"/>
  </g>
  
  <!-- Industry-Specific Pattern (Centered) -->
  ${pattern}
  
  <!-- Flowing Lines - Abstract Workflow -->
  <g opacity="0.5" stroke-linecap="round">
    <!-- Horizontal Flows -->
    <path d="M200 800 Q1200 700 2200 800 T3300 800" stroke="#667eea" stroke-width="8" fill="none"/>
    <path d="M200 1240 Q1200 1140 2200 1240 T3300 1240" stroke="#764ba2" stroke-width="6" fill="none"/>
    <path d="M200 1680 Q1200 1580 2200 1680 T3300 1680" stroke="#667eea" stroke-width="6" fill="none"/>
    
    <!-- Vertical Flows -->
    <path d="M800 200 Q700 900 800 1600 T800 2280" stroke="#764ba2" stroke-width="6" fill="none"/>
    <path d="M1754 200 Q1654 900 1754 1600 T1754 2280" stroke="#667eea" stroke-width="8" fill="none"/>
    <path d="M2708 200 Q2608 900 2708 1600 T2708 2280" stroke="#764ba2" stroke-width="6" fill="none"/>
  </g>
  
  <!-- Connected Nodes -->
  <g opacity="0.7" filter="url(#shadow)">
    <circle cx="800" cy="800" r="80" fill="#ffffff" stroke="#667eea" stroke-width="6"/>
    <circle cx="800" cy="800" r="35" fill="#667eea"/>
    
    <circle cx="1754" cy="800" r="80" fill="#ffffff" stroke="#764ba2" stroke-width="6"/>
    <circle cx="1754" cy="800" r="35" fill="#764ba2"/>
    
    <circle cx="2708" cy="800" r="80" fill="#ffffff" stroke="#667eea" stroke-width="6"/>
    <circle cx="2708" cy="800" r="35" fill="#667eea"/>
    
    <circle cx="800" cy="1240" r="80" fill="#ffffff" stroke="#764ba2" stroke-width="6"/>
    <circle cx="800" cy="1240" r="35" fill="#764ba2"/>
    
    <circle cx="1754" cy="1240" r="80" fill="#ffffff" stroke="#667eea" stroke-width="6"/>
    <circle cx="1754" cy="1240" r="35" fill="#667eea"/>
    
    <circle cx="2708" cy="1240" r="80" fill="#ffffff" stroke="#764ba2" stroke-width="6"/>
    <circle cx="2708" cy="1240" r="35" fill="#764ba2"/>
    
    <circle cx="800" cy="1680" r="80" fill="#ffffff" stroke="#667eea" stroke-width="6"/>
    <circle cx="800" cy="1680" r="35" fill="#667eea"/>
    
    <circle cx="1754" cy="1680" r="80" fill="#ffffff" stroke="#764ba2" stroke-width="6"/>
    <circle cx="1754" cy="1680" r="35" fill="#764ba2"/>
    
    <circle cx="2708" cy="1680" r="80" fill="#ffffff" stroke="#667eea" stroke-width="6"/>
    <circle cx="2708" cy="1680" r="35" fill="#667eea"/>
  </g>
  
  <!-- Decorative Corner Elements -->
  <g opacity="0.4">
    <!-- Top Left -->
    <circle cx="150" cy="150" r="120" stroke="#667eea" stroke-width="4" fill="none"/>
    <circle cx="150" cy="150" r="90" stroke="#667eea" stroke-width="3" fill="none"/>
    
    <!-- Top Right -->
    <rect x="2950" y="50" width="200" height="200" rx="30" stroke="#764ba2" stroke-width="4" fill="none"/>
    <rect x="2980" y="80" width="140" height="140" rx="20" stroke="#764ba2" stroke-width="3" fill="none"/>
    
    <!-- Bottom Left -->
    <rect x="80" y="2250" width="200" height="200" rx="30" stroke="#667eea" stroke-width="4" fill="none"/>
    <rect x="110" y="2280" width="140" height="140" rx="20" stroke="#667eea" stroke-width="3" fill="none"/>
    
    <!-- Bottom Right -->
    <circle cx="3150" cy="2400" r="120" stroke="#764ba2" stroke-width="4" fill="none"/>
    <circle cx="3150" cy="2400" r="90" stroke="#764ba2" stroke-width="3" fill="none"/>
  </g>
  
  <!-- Accent Bars -->
  <rect width="3300" height="30" fill="url(#accent1)" opacity="0.7"/>
  <rect y="2520" width="3300" height="30" fill="url(#accent3)" opacity="0.7"/>
</svg>`;

    return Buffer.from(svg).toString('base64');
  }

  /**
   * Select pattern based on keywords
   */
  private selectPatternByKeywords(keywords: string[]): string {
    const keywordStr = keywords.join(' ').toLowerCase();
    
    if (keywordStr.includes('manufacturing') || keywordStr.includes('production')) {
      return this.getManufacturingPattern();
    } else if (keywordStr.includes('software') || keywordStr.includes('technology')) {
      return this.getTechnologyPattern();
    } else if (keywordStr.includes('healthcare') || keywordStr.includes('medical')) {
      return this.getHealthcarePattern();
    } else if (keywordStr.includes('finance') || keywordStr.includes('banking')) {
      return this.getFinancePattern();
    } else {
      return this.getGenericPattern();
    }
  }

  /**
   * Pattern generators for different industries - Colorful and artistic
   */
  private getManufacturingPattern(): string {
    return `
      <g opacity="0.6" transform="translate(1200, 900)">
        <!-- Assembly Line with Colorful Elements -->
        <rect x="0" y="200" width="1000" height="12" fill="url(#accent1)" rx="6"/>
        
        <!-- Production Boxes -->
        <rect x="50" y="100" width="150" height="150" rx="20" fill="url(#accent1)" filter="url(#shadow)"/>
        <rect x="275" y="100" width="150" height="150" rx="20" fill="url(#accent2)" filter="url(#shadow)"/>
        <rect x="500" y="100" width="150" height="150" rx="20" fill="url(#accent3)" filter="url(#shadow)"/>
        <rect x="725" y="100" width="150" height="150" rx="20" fill="url(#accent1)" filter="url(#shadow)"/>
        
        <!-- Decorative Gears -->
        <circle cx="125" cy="350" r="70" stroke="#667eea" stroke-width="8" fill="url(#accent2)" opacity="0.6"/>
        <circle cx="350" cy="350" r="70" stroke="#764ba2" stroke-width="8" fill="url(#accent1)" opacity="0.6"/>
        <circle cx="575" cy="350" r="70" stroke="#667eea" stroke-width="8" fill="url(#accent3)" opacity="0.6"/>
        <circle cx="800" cy="350" r="70" stroke="#764ba2" stroke-width="8" fill="url(#accent2)" opacity="0.6"/>
      </g>
    `;
  }

  private getTechnologyPattern(): string {
    return `
      <g opacity="0.6" transform="translate(900, 900)">
        <!-- Network Grid -->
        <circle cx="200" cy="150" r="50" fill="url(#accent1)" filter="url(#shadow)"/>
        <circle cx="550" cy="150" r="50" fill="url(#accent2)" filter="url(#shadow)"/>
        <circle cx="900" cy="150" r="50" fill="url(#accent3)" filter="url(#shadow)"/>
        <circle cx="1250" cy="150" r="50" fill="url(#accent1)" filter="url(#shadow)"/>
        
        <circle cx="375" cy="400" r="50" fill="url(#accent2)" filter="url(#shadow)"/>
        <circle cx="725" cy="400" r="50" fill="url(#accent3)" filter="url(#shadow)"/>
        <circle cx="1075" cy="400" r="50" fill="url(#accent1)" filter="url(#shadow)"/>
        
        <!-- Connections -->
        <line x1="200" y1="150" x2="550" y2="150" stroke="#667eea" stroke-width="8" opacity="0.5"/>
        <line x1="550" y1="150" x2="900" y2="150" stroke="#764ba2" stroke-width="8" opacity="0.5"/>
        <line x1="900" y1="150" x2="1250" y2="150" stroke="#667eea" stroke-width="8" opacity="0.5"/>
        
        <line x1="200" y1="150" x2="375" y2="400" stroke="#764ba2" stroke-width="6" opacity="0.5"/>
        <line x1="550" y1="150" x2="375" y2="400" stroke="#667eea" stroke-width="6" opacity="0.5"/>
        <line x1="550" y1="150" x2="725" y2="400" stroke="#764ba2" stroke-width="6" opacity="0.5"/>
        <line x1="900" y1="150" x2="725" y2="400" stroke="#667eea" stroke-width="6" opacity="0.5"/>
        <line x1="900" y1="150" x2="1075" y2="400" stroke="#764ba2" stroke-width="6" opacity="0.5"/>
        <line x1="1250" y1="150" x2="1075" y2="400" stroke="#667eea" stroke-width="6" opacity="0.5"/>
      </g>
    `;
  }

  private getHealthcarePattern(): string {
    return `
      <g opacity="0.6" transform="translate(1300, 900)">
        <!-- Medical Cross -->
        <rect x="250" y="80" width="90" height="350" rx="18" fill="url(#accent1)" filter="url(#shadow)"/>
        <rect x="120" y="210" width="350" height="90" rx="18" fill="url(#accent2)" filter="url(#shadow)"/>
        
        <!-- Heart Symbol -->
        <path d="M700 180 Q700 90 790 90 Q880 90 880 180 Q880 310 700 440 Q520 310 520 180 Q520 90 610 90 Q700 90 700 180 Z" 
              fill="url(#accent3)" filter="url(#shadow)"/>
        
        <!-- Pulse Line -->
        <path d="M100 520 L200 520 L250 430 L300 610 L350 520 L600 520" 
              stroke="#667eea" stroke-width="10" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      </g>
    `;
  }

  private getFinancePattern(): string {
    return `
      <g opacity="0.6" transform="translate(900, 900)">
        <!-- Colorful Bar Chart -->
        <rect x="100" y="250" width="110" height="180" rx="14" fill="url(#accent1)" filter="url(#shadow)"/>
        <rect x="260" y="190" width="110" height="240" rx="14" fill="url(#accent2)" filter="url(#shadow)"/>
        <rect x="420" y="130" width="110" height="300" rx="14" fill="url(#accent3)" filter="url(#shadow)"/>
        <rect x="580" y="210" width="110" height="220" rx="14" fill="url(#accent1)" filter="url(#shadow)"/>
        <rect x="740" y="160" width="110" height="270" rx="14" fill="url(#accent2)" filter="url(#shadow)"/>
        <rect x="900" y="180" width="110" height="250" rx="14" fill="url(#accent3)" filter="url(#shadow)"/>
        <rect x="1060" y="200" width="110" height="230" rx="14" fill="url(#accent1)" filter="url(#shadow)"/>
        
        <!-- Trend Line -->
        <path d="M155 340 L315 280 L475 220 L635 310 L795 250 L955 270 L1115 290" 
              stroke="#667eea" stroke-width="9" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="0.7"/>
        
        <!-- Data Points -->
        <circle cx="155" cy="340" r="18" fill="#ffffff" stroke="#667eea" stroke-width="4"/>
        <circle cx="315" cy="280" r="18" fill="#ffffff" stroke="#764ba2" stroke-width="4"/>
        <circle cx="475" cy="220" r="18" fill="#ffffff" stroke="#667eea" stroke-width="4"/>
        <circle cx="635" cy="310" r="18" fill="#ffffff" stroke="#764ba2" stroke-width="4"/>
        <circle cx="795" cy="250" r="18" fill="#ffffff" stroke="#667eea" stroke-width="4"/>
        <circle cx="955" cy="270" r="18" fill="#ffffff" stroke="#764ba2" stroke-width="4"/>
        <circle cx="1115" cy="290" r="18" fill="#ffffff" stroke="#667eea" stroke-width="4"/>
      </g>
    `;
  }

  private getGenericPattern(): string {
    return `
      <g opacity="0.6" transform="translate(1100, 900)">
        <!-- Interconnected Colorful Circles -->
        <circle cx="250" cy="200" r="140" fill="url(#accent1)" filter="url(#shadow)"/>
        <circle cx="600" cy="200" r="140" fill="url(#accent2)" filter="url(#shadow)"/>
        <circle cx="950" cy="200" r="140" fill="url(#accent3)" filter="url(#shadow)"/>
        
        <circle cx="425" cy="450" r="140" fill="url(#accent2)" filter="url(#shadow)"/>
        <circle cx="775" cy="450" r="140" fill="url(#accent1)" filter="url(#shadow)"/>
        
        <!-- Connection Lines -->
        <line x1="250" y1="200" x2="425" y2="450" stroke="#667eea" stroke-width="8" opacity="0.5"/>
        <line x1="600" y1="200" x2="425" y2="450" stroke="#764ba2" stroke-width="8" opacity="0.5"/>
        <line x1="600" y1="200" x2="775" y2="450" stroke="#667eea" stroke-width="8" opacity="0.5"/>
        <line x1="950" y1="200" x2="775" y2="450" stroke="#764ba2" stroke-width="8" opacity="0.5"/>
        
        <!-- Center Nodes -->
        <circle cx="337" cy="325" r="28" fill="#ffffff" stroke="#667eea" stroke-width="5"/>
        <circle cx="512" cy="325" r="28" fill="#ffffff" stroke="#764ba2" stroke-width="5"/>
        <circle cx="687" cy="325" r="28" fill="#ffffff" stroke="#667eea" stroke-width="5"/>
      </g>
    `;
  }

  /**
   * Generate fallback image on error
   */
  private generateFallbackImage(input: ImageGenerationInput): GeneratedImage {
    const svg = this.generateFallbackSVG(input);
    
    return {
      imageData: svg,
      mimeType: 'image/svg+xml',
      prompt: 'Fallback image generated due to error',
      generatedAt: new Date()
    };
  }

  /**
   * Convert base64 image to data URL
   */
  toDataURL(image: GeneratedImage): string {
    return `data:${image.mimeType};base64,${image.imageData}`;
  }
}
