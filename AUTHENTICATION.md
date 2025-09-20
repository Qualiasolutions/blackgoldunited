# BlackGoldUnited ERP - Authentication & Authorization System

This document describes the comprehensive authentication and authorization system implemented for the BlackGoldUnited ERP project.

## Overview

The authentication system provides secure, role-based access control with the following features:

- **NextAuth.js Integration**: Secure session management and authentication
- **Role-Based Access Control (RBAC)**: 5 distinct user roles with granular permissions
- **JWT Token Management**: Secure token-based authentication
- **Password Security**: Strong password policies and secure hashing
- **Password Reset**: Email-based password reset functionality
- **Audit Logging**: Comprehensive authentication event tracking
- **Route Protection**: Middleware-based route protection
- **Session Management**: Secure session handling with proper timeouts

## User Roles and Permissions

### 1. Management
- **Access Level**: Full access to all modules
- **Permissions**: Complete CRUD operations across all modules
- **Special Access**: Can manage system settings and user permissions

### 2. Finance Team
- **Primary Access**: Full access to Finance, Accounting, and Payroll modules
- **Secondary Access**: Read-only access to Procurement, Contracts, and Sales modules
- **Restricted Access**: No access to QHSE module

### 3. Procurement/BD Team
- **Primary Access**: Full access to Sales, Procurement, Projects, and Contracts modules
- **Secondary Access**: Read-only access to Finance and Accounting modules
- **Restricted Access**: No access to Payroll module

### 4. Admin/HR
- **Primary Access**: Full access to HR, Attendance, Payroll, and Settings modules
- **Secondary Access**: Limited read-only access to other operational modules
- **Special Access**: User management capabilities

### 5. IMS/QHSE Officer
- **Primary Access**: Full access to QHSE and Compliance modules
- **Secondary Access**: Limited read access to operational modules for compliance monitoring
- **Restricted Access**: No access to Payroll and sensitive financial data

## Technical Implementation

### File Structure

```
lib/
├── auth/
│   ├── config.ts           # NextAuth.js configuration
│   ├── audit.ts            # Authentication audit logging
│   ├── email.ts            # Email utilities for auth
│   └── validation.ts       # Input validation schemas
├── hooks/
│   └── useAuth.ts          # Authentication hooks
├── types/
│   └── auth.ts             # TypeScript type definitions
└── prisma.ts               # Prisma client configuration

app/
├── auth/
│   ├── login/page.tsx      # Login page
│   ├── signup/page.tsx     # Signup page
│   ├── forgot-password/page.tsx # Password reset request
│   └── reset-password/page.tsx  # Password reset confirmation
├── api/auth/
│   ├── [...nextauth]/route.ts   # NextAuth.js API route
│   ├── signup/route.ts          # User registration API
│   ├── reset-password/route.ts  # Password reset request API
│   ├── reset-password/confirm/route.ts # Password reset confirmation API
│   └── change-password/route.ts # Password change API
└── dashboard/page.tsx      # Protected dashboard

components/
└── providers/
    └── AuthProvider.tsx    # Session provider wrapper

middleware.ts               # Route protection middleware
```

### Key Features

#### 1. NextAuth.js Configuration
- **Provider**: Custom credentials provider with database integration
- **Session Strategy**: JWT-based sessions for stateless authentication
- **Database Integration**: Prisma adapter for user data management
- **Security**: Secure password hashing using bcryptjs

#### 2. Role-Based Access Control
- **Access Matrix**: Predefined permission matrix for each user role
- **Module Permissions**: Granular permissions for each ERP module
- **Action-Level Control**: Create, Read, Update, Delete permissions per module

#### 3. Route Protection Middleware
- **Automatic Protection**: Middleware protects all routes except public ones
- **Permission Checking**: Route-level permission validation
- **Redirect Handling**: Intelligent redirection based on user permissions

#### 4. Authentication Hooks
- **useAuth**: Primary authentication hook with login, logout, and user state
- **usePermissions**: Permission checking utilities for components

#### 5. Audit Logging
- **Event Tracking**: All authentication events are logged
- **Security Monitoring**: Failed login attempt tracking and account lockout
- **Compliance**: Complete audit trail for security compliance

#### 6. Password Security
- **Strong Policies**: Enforced password complexity requirements
- **Secure Storage**: bcryptjs hashing with salt rounds
- **Reset Functionality**: Secure token-based password reset

## API Endpoints

### Authentication APIs

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/[...nextauth]` | GET/POST | NextAuth.js authentication handlers |
| `/api/auth/signup` | POST | User registration |
| `/api/auth/reset-password` | POST | Password reset request |
| `/api/auth/reset-password/confirm` | POST | Password reset confirmation |
| `/api/auth/change-password` | POST | Change password for authenticated users |

### Request/Response Examples

#### Login Request
```javascript
// Handled by NextAuth.js - use signIn function
import { signIn } from 'next-auth/react'

await signIn('credentials', {
  email: 'user@example.com',
  password: 'password123',
  redirect: false
})
```

#### Signup Request
```javascript
POST /api/auth/signup
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@company.com",
  "password": "SecurePass123!",
  "confirmPassword": "SecurePass123!",
  "role": "PROCUREMENT_BD"
}
```

#### Password Reset Request
```javascript
POST /api/auth/reset-password
{
  "email": "user@example.com"
}
```

## Environment Configuration

Required environment variables:

```env
# Authentication
NEXTAUTH_SECRET=your-secure-secret-key
NEXTAUTH_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/database

# Email (for password reset)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FROM_EMAIL=noreply@blackgoldunited.com
```

## Usage Examples

### Authentication Hook Usage

```typescript
'use client'
import { useAuth } from '@/lib/hooks/useAuth'

export default function LoginForm() {
  const { login, isLoading, error } = useAuth()

  const handleSubmit = async (credentials) => {
    const result = await login(credentials)
    if (result.success) {
      // Handle successful login
    }
  }

  return (
    // Form JSX
  )
}
```

### Permission Checking

```typescript
'use client'
import { usePermissions } from '@/lib/hooks/useAuth'

export default function InventoryPage() {
  const { hasPermission, hasModuleAccess } = usePermissions()

  if (!hasModuleAccess('inventory')) {
    return <div>Access Denied</div>
  }

  const canCreateProduct = hasPermission('inventory', 'create')

  return (
    <div>
      {canCreateProduct && (
        <button>Create Product</button>
      )}
    </div>
  )
}
```

### Protected Route Example

```typescript
// Routes are automatically protected by middleware
// Access is controlled based on user role and route permissions
```

## Security Features

### 1. Password Policies
- Minimum 8 characters
- Must contain uppercase, lowercase, number, and special character
- Password strength validation on client and server

### 2. Session Security
- JWT tokens with configurable expiration
- Secure httpOnly cookies
- Session refresh on activity

### 3. Account Protection
- Failed login attempt tracking
- Account lockout after 5 failed attempts
- IP address and user agent logging

### 4. Data Validation
- Server-side validation using Zod schemas
- Input sanitization and XSS prevention
- SQL injection protection through Prisma ORM

## Database Schema

The authentication system uses the following key database models:

### User Model
```prisma
model User {
  id          String    @id @default(cuid())
  email       String    @unique
  firstName   String
  lastName    String
  role        UserRole
  isActive    Boolean   @default(true)
  passwordHash String
  resetToken   String?
  resetTokenExpiry DateTime?
  // ... other fields
}
```

### Audit Log Model
```prisma
model AuditLog {
  id          String   @id @default(cuid())
  tableName   String
  action      String
  userId      String
  timestamp   DateTime @default(now())
  ipAddress   String?
  userAgent   String?
  // ... other fields
}
```

## Development Setup

1. **Install Dependencies**
   ```bash
   npm install next-auth @auth/prisma-adapter bcryptjs jsonwebtoken nodemailer
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

3. **Setup Database**
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

4. **Run Development Server**
   ```bash
   npm run dev
   ```

## Testing the Authentication System

### 1. Create Test Users
Use the signup API or database seeding to create test users with different roles.

### 2. Test Login Flow
- Visit `/auth/login`
- Test with valid and invalid credentials
- Verify proper redirection to dashboard

### 3. Test Role-Based Access
- Login with different role users
- Verify access to different modules based on permissions
- Test route protection middleware

### 4. Test Password Reset
- Use forgot password functionality
- Verify email delivery (check development logs)
- Complete password reset flow

## Security Considerations

### Production Deployment
1. **Environment Variables**: Use secure, unique values for all secrets
2. **HTTPS**: Ensure all authentication traffic uses HTTPS
3. **Database Security**: Secure database connections and access
4. **Email Security**: Use secure SMTP configuration
5. **Monitoring**: Implement proper logging and monitoring
6. **Rate Limiting**: Add rate limiting for authentication endpoints

### Compliance
- All authentication events are logged for audit purposes
- User data is handled according to privacy regulations
- Secure password storage using industry-standard hashing

## Troubleshooting

### Common Issues

1. **Session Not Persisting**
   - Check NEXTAUTH_SECRET environment variable
   - Verify NEXTAUTH_URL matches your domain

2. **Email Not Sending**
   - Verify SMTP configuration
   - Check email service logs

3. **Permission Errors**
   - Verify user role in database
   - Check access control matrix configuration

4. **Database Connection Issues**
   - Verify DATABASE_URL format
   - Check database server connectivity

### Debug Mode
Enable debug mode in development:
```env
NEXTAUTH_DEBUG=true
```

This will provide detailed logging for authentication flows.

## Future Enhancements

Potential improvements for the authentication system:

1. **Multi-Factor Authentication (MFA)**: Add 2FA support
2. **OAuth Integration**: Add Google, Microsoft, or other OAuth providers
3. **Advanced Session Management**: Add device management and session invalidation
4. **Rate Limiting**: Implement API rate limiting
5. **Advanced Audit**: Enhanced audit trail with more detailed tracking
6. **Role Management UI**: Admin interface for role and permission management

## Support

For issues related to the authentication system:

1. Check this documentation
2. Review the audit logs for authentication events
3. Verify environment configuration
4. Check database schema and migrations
5. Review NextAuth.js documentation for advanced configuration

---

**Note**: This authentication system is designed to be secure and production-ready. Always follow security best practices and keep dependencies updated.