import fs from 'fs';
import path from 'path';
import { Invoice } from '../types/invoice';
import logger from '../config/logger';
import { generateInvoiceHash } from '../utils/hash.utils';
import { normalizeVendorName } from '../utils/vendor.utils';

export class DatabaseService {
  private dbPath: string;
  private data: { invoices: Invoice[] };
  private invoiceHashes: Set<string>; // Track hashes for duplicate detection

  constructor() {
    this.dbPath = path.join(process.cwd(), 'db.json');
    this.data = { invoices: [] };
    this.invoiceHashes = new Set();
    this.initializeDB();
  }

  private initializeDB(): void {
    try {
      if (fs.existsSync(this.dbPath)) {
        const fileContent = fs.readFileSync(this.dbPath, 'utf-8');
        this.data = JSON.parse(fileContent);

        // Rebuild hash set from existing invoices
        this.invoiceHashes.clear();
        this.data.invoices.forEach(invoice => {
          const hash = generateInvoiceHash(invoice.vendorName, invoice.date, invoice.amount);
          this.invoiceHashes.add(hash);
        });

        logger.info('Database loaded successfully');
      } else {
        this.saveDB();
        logger.info('Database initialized');
      }
    } catch (error) {
      logger.error('Error initializing database:', error);
      this.data = { invoices: [] };
      this.saveDB();
    }
  }

  private saveDB(): void {
    try {
      fs.writeFileSync(this.dbPath, JSON.stringify(this.data, null, 2));
      logger.info('Database saved successfully');
    } catch (error) {
      logger.error('Error saving database:', error);
      throw new Error('Failed to save data');
    }
  }

  getAllInvoices(): Invoice[] {
    return this.data.invoices;
  }

  addInvoice(invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>): Invoice {
    // Normalize vendor name to prevent duplicates from OCR errors
    const normalizedVendorName = normalizeVendorName(invoice.vendorName);

    // Generate hash for duplicate detection
    const invoiceHash = generateInvoiceHash(normalizedVendorName, invoice.date, invoice.amount);

    // Check for duplicates
    if (this.invoiceHashes.has(invoiceHash)) {
      throw new Error(`Duplicate invoice detected: ${normalizedVendorName} - ${invoice.date} - $${invoice.amount}`);
    }

    const newInvoice: Invoice = {
      ...invoice,
      vendorName: normalizedVendorName, // Use normalized vendor name
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.data.invoices.push(newInvoice);
    this.invoiceHashes.add(invoiceHash);
    this.saveDB();

    return newInvoice;
  }

  getInvoiceById(id: string): Invoice | undefined {
    return this.data.invoices.find(invoice => invoice.id === id);
  }

  updateInvoice(id: string, updates: Partial<Invoice>): Invoice | null {
    const index = this.data.invoices.findIndex(invoice => invoice.id === id);

    if (index === -1) {
      return null;
    }

    this.data.invoices[index] = {
      ...this.data.invoices[index],
      ...updates,
      updatedAt: new Date()
    };

    this.saveDB();
    return this.data.invoices[index];
  }

  deleteInvoice(id: string): boolean {
    const invoice = this.getInvoiceById(id);

    if (!invoice) {
      return false;
    }

    // Remove hash from set
    const hash = generateInvoiceHash(invoice.vendorName, invoice.date, invoice.amount);
    this.invoiceHashes.delete(hash);

    // Remove invoice from array
    this.data.invoices = this.data.invoices.filter(inv => inv.id !== id);
    this.saveDB();

    return true;
  }

  private generateId(): string {
    return `INV-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }
}

// Export singleton instance
export const databaseService = new DatabaseService();