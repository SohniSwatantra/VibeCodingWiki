import OpenAI from 'openai';

let client: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (!client) {
    const apiKey = import.meta.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not configured.');
    }
    client = new OpenAI({ apiKey });
  }
  return client;
}

export type WikiDraftResponse = {
  summary: string;
  sections: Array<{ id: string; title: string; markdown: string }>;
  metadata: {
    sources: Array<{ title: string; url: string }>;
    timeline: Array<{ year: string; title: string; description: string }>;
  };
};

export async function generateStructuredWikiContent(prompt: string): Promise<WikiDraftResponse> {
  const openai = getOpenAIClient();
  const response = await openai.chat.completions.create({
    model: 'gpt-5',
    temperature: 0.4,
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'wikiDraft',
        schema: {
          type: 'object',
          required: ['summary', 'sections', 'metadata'],
          properties: {
            summary: { type: 'string' },
            sections: {
              type: 'array',
              items: {
                type: 'object',
                required: ['id', 'title', 'markdown'],
                properties: {
                  id: { type: 'string' },
                  title: { type: 'string' },
                  markdown: { type: 'string' },
                },
              },
            },
            metadata: {
              type: 'object',
              required: ['sources', 'timeline'],
              properties: {
                sources: {
                  type: 'array',
                  items: {
                    type: 'object',
                    required: ['title', 'url'],
                    properties: {
                      title: { type: 'string' },
                      url: { type: 'string' },
                    },
                  },
                },
                timeline: {
                  type: 'array',
                  items: {
                    type: 'object',
                    required: ['year', 'title', 'description'],
                    properties: {
                      year: { type: 'string' },
                      title: { type: 'string' },
                      description: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    messages: [
      {
        role: 'system',
        content: 'You are a meticulous wiki editor. Follow output instructions exactly.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  const content = response.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('Unexpected OpenAI response format.');
  }

  return JSON.parse(content);
}

