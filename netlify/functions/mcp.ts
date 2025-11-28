import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { toFetchResponse, toReqRes } from "fetch-to-node";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { JSONRPCError } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

// Configuration
const API_BASE_URL = process.env.URL || "https://vibecodingwiki.com";

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
] as const;

const CATEGORIES = [
  "Games",
  "Tech",
  "Health",
  "Travel",
  "Habits",
  "Productivity",
  "Others",
] as const;

function getServer(): McpServer {
  const server = new McpServer(
    { name: "vibecodingwiki-mcp", version: "1.0.0" },
    { capabilities: { logging: {} } }
  );

  // Tool: submit_app
  server.tool(
    "submit_app",
    "Submit a new app to VibeCoding Wiki. The app will be reviewed before being published.",
    {
      name: z.string().describe("The name of your app"),
      description: z.string().describe("A description of what your app does"),
      category: z.enum(CATEGORIES).describe(`The app category`),
      categoryOther: z.string().optional().describe('If category is "Others", specify the custom category here'),
      builtIn: z.enum(BUILD_TOOLS).describe(`The tool used to build the app`),
      builtInOther: z.string().optional().describe('If builtIn is "Others", specify the custom tool name here'),
    },
    async ({ name, description, category, categoryOther, builtIn, builtInOther }) => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/apps/submit-public`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
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
            content: [{ type: "text" as const, text: `Failed to submit app: ${result.message}` }],
            isError: true,
          };
        }

        return {
          content: [{
            type: "text" as const,
            text: `App "${name}" submitted successfully!\n\nApp ID: ${result.appId}\n\nYour app will be reviewed by moderators before being published on VibeCoding Wiki.\n\nView all apps at: ${API_BASE_URL}/vibecoded-apps`,
          }],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: "text" as const, text: `Error submitting app: ${message}` }],
          isError: true,
        };
      }
    }
  );

  // Tool: list_apps
  server.tool(
    "list_apps",
    "List apps from VibeCoding Wiki, optionally filtered by tool or category",
    {
      builtIn: z.enum(BUILD_TOOLS).optional().describe("Filter by tool"),
      category: z.enum(CATEGORIES).optional().describe("Filter by category"),
      limit: z.number().optional().default(20).describe("Maximum number of apps to return (default: 20, max: 100)"),
    },
    async ({ builtIn, category, limit = 20 }) => {
      try {
        const params = new URLSearchParams();
        if (builtIn) params.append("builtIn", builtIn);
        if (category) params.append("category", category);
        params.append("limit", String(Math.min(limit, 100)));

        const response = await fetch(`${API_BASE_URL}/api/apps/list?${params.toString()}`);
        const result = await response.json();

        if (!result.success) {
          return {
            content: [{ type: "text" as const, text: `Failed to fetch apps: ${result.message}` }],
            isError: true,
          };
        }

        const apps = result.apps || [];
        if (apps.length === 0) {
          let filterMsg = "";
          if (builtIn) filterMsg += ` built with ${builtIn}`;
          if (category) filterMsg += ` in category ${category}`;
          return {
            content: [{
              type: "text" as const,
              text: `No apps found${filterMsg}.\n\nBe the first to submit an app! Use the submit_app tool to add your app to VibeCoding Wiki.`,
            }],
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
          content: [{
            type: "text" as const,
            text: `${headerMsg}:\n\n${appList}\n\nView all apps at: ${API_BASE_URL}/vibecoded-apps`,
          }],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: "text" as const, text: `Error fetching apps: ${message}` }],
          isError: true,
        };
      }
    }
  );

  // Tool: list_tools
  server.tool(
    "list_tools",
    "List all available vibecoding tools supported by VibeCoding Wiki",
    {},
    async () => {
      return {
        content: [{
          type: "text" as const,
          text: `VibeCoding Wiki supports the following vibecoding tools:\n\n${BUILD_TOOLS.map((tool, i) => `${i + 1}. ${tool}`).join("\n")}\n\nUse these tool names when submitting apps or filtering app lists.`,
        }],
      };
    }
  );

  // Tool: list_categories
  server.tool(
    "list_categories",
    "List all app categories supported by VibeCoding Wiki",
    {},
    async () => {
      return {
        content: [{
          type: "text" as const,
          text: `VibeCoding Wiki supports the following app categories:\n\n${CATEGORIES.map((cat, i) => `${i + 1}. ${cat}`).join("\n")}\n\nUse these category names when submitting apps or filtering app lists.`,
        }],
      };
    }
  );

  // Resource: MCP usage guide
  server.resource(
    "mcp-usage-guide",
    "vibecodingwiki://mcp-usage-guide",
    { mimeType: "text/plain" },
    async () => {
      return {
        contents: [{
          uri: "vibecodingwiki://mcp-usage-guide",
          text: `# VibeCodingWiki MCP Usage Guide

## Available Tools

1. **submit_app** - Submit your vibecoded app to the wiki
   - Required: name, description, category, builtIn (tool)
   - Optional: categoryOther, builtInOther (for custom values)

2. **list_apps** - Browse apps on the wiki
   - Optional filters: builtIn, category, limit

3. **list_tools** - See all supported vibecoding tools

4. **list_categories** - See all app categories

## Example Usage

"Submit my app TaskMaster to VibeCoding Wiki. It's a productivity app built with Bolt that helps manage daily tasks."

"Show me all apps built with Lovable"

"What categories can I use when submitting an app?"

## Links

- Website: ${API_BASE_URL}
- Apps Gallery: ${API_BASE_URL}/vibecoded-apps
- Submit App: ${API_BASE_URL}/submit-app
`,
        }],
      };
    }
  );

  return server;
}

export default async (req: Request) => {
  try {
    if (req.method === "POST") {
      const { req: nodeReq, res: nodeRes } = toReqRes(req);
      const server = getServer();
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
      });

      await server.connect(transport);
      const body = await req.json();
      await transport.handleRequest(nodeReq, nodeRes, body);

      nodeRes.on("close", () => {
        transport.close();
        server.close();
      });

      return toFetchResponse(nodeRes);
    }

    // Handle GET request with info about the MCP
    if (req.method === "GET") {
      return new Response(
        JSON.stringify({
          name: "vibecodingwiki-mcp",
          version: "1.0.0",
          description: "MCP server for submitting and browsing apps on VibeCoding Wiki",
          tools: ["submit_app", "list_apps", "list_tools", "list_categories"],
          documentation: `${API_BASE_URL}/vibecoded-apps`,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response("Method not allowed", { status: 405 });
  } catch (error) {
    console.error("MCP error:", error);
    return new Response(
      JSON.stringify({
        jsonrpc: "2.0",
        error: { code: -32603, message: "Internal server error" },
        id: "",
      } satisfies JSONRPCError),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

export const config = { path: "/mcp" };
