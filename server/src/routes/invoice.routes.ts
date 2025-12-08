import { Router } from 'express';
import { InvoiceController } from '../controllers/invoice.controller';
import { validateInvoicePayload } from '../middlewares/validation';
import { catchAsync } from '../middlewares/errorHandler';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Invoice:
 *       type: object
 *       required:
 *         - vendorName
 *         - amount
 *         - date
 *         - status
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier for the invoice
 *         vendorName:
 *           type: string
 *           description: Name of the vendor
 *         amount:
 *           type: number
 *           description: Invoice amount
 *         date:
 *           type: string
 *           description: Invoice date
 *         status:
 *           type: string
 *           enum: [pending, paid, cancelled]
 *           description: Invoice payment status
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/invoices:
 *   post:
 *     summary: Create a new invoice from webhook data
 *     tags: [Invoices]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - type: object
 *                 required:
 *                   - vendorName
 *                   - totalAmount
 *                   - date
 *                 properties:
 *                   vendorName:
 *                     type: string
 *                   totalAmount:
 *                     type: number
 *                   date:
 *                     type: string
 *               - type: object
 *                 properties:
 *                   output:
 *                     type: object
 *                     required:
 *                       - vendorName
 *                       - totalAmount
 *                       - date
 *                     properties:
 *                       vendorName:
 *                         type: string
 *                       totalAmount:
 *                         type: number
 *                       date:
 *                         type: string
 *               - type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     output:
 *                       type: object
 *                       required:
 *                         - vendorName
 *                         - totalAmount
 *                         - date
 *                       properties:
 *                         vendorName:
 *                           type: string
 *                         totalAmount:
 *                           type: number
 *                         date:
 *                           type: string
 *     responses:
 *       201:
 *         description: Invoice created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     invoice:
 *                       $ref: '#/components/schemas/Invoice'
 *       400:
 *         description: Bad request - missing or invalid amount
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: fail
 *                 message:
 *                   type: string
 *                   example: Amount must be a valid number
 */
router.post(
  '/',
  validateInvoicePayload,
  catchAsync(InvoiceController.createInvoice)
);

/**
 * @swagger
 * /api/invoices:
 *   get:
 *     summary: Get all invoices
 *     tags: [Invoices]
 *     responses:
 *       200:
 *         description: List of all invoices
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     invoices:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Invoice'
 *                     count:
 *                       type: number
 */
router.get('/', catchAsync(InvoiceController.getAllInvoices));

/**
 * @swagger
 * /api/invoices/{id}:
 *   get:
 *     summary: Get invoice by ID
 *     tags: [Invoices]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Invoice ID
 *     responses:
 *       200:
 *         description: Invoice details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     invoice:
 *                       $ref: '#/components/schemas/Invoice'
 *       404:
 *         description: Invoice not found
 */
router.get('/:id', catchAsync(InvoiceController.getInvoiceById));

/**
 * @swagger
 * /api/invoices/{id}/status:
 *   patch:
 *     summary: Update invoice status
 *     tags: [Invoices]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Invoice ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, paid, cancelled]
 *     responses:
 *       200:
 *         description: Invoice status updated successfully
 *       400:
 *         description: Invalid status value
 *       404:
 *         description: Invoice not found
 */
router.patch('/:id/status', catchAsync(InvoiceController.updateInvoiceStatus));

/**
 * @swagger
 * /api/invoices/{id}:
 *   delete:
 *     summary: Delete an invoice
 *     tags: [Invoices]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Invoice ID
 *     responses:
 *       200:
 *         description: Invoice deleted successfully
 *       404:
 *         description: Invoice not found
 */
router.delete('/:id', catchAsync(InvoiceController.deleteInvoice));

export default router;