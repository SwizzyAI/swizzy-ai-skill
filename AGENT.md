# Swizzy AI Skill

You are an expert AI agent designed to manage Swizzy Web Service projects. You have access to a suite of **32 MCP tools** for scaffolding, refactoring, and inspecting the architecture of these projects.

## Core Mandates

- **Use MCP tools for ALL structural changes**: You MUST use `create_web_service`, `create_router`, `create_controller`, and `create_middleware` to add new components, and the `rename_*`/`delete_*` tools for refactoring. These tools handle boilerplate, imports, and registrations automatically — never do this by hand.
- **Set business logic ONLY through the tools**: Pass the `getInitializedController` body via `create_controller`'s `implementation` param (at creation) or `update_controller_implementation` (for an existing controller). Pass a middleware's handler body via `create_middleware`'s `implementation` param or `update_middleware_implementation`. Do NOT open the controller/middleware file with a generic edit tool — direct edits clobber the surrounding state/request interfaces and class scaffolding. The tools patch only the method body and validate TypeScript syntax before writing.
- **Never use `process.env`**: NEVER use unstructured environment variables for service configuration. Always use `serviceArgs` (typed, propagated) and `web-service-config.json`.
- **Use `manage_state` and `update_controller_params` for evolution**: These tools propagate changes automatically. Never patch state interfaces or request types by hand.
- **Always call `get_project_structure` first**: Before proposing or making any structural changes, run `get_project_structure` to understand what already exists. Do not assume file paths or class names.
- **Always pass `cwd`**: Every tool accepts a `cwd` parameter (absolute path to the project directory). Always pass it — omitting it defaults to the MCP server's working directory, which is almost never the right project.
- **PascalCase names**: All `name`, `router`, `controller`, `middleware` parameters expect PascalCase (e.g. `UserProfile`, not `user-profile` or `userProfile`).
- **`implementation` is the function body only**: When passing `implementation`, write only the inner body of the function — not the function signature, not the enclosing class method. The tool wraps it correctly.
- **Check `bodyFields`/`queryParams` match `body`/`query` flags**: If you pass `bodyFields`, also set `body: true`. If you pass `queryParams`, also set `query: true`. Mismatches produce controllers without the correct middleware.
- **Build before running**: After structural changes, call `build_service` before `run_service` or `dev_service`.
- **`stateFields` types must be valid TypeScript**: Use `unknown[]` not `array`, `Record<string, unknown>` not `object`, etc.

## Common Workflows

### 1. Project Scaffolding & Configuration
- **Start New**: Use `create_web_service`.
- **Baseline Config**: Use `generate_config` to create a standard `web-service-config.json` (automatically uses `packageName`).
- **Composition**: Use `upsert_stack` to combine multiple local services or NPM packages into a single configuration.
- **Discovery**: Use `list_configs` to find configuration files and `read_config` to inspect them.

### 2. Feature Implementation
- **New Router**: Use `create_router`.
- **New Endpoint**: Use `create_controller`. You can specify `body: true` and `query: true` simultaneously, and pass `implementation` to set its `getInitializedController` body in the same call.
- **Cross-cutting Logic**: Use `create_middleware`, optionally with `implementation` to set its handler body.
- **Business Logic on an existing component**: Use `update_controller_implementation` or `update_middleware_implementation` — never a direct file edit.

### 3. Architectural Evolution
- **State Propagation**: Use `manage_state` to add/update/delete state properties. Changes flow upward: `Controller -> Router -> WebService -> app.ts`.
- **Request Parameters**: Use `update_controller_params` to modify or delete `body` and `query` fields on existing controllers.
- **Configuration Args**: Use `add_service_arg`, `update_service_arg`, or `delete_service_arg` to manage typed top-level arguments.

### 4. Maintenance and Refactoring
- **Renaming**: Use `rename_router`, `rename_controller`, or `rename_middleware`.
- **Cleanup**: Use `delete_router`, `delete_controller`, or `delete_middleware` to safely remove components.
- **Stack Cleanup**: Use `remove_from_stack` to remove a service definition from a config.
- **Documentation**: Use `add_jsdoc` to insert JSDoc comments on routers and controllers. Scope with `router` and `controller` params or omit both to patch the whole project.

### 5. Running & Verification
- **Build**: Use `build_service` after changes.
- **Run**: Use `run_service` or `dev_service` (watch mode).
- **Logs**: Use `view_logs` to inspect the output of a running service.
- **Stop**: Use `stop_service`.
- **Test**: Use `request` to interactively call endpoints and verify behavior.

### 6. OpenAPI
- **Spec Generation**: Use `generate_spec` to generate an `openapi.yaml`. You can automatically scaffold a Node.js client package alongside the service by passing `clientPackage: true`.
- **Skeleton Scaffolding**: Use `generate_skeleton` to start a new project from an existing `openapi.yaml`.

## Best Practices
- **Project Context**: Always call `get_project_structure` before any structural change. Use the returned router/controller names verbatim as `router`/`controller` params — don't guess or derive them from filenames.
- **Robustness**: The AST patchers automatically repair missing commas/semicolons and handle complex nested structures via brace-counting.
- **NPM Packages**: In `upsert_stack`, use absolute/relative paths for `location` for local services and NPM package names for published packages. The tool auto-detects class names for local paths.
- **Middleware scope**: When creating or deleting middleware, pass `controller` only if the middleware belongs to a specific controller. Omit it for router-level middleware.
- **`update_controller_params` vs `manage_state`**: Use `update_controller_params` to change request body/query fields. Use `manage_state` to change state properties that flow through the service. They are not interchangeable.
- **`implementation` golden rule**: The string you pass as `implementation` must compile as valid TypeScript when placed inside the method body. The tool validates this and will reject the patch if it doesn't — no file is touched on failure.
- **Avoid redundant calls**: `create_controller` already registers the controller in the router. Do NOT separately patch the router file. The same applies to `create_router` (registers in `web-service.ts`) and `create_middleware` (registers in its parent).

---

## Key Patterns for Business Logic Implementation

All of the logic below is set via the `implementation` param on `create_controller`/`create_middleware`, or via `update_controller_implementation`/`update_middleware_implementation` — never by editing the controller/middleware file directly.

### State Flow: Service → Router → Controller
State flows top-down through converters. Each layer projects a slice of the parent state:

1. **Service state** (`web-service.ts`) — the source of truth, initialized in `app.ts`.
2. **Router state** (`*-router.ts`) — populated by the `stateConverter` function.
3. **Controller state** (`*-controller.ts`) — receives fields from the router state.

The interfaces below are generated structure (created by `create_controller`'s `stateFields`); only the body shown after the comment is what you pass as `implementation`:

```typescript
// list-controller.ts — ListProductsControllerState { products: Product[] } already exists
// implementation:
const logger = this.logger;
const getState = this.getState.bind(this);
return async function (req: Request, res: Response) {
  const state = getState()!;
  res.json({ products: state.products });
};
```

### mutable State
Service state is read-only. For mutable in-memory state (sessions, carts), use a module-level store file and import it directly in controllers.

### Tailwind CSS Note
The frontend template uses **Tailwind v4**. Use slash opacity syntax: `bg-black/50`.

### Scaffolder Type Limitation
When passing `stateFields`, use valid TypeScript types (e.g. `unknown[]` instead of `array`).
