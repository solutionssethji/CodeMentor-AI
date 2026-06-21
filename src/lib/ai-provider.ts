import { openai, createOpenAI } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { mistral } from '@ai-sdk/mistral';
import { generateText } from 'ai';

/**
 * A centralized factory to retrieve the correct Vercel AI SDK Model based on the user's preference.
 * We support official providers (OpenAI, Anthropic, Mistral) 
 * as well as OpenAI-compatible providers (DeepSeek, Grok).
 */
export function getModel(modelName: string) {
  // Normalize
  const model = (modelName || 'chatgpt').toLowerCase().trim();

  switch (model) {
    // 1. OpenAI ChatGPT
    case 'chatgpt':
    case 'gpt-4o':
    case 'openai':
      return openai('gpt-4o');

    // 2. Anthropic Claude
    case 'claude':
    case 'claude-3-5-sonnet':
    case 'anthropic':
      return anthropic('claude-3-5-sonnet-20240620');

    // 4. Mistral
    case 'mistral':
    case 'mistral-large':
      return mistral('mistral-large-latest');

    // 5. DeepSeek (via OpenAI compatibility)
    case 'deepseek':
    case 'deepseek-coder': {
      const deepseekProvider = createOpenAI({
        baseURL: 'https://api.deepseek.com/v1',
        apiKey: process.env.DEEPSEEK_API_KEY,
      });
      return deepseekProvider('deepseek-coder');
    }

    // 6. xAI Grok
    case 'grok':
    case 'xai': {
      const xaiProvider = createOpenAI({
        baseURL: 'https://api.x.ai/v1',
        apiKey: process.env.XAI_API_KEY,
      });
      return xaiProvider('grok-2-latest');
    }

    // Default Fallback
    default:
      console.warn(`[AI Router] Unknown model "${modelName}", falling back to GPT-4o.`);
      return openai('gpt-4o');
  }
}

/**
 * A resilient wrapper around generateText that automatically falls back
 * to alternative models if the preferred model fails (e.g. rate limits).
 */
export async function generateTextWithFallback({
  preferredModel = 'chatgpt',
  system,
  messages,
  prompt,
}: {
  preferredModel?: string;
  system?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  messages?: any[];
  prompt?: string;
}) {
  // Predefined fallback order (excluding the user's preferred model, which we try first)
  const defaultFallbackOrder = ['chatgpt', 'claude', 'mistral', 'deepseek', 'grok'];
  
  // Create a unique list: [preferredModel, ...others]
  const attemptOrder = [
    preferredModel,
    ...defaultFallbackOrder.filter((m) => m !== preferredModel)
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let lastError: any = null;

  for (const modelName of attemptOrder) {
    try {
      console.log(`[AI Router] Attempting generation with model: ${modelName}`);
      const aiModel = getModel(modelName);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const options: any = { 
        model: aiModel,
        maxRetries: 0 // Disable internal retries so we can instantly fallback to the next model
      };
      if (system) options.system = system;
      if (messages) options.messages = messages;
      if (prompt) options.prompt = prompt;

      const result = await generateText(options);

      console.log(`[AI Router] Success using model: ${modelName}`);
      return result;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.warn(`[AI Router] Model ${modelName} failed. Error: ${error.message}`);
      lastError = error;
      // Continue to the next model in the fallback array
    }
  }

  console.error('[AI Router] ALL models failed. Returning final error.');
  throw lastError || new Error('Failed to generate text from all available AI providers.');
}
