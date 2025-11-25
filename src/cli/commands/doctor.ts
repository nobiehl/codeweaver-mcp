import { Command } from 'commander';
import chalk from 'chalk';
import { SystemCheckAgent } from '../../core/agents/systemCheck.js';
import type { DependencyCheck } from '../../types/system.js';

export function createDoctorCommand(): Command {
  const command = new Command('doctor');

  command
    .description('Check system dependencies and configuration')
    .option('-q, --quick', 'Run quick check (only critical dependencies)')
    .action(async (options: { quick?: boolean }) => {
      console.log(chalk.bold.cyan('\n🔍 CodeWeaver System Check\n'));

      const agent = new SystemCheckAgent();
      const result = options.quick
        ? await agent.runQuickCheck()
        : await agent.runFullCheck();

      // Print header
      if (options.quick) {
        console.log(chalk.dim('Running quick check (critical dependencies only)...\n'));
      } else {
        console.log(chalk.dim('Running full system check...\n'));
      }

      // Print checks
      for (const check of result.checks) {
        printCheck(check);
      }

      // Print summary
      console.log('\n' + chalk.bold('Summary:'));
      console.log(chalk.dim('─'.repeat(60)));

      if (result.allPassed) {
        console.log(chalk.green('✓ All critical dependencies are installed'));
      } else {
        console.log(chalk.red(`✗ ${result.errors.length} critical issue(s) found`));
      }

      if (result.warnings.length > 0) {
        console.log(chalk.yellow(`⚠ ${result.warnings.length} warning(s)`));
      }

      // Print errors
      if (result.errors.length > 0) {
        console.log('\n' + chalk.bold.red('Errors:'));
        for (const error of result.errors) {
          console.log(chalk.red(`  ✗ ${error}`));
        }
      }

      // Print warnings
      if (result.warnings.length > 0) {
        console.log('\n' + chalk.bold.yellow('Warnings:'));
        for (const warning of result.warnings) {
          console.log(chalk.yellow(`  ⚠ ${warning}`));
        }
      }

      // Print recommendations
      if (!result.allPassed || result.warnings.length > 0) {
        console.log('\n' + chalk.bold('Recommendations:'));
        printRecommendations(result.checks);
      }

      console.log(''); // Empty line

      // Exit with error code if critical issues found
      if (!result.allPassed) {
        process.exit(1);
      }
    });

  return command;
}

/**
 * Print single dependency check
 */
function printCheck(check: DependencyCheck): void {
  const icon = check.installed
    ? (check.error ? chalk.yellow('⚠') : chalk.green('✓'))
    : chalk.red('✗');

  const name = check.required
    ? chalk.bold(check.name)
    : chalk.dim(check.name + ' (optional)');

  const status = check.installed
    ? chalk.green('installed')
    : chalk.red('not found');

  const version = check.version
    ? chalk.dim(`v${check.version}`)
    : '';

  const expected = check.expectedVersion && !check.installed
    ? chalk.dim(`(need ${check.expectedVersion})`)
    : '';

  console.log(`${icon} ${name}: ${status} ${version} ${expected}`.trim());

  // Print path if available
  if (check.path) {
    console.log(chalk.dim(`    → ${check.path}`));
  }

  // Print error inline if present
  if (check.error && check.installed) {
    console.log(chalk.yellow(`    ⚠ ${check.error}`));
  }
}

/**
 * Print installation recommendations
 */
function printRecommendations(checks: DependencyCheck[]): void {
  const missing = checks.filter(c => !c.installed && c.required);
  const outdated = checks.filter(c => c.installed && c.error && c.required);

  if (missing.length > 0) {
    console.log(chalk.dim('\n  Missing dependencies:'));
    for (const check of missing) {
      console.log(chalk.dim(`    • ${check.name}: ${getInstallCommand(check.name)}`));
    }
  }

  if (outdated.length > 0) {
    console.log(chalk.dim('\n  Outdated dependencies:'));
    for (const check of outdated) {
      console.log(chalk.dim(`    • ${check.name}: ${getUpgradeCommand(check.name)}`));
    }
  }

  // Optional dependencies
  const optionalMissing = checks.filter(c => !c.installed && !c.required);
  if (optionalMissing.length > 0) {
    console.log(chalk.dim('\n  Optional dependencies (recommended):'));
    for (const check of optionalMissing) {
      console.log(chalk.dim(`    • ${check.name}: ${getInstallCommand(check.name)}`));
    }
  }
}

/**
 * Get installation command for dependency
 */
function getInstallCommand(name: string): string {
  const isWindows = process.platform === 'win32';

  switch (name.toLowerCase()) {
    case 'node.js':
      return isWindows
        ? 'Download from https://nodejs.org/'
        : 'Use nvm or download from https://nodejs.org/';
    case 'git':
      return isWindows
        ? 'Download from https://git-scm.com/download/win'
        : 'Install via package manager (brew install git, apt install git, etc.)';
    case 'python':
      return isWindows
        ? 'Download from https://www.python.org/downloads/'
        : 'Use pyenv or install via package manager';
    case 'gradle':
      return 'Download from https://gradle.org/install/ or use gradle wrapper';
    case 'maven':
      return 'Download from https://maven.apache.org/install.html or use mvnw';
    default:
      return 'See documentation for installation instructions';
  }
}

/**
 * Get upgrade command for dependency
 */
function getUpgradeCommand(name: string): string {
  const isWindows = process.platform === 'win32';

  switch (name.toLowerCase()) {
    case 'node.js':
      return isWindows
        ? 'Download latest from https://nodejs.org/'
        : 'Use nvm: nvm install --lts';
    case 'git':
      return isWindows
        ? 'Download latest from https://git-scm.com/'
        : 'Use package manager to upgrade';
    case 'python':
      return 'Use pyenv or download latest from python.org';
    default:
      return 'Check official documentation for upgrade instructions';
  }
}
