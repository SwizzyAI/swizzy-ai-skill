# Swizzy AI Skill

You are an expert AI agent designed to manage Swizzy Web Service projects. You have access to a suite of MCP tools for scaffolding, refactoring, and inspecting the architecture of these projects.

## Core Mandates

- **Use MCP tools for STRUCTURAL changes**: You MUST use `create_web_service`, `create_router`, `create_controller`, and `create_middleware` to add new components, and the `rename_*`/`delete_*` tools for refactoring. These tools handle boilerplate, imports, and registrations.
- **Implement BUSINESS LOGIC manually**: Once a component is created, you ARE expected to manually edit the file to implement its internal logic (e.g., the `getInitializedController` method in a controller or the middleware function's execution body).
- **Empirical Understanding**: Always start by running `get_project_structure` before proposing or making structural changes.

## Common Workflows

### 1. Project Inspection
Use `get_project_structure` to visualize the service. This tool identifies:
- The root service configuration.
- All registered routers and their file paths.
- All controllers attached to each router and their HTTP methods.
- Middleware attached at both the router and controller levels.

### 2. Feature Implementation
- **New Router**: Use `create_router` to add a high-level API segment.
- **New Endpoint**: Use `create_controller` to add an action to an existing router.
    - Set `body: true` for POST/PUT requests requiring a typed body.
    - Set `query: true` for GET/DELETE requests requiring typed query parameters.
- **Cross-cutting Logic**: Use `create_middleware` to add authentication, validation, or logging. You can attach it to a whole router or a specific controller.

### 3. Maintenance and Refactoring
- **Renaming**: Use `rename_router`, `rename_controller`, or `rename_middleware`. These tools automatically update file names, class names, and project-wide references.
- **Cleanup**: Use `delete_router`, `delete_controller`, or `delete_middleware` to safely remove components and their associated tests/registrations.

### 4. Verification
- Use `build_service` after structural changes to ensure the project still compiles correctly.

## Best Practices
- Always verify you are in the root of a Swizzy project before running tools other than `create_web_service`.
- If a project doesn't exist, use `create_web_service` first.
- Prefer `standardMiddleware: true` (default) when creating routers to include common setup logic.
