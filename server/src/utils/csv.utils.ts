import { parse } from 'json2csv';
import { Invoice } from '../types/invoice';

/**
 * Generate CSV content from invoices array
 * @param invoices Array of invoice objects
 * @returns CSV string content
 */
export async function generateCSV(invoices: Invoice[]): Promise<string> {
  try {
    // Transform invoice data for CSV format
    const csvData = invoices.map(invoice => ({
      Date: formatDate(invoice.date),
      Vendor: invoice.vendorName,
      Amount: formatAmount(invoice.amount),
      Status: capitalizeFirst(invoice.status)
    }));

    // Define CSV fields/columns
    const fields = ['Date', 'Vendor', 'Amount', 'Status'];

    // Generate CSV
    const csv = parse(csvData, {
      fields,
      header: true
    });

    return csv;
  } catch (error) {
    throw new Error(`Failed to generate CSV: ${error}`);
  }
}

/**
 * Format date string for CSV output
 * @param dateStr Date string from invoice
 * @returns Formatted date string
 */
function formatDate(dateStr: string): string {
  // Handle various date formats, including n8n format like "31Jan'19"
  try {
    // First, try to parse as ISO date
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
    // If parsing fails, return as is (for dates like "31Jan'19")
    return dateStr;
  } catch {
    return dateStr;
  }
}

/**
 * Format amount for CSV output
 * @param amount Number amount
 * @returns Formatted amount string with 2 decimal places
 */
function formatAmount(amount: number): string {
  return amount.toFixed(2);
}

/**
 * Capitalize first letter of status
 * @param str Status string
 * @returns Capitalized string
 */
function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}