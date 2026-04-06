# Swizzy AI Tool

AI Agent tool for working with the SwizzyWeb ecosystem. This package provides an **MCP (Model Context Protocol)** server that allows AI agents to scaffold, manage, and refactor Swizzy Web Service projects.

## Installation

Before registering the tool, ensure you have built the project:

```bash
cd swizzy-ai-tool
npm install
npm run build
```

## Setup (How to get an AI to use this)

To use this tool with an AI agent, you must register it as an MCP server.

### 1. Register with Gemini CLI
Run the following command in your terminal:

```bash
gemini mcp add swizzy node /home/jmoney/repos/gemini/swizzyweb/code-tools/swizzy-ai-tool/dist/index.js
```

### 2. Register with Claude Desktop
Add this to your configuration file (usually `~/.config/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "swizzy": {
      "command": "node",
      "args": ["/home/jmoney/repos/gemini/swizzyweb/code-tools/swizzy-ai-tool/dist/index.js"]
    }
  }
}
```

## Usage

Once registered, you can talk to your AI agent in natural language. The AI will automatically call the correct Swizzy tools.

### Examples
- **Scaffolding:** "Create a new Swizzy backend project named 'StoreManager'."
- **Adding Features:** "Add a 'Product' router at path '/products' and a 'CreateProduct' POST controller inside it."
- **Middleware:** "Add an 'Auth' middleware to the 'CreateProduct' controller."
- **Management:** "Show me the current project structure."
- **Refactoring:** "Rename the 'Product' router to 'Inventory'."

## Available Tools

| Tool | Purpose |
| :--- | :--- |
| `get_project_structure` | Reads the current routers, controllers, and middleware. |
| `create_web_service` | Initializes a new project from a template. |
| `create_router` | Adds a new router file and directory. |
| `create_controller` | Adds a controller with optional body/query validation. |
| `create_middleware` | Generates middleware and attaches it to a router/controller. |
| `rename_router` / `_controller` | Renames files and updates all internal references/imports. |
| `delete_router` / `_controller` | Removes components and cleans up parent imports. |
| `build_service` | Compiles the TypeScript code. |

## Documentation
- **[README.md](./README.md)**: Human-readable guide (this file).
- **[AI_USAGE.md](./AI_USAGE.md)**: Expert procedural guidance for the AI agent.
