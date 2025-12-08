import { Router } from 'express';
import { InvoiceController } from '../controllers/invoice.controller';
import { catchAsync } from '../middlewares/errorHandler';

const router = Router();

/**
 * @swagger
 * /api/csv-export:
 *   get:
 *     summary: Export all invoices as CSV file
 *     tags: [Export]
 *     description: Generate and download a CSV file containing all stored invoices with columns Date, Vendor, Amount, and Status
 *     responses:
 *       200:
 *         description: CSV file with invoice data
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *               format: binary
 *             example: |
 *               Date,Vendor,Amount,Status
 *               "Jan 31, 2019","Starbucks Chatham Station","9.35","Pending"
 *               "Feb 1, 2019","Office Supplies Inc","125.50","Paid"
 *         headers:
 *           Content-Disposition:
 *             schema:
 *               type: string
 *               example: attachment; filename="invoices_2024-12-06.csv"
 *       500:
 *         description: Failed to export invoices
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: Failed to export invoices
 */
router.get('/', catchAsync(InvoiceController.exportInvoicesAsCSV));

export default router;