/**
 * Vendor normalization utilities using fuzzy matching
 * Standardizes vendor names to prevent duplicates from OCR errors
 */

import fs from 'fs';
import path from 'path';
import logger from '../config/logger';

// Interface for vendor mapping configuration
interface VendorMapping {
  standardName: string;
  variations: string[];
}

// Default vendor mappings - can be extended via JSON file
let VENDOR_MAPPINGS: Record<string, string> = {
  'home depot': 'Home Depot',
  'the home depot': 'Home Depot',
  'homedepot': 'Home Depot',
  'h0me depot': 'Home Depot',
  'home dep0t': 'Home Depot',

  'rona': 'RONA',
  'rona inc': 'RONA',
  'rona hardware': 'RONA',
  'r0na': 'RONA',

  'lowes': "Lowe's",
  "lowe's": "Lowe's",
  'lowes home improvement': "Lowe's",
  'l0wes': "Lowe's",

  'canadian tire': 'Canadian Tire',
  'cdn tire': 'Canadian Tire',

  'lumber yard': 'Lumber Yard',
  'the lumber yard': 'Lumber Yard',
};

/**
 * Load custom vendor mappings from external JSON file
 * File format: { "vendors": [{ "standardName": "Vendor Name", "variations": ["var1", "var2"] }] }
 */
export function loadCustomVendorMappings(filePath?: string): void {
  try {
    const mappingPath = filePath || path.join(process.cwd(), 'vendor-mappings.json');

    if (fs.existsSync(mappingPath)) {
      const fileContent = fs.readFileSync(mappingPath, 'utf-8');
      const customMappings: { vendors: VendorMapping[] } = JSON.parse(fileContent);

      customMappings.vendors.forEach(vendor => {
        vendor.variations.forEach(variation => {
          const cleaned = cleanVendorName(variation);
          VENDOR_MAPPINGS[cleaned] = vendor.standardName;
        });
      });

      logger.info(`Loaded ${customMappings.vendors.length} custom vendor mappings`);
    }
  } catch (error) {
    logger.warn('Could not load custom vendor mappings:', error);
  }
}

/**
 * Save current vendor mappings to JSON file for future editing
 */
export function exportVendorMappings(filePath?: string): void {
  try {
    const mappingPath = filePath || path.join(process.cwd(), 'vendor-mappings.json');

    // Convert current mappings to the structured format
    const vendorMap = new Map<string, string[]>();

    Object.entries(VENDOR_MAPPINGS).forEach(([variation, standardName]) => {
      if (!vendorMap.has(standardName)) {
        vendorMap.set(standardName, []);
      }
      vendorMap.get(standardName)!.push(variation);
    });

    const exportData = {
      vendors: Array.from(vendorMap.entries()).map(([standardName, variations]) => ({
        standardName,
        variations
      }))
    };

    fs.writeFileSync(mappingPath, JSON.stringify(exportData, null, 2));
    logger.info(`Exported vendor mappings to ${mappingPath}`);
  } catch (error) {
    logger.error('Failed to export vendor mappings:', error);
  }
}

/**
 * Calculate Levenshtein distance between two strings
 * Used for fuzzy matching vendor names
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * Calculate similarity ratio between two strings (0-1)
 */
function similarityRatio(str1: string, str2: string): number {
  const distance = levenshteinDistance(str1, str2);
  const maxLength = Math.max(str1.length, str2.length);

  if (maxLength === 0) return 1.0;

  return 1 - (distance / maxLength);
}

/**
 * Normalize vendor name by removing common OCR errors and standardizing format
 */
function cleanVendorName(vendor: string): string {
  return vendor
    .toLowerCase()
    .trim()
    // Remove special characters and extra spaces
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    // Fix common OCR errors
    .replace(/0/g, 'o') // Replace 0 with o
    .replace(/1/g, 'l') // Replace 1 with l in context
    .replace(/5/g, 's'); // Replace 5 with s in context
}

/**
 * Normalize vendor name to standardized form
 * Uses both exact matching and fuzzy matching
 */
export function normalizeVendorName(vendorName: string): string {
  // Clean the input
  const cleaned = cleanVendorName(vendorName);

  // Check for exact match in mappings
  if (VENDOR_MAPPINGS[cleaned]) {
    return VENDOR_MAPPINGS[cleaned];
  }

  // Try fuzzy matching with known vendors
  const SIMILARITY_THRESHOLD = 0.8;
  let bestMatch = '';
  let bestScore = 0;

  for (const [key, standardName] of Object.entries(VENDOR_MAPPINGS)) {
    const similarity = similarityRatio(cleaned, key);

    if (similarity > bestScore && similarity >= SIMILARITY_THRESHOLD) {
      bestScore = similarity;
      bestMatch = standardName;
    }
  }

  // If we found a good match, use it
  if (bestMatch) {
    return bestMatch;
  }

  // Otherwise, return a cleaned version with proper capitalization
  return vendorName
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Add a new vendor mapping dynamically
 * Useful for runtime additions without restarting the server
 */
export function addVendorMapping(variations: string[], standardName: string): void {
  variations.forEach(variation => {
    const cleaned = cleanVendorName(variation);
    VENDOR_MAPPINGS[cleaned] = standardName;
  });

  logger.info(`Added vendor mapping: ${standardName} with ${variations.length} variations`);
}

/**
 * Get all current vendor mappings (for admin/debugging)
 */
export function getAllVendorMappings(): Record<string, string> {
  return { ...VENDOR_MAPPINGS };
}

/**
 * Clear all vendor mappings and reload defaults
 */
export function resetVendorMappings(): void {
  VENDOR_MAPPINGS = {
    'home depot': 'Home Depot',
    'the home depot': 'Home Depot',
    'homedepot': 'Home Depot',
    'h0me depot': 'Home Depot',
    'home dep0t': 'Home Depot',

    'rona': 'RONA',
    'rona inc': 'RONA',
    'rona hardware': 'RONA',
    'r0na': 'RONA',

    'lowes': "Lowe's",
    "lowe's": "Lowe's",
    'lowes home improvement': "Lowe's",
    'l0wes': "Lowe's",

    'canadian tire': 'Canadian Tire',
    'cdn tire': 'Canadian Tire',

    'lumber yard': 'Lumber Yard',
    'the lumber yard': 'Lumber Yard',
  };

  logger.info('Vendor mappings reset to defaults');
}

// Auto-load custom mappings on module initialization
loadCustomVendorMappings();
