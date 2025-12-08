import { useState } from 'react';
import { Invoice } from '../types/invoice';
import './InvoiceFeed.css';

interface InvoiceFeedProps {
  invoices: Invoice[];
  onRefresh: () => void;
}

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

const InvoiceFeed: React.FC<InvoiceFeedProps> = ({ invoices, onRefresh }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Invoice>>({});
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

  const handleEdit = (invoice: Invoice) => {
    setEditingId(invoice.id);
    setEditData({
      vendorName: invoice.vendorName,
      amount: invoice.amount,
      date: invoice.date,
      status: invoice.status,
    });
  };

  const handleSave = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/invoices/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: editData.status }),
      });

      if (!response.ok) {
        throw new Error('Failed to update invoice');
      }

      setEditingId(null);
      setEditData({});
      onRefresh();
    } catch (error) {
      console.error('Error updating invoice:', error);
      alert('Failed to update invoice');
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this invoice?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/invoices/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete invoice');
      }

      onRefresh();
    } catch (error) {
      console.error('Error deleting invoice:', error);
      alert('Failed to delete invoice');
    }
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
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => {
              const isEditing = editingId === invoice.id;

              return (
                <tr key={invoice.id}>
                  <td>{formatDate(invoice.date)}</td>
                  <td className="vendor-name">{invoice.vendorName}</td>
                  <td className="amount">{formatAmount(invoice.amount)}</td>
                  <td>
                    {isEditing ? (
                      <select
                        value={editData.status || invoice.status}
                        onChange={(e) => setEditData({ ...editData, status: e.target.value as 'pending' | 'paid' | 'cancelled' })}
                        className="status-select"
                      >
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    ) : (
                      <span className={`status-badge ${getStatusColor(invoice.status)}`}>
                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </span>
                    )}
                  </td>
                  <td className="invoice-id">{invoice.id}</td>
                  <td className="actions">
                    {isEditing ? (
                      <>
                        <button onClick={() => handleSave(invoice.id)} className="action-btn save-btn" title="Save">
                          ✓
                        </button>
                        <button onClick={handleCancel} className="action-btn cancel-btn" title="Cancel">
                          ✕
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => handleEdit(invoice)} className="action-btn edit-btn" title="Edit">
                          ✏️
                        </button>
                        <button onClick={() => handleDelete(invoice.id)} className="action-btn delete-btn" title="Delete">
                          🗑️
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InvoiceFeed;
