# MCP Server for skills.sh

MCP (Model Context Protocol) server for searching and managing AI agent skills from [skills.sh](https://skills.sh/).

## Features

- 🔍 **Search Skills**: Search for skills by query term
- 📊 **Popular Skills**: Get top popular skills from leaderboard
- 📝 **Skill Details**: Get information about specific skills
- 💻 **Install Commands**: Generate install commands for skills

## Installation

1. Build the server:
```bash
cd mcp-skills-sh
npm install
npm run build
```

2. The server is automatically configured in `.cursor/mcp.json`

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

## Configuration

The server is configured in `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "skills-sh": {
      "command": "node",
      "args": ["${workspaceFolder}/mcp-skills-sh/dist/index.js"]
    }
  }
}
```
