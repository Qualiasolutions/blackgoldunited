# 🔗 BlackGoldUnited ERP - API Documentation

**Version**: 1.0
**Last Updated**: September 24, 2025
**Base URL**: `https://your-domain.com/api`

---

## 🚨 **AUTHENTICATION REQUIRED**

All API endpoints require authentication. Include valid session cookies or authentication headers with your requests.

**Authentication Method**: Supabase Session-based Authentication
**Authorization**: Role-based access control (5 roles)

---

## 📊 **API Response Format**

### Success Response
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

### Error Response
```json
{
  "error": "Descriptive error message"
}
```

**HTTP Status Codes:**
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation error)
- `401`: Unauthorized (not logged in)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `409`: Conflict (duplicate data)
- `500`: Internal Server Error

---

## 👥 **CLIENTS MODULE API**

### **GET** `/api/clients`
**Description**: List all clients with search and pagination
**Access**:
- **MANAGEMENT**: Full access
- **PROCUREMENT_BD**: Full access
- **FINANCE_TEAM**: Read-only access
- **ADMIN_HR**: Read-only access
- **IMS_QHSE**: ❌ No access (403)

**Query Parameters:**
```
?query=search_term          # Search in company name, contact person, email
?status=Active|Inactive     # Filter by client status
?page=1                     # Page number (default: 1)
?limit=10                   # Items per page (default: 10)
?sortBy=companyName         # Sort field (default: companyName)
?sortOrder=asc|desc         # Sort direction (default: asc)
```

**Example Request:**
```bash
GET /api/clients?query=alpha&status=Active&page=1&limit=10
```

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "clientCode": "CL001",
      "companyName": "Alpha Construction Ltd",
      "contactPerson": "John Smith",
      "email": "john@alphaconstruction.com",
      "phone": "+1234567890",
      "mobile": "+1987654321",
      "address": "123 Business St",
      "city": "Business City",
      "state": "Business State",
      "country": "Business Country",
      "postalCode": "12345",
      "taxNumber": "TAX123456",
      "creditLimit": 50000.00,
      "paymentTerms": 30,
      "isActive": true,
      "notes": "Important client",
      "createdAt": "2025-09-24T10:00:00Z",
      "updatedAt": "2025-09-24T10:00:00Z",
      "deletedAt": null
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

---

### **POST** `/api/clients`
**Description**: Create a new client
**Access**:
- **MANAGEMENT**: ✅ Allowed
- **PROCUREMENT_BD**: ✅ Allowed
- **FINANCE_TEAM**: ❌ Read-only (403)
- **ADMIN_HR**: ❌ Read-only (403)
- **IMS_QHSE**: ❌ No access (403)

**Required Fields:**
- `clientCode` (string): Unique client identifier
- `companyName` (string): Company name
- `email` (string): Valid email address

**Request Body:**
```json
{
  "clientCode": "CL002",
  "companyName": "Beta Energy Solutions",
  "contactPerson": "Maria Garcia",
  "email": "maria@betaenergy.com",
  "phone": "+1122334455",
  "mobile": "+1555666777",
  "address": "456 Energy Ave",
  "city": "Tech City",
  "state": "Tech State",
  "country": "Tech Country",
  "postalCode": "67890",
  "taxNumber": "TAX789012",
  "creditLimit": 75000.00,
  "paymentTerms": 45,
  "isActive": true,
  "notes": "New energy client"
}
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "id": "new-uuid",
    "clientCode": "CL002",
    "companyName": "Beta Energy Solutions",
    // ... full client object
  },
  "message": "Client created successfully"
}
```

**Error Responses:**
```json
// Validation Error (400)
{
  "error": "Validation failed",
  "details": [
    {
      "code": "invalid_string",
      "expected": "string",
      "received": "undefined",
      "path": ["companyName"],
      "message": "Company name is required"
    }
  ]
}

// Duplicate Client (409)
{
  "error": "A client with this email already exists"
}
```

---

### **GET** `/api/clients/[id]`
**Description**: Get a single client by ID
**Access**: Same as GET `/api/clients`

**Path Parameters:**
- `id` (string): Client UUID

**Example Request:**
```bash
GET /api/clients/123e4567-e89b-12d3-a456-426614174000
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "clientCode": "CL001",
    "companyName": "Alpha Construction Ltd",
    // ... full client object
  }
}
```

**Error Responses:**
```json
// Invalid ID Format (400)
{
  "error": "Invalid client ID format"
}

// Client Not Found (404)
{
  "error": "Client not found"
}
```

---

### **PUT** `/api/clients/[id]`
**Description**: Update an existing client
**Access**: Same as POST (Create permissions required)

**Path Parameters:**
- `id` (string): Client UUID

**Request Body**: Same as POST, but all fields are optional

**Example Request:**
```json
{
  "companyName": "Alpha Construction Ltd (Updated)",
  "creditLimit": 60000.00,
  "notes": "Updated credit limit"
}
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "companyName": "Alpha Construction Ltd (Updated)",
    // ... updated client object
    "updatedAt": "2025-09-24T12:00:00Z"
  },
  "message": "Client updated successfully"
}
```

---

### **DELETE** `/api/clients/[id]`
**Description**: Soft delete a client (sets isActive = false)
**Access**: Same as POST (Create permissions required)

**Path Parameters:**
- `id` (string): Client UUID

**Example Request:**
```bash
DELETE /api/clients/123e4567-e89b-12d3-a456-426614174000
```

**Example Response:**
```json
{
  "success": true,
  "message": "Client \"Alpha Construction Ltd\" has been deactivated"
}
```

---

## 🔐 **ROLE-BASED ACCESS CONTROL**

### User Roles & Permissions

| Role | Clients GET | Clients POST | Clients PUT | Clients DELETE |
|------|-------------|--------------|-------------|----------------|
| **MANAGEMENT** | ✅ | ✅ | ✅ | ✅ |
| **PROCUREMENT_BD** | ✅ | ✅ | ✅ | ✅ |
| **FINANCE_TEAM** | ✅ | ❌ | ❌ | ❌ |
| **ADMIN_HR** | ✅ | ❌ | ❌ | ❌ |
| **IMS_QHSE** | ❌ | ❌ | ❌ | ❌ |

### Permission Error Examples

```json
// Insufficient Permissions (403)
{
  "error": "Insufficient permissions - FINANCE_TEAM role cannot POST clients"
}

// No Access (403)
{
  "error": "Insufficient permissions - IMS_QHSE role cannot GET clients"
}
```

---

## 🧪 **TESTING & EXAMPLES**

### Testing with cURL

```bash
# List clients (requires authentication)
curl -X GET "http://localhost:3001/api/clients?page=1&limit=5" \
  -H "Content-Type: application/json" \
  -b "session-cookies-here"

# Create client (requires create permissions)
curl -X POST "http://localhost:3001/api/clients" \
  -H "Content-Type: application/json" \
  -b "session-cookies-here" \
  -d '{
    "clientCode": "TEST001",
    "companyName": "Test Company",
    "email": "test@company.com"
  }'
```

### Testing with JavaScript

```javascript
// Frontend API call
const response = await fetch('/api/clients', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  },
});

const result = await response.json();

if (result.success) {
  console.log('Clients:', result.data);
} else {
  console.error('Error:', result.error);
}
```

---

## 📝 **DATABASE SCHEMA**

### Clients Table Structure
```sql
CREATE TABLE clients (
  id                TEXT PRIMARY KEY,
  clientCode        TEXT NOT NULL UNIQUE,
  companyName       TEXT NOT NULL,
  contactPerson     TEXT,
  email             TEXT NOT NULL,
  phone             TEXT,
  mobile            TEXT,
  address           TEXT,
  city              TEXT,
  state             TEXT,
  country           TEXT,
  postalCode        TEXT,
  taxNumber         TEXT,
  creditLimit       NUMERIC,
  paymentTerms      INTEGER,
  isActive          BOOLEAN DEFAULT true,
  notes             TEXT,
  createdAt         TIMESTAMPTZ DEFAULT NOW(),
  updatedAt         TIMESTAMPTZ DEFAULT NOW(),
  deletedAt         TIMESTAMPTZ
);
```

---

## 🚀 **NEXT STEPS**

This API documentation covers the completed **Clients module**.

**Coming in Week 3:**
- Enhanced frontend integration
- Real-time data synchronization
- Advanced search and filtering

**Coming in Week 4+:**
- Sales module API (`/api/sales/invoices`, `/api/sales/rfq`)
- Inventory module API (`/api/inventory/products`)
- Purchase module API (`/api/purchase/suppliers`)

---

## 🐛 **TROUBLESHOOTING**

### Common Issues

**401 Unauthorized**
- Ensure user is logged in
- Check session cookies are included
- Verify authentication tokens

**403 Forbidden**
- Check user role has required permissions
- Verify user account is active (`isActive: true`)
- Review ACCESS_CONTROL_MATRIX in `lib/types/auth.ts`

**400 Validation Error**
- Check required fields are provided
- Verify data types match schema
- Ensure email format is valid
- Check clientCode is unique

**500 Internal Server Error**
- Check server logs for details
- Verify database connection
- Check Supabase configuration

### Support
For technical support, refer to `DEVELOPMENT_PLAN.md` or `CLAUDE.md` for current development status and troubleshooting guides.