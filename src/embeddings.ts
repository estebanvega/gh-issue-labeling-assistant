import 'dotenv/config';
import OpenAI from 'openai';
import { chunkArray, normalizeText } from './util.ts';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL ?? 'text-embedding-3-large';

export async function createEmbeddings(
  texts: string[],
  batchSize = 10
): Promise<number[][]> {
  const chunks = chunkArray(texts, batchSize);
  const out: number[][] = [];
  for (const c of chunks) {
    const resp = await client.embeddings.create({
      model: EMBEDDING_MODEL,
      input: c.map((t) => normalizeText(t)),
    });
    for (const item of resp.data) {
      out.push(item.embedding);
    }
  }
  return out;
}
