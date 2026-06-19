---
name: swizzy-ai-skill
description: Manage Swizzy Web Service projects, including creating routers, controllers, and middleware, as well as refactoring and inspecting project structure.
---

# Swizzy AI Skill

This skill provides an MCP server to manage Swizzy Web Service projects.

## Core Mandates

- **Use MCP tools for STRUCTURAL changes**: You MUST use `create_web_service`, `create_router`, `create_controller`, and `create_middleware` to add new components, and the `rename_*`/`delete_*` tools for refactoring.
- **Set BUSINESS LOGIC through the tools, never by hand-editing the file**: Pass it via `create_controller`/`create_middleware`'s `implementation` param, or via `update_controller_implementation`/`update_middleware_implementation` for an existing component. Direct file edits have clobbered the generated state/request interfaces around the method body — these tools patch only the body and validate syntax before writing.
- **Avoid `process.env`**: Use `serviceArgs` and `web-service-config.json` instead.
- **Prefer `manage_state` and `update_controller_params`**: Use these tools to evolve existing architectures (handles propagation).
- **Empirical Understanding**: Always run `get_project_structure` before making any changes.

## Core Workflows

1. **Inspection**: Use `get_project_structure`, `list_configs`, and `read_config`.
2. **Scaffolding**: Use `create_web_service`, `create_router`, `create_controller` (supports body+query+implementation).
3. **Evolution**: Use `manage_state` for state propagation, `update_controller_params` for request fields, and `update_controller_implementation`/`update_middleware_implementation` for business logic.
4. **Configuration**: Use `add_service_arg`, `generate_config`, and `upsert_stack`.
5. **Refactoring**: Use `rename_*` or `delete_*` tools.

## Tools (MCP)

This skill provides 31 MCP tools, including:
- `get_project_structure`, `list_configs`, `read_config`
- `create_web_service`, `create_router`, `create_controller`, `create_middleware`
- `manage_state`, `update_controller_params`, `update_controller_implementation`, `update_middleware_implementation`
- `add_service_arg`, `update_service_arg`, `delete_service_arg`
- `generate_config`, `upsert_stack`, `remove_from_stack`
- `rename_router` / `rename_controller` / `rename_middleware`
- `delete_router` / `delete_controller` / `delete_middleware`
- `build_service`, `run_service`, `dev_service`, `stop_service`
- `generate_tests`, `generate_spec`, `generate_skeleton`
- `request`
