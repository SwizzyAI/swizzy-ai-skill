# Swizzy AI Skill

AI Agent skill for working with the SwizzyWeb ecosystem. This package provides an **MCP (Model Context Protocol)** server that allows AI agents to scaffold, manage, and refactor Swizzy Web Service projects.

## Installation

Install the package from the registry:

```bash
npm install -g @swizzyai/swizzy-ai-skill
```

Or install locally as a project dependency:

```bash
npm install @swizzyai/swizzy-ai-skill
```

## Setup (How to get an AI to use this)

To use this skill with an AI agent, you must register it as an MCP server.

### 1. Register with Claude Code (CLI)
Add this to your Claude Code MCP config (run `claude mcp add` or edit `~/.claude/mcp.json`):

```json
{
  "mcpServers": {
    "swizzy": {
      "command": "npx",
      "args": ["@swizzyai/swizzy-ai-skill"]
    }
  }
}
```

### 2. Register with Claude Desktop
Add this to your configuration file (usually `~/.config/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "swizzy": {
      "command": "npx",
      "args": ["@swizzyai/swizzy-ai-skill"]
    }
  }
}
```

### 3. Register with Gemini CLI
Run the following command in your terminal:

```bash
gemini mcp add swizzy npx @swizzyai/swizzy-ai-skill
```

## Usage

Once registered, you can talk to your AI agent in natural language. The AI will automatically call the correct Swizzy skill tools.

### Examples
- **Scaffolding:** "Create a new Swizzy backend project named 'StoreManager'."
- **Adding Features:** "Add a 'Product' router at path '/products' and a 'CreateProduct' POST controller inside it with 'name' and 'price' body fields."
- **Middleware:** "Add an 'Auth' middleware to the 'CreateProduct' controller."
- **Evolution:** "Add 'inventoryCount: number' to the service state with a default of 0."
- **Evolution:** "Add a 'description' body field to the 'CreateProduct' controller."
- **Configuration:** "Add a 'databaseUrl' service argument."
- **Stacks:** "Create a stack configuration with this project and my-proxy-web-service."
- **Management:** "Show me the current project structure."
- **Refactoring:** "Rename the 'Product' router to 'Inventory'."
- **Complex Scaffolding:** "Create a new controller named 'UpdateStock' in the 'Inventory' router. It should have a 'quantity' body field and also add 'lastUpdated' to the service state."
- **OpenAPI:** "Generate an OpenAPI spec for this project and save it to docs/openapi.yaml."
- **Skeleton:** "Scaffold a new project from my openapi.yaml spec."
- **Testing:** "Generate test stubs for all controllers."
- **Running:** "Start the service on port 4000."
- **Stopping:** "Stop the service running on port 4000."
- **Requests:** "Send a POST to the CreateProduct endpoint with name 'Widget' and price 9.99."

## Available Tools (Capabilities)

> **`cwd` parameter**: All tools accept an optional `cwd` string (absolute path to the project directory). Pass it whenever your project lives in a subdirectory of the MCP server's working directory — which is the typical case when Claude Code opens a parent workspace. Example: `cwd: "/home/user/workspace/my-service"`.

### Inspection & Configuration
| Tool | Key Parameters | Purpose |
| :--- | :--- | :--- |
| `get_project_structure` | `cwd?` | Reads the current routers, controllers, and middleware. |
| `generate_config` | `cwd?`, `force?` | Generates a baseline `web-service-config.json`. |
| `upsert_stack` | `services`, `cwd?` | Composes multi-service stack configurations. |
| `list_configs` | `cwd?` | Discovers configuration files in the workspace. |
| `read_config` | `path` | Reads and parses a configuration file. |
| `remove_from_stack` | `serviceName`, `cwd?` | Removes a service definition from a stack. |

### Scaffolding
| Tool | Key Parameters | Purpose |
| :--- | :--- | :--- |
| `create_web_service` | `name`, `type?`, `cwd?`, `stateFields?`, `serviceArgs?`, `install?` | Initializes a new project. |
| `create_router` | `name`, `path`, `cwd?`, `stateFields?`, `serviceArgs?` | Adds a new router. |
| `create_controller` | `name`, `action`, `router`, `method?`, `cwd?`, `bodyFields?`, `queryParams?`, `implementation?`, `imports?` | Adds a controller (supports body + query + business logic). |
| `create_middleware` | `name`, `router`, `cwd?`, `controller?`, `implementation?`, `imports?` | Generates and attaches middleware. |

### Evolution (State & Params)
| Tool | Key Parameters | Purpose |
| :--- | :--- | :--- |
| `manage_state` | `action`, `level`, `name`, `type?`, `default?`, `cwd?` | Manages state with **upward propagation**. |
| `update_controller_params` | `router`, `controller`, `action?`, `bodyFields?`, `queryParams?` | CRUD for body/query fields. |
| `update_controller_implementation` | `router`, `controller`, `implementation`, `imports?`, `cwd?` | Replaces the `getInitializedController` body. **Use this instead of editing the controller file directly.** |
| `update_middleware_implementation` | `router`, `middleware`, `implementation`, `imports?`, `cwd?` | Replaces a middleware's handler body. **Use this instead of editing the middleware file directly.** |
| `add_service_arg` | `name`, `type`, `default?`, `cwd?` | Adds a typed service argument. |
| `update_service_arg` | `name`, `type?`, `default?`, `cwd?` | Updates an existing service argument. |
| `delete_service_arg` | `name`, `cwd?` | Removes a service argument. |

### Refactoring
| Tool | Key Parameters | Purpose |
| :--- | :--- | :--- |
| `rename_router` | `oldName`, `newName`, `cwd?` | Renames router and updates all references. |
| `rename_controller` | `oldName`, `newName`, `router`, `cwd?` | Renames controller and updates all references. |
| `rename_middleware` | `oldName`, `newName`, `router`, `cwd?` | Renames middleware and updates all references. |
| `delete_router` | `name`, `cwd?` | Removes router and cleans up registrations. |
| `delete_controller` | `name`, `router`, `cwd?` | Removes controller and cleans up registrations. |
| `delete_middleware` | `name`, `router`, `cwd?` | Removes middleware and cleans up registrations. |

### Build & Run
| Tool | Key Parameters | Purpose |
| :--- | :--- | :--- |
| `build_service` | `cwd?` | Compiles the TypeScript project. |
| `run_service` | `cwd?`, `port?` | Starts the service in the background. |
| `dev_service` | `cwd?`, `port?` | Starts in dev mode with `tsc --watch` and auto-restart. |
| `stop_service` | `port?`, `cwd?` | Stops a running service or dev server by port and/or project directory. |
| `view_logs` | `cwd?`, `lines?` | View the most recent logs for a running service or stack. |

### OpenAPI
| Tool | Purpose |
| :--- | :--- |
| `generate_spec` | Exports an OpenAPI 3.0 spec. Accepts `output`, `basePath`, `serverUrl`, `version`, `json`, `clientPackage`, `clientPackageName`, `clientOutput`. |
| `generate_skeleton` | Scaffolds a new project from an OpenAPI 3.0 spec file. Requires `spec` (file path). Accepts `output`, `name`, `scope`, and `basePath`. |

### Testing & Requests
| Tool | Purpose |
| :--- | :--- |
| `generate_tests` | Generates test stubs (happy-path, missing-field, error) for all routers and controllers. |
| `request` | Sends an HTTP request to a running service. Omit `endpoint` to list all available endpoints. |

## Documentation
- **[README.md](./README.md)**: Human-readable guide (this file).
- **[AI_USAGE.md](./AI_USAGE.md)**: Expert procedural guidance for the AI agent.

## License

Copyright 2024 Jason Gallagher

Licensed under the [Apache License, Version 2.0](./LICENSE).
