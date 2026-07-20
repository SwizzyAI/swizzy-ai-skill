import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { spawn, ChildProcessWithoutNullStreams } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const SERVER_ENTRY = path.resolve("dist/index.js");

function encodeMessage(message: any): string {
  return JSON.stringify(message) + "\n";
}

async function callTool(proc: ChildProcessWithoutNullStreams, id: number, name: string, args: any = {}): Promise<any> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      proc.stdout.off("data", onData);
      reject(new Error(`Timeout waiting for tool ${name} response (id: ${id})`));
    }, 10000);

    const onData = (data: Buffer) => {
      const messages = data.toString().split("\n").filter(Boolean);
      for (const msg of messages) {
        try {
          const json = JSON.parse(msg);
          if (json.id === id) {
            clearTimeout(timeout);
            proc.stdout.off("data", onData);
            resolve(json);
          }
        } catch (e) {}
      }
    };
    proc.stdout.on("data", onData);
    proc.stdin.write(encodeMessage({
      jsonrpc: "2.0",
      id,
      method: "tools/call",
      params: { name, arguments: args }
    }));
  });
}

async function spawnServer(cwd: string): Promise<ChildProcessWithoutNullStreams> {
  const proc = spawn("node", [SERVER_ENTRY], {
    cwd,
    env: { ...process.env, NPM_CONFIG_REGISTRY: "https://registry.npmjs.org/" }
  });

  // Perform MCP handshake
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Handshake timeout")), 5000);
    const onData = (data: Buffer) => {
      const messages = data.toString().split("\n").filter(Boolean);
      for (const msg of messages) {
        try {
          const json = JSON.parse(msg);
          if (json.id === 0) {
            clearTimeout(timeout);
            proc.stdout.off("data", onData);
            resolve(true);
          }
        } catch (e) {}
      }
    };
    proc.stdout.on("data", onData);
    proc.stdin.write(encodeMessage({
      jsonrpc: "2.0",
      id: 0,
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: { name: "test-client", version: "0.0.0" },
      }
    }));
  });

  proc.stdin.write(encodeMessage({ jsonrpc: "2.0", method: "notifications/initialized" }));
  
  return proc;
}

describe("AI Skill E2E Workflow", () => {
  let tmpDir: string;
  let proc: ChildProcessWithoutNullStreams;

  beforeEach(async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "swizzy-skill-e2e-"));
    proc = await spawnServer(tmpDir);
  });

  afterEach(() => {
    proc.kill();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("performs a complex architectural workflow via MCP", async () => {
    // 1. Create Web Service
    const createRes = await callTool(proc, 1, "create_web_service", {
      name: "McpApp",
      cwd: tmpDir,
      install: true
    });
    if (!createRes.result) {
       throw new Error(`Tool call failed: ${JSON.stringify(createRes)}`);
    }
    assert.equal(createRes.result.isError, undefined, `Create failed: ${JSON.stringify(createRes.result)}`);
    const projectDir = path.join(tmpDir, "mcp-app-web-service");

    // 2. Add Router
    const routerRes = await callTool(proc, 2, "create_router", {
      name: "Core",
      path: "/core",
      cwd: projectDir
    });
    assert.equal(routerRes.result.isError, undefined);

    // 3. Add Dual-Param Controller
    const ctrlRes = await callTool(proc, 3, "create_controller", {
      name: "Update",
      action: "edit",
      method: "put",
      router: "Core",
      body: true,
      query: true,
      cwd: projectDir
    });
    assert.equal(ctrlRes.result.isError, undefined);

    // 4. Manage State with Propagation
    const stateRes = await callTool(proc, 4, "manage_state", {
      action: "add",
      level: "controller",
      router: "Core",
      controller: "Update",
      name: "lastUpdate",
      type: "number",
      default: "Date.now()",
      cwd: projectDir
    });
    assert.equal(stateRes.result.isError, undefined);

    // 5. Verify Propagation
    const ctrlSrc = fs.readFileSync(path.join(projectDir, "src/routers/CoreRouter/controllers/update-controller.ts"), "utf-8");
    assert.ok(ctrlSrc.includes("lastUpdate: number;"));
    assert.ok(fs.readFileSync(path.join(projectDir, "src/app.ts"), "utf-8").includes("lastUpdate: Date.now()"));

    // 6. Update Controller Params (Add more fields)
    const paramRes = await callTool(proc, 5, "update_controller_params", {
      router: "Core",
      controller: "Update",
      bodyFields: [{ name: "metadata", type: "object" }],
      cwd: projectDir
    });
    assert.equal(paramRes.result.isError, undefined);
    assert.ok(fs.readFileSync(path.join(projectDir, "src/routers/CoreRouter/controllers/update-controller.ts"), "utf-8").includes("metadata: object;"));
  });
});
