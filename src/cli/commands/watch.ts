import { Command } from 'commander';
import type { CodeWeaverService } from '../../core/service.js';
import { FileWatcherAgent } from '../../core/agents/watcher.js';
import chalk from 'chalk';

export function createWatchCommand(service: CodeWeaverService): Command {
  const cmd = new Command('watch');
  cmd.description('Watch for file changes and update semantic index automatically');

  cmd
    .option('--debounce <ms>', 'Debounce time in milliseconds', '2000')
    .option('--code-only', 'Watch only code files (Java, TypeScript, etc.)')
    .option('--docs-only', 'Watch only documentation files (Markdown, etc.)')
    .action(async (options: any) => {
      try {
        // Determine patterns based on options
        let patterns: string[] = [];

        if (options.codeOnly) {
          patterns = ['**/*.java', '**/*.ts', '**/*.js', '**/*.py', '**/*.go', '**/*.rs', '**/*.kt', '**/*.cs', '**/*.cpp', '**/*.c', '**/*.h'];
        } else if (options.docsOnly) {
          patterns = ['**/*.md', '**/*.markdown', '**/*.txt', '**/*.rst', '**/*.adoc'];
        } else {
          // Default: watch both
          patterns = [
            '**/*.java', '**/*.ts', '**/*.js', '**/*.py', '**/*.go', '**/*.rs', '**/*.kt', '**/*.cs', '**/*.cpp', '**/*.c', '**/*.h',
            '**/*.md', '**/*.markdown', '**/*.txt', '**/*.rst', '**/*.adoc'
          ];
        }

        // Get semantic agent from service
        const semanticAgent = (service as any).semanticAgent;
        if (!semanticAgent) {
          console.error(chalk.red('Error: Semantic agent not available'));
          process.exit(1);
        }

        // Create and start watcher
        const watcher = new FileWatcherAgent(
          (service as any).projectRoot,
          semanticAgent,
          parseInt(options.debounce)
        );

        await watcher.start(patterns);

        // Graceful shutdown on Ctrl+C
        process.on('SIGINT', async () => {
          console.log('\n\n' + chalk.yellow('Shutting down watcher...'));
          await watcher.stop();
          process.exit(0);
        });

        // Keep process alive
        await new Promise(() => {});
      } catch (error) {
        console.error(chalk.red('Error:'), (error as Error).message);
        process.exit(1);
      }
    });

  return cmd;
}
