# 🚀 Vercel Deployment Guide - BlackGoldUnited ERP

This guide will help you deploy your BlackGoldUnited ERP system to Vercel with automatic deployments.

## 🔧 Automatic Deployment Setup

### 1. **Connect Repository to Vercel**

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository: `https://github.com/Qualiasolutions/boardroom`
4. Vercel will automatically detect it's a Next.js project

### 2. **Configure Environment Variables**

In your Vercel project settings, add these environment variables:

#### **Required Production Variables:**

```bash
# Database Configuration
DATABASE_URL=postgresql://postgres:[YOUR_DB_PASSWORD]@db.vphziwoympzbtnndnqph.supabase.co:5432/postgres?schema=public

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://vphziwoympzbtnndnqph.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwaHppd295bXB6YnRubmRucXBoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzNjA2MTcsImV4cCI6MjA3MzkzNjYxN30.-amhXg1seYaz90SOwLqxDv8F-YbHu6Vp1mmME72xRuM
SUPABASE_SERVICE_ROLE_KEY=[YOUR_SERVICE_ROLE_KEY]

# Authentication
NEXTAUTH_SECRET=[GENERATE_STRONG_SECRET]
NEXTAUTH_URL=https://your-project-name.vercel.app

# Application
NODE_ENV=production
NEXT_PUBLIC_APP_NAME=BlackGoldUnited ERP
NEXT_PUBLIC_APP_VERSION=1.0.0
DATABASE_PROVIDER=supabase

# Features
FEATURE_INVENTORY_MODULE=true
FEATURE_ACCOUNTING_MODULE=true
FEATURE_CRM_MODULE=true
FEATURE_SIGNUP_ENABLED=false
NEXT_PUBLIC_DEBUG_MODE=false
```

#### **Optional Email Configuration:**

```bash
# Email (for password reset functionality)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=admin@blackgoldunited.com
SMTP_PASSWORD=[YOUR_APP_PASSWORD]
FROM_EMAIL=noreply@blackgoldunited.com
```

### 3. **Deployment Configuration**

The `vercel.json` file is already configured with:

- ✅ **Auto-deployment** from GitHub
- ✅ **Next.js framework** detection
- ✅ **Production optimizations**
- ✅ **API function timeouts** (30s)
- ✅ **EU region** (Frankfurt) for better performance

## 🔄 Automatic Deployment Process

### **When you push to GitHub:**

1. **Trigger**: Any push to `main` branch
2. **Build**: Vercel automatically starts build process
3. **Deploy**: Live deployment in ~2-3 minutes
4. **URL**: Accessible at `https://your-project-name.vercel.app`

### **Build Process:**

```bash
1. npm ci                    # Install dependencies
2. npm run build            # Build Next.js app
3. Deploy to Vercel Edge    # Global distribution
4. Update preview URLs      # Instant access
```

## 🎯 Quick Setup Steps

### **1. Deploy to Vercel (One-time setup):**

1. **Visit Vercel**: https://vercel.com/new
2. **Import Git Repository**: `Qualiasolutions/boardroom`
3. **Configure Project**:
   - Project Name: `blackgoldunited-erp`
   - Framework: Next.js (auto-detected)
   - Root Directory: `./` (default)

### **2. Add Environment Variables:**

Go to your project → Settings → Environment Variables and add all the variables listed above.

**🚨 Important**: Replace placeholders:
- `[YOUR_DB_PASSWORD]` - Your Supabase database password
- `[YOUR_SERVICE_ROLE_KEY]` - Your Supabase service role key
- `[GENERATE_STRONG_SECRET]` - Generate with: `openssl rand -base64 32`

### **3. Deploy:**

Click "Deploy" and Vercel will:
- Build your application
- Deploy to global edge network
- Provide you with a live URL

## 🔐 Security Configuration

### **Database Security:**
- ✅ Supabase handles SSL encryption
- ✅ Row Level Security (RLS) ready
- ✅ Environment variables secured

### **Authentication Security:**
- ✅ NextAuth.js with secure sessions
- ✅ Production-grade secret key
- ✅ HTTPS enforced in production

## 📊 Monitoring & Analytics

### **Built-in Vercel Features:**
- ✅ **Real-time Analytics**: Usage, performance, errors
- ✅ **Function Logs**: API endpoint monitoring
- ✅ **Speed Insights**: Core Web Vitals tracking
- ✅ **Deployment History**: Rollback capabilities

### **Access Monitoring:**
- **Dashboard**: https://vercel.com/dashboard
- **Analytics**: Project → Analytics tab
- **Function Logs**: Project → Functions tab
- **Deployments**: Project → Deployments tab

## 🚀 Go Live Checklist

### **Pre-deployment:**
- [ ] All environment variables configured
- [ ] Supabase database password obtained
- [ ] NEXTAUTH_SECRET generated
- [ ] Custom domain configured (optional)

### **Post-deployment:**
- [ ] Test user registration/login
- [ ] Verify database connectivity
- [ ] Check all modules load correctly
- [ ] Test role-based access control
- [ ] Verify email functionality (if configured)

## 🌐 Custom Domain (Optional)

To use your own domain:

1. **Vercel Dashboard** → Your Project → Settings → Domains
2. **Add Domain**: `yourdomain.com`
3. **Configure DNS**: Add CNAME record pointing to Vercel
4. **SSL Certificate**: Automatically provisioned

## 🔄 Automatic Updates

**Every push to `main` branch will:**
1. ✅ Trigger automatic deployment
2. ✅ Run build and tests
3. ✅ Deploy to production
4. ✅ Update live site instantly

**No manual intervention required!**

## 📞 Support

### **Vercel Issues:**
- **Documentation**: https://vercel.com/docs
- **Support**: https://vercel.com/support

### **Application Issues:**
- **Check Logs**: Vercel Dashboard → Functions
- **Review Build**: Vercel Dashboard → Deployments
- **Database**: Supabase Dashboard

## 🎉 Deployment Complete!

Once configured, your BlackGoldUnited ERP system will be:
- ✅ **Live on the internet**
- ✅ **Automatically updated** with every push
- ✅ **Globally distributed** via Vercel Edge
- ✅ **Production-ready** with Supabase backend

**Your application will be accessible at**: `https://your-project-name.vercel.app`

---

**Happy deploying! 🚀**