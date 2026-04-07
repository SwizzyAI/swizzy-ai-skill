# Swizzy AI Skill - AI Documentation

This skill is an MCP (Model Context Protocol) server designed to help you work with Swizzy Web Services.

## Available Tools

### `create_web_service`
Scaffold a new Swizzy Web Service project.
- `name` (required): PascalCase project name.
- `type` (optional): "backend" (default) or "frontend".
- `scope` (optional): NPM scope (e.g. "myorg").
- `install` (optional): Set to `true` to run `npm install` after creation.
- `stateFields` (optional): Array of `{ name: string, type: string }` to add to the service state.
- `serviceArgs` (optional): Array of `{ name: string, type: string }` to add as service arguments.

### `create_router`
Add a new router to the current project. Must be run in the root of a Swizzy project.
- `name` (required): PascalCase router name.
- `path` (required): URL path segment.
- `standardMiddleware` (optional): Boolean, default `true`.
- `stateFields` (optional): Array of `{ name: string, type: string }` to add to the router state.
- `serviceArgs` (optional): Array of `{ name: string, type: string }` to add as service arguments.

### `create_controller`
Add a new controller to an existing router. Must be run in the root of a Swizzy project.
- `name` (required): PascalCase controller name.
- `action` (required): URL segment.
- `method` (optional): "get" (default), "post", "put", "delete", "patch".
- `router` (required): Name of the parent router.
- `body` (optional): Boolean, set `true` for POST/PUT with typed body.
- `query` (optional): Boolean, set `true` for GET/DELETE with typed query.
- `bodyFields` (optional): Array of `{ name: string, type: string }` for the request body.
- `queryParams` (optional): Array of `{ name: string, type: string }` for query parameters.
- `stateFields` (optional): Array of `{ name: string, type: string }` to add to the state.
- `serviceArgs` (optional): Array of `{ name: string, type: string }` to add as service arguments.

### `create_middleware`
Add a new middleware.
- `name` (required): PascalCase middleware name.
- `router` (required): Parent router name.
- `controller` (optional): Parent controller name (to attach at controller level).

### `delete_middleware`
Delete a middleware and its reference.
- `name` (required): PascalCase middleware name.
- `router` (required): Parent router name.
- `controller` (optional): Parent controller name.

### `rename_middleware`
Rename a middleware.
- `oldName` (required): Current name.
- `newName` (required): New name.
- `router` (required): Parent router name.
- `controller` (optional): Parent controller name.

### `build_service`
Run `npm run build` in the current directory.

### `get_project_structure`
Get the structure of the current Swizzy project.
Returns a JSON object detailing the service, routers, controllers, and their file paths. Use this to understand the project architecture before making changes.

### `delete_controller`
Delete a controller and its test.
- `name` (required): PascalCase controller name.
- `router` (required): Name of the parent router.

### `delete_router`
Delete a router and its contents.
- `name` (required): PascalCase router name.

### `rename_controller`
Rename a controller, its classes, and its test file.
- `oldName` (required): Current name.
- `newName` (required): New name.
- `router` (required): Parent router name.

### `rename_router`
Rename a router and its directory.
- `oldName` (required): Current name.
- `newName` (required): New name.

## Best Practices for AI Agents
0. **Use MCP tools for STRUCTURAL changes**: You MUST use `create_web_service`, `create_router`, `create_controller`, and `create_middleware` to add new components, and the `rename_*`/`delete_*` tools for refactoring. These tools handle boilerplate, imports, and registrations.
1. **Implement BUSINESS LOGIC manually**: Once a component is created, you ARE expected to manually edit the file to implement its internal logic (e.g., the `getInitializedController` method in a controller or the middleware function's execution body).
2. Before adding a structural component, ensure you have a router or identify an existing one.
3. Use `create_web_service` first if starting a new project.
4. If adding a POST/PUT request that expects data, use `body: true` and provide `bodyFields` if known.
5. If adding a GET request with optional filters, use `query: true` and provide `queryParams` if known.
6. Use `stateFields` and `serviceArgs` directly when creating routers or controllers to automatically propagate state and configuration through the service, instead of manual file editing.
