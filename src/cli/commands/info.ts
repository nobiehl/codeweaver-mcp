import { Command } from 'commander';
import type { CodeWeaverService } from '../../core/service.js';

export function infoCommands(program: Command, service: CodeWeaverService) {
  program
    .command('info')
    .description('Show project information')
    .action(async () => {
      try {
        console.log('🕸️  CodeWeaver - Analyzing project...\n');

        const meta = await service.getUnifiedProjectMetadata();

        if (!meta) {
          console.log('No project detected in current directory.');
          console.log('Supported project types: Gradle, npm, pip, Maven, Cargo, etc.');
          return;
        }

        console.log('Project Information:');
        console.log(`  Name:         ${meta.name}`);
        console.log(`  Version:      ${meta.version || 'N/A'}`);
        console.log(`  Root:         ${meta.root}`);
        console.log(`  Type:         ${meta.projectType}`);
        console.log(`  Build Tool:   ${meta.buildTool}`);
        console.log(`  Languages:    ${meta.languages.join(', ')}`);
        console.log(`  Dependencies: ${meta.dependencies.length}`);

        if (meta.devDependencies && meta.devDependencies.length > 0) {
          console.log(`  Dev Deps:     ${meta.devDependencies.length}`);
        }

        if (meta.modules && meta.modules.length > 0) {
          console.log(`  Modules:      ${meta.modules.length}`);
        }

        // Show project-specific metadata
        if (meta.metadata) {
          if (meta.metadata.javaVersion) {
            console.log(`  Java:         ${meta.metadata.javaVersion}`);
          }
          if (meta.metadata.gradleVersion) {
            console.log(`  Gradle:       ${meta.metadata.gradleVersion}`);
          }
          if (meta.metadata.nodeVersion) {
            console.log(`  Node:         ${meta.metadata.nodeVersion}`);
          }
          if (meta.metadata.packageManager) {
            console.log(`  Pkg Manager:  ${meta.metadata.packageManager}`);
          }
        }

      } catch (error) {
        console.error('Error:', (error as Error).message);
        process.exit(1);
      }
    });
}
