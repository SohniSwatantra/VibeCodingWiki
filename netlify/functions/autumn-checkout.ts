import type { Handler } from '@netlify/functions';

const AUTUMN_API_KEY = process.env.AUTUMN_API_KEY ?? '';
const AUTUMN_BASE_URL = process.env.AUTUMN_API_BASE ?? 'https://api.useautumn.com';
const AUTUMN_CHECKOUT_PATH = process.env.AUTUMN_CHECKOUT_PATH ?? '/v1/checkout_sessions';

const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method not allowed' }),
      headers: { 'Content-Type': 'application/json' },
    };
  }

  if (!AUTUMN_API_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'AUTUMN_API_KEY is not configured' }),
      headers: { 'Content-Type': 'application/json' },
    };
  }

  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const { productId, successUrl, cancelUrl } = body as {
      productId?: string;
      successUrl?: string;
      cancelUrl?: string;
    };

    if (!productId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'productId is required' }),
        headers: { 'Content-Type': 'application/json' },
      };
    }

    const response = await fetch(`${AUTUMN_BASE_URL}${AUTUMN_CHECKOUT_PATH}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${AUTUMN_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        productId,
        successUrl,
        cancelUrl,
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify({
          message: data?.message ?? 'Failed to create checkout session with Autumn',
          details: data,
        }),
        headers: { 'Content-Type': 'application/json' },
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' },
    };
  } catch (error) {
    console.error('Autumn checkout error', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Unexpected error creating checkout session' }),
      headers: { 'Content-Type': 'application/json' },
    };
  }
};

export { handler };

