import { Command } from 'commander';
import type { CodeWeaverService } from '../../core/service.js';

export function createAnalysisCommand(service: CodeWeaverService): Command {
  const cmd = new Command('analysis');
  cmd.description('Code quality and complexity analysis');

  // analysis file <path>
  cmd
    .command('file <path>')
    .description('Analyze a single file for complexity and metrics')
    .action(async (filePath: string) => {
      try {
        console.log(`Analyzing file: ${filePath}...\n`);
        const result = await service.analyzeFile(filePath);

        console.log('=== File Analysis ===\n');
        console.log(`File: ${result.filePath}`);
        if (result.className) {
          console.log(`Class: ${result.className}`);
        }
        if (result.packageName) {
          console.log(`Package: ${result.packageName}`);
        }
        console.log(`Class Complexity: ${result.classComplexity}`);
        console.log();

        console.log('=== Code Metrics ===');
        console.log(`Total Lines: ${result.metrics.totalLines}`);
        console.log(`Code Lines: ${result.metrics.codeLines}`);
        console.log(`Comment Lines: ${result.metrics.commentLines}`);
        console.log(`Blank Lines: ${result.metrics.blankLines}`);
        console.log();

        if (result.imports.length > 0) {
          console.log(`=== Imports (${result.imports.length}) ===`);
          result.imports.slice(0, 10).forEach(imp => console.log(`  - ${imp}`));
          if (result.imports.length > 10) {
            console.log(`  ... and ${result.imports.length - 10} more`);
          }
          console.log();
        }

        if (result.methods.length > 0) {
          console.log(`=== Methods (${result.methods.length}) ===`);
          result.methods.forEach(method => {
            console.log(`\n${method.name}:`);
            console.log(`  Complexity: ${method.complexity}`);
            console.log(`  Lines: ${method.lines}`);
            console.log(`  Parameters: ${method.parameters}`);
            if (method.calls && method.calls.length > 0) {
              console.log(`  Calls: ${method.calls.join(', ')}`);
            }
          });
        }
      } catch (error) {
        console.error('Error:', (error as Error).message);
        process.exit(1);
      }
    });

  // analysis project
  cmd
    .command('project')
    .description('Analyze entire project for complexity statistics')
    .option('--top <n>', 'Show top N most complex files', '10')
    .action(async (options: any) => {
      try {
        console.log('Analyzing project...\n');
        const result = await service.analyzeProject();

        console.log('=== Project Analysis ===\n');
        console.log(`Total Files: ${result.totalFiles}`);
        console.log(`Total Methods: ${result.totalMethods}`);
        console.log(`Total Lines: ${result.totalLines}`);
        console.log(`Total Complexity: ${result.totalComplexity}`);
        console.log(`Average Complexity: ${result.averageComplexity.toFixed(2)}`);
        console.log();

        const topN = parseInt(options.top, 10);
        if (result.mostComplexFiles.length > 0) {
          console.log(`=== Top ${Math.min(topN, result.mostComplexFiles.length)} Most Complex Files ===`);
          result.mostComplexFiles.slice(0, topN).forEach((file, index) => {
            console.log(`${index + 1}. ${file.file} (complexity: ${file.complexity})`);
          });
        }
      } catch (error) {
        console.error('Error:', (error as Error).message);
        process.exit(1);
      }
    });

  // analysis complexity <path>
  cmd
    .command('complexity <path>')
    .description('Show complexity breakdown for a file')
    .action(async (filePath: string) => {
      try {
        const result = await service.analyzeFile(filePath);

        console.log(`\n=== Complexity Breakdown for ${filePath} ===\n`);
        console.log(`Class Complexity: ${result.classComplexity}\n`);

        if (result.methods.length === 0) {
          console.log('No methods found.');
          return;
        }

        // Sort by complexity descending
        const sorted = [...result.methods].sort((a, b) => b.complexity - a.complexity);

        console.log('Methods (sorted by complexity):');
        sorted.forEach(method => {
          const bar = '█'.repeat(Math.min(method.complexity, 20));
          console.log(`${method.name.padEnd(30)} ${bar} ${method.complexity}`);
        });
      } catch (error) {
        console.error('Error:', (error as Error).message);
        process.exit(1);
      }
    });

  return cmd;
}
