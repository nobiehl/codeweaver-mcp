import { Command } from 'commander';
import type { CodeWeaverService } from '../../core/service.js';
import chalk from 'chalk';
import ora from 'ora';

export function createSearchCommand(service: CodeWeaverService): Command {
  const cmd = new Command('search');
  cmd.description('Search for code patterns and files');

  // search keyword <keyword>
  cmd
    .command('keyword <keyword>')
    .description('Search for keyword in files')
    .option('-i, --case-insensitive', 'Case-insensitive search')
    .option('-m, --max-results <number>', 'Maximum number of results', '100')
    .option('-c, --context <lines>', 'Number of context lines', '0')
    .option('-e, --extensions <exts...>', 'Filter by file extensions (e.g., .java .ts)')
    .action(async (keyword: string, options: any) => {
      try {
        const results = await service.searchKeyword(keyword, {
          caseSensitive: !options.caseInsensitive,
          maxResults: parseInt(options.maxResults),
          contextLines: parseInt(options.context),
          fileExtensions: options.extensions,
        });

        if (results.length === 0) {
          console.log(`No matches found for "${keyword}"`);
          return;
        }

        console.log(`\n=== Found ${results.length} match(es) for "${keyword}" ===\n`);

        results.forEach(result => {
          console.log(`${result.file}:${result.line}:${result.column}`);
          if (result.beforeContext && result.beforeContext.length > 0) {
            result.beforeContext.forEach(ctx => console.log(`  ${ctx}`));
          }
          console.log(`> ${result.content}`);
          if (result.afterContext && result.afterContext.length > 0) {
            result.afterContext.forEach(ctx => console.log(`  ${ctx}`));
          }
          console.log();
        });
      } catch (error) {
        console.error('Error:', (error as Error).message);
        process.exit(1);
      }
    });

  // search files <pattern>
  cmd
    .command('files <pattern>')
    .description('Find files by name pattern (supports * and ?)')
    .action(async (pattern: string) => {
      try {
        const files = await service.findFiles(pattern);

        if (files.length === 0) {
          console.log(`No files found matching pattern "${pattern}"`);
          return;
        }

        console.log(`\n=== Found ${files.length} file(s) matching "${pattern}" ===\n`);
        files.forEach(file => console.log(`  ${file}`));
      } catch (error) {
        console.error('Error:', (error as Error).message);
        process.exit(1);
      }
    });

  // search semantic <query>
  cmd
    .command('semantic <query>')
    .description('Search code/docs semantically by meaning/intent (AI-powered)')
    .option('-l, --limit <number>', 'Maximum number of results', '10')
    .option('-c, --collection <type>', 'Collection to search: code, docs, or all', 'all')
    .option('--index', 'Build semantic index first')
    .option('--index-collection <type>', 'Collection to index: code, docs, or all', 'all')
    .action(async (query: string, options: any) => {
      try {
        // Build index if requested
        if (options.index) {
          const indexCollection = options.indexCollection || 'all';
          const spinner = ora(`Building semantic index for ${indexCollection}...`).start();
          try {
            const result = await service.buildSemanticIndex({ collection: indexCollection as any });
            spinner.succeed(`Indexed ${result.indexed} files into ${result.chunks} chunks`);
          } catch (error) {
            spinner.fail('Failed to build index');
            throw error;
          }
        }

        // Search
        const collection = options.collection || 'all';
        const spinner = ora(`Searching ${collection} for: "${query}"`).start();
        const results = await service.searchSemantic(query, parseInt(options.limit), collection);
        spinner.stop();

        if (results.length === 0) {
          console.log(chalk.yellow(`\nNo semantic matches found for "${query}" in ${collection}`));
          console.log(chalk.gray('Tip: Try building the index first with --index flag'));
          return;
        }

        console.log(chalk.bold(`\n=== Found ${results.length} semantic match(es) for "${query}" in ${collection} ===\n`));

        results.forEach((result, i) => {
          const similarity = (result.similarity * 100).toFixed(1);
          const color = result.similarity > 0.5 ? chalk.green : result.similarity > 0.4 ? chalk.yellow : chalk.gray;
          const collectionBadge = result.collection === 'code' ? chalk.blue('[CODE]') : chalk.magenta('[DOCS]');

          console.log(`${i + 1}. ${collectionBadge} ${chalk.cyan(result.file)}:${result.startLine}-${result.endLine}`);
          console.log(`   Similarity: ${color(similarity + '%')}`);
          console.log(`   Preview: ${result.content.substring(0, 80).replace(/\n/g, ' ')}...`);
          console.log();
        });
      } catch (error) {
        console.error(chalk.red('Error:'), (error as Error).message);
        if ((error as Error).message.includes('No semantic index found') || (error as Error).message.includes('No') && (error as Error).message.includes('index found')) {
          console.log(chalk.gray('\nTip: Run with --index flag to build the semantic index first:'));
          console.log(chalk.gray(`  codeweaver search semantic "<query>" --index --index-collection ${options.collection || 'all'}`));
        }
        process.exit(1);
      }
    });

  return cmd;
}
