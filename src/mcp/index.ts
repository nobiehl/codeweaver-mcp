#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CodeWeaverService } from '../core/service.js';
import { registerTools } from './tools.js';

export async function startMCPServer() {
  // Initialize Service
  const service = new CodeWeaverService(process.cwd());

  // Create MCP Server
  const server = new Server(
    {
      name: 'codeweaver',
      version: '0.1.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Register Tools
  registerTools(server, service);

  // Start Server (stdio)
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('CodeWeaver MCP Server running on stdio');
}
