import { Request, Response, NextFunction } from 'express';
import { databaseService } from '../services/database.service';
import { generateCSV } from '../utils/csv.utils';
import { AppError } from '../types';
import { CreateInvoiceDto } from '../types/invoice';
import logger from '../config/logger';

export class InvoiceController {
  /**
   * Create a new invoice from webhook data
   */
  static async createInvoice(
    req: Request<{}, {}, CreateInvoiceDto>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { vendorName, totalAmount, date } = req.body;

      // Create invoice with default status 'pending'
      const newInvoice = databaseService.addInvoice({
        vendorName,
        amount: totalAmount,
        date,
        status: 'pending'
      });

      logger.info('New invoice created:', {
        id: newInvoice.id,
        vendor: newInvoice.vendorName,
        amount: newInvoice.amount
      });

      res.status(201).json({
        status: 'success',
        message: 'Invoice created successfully',
        data: {
          invoice: newInvoice
        }
      });
    } catch (error) {
      // Check if it's a duplicate invoice error
      if (error instanceof Error && error.message.includes('Duplicate invoice detected')) {
        logger.warn('Duplicate invoice attempt:', error.message);
        return next(new AppError(error.message, 409)); // 409 Conflict
      }

      logger.error('Error creating invoice:', error);
      next(new AppError('Failed to create invoice', 500));
    }
  }

  /**
   * Export all invoices as CSV
   */
  static async exportInvoicesAsCSV(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const invoices = databaseService.getAllInvoices();

      if (invoices.length === 0) {
        res.status(200).json({
          status: 'success',
          message: 'No invoices to export',
          data: []
        });
        return;
      }

      // Generate CSV content
      const csvContent = await generateCSV(invoices);

      // Set headers for file download
      const filename = `invoices_${new Date().toISOString().split('T')[0]}.csv`;
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      // Send CSV content
      res.status(200).send(csvContent);

      logger.info(`CSV export completed: ${invoices.length} invoices exported`);
    } catch (error) {
      logger.error('Error exporting invoices as CSV:', error);
      next(new AppError('Failed to export invoices', 500));
    }
  }

  /**
   * Get all invoices
   */
  static async getAllInvoices(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const invoices = databaseService.getAllInvoices();

      res.status(200).json({
        status: 'success',
        data: {
          invoices,
          count: invoices.length
        }
      });
    } catch (error) {
      logger.error('Error fetching invoices:', error);
      next(new AppError('Failed to fetch invoices', 500));
    }
  }

  /**
   * Get a single invoice by ID
   */
  static async getInvoiceById(
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const invoice = databaseService.getInvoiceById(req.params.id);

      if (!invoice) {
        return next(new AppError('Invoice not found', 404));
      }

      res.status(200).json({
        status: 'success',
        data: {
          invoice
        }
      });
    } catch (error) {
      logger.error('Error fetching invoice:', error);
      next(new AppError('Failed to fetch invoice', 500));
    }
  }

  /**
   * Update invoice status
   */
  static async updateInvoiceStatus(
    req: Request<{ id: string }, {}, { status: 'pending' | 'paid' | 'cancelled' }>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { status } = req.body;

      if (!status || !['pending', 'paid', 'cancelled'].includes(status)) {
        return next(new AppError('Invalid status value', 400));
      }

      const updatedInvoice = databaseService.updateInvoice(req.params.id, { status });

      if (!updatedInvoice) {
        return next(new AppError('Invoice not found', 404));
      }

      res.status(200).json({
        status: 'success',
        message: 'Invoice status updated successfully',
        data: {
          invoice: updatedInvoice
        }
      });
    } catch (error) {
      logger.error('Error updating invoice:', error);
      next(new AppError('Failed to update invoice', 500));
    }
  }

  /**
   * Delete an invoice
   */
  static async deleteInvoice(
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const deleted = databaseService.deleteInvoice(req.params.id);

      if (!deleted) {
        return next(new AppError('Invoice not found', 404));
      }

      res.status(200).json({
        status: 'success',
        message: 'Invoice deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting invoice:', error);
      next(new AppError('Failed to delete invoice', 500));
    }
  }
}