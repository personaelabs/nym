// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: 'https://7ba02ad0a8cd461588447277236ede1c@o4505239028498432.ingest.sentry.io/4505239506649088',

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 0.01, // Used for performance monitoring

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,
  integrations: function (integrations) {
    // integrations will be all default integrations
    return integrations.filter(function (integration) {
      // Remove "HttpContext" which includes browser/device info
      // from the reported errors
      return integration.name !== 'HttpContext' ? true : false;
    });
  },
  autoSessionTracking: false,
  sendClientReports: false,
  enabled: process.env.NODE_ENV !== 'development',
});
