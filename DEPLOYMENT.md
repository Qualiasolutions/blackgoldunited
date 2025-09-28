# BlackGoldUnited ERP - Production Deployment Guide

This guide will help you deploy the BlackGoldUnited ERP system to production using Vercel.

## Prerequisites

1. **Vercel CLI installed**:
   ```bash
   npm install -g vercel
   ```

2. **Vercel account and login**:
   ```bash
   vercel login
   ```

3. **API Keys Ready**: Have all your service API keys ready before deployment.

## Quick Deployment Steps

### 1. Environment Variables Setup

Choose one of these methods:

#### Option A: Interactive Setup (Recommended)
```bash
./scripts/vercel-env-setup.sh
```

#### Option B: Batch Setup (Faster if you have all keys)
```bash
./scripts/vercel-env-batch.sh
```

#### Option C: Manual Setup (Copy and paste these commands)

```bash
# Core Application
echo "production" | vercel env add NODE_ENV production
echo "BlackGoldUnited ERP" | vercel env add NEXT_PUBLIC_APP_NAME production
echo "1.0.0" | vercel env add NEXT_PUBLIC_APP_VERSION production

# Supabase (Required)
echo "YOUR_SUPABASE_URL" | vercel env add NEXT_PUBLIC_SUPABASE_URL production
echo "YOUR_SUPABASE_ANON_KEY" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production

# Sentry (Optional)
echo "YOUR_SENTRY_DSN" | vercel env add NEXT_PUBLIC_SENTRY_DSN production
echo "YOUR_SENTRY_ORG" | vercel env add SENTRY_ORG production
echo "YOUR_SENTRY_PROJECT" | vercel env add SENTRY_PROJECT production
echo "YOUR_SENTRY_AUTH_TOKEN" | vercel env add SENTRY_AUTH_TOKEN production

# Novu (Optional)
echo "YOUR_NOVU_API_KEY" | vercel env add NOVU_API_KEY production
echo "YOUR_NOVU_APP_ID" | vercel env add NEXT_PUBLIC_NOVU_APPLICATION_IDENTIFIER production

# Resend (Optional)
echo "YOUR_RESEND_API_KEY" | vercel env add RESEND_API_KEY production

# Inngest (Optional)
echo "YOUR_INNGEST_EVENT_KEY" | vercel env add INNGEST_EVENT_KEY production
echo "YOUR_INNGEST_SIGNING_KEY" | vercel env add INNGEST_SIGNING_KEY production
echo "production" | vercel env add NEXT_PUBLIC_INNGEST_ENV production

# Checkly (Optional)
echo "YOUR_CHECKLY_API_KEY" | vercel env add CHECKLY_API_KEY production
echo "YOUR_CHECKLY_ACCOUNT_ID" | vercel env add CHECKLY_ACCOUNT_ID production

# Feature Flags
echo "true" | vercel env add FEATURE_INVENTORY_MODULE production
echo "true" | vercel env add FEATURE_ACCOUNTING_MODULE production
echo "true" | vercel env add FEATURE_CRM_MODULE production
echo "false" | vercel env add FEATURE_SIGNUP_ENABLED production

# Security Settings
echo "86400" | vercel env add SESSION_TIMEOUT production
echo "5" | vercel env add MAX_LOGIN_ATTEMPTS production
echo "900" | vercel env add ACCOUNT_LOCKOUT_DURATION production

# Email Configuration
echo "info@blackgoldunited.com" | vercel env add FROM_EMAIL production

# Sentry Suppression Flags
echo "1" | vercel env add SENTRY_SUPPRESS_INSTRUMENTATION_FILE_WARNING production
echo "1" | vercel env add SENTRY_SUPPRESS_GLOBAL_ERROR_HANDLER_FILE_WARNING production
```

### 2. Verify Environment Variables

```bash
vercel env ls
```

### 3. Deploy to Production

```bash
vercel --prod
```

## Service Setup Instructions

### 🔐 Supabase Setup (Required)

1. Go to [Supabase](https://supabase.com)
2. Create a new project
3. Go to Settings → API
4. Copy your Project URL and anon public key
5. Set up your database schema (use the SQL files in `/database` folder)

### 📊 Sentry Setup (Optional)

1. Go to [Sentry](https://sentry.io)
2. Create account and new Next.js project
3. Get your DSN from Project Settings
4. Create auth token in Settings → Auth Tokens

### 🔔 Novu Setup (Optional)

1. Go to [Novu](https://novu.co)
2. Create account and get API key from API Keys section
3. Note your Application Identifier

### 📧 Resend Setup (Optional)

1. Go to [Resend](https://resend.com)
2. Create account and generate API key
3. Verify your sending domain

### ⚙️ Inngest Setup (Optional)

1. Go to [Inngest](https://inngest.com)
2. Create account and get Event Key and Signing Key
3. Connect your Vercel deployment

### 📈 Checkly Setup (Optional)

1. Go to [Checkly](https://checkly.com)
2. Create account and get API key
3. Note your Account ID

## Post-Deployment Verification

### 1. Health Check
```bash
curl https://your-domain.vercel.app/api/health
```

Expected response:
```json
{
  "status": "ok",
  "message": "All systems operational",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "checks": {
    "database": "ok",
    "api": "ok"
  }
}
```

### 2. Dashboard Access
Visit `https://your-domain.vercel.app/dashboard` and verify:
- ✅ Page loads without errors
- ✅ Authentication redirects work
- ✅ No console errors

### 3. Database Connection
Check that:
- ✅ Login/signup works
- ✅ Data loads on dashboard
- ✅ No database connection errors

## Troubleshooting

### Common Issues

#### 1. Build Failures
```bash
# Check build locally first
npm run build

# Check TypeScript errors
npm run type-check

# Check linting
npm run lint
```

#### 2. Environment Variable Issues
```bash
# List all environment variables
vercel env ls

# Remove incorrect variable
vercel env rm VARIABLE_NAME production

# Add corrected variable
echo "NEW_VALUE" | vercel env add VARIABLE_NAME production
```

#### 3. Database Connection Issues
- Verify Supabase URL and key are correct
- Check Supabase project is not paused
- Verify RLS policies allow access

#### 4. Service Integration Issues
- Check API keys are valid and not expired
- Verify service quotas aren't exceeded
- Check service status pages

### Getting Help

1. **Application Logs**: `vercel logs your-domain.vercel.app`
2. **Build Logs**: Check Vercel dashboard
3. **Database Logs**: Check Supabase dashboard
4. **Error Monitoring**: Check Sentry dashboard (if configured)

## Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL | `https://abc.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anonymous key | `eyJhbGciOiJIUzI1NiI...` |
| `NEXT_PUBLIC_SENTRY_DSN` | ❌ | Sentry DSN for error tracking | `https://abc@sentry.io/123` |
| `NOVU_API_KEY` | ❌ | Novu API key for notifications | `nv_abc123...` |
| `RESEND_API_KEY` | ❌ | Resend API key for emails | `re_abc123...` |
| `INNGEST_EVENT_KEY` | ❌ | Inngest event key | `evt_abc123...` |
| `CHECKLY_API_KEY` | ❌ | Checkly API key for monitoring | `cu_abc123...` |

## Security Notes

- ✅ All API keys are stored securely in Vercel
- ✅ Environment variables are encrypted
- ✅ No secrets in code repository
- ✅ Proper CORS and CSP headers configured
- ✅ Database RLS policies active

## Next Steps After Deployment

1. **Set up monitoring**: Configure alerts in Sentry and Checkly
2. **Custom domain**: Add your custom domain in Vercel settings
3. **SSL certificate**: Automatic with Vercel
4. **Performance monitoring**: Review Core Web Vitals in Vercel Analytics
5. **Backup strategy**: Set up Supabase automated backups

---

🎉 **Congratulations!** Your BlackGoldUnited ERP system is now live in production!