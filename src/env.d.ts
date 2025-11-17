/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_SITE_URL: string;
  readonly PUBLIC_AUTUMN_PRODUCT_ID: string;

  readonly WORKOS_API_KEY: string;
  readonly WORKOS_CLIENT_ID: string;
  readonly WORKOS_REDIRECT_URI: string;
  readonly WORKOS_COOKIE_PASSWORD: string;

  readonly CONVEX_DEPLOYMENT?: string;
  readonly CONVEX_URL: string;
  readonly CONVEX_ADMIN_KEY?: string;

  readonly AUTUMN_API_KEY: string;
  readonly AUTUMN_WEBHOOK_SECRET?: string;
  readonly AUTUMN_API_BASE?: string;
  readonly AUTUMN_CHECKOUT_PATH?: string;

  readonly FIRECRAWL_API_KEY: string;

  readonly OPENAI_API_KEY?: string;

  readonly PUBLIC_SENTRY_DSN?: string;
  readonly PUBLIC_SENTRY_ENVIRONMENT?: string;
  readonly PUBLIC_SENTRY_TRACES_SAMPLE_RATE?: string;
  readonly PUBLIC_SENTRY_REPLAYS_SESSION_SAMPLE_RATE?: string;
  readonly PUBLIC_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE?: string;
  readonly PUBLIC_SENTRY_TUNNEL?: string;
  readonly SENTRY_ENVIRONMENT?: string;
  readonly SENTRY_RELEASE?: string;
  readonly SENTRY_AUTH_TOKEN?: string;
  readonly SENTRY_ORG?: string;
  readonly SENTRY_PROJECT?: string;

  readonly CLOUDFLARE_R2_ACCESS_KEY_ID?: string;
  readonly CLOUDFLARE_R2_SECRET_ACCESS_KEY?: string;
  readonly CLOUDFLARE_R2_BUCKET_NAME?: string;
  readonly CLOUDFLARE_R2_ENDPOINT?: string;

  readonly NETLIFY_SITE_ID?: string;
  readonly NETLIFY_AUTH_TOKEN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare namespace App {
  interface Locals {
    user?: {
      id: string;
      email?: string | null;
      firstName?: string | null;
      lastName?: string | null;
      profilePictureUrl?: string | null;
    };
  }
}
