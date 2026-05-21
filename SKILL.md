---
name: swizzy-ai-skill
description: Manage Swizzy Web Service projects, including creating routers, controllers, and middleware, as well as refactoring and inspecting project structure.
---

# Swizzy AI Skill

This skill provides an MCP server to manage Swizzy Web Service projects.

## Core Mandates

- **Use MCP tools for STRUCTURAL changes**: You MUST use `create_web_service`, `create_router`, `create_controller`, and `create_middleware` to add new components, and the `rename_*`/`delete_*` tools for refactoring. These tools handle boilerplate, imports, and registrations.
- **Implement BUSINESS LOGIC manually**: Once a component is created, you ARE expected to manually edit the file to implement the internal logic (e.g., the `getInitializedController` method in a controller or the middleware function's execution body).
- **Empirical Understanding**: Always run `get_project_structure` before making any changes to an existing project.

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
- `run_service`: Start the service in the background.
- `dev_service`: Start in dev mode with `tsc --watch` and auto-restart.
- `stop_service`: Stop a running service or dev server by port and/or project directory.
- `generate_tests`: Generate test stubs for all routers and controllers.
- `generate_spec`: Export an OpenAPI 3.0 spec from the project.
- `generate_skeleton`: Scaffold a new project from an OpenAPI spec.
- `request`: Send HTTP requests to a running service or list its endpoints.
