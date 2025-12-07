export interface Invoice {
  id: string;
  date: string;
  vendorName: string;
  amount: number;
  status: 'pending' | 'paid' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface CreateInvoiceDto {
  vendorName: string;
  totalAmount: number;
  date: string;
}
