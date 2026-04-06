# Swizzy AI Tool

AI Agent tool for working with the SwizzyWeb ecosystem. This package provides an MCP (Model Context Protocol) server that allows AI agents to scaffold and manage Swizzy Web Service projects.

## Features

- **Create Web Service**: Scaffold a new `@swizzyweb/swizzy-web-service` project.
- **Create Router**: Add a new router to an existing service.
- **Create Controller**: Add a new controller to an existing router with support for body and query validation.
- **Build Service**: Run the build process for the service.

## Installation

```bash
cd swizzy-ai-tool
npm install
npm run build
```

## Usage for Humans

This tool is primarily intended to be used by AI agents via the MCP protocol. However, you can run the server manually if needed:

```bash
node dist/index.js
```

## Usage for AI Agents

Register this tool as an MCP server in your AI agent configuration (e.g., Gemini CLI, Claude Desktop).

### MCP Tool Definitions

- `create_web_service`: Scaffolds a new project.
- `create_router`: Adds a new router.
- `create_controller`: Adds a new controller.
- `build_service`: Builds the project.

Detailed tool definitions and schemas are provided via the MCP `list_tools` request.
