#!/usr/bin/env node

/**
 * Environment Variables Validation Script
 * Validates that all required environment variables are set for production deployment
 */

const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

const log = (color, message) => console.log(`${colors[color]}${message}${colors.reset}`);

// Required environment variables
const requiredVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
];

// Optional but recommended environment variables
const recommendedVars = [
  'NEXT_PUBLIC_SENTRY_DSN',
  'RESEND_API_KEY',
  'NOVU_API_KEY',
  'INNGEST_EVENT_KEY',
  'INNGEST_SIGNING_KEY',
];

// Feature flags
const featureFlags = [
  'FEATURE_INVENTORY_MODULE',
  'FEATURE_ACCOUNTING_MODULE',
  'FEATURE_CRM_MODULE',
  'FEATURE_SIGNUP_ENABLED',
];

// System configuration
const systemVars = [
  'NODE_ENV',
  'NEXT_PUBLIC_APP_NAME',
  'NEXT_PUBLIC_APP_VERSION',
  'FROM_EMAIL',
];

console.log('\n🔍 BlackGoldUnited ERP - Environment Variables Validation');
console.log('========================================================\n');

let hasErrors = false;
let hasWarnings = false;

// Check required variables
log('blue', '📋 Required Variables:');
requiredVars.forEach(varName => {
  if (process.env[varName]) {
    log('green', `  ✅ ${varName}`);
  } else {
    log('red', `  ❌ ${varName} - MISSING (Required)`);
    hasErrors = true;
  }
});

// Check recommended variables
log('blue', '\n🔧 Recommended Variables:');
recommendedVars.forEach(varName => {
  if (process.env[varName]) {
    log('green', `  ✅ ${varName}`);
  } else {
    log('yellow', `  ⚠️  ${varName} - Missing (Optional)`);
    hasWarnings = true;
  }
});

// Check feature flags
log('blue', '\n🎛️  Feature Flags:');
featureFlags.forEach(varName => {
  if (process.env[varName]) {
    const value = process.env[varName];
    log('green', `  ✅ ${varName} = ${value}`);
  } else {
    log('yellow', `  ⚠️  ${varName} - Not set (will use default)`);
  }
});

// Check system variables
log('blue', '\n⚙️  System Configuration:');
systemVars.forEach(varName => {
  if (process.env[varName]) {
    const value = process.env[varName];
    log('green', `  ✅ ${varName} = ${value}`);
  } else {
    log('yellow', `  ⚠️  ${varName} - Not set`);
  }
});

// Service-specific validation
console.log('\n');
log('blue', '🔗 Service Integrations:');

// Supabase validation
if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (url.includes('supabase.co') || url.includes('supabase.com')) {
    log('green', '  ✅ Supabase - Configured');
  } else {
    log('yellow', '  ⚠️  Supabase - URL format looks unusual');
  }
} else {
  log('red', '  ❌ Supabase - Not configured (Required)');
  hasErrors = true;
}

// Sentry validation
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  log('green', '  ✅ Sentry - Error monitoring enabled');
} else {
  log('yellow', '  ⚠️  Sentry - Error monitoring disabled');
}

// Email validation
if (process.env.RESEND_API_KEY) {
  log('green', '  ✅ Resend - Email service enabled');
} else if (process.env.SMTP_HOST) {
  log('green', '  ✅ SMTP - Email service enabled');
} else {
  log('yellow', '  ⚠️  Email - No email service configured');
}

// Notifications validation
if (process.env.NOVU_API_KEY) {
  log('green', '  ✅ Novu - Notifications enabled');
} else {
  log('yellow', '  ⚠️  Novu - Notifications disabled');
}

// Background jobs validation
if (process.env.INNGEST_EVENT_KEY && process.env.INNGEST_SIGNING_KEY) {
  log('green', '  ✅ Inngest - Background jobs enabled');
} else {
  log('yellow', '  ⚠️  Inngest - Background jobs disabled');
}

// Summary
console.log('\n');
log('blue', '📊 Summary:');

if (hasErrors) {
  log('red', '  ❌ Deployment not ready - Missing required variables');
  console.log('\n📚 Setup Guide:');
  console.log('  1. Run: npm run env:setup (interactive)');
  console.log('  2. Or: npm run env:batch (quick setup)');
  console.log('  3. Or: Follow DEPLOYMENT.md guide');
  process.exit(1);
} else if (hasWarnings) {
  log('yellow', '  ⚠️  Minimal deployment ready - Some optional services missing');
  log('green', '  ✅ Core functionality will work');
  console.log('\n💡 Recommendation:');
  console.log('  Configure optional services for better user experience');
  console.log('  Run: npm run env:setup');
} else {
  log('green', '  ✅ Full deployment ready - All services configured!');
}

console.log('\n🚀 Next Steps:');
console.log('  1. Run: npm run deploy');
console.log('  2. Test: npm run health:check');
console.log('');