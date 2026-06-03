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
Run `npm run build` in the current directory (handles both `tsc` and webpack for frontend services).

### `run_service`
Start the compiled service in the background using `swerve`.
- `port` (optional): Port to bind. Defaults to the port in `web-service-config.local.json`.
- Returns the PID of the spawned process.

### `dev_service`
Start the service in development mode. Runs `tsc --watch` (recompiles on file changes) alongside `swerve`, which auto-restarts when `dist/` changes.
- `port` (optional): Port to bind.
- Both `tsc` and `swerve` binaries are resolved from the project's own `node_modules`, so `npm install` must have been run first (or pass `install: true` to `create_web_service`).

### `stop_service`
Stop a running service or dev server.
- `port` (optional): Port the service is listening on. Used to locate and kill the `swerve` process.
- `cwd` (optional): Absolute path to the project directory. When provided, also finds and kills any `tsc --watch` process associated with the project — necessary for stopping a dev server cleanly.
- Pass both `port` and `cwd` when stopping a dev server. Port alone is sufficient for `run_service`.

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

### `generate_tests`
Generate test stub files for all routers and controllers that don't already have one.
- Creates a test helper (`test/helpers/create-<service>-test-app.ts`) if it doesn't exist.
- Skips any spec file that already exists (safe to re-run).

### `generate_spec`
Export an OpenAPI 3.0 spec from the current project by reading router/controller metadata.
- `output` (optional): Output file path. Defaults to `openapi.yaml` (or `openapi.json` if `json: true`).
- `basePath` (optional): Override the API base path (default: derived from the service).
- `serverUrl` (optional): Embed a server URL in the spec.
- `version` (optional): API version string (default: `1.0.0`).
- `json` (optional): Output JSON instead of YAML.

### `generate_skeleton`
Scaffold a new Swizzy project from an OpenAPI 3.0 spec file.
- `spec` (required): Absolute path to a JSON or YAML OpenAPI spec.
- `output` (optional): Output directory (default: `./generated`).
- `name` (optional): Service name override.
- `scope` (optional): NPM scope.
- `basePath` (optional): API base path (default: `api`).

### `generate_config`
Generate web-service-config.json for a single project (using its packageName).
- `cwd` (optional): Absolute path to the project directory.
- `force` (optional): Overwrite existing config files (default: `false`).

### `upsert_stack`
Create or update a stack configuration combining multiple services.
- `cwd` (optional): Directory where the web-service-config.json should be created/updated.
- `services` (required): Array of service definitions:
    - `location` (required): Local path (e.g. `./backend`) or NPM package (e.g. `@swizzyweb/proxy`).
    - `className` (optional): Service class name (auto-detected for local paths).
    - `options` (optional): Extra configuration options for this service (e.g. `{ "port": 3001 }`).

### `list_configs`
List all web-service-config*.json files in the workspace.
- `cwd` (optional): Base directory to search from.

### `read_config`
Read and parse a web-service-config.json file.
- `path` (required): Path to the config file.

### `remove_from_stack`
Delete a service definition from a stack configuration.
- `serviceName` (required): Name of the service class to remove.
- `cwd` (optional): Directory containing the stack config.

### `add_service_arg`
Add a typed service argument to app.ts and configuration files. This automatically propagates the argument through the service and updates all `web-service-config*.json` files.
- `name` (required): Argument name (camelCase).
- `type` (required): TypeScript type (string, number, boolean, etc.).
- `default` (optional): Default value for config files.
- `cwd` (optional): Absolute path to the project directory.

### `update_service_arg`
Update an existing service argument's type or default value.
- `name` (required): Argument name (camelCase).
- `type` (optional): New TypeScript type.
- `default` (optional): New default value for config files.
- `cwd` (optional): Absolute path to the project directory.

### `delete_service_arg`
Delete a service argument from app.ts and configuration files.
- `name` (required): Argument name to delete.
- `cwd` (optional): Absolute path to the project directory.

### `update_controller_params`
Update request body or query parameters for an existing controller.
- `router` (required): Parent router name.
- `controller` (required): Controller name.
- `bodyFields` (optional): Array of `{ name: string, type: string }`.
- `queryParams` (optional): Array of `{ name: string, type: string }`.
- `cwd` (optional): Absolute path to the project directory.

### `manage_state`
Manage state properties with automatic upward propagation (Controller -> Router -> WebService -> app.ts).
- `action` (required): `add`, `update`, or `delete`.
- `level` (required): `controller`, `router`, or `service`.
- `name` (required): Property name (camelCase).
- `router` (required for controller/router level): Router name.
- `controller` (required for controller level): Controller name.
- `type` (required for add/update): TypeScript type.
- `default` (optional): Default initialization value in `app.ts`.
- `cwd` (optional): Absolute path to the project directory.

### `request`
Send an HTTP request to a running service or list its available endpoints.
- `baseUrl` (optional): Base URL of the service (default: `http://localhost:3000`).
- `endpoint` (optional): Endpoint label as shown by the listing, e.g. `GET /api/items/list`. Omit to list all available endpoints.
- `body` (optional): JSON string of the request body.
- `query` (optional): JSON string of query parameters.

## Configuration and `serviceArgs`

Swizzy Web Services use a structured configuration pattern instead of unstructured environment variables (`process.env`).

- **`serviceArgs`**: These are typed configuration parameters defined at the service level. When you create a service, router, or controller using the MCP tools, you can pass `serviceArgs` (as an array of `{ name: string, type: string }`). The tools will:
  1. Add the argument to the `WebService` configuration.
  2. Update the `app.ts` file to propagate the argument.
  3. Create/update `web-service-config.example.json` and `web-service-config.local.json`.
- **`web-service-config.json`**: This file (or its `.local.json` version) is where the actual values for `serviceArgs` are provided. The values are automatically injected into your components during runtime.

**Avoid `process.env`**. Always prefer defining a new `serviceArg` and using the tools to propagate it. This ensures type safety and clear configuration documentation.

## Best Practices for AI Agents
0. **Use MCP tools for STRUCTURAL changes**: You MUST use `create_web_service`, `create_router`, `create_controller`, and `create_middleware` to add new components, and the `rename_*`/`delete_*` tools for refactoring. These tools handle boilerplate, imports, and registrations.
1. **Implement BUSINESS LOGIC manually**: Once a component is created, you ARE expected to manually edit the file to implement its internal logic (e.g., the `getInitializedController` method in a controller or the middleware function's execution body).
2. Before adding a structural component, ensure you have a router or identify an existing one.
3. Use `create_web_service` first if starting a new project.
4. If adding a POST/PUT request that expects data, use `body: true` and provide `bodyFields` if known.
5. If adding a GET request with optional filters, use `query: true` and provide `queryParams` if known.
6. Use `stateFields` and `serviceArgs` directly when creating routers or controllers to automatically propagate state and configuration through the service, instead of manual file editing.
