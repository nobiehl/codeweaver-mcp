import { Command } from 'commander';
import type { CodeWeaverService } from '../../core/service.js';

export function createSymbolsCommand(service: CodeWeaverService): Command {
  const cmd = new Command('symbols');
  cmd.description('Symbol indexing and search');

  // symbols index
  cmd
    .command('index')
    .description('Index entire project and extract symbols')
    .action(async () => {
      try {
        console.log('Indexing project...');
        const result = await service.buildIndex();

        console.log('\n=== Index Results ===');
        console.log(`Files indexed: ${result.files.length}`);
        console.log(`Total symbols: ${result.symbols.length}`);
        console.log(`Classes found: ${result.classes.length}`);
        console.log('\n=== Classes ===');
        result.classes.forEach(cls => console.log(`  - ${cls}`));
      } catch (error) {
        console.error('Error:', (error as Error).message);
        process.exit(1);
      }
    });

  // symbols find <name>
  cmd
    .command('find <name>')
    .description('Find symbols by name (case-insensitive substring match)')
    .action(async (name: string) => {
      try {
        const symbols = service.findSymbolsByName(name);

        if (symbols.length === 0) {
          console.log(`No symbols found matching "${name}"`);
          return;
        }

        console.log(`\n=== Found ${symbols.length} symbol(s) matching "${name}" ===\n`);
        symbols.forEach(symbol => {
          console.log(`${symbol.kind.toUpperCase()}: ${symbol.qualifiedName}`);
          console.log(`  Location: ${symbol.location.path}:${symbol.location.startLine}`);
          console.log(`  Signature: ${symbol.signature}`);
          console.log();
        });
      } catch (error) {
        console.error('Error:', (error as Error).message);
        process.exit(1);
      }
    });

  // symbols get <qualifiedName>
  cmd
    .command('get <qualifiedName>')
    .description('Get symbol by qualified name (e.g., com.example.MyClass#myMethod)')
    .action(async (qualifiedName: string) => {
      try {
        const symbol = service.getSymbol(qualifiedName);

        if (!symbol) {
          console.log(`Symbol not found: ${qualifiedName}`);
          return;
        }

        console.log('\n=== Symbol Details ===\n');
        console.log(`Kind: ${symbol.kind}`);
        console.log(`Name: ${symbol.name}`);
        console.log(`Qualified Name: ${symbol.qualifiedName}`);
        console.log(`Location: ${symbol.location.path}:${symbol.location.startLine}`);
        console.log(`Signature: ${symbol.signature}`);
        console.log(`Visibility: ${symbol.visibility}`);
        console.log(`Modifiers: ${symbol.modifiers.join(', ')}`);

        if (symbol.annotations && symbol.annotations.length > 0) {
          console.log(`Annotations: ${symbol.annotations.join(', ')}`);
        }

        if (symbol.parameters && symbol.parameters.length > 0) {
          console.log(`Parameters: ${symbol.parameters.length}`);
        }
      } catch (error) {
        console.error('Error:', (error as Error).message);
        process.exit(1);
      }
    });

  // symbols list <kind>
  cmd
    .command('list <kind>')
    .description('List all symbols of a specific kind (class, method, field, constructor)')
    .action(async (kind: string) => {
      try {
        if (!['class', 'method', 'field', 'constructor'].includes(kind)) {
          console.error('Invalid kind. Must be one of: class, method, field, constructor');
          process.exit(1);
        }

        const symbols = service.findSymbolsByKind(kind as 'class' | 'method' | 'field' | 'constructor');

        if (symbols.length === 0) {
          console.log(`No ${kind}s found`);
          return;
        }

        console.log(`\n=== Found ${symbols.length} ${kind}(s) ===\n`);
        symbols.forEach(symbol => {
          console.log(`${symbol.qualifiedName} (${symbol.location.path}:${symbol.location.startLine})`);
        });
      } catch (error) {
        console.error('Error:', (error as Error).message);
        process.exit(1);
      }
    });

  return cmd;
}
