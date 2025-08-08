import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a story with proper punctuation and paragraph breaks
 */
export function formatStoryText(text: string): string {
  if (!text || text.trim().length === 0) {
    return text;
  }

  let formatted = text.trim();

  // Fix basic punctuation
  // Add periods to sentences that don't end with punctuation
  formatted = formatted.replace(/([a-záéíóúñü])\s+([A-ZÁÉÍÓÚÑÜ])/g, '$1. $2');
  
  // Ensure sentences start with capital letters
  formatted = formatted.replace(/^\w/g, (match) => match.toUpperCase());
  formatted = formatted.replace(/\.\s+\w/g, (match) => match.toUpperCase());
  
  // Add commas for natural pauses (simple heuristic)
  formatted = formatted.replace(/\s+(y|pero|sin embargo|entonces|después|luego|cuando|donde|mientras)\s+/g, ', $1 ');
  
  // Break into paragraphs at natural break points
  // Look for topic changes, time indicators, or long continuous text
  const sentences = formatted.split(/\.\s+/);
  const paragraphs: string[] = [];
  let currentParagraph: string[] = [];
  
  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i].trim();
    if (!sentence) continue;
    
    currentParagraph.push(sentence);
    
    // Check for paragraph break indicators
    const shouldBreak = (
      currentParagraph.length >= 4 || // Long paragraph
      sentence.match(/\b(entonces|después|luego|más tarde|al día siguiente|años después|tiempo después)\b/i) || // Time transitions
      sentence.match(/\b(recuerdo que|me acuerdo|otra vez|también|además)\b/i) || // Topic transitions
      (i > 0 && sentence.length > 80) // Long sentence might be a new topic
    );
    
    if (shouldBreak && currentParagraph.length > 1) {
      paragraphs.push(currentParagraph.join('. ') + '.');
      currentParagraph = [];
    }
  }
  
  // Add any remaining sentences
  if (currentParagraph.length > 0) {
    paragraphs.push(currentParagraph.join('. ') + '.');
  }
  
  // Join paragraphs with double line breaks
  return paragraphs.filter(p => p.trim().length > 0).join('\n\n');
}
