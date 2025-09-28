import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Set tracesSampleRate to 1.0 to capture 100%
  // of the transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // ...

  // Note: if you want to override the automatic release value, do not set a
  // `release` value here - use the environment variable `SENTRY_RELEASE`, so
  // that it will also get attached to your source maps

  integrations: [
    // Add other integrations as needed
  ],

  // Set sample rate for profiling - this is relative to tracesSampleRate
  profilesSampleRate: 1.0,

  // BlackGoldUnited ERP specific configuration
  environment: process.env.NODE_ENV,
  beforeSend(event) {
    // Filter out sensitive ERP data
    if (event.exception) {
      const error = event.exception.values?.[0];
      if (error?.value?.includes('password') || error?.value?.includes('token')) {
        return null; // Don't send sensitive errors
      }
    }
    return event;
  },

  // Additional configuration
  release: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
});