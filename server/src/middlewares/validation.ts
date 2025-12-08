import { Request, Response, NextFunction } from 'express';
import { AppError } from '../types';

export const validateInvoicePayload = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  try {
    // Handle both direct payload and n8n webhook format
    let data = req.body;

    // Check if it's n8n webhook format with array
    if (Array.isArray(data) && data.length > 0 && data[0].output) {
      data = data[0].output;
    }
    // Check if it's n8n webhook format with single object
    else if (data.output) {
      data = data.output;
    }

    const { vendorName, totalAmount, date } = data;

    // Validate required fields
    if (!totalAmount && totalAmount !== 0) {
      return next(new AppError('Amount is required', 400));
    }

    if (typeof totalAmount !== 'number' || isNaN(totalAmount)) {
      return next(new AppError('Amount must be a valid number', 400));
    }

    if (!vendorName || typeof vendorName !== 'string') {
      return next(new AppError('Vendor name is required and must be a string', 400));
    }

    if (!date || typeof date !== 'string') {
      return next(new AppError('Date is required and must be a string', 400));
    }

    // Attach cleaned data to request for use in controller
    req.body = {
      vendorName,
      totalAmount,
      date
    };

    next();
  } catch (error) {
    next(new AppError('Invalid request payload', 400));
  }
};