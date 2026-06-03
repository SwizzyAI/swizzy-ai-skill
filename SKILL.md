---
name: swizzy-ai-skill
description: Manage Swizzy Web Service projects, including creating routers, controllers, and middleware, as well as refactoring and inspecting project structure.
---

# Swizzy AI Skill

This skill provides an MCP server to manage Swizzy Web Service projects.

## Core Mandates

- **Use MCP tools for STRUCTURAL changes**: You MUST use `create_web_service`, `create_router`, `create_controller`, and `create_middleware` to add new components, and the `rename_*`/`delete_*` tools for refactoring.
- **Implement BUSINESS LOGIC manually**: Once a component is created, manually edit the file to implement internal logic.
- **Avoid `process.env`**: Use `serviceArgs` and `web-service-config.json` instead.
- **Prefer `manage_state` and `update_controller_params`**: Use these tools to evolve existing architectures (handles propagation).
- **Empirical Understanding**: Always run `get_project_structure` before making any changes.

## Core Workflows

1. **Inspection**: Use `get_project_structure`, `list_configs`, and `read_config`.
2. **Scaffolding**: Use `create_web_service`, `create_router`, `create_controller` (supports body+query).
3. **Evolution**: Use `manage_state` for state propagation and `update_controller_params` for request fields.
4. **Configuration**: Use `add_service_arg`, `generate_config`, and `upsert_stack`.
5. **Refactoring**: Use `rename_*` or `delete_*` tools.

## Tools (MCP)

This skill provides 29 MCP tools, including:
- `get_project_structure`, `list_configs`, `read_config`
- `create_web_service`, `create_router`, `create_controller`, `create_middleware`
- `manage_state`, `update_controller_params`
- `add_service_arg`, `update_service_arg`, `delete_service_arg`
- `generate_config`, `upsert_stack`, `remove_from_stack`
- `rename_router` / `rename_controller` / `rename_middleware`
- `delete_router` / `delete_controller` / `delete_middleware`
- `build_service`, `run_service`, `dev_service`, `stop_service`
- `generate_tests`, `generate_spec`, `generate_skeleton`
- `request`
