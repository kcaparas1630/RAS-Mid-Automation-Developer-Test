import { useState } from 'react';
import imageCompression from 'browser-image-compression';
import './InvoiceUpload.css';

interface InvoiceUploadProps {
  onInvoiceUploaded: () => void;
}

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';
const N8N_WEBHOOK_URL = process.env.REACT_APP_N8N_WEBHOOK_URL || 'http://localhost:5678/webhook/receipt-ocr';

const InvoiceUpload: React.FC<InvoiceUploadProps> = ({ onInvoiceUploaded }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        setMessage({ type: 'error', text: 'Please select a valid image file (JPEG, PNG, or GIF)' });
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'File size must be less than 10MB' });
        return;
      }

      setSelectedFile(file);
      setMessage(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage({ type: 'error', text: 'Please select a file first' });
      return;
    }

    try {
      setUploading(true);
      setMessage(null);

      let fileToUpload = selectedFile;

      // Compress image if larger than 1MB (OCR.space free tier limit)
      if (selectedFile.size > 1 * 1024 * 1024) {
        try {
          const options = {
            maxSizeMB: 0.9, // Target size just under 1MB
            maxWidthOrHeight: 1920, // Max dimension
            useWebWorker: true,
            fileType: selectedFile.type,
          };

          console.log('Original file size:', (selectedFile.size / 1024 / 1024).toFixed(2), 'MB');
          fileToUpload = await imageCompression(selectedFile, options);
          console.log('Compressed file size:', (fileToUpload.size / 1024 / 1024).toFixed(2), 'MB');
        } catch (compressionError) {
          console.error('Compression error:', compressionError);
          setMessage({ type: 'error', text: 'Failed to compress image. Please try a smaller file.' });
          return;
        }
      }

      // Create FormData to send file
      const formData = new FormData();
      formData.append('file', fileToUpload);

      // Send to n8n webhook
      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to process invoice');
      }

      const result = await response.json();
      console.log('n8n response:', result);

      // Check if the response indicates an error (e.g., duplicate)
      if (result.error || result.success === false) {
        throw new Error(result.error || result.message || 'Failed to process invoice');
      }

      setMessage({ type: 'success', text: 'Invoice processed successfully!' });
      setSelectedFile(null);

      // Reset file input
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      // Notify parent component to refresh invoice list
      setTimeout(() => {
        onInvoiceUploaded();
      }, 500);

    } catch (error) {
      console.error('Upload error:', error);
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to process invoice'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSimulateUpload = async () => {
    try {
      setUploading(true);
      setMessage(null);

      // Simulate invoice data for testing
      const sampleInvoice = {
        vendorName: 'Home Depot',
        totalAmount: 450.00,
        date: new Date().toISOString().split('T')[0]
      };

      const response = await fetch(`${API_BASE_URL}/api/invoices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sampleInvoice),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create invoice');
      }

      setMessage({ type: 'success', text: 'Sample invoice created successfully!' });
      onInvoiceUploaded();

    } catch (error) {
      console.error('Simulation error:', error);
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to create sample invoice'
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="invoice-upload">
      <h2>Upload Receipt Image</h2>
      <p className="description">
        Upload a photo of your receipt to automatically extract invoice data using OCR.
      </p>

      <div className="upload-section">
        <div className="file-input-wrapper">
          <input
            id="file-input"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading}
            className="file-input"
          />
          <label htmlFor="file-input" className="file-input-label">
            {selectedFile ? selectedFile.name : 'Choose receipt image...'}
          </label>
        </div>

        <button
          onClick={handleUpload}
          disabled={!selectedFile || uploading}
          className="upload-btn primary"
        >
          {uploading ? 'Processing...' : 'Upload & Process'}
        </button>
      </div>

      <div className="or-divider">
        <span>OR</span>
      </div>

      <button
        onClick={handleSimulateUpload}
        disabled={uploading}
        className="upload-btn secondary"
      >
        {uploading ? 'Creating...' : 'Create Sample Invoice'}
      </button>

      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}
    </div>
  );
};

export default InvoiceUpload;
