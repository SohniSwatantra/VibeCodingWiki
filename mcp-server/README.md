# VibeCodingWiki MCP Server

A **remote** Model Context Protocol (MCP) server hosted on Netlify that allows AI coding tools to submit and browse apps on VibeCoding Wiki.

## Features

- **Submit apps** directly from your AI coding tool (Bolt, Lovable, Replit, Claude, etc.)
- **Browse apps** by tool or category
- **List supported tools** and categories
- **Hosted remotely** - no local installation needed!

## Quick Start

Add to your AI tool's MCP configuration:

### Claude Desktop / Claude Code

```json
{
  "mcpServers": {
    "vibecodingwiki": {
      "command": "npx",
      "args": ["mcp-remote@next", "https://vibecodingwiki.com/mcp"]
    }
  }
}
```

### Other AI Tools

Use the MCP endpoint directly:
```
https://vibecodingwiki.com/mcp
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

**Example prompt:**
```
Submit my app "TaskMaster" to VibeCoding Wiki. It's a productivity app for managing daily tasks, built with Bolt.
```

### list_apps

List apps from VibeCoding Wiki.

**Parameters:**
- `builtIn` (optional): Filter by tool
- `category` (optional): Filter by category
- `limit` (optional): Max results (default: 20, max: 100)

**Example prompt:**
```
Show me apps built with Lovable
```

### list_tools

List all supported vibecoding tools.

**Example prompt:**
```
What vibecoding tools are supported?
```

### list_categories

List all app categories.

**Example prompt:**
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

## API Endpoint

The MCP server is hosted at:
```
https://vibecodingwiki.com/mcp
```

### Testing with MCP Inspector

```bash
npx @modelcontextprotocol/inspector npx mcp-remote@next https://vibecodingwiki.com/mcp
```

Then open http://localhost:6274/ to test the tools.

## Links

- [VibeCoding Wiki](https://vibecodingwiki.com)
- [Vibecoded Apps Gallery](https://vibecodingwiki.com/vibecoded-apps)
- [Submit an App (Web)](https://vibecodingwiki.com/submit-app)

## License

MIT
