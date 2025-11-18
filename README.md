# GitHub Issue Labeling Assistant
---

## Features
- **Index issues** from any public GitHub repo
- **Query similar issues** using ChromaDB vector search
- **Suggest labels** for new issues using OpenAI LLM, constrained to repo labels
- **CLI commands** for all major actions (index, suggest, create collection)

---

## Requirements
- Node.js 24+
- OpenAI API key
- GitHub token (for fetching issues/labels)
- Local ChromaDB server (Docker) or hosted Chroma endpoint

---

## Setup

### 1. Start ChromaDB (local)
```bash
docker run -v $(pwd)/chroma-data:/data -p 8000:8000 chromadb/chroma
```

### 2. Create database and collection
```bash
# Create database
curl -X POST "http://localhost:8000/api/v2/tenants/local/databases" \
  -H "Content-Type: application/json" \
  -d '{"name":"default"}'

# Create collection (use your embedding dimension)
curl -X POST "http://localhost:8000/api/v2/tenants/local/databases/default/collections" \
  -H "Content-Type: application/json" \
  -d '{"name":"issue-labels-3072","dimension":3072}'
```

### 3. Configure CLI
```bash
cp .env.example .env # edit .env with your keys
npm install
```

---

## CLI Usage

### Build index from GitHub issues
```bash
node src/cli.ts build-index --owner <repo-owner> --repo <repo-name> --limit <N>
# Example:
node src/cli.ts build-index --owner seb-oss --repo green --limit 50
```

### Suggest labels for a specific issue
```bash
node src/cli.ts suggest --owner <repo-owner> --repo <repo-name> --issue <issue-number> --topk <K>
# Example:
node src/cli.ts suggest --owner seb-oss --repo green --issue 2521 --topk 8
```

---

## Notes
- Do **not** commit `chroma-data/` to source control (add to `.gitignore`).
- You can re-index or re-create collections as needed for different repos or embedding models.
- For best results, use a large issue limit and a matching embedding dimension.