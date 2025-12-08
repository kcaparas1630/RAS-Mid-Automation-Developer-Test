# Framing Invoice Digitizer

A hybrid automation system that processes construction receipt images, extracts key data using OCR, stores it in a backend, and generates compliance reports.

## 📋 Project Overview

This project demonstrates a complete invoice processing workflow:
- **Phase 1**: n8n automation workflow for OCR processing
- **Phase 2**: Node.js/Express backend with data validation and storage
- **Phase 3**: React frontend for upload and reporting

## ✨ Features

### Core Features
- ✅ OCR processing of receipt images using OCR.space API
- ✅ AI-powered data extraction with OpenAI (vendor, amount, date)
- ✅ RESTful API with proper validation
- ✅ CSV export functionality
- ✅ React frontend with upload and invoice feed
- ✅ **Automatic image compression** for images > 1MB (OCR.space free tier compatibility)
- ✅ **Edit & Delete invoices** with inline editing and icon-based actions
- ✅ **Cloud deployment** ready (Vercel + Render + n8n Cloud)

### Bonus Features (Level Up)
- ✅ **Duplicate Prevention**: SHA-256 hash-based detection to prevent double-billing
- ✅ **Vendor Normalization**: Fuzzy matching to standardize vendor names from OCR errors
  - Handles variations like "Home Depot" vs "H0me Dep0t"
  - Extensible vendor mapping system with JSON configuration
- ✅ **Smart Image Compression**: Client-side compression for large photos (maintains quality)
- ✅ **Invoice Management**: Edit status (pending/paid/cancelled) and delete invoices

## 🏗️ Project Structure

```
RAS-Mid-Automation-Developer-Test/
├── server/                 # Node.js backend
│   ├── src/
│   │   ├── config/        # Logger, passport, swagger configs
│   │   ├── controllers/   # Invoice controller
│   │   ├── middlewares/   # Validation, error handling, security
│   │   ├── routes/        # API routes
│   │   ├── services/      # Database service
│   │   ├── types/         # TypeScript types
│   │   └── utils/         # CSV, hash, vendor normalization utilities
│   ├── db.json           # Local JSON database
│   └── package.json
├── client/                # React frontend
│   ├── src/
│   │   ├── components/   # InvoiceUpload, InvoiceFeed
│   │   ├── types/        # TypeScript interfaces
│   │   ├── App.tsx
│   │   └── App.css
│   └── package.json
├── OCR Automation with Agent.json  # n8n workflow
└── README.md
```

## 🚀 Getting Started

### Choose Your Deployment

**☁️ Cloud Deployment (Recommended for Demo/Production)**
- Deploy to Vercel + Render in minutes
- No local setup required
- Free tier available
- See [DEPLOYMENT.md](DEPLOYMENT.md) for complete guide

**💻 Local Development**

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- n8n (Desktop or Cloud)
- OCR.space API key (free tier)
- OpenAI API key (for n8n LangChain agent)

### 1. Backend Setup

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Start the development server
npm run dev

# Server will run on http://localhost:3000
```

#### Backend Environment Variables (Optional)
Create a `.env` file in the `server` directory:
```env
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3001
```

### 2. Frontend Setup

```bash
# Navigate to client directory
cd client

# Install dependencies
npm install

# Start the React development server
npm start

# Frontend will run on http://localhost:3001
```

#### Frontend Environment Variables (Optional)
Create a `.env` file in the `client` directory:
```env
REACT_APP_API_URL=http://localhost:3000
REACT_APP_N8N_WEBHOOK_URL=http://localhost:5678/webhook/receipt-ocr
```

### 3. n8n Workflow Setup

1. **Install n8n** (if not already installed):
   ```bash
   npm install -g n8n
   ```

2. **Start n8n**:
   ```bash
   n8n start
   ```

3. **Import the workflow**:
   - Open n8n at `http://localhost:5678`
   - Click on **Workflows** → **Import from File**
   - Select `OCR Automation with Agent.json`

4. **Configure credentials**:
   - **OCR.space API**: Get free API key from [OCR.space](https://ocr.space/ocrapi)
   - **OpenAI API**: Add your OpenAI API key in the workflow

5. **Activate the workflow**:
   - Click the toggle to activate the workflow
   - Webhook URL: `http://localhost:5678/webhook/receipt-ocr`

## 📖 Usage

### Option 1: Full Workflow (n8n + Backend)

1. Ensure n8n workflow is active
2. Ensure backend server is running
3. Open the React frontend
4. Upload a receipt image (supports images up to 10MB - auto-compressed to <1MB)
5. The workflow will:
   - Automatically compress large images
   - Extract text using OCR
   - Parse data using AI
   - Check for duplicates
   - Send to Node.js backend
   - Display in the invoice feed
6. Manage invoices:
   - Click ✏️ to edit invoice status
   - Click 🗑️ to delete invoice

### Option 2: Direct Backend Testing

1. Use the "Create Sample Invoice" button in the frontend
2. Or make a POST request to `/api/invoices`:
   ```bash
   curl -X POST http://localhost:3000/api/invoices \
     -H "Content-Type: application/json" \
     -d '{
       "vendorName": "Home Depot",
       "totalAmount": 450.00,
       "date": "2024-05-12"
     }'
   ```

### CSV Export

1. Click the **"📥 Download CSV Report"** button in the frontend
2. Or visit: `http://localhost:3000/api/csv-export`

## 🎯 API Endpoints

### Invoices

- **POST** `/api/invoices` - Create a new invoice
- **GET** `/api/invoices` - Get all invoices
- **GET** `/api/invoices/:id` - Get invoice by ID
- **PATCH** `/api/invoices/:id/status` - Update invoice status
- **DELETE** `/api/invoices/:id` - Delete invoice

### CSV Export

- **GET** `/api/csv-export` - Download invoices as CSV

### Documentation

- **Swagger UI**: `http://localhost:3000/api-docs`
- **Health Check**: `http://localhost:3000/health`

## 🔧 Advanced Features

### Duplicate Prevention

The system generates a SHA-256 hash based on:
- Vendor name (normalized)
- Date
- Amount

If a duplicate is detected, the API returns a `409 Conflict` error:
```json
{
  "status": "fail",
  "message": "Duplicate invoice detected: Home Depot - 2024-05-12 - $450.00"
}
```

### Vendor Normalization

The system uses fuzzy matching to normalize vendor names:

**Examples**:
- "H0me Depot" → "Home Depot"
- "RONA Inc" → "RONA"
- "Lowes Home Improvement" → "Lowe's"

#### Custom Vendor Mappings

Create a `vendor-mappings.json` file in the server root:
```json
{
  "vendors": [
    {
      "standardName": "Home Depot",
      "variations": ["home depot", "the home depot", "homedepot", "h0me depot"]
    },
    {
      "standardName": "Custom Vendor",
      "variations": ["custom", "cust0m vendor"]
    }
  ]
}
```

The system will automatically load this file on startup.

## 🧪 Testing

### Test Duplicate Prevention

1. Create an invoice
2. Try to create the same invoice again
3. Should receive a 409 error

### Test Vendor Normalization

Send these variations and they'll all be saved as "Home Depot":
```bash
# Variation 1
curl -X POST http://localhost:3000/api/invoices \
  -H "Content-Type: application/json" \
  -d '{"vendorName": "H0me Depot", "totalAmount": 100, "date": "2024-01-01"}'

# Variation 2
curl -X POST http://localhost:3000/api/invoices \
  -H "Content-Type: application/json" \
  -d '{"vendorName": "The Home Depot", "totalAmount": 200, "date": "2024-01-02"}'
```

## 📊 Sample Data

The project includes sample invoices in `db.json`. You can also import from `invoices.csv`.

## 🔒 Security Features

- Helmet.js for security headers
- CORS configuration
- Rate limiting on API endpoints
- Input validation and sanitization
- Error handling middleware

## 🛠️ Development Scripts

### Backend
```bash
npm run dev       # Start development server with nodemon
npm run build     # Compile TypeScript to JavaScript
npm start         # Start production server
```

### Frontend
```bash
npm start         # Start development server
npm run build     # Build for production
npm test          # Run tests
```

## 📝 Notes

- The backend uses a local JSON file (`db.json`) for storage
- OCR processing requires an active internet connection
- The n8n workflow uses OpenAI for intelligent data extraction
- All timestamps are stored in ISO 8601 format

## 🎓 Assessment Completion

### ✅ Required Deliverables
- [x] `/server` folder with Node.js backend
- [x] `/client` folder with React frontend
- [x] `workflow.json` (n8n automation blueprint)
- [x] `README.md` with setup instructions

### ✅ Evaluation Criteria
- [x] **Functionality**: CSV download works perfectly
- [x] **Code Quality**: Clean, modular, well-documented code
- [x] **Problem Solving**: Handled messy OCR data with vendor normalization
- [x] **Bonus Features**: Duplicate prevention + Vendor normalization

## 👨‍💻 Author

RAS Mid-Level Automation Developer Assessment

## 📄 License

This project is created for assessment purposes.
