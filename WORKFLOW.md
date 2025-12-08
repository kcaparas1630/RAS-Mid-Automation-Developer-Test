# Invoice Digitizer - System Workflow

## Complete System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     USER UPLOADS RECEIPT IMAGE                   │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                     REACT FRONTEND (Port 3001)                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Components:                                               │   │
│  │ • InvoiceUpload:                                         │   │
│  │   - File selection & upload                              │   │
│  │   - Auto image compression (>1MB → <1MB)                 │   │
│  │   - Duplicate error display                              │   │
│  │ • InvoiceFeed:                                           │   │
│  │   - Display invoice list                                 │   │
│  │   - Edit status (✏️ icon)                                 │   │
│  │   - Delete invoices (🗑️ icon)                            │   │
│  │ • CSV Download: Export functionality                     │   │
│  └──────────────────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                  n8n WORKFLOW (Port 5678)                        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 1. Webhook Trigger: Receive compressed image             │   │
│  │    ↓ (with CORS headers)                                 │   │
│  │ 2. OCR.space API: Extract text from image                │   │
│  │    ↓                                                      │   │
│  │ 3. AI Agent (OpenAI): Parse vendor, amount, date         │   │
│  │    ↓                                                      │   │
│  │ 4. HTTP Request: Send to Node.js backend                 │   │
│  │    ├─ Success (201) → Return success response            │   │
│  │    └─ Error (409 Duplicate) → Return error response      │   │
│  │    ↓                                                      │   │
│  │ 5. IF Node: Check HTTP request status                    │   │
│  │    ↓                                                      │   │
│  │ 6. Respond to Webhook:                                   │   │
│  │    • Success: {success: true, message: "..."}            │   │
│  │    • Error: {success: false, message: "Duplicate..."}    │   │
│  └──────────────────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                NODE.JS BACKEND (Port 3000)                       │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ API Routes:                                               │   │
│  │ • POST /api/invoices - Create invoice                    │   │
│  │ • GET  /api/invoices - List invoices                     │   │
│  │ • GET  /api/csv-export - Download CSV                    │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Middleware Pipeline:                                      │   │
│  │ 1. Validation: Check required fields                     │   │
│  │ 2. Vendor Normalization: Fuzzy matching                  │   │
│  │ 3. Hash Generation: SHA-256 for duplicate detection      │   │
│  │ 4. Duplicate Check: Reject if hash exists                │   │
│  │ 5. Database Service: Save to db.json                     │   │
│  └──────────────────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE (db.json)                            │
│  {                                                               │
│    "invoices": [                                                 │
│      {                                                           │
│        "id": "INV-1234567890-abc123",                           │
│        "vendorName": "Home Depot",  // Normalized               │
│        "amount": 450.00,                                         │
│        "date": "2024-05-12",                                    │
│        "status": "pending",                                      │
│        "createdAt": "2024-05-12T10:30:00Z",                    │
│        "updatedAt": "2024-05-12T10:30:00Z"                     │
│      }                                                           │
│    ]                                                             │
│  }                                                               │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Invoice Upload Flow

```
User selects file → React checks file size
                                    ↓
                   ┌────────────────┴────────────────┐
                   │                                  │
              File > 1MB                         File ≤ 1MB
                   │                                  │
        Auto compress to <1MB                    Use original
        (browser-image-compression)                   │
                   │                                  │
                   └────────────────┬─────────────────┘
                                    ↓
                        Upload to n8n webhook
                                    ↓
                        OCR.space extracts text
                                    ↓
                        OpenAI parses structured data
                        {
                          vendorName: "Home Depot",
                          totalAmount: 450.00,
                          date: "2024-05-12"
                        }
                                    ↓
                        POST to backend /api/invoices
                                    ↓
                        Validation middleware
                                    ↓
                        Vendor normalization
                        "H0me Depot" → "Home Depot"
                                    ↓
                        Generate hash
                        SHA256("home depot|2024-05-12|450.00")
                                    ↓
                        Check for duplicate
                                    ↓
                   ┌────────────────┴────────────────┐
                   │                                  │
              ✅ Unique                          ❌ Duplicate
                   │                                  │
            Save to database                Return 409 Error
                   │                         "Duplicate invoice"
            Return 201 Created                       │
                   │                                  │
                   └────────────────┬─────────────────┘
                                    ↓
                        n8n IF node checks response
                                    ↓
                   ┌────────────────┴────────────────┐
                   │                                  │
              Success (201)                    Error (409)
                   │                                  │
        Return {success: true}       Return {success: false,
                   │                  message: "Duplicate..."}
                   │                                  │
                   └────────────────┬─────────────────┘
                                    ↓
                        Frontend displays result
                                    ↓
                   ┌────────────────┴────────────────┐
                   │                                  │
            Show success                      Show error
            Refresh invoice list             (red message)
```

### 2. Invoice Management Flow

```
User clicks ✏️ icon → Enter edit mode
                              ↓
                     Status dropdown appears
                              ↓
                     User selects new status
                              ↓
                     Click ✓ to save
                              ↓
                  PATCH /api/invoices/:id/status
                  { status: "paid" }
                              ↓
                     Backend updates status
                              ↓
                     Return 200 OK
                              ↓
                     Frontend refreshes list

User clicks 🗑️ icon → Confirmation dialog
                              ↓
                     User confirms deletion
                              ↓
                  DELETE /api/invoices/:id
                              ↓
                     Backend removes invoice
                              ↓
                     Return 200 OK
                              ↓
                     Frontend refreshes list
```

### 3. CSV Export Flow

```
User clicks "Download CSV" → GET /api/csv-export
                                       ↓
                            Fetch all invoices from db.json
                                       ↓
                            Transform to CSV format
                            Date, Vendor, Amount, Status
                                       ↓
                            Generate CSV string
                                       ↓
                            Set response headers
                            Content-Type: text/csv
                            Content-Disposition: attachment
                                       ↓
                            Return CSV file
                                       ↓
                            Browser downloads file
                            invoices_2024-05-12.csv
```

## Bonus Features in Action

### Duplicate Prevention

**Scenario**: Supervisor uploads same receipt twice

```
First Upload:
  Input: { vendor: "Home Depot", amount: 450, date: "2024-05-12" }
  Hash: "a1b2c3d4e5f6..."
  Result: ✅ Saved (hash stored)

Second Upload (duplicate):
  Input: { vendor: "Home Depot", amount: 450, date: "2024-05-12" }
  Hash: "a1b2c3d4e5f6..." (same hash!)
  Result: ❌ Rejected with 409 error
  Message: "Duplicate invoice detected: Home Depot - 2024-05-12 - $450.00"
```

### Vendor Normalization

**Scenario**: OCR reads vendor name incorrectly

```
Upload 1: "Home Depot" → Normalized → "Home Depot"
Upload 2: "H0me Depot" → Normalized → "Home Depot"
Upload 3: "The Home Depot" → Normalized → "Home Depot"
Upload 4: "HOMEDEPOT" → Normalized → "Home Depot"

All variations are stored as: "Home Depot"
```

**Algorithm**:
1. Clean input: lowercase, remove special chars
2. Check exact match in mapping table
3. If no match, use Levenshtein distance
4. If similarity > 80%, use standard name
5. Otherwise, capitalize each word

## Security & Validation

### Input Validation

```
POST /api/invoices
{
  "vendorName": "Home Depot",     // ✅ Required, string
  "totalAmount": 450.00,          // ✅ Required, number
  "date": "2024-05-12"           // ✅ Required, string
}

// Invalid Examples:
{ "totalAmount": "450" }          // ❌ Must be number
{ "totalAmount": null }           // ❌ Required field missing
{ "vendorName": 123 }             // ❌ Must be string
```

### Security Middleware Stack

```
Request → Helmet (Security Headers)
       → CORS (Origin validation)
       → Rate Limiter (100 req/15min)
       → Body Parser (10MB limit)
       → Input Validation
       → Controller Logic
       → Error Handler
```

## Performance Optimizations

1. **In-Memory Hash Cache**: Duplicate checking uses Set for O(1) lookup
2. **Single File Database**: No DB connection overhead
3. **Compression**: Gzip compression for responses
4. **CSV Streaming**: Efficient memory usage for large exports
5. **Client-Side Image Compression**: Reduces network payload and fits OCR.space free tier limit
   - Target: <1MB (0.9MB)
   - Max dimension: 1920px
   - Maintains quality for accurate OCR
   - Uses web workers for non-blocking compression

## Extension Points

### Adding New Vendors

Edit `server/vendor-mappings.json`:
```json
{
  "vendors": [
    {
      "standardName": "New Vendor",
      "variations": ["new vendor", "n3w vendor", "newvendor"]
    }
  ]
}
```

Server auto-loads on startup - no restart needed if you call the load function.

### Adding API Endpoints

1. Create route in `server/src/routes/`
2. Add controller in `server/src/controllers/`
3. Register route in `server/src/app.ts`
4. Add Swagger documentation

### Frontend Customization

All styling in:
- `client/src/App.css` - Main layout
- `client/src/components/InvoiceUpload.css` - Upload UI
- `client/src/components/InvoiceFeed.css` - Table styles

## Testing Checklist

- [ ] Backend starts without errors
- [ ] Frontend starts without errors
- [ ] n8n workflow imports successfully
- [ ] Health endpoint returns 200
- [ ] Create invoice returns 201
- [ ] Duplicate invoice returns 409
- [ ] Vendor normalization works
- [ ] CSV export downloads file
- [ ] File upload to n8n works
- [ ] OCR extraction works
- [ ] AI parsing works
- [ ] End-to-end flow completes

## Troubleshooting

### Backend won't start
- Check Node.js version (>= 16)
- Run `npm install` in server directory
- Check port 3000 is available

### Frontend won't start
- Check Node.js version (>= 16)
- Run `npm install` in client directory
- Check port 3001 is available

### n8n webhook not responding
- Ensure n8n is running
- Check workflow is activated
- Verify webhook URL in frontend

### OCR not working
- Check OCR.space API key
- Verify internet connection
- Check API rate limits

### CSV export empty
- Ensure invoices exist in db.json
- Check backend logs for errors
