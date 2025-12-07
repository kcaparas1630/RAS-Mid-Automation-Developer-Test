import React, { useState, useEffect } from 'react';
import './App.css';
import InvoiceUpload from './components/InvoiceUpload';
import InvoiceFeed from './components/InvoiceFeed';
import { Invoice } from './types/invoice';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

function App() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch invoices on component mount
  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}/api/invoices`);

      if (!response.ok) {
        throw new Error('Failed to fetch invoices');
      }

      const data = await response.json();
      setInvoices(data.data.invoices || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch invoices');
      console.error('Error fetching invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInvoiceUploaded = () => {
    // Refresh the invoice list after a successful upload
    fetchInvoices();
  };

  const handleDownloadCSV = async () => {
    try {
      setError(null);
      const response = await fetch(`${API_BASE_URL}/api/csv-export`);

      if (!response.ok) {
        throw new Error('Failed to download CSV');
      }

      // Create a blob from the response
      const blob = await response.blob();

      // Create a temporary URL for the blob
      const url = window.URL.createObjectURL(blob);

      // Create a temporary anchor element to trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoices_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();

      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download CSV');
      console.error('Error downloading CSV:', err);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Framing Invoice Digitizer</h1>
        <p className="subtitle">Automate receipt processing for construction materials</p>
      </header>

      <main className="App-main">
        {error && (
          <div className="error-banner">
            <strong>Error:</strong> {error}
            <button onClick={() => setError(null)} className="close-btn">×</button>
          </div>
        )}

        <div className="card">
          <InvoiceUpload onInvoiceUploaded={handleInvoiceUploaded} />
        </div>

        <div className="card">
          <div className="card-header">
            <h2>Invoice Report</h2>
            <button
              onClick={handleDownloadCSV}
              className="download-btn"
              disabled={invoices.length === 0}
            >
              📥 Download CSV Report
            </button>
          </div>

          {loading ? (
            <div className="loading">Loading invoices...</div>
          ) : (
            <InvoiceFeed invoices={invoices} onRefresh={fetchInvoices} />
          )}
        </div>
      </main>

      <footer className="App-footer">
        <p>RAS Mid-Level Automation Developer Assessment</p>
      </footer>
    </div>
  );
}

export default App;
