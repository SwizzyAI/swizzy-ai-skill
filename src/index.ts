import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { createWebService } from "@swizzyweb/swizzy-web-service-cli/commands/create-web-service";
import { createRouter } from "@swizzyweb/swizzy-web-service-cli/commands/create-router";
import { createController } from "@swizzyweb/swizzy-web-service-cli/commands/create-controller";
import { createMiddleware } from "@swizzyweb/swizzy-web-service-cli/commands/create-middleware";
import { buildService } from "@swizzyweb/swizzy-web-service-cli/commands/build-service";
import { deleteController } from "@swizzyweb/swizzy-web-service-cli/commands/delete-controller";
import { deleteRouter } from "@swizzyweb/swizzy-web-service-cli/commands/delete-router";
import { renameController } from "@swizzyweb/swizzy-web-service-cli/commands/rename-controller";
import { renameRouter } from "@swizzyweb/swizzy-web-service-cli/commands/rename-router";
import { runService } from "@swizzyweb/swizzy-web-service-cli/commands/run-service";
import { startDevServer } from "@swizzyweb/swizzy-web-service-cli/commands/dev-server";

const server = new Server(
  {
    name: "swizzy-ai-tool",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "create_web_service",
      description: "Create a new Swizzy Web Service project",
      inputSchema: {
        type: "object",
        properties: {
          name: { type: "string", description: "Project name (PascalCase)" },
          type: { type: "string", enum: ["backend", "frontend"], default: "backend" },
          scope: { type: "string", description: "NPM scope" },
          install: { type: "boolean", description: "Run npm install", default: false },
        },
        required: ["name"],
      },
    },
    {
      name: "create_router",
      description: "Add a new Swizzy Router to the current project",
      inputSchema: {
        type: "object",
        properties: {
          name: { type: "string", description: "Router name (PascalCase)" },
          path: { type: "string", description: "URL path segment" },
          standardMiddleware: { type: "boolean", default: true },
        },
        required: ["name", "path"],
      },
    },
    {
      name: "create_controller",
      description: "Add a new Swizzy Controller to the current project",
      inputSchema: {
        type: "object",
        properties: {
          name: { type: "string", description: "Controller name (PascalCase)" },
          action: { type: "string", description: "Action name/URL segment" },
          method: { type: "string", enum: ["get", "post", "put", "delete", "patch"], default: "get" },
          router: { type: "string", description: "Parent router name" },
          body: { type: "boolean", default: false },
          query: { type: "boolean", default: false },
        },
        required: ["name", "action", "router"],
      },
    },
    {
      name: "create_middleware",
      description: "Add a new Swizzy Middleware to the current project",
      inputSchema: {
        type: "object",
        properties: {
          name: { type: "string", description: "Middleware name (PascalCase)" },
          router: { type: "string", description: "Parent router name" },
          controller: { type: "string", description: "Optional parent controller name" },
        },
        required: ["name", "router"],
      },
    },
    {
      name: "build_service",
      description: "Build the current Swizzy Web Service",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
    {
      name: "delete_controller",
      description: "Delete a controller from the project",
      inputSchema: {
        type: "object",
        properties: {
          name: { type: "string", description: "Controller name (PascalCase)" },
          router: { type: "string", description: "Parent router name" },
        },
        required: ["name", "router"],
      },
    },
    {
      name: "delete_router",
      description: "Delete a router from the project",
      inputSchema: {
        type: "object",
        properties: {
          name: { type: "string", description: "Router name (PascalCase)" },
        },
        required: ["name"],
      },
    },
    {
      name: "rename_controller",
      description: "Rename a controller in the project",
      inputSchema: {
        type: "object",
        properties: {
          oldName: { type: "string", description: "Current controller name" },
          newName: { type: "string", description: "New controller name" },
          router: { type: "string", description: "Parent router name" },
        },
        required: ["oldName", "newName", "router"],
      },
    },
    {
      name: "rename_router",
      description: "Rename a router in the project",
      inputSchema: {
        type: "object",
        properties: {
          oldName: { type: "string", description: "Current router name" },
          newName: { type: "string", description: "New router name" },
        },
        required: ["oldName", "newName"],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "create_web_service": {
        const result = await createWebService({
          name: args?.name as string,
          type: (args?.type as "backend" | "frontend") ?? "backend",
          scope: args?.scope as string,
          install: args?.install as boolean,
        });
        return {
          content: [{ type: "text", text: `Successfully created project: ${result.packageName} at ${result.projectDir}` }],
        };
      }
      case "create_router": {
        const result = await createRouter({
          name: args?.name as string,
          routerPath: args?.path as string,
          includeStandardMiddleware: args?.standardMiddleware as boolean ?? true,
        });
        return {
          content: [{ type: "text", text: `Successfully created router: ${result.routerFilePath}. Patched: ${result.patchedFiles.join(", ")}` }],
        };
      }
      case "create_controller": {
        const result = await createController({
          name: args?.name as string,
          action: args?.action as string,
          method: (args?.method ?? "get") as any,
          routerName: args?.router as string,
          hasBody: args?.body as boolean,
          hasQuery: args?.query as boolean,
        });
        return {
          content: [{ type: "text", text: `Successfully created controller: ${result.controllerFilePath}. Test: ${result.testFilePath}. Patched: ${result.patchedFiles.join(", ")}` }],
        };
      }
      case "create_middleware": {
        const result = await createMiddleware({
          name: args?.name as string,
          routerName: args?.router as string,
          controllerName: args?.controller as string,
        });
        return {
          content: [{ type: "text", text: `Successfully created middleware: ${result.middlewareFilePath}. Patched: ${result.patchedFiles.join(", ")}` }],
        };
      }
      case "build_service": {
        await buildService({});
        return {
          content: [{ type: "text", text: "Successfully built the service." }],
        };
      }
      case "delete_controller": {
        await deleteController({
          name: args?.name as string,
          routerName: args?.router as string,
        });
        return {
          content: [{ type: "text", text: `Successfully deleted controller ${args?.name} from router ${args?.router}` }],
        };
      }
      case "delete_router": {
        await deleteRouter({
          name: args?.name as string,
        });
        return {
          content: [{ type: "text", text: `Successfully deleted router ${args?.name}` }],
        };
      }
      case "rename_controller": {
        await renameController({
          oldName: args?.oldName as string,
          newName: args?.newName as string,
          routerName: args?.router as string,
        });
        return {
          content: [{ type: "text", text: `Successfully renamed controller ${args?.oldName} to ${args?.newName} in router ${args?.router}` }],
        };
      }
      case "rename_router": {
        await renameRouter({
          oldName: args?.oldName as string,
          newName: args?.newName as string,
        });
        return {
          content: [{ type: "text", text: `Successfully renamed router ${args?.oldName} to ${args?.newName}` }],
        };
      }
      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }
  } catch (error: any) {
    return {
      content: [{ type: "text", text: `Error: ${error.message}` }],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Swizzy AI Tool MCP server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
