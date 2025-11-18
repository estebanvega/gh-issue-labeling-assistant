import 'dotenv/config';
import OpenAI from 'openai';
import { buildFewShotPrompt } from './promptBuilder.ts';
import type { Issue } from './github.ts';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const LLM_MODEL = process.env.LLM_MODEL ?? 'gpt-4o-mini';

export async function classifyWithLLM(
  similarExamples: { document: string; metadata?: any }[],
  issue: Issue,
  availableLabels: string[]
) {
  const prompt = buildFewShotPrompt(similarExamples, issue, availableLabels);

  const resp = await client.responses.create({
    model: LLM_MODEL,
    input: prompt,
    temperature: 0.0, //temperature: 0 for deterministic outputs
    max_output_tokens: 300,
  });

  let textOutput = '';

  try {
    if ('output_text' in resp && resp.output_text) {
      textOutput = resp.output_text;
    } else {
      textOutput = JSON.stringify(resp.output);
    }
  } catch (e) {
    textOutput = JSON.stringify(resp);
  }

  try {
    const maybe = textOutput.trim();
    const firstCurly = maybe.indexOf('{');
    if (firstCurly >= 0) {
      const jsonText = maybe.slice(firstCurly);
      const parsed = JSON.parse(jsonText);
      if (parsed && Array.isArray(parsed.labels)) {
        return parsed.labels;
      }
    }
  } catch (e) {
    // ignore parse errors
  }

  const arrMatch = textOutput.match(/\[.*\]/s);
  if (arrMatch) {
    try {
      const parsedArr = JSON.parse(arrMatch[0]);
      if (Array.isArray(parsedArr)) return parsedArr;
    } catch (e) {
      // ignore
    }
  }

  return [];
}
