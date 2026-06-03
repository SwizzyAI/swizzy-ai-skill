#!/usr/bin/env node
// Copyright 2024 Jason Gallagher
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { spawnSync } from "node:child_process";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { createWebService } from "@swizzyai/swizzy-web-service-cli/commands/create-web-service";
import { createRouter } from "@swizzyai/swizzy-web-service-cli/commands/create-router";
import { createController } from "@swizzyai/swizzy-web-service-cli/commands/create-controller";
import { createMiddleware } from "@swizzyai/swizzy-web-service-cli/commands/create-middleware";
import { deleteMiddleware } from "@swizzyai/swizzy-web-service-cli/commands/delete-middleware";
import { renameMiddleware } from "@swizzyai/swizzy-web-service-cli/commands/rename-middleware";
import { buildService } from "@swizzyai/swizzy-web-service-cli/commands/build-service";
import { deleteController } from "@swizzyai/swizzy-web-service-cli/commands/delete-controller";
import { deleteRouter } from "@swizzyai/swizzy-web-service-cli/commands/delete-router";
import { renameController } from "@swizzyai/swizzy-web-service-cli/commands/rename-controller";
import { renameRouter } from "@swizzyai/swizzy-web-service-cli/commands/rename-router";
import { runService } from "@swizzyai/swizzy-web-service-cli/commands/run-service";
import { startDevServer } from "@swizzyai/swizzy-web-service-cli/commands/dev-server";
import { stopService } from "@swizzyai/swizzy-web-service-cli/commands/stop-service";
import { generateTests } from "@swizzyai/swizzy-web-service-cli/commands/generate-tests";
import { generateSpec } from "@swizzyai/swizzy-web-service-cli/commands/generate-spec";
import { generateSkeleton } from "@swizzyai/swizzy-web-service-cli/commands/generate-skeleton";
import { generateConfig } from "@swizzyai/swizzy-web-service-cli/commands/generate-config";
import { upsertStack } from "@swizzyai/swizzy-web-service-cli/commands/upsert-stack";
import { removeFromStack } from "@swizzyai/swizzy-web-service-cli/commands/remove-from-stack";
import { listConfigs } from "@swizzyai/swizzy-web-service-cli/commands/list-configs";
import { readConfig } from "@swizzyai/swizzy-web-service-cli/commands/read-config";
import { addServiceArg } from "@swizzyai/swizzy-web-service-cli/commands/add-service-arg";
import { updateServiceArg } from "@swizzyai/swizzy-web-service-cli/commands/update-service-arg";
import { deleteServiceArg } from "@swizzyai/swizzy-web-service-cli/commands/delete-service-arg";
import { updateControllerParams } from "@swizzyai/swizzy-web-service-cli/commands/update-controller-params";
import { manageState } from "@swizzyai/swizzy-web-service-cli/commands/manage-state";
import { buildEndpoints, sendRequest } from "@swizzyai/swizzy-web-service-cli/commands/request-service";
import { detectProject } from "@swizzyai/swizzy-web-service-cli/scaffolding/project-detector";

const server = new Server(
  {
    name: "swizzy-ai-skill",
    version: "0.1.3",
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
      description: "Create a new Swizzy Web Service project. Use serviceArgs instead of env variables for configuration.",
      inputSchema: {
        type: "object",
        properties: {
          name: { type: "string", description: "Project name (PascalCase)" },
          cwd: { type: "string", description: "Absolute path to the directory where the project should be created (defaults to server CWD)" },
          type: { type: "string", enum: ["backend", "frontend"], default: "backend" },
          scope: { type: "string", description: "NPM scope" },
          install: { type: "boolean", description: "Run npm install", default: false },
          stateFields: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                type: { type: "string" },
              },
              required: ["name", "type"],
            },
          },
          serviceArgs: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                type: { type: "string" },
              },
              required: ["name", "type"],
            },
          },
        },
        required: ["name"],
      },
    },
    {
      name: "create_router",
      description: "Add a new Swizzy Router to the current project. Use serviceArgs for typed configuration parameters.",
      inputSchema: {
        type: "object",
        properties: {
          name: { type: "string", description: "Router name (PascalCase)" },
          path: { type: "string", description: "URL path segment" },
          cwd: { type: "string", description: "Absolute path to the project directory" },
          standardMiddleware: { type: "boolean", default: true },
          stateFields: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                type: { type: "string" },
              },
              required: ["name", "type"],
            },
          },
          serviceArgs: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                type: { type: "string" },
              },
              required: ["name", "type"],
            },
          },
        },
        required: ["name", "path"],
      },
    },
    {
      name: "create_controller",
      description: "Add a new Swizzy Controller to the current project. Use serviceArgs for external configuration and bodyFields/queryParams for request schema.",
      inputSchema: {
        type: "object",
        properties: {
          name: { type: "string", description: "Controller name (PascalCase)" },
          action: { type: "string", description: "Action name/URL segment" },
          cwd: { type: "string", description: "Absolute path to the project directory" },
          method: { type: "string", enum: ["get", "post", "put", "delete", "patch"], default: "get" },
          router: { type: "string", description: "Parent router name" },
          body: { type: "boolean", default: false },
          query: { type: "boolean", default: false },
          bodyFields: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                type: { type: "string" },
              },
              required: ["name", "type"],
            },
          },
          queryParams: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                type: { type: "string" },
              },
              required: ["name", "type"],
            },
          },
          stateFields: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                type: { type: "string" },
              },
              required: ["name", "type"],
            },
          },
          serviceArgs: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                type: { type: "string" },
              },
              required: ["name", "type"],
            },
          },
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
          cwd: { type: "string", description: "Absolute path to the project directory" },
          router: { type: "string", description: "Parent router name" },
          controller: { type: "string", description: "Optional parent controller name" },
        },
        required: ["name", "router"],
      },
    },
    {
      name: "delete_middleware",
      description: "Delete a middleware from the project",
      inputSchema: {
        type: "object",
        properties: {
          name: { type: "string", description: "Middleware name (PascalCase)" },
          cwd: { type: "string", description: "Absolute path to the project directory" },
          router: { type: "string", description: "Parent router name" },
          controller: { type: "string", description: "Optional parent controller name" },
        },
        required: ["name", "router"],
      },
    },
    {
      name: "rename_middleware",
      description: "Rename a middleware in the project",
      inputSchema: {
        type: "object",
        properties: {
          oldName: { type: "string", description: "Current middleware name" },
          cwd: { type: "string", description: "Absolute path to the project directory" },
          newName: { type: "string", description: "New middleware name" },
          router: { type: "string", description: "Parent router name" },
          controller: { type: "string", description: "Optional parent controller name" },
        },
        required: ["oldName", "newName", "router"],
      },
    },
    {
      name: "build_service",
      description: "Build the current Swizzy Web Service",
      inputSchema: {
        type: "object",
        properties: {
          cwd: { type: "string", description: "Absolute path to the project directory" },
        },
      },
    },
    {
      name: "get_project_structure",
      description: "Get the structure of the current Swizzy project, including routers, controllers, and middleware.",
      inputSchema: {
        type: "object",
        properties: {
          cwd: { type: "string", description: "Absolute path to the project directory" },
        },
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
          cwd: { type: "string", description: "Absolute path to the project directory" },
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
          cwd: { type: "string", description: "Absolute path to the project directory" },
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
          cwd: { type: "string", description: "Absolute path to the project directory" },
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
          cwd: { type: "string", description: "Absolute path to the project directory" },
          newName: { type: "string", description: "New router name" },
        },
        required: ["oldName", "newName"],
      },
    },
    {
      name: "run_service",
      description: "Start the Swizzy Web Service. Returns the process PID. The service runs in the background.",
      inputSchema: {
        type: "object",
        properties: {
          port: { type: "number", description: "Port to bind (defaults to service default)" },
          cwd: { type: "string", description: "Absolute path to the project directory" },
        },
      },
    },
    {
      name: "dev_service",
      description: "Start the Swizzy Web Service in dev mode with TypeScript watch and auto-restart. Returns the process PID.",
      inputSchema: {
        type: "object",
        properties: {
          port: { type: "number", description: "Port to bind (defaults to service default)" },
          cwd: { type: "string", description: "Absolute path to the project directory" },
        },
      },
    },
    {
      name: "generate_tests",
      description: "Generate test stubs for all routers and controllers in the current project.",
      inputSchema: {
        type: "object",
        properties: {
          cwd: { type: "string", description: "Absolute path to the project directory" },
        },
      },
    },
    {
      name: "generate_spec",
      description: "Export an OpenAPI 3.0 spec from the current project.",
      inputSchema: {
        type: "object",
        properties: {
          cwd: { type: "string", description: "Absolute path to the project directory" },
          output: { type: "string", description: "Output file path (default: openapi.yaml or openapi.json)" },
          basePath: { type: "string", description: "Override API base path" },
          serverUrl: { type: "string", description: "Embed server URL in spec" },
          version: { type: "string", description: "API version (default: 1.0.0)" },
          json: { type: "boolean", description: "Output JSON instead of YAML", default: false },
        },
      },
    },
    {
      name: "generate_skeleton",
      description: "Scaffold a new Swizzy project from an OpenAPI 3.0 spec file.",
      inputSchema: {
        type: "object",
        properties: {
          spec: { type: "string", description: "Path to OpenAPI 3.0 spec file (JSON or YAML)" },
          output: { type: "string", description: "Output directory (default: ./generated)" },
          name: { type: "string", description: "Service name override" },
          scope: { type: "string", description: "NPM scope" },
          basePath: { type: "string", description: "API base path (default: api)" },
        },
        required: ["spec"],
      },
    },
    {
      name: "generate_config",
      description: "Generate web-service-config.json for a single project (using its packageName).",
      inputSchema: {
        type: "object",
        properties: {
          cwd: { type: "string", description: "Absolute path to the project directory" },
          force: { type: "boolean", description: "Overwrite existing config files", default: false },
        },
      },
    },
    {
      name: "upsert_stack",
      description: "Create or update a stack configuration combining multiple services.",
      inputSchema: {
        type: "object",
        properties: {
          cwd: { type: "string", description: "Directory where the web-service-config.json should be created/updated" },
          services: {
            type: "array",
            items: {
              type: "object",
              properties: {
                className: { type: "string", description: "Service class name (optional for local paths, auto-detected)" },
                location: { type: "string", description: "Local path (e.g. ./backend) or NPM package (e.g. @swizzyweb/proxy)" },
                options: { type: "object", description: "Extra configuration options for this service" },
              },
              required: ["location"],
            },
            description: "List of services to include in the stack",
          },
        },
        required: ["services"],
      },
    },
    {
      name: "list_configs",
      description: "List all web-service-config*.json files in the workspace.",
      inputSchema: {
        type: "object",
        properties: {
          cwd: { type: "string", description: "Base directory to search from" },
        },
      },
    },
    {
      name: "read_config",
      description: "Read and parse a web-service-config.json file.",
      inputSchema: {
        type: "object",
        properties: {
          path: { type: "string", description: "Path to the config file" },
        },
        required: ["path"],
      },
    },
    {
      name: "remove_from_stack",
      description: "Delete a service definition from a stack configuration.",
      inputSchema: {
        type: "object",
        properties: {
          serviceName: { type: "string", description: "Name of the service class to remove" },
          cwd: { type: "string", description: "Directory containing the stack config" },
        },
        required: ["serviceName"],
      },
    },
    {
      name: "add_service_arg",
      description: "Add a typed service argument to app.ts and configuration files.",
      inputSchema: {
        type: "object",
        properties: {
          name: { type: "string", description: "Argument name (camelCase)" },
          type: { type: "string", description: "TypeScript type (string, number, boolean, etc.)" },
          default: { type: "string", description: "Default value for config files" },
          cwd: { type: "string", description: "Absolute path to the project directory" },
        },
        required: ["name", "type"],
      },
    },
    {
      name: "update_service_arg",
      description: "Update an existing service argument (type or default value).",
      inputSchema: {
        type: "object",
        properties: {
          name: { type: "string", description: "Argument name (camelCase)" },
          type: { type: "string", description: "New TypeScript type (optional)" },
          default: { type: "string", description: "New default value for config files (optional)" },
          cwd: { type: "string", description: "Absolute path to the project directory" },
        },
        required: ["name"],
      },
    },
    {
      name: "delete_service_arg",
      description: "Delete a service argument from app.ts and configuration files.",
      inputSchema: {
        type: "object",
        properties: {
          name: { type: "string", description: "Argument name to delete" },
          cwd: { type: "string", description: "Absolute path to the project directory" },
        },
        required: ["name"],
      },
    },
    {
      name: "update_controller_params",
      description: "Update request body or query parameters for an existing controller.",
      inputSchema: {
        type: "object",
        properties: {
          router: { type: "string", description: "Parent router name" },
          controller: { type: "string", description: "Controller name" },
          action: { type: "string", enum: ["upsert", "delete"], default: "upsert" },
          bodyFields: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                type: { type: "string" },
              },
              required: ["name", "type"],
            },
          },
          queryParams: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                type: { type: "string" },
              },
              required: ["name", "type"],
            },
          },
          cwd: { type: "string", description: "Absolute path to the project directory" },
        },
        required: ["router", "controller"],
      },
    },
    {
      name: "manage_state",
      description: "Manage state properties with automatic upward propagation (Controller -> Router -> WebService).",
      inputSchema: {
        type: "object",
        properties: {
          action: { type: "string", enum: ["add", "update", "delete"] },
          level: { type: "string", enum: ["controller", "router", "service"] },
          name: { type: "string", description: "Property name (camelCase)" },
          router: { type: "string", description: "Router name (required for controller/router level)" },
          controller: { type: "string", description: "Controller name (required for controller level)" },
          type: { type: "string", description: "TypeScript type (required for add/update)" },
          default: { type: "string", description: "Default value for initialization in app.ts" },
          cwd: { type: "string", description: "Absolute path to the project directory" },
        },
        required: ["action", "level", "name"],
      },
    },
    {
      name: "stop_service",
      description: "Stop a running Swizzy Web Service or dev server. Finds the process by port and/or kills the tsc --watch process by project directory.",
      inputSchema: {
        type: "object",
        properties: {
          port: { type: "number", description: "Port the service is running on" },
          cwd: { type: "string", description: "Absolute path to the project directory (required to stop a dev server's tsc --watch process)" },
        },
      },
    },
    {
      name: "request",
      description: "Send an HTTP request to a running Swizzy service. Omit endpoint to list available endpoints.",
      inputSchema: {
        type: "object",
        properties: {
          cwd: { type: "string", description: "Absolute path to the project directory" },
          baseUrl: { type: "string", description: "Base URL of the service (default: http://localhost:3000)" },
          endpoint: { type: "string", description: "Endpoint label (e.g. 'GET /api/users/list'). Omit to list all." },
          body: { type: "string", description: "JSON request body" },
          query: { type: "string", description: "JSON query params" },
        },
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const cwd = (args?.cwd as string | undefined) ?? process.cwd();

  try {
    switch (name) {
      case "create_web_service": {
        const result = await createWebService({
          name: args?.name as string,
          type: (args?.type as "backend" | "frontend") ?? "backend",
          scope: args?.scope as string,
          install: args?.install as boolean,
          stateFields: args?.stateFields as any,
          serviceArgs: args?.serviceArgs as any,
          cwd: cwd,
          stdio: ["ignore", "pipe", "inherit"],
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
          stateFields: args?.stateFields as any,
          serviceArgs: args?.serviceArgs as any,
          cwd: cwd,
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
          bodyFields: args?.bodyFields as any,
          queryParams: args?.queryParams as any,
          stateFields: args?.stateFields as any,
          serviceArgs: args?.serviceArgs as any,
          cwd: cwd,
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
          cwd: cwd,
        });
        return {
          content: [{ type: "text", text: `Successfully created middleware: ${result.middlewareFilePath}. Patched: ${result.patchedFiles.join(", ")}` }],
        };
      }
      case "delete_middleware": {
        await deleteMiddleware({
          name: args?.name as string,
          routerName: args?.router as string,
          controllerName: args?.controller as string,
          cwd,
        });
        return {
          content: [{ type: "text", text: `Successfully deleted middleware ${args?.name} from ${args?.controller ? `controller ${args?.controller}` : `router ${args?.router}`}` }],
        };
      }
      case "rename_middleware": {
        await renameMiddleware({
          oldName: args?.oldName as string,
          newName: args?.newName as string,
          routerName: args?.router as string,
          controllerName: args?.controller as string,
          cwd,
        });
        return {
          content: [{ type: "text", text: `Successfully renamed middleware ${args?.oldName} to ${args?.newName} in ${args?.controller ? `controller ${args?.controller}` : `router ${args?.router}`}` }],
        };
      }
      case "build_service": {
        const buildResult = spawnSync("npm", ["run", "build"], { cwd, stdio: ["ignore", "pipe", "pipe"] });
        const buildOutput = [buildResult.stdout?.toString(), buildResult.stderr?.toString()].filter(Boolean).join("\n").trim();
        if (buildResult.status !== 0) {
          throw new Error(`Build failed:\n${buildOutput}`);
        }
        return {
          content: [{ type: "text", text: buildOutput ? `Build output:\n${buildOutput}` : "Successfully built the service." }],
        };
      }
      case "get_project_structure": {
        const project = detectProject(cwd);
        return {
          content: [{ type: "text", text: JSON.stringify(project, null, 2) }],
        };
      }
      case "delete_controller": {
        await deleteController({
          name: args?.name as string,
          routerName: args?.router as string,
          cwd: cwd,
        });
        return {
          content: [{ type: "text", text: `Successfully deleted controller ${args?.name} from router ${args?.router}` }],
        };
      }
      case "delete_router": {
        await deleteRouter({
          name: args?.name as string,
          cwd: cwd,
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
          cwd: cwd,
        });
        return {
          content: [{ type: "text", text: `Successfully renamed controller ${args?.oldName} to ${args?.newName} in router ${args?.router}` }],
        };
      }
      case "rename_router": {
        await renameRouter({
          oldName: args?.oldName as string,
          newName: args?.newName as string,
          cwd: cwd,
        });
        return {
          content: [{ type: "text", text: `Successfully renamed router ${args?.oldName} to ${args?.newName}` }],
        };
      }
      case "stop_service": {
        const result = stopService({
          port: args?.port as number | undefined,
          cwd: args?.cwd ? cwd : undefined,
        });
        const msg = result.killed.length
          ? `Stopped ${result.killed.length} process(es) (PIDs: ${result.killed.join(", ")})`
          : "No running service found on the specified port or project directory.";
        return {
          content: [{ type: "text", text: msg }],
        };
      }
      case "run_service": {
        const child = runService({ cwd: cwd, port: args?.port as number | undefined });
        return {
          content: [{ type: "text", text: `Service started (PID ${child.pid}). Running in background.` }],
        };
      }
      case "dev_service": {
        const cleanup = startDevServer({ cwd: cwd, port: args?.port as number | undefined });
        return {
          content: [{ type: "text", text: `Dev server started in background (tsc --watch + swerve). Call cleanup to stop.` }],
        };
      }
      case "generate_tests": {
        const result = generateTests({ cwd: cwd });
        const lines = [
          `Helper: ${result.helperFile}${result.helperSkipped ? " (skipped, already exists)" : ""}`,
          `Created: ${result.created.length ? result.created.join(", ") : "none"}`,
          `Skipped: ${result.skipped.length ? result.skipped.join(", ") : "none"}`,
        ];
        return {
          content: [{ type: "text", text: lines.join("\n") }],
        };
      }
      case "generate_spec": {
        const result = generateSpec({
          projectDir: cwd,
          output: args?.output as string | undefined,
          basePath: args?.basePath as string | undefined,
          serverUrl: args?.serverUrl as string | undefined,
          version: args?.version as string | undefined,
          json: args?.json as boolean | undefined,
        });
        return {
          content: [{ type: "text", text: `Spec written to ${result.outputFile} (${result.routerCount} routers, ${result.operationCount} operations)` }],
        };
      }
      case "generate_skeleton": {
        const result = generateSkeleton({
          spec: args?.spec as string,
          output: args?.output as string | undefined,
          name: args?.name as string | undefined,
          scope: args?.scope as string | undefined,
          basePath: args?.basePath as string | undefined,
        });
        return {
          content: [{ type: "text", text: `Skeleton generated at ${result.outputDir} (service: ${result.serviceName}, ${result.routerCount} routers, ${result.controllerCount} controllers)\nCreated: ${result.created.join(", ")}` }],
        };
      }
      case "generate_config": {
        const result = await generateConfig({
          cwd: (args?.cwd as string) ?? cwd,
          force: args?.force as boolean,
        });
        return {
          content: [{ type: "text", text: `Generated config for ${result.serviceName} (${result.packageName}) at ${result.configPath}` }],
        };
      }
      case "upsert_stack": {
        const result = await upsertStack({
          cwd: (args?.cwd as string) ?? cwd,
          services: args?.services as any[],
        });
        return {
          content: [{ type: "text", text: `Updated stack config at ${result.configPath}` }],
        };
      }
      case "list_configs": {
        const result = listConfigs({
          cwd: (args?.cwd as string) ?? cwd,
        });
        return {
          content: [{ type: "text", text: `Found config files:\n${result.files.join("\n")}` }],
        };
      }
      case "read_config": {
        const result = readConfig({
          path: args?.path as string,
        });
        return {
          content: [{ type: "text", text: JSON.stringify(result.config, null, 2) }],
        };
      }
      case "remove_from_stack": {
        const result = await removeFromStack({
          serviceName: args?.serviceName as string,
          cwd: (args?.cwd as string) ?? cwd,
        });
        return {
          content: [{ type: "text", text: result.message }],
        };
      }
      case "add_service_arg": {
        const result = await addServiceArg({
          name: args?.name as string,
          type: args?.type as string,
          defaultValue: args?.default,
          cwd: (args?.cwd as string) ?? cwd,
        });
        const msg = `Added argument ${result.argName} to ${result.serviceName}.\n` +
          (result.appPatched ? "Patched src/app.ts.\n" : "") +
          "Updated configuration files.";
        return {
          content: [{ type: "text", text: msg }],
        };
      }
      case "update_service_arg": {
        const result = await updateServiceArg({
          name: args?.name as string,
          type: args?.type as string,
          defaultValue: args?.default,
          cwd: (args?.cwd as string) ?? cwd,
        });
        const msg = `Updated argument ${result.argName} in ${result.serviceName}.\n` +
          (result.appPatched ? "Patched src/app.ts.\n" : "") +
          (result.configUpdated ? "Updated configuration files." : "");
        return {
          content: [{ type: "text", text: msg }],
        };
      }
      case "delete_service_arg": {
        const result = await deleteServiceArg({
          name: args?.name as string,
          cwd: (args?.cwd as string) ?? cwd,
        });
        const msg = `Deleted argument ${result.argName} from ${result.serviceName}.\n` +
          (result.appPatched ? "Patched src/app.ts.\n" : "") +
          "Updated configuration files.";
        return {
          content: [{ type: "text", text: msg }],
        };
      }
      case "update_controller_params": {
        const result = await updateControllerParams({
          routerName: args?.router as string,
          controllerName: args?.controller as string,
          action: (args?.action as "upsert" | "delete") ?? "upsert",
          bodyFields: args?.bodyFields as any,
          queryParams: args?.queryParams as any,
          cwd: (args?.cwd as string) ?? cwd,
        });
        return {
          content: [{ type: "text", text: `Updated parameters for controller ${result.controllerName} at ${result.filePath}` }],
        };
      }
      case "manage_state": {
        const result = await manageState({
          action: args?.action as any,
          targetLevel: args?.level as any,
          name: args?.name as string,
          routerName: args?.router as string,
          controllerName: args?.controller as string,
          type: args?.type as string,
          defaultValue: args?.default as string,
          cwd: (args?.cwd as string) ?? cwd,
        });
        return {
          content: [{ type: "text", text: `Successfully performed ${args?.action} on ${args?.name} at ${args?.level} level.\nPatched files: ${result.patchedFiles.join(", ")}` }],
        };
      }
      case "request": {
        const baseUrl = (args?.baseUrl as string | undefined) ?? "http://localhost:3000";
        const endpoints = buildEndpoints(cwd);

        if (!args?.endpoint) {
          const list = endpoints.map((e) => e.label).join("\n");
          return {
            content: [{ type: "text", text: `Available endpoints:\n${list}` }],
          };
        }

        const endpoint = endpoints.find((e) => e.label === args.endpoint);
        if (!endpoint) {
          return {
            content: [{ type: "text", text: `Endpoint not found: "${args.endpoint}". Available:\n${endpoints.map((e) => e.label).join("\n")}` }],
            isError: true,
          };
        }

        const body = args?.body ? JSON.parse(args.body as string) : undefined;
        const query = args?.query ? JSON.parse(args.query as string) : undefined;

        const result = await sendRequest({ baseUrl, endpoint, body, query });
        return {
          content: [{ type: "text", text: `${result.status} ${result.statusText} (${result.durationMs}ms)\n${result.body}` }],
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
