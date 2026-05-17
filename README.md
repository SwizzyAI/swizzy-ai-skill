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
- **Management:** "Show me the current project structure."
- **Refactoring:** "Rename the 'Product' router to 'Inventory'."
- **Complex Scaffolding:** "Create a new controller named 'UpdateStock' in the 'Inventory' router. It should have a 'quantity' body field and also add 'lastUpdated' to the service state."
- **OpenAPI:** "Generate an OpenAPI spec for this project and save it to docs/openapi.yaml."
- **Skeleton:** "Scaffold a new project from my openapi.yaml spec."
- **Testing:** "Generate test stubs for all controllers."
- **Running:** "Start the service on port 4000."
- **Requests:** "Send a POST to the CreateProduct endpoint with name 'Widget' and price 9.99."

## Available Tools (Capabilities)

### Inspection
| Tool | Purpose |
| :--- | :--- |
| `get_project_structure` | Reads the current routers, controllers, and middleware. |

### Scaffolding
| Tool | Purpose |
| :--- | :--- |
| `create_web_service` | Initializes a new project from a template. Supports `stateFields` and `serviceArgs`. |
| `create_router` | Adds a new router file and directory. Supports `stateFields` and `serviceArgs`. |
| `create_controller` | Adds a controller with optional `bodyFields`, `queryParams`, `stateFields`, and `serviceArgs`. |
| `create_middleware` | Generates middleware and attaches it to a router/controller. |

### Refactoring
| Tool | Purpose |
| :--- | :--- |
| `rename_router` / `rename_controller` / `rename_middleware` | Renames files and updates all internal references/imports. |
| `delete_router` / `delete_controller` / `delete_middleware` | Removes components and cleans up parent imports. |

### Build & Run
| Tool | Purpose |
| :--- | :--- |
| `build_service` | Compiles the TypeScript project. |
| `run_service` | Starts the service. Accepts an optional `port`. |
| `dev_service` | Starts the service in dev mode with `tsc --watch` and auto-restart on changes. Accepts an optional `port`. |

### OpenAPI
| Tool | Purpose |
| :--- | :--- |
| `generate_spec` | Exports an OpenAPI 3.0 spec from the current project. Accepts `output`, `basePath`, `serverUrl`, `version`, and `json` (for JSON output). |
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
