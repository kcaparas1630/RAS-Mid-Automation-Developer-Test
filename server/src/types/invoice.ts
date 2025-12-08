export interface Invoice {
  id: string;
  date: string;
  vendorName: string;
  amount: number;
  status: 'pending' | 'paid' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateInvoiceDto {
  vendorName: string;
  totalAmount: number;
  date: string;
}

export interface InvoiceWebhookPayload {
  output: {
    vendorName: string;
    totalAmount: number;
    date: string;
  };
}