#!/usr/bin/env node

import { isMCPMode } from './utils/mode-detector.js';
import { startCLI } from './cli/index.js';
import { startMCPServer } from './mcp/index.js';

async function main() {
  if (isMCPMode()) {
    // MCP Server Mode (stdio)
    await startMCPServer();
  } else {
    // CLI Mode (Terminal)
    await startCLI();
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
