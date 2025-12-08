# n8n Integration Guide

## Webhook Configuration

Your n8n webhook endpoint: `https://kcaparas.app.n8n.cloud/webhook/receipt-ocr`

## Integration Flow

1. **n8n Workflow** (Receipt OCR) → Processes receipt image
2. **n8n Webhook** → Sends data to backend
3. **Backend API** (`POST /api/invoices`) → Stores invoice data
4. **CSV Export** (`GET /api/csv-export`) → Downloads all invoices

## Setting up n8n to Backend Connection

### In your n8n workflow, add an HTTP Request node after OCR processing:

**HTTP Request Node Configuration:**
- **Method**: POST
- **URL**: `http://YOUR_SERVER_URL:3000/api/invoices`
- **Authentication**: None (or add if needed)
- **Body Content Type**: JSON
- **Body**: Use the expression to send the OCR output

### Expected Data Format from n8n:

```json
[
  {
    "output": {
      "vendorName": "Starbucks Chatham Station",
      "totalAmount": 9.35,
      "date": "31Jan'19"
    }
  }
]
```

Or direct format:
```json
{
  "vendorName": "Starbucks Chatham Station",
  "totalAmount": 9.35,
  "date": "31Jan'19"
}
```

## Testing the Integration

### 1. Start the Backend Server:
```bash
cd server
npm run dev
```

### 2. Configure n8n Webhook to Forward to Backend:
In your n8n workflow, after the OCR node, add an HTTP Request node that posts to:
- Development: `http://localhost:3000/api/invoices`
- Production: `http://YOUR_PRODUCTION_URL/api/invoices`

### 3. Test with Sample Data:
```bash
# Test your n8n webhook directly
curl -X POST https://kcaparas.app.n8n.cloud/webhook/receipt-ocr \
  -H "Content-Type: application/json" \
  -d '{"image": "base64_encoded_receipt_image"}'
```

### 4. Verify Invoice Creation:
```bash
# Check all invoices
curl http://localhost:3000/api/invoices

# Export as CSV
curl http://localhost:3000/api/csv-export -o invoices.csv
```

## API Endpoints Summary

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/invoices` | POST | Create invoice from n8n data |
| `/api/invoices` | GET | List all invoices |
| `/api/invoices/:id` | GET | Get specific invoice |
| `/api/invoices/:id/status` | PATCH | Update invoice status |
| `/api/csv-export` | GET | Download CSV file |
| `/api-docs` | GET | Swagger documentation |

## Error Handling

The backend validates:
- `totalAmount` must exist and be a number (returns 400 if invalid)
- `vendorName` must be a string
- `date` must be provided

## Environment Variables

Create a `.env` file in the server directory:
```env
NODE_ENV=development
PORT=3000
CORS_ORIGIN=https://kcaparas.app.n8n.cloud,http://localhost:3000
```

## Security Considerations

1. **CORS**: Currently configured to accept requests from n8n cloud
2. **Rate Limiting**: 100 requests per 15 minutes per IP
3. **Validation**: All inputs are validated before processing

## Troubleshooting

1. **CORS Issues**: Update `CORS_ORIGIN` in `.env` to include n8n domain
2. **Connection Refused**: Ensure server is running and accessible
3. **400 Errors**: Check that amount field is present and numeric
4. **Network Issues**: For local testing, use ngrok to expose local server
