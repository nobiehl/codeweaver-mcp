#!/usr/bin/env node

import { isMCPMode } from './utils/mode-detector.js';
import { startCLI } from './cli/index.js';
import { startMCPServer } from './mcp/index.js';
import { SystemCheckAgent } from './core/agents/systemCheck.js';
import chalk from 'chalk';

async function main() {
  // Quick system check on startup (only critical dependencies)
  // Skip for MCP mode to avoid polluting stdio
  if (!isMCPMode()) {
    await runStartupCheck();
  }

  if (isMCPMode()) {
    // MCP Server Mode (stdio)
    await startMCPServer();
  } else {
    // CLI Mode (Terminal)
    await startCLI();
  }
}

/**
 * Run quick system check on startup
 * Only checks critical dependencies (Node.js, Git)
 */
async function runStartupCheck(): Promise<void> {
  const agent = new SystemCheckAgent();
  const result = await agent.runQuickCheck();

  // Only show warnings/errors, not full check details
  if (!result.allPassed) {
    console.error(chalk.red('⚠ System Check Failed\n'));

    for (const error of result.errors) {
      console.error(chalk.red(`  ✗ ${error}`));
    }

    console.error(chalk.dim(`\nRun '${chalk.cyan('codeweaver doctor')}' for detailed system check.\n`));

    // Don't exit - let user continue, but warn them
    // process.exit(1); // Commented out to allow usage with missing optional deps
  }

  // Show warnings but don't block
  if (result.warnings.length > 0 && process.env.CODEWEAVER_VERBOSE === '1') {
    console.warn(chalk.yellow('\n⚠ Warnings:'));
    for (const warning of result.warnings) {
      console.warn(chalk.yellow(`  ${warning}`));
    }
    console.warn(chalk.dim(`\nRun '${chalk.cyan('codeweaver doctor')}' for more details.\n`));
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
