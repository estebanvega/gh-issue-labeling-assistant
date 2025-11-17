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

## Usage
```bash
node src/cli.ts --repo seb-oss/green --limit 8
```
