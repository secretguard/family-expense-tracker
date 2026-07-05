import { config } from './config';

const SYSTEM_PROMPT = `You are a calm, practical household finance assistant reviewing a
family's monthly spending data. Write a short, specific analysis covering:
1. The most expensive category this month and how it compares to recent months.
2. One or two notable trends or anomalies in the data given.
3. Three to five concrete, specific money-saving tips anchored to the actual numbers
   provided — not generic advice. Reference real categories and amounts from the data.

Keep the whole response under 220 words. Plain language, short paragraphs. For the tips,
use a line starting with "- " per tip so they can be rendered as a list. No markdown
headers, no bold/italic markup, no emoji.`;

export async function generateAnalysis(dataSummary: string): Promise<string> {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.openRouterApiKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.openRouterModel(),
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: dataSummary },
      ],
      max_tokens: 700,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenRouter error ${res.status}: ${text}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('OpenRouter returned no content.');
  return content.trim();
}

const QA_SYSTEM_PROMPT = `You are a calm, practical household finance assistant. You will be given a
family's spending data summary and a specific question about it. Answer the question directly and
concisely, grounded only in the data provided. If the data doesn't contain enough information to
fully answer, say so plainly rather than guessing.

Keep the answer under 150 words. Plain language, short paragraphs. No markdown headers, no
bold/italic markup, no emoji.`;

export async function answerSpendingQuestion(dataSummary: string, question: string): Promise<string> {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.openRouterApiKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.openRouterModel(),
      messages: [
        { role: 'system', content: QA_SYSTEM_PROMPT },
        { role: 'user', content: `Spending data:\n${dataSummary}\n\nQuestion: ${question}` },
      ],
      max_tokens: 500,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenRouter error ${res.status}: ${text}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('OpenRouter returned no content.');
  return content.trim();
}
