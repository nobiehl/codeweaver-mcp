import { Command } from 'commander';
import type { CodeWeaverService } from '../../core/service.js';

export function infoCommands(program: Command, service: CodeWeaverService) {
  program
    .command('info')
    .description('Show project information')
    .action(async () => {
      try {
        console.log('🕸️  CodeWeaver - Analyzing project...\n');

        const meta = await service.getProjectMetadata();

        console.log('Project Information:');
        console.log(`  Name:         ${meta.name}`);
        console.log(`  Root:         ${meta.root}`);
        console.log(`  Build System: ${meta.buildSystem}`);
        console.log(`  Java Version: ${meta.javaVersion}`);
        console.log(`  Gradle:       ${meta.gradleVersion}`);
        console.log(`  Modules:      ${meta.moduleCount}`);
        console.log(`  Dependencies: ${meta.dependencies.length}`);
        console.log(`  Wrapper:      ${meta.gradleWrapperPresent ? '✓' : '✗'}`);

      } catch (error) {
        console.error('Error:', (error as Error).message);
        process.exit(1);
      }
    });
}
