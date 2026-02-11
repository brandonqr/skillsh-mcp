# MCP Server for skills.sh

MCP (Model Context Protocol) server for searching and managing AI agent skills from [skills.sh](https://skills.sh/).

## Features

- 🔍 **Search Skills**: Search for skills by query term
- 📊 **Popular Skills**: Get top popular skills from leaderboard
- 📝 **Skill Details**: Get information about specific skills
- 💻 **Install Commands**: Generate install commands for skills

## Installation

### 1. Build the server

```bash
cd skillsh-mcp
npm install
npm run build
```

### 2. Configure your client

#### For Claude Code

**Option A: Using `claude mcp add` (recommended)**

```bash
claude mcp add skills-sh --scope user -- node /absolute/path/to/skillsh-mcp/dist/index.js
```

Scopes available:
- `--scope local` (default) — Available only to you in the current project
- `--scope project` — Shared via `.mcp.json` in the project root (committed to git)
- `--scope user` — Available globally across all your projects

**Option B: Using `.mcp.json` file**

Create or edit `.mcp.json` in your project root:

```json
{
  "mcpServers": {
    "skills-sh": {
      "command": "node",
      "args": ["/absolute/path/to/skillsh-mcp/dist/index.js"],
      "env": {}
    }
  }
}
```

**Option C: Using `claude mcp add-json`**

```bash
claude mcp add-json skills-sh '{"command":"node","args":["/absolute/path/to/skillsh-mcp/dist/index.js"]}'
```

#### For Cursor

Add to `.cursor/mcp.json` in your workspace:

```json
{
  "mcpServers": {
    "skills-sh": {
      "command": "node",
      "args": ["${workspaceFolder}/skillsh-mcp/dist/index.js"]
    }
  }
}
```

Then restart Cursor.

## Usage

The server provides the following tools:

### `search_skills`
Search for skills on skills.sh
- **query** (required): Search term (e.g., "mapbox", "react", "gis")
- **limit** (optional): Maximum number of results (default: 50)

### `get_popular_skills`
Get popular skills from the leaderboard
- **limit** (optional): Number of results (default: 20)
- **timeframe** (optional): "all", "trending", or "hot" (default: "all")

### `get_skill_details`
Get detailed information about a specific skill
- **owner** (required): GitHub owner/username
- **repo** (required): Repository name
- **skillId** (required): Skill ID

### `get_install_command`
Get the npx install command for a skill
- **owner** (required): GitHub owner/username
- **repo** (required): Repository name

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run in development mode
npm run dev
```

## Compatibility

| Client | Transport | Status |
|---|---|---|
| Claude Code | stdio | ✅ Supported |
| Cursor | stdio | ✅ Supported |
| Claude Desktop | stdio | ✅ Supported |
