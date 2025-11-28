#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// Configuration
const API_BASE_URL = process.env.VIBECODINGWIKI_API_URL || "https://vibecodingwiki.com";

// Tool definitions
const BUILD_TOOLS = [
  "Lovable",
  "Bolt",
  "V0",
  "Replit",
  "Cursor",
  "CoPilot",
  "VScode",
  "Claude Code",
  "Vibe Code APP",
  "Vibingbase",
  "Base44",
  "Gemini AI Studio",
  "Others",
];

const CATEGORIES = [
  "Games",
  "Tech",
  "Health",
  "Travel",
  "Habits",
  "Productivity",
  "Others",
];

// Create server instance
const server = new Server(
  {
    name: "vibecodingwiki-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "submit_app",
        description:
          "Submit a new app to VibeCoding Wiki. The app will be reviewed before being published.",
        inputSchema: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "The name of your app",
            },
            description: {
              type: "string",
              description: "A description of what your app does",
            },
            category: {
              type: "string",
              description: `The app category. Must be one of: ${CATEGORIES.join(", ")}`,
              enum: CATEGORIES,
            },
            categoryOther: {
              type: "string",
              description:
                'If category is "Others", specify the custom category here',
            },
            builtIn: {
              type: "string",
              description: `The tool used to build the app. Must be one of: ${BUILD_TOOLS.join(", ")}`,
              enum: BUILD_TOOLS,
            },
            builtInOther: {
              type: "string",
              description:
                'If builtIn is "Others", specify the custom tool name here',
            },
          },
          required: ["name", "description", "category", "builtIn"],
        },
      },
      {
        name: "list_apps",
        description:
          "List apps from VibeCoding Wiki, optionally filtered by tool or category",
        inputSchema: {
          type: "object",
          properties: {
            builtIn: {
              type: "string",
              description: `Filter by tool. Must be one of: ${BUILD_TOOLS.join(", ")}`,
              enum: BUILD_TOOLS,
            },
            category: {
              type: "string",
              description: `Filter by category. Must be one of: ${CATEGORIES.join(", ")}`,
              enum: CATEGORIES,
            },
            limit: {
              type: "number",
              description: "Maximum number of apps to return (default: 20, max: 100)",
            },
          },
        },
      },
      {
        name: "list_tools",
        description: "List all available vibecoding tools supported by VibeCoding Wiki",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "list_categories",
        description: "List all app categories supported by VibeCoding Wiki",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "submit_app": {
        const { name: appName, description, category, categoryOther, builtIn, builtInOther } =
          args as {
            name: string;
            description: string;
            category: string;
            categoryOther?: string;
            builtIn: string;
            builtInOther?: string;
          };

        const response = await fetch(`${API_BASE_URL}/api/apps/submit-public`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: appName,
            description,
            category,
            categoryOther,
            builtIn,
            builtInOther,
          }),
        });

        const result = await response.json();

        if (!result.success) {
          return {
            content: [
              {
                type: "text",
                text: `Failed to submit app: ${result.message}`,
              },
            ],
            isError: true,
          };
        }

        return {
          content: [
            {
              type: "text",
              text: `App "${appName}" submitted successfully!\n\nApp ID: ${result.appId}\n\nYour app will be reviewed by moderators before being published on VibeCoding Wiki.\n\nView all apps at: ${API_BASE_URL}/vibecoded-apps`,
            },
          ],
        };
      }

      case "list_apps": {
        const { builtIn, category, limit = 20 } = args as {
          builtIn?: string;
          category?: string;
          limit?: number;
        };

        const params = new URLSearchParams();
        if (builtIn) params.append("builtIn", builtIn);
        if (category) params.append("category", category);
        params.append("limit", String(Math.min(limit, 100)));

        const response = await fetch(
          `${API_BASE_URL}/api/apps/list?${params.toString()}`
        );
        const result = await response.json();

        if (!result.success) {
          return {
            content: [
              {
                type: "text",
                text: `Failed to fetch apps: ${result.message}`,
              },
            ],
            isError: true,
          };
        }

        const apps = result.apps || [];
        if (apps.length === 0) {
          let filterMsg = "";
          if (builtIn) filterMsg += ` built with ${builtIn}`;
          if (category) filterMsg += ` in category ${category}`;
          return {
            content: [
              {
                type: "text",
                text: `No apps found${filterMsg}.\n\nBe the first to submit an app! Use the submit_app tool to add your app to VibeCoding Wiki.`,
              },
            ],
          };
        }

        const appList = apps
          .map(
            (app: any, index: number) =>
              `${index + 1}. **${app.name}**\n   Category: ${app.category === "Others" ? app.categoryOther : app.category}\n   Built with: ${app.builtIn === "Others" ? app.builtInOther : app.builtIn}\n   ${app.description}`
          )
          .join("\n\n");

        let headerMsg = `Found ${apps.length} app${apps.length !== 1 ? "s" : ""}`;
        if (builtIn) headerMsg += ` built with ${builtIn}`;
        if (category) headerMsg += ` in category ${category}`;

        return {
          content: [
            {
              type: "text",
              text: `${headerMsg}:\n\n${appList}\n\nView all apps at: ${API_BASE_URL}/vibecoded-apps`,
            },
          ],
        };
      }

      case "list_tools": {
        return {
          content: [
            {
              type: "text",
              text: `VibeCoding Wiki supports the following vibecoding tools:\n\n${BUILD_TOOLS.map((tool, i) => `${i + 1}. ${tool}`).join("\n")}\n\nUse these tool names when submitting apps or filtering app lists.`,
            },
          ],
        };
      }

      case "list_categories": {
        return {
          content: [
            {
              type: "text",
              text: `VibeCoding Wiki supports the following app categories:\n\n${CATEGORIES.map((cat, i) => `${i + 1}. ${cat}`).join("\n")}\n\nUse these category names when submitting apps or filtering app lists.`,
            },
          ],
        };
      }

      default:
        return {
          content: [
            {
              type: "text",
              text: `Unknown tool: ${name}`,
            },
          ],
          isError: true,
        };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: "text",
          text: `Error: ${message}`,
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("VibeCodingWiki MCP server running on stdio");
}

main().catch(console.error);
