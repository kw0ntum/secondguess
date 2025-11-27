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
    
    // A4 size at 300 DPI: 2480 x 3508 pixels (portrait)
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="2480" height="3508" viewBox="0 0 2480 3508" fill="none" xmlns="http://www.w3.org/2000/svg">
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
  <rect width="2480" height="3508" fill="#ffffff"/>
  
  <!-- Gradient Overlay -->
  <rect width="2480" height="3508" fill="url(#bgGradient)"/>
  
  <!-- Large Decorative Circles -->
  <circle cx="200" cy="300" r="400" fill="url(#circleGrad1)" filter="url(#blur)"/>
  <circle cx="2200" cy="600" r="500" fill="url(#circleGrad2)" filter="url(#blur)"/>
  <circle cx="400" cy="2800" r="450" fill="url(#circleGrad1)" filter="url(#blur)"/>
  <circle cx="2100" cy="3200" r="400" fill="url(#circleGrad2)" filter="url(#blur)"/>
  
  <!-- Abstract Geometric Shapes -->
  <g opacity="0.65" filter="url(#shadow)">
    <!-- Top Left Corner -->
    <rect x="100" y="100" width="600" height="600" rx="80" fill="url(#accent1)" transform="rotate(-15 400 400)"/>
    <circle cx="500" cy="400" r="200" fill="url(#accent2)"/>
    
    <!-- Top Right -->
    <polygon points="2000,200 2300,400 2200,700 1900,600" fill="url(#accent3)"/>
    <rect x="1900" y="500" width="400" height="400" rx="60" fill="url(#accent1)" transform="rotate(20 2100 700)"/>
    
    <!-- Middle Left -->
    <circle cx="300" cy="1750" r="250" fill="url(#accent2)"/>
    <rect x="200" y="1500" width="500" height="500" rx="70" fill="url(#accent1)" transform="rotate(-10 450 1750)"/>
    
    <!-- Middle Right -->
    <polygon points="2100,1600 2400,1800 2300,2100 2000,1900" fill="url(#accent3)"/>
    <circle cx="2200" cy="1850" r="220" fill="url(#accent1)"/>
    
    <!-- Bottom Left -->
    <rect x="150" y="2800" width="550" height="550" rx="75" fill="url(#accent2)" transform="rotate(12 425 3075)"/>
    <circle cx="400" cy="3100" r="180" fill="url(#accent3)"/>
    
    <!-- Bottom Right -->
    <polygon points="1950,3000 2250,3200 2150,3450 1850,3250" fill="url(#accent1)"/>
    <rect x="2000" y="3100" width="350" height="350" rx="50" fill="url(#accent2)" transform="rotate(-18 2175 3275)"/>
  </g>
  
  <!-- Industry-Specific Pattern (Centered) -->
  ${pattern}
  
  <!-- Flowing Lines - Abstract Workflow -->
  <g opacity="0.5" stroke-linecap="round">
    <!-- Horizontal Flows -->
    <path d="M200 1200 Q800 1100 1400 1200 T2200 1200" stroke="#667eea" stroke-width="8" fill="none"/>
    <path d="M200 1400 Q800 1300 1400 1400 T2200 1400" stroke="#764ba2" stroke-width="6" fill="none"/>
    <path d="M200 1600 Q800 1500 1400 1600 T2200 1600" stroke="#667eea" stroke-width="6" fill="none"/>
    
    <!-- Vertical Flows -->
    <path d="M600 200 Q500 900 600 1600 T600 3300" stroke="#764ba2" stroke-width="6" fill="none"/>
    <path d="M1240 200 Q1140 900 1240 1600 T1240 3300" stroke="#667eea" stroke-width="8" fill="none"/>
    <path d="M1880 200 Q1780 900 1880 1600 T1880 3300" stroke="#764ba2" stroke-width="6" fill="none"/>
  </g>
  
  <!-- Connected Nodes -->
  <g opacity="0.7" filter="url(#shadow)">
    <circle cx="600" cy="1200" r="80" fill="#ffffff" stroke="#667eea" stroke-width="6"/>
    <circle cx="600" cy="1200" r="35" fill="#667eea"/>
    
    <circle cx="1240" cy="1200" r="80" fill="#ffffff" stroke="#764ba2" stroke-width="6"/>
    <circle cx="1240" cy="1200" r="35" fill="#764ba2"/>
    
    <circle cx="1880" cy="1200" r="80" fill="#ffffff" stroke="#667eea" stroke-width="6"/>
    <circle cx="1880" cy="1200" r="35" fill="#667eea"/>
    
    <circle cx="600" cy="1750" r="80" fill="#ffffff" stroke="#764ba2" stroke-width="6"/>
    <circle cx="600" cy="1750" r="35" fill="#764ba2"/>
    
    <circle cx="1240" cy="1750" r="80" fill="#ffffff" stroke="#667eea" stroke-width="6"/>
    <circle cx="1240" cy="1750" r="35" fill="#667eea"/>
    
    <circle cx="1880" cy="1750" r="80" fill="#ffffff" stroke="#764ba2" stroke-width="6"/>
    <circle cx="1880" cy="1750" r="35" fill="#764ba2"/>
  </g>
  
  <!-- Decorative Corner Elements -->
  <g opacity="0.4">
    <!-- Top Left -->
    <circle cx="150" cy="150" r="120" stroke="#667eea" stroke-width="4" fill="none"/>
    <circle cx="150" cy="150" r="90" stroke="#667eea" stroke-width="3" fill="none"/>
    
    <!-- Top Right -->
    <rect x="2200" y="50" width="200" height="200" rx="30" stroke="#764ba2" stroke-width="4" fill="none"/>
    <rect x="2230" y="80" width="140" height="140" rx="20" stroke="#764ba2" stroke-width="3" fill="none"/>
    
    <!-- Bottom Left -->
    <rect x="80" y="3250" width="200" height="200" rx="30" stroke="#667eea" stroke-width="4" fill="none"/>
    <rect x="110" y="3280" width="140" height="140" rx="20" stroke="#667eea" stroke-width="3" fill="none"/>
    
    <!-- Bottom Right -->
    <circle cx="2330" cy="3358" r="120" stroke="#764ba2" stroke-width="4" fill="none"/>
    <circle cx="2330" cy="3358" r="90" stroke="#764ba2" stroke-width="3" fill="none"/>
  </g>
  
  <!-- Accent Bars -->
  <rect width="2480" height="30" fill="url(#accent1)" opacity="0.7"/>
  <rect y="3478" width="2480" height="30" fill="url(#accent3)" opacity="0.7"/>
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
      <g opacity="0.6" transform="translate(800, 1600)">
        <!-- Assembly Line with Colorful Elements -->
        <rect x="0" y="200" width="800" height="12" fill="url(#accent1)" rx="6"/>
        
        <!-- Production Boxes -->
        <rect x="50" y="100" width="150" height="150" rx="20" fill="url(#accent1)" filter="url(#shadow)"/>
        <rect x="250" y="100" width="150" height="150" rx="20" fill="url(#accent2)" filter="url(#shadow)"/>
        <rect x="450" y="100" width="150" height="150" rx="20" fill="url(#accent3)" filter="url(#shadow)"/>
        <rect x="650" y="100" width="150" height="150" rx="20" fill="url(#accent1)" filter="url(#shadow)"/>
        
        <!-- Decorative Gears -->
        <circle cx="125" cy="350" r="80" stroke="#667eea" stroke-width="10" fill="url(#accent2)" opacity="0.6"/>
        <circle cx="325" cy="350" r="80" stroke="#764ba2" stroke-width="10" fill="url(#accent1)" opacity="0.6"/>
        <circle cx="525" cy="350" r="80" stroke="#667eea" stroke-width="10" fill="url(#accent3)" opacity="0.6"/>
        <circle cx="725" cy="350" r="80" stroke="#764ba2" stroke-width="10" fill="url(#accent2)" opacity="0.6"/>
      </g>
    `;
  }

  private getTechnologyPattern(): string {
    return `
      <g opacity="0.6" transform="translate(400, 1600)">
        <!-- Network Grid -->
        <circle cx="200" cy="200" r="50" fill="url(#accent1)" filter="url(#shadow)"/>
        <circle cx="500" cy="200" r="50" fill="url(#accent2)" filter="url(#shadow)"/>
        <circle cx="800" cy="200" r="50" fill="url(#accent3)" filter="url(#shadow)"/>
        <circle cx="1100" cy="200" r="50" fill="url(#accent1)" filter="url(#shadow)"/>
        
        <circle cx="350" cy="450" r="50" fill="url(#accent2)" filter="url(#shadow)"/>
        <circle cx="650" cy="450" r="50" fill="url(#accent3)" filter="url(#shadow)"/>
        <circle cx="950" cy="450" r="50" fill="url(#accent1)" filter="url(#shadow)"/>
        
        <!-- Connections -->
        <line x1="200" y1="200" x2="500" y2="200" stroke="#667eea" stroke-width="8" opacity="0.5"/>
        <line x1="500" y1="200" x2="800" y2="200" stroke="#764ba2" stroke-width="8" opacity="0.5"/>
        <line x1="800" y1="200" x2="1100" y2="200" stroke="#667eea" stroke-width="8" opacity="0.5"/>
        
        <line x1="200" y1="200" x2="350" y2="450" stroke="#764ba2" stroke-width="6" opacity="0.5"/>
        <line x1="500" y1="200" x2="350" y2="450" stroke="#667eea" stroke-width="6" opacity="0.5"/>
        <line x1="500" y1="200" x2="650" y2="450" stroke="#764ba2" stroke-width="6" opacity="0.5"/>
        <line x1="800" y1="200" x2="650" y2="450" stroke="#667eea" stroke-width="6" opacity="0.5"/>
        <line x1="800" y1="200" x2="950" y2="450" stroke="#764ba2" stroke-width="6" opacity="0.5"/>
        <line x1="1100" y1="200" x2="950" y2="450" stroke="#667eea" stroke-width="6" opacity="0.5"/>
      </g>
    `;
  }

  private getHealthcarePattern(): string {
    return `
      <g opacity="0.6" transform="translate(900, 1600)">
        <!-- Medical Cross -->
        <rect x="250" y="100" width="100" height="400" rx="20" fill="url(#accent1)" filter="url(#shadow)"/>
        <rect x="100" y="250" width="400" height="100" rx="20" fill="url(#accent2)" filter="url(#shadow)"/>
        
        <!-- Heart Symbol -->
        <path d="M700 200 Q700 100 800 100 Q900 100 900 200 Q900 350 700 500 Q500 350 500 200 Q500 100 600 100 Q700 100 700 200 Z" 
              fill="url(#accent3)" filter="url(#shadow)"/>
        
        <!-- Pulse Line -->
        <path d="M100 600 L200 600 L250 500 L300 700 L350 600 L600 600" 
              stroke="#667eea" stroke-width="12" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      </g>
    `;
  }

  private getFinancePattern(): string {
    return `
      <g opacity="0.6" transform="translate(500, 1600)">
        <!-- Colorful Bar Chart -->
        <rect x="100" y="300" width="120" height="200" rx="15" fill="url(#accent1)" filter="url(#shadow)"/>
        <rect x="270" y="220" width="120" height="280" rx="15" fill="url(#accent2)" filter="url(#shadow)"/>
        <rect x="440" y="150" width="120" height="350" rx="15" fill="url(#accent3)" filter="url(#shadow)"/>
        <rect x="610" y="250" width="120" height="250" rx="15" fill="url(#accent1)" filter="url(#shadow)"/>
        <rect x="780" y="180" width="120" height="320" rx="15" fill="url(#accent2)" filter="url(#shadow)"/>
        <rect x="950" y="200" width="120" height="300" rx="15" fill="url(#accent3)" filter="url(#shadow)"/>
        
        <!-- Trend Line -->
        <path d="M160 400 L330 320 L500 250 L670 350 L840 280 L1010 300" 
              stroke="#667eea" stroke-width="10" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="0.7"/>
        
        <!-- Data Points -->
        <circle cx="160" cy="400" r="20" fill="#ffffff" stroke="#667eea" stroke-width="4"/>
        <circle cx="330" cy="320" r="20" fill="#ffffff" stroke="#764ba2" stroke-width="4"/>
        <circle cx="500" cy="250" r="20" fill="#ffffff" stroke="#667eea" stroke-width="4"/>
        <circle cx="670" cy="350" r="20" fill="#ffffff" stroke="#764ba2" stroke-width="4"/>
        <circle cx="840" cy="280" r="20" fill="#ffffff" stroke="#667eea" stroke-width="4"/>
        <circle cx="1010" cy="300" r="20" fill="#ffffff" stroke="#764ba2" stroke-width="4"/>
      </g>
    `;
  }

  private getGenericPattern(): string {
    return `
      <g opacity="0.6" transform="translate(700, 1600)">
        <!-- Interconnected Colorful Circles -->
        <circle cx="250" cy="250" r="150" fill="url(#accent1)" filter="url(#shadow)"/>
        <circle cx="550" cy="250" r="150" fill="url(#accent2)" filter="url(#shadow)"/>
        <circle cx="850" cy="250" r="150" fill="url(#accent3)" filter="url(#shadow)"/>
        
        <circle cx="400" cy="500" r="150" fill="url(#accent2)" filter="url(#shadow)"/>
        <circle cx="700" cy="500" r="150" fill="url(#accent1)" filter="url(#shadow)"/>
        
        <!-- Connection Lines -->
        <line x1="250" y1="250" x2="400" y2="500" stroke="#667eea" stroke-width="8" opacity="0.5"/>
        <line x1="550" y1="250" x2="400" y2="500" stroke="#764ba2" stroke-width="8" opacity="0.5"/>
        <line x1="550" y1="250" x2="700" y2="500" stroke="#667eea" stroke-width="8" opacity="0.5"/>
        <line x1="850" y1="250" x2="700" y2="500" stroke="#764ba2" stroke-width="8" opacity="0.5"/>
        
        <!-- Center Nodes -->
        <circle cx="325" cy="375" r="30" fill="#ffffff" stroke="#667eea" stroke-width="6"/>
        <circle cx="475" cy="375" r="30" fill="#ffffff" stroke="#764ba2" stroke-width="6"/>
        <circle cx="625" cy="375" r="30" fill="#ffffff" stroke="#667eea" stroke-width="6"/>
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
