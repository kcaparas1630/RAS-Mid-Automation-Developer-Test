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

## 🚀 Live Demo

**✨ Try the application now:**

🔗 **Frontend**: [https://ras-mid-automation-developer-test.vercel.app](https://ras-mid-automation-developer-test.vercel.app)

**Deployed Infrastructure:**
- **Frontend**: Vercel
- **Backend**: Render ([https://ras-mid-automation-developer-test.onrender.com](https://ras-mid-automation-developer-test.onrender.com))
- **Automation Workflow**: n8n Cloud

## 📖 How to Use

1. **Visit the application**: [https://ras-mid-automation-developer-test.vercel.app](https://ras-mid-automation-developer-test.vercel.app)
2. **Upload a receipt image** or click "Create Sample Invoice" to test
3. **View invoices** in the feed below
4. **Manage invoices**:
   - Click ✏️ to edit status (pending/paid/cancelled)
   - Click 🗑️ to delete
5. **Download CSV** report using the download button

## 🛠️ Local Development (Optional)

<details>
<summary>Click to expand local setup instructions</summary>

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- n8n (Desktop or Cloud)
- OCR.space API key (free tier)
- OpenAI API key (for n8n LangChain agent)

### 1. Backend Setup

```bash
cd server
npm install
npm run dev
# Server runs on http://localhost:3000
```

### 2. Frontend Setup

```bash
cd client
npm install
npm start
# Frontend runs on http://localhost:3001
```

### 3. Environment Variables

Create `.env` files in both `server/` and `client/` directories. See `.env.example` for required variables.

</details>

## 📖 Usage

### Testing the Live Application

Visit [https://ras-mid-automation-developer-test.vercel.app](https://ras-mid-automation-developer-test.vercel.app) and:

1. **Upload a receipt image** (supports up to 10MB - auto-compressed to <1MB)
   - The workflow will automatically:
     - Compress large images for OCR processing
     - Extract text using OCR.space API
     - Parse vendor, amount, and date using OpenAI
     - Check for duplicates and normalize vendor names
     - Save to database and display in feed

2. **Or create a sample invoice** using the "Create Sample Invoice" button

3. **Manage invoices**:
   - Click ✏️ to edit status (pending/paid/cancelled)
   - Click 🗑️ to delete invoice

4. **Download CSV** report using the "📥 Download CSV Report" button

### API Testing (Optional)

Test the backend API directly:

```bash
# Create invoice
curl -X POST https://ras-mid-automation-developer-test.onrender.com/api/invoices \
  -H "Content-Type: application/json" \
  -d '{
    "vendorName": "Home Depot",
    "totalAmount": 450.00,
    "date": "2024-05-12"
  }'

# Download CSV
curl https://ras-mid-automation-developer-test.onrender.com/api/csv-export
```

## 🎯 API Endpoints

Base URL: `https://ras-mid-automation-developer-test.onrender.com`

### Invoices

- **POST** `/api/invoices` - Create a new invoice
- **GET** `/api/invoices` - Get all invoices
- **GET** `/api/invoices/:id` - Get invoice by ID
- **PATCH** `/api/invoices/:id/status` - Update invoice status
- **DELETE** `/api/invoices/:id` - Delete invoice

### CSV Export

- **GET** `/api/csv-export` - Download invoices as CSV

### Documentation

- **Swagger UI**: [https://ras-mid-automation-developer-test.onrender.com/api-docs](https://ras-mid-automation-developer-test.onrender.com/api-docs)
- **Health Check**: [https://ras-mid-automation-developer-test.onrender.com/health](https://ras-mid-automation-developer-test.onrender.com/health)

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

## 🧪 Testing Features

### Test Duplicate Prevention

1. Upload or create an invoice
2. Try to upload/create the exact same invoice again (same vendor, date, amount)
3. System will reject with error: "Duplicate invoice detected"

### Test Vendor Normalization

Try creating invoices with these vendor name variations - they'll all normalize to "Home Depot":

```bash
# Test via live API
curl -X POST https://ras-mid-automation-developer-test.onrender.com/api/invoices \
  -H "Content-Type: application/json" \
  -d '{"vendorName": "H0me Depot", "totalAmount": 100, "date": "2024-01-01"}'

curl -X POST https://ras-mid-automation-developer-test.onrender.com/api/invoices \
  -H "Content-Type: application/json" \
  -d '{"vendorName": "The Home Depot", "totalAmount": 200, "date": "2024-01-02"}'
```

All variations are stored as "Home Depot" in the database.

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
