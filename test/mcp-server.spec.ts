// Copyright 2024 Jason Gallagher
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { describe, it, before, after, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";

// ---------------------------------------------------------------------------
// MCP stdio framing helpers (newline-delimited JSON)
// ---------------------------------------------------------------------------

function encodeMessage(msg: object): string {
  return JSON.stringify(msg) + "\n";
}

// Drain accumulated stdout lines and return any message matching predicate.
function waitForMessage(
  proc: ChildProcessWithoutNullStreams,
  predicate: (msg: any) => boolean,
  timeoutMs = 10_000,
): Promise<any> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      proc.stdout.off("data", onData);
      reject(new Error("Timeout waiting for MCP response"));
    }, timeoutMs);

    let partial = "";
    const onData = (chunk: Buffer) => {
      partial += chunk.toString("utf8");
      const lines = partial.split("\n");
      partial = lines.pop()!;
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          const msg = JSON.parse(trimmed);
          if (predicate(msg)) {
            clearTimeout(timeout);
            proc.stdout.off("data", onData);
            resolve(msg);
          }
        } catch {
          // ignore non-JSON lines (e.g. stderr noise on stdout)
        }
      }
    };

    proc.stdout.on("data", onData);
  });
}

function callTool(
  proc: ChildProcessWithoutNullStreams,
  id: number,
  name: string,
  args: object = {},
): Promise<any> {
  const p = waitForMessage(proc, (msg) => msg.id === id);
  proc.stdin.write(
    encodeMessage({
      jsonrpc: "2.0",
      id,
      method: "tools/call",
      params: { name, arguments: args },
    }),
  );
  return p;
}

function listTools(proc: ChildProcessWithoutNullStreams, id: number): Promise<any> {
  const p = waitForMessage(proc, (msg) => msg.id === id);
  proc.stdin.write(
    encodeMessage({ jsonrpc: "2.0", id, method: "tools/list", params: {} }),
  );
  return p;
}

// ---------------------------------------------------------------------------
// Minimal swizzy project fixture
// ---------------------------------------------------------------------------

const MINIMAL_WEB_SERVICE = `\
import { IWebServiceProps, WebService } from "@swizzyweb/swizzy-web-service";

export interface AppWebServiceState {}

export interface AppWebServiceProps extends IWebServiceProps<AppWebServiceState> {
  port: number;
}

export class AppWebService extends WebService<AppWebServiceState> {
  constructor(props: AppWebServiceProps) {
    super({
      ...props,
      name: "AppWebService",
      path: props.path ?? "api",
      packageName: "test-app",
      routerClasses: [
      ],
      middleware: [],
    });
  }
}
`;

function createMinimalProject(dir: string) {
  fs.mkdirSync(path.join(dir, "src", "routers"), { recursive: true });
  fs.writeFileSync(
    path.join(dir, "package.json"),
    JSON.stringify({
      name: "test-app",
      version: "1.0.0",
      dependencies: { "@swizzyweb/swizzy-web-service": "^0.4.5" },
    }),
  );
  fs.writeFileSync(path.join(dir, "src", "web-service.ts"), MINIMAL_WEB_SERVICE);
  fs.writeFileSync(path.join(dir, "src", "app.ts"), `
export interface GetAppWebServiceProps {
  serviceArgs: {};
}
export async function getWebservice(props) {
  const state = {};
}
`);
}

// ---------------------------------------------------------------------------
// Spawn helpers
// ---------------------------------------------------------------------------

const SERVER_ENTRY = new URL("../index.js", import.meta.url).pathname;

async function spawnServer(cwd: string): Promise<ChildProcessWithoutNullStreams> {
  const proc = spawn("node", [SERVER_ENTRY], {
    cwd,
    stdio: ["pipe", "pipe", "pipe"],
  });

  // Wait for initialize response then send initialized notification
  const initDone = waitForMessage(proc, (msg) => msg.id === 0);
  proc.stdin.write(
    encodeMessage({
      jsonrpc: "2.0",
      id: 0,
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: { name: "test-client", version: "0.0.0" },
      },
    }),
  );
  await initDone;
  proc.stdin.write(
    encodeMessage({ jsonrpc: "2.0", method: "notifications/initialized" }),
  );

  return proc;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("MCP server — tools/list", () => {
  let proc: ChildProcessWithoutNullStreams;
  let tmpDir: string;

  before(async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "swizzy-skill-test-"));
    proc = await spawnServer(tmpDir);
  });

  after(() => {
    proc.kill();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("lists all expected tools", async () => {
    const res = await listTools(proc, 1);
    const names: string[] = res.result.tools.map((t: any) => t.name);

    const expected = [
      "create_web_service",
      "create_router",
      "create_controller",
      "create_middleware",
      "delete_middleware",
      "rename_middleware",
      "build_service",
      "get_project_structure",
      "delete_controller",
      "delete_router",
      "rename_controller",
      "rename_router",
      "run_service",
      "dev_service",
      "stop_service",
      "generate_tests",
      "generate_spec",
      "generate_skeleton",
      "generate_config",
      "upsert_stack",
      "list_configs",
      "read_config",
      "remove_from_stack",
      "add_service_arg",
      "update_service_arg",
      "delete_service_arg",
      "update_controller_params",
      "update_controller_implementation",
      "update_middleware_implementation",
      "manage_state",
      "request",
      "view_logs",
      "add_jsdoc",
      "initialize_project_stack",
      "list_project_services",
    ];

    for (const name of expected) {
      assert.ok(names.includes(name), `Missing tool: ${name}`);
    }

    assert.equal(names.length, expected.length);
  });
});

describe("MCP server — generate_tests", () => {
  let proc: ChildProcessWithoutNullStreams;
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "swizzy-skill-tests-"));
    createMinimalProject(tmpDir);
    proc = await spawnServer(tmpDir);
  });

  afterEach(() => {
    proc.kill();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("returns helper file path on project with no controllers", async () => {
    const res = await callTool(proc, 2, "generate_tests");
    assert.equal(res.result.isError, undefined);
    const text: string = res.result.content[0].text;
    assert.ok(text.includes("Helper:"), `Unexpected response: ${text}`);
  });
});

describe("MCP server — generate_spec", () => {
  let proc: ChildProcessWithoutNullStreams;
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "swizzy-skill-spec-"));
    createMinimalProject(tmpDir);
    proc = await spawnServer(tmpDir);
  });

  afterEach(() => {
    proc.kill();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("generates a YAML spec file", async () => {
    const res = await callTool(proc, 3, "generate_spec");
    assert.equal(res.result.isError, undefined);
    const text: string = res.result.content[0].text;
    assert.ok(text.includes("openapi.yaml"), `Unexpected response: ${text}`);
    assert.ok(fs.existsSync(path.join(tmpDir, "openapi.yaml")));
  });

  it("generates a JSON spec when json=true", async () => {
    const res = await callTool(proc, 4, "generate_spec", { json: true });
    assert.equal(res.result.isError, undefined);
    assert.ok(fs.existsSync(path.join(tmpDir, "openapi.json")));
  });

  it("respects custom output path", async () => {
    const outFile = path.join(tmpDir, "docs", "api.yaml");
    const res = await callTool(proc, 5, "generate_spec", { output: outFile });
    assert.equal(res.result.isError, undefined);
    assert.ok(fs.existsSync(outFile));
  });
});

describe("MCP server — generate_skeleton", () => {
  let proc: ChildProcessWithoutNullStreams;
  let tmpDir: string;

  const MINIMAL_SPEC = {
    openapi: "3.0.0",
    info: { title: "Test API", version: "1.0.0" },
    paths: {
      "/api/widgets/list": {
        get: {
          operationId: "listWidgets",
          summary: "List widgets",
          responses: { "200": { description: "OK" } },
        },
      },
    },
  };

  beforeEach(async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "swizzy-skill-skel-"));
    proc = await spawnServer(tmpDir);
  });

  afterEach(() => {
    proc.kill();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("generates a project from a JSON spec", async () => {
    const specFile = path.join(tmpDir, "spec.json");
    const outDir = path.join(tmpDir, "generated");
    fs.writeFileSync(specFile, JSON.stringify(MINIMAL_SPEC));

    const res = await callTool(proc, 6, "generate_skeleton", {
      spec: specFile,
      output: outDir,
      name: "Widget",
    });

    assert.equal(res.result.isError, undefined);
    const text: string = res.result.content[0].text;
    assert.ok(text.includes("Widget"), `Unexpected response: ${text}`);
    assert.ok(fs.existsSync(outDir));
  });

  it("returns an error for a missing spec file", async () => {
    const res = await callTool(proc, 7, "generate_skeleton", {
      spec: "/nonexistent/spec.yaml",
    });
    const text: string = res.result.content[0].text;
    assert.ok(text.startsWith("Error:"), `Expected error, got: ${text}`);
    assert.ok(res.result.isError === true);
  });
});

describe("MCP server — request (list endpoints)", () => {
  let proc: ChildProcessWithoutNullStreams;
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "swizzy-skill-req-"));
    createMinimalProject(tmpDir);
    proc = await spawnServer(tmpDir);
  });

  afterEach(() => {
    proc.kill();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("lists endpoints when no endpoint arg provided", async () => {
    const res = await callTool(proc, 8, "request");
    assert.equal(res.result.isError, undefined);
    const text: string = res.result.content[0].text;
    assert.ok(text.includes("Available endpoints:"), `Unexpected response: ${text}`);
  });

  it("returns error for unknown endpoint label", async () => {
    const res = await callTool(proc, 9, "request", { endpoint: "GET /no/such/path" });
    assert.ok(res.result.isError === true);
    const text: string = res.result.content[0].text;
    assert.ok(text.includes("Endpoint not found"), `Unexpected response: ${text}`);
  });
});

describe("MCP server — run_service", () => {
  let proc: ChildProcessWithoutNullStreams;
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "swizzy-skill-run-"));
    fs.mkdirSync(path.join(tmpDir, "node_modules"), { recursive: true });
    proc = await spawnServer(tmpDir);
  });

  afterEach(() => {
    proc.kill();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("starts the service and returns a PID", async () => {
    const res = await callTool(proc, 10, "run_service");
    assert.equal(res.result.isError, undefined);
    const text: string = res.result.content[0].text;
    assert.ok(text.includes("PID"), `Unexpected response: ${text}`);
  });
});

describe("MCP server — dev_service", () => {
  let proc: ChildProcessWithoutNullStreams;
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "swizzy-skill-dev-"));
    fs.mkdirSync(path.join(tmpDir, "node_modules"), { recursive: true });
    proc = await spawnServer(tmpDir);
  });

  afterEach(() => {
    proc.kill();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("starts the dev server and returns a status message", async () => {
    const res = await callTool(proc, 11, "dev_service");
    assert.equal(res.result.isError, undefined);
    const text: string = res.result.content[0].text;
    assert.ok(text.toLowerCase().includes("dev server"), `Unexpected response: ${text}`);
  });
});

describe("MCP server — stop_service", () => {
  let proc: ChildProcessWithoutNullStreams;
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "swizzy-skill-stop-"));
    proc = await spawnServer(tmpDir);
  });

  afterEach(() => {
    proc.kill();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("reports no process found when port is not in use", async () => {
    const res = await callTool(proc, 12, "stop_service", { port: 19999 });
    assert.equal(res.result.isError, undefined);
    const text: string = res.result.content[0].text;
    assert.ok(text.includes("No running service found"), `Unexpected response: ${text}`);
  });

  it("reports no process found when no args given", async () => {
    const res = await callTool(proc, 13, "stop_service", {});
    assert.equal(res.result.isError, undefined);
    const text: string = res.result.content[0].text;
    assert.ok(text.includes("No running service found"), `Unexpected response: ${text}`);
  });
});

describe("MCP server — Configuration & Argument Tools", () => {
  let proc: ChildProcessWithoutNullStreams;
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "swizzy-skill-conf-"));
    createMinimalProject(tmpDir);
    proc = await spawnServer(tmpDir);
  });

  afterEach(() => {
    proc.kill();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("generate_config creates a config file", async () => {
    const res = await callTool(proc, 14, "generate_config", { cwd: tmpDir });
    assert.equal(res.result.isError, undefined);
    assert.ok(fs.existsSync(path.join(tmpDir, "web-service-config.json")));
  });

  it("upsert_stack creates a multi-service config", async () => {
    const res = await callTool(proc, 15, "upsert_stack", {
      cwd: tmpDir,
      services: [{ className: "Ext", location: "ext-pkg" }]
    });
    assert.equal(res.result.isError, undefined);
    const config = JSON.parse(fs.readFileSync(path.join(tmpDir, "web-service-config.json"), "utf-8"));
    assert.ok(config.services.Ext);
  });

  it("add_service_arg patches app.ts and configs", async () => {
    const res = await callTool(proc, 16, "add_service_arg", {
      cwd: tmpDir,
      name: "myArg",
      type: "string",
      default: "val"
    });
    assert.equal(res.result.isError, undefined);
    const app = fs.readFileSync(path.join(tmpDir, "src", "app.ts"), "utf-8");
    assert.ok(app.includes("myArg?: string;"));
  });

  it("manage_state propagates a new field", async () => {
    const res = await callTool(proc, 17, "manage_state", {
      cwd: tmpDir,
      action: "add",
      level: "service",
      name: "globalState",
      type: "boolean"
    });
    assert.equal(res.result.isError, undefined);
    const service = fs.readFileSync(path.join(tmpDir, "src", "web-service.ts"), "utf-8");
    assert.ok(service.includes("globalState: boolean;"));
  });

  it("list_configs finds the config files", async () => {
    fs.writeFileSync(path.join(tmpDir, "web-service-config.json"), "{}");
    const res = await callTool(proc, 18, "list_configs", { cwd: tmpDir });
    assert.equal(res.result.isError, undefined);
    assert.ok(res.result.content[0].text.includes("web-service-config.json"));
  });
});

describe("MCP server — update_controller_implementation", () => {
  let proc: ChildProcessWithoutNullStreams;
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "swizzy-skill-uci-"));
    createMinimalProject(tmpDir);
    proc = await spawnServer(tmpDir);
  });

  afterEach(() => {
    proc.kill();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("replaces the getInitializedController body without touching the rest of the file", async () => {
    const routerRes = await callTool(proc, 19, "create_router", { name: "Widget", path: "widgets", cwd: tmpDir });
    assert.equal(routerRes.result.isError, undefined);

    const controllerRes = await callTool(proc, 20, "create_controller", {
      name: "List",
      action: "list",
      router: "Widget",
      cwd: tmpDir,
    });
    assert.equal(controllerRes.result.isError, undefined);
    const controllerFilePath = path.join(tmpDir, "src", "routers", "WidgetRouter", "controllers", "list-controller.ts");
    assert.ok(fs.existsSync(controllerFilePath));
    const beforeSource = fs.readFileSync(controllerFilePath, "utf-8");
    assert.ok(beforeSource.includes("res.json({});"));

    const updateRes = await callTool(proc, 21, "update_controller_implementation", {
      router: "Widget",
      controller: "List",
      cwd: tmpDir,
      implementation: `return async function (req: Request, res: Response) {\n  res.json({ marker: "updated" });\n};`,
    });
    assert.equal(updateRes.result.isError, undefined);
    const text: string = updateRes.result.content[0].text;
    assert.ok(text.includes("Successfully updated implementation for controller ListController"), `Unexpected response: ${text}`);

    const afterSource = fs.readFileSync(controllerFilePath, "utf-8");
    assert.ok(afterSource.includes('marker: "updated"'));
    assert.ok(!afterSource.includes("res.json({});"));
    // Surrounding generated scaffolding (state/props interfaces) must survive untouched.
    assert.ok(afterSource.includes("ListControllerState"));
    assert.ok(afterSource.includes("ListControllerProps"));
  });

  it("errors when the controller does not exist", async () => {
    await callTool(proc, 22, "create_router", { name: "Widget", path: "widgets", cwd: tmpDir });
    const res = await callTool(proc, 23, "update_controller_implementation", {
      router: "Widget",
      controller: "NoSuchController",
      cwd: tmpDir,
      implementation: `return async function (req: Request, res: Response) { res.json({}); };`,
    });
    assert.ok(res.result.isError === true);
  });
});

describe("MCP server — update_middleware_implementation", () => {
  let proc: ChildProcessWithoutNullStreams;
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "swizzy-skill-umi-"));
    createMinimalProject(tmpDir);
    proc = await spawnServer(tmpDir);
  });

  afterEach(() => {
    proc.kill();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("replaces a middleware's handler body without touching the rest of the file", async () => {
    const routerRes = await callTool(proc, 24, "create_router", { name: "Widget", path: "widgets", cwd: tmpDir });
    assert.equal(routerRes.result.isError, undefined);

    const middlewareRes = await callTool(proc, 25, "create_middleware", {
      name: "Auth",
      router: "Widget",
      cwd: tmpDir,
    });
    assert.equal(middlewareRes.result.isError, undefined);
    const middlewareFilePath = path.join(tmpDir, "src", "routers", "WidgetRouter", "middleware", "auth-middleware.ts");
    assert.ok(fs.existsSync(middlewareFilePath));
    const beforeSource = fs.readFileSync(middlewareFilePath, "utf-8");
    assert.ok(beforeSource.includes("next();"));

    const updateRes = await callTool(proc, 26, "update_middleware_implementation", {
      router: "Widget",
      middleware: "Auth",
      cwd: tmpDir,
      implementation: `return function (req: Request, res: Response, next: NextFunction) {\n  res.locals.marker = "updated";\n  next();\n};`,
    });
    assert.equal(updateRes.result.isError, undefined);
    const text: string = updateRes.result.content[0].text;
    assert.ok(text.includes("Successfully updated implementation for middleware Auth"), `Unexpected response: ${text}`);

    const afterSource = fs.readFileSync(middlewareFilePath, "utf-8");
    assert.ok(afterSource.includes('res.locals.marker = "updated";'));
    assert.ok(afterSource.includes("SwizzyMiddlewareProps"));
  });

  it("errors when the middleware does not exist", async () => {
    await callTool(proc, 27, "create_router", { name: "Widget", path: "widgets", cwd: tmpDir });
    const res = await callTool(proc, 28, "update_middleware_implementation", {
      router: "Widget",
      middleware: "NoSuchMiddleware",
      cwd: tmpDir,
      implementation: `return function (req: Request, res: Response, next: NextFunction) { next(); };`,
    });
    assert.ok(res.result.isError === true);
  });
});

describe("MCP server — view_logs", () => {
  let proc: ChildProcessWithoutNullStreams;
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "swizzy-skill-logs-"));
    proc = await spawnServer(tmpDir);
  });

  afterEach(() => {
    proc.kill();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("reports a missing logs directory", async () => {
    const res = await callTool(proc, 29, "view_logs", { cwd: tmpDir });
    assert.equal(res.result.isError, undefined);
    const text: string = res.result.content[0].text;
    assert.ok(text.includes("Logs directory not found"), `Unexpected response: ${text}`);
  });

  it("returns the most recent lines from a log file", async () => {
    fs.mkdirSync(path.join(tmpDir, "logs"));
    const lines = Array.from({ length: 10 }, (_, i) => `log line ${i}`);
    fs.writeFileSync(path.join(tmpDir, "logs", "service.log"), lines.join("\n") + "\n");

    const res = await callTool(proc, 30, "view_logs", { cwd: tmpDir, lines: 3 });
    assert.equal(res.result.isError, undefined);
    const text: string = res.result.content[0].text;
    assert.ok(text.includes("log line 9"));
    assert.ok(text.includes("log line 7"));
    assert.ok(!text.includes("log line 6"));
  });
});

describe("MCP server — add_jsdoc", () => {
  let proc: ChildProcessWithoutNullStreams;
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "swizzy-skill-jsdoc-"));
    createMinimalProject(tmpDir);
    proc = await spawnServer(tmpDir);
  });

  afterEach(() => {
    proc.kill();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("patches router and controller files with JSDoc", async () => {
    await callTool(proc, 31, "create_router", { name: "Widget", path: "widgets", cwd: tmpDir });
    await callTool(proc, 32, "create_controller", { name: "List", action: "list", router: "Widget", cwd: tmpDir });

    const res = await callTool(proc, 33, "add_jsdoc", { cwd: tmpDir });
    assert.equal(res.result.isError, undefined);
    const text: string = res.result.content[0].text;
    assert.ok(text.includes("Patched"), `Unexpected response: ${text}`);

    const routerFile = path.join(tmpDir, "src", "routers", "WidgetRouter", "widget-router.ts");
    const controllerFile = path.join(tmpDir, "src", "routers", "WidgetRouter", "controllers", "list-controller.ts");
    assert.ok(fs.readFileSync(routerFile, "utf-8").includes("/**"), "Router file missing JSDoc");
    assert.ok(fs.readFileSync(controllerFile, "utf-8").includes("/**"), "Controller file missing JSDoc");
  });

  it("scopes to a specific router when router param is passed", async () => {
    await callTool(proc, 34, "create_router", { name: "Widget", path: "widgets", cwd: tmpDir });
    await callTool(proc, 35, "create_controller", { name: "List", action: "list", router: "Widget", cwd: tmpDir });

    const res = await callTool(proc, 36, "add_jsdoc", { cwd: tmpDir, router: "Widget" });
    assert.equal(res.result.isError, undefined);
    const text: string = res.result.content[0].text;
    assert.ok(text.includes("Patched"), `Unexpected response: ${text}`);
  });

  it("returns an error for a non-swizzy project", async () => {
    const bareDir = fs.mkdtempSync(path.join(os.tmpdir(), "swizzy-bare-"));
    try {
      const res = await callTool(proc, 37, "add_jsdoc", { cwd: bareDir });
      assert.ok(res.result.isError === true, "Expected an error for non-swizzy project");
    } finally {
      fs.rmSync(bareDir, { recursive: true, force: true });
    }
  });
});
