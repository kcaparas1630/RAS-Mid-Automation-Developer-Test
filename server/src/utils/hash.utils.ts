import crypto from 'crypto';

/**
 * Generate SHA-256 hash for invoice deduplication
 * Based on vendor name, date, and amount
 */
export function generateInvoiceHash(
  vendorName: string,
  date: string,
  amount: number
): string {
  // Normalize inputs to ensure consistent hashing
  const normalizedVendor = vendorName.trim().toLowerCase();
  const normalizedDate = date.trim().toLowerCase();
  const normalizedAmount = amount.toFixed(2);

  // Create hash string
  const hashString = `${normalizedVendor}|${normalizedDate}|${normalizedAmount}`;

  // Generate SHA-256 hash
  return crypto
    .createHash('sha256')
    .update(hashString)
    .digest('hex');
}
