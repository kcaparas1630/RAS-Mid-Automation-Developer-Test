import { Invoice } from '../types/invoice';
import './InvoiceFeed.css';

interface InvoiceFeedProps {
  invoices: Invoice[];
  onRefresh: () => void;
}

const InvoiceFeed: React.FC<InvoiceFeedProps> = ({ invoices, onRefresh }) => {
  const formatDate = (dateStr: string): string => {
    try {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      }
    } catch {
      // If parsing fails, return original string
    }
    return dateStr;
  };

  const formatAmount = (amount: number): string => {
    return `$${amount.toFixed(2)}`;
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'paid':
        return 'status-paid';
      case 'pending':
        return 'status-pending';
      case 'cancelled':
        return 'status-cancelled';
      default:
        return 'status-pending';
    }
  };

  const getTotalAmount = (): number => {
    return invoices.reduce((sum, invoice) => sum + invoice.amount, 0);
  };

  if (invoices.length === 0) {
    return (
      <div className="invoice-feed empty">
        <div className="empty-state">
          <p>No invoices found</p>
          <p className="empty-hint">Upload a receipt image to get started!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="invoice-feed">
      <div className="feed-header">
        <div className="summary">
          <span className="summary-item">
            <strong>Total Invoices:</strong> {invoices.length}
          </span>
          <span className="summary-item">
            <strong>Total Amount:</strong> {formatAmount(getTotalAmount())}
          </span>
        </div>
        <button onClick={onRefresh} className="refresh-btn">
          🔄 Refresh
        </button>
      </div>

      <div className="invoice-table-wrapper">
        <table className="invoice-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Vendor</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Invoice ID</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => (
              <tr key={invoice.id}>
                <td>{formatDate(invoice.date)}</td>
                <td className="vendor-name">{invoice.vendorName}</td>
                <td className="amount">{formatAmount(invoice.amount)}</td>
                <td>
                  <span className={`status-badge ${getStatusColor(invoice.status)}`}>
                    {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                  </span>
                </td>
                <td className="invoice-id">{invoice.id}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InvoiceFeed;
