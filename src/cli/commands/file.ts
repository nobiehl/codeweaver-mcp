import { Command } from 'commander';
import type { CodeWeaverService } from '../../core/service.js';

export function fileCommands(program: Command, service: CodeWeaverService) {
  const fileCmd = program.command('file').description('File operations');

  fileCmd
    .command('read <path>')
    .description('Read file content')
    .option('-l, --limit <tokens>', 'Max tokens (default: 10000)', parseInt)
    .option('-n, --numbers', 'Show line numbers')
    .action(async (path: string, options: { limit?: number; numbers?: boolean }) => {
      try {
        let content: string | null;

        if (options.numbers) {
          content = await service.readFileWithLineNumbers(path);
        } else if (options.limit) {
          content = await service.readFileWithLimit(path, options.limit);
        } else {
          content = await service.readFile(path);
        }

        if (content === null) {
          console.error(`File not found: ${path}`);
          process.exit(1);
        }

        console.log(content);
      } catch (error) {
        console.error('Error reading file:', (error as Error).message);
        process.exit(1);
      }
    });

  fileCmd
    .command('range <path> <start> <end>')
    .description('Read line range from file (1-indexed)')
    .action(async (path: string, start: string, end: string) => {
      try {
        const startLine = parseInt(start);
        const endLine = parseInt(end);

        if (isNaN(startLine) || isNaN(endLine)) {
          console.error('Start and end must be numbers');
          process.exit(1);
        }

        const content = await service.readLines(path, startLine, endLine);
        console.log(content);
      } catch (error) {
        console.error('Error reading file range:', (error as Error).message);
        process.exit(1);
      }
    });

  fileCmd
    .command('context <path> <line>')
    .description('Get context around a specific line')
    .option('-c, --context <lines>', 'Context lines (default: 5)', parseInt)
    .action(async (path: string, line: string, options: { context?: number }) => {
      try {
        const lineNumber = parseInt(line);

        if (isNaN(lineNumber)) {
          console.error('Line number must be a number');
          process.exit(1);
        }

        const content = await service.getContextAroundLine(path, lineNumber, options.context);
        console.log(content);
      } catch (error) {
        console.error('Error getting context:', (error as Error).message);
        process.exit(1);
      }
    });
}
