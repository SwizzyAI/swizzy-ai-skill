---
name: swizzy-ai-skill
description: Manage Swizzy Web Service projects, including creating routers, controllers, and middleware, as well as refactoring and inspecting project structure.
---

# Swizzy AI Skill

This skill provides an MCP server to manage Swizzy Web Service projects.

## Core Workflows

1. **Inspection**: Use `get_project_structure` to understand the existing routers and controllers.
2. **Scaffolding**: Use `create_web_service` for new projects, or `create_router`/`create_controller` for features.
3. **Middleware**: Use `create_middleware` to add logic to routers or controllers.
4. **Refactoring**: Use `rename_*` or `delete_*` tools for maintenance.

## Tools (MCP)

This skill provides the following MCP tools:
- `get_project_structure`: Analyze project components.
- `create_web_service`: Scaffold new projects.
- `create_router`: Add new routers.
- `create_controller`: Add new controllers.
- `create_middleware`: Add middleware.
- `rename_router` / `rename_controller` / `rename_middleware`: Refactor components.
- `delete_router` / `delete_controller` / `delete_middleware`: Remove components.
- `build_service`: Compile the project.
