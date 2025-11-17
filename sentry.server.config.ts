// Sentry server config disabled - was causing request blocking issues
// import * as Sentry from '@sentry/astro';

// const dsn = import.meta.env.PUBLIC_SENTRY_DSN;
// const environment =
//   import.meta.env.SENTRY_ENVIRONMENT ?? import.meta.env.PUBLIC_SENTRY_ENVIRONMENT ?? import.meta.env.MODE ?? 'development';

// const parseSampleRate = (value: string | undefined, fallback: number) => {
//   const numeric = Number(value);
//   return Number.isFinite(numeric) ? numeric : fallback;
// };

// Sentry.init({
//   dsn,
//   enabled: Boolean(dsn),
//   environment,
//   tracesSampleRate: parseSampleRate(import.meta.env.PUBLIC_SENTRY_TRACES_SAMPLE_RATE, 0.1),
// });
