# BlackGoldUnited ERP - Authentication & Authorization System

This document describes the comprehensive authentication and authorization system implemented for the BlackGoldUnited ERP project.

## Overview

The authentication system provides secure, role-based access control with the following features:

- **Supabase Auth Integration**: Secure session management and authentication
- **Role-Based Access Control (RBAC)**: 5 distinct user roles with granular permissions
- **JWT Token Management**: Secure token-based authentication via Supabase Auth
- **Password Security**: Strong password policies and secure hashing
- **Password Reset**: Email-based password reset functionality
- **Audit Logging**: Comprehensive authentication event tracking
- **Route Protection**: Middleware-based route protection
- **Session Management**: Server-side rendering with proper session handling

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
├── supabase/
│   ├── client.ts           # Supabase client for browser
│   └── server.ts           # Supabase client for server-side
├── hooks/
│   └── useAuth.ts          # Authentication hooks
├── types/
│   └── auth.ts             # TypeScript type definitions
└── config/
    └── navigation.ts       # Role-based navigation config

app/
├── auth/
│   ├── login/page.tsx      # Login page
│   ├── signup/page.tsx     # Signup page
│   └── forgot-password/page.tsx # Password reset page
components/
├── providers/
│   └── AuthProvider.tsx   # Auth context provider
├── auth/
│   ├── protected-route.tsx # Route protection component
│   └── role-guard.tsx      # Component-level role checking
└── layout/
    ├── main-layout.tsx     # Main layout with auth
    ├── sidebar.tsx         # Role-based navigation
    └── header.tsx          # User menu and auth state

middleware.ts               # Route protection middleware
```

### Key Features

#### 1. Supabase Auth Configuration
- **Provider**: Supabase Auth with email/password authentication
- **Session Strategy**: Server-side sessions with automatic refresh
- **Database Integration**: Direct Supabase database integration
- **Security**: Built-in password hashing and security features

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
| Supabase Auth APIs | - | Handled by Supabase Auth service |
| Login/Logout | - | Via Supabase client methods |
| User Registration | - | Via Supabase auth.signUp() |
| Password Reset | - | Via Supabase auth.resetPasswordForEmail() |
| Session Management | - | Automatic via Supabase Auth |

### Request/Response Examples

#### Login Request
```javascript
// Using Supabase Auth
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123'
})
```

#### Signup Request
```javascript
// Using Supabase Auth
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()
const { data, error } = await supabase.auth.signUp({
  email: 'john.doe@company.com',
  password: 'SecurePass123!',
  options: {
    data: {
      firstName: 'John',
      lastName: 'Doe',
      role: 'PROCUREMENT_BD'
    }
  }
})
```

#### Password Reset Request
```javascript
// Using Supabase Auth
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()
const { error } = await supabase.auth.resetPasswordForEmail(
  'user@example.com'
)
```

## Environment Configuration

Required environment variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Usage Examples

### Authentication Hook Usage

```typescript
'use client'
import { useAuth } from '@/lib/hooks/useAuth'

export default function LoginForm() {
  const { user, loading, signOut } = useAuth()

  if (loading) return <div>Loading...</div>
  if (!user) return <LoginForm />

  return (
    <div>
      Welcome {user.email}
      <button onClick={signOut}>Sign Out</button>
    </div>
  )
}
```

### Permission Checking

```typescript
'use client'
import { useAuth } from '@/lib/hooks/useAuth'
import { RoleGuard } from '@/components/auth/role-guard'

export default function InventoryPage() {
  const { user, userRole } = useAuth()

  return (
    <RoleGuard allowedRoles={['MANAGEMENT', 'PROCUREMENT_BD']}>
      <div>
        <h1>Inventory Management</h1>
        {/* Inventory content */}
      </div>
    </RoleGuard>
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
- SQL injection protection through Supabase's secure API

## Database Schema

The authentication system uses the following key database models:

### User Authentication
- **User Management**: Handled by Supabase Auth system
- **User Metadata**: Role and profile information stored in user metadata
- **Session Management**: Automatic session handling with refresh tokens

### Database Integration
```typescript
// User data is managed through Supabase Auth
// Additional profile data stored in database tables
// Role-based permissions handled in middleware and components
```

## Development Setup

1. **Install Dependencies**
   ```bash
   # Dependencies already included in package.json
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

3. **Setup Supabase**
   ```bash
   # Configure Supabase project
   # Set up authentication in Supabase Dashboard
   # Configure RLS policies as needed
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

4. **Supabase Connection Issues**
   - Verify Supabase URL and API key
   - Check Supabase project status

### Debug Mode
Monitor authentication in development:
- Check browser DevTools for Supabase client logs
- Use Supabase Dashboard to monitor auth events
- Review middleware.ts logs for route protection

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