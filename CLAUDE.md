# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Code style

Use comments sparingly — only for genuinely complex logic that isn't obvious from the code itself.

## Commands

```bash
npm run setup          # First-time setup: install deps, generate Prisma client, run migrations
npm run dev            # Start dev server with Turbopack at http://localhost:3000
npm run build          # Production build
npm run lint           # ESLint
npm test               # Run all tests with Vitest
npx vitest run src/components/chat/__tests__/ChatInterface.test.tsx  # Run a single test file
npm run db:reset       # Drop and re-run all migrations (destructive)
```

**Important:** Do not run `npm audit fix` — dependencies are pinned to specific compatible versions.

## Environment

- Copy `.env.example` to `.env` and set `ANTHROPIC_API_KEY`. If missing or left as `your-api-key-here`, the app uses a `MockLanguageModel` that returns canned components without calling Claude.
- `JWT_SECRET` defaults to `"development-secret-key"` if unset; set it in production.

## Architecture

### AI generation pipeline

`POST /api/chat` (`src/app/api/chat/route.ts`) is the core endpoint. It:
1. Reconstructs a `VirtualFileSystem` from serialized `FileNode` data sent by the client
2. Calls `getLanguageModel()` — real Claude (`claude-haiku-4-5`) or `MockLanguageModel`
3. Streams tool calls back to the client using Vercel AI SDK `streamText`
4. Two tools are available to Claude: `str_replace_editor` (view/create/str_replace/insert on files) and `file_manager` (delete/rename/move)
5. On finish, saves messages + file snapshot to Prisma `Project` if user is authenticated

### Virtual file system

`VirtualFileSystem` (`src/lib/file-system.ts`) is an in-memory tree of `FileNode`s. It never writes to disk. The client serializes it to a plain `Record<string, FileNode>` before each API call, and the server deserializes it, mutates it via tools, then the client reads mutations back via tool call results in the stream.

`FileSystemContext` (`src/lib/contexts/file-system-context.tsx`) holds the client-side `VirtualFileSystem` instance and exposes `handleToolCall` — the bridge that applies server tool calls to the client VFS.

### Preview rendering

`PreviewFrame` (`src/components/preview/PreviewFrame.tsx`) renders generated components in an `<iframe>` using native ES module import maps. The flow:
1. `createImportMap()` (`src/lib/transform/jsx-transformer.ts`) transforms all `.jsx/.tsx` files via `@babel/standalone` into blob URLs
2. Third-party imports are mapped to `https://esm.sh/<package>`
3. Missing local imports get placeholder stub modules so the preview doesn't crash
4. CSS files are injected as `<style>` blocks
5. The iframe loads the entry point (`/App.jsx` or similar) via `import()` inside a `<script type="module">`

### Auth

JWT-based, cookie-stored (`auth-token`). `src/lib/auth.ts` is `server-only`. Sessions last 7 days. Users can interact anonymously; anonymous work is tracked in `src/lib/anon-work-tracker.ts` and can be saved after sign-up.

### Data persistence

Prisma + SQLite. The canonical schema is `prisma/schema.prisma` — refer to it whenever you need to understand the structure of data stored in the database. `Project` rows store `messages` (JSON string) and `data` (serialized VFS JSON string). Anonymous users have no `userId`. Migrations live in `prisma/migrations/`.

### Context providers

Two client contexts wrap the app:
- `FileSystemContext` — VFS state + tool call handler
- `ChatContext` — wraps Vercel AI SDK `useChat`, wires `onToolCall` to `FileSystemContext.handleToolCall`, passes serialized VFS in each request body

### Key paths

| Path | Purpose |
|------|---------|
| `src/app/api/chat/route.ts` | Streaming chat endpoint |
| `src/lib/file-system.ts` | VirtualFileSystem class |
| `src/lib/transform/jsx-transformer.ts` | Babel transform + import map builder |
| `src/lib/provider.ts` | Real vs mock language model selection |
| `src/lib/prompts/generation.tsx` | System prompt sent to Claude |
| `src/lib/tools/` | `str_replace_editor` and `file_manager` tool builders |
| `src/components/preview/PreviewFrame.tsx` | iframe preview |
| `src/components/chat/ChatInterface.tsx` | Main chat UI |
| `src/components/editor/` | Monaco code editor + file tree |
| `src/lib/contexts/` | React contexts for VFS and chat state |
| `src/actions/` | Next.js Server Actions for project CRUD |
