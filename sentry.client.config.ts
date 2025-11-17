// Sentry client config disabled - was causing request blocking issues
// import * as Sentry from '@sentry/astro';

// const dsn = import.meta.env.PUBLIC_SENTRY_DSN;
// const environment = import.meta.env.PUBLIC_SENTRY_ENVIRONMENT ?? import.meta.env.MODE ?? 'development';
// const tunnel = import.meta.env.PUBLIC_SENTRY_TUNNEL;

// const parseSampleRate = (value: string | undefined, fallback: number) => {
//   const numeric = Number(value);
//   return Number.isFinite(numeric) ? numeric : fallback;
// };

// Sentry.init({
//   dsn,
//   enabled: Boolean(dsn),
//   environment,
//   integrations: [Sentry.browserTracingIntegration()],
//   tracesSampleRate: parseSampleRate(import.meta.env.PUBLIC_SENTRY_TRACES_SAMPLE_RATE, 0.1),
//   replaysSessionSampleRate: parseSampleRate(import.meta.env.PUBLIC_SENTRY_REPLAYS_SESSION_SAMPLE_RATE, 0),
//   replaysOnErrorSampleRate: parseSampleRate(import.meta.env.PUBLIC_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE, 1),
//   ...(tunnel ? { tunnel } : {}),
// });
