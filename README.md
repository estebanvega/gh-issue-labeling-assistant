# GitHub Issue Labeling Assistant

## Requirements
- Node 24+
- OpenAI API key
- Optional: GitHub token (to apply labels)
- Local ChromaDB server (Docker) or hosted Chroma endpoint

## Run Chroma locally
docker run -p 8000:8000 ghcr.io/chroma-core/chroma:latest

## Setup

```bash
cp .env.example .env # edit .env with your keys
npm install
```

## Usage example
```bash
node src/cli.ts build-index --owner seb-oss --repo green --limit 8
```

```bash
node src/cli.ts suggest --owner seb-oss --repo green --issue 2521 --topk 3
```