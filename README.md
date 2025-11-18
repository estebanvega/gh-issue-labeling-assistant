# GitHub Issue Labeling Assistant

## Requirements
- Node 24+
- OpenAI API key
- Optional: GitHub token (to apply labels)
- Local ChromaDB server (Docker) or hosted Chroma endpoint

## Setup DB
```bash
docker run -v ./chroma-data:/data -p 8000:8000 chromadb/chroma
```

```bash
curl -X POST "http://localhost:8000/api/v2/tenants/local/databases" \
  -H "Content-Type: application/json" \
  -d '{"name":"default"}'
```

```bash
curl -X POST "http://localhost:8000/api/v2/tenants/local/databases/default/collections" \
  -H "Content-Type: application/json" \
  -d '{"name":"issue-labels-3072","dimension":3072}'
```

## Setup CLI
```bash
cp .env.example .env # edit .env with your keys
npm install
```

## Usage example
```bash
node src/cli.ts build-index --owner seb-oss --repo green --limit 50
```

```bash
node src/cli.ts suggest --owner seb-oss --repo green --issue 2521 --topk 8
```