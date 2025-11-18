import 'dotenv/config';
import axios from 'axios';
import { normalizeMetadata } from './util.ts';

const CHROMA_ENDPOINT = process.env.CHROMA_ENDPOINT;
const COLLECTION = process.env.CHROMA_COLLECTION;

export async function upsertVectors(
  items: {
    id: string;
    embedding: number[];
    metadata?: any;
    document?: string;
  }[]
) {
  if (!items.length) return;
  const dims = new Set(items.map((i) => i.embedding.length));
  if (dims.size > 1)
    throw new Error(`Inconsistent embedding lengths: ${[...dims].join(', ')}`);
  const dim = items[0].embedding.length;
  const expected = Number(process.env.EXPECTED_EMBEDDING_DIM || 0);
  if (expected && dim !== expected)
    throw new Error(
      `Embedding dimension mismatch: payload=${dim}, expected=${expected}`
    );

  const payload = {
    ids: items.map((i) => i.id),
    embeddings: items.map((i) => i.embedding),
    metadatas: items.map((i) => normalizeMetadata(i.metadata)),
    documents: items.map((i) => i.document ?? ''),
  };

  const res = await axios.post(
    `${CHROMA_ENDPOINT}/collections/${COLLECTION}/upsert`,
    payload
  );
  return res.data;
}

export async function querySimilar(embedding: number[], topK = 5) {
  const payload = {
    query_embeddings: [embedding],
    n_results: topK,
  };
  const url = `${CHROMA_ENDPOINT}/collections/${COLLECTION}/query`;
  const res = await axios.post(url, payload);
  return res.data;
}

const res = await querySimilar([0.1, 0.2, 0.3]);
console.log(res);
