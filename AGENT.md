# Swizzy AI Skill

You are an expert AI agent designed to manage Swizzy Web Service projects. You have access to a suite of MCP tools for scaffolding, refactoring, and inspecting the architecture of these projects.

## Core Mandates

- **Use MCP tools for STRUCTURAL changes**: You MUST use `create_web_service`, `create_router`, `create_controller`, and `create_middleware` to add new components, and the `rename_*`/`delete_*` tools for refactoring. These tools handle boilerplate, imports, and registrations.
- **Implement BUSINESS LOGIC manually**: Once a component is created, you ARE expected to manually edit the file to implement its internal logic (e.g., the `getInitializedController` method in a controller or the middleware function's execution body).
- **Avoid `process.env`**: NEVER use unstructured environment variables for service configuration. Instead, use `serviceArgs` and `web-service-config.json`. Define `serviceArgs` when using MCP tools to ensure configuration is typed and correctly propagated throughout the project.
- **Empirical Understanding**: Always start by running `get_project_structure` before proposing or making structural changes.
- **Always pass `cwd`**: Every tool accepts an optional `cwd` parameter (absolute path to the project directory). You MUST pass it whenever the project lives in a subdirectory of the MCP server's working directory — which is always the case when Claude Code opens a parent workspace. Example: `cwd: "/home/user/workspace/my-service"`.

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

---

## Key Patterns for Business Logic Implementation

### The `cwd` Parameter
All tools accept a `cwd` string (absolute path). The MCP server defaults to its own process CWD when `cwd` is omitted, which may differ from where your project lives. **Always pass `cwd` explicitly** to avoid ENOENT errors.

```
// Discovering the project first
get_project_structure({ cwd: "/abs/path/to/my-service" })

// Then scaffolding into it
create_router({ name: "Products", path: "/products", cwd: "/abs/path/to/my-service" })
```

### State Flow: Service → Router → Controller
State flows top-down through converters. Each layer projects a slice of the parent state:

1. **Service state** (`web-service.ts`) — the source of truth, initialized in `app.ts`.
2. **Router state** (`*-router.ts`) — declared as an interface + populated by the `stateConverter` function.
3. **Controller state** (`*-controller.ts`) — when `DefaultStateExporter` is used as `stateConverter`, the controller state receives **the same fields as the router state**. The controller state interface MUST declare those fields explicitly for TypeScript to compile.

```typescript
// products-router.ts
export interface ProductsRouterState {
  products: Product[];  // sliced from service state
}
const ProductsWebRouterStateConverter = async (props) =>
  ({ products: props.state.products });

// list-controller.ts — state must match what DefaultStateExporter passes through
export interface ListProductsControllerState {
  products: Product[];  // same fields as router state
}
// getInitializedController:
const state = getState()!;  // returns ListProductsControllerState
res.json({ products: state.products });
```

### Mutable State (e.g. a Cart)
Service state is read-only within controllers. For mutable in-memory state (sessions, carts), use a module-level store file:

```typescript
// src/cart-store.ts
import type { CartItem } from "./web-service.js";
export const cart: CartItem[] = [];
```

Import it directly in controllers that need to mutate it. Pass the products catalog through router state for read access (validation/lookup).

### Tailwind CSS Version Note
The frontend template uses **Tailwind v4**. Use the slash opacity syntax — `bg-black/50` — not the legacy `bg-opacity-*` utilities, which will cause build errors.

### Scaffolder Type Limitation
When passing `stateFields` to `create_web_service`, avoid TypeScript-specific types like `array` or `object` — the scaffolder writes them literally into the interface, causing compile errors. Either omit `stateFields` and add them manually, or pass valid TS types like `unknown[]`.

### API Route Paths
Frontend services proxy API calls through `/api/`. The URL structure is:
```
/api/<router-path>/<controller-action>
```
Example: router path `/products` + action `list` → `fetch("/api/products/list")`.

### Controller Validation Middleware
The scaffolder generates validation for `body.quantity` typed as `object`, but it should be `number`. Always review and correct generated validation middleware before building.
