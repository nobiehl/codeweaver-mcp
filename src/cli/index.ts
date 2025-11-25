#!/usr/bin/env node

import { Command } from 'commander';
import { CodeWeaverService } from '../core/service.js';
import { infoCommands } from './commands/info.js';
import { fileCommands } from './commands/file.js';
import { createSymbolsCommand } from './commands/symbols.js';
import { createSearchCommand } from './commands/search.js';
import { createAnalysisCommand } from './commands/analysis.js';
import { createVCSCommand } from './commands/vcs.js';
import { createWatchCommand } from './commands/watch.js';
import { createDoctorCommand } from './commands/doctor.js';

export async function startCLI() {
  const program = new Command();

  program
    .name('codeweaver')
    .description('🕸️  CodeWeaver - Weaving Java Code Intelligence')
    .version('0.1.0');

  // Initialize Service
  const service = new CodeWeaverService(process.cwd());

  // Register Command Groups
  infoCommands(program, service);
  fileCommands(program, service);
  program.addCommand(createSymbolsCommand(service));
  program.addCommand(createSearchCommand(service));
  program.addCommand(createAnalysisCommand(service));
  program.addCommand(createVCSCommand(service));
  program.addCommand(createWatchCommand(service)); // NEW: File Watcher
  program.addCommand(createDoctorCommand()); // NEW: System Check

  // Parse & Execute
  await program.parseAsync(process.argv);
}
