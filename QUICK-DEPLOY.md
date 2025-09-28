# 🚀 Quick Deploy to Vercel

## Prerequisites
```bash
npm install -g vercel
vercel login
```

## Essential Environment Variables (Minimum Required)

### 1. Set Supabase (Required)
```bash
echo "YOUR_SUPABASE_URL" | vercel env add NEXT_PUBLIC_SUPABASE_URL production
echo "YOUR_SUPABASE_ANON_KEY" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
```

### 2. Set Core App Config
```bash
echo "production" | vercel env add NODE_ENV production
echo "BlackGoldUnited ERP" | vercel env add NEXT_PUBLIC_APP_NAME production
echo "1.0.0" | vercel env add NEXT_PUBLIC_APP_VERSION production
echo "info@blackgoldunited.com" | vercel env add FROM_EMAIL production
```

### 3. Set Feature Flags
```bash
echo "true" | vercel env add FEATURE_INVENTORY_MODULE production
echo "true" | vercel env add FEATURE_ACCOUNTING_MODULE production
echo "true" | vercel env add FEATURE_CRM_MODULE production
echo "false" | vercel env add FEATURE_SIGNUP_ENABLED production
```

### 4. Set Sentry Suppression (Prevents Warnings)
```bash
echo "1" | vercel env add SENTRY_SUPPRESS_INSTRUMENTATION_FILE_WARNING production
echo "1" | vercel env add SENTRY_SUPPRESS_GLOBAL_ERROR_HANDLER_FILE_WARNING production
```

## Deploy
```bash
vercel --prod
```

## Verify
```bash
curl https://your-domain.vercel.app/api/health
```

---

## Optional Services (Add Later)

### Sentry (Error Monitoring)
```bash
echo "YOUR_SENTRY_DSN" | vercel env add NEXT_PUBLIC_SENTRY_DSN production
```

### Resend (Email Service)
```bash
echo "YOUR_RESEND_API_KEY" | vercel env add RESEND_API_KEY production
```

### Novu (Notifications)
```bash
echo "YOUR_NOVU_API_KEY" | vercel env add NOVU_API_KEY production
echo "YOUR_NOVU_APP_ID" | vercel env add NEXT_PUBLIC_NOVU_APPLICATION_IDENTIFIER production
```

### Inngest (Background Jobs)
```bash
echo "YOUR_INNGEST_EVENT_KEY" | vercel env add INNGEST_EVENT_KEY production
echo "YOUR_INNGEST_SIGNING_KEY" | vercel env add INNGEST_SIGNING_KEY production
```

---

💡 **Tip**: Use `./scripts/vercel-env-batch.sh` for interactive setup of all services.