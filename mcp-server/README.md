# VibeCodingWiki MCP Server

A Model Context Protocol (MCP) server that allows AI coding tools to submit and browse apps on VibeCoding Wiki.

## Features

- **Submit apps** directly from your AI coding tool (Bolt, Lovable, Replit, etc.)
- **Browse apps** by tool or category
- **List supported tools** and categories

## Installation

### Using npx (recommended)

Add to your AI tool's MCP configuration:

```json
{
  "mcpServers": {
    "vibecodingwiki": {
      "command": "npx",
      "args": ["-y", "@vibecodingwiki/mcp"]
    }
  }
}
```

### Local installation

1. Clone and build:
```bash
cd mcp-server
npm install
npm run build
```

2. Add to your MCP config:
```json
{
  "mcpServers": {
    "vibecodingwiki": {
      "command": "node",
      "args": ["/path/to/mcp-server/dist/index.js"]
    }
  }
}
```

## Available Tools

### submit_app

Submit a new app to VibeCoding Wiki.

**Parameters:**
- `name` (required): The name of your app
- `description` (required): A description of what your app does
- `category` (required): App category (Games, Tech, Health, Travel, Habits, Productivity, Others)
- `categoryOther`: Custom category if "Others" is selected
- `builtIn` (required): The tool used (Lovable, Bolt, V0, Replit, Cursor, CoPilot, VScode, Claude Code, etc.)
- `builtInOther`: Custom tool name if "Others" is selected

**Example:**
```
Submit my app "TaskMaster" to VibeCoding Wiki. It's a productivity app for managing daily tasks, built with Bolt.
```

### list_apps

List apps from VibeCoding Wiki.

**Parameters:**
- `builtIn` (optional): Filter by tool
- `category` (optional): Filter by category
- `limit` (optional): Max results (default: 20, max: 100)

**Example:**
```
Show me apps built with Lovable
```

### list_tools

List all supported vibecoding tools.

**Example:**
```
What vibecoding tools are supported?
```

### list_categories

List all app categories.

**Example:**
```
What categories can I use when submitting an app?
```

## Supported Tools

- Lovable
- Bolt
- V0
- Replit
- Cursor
- CoPilot
- VScode
- Claude Code
- Vibe Code APP
- Vibingbase
- Base44
- Gemini AI Studio
- Others (specify custom tool)

## Supported Categories

- Games
- Tech
- Health
- Travel
- Habits
- Productivity
- Others (specify custom category)

## Configuration

Set the `VIBECODINGWIKI_API_URL` environment variable to use a custom API endpoint:

```json
{
  "mcpServers": {
    "vibecodingwiki": {
      "command": "npx",
      "args": ["-y", "@vibecodingwiki/mcp"],
      "env": {
        "VIBECODINGWIKI_API_URL": "https://your-custom-domain.com"
      }
    }
  }
}
```

## Links

- [VibeCoding Wiki](https://vibecodingwiki.com)
- [Vibecoded Apps Gallery](https://vibecodingwiki.com/vibecoded-apps)
- [Submit an App](https://vibecodingwiki.com/submit-app)

## License

MIT
