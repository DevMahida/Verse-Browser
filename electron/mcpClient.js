const fs = require('fs');
const { spawn } = require('child_process');
const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio.js');

class McpClientManager {
  constructor(configPath) {
    this.configPath = configPath;
    this.config = { servers: {} };
    this.clients = new Map(); // serverName → { client, transport, process, tools }
  }

  async loadConfig() {
    try {
      if (fs.existsSync(this.configPath)) {
        const data = fs.readFileSync(this.configPath, 'utf-8');
        this.config = JSON.parse(data);
      } else {
        // Create default config
        this.config = {
          servers: {
            "filesystem": {
              "command": process.platform === "win32" ? "npx.cmd" : "npx",
              "args": ["-y", "@modelcontextprotocol/server-filesystem", require('os').homedir()],
              "env": {},
              "enabled": false
            }
          }
        };
        this.saveConfig();
      }

      // Auto-connect enabled servers
      for (const [name, serverConfig] of Object.entries(this.config.servers)) {
        if (serverConfig.enabled) {
          try {
            await this.connectServer(name, serverConfig);
          } catch (e) {
            console.error(`[MCP Client] Failed to auto-connect server ${name}:`, e.message);
          }
        }
      }
    } catch (e) {
      console.error('[MCP Client] Error loading config:', e);
    }
  }

  saveConfig() {
    try {
      fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
    } catch (e) {
      console.error('[MCP Client] Error saving config:', e);
    }
  }

  async connectServer(name, config) {
    if (this.clients.has(name)) {
      await this.disconnectServer(name);
    }

    console.log(`[MCP Client] Connecting to server '${name}'...`);
    const env = { ...process.env, ...(config.env || {}) };
    
    // Some npx commands require PATH
    if (!env.PATH) env.PATH = process.env.PATH;

    const child = spawn(config.command, config.args || [], {
      env,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    child.on('error', (err) => {
      console.error(`[MCP Client] Process error for ${name}:`, err);
    });

    const transport = new StdioClientTransport({
      command: config.command,
      args: config.args || [],
    }, child.stdin, child.stdout);

    const client = new Client({ name: "verse-browser-client", version: "1.0.0" }, {
      capabilities: { tools: {} }
    });

    await client.connect(transport);

    // List tools and cache them
    const toolsResponse = await client.listTools();
    const tools = toolsResponse.tools || [];

    this.clients.set(name, {
      client,
      transport,
      process: child,
      tools
    });

    console.log(`[MCP Client] Connected to '${name}' (${tools.length} tools)`);
  }

  async disconnectServer(name) {
    const entry = this.clients.get(name);
    if (entry) {
      console.log(`[MCP Client] Disconnecting from server '${name}'`);
      try { await entry.client.close(); } catch (e) {}
      try { await entry.transport.close(); } catch (e) {}
      if (entry.process) {
        entry.process.kill();
      }
      this.clients.delete(name);
    }
  }

  async listServers() {
    const result = [];
    for (const [name, config] of Object.entries(this.config.servers)) {
      const entry = this.clients.get(name);
      result.push({
        name,
        command: config.command,
        args: config.args,
        enabled: config.enabled,
        status: entry ? 'connected' : 'disconnected',
        toolCount: entry ? entry.tools.length : 0
      });
    }
    return result;
  }

  async listTools(serverName) {
    const entry = this.clients.get(serverName);
    if (!entry) throw new Error(`Server '${serverName}' is not connected`);
    return entry.tools;
  }

  async callTool(serverName, toolName, args) {
    const entry = this.clients.get(serverName);
    if (!entry) throw new Error(`Server '${serverName}' is not connected`);
    
    console.log(`[MCP Client] Calling tool ${serverName}.${toolName}(${JSON.stringify(args)})`);
    const result = await entry.client.callTool({
      name: toolName,
      arguments: args
    });
    return result;
  }

  async addServer(name, config) {
    this.config.servers[name] = config;
    this.saveConfig();
    if (config.enabled) {
      await this.connectServer(name, config);
    }
  }

  async removeServer(name) {
    await this.disconnectServer(name);
    delete this.config.servers[name];
    this.saveConfig();
  }
  
  async toggleServer(name, enabled) {
    const config = this.config.servers[name];
    if (!config) throw new Error(`Server ${name} not found`);
    config.enabled = enabled;
    this.saveConfig();
    
    if (enabled) {
      await this.connectServer(name, config);
    } else {
      await this.disconnectServer(name);
    }
  }
}

module.exports = McpClientManager;
