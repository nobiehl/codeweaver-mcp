import { Command } from 'commander';
import type { CodeWeaverService } from '../../core/service.js';

export function createVCSCommand(service: CodeWeaverService): Command {
  const cmd = new Command('vcs');
  cmd.description('Version Control System (Git) operations');

  // vcs status
  cmd
    .command('status')
    .description('Show Git repository status')
    .action(async () => {
      try {
        const isRepo = await service.isGitRepository();
        if (!isRepo) {
          console.log('Not a Git repository');
          return;
        }

        const status = await service.getGitStatus();

        if (status.length === 0) {
          console.log('✓ Working tree clean');
          return;
        }

        console.log(`\n=== Repository Status ===\n`);

        const staged = status.filter(s => s.staged);
        const unstaged = status.filter(s => !s.staged);

        if (staged.length > 0) {
          console.log('Staged changes:');
          staged.forEach(s => {
            const icon = s.status === 'added' ? '  +' : s.status === 'deleted' ? '  -' : '  M';
            console.log(`${icon} ${s.file}`);
          });
          console.log();
        }

        if (unstaged.length > 0) {
          console.log('Unstaged changes:');
          unstaged.forEach(s => {
            const icon = s.status === 'added' ? '  +' : s.status === 'deleted' ? '  -' : s.status === 'untracked' ? '  ?' : '  M';
            console.log(`${icon} ${s.file}`);
          });
        }
      } catch (error) {
        console.error('Error:', (error as Error).message);
        process.exit(1);
      }
    });

  // vcs diff
  cmd
    .command('diff [file]')
    .description('Show diff for file(s)')
    .action(async (filePath?: string) => {
      try {
        const diff = await service.getGitDiff(filePath);

        if (diff.files.length === 0) {
          console.log('No changes');
          return;
        }

        console.log(`\n=== Diff Summary ===\n`);
        console.log(`Files changed: ${diff.filesChanged}`);
        console.log(`Additions: +${diff.totalAdditions}`);
        console.log(`Deletions: -${diff.totalDeletions}`);
        console.log();

        diff.files.forEach(file => {
          console.log(`\n${file.file} (${file.changeType})`);
          console.log(`  +${file.additions} -${file.deletions}`);

          if (file.patch) {
            console.log('\n' + file.patch);
          }
        });
      } catch (error) {
        console.error('Error:', (error as Error).message);
        process.exit(1);
      }
    });

  // vcs blame
  cmd
    .command('blame <file>')
    .description('Show Git blame for file')
    .option('-l, --lines <range>', 'Line range (e.g., "10-20")')
    .action(async (filePath: string, options: any) => {
      try {
        let startLine: number | undefined;
        let endLine: number | undefined;

        if (options.lines) {
          const parts = options.lines.split('-');
          startLine = parseInt(parts[0], 10);
          endLine = parseInt(parts[1], 10);
        }

        const blame = await service.getGitBlame(filePath, startLine, endLine);

        console.log(`\n=== Blame for ${filePath} ===\n`);

        blame.forEach(line => {
          const shortHash = line.commit.substring(0, 8);
          const author = line.author.padEnd(20);
          const date = line.date.toISOString().split('T')[0];
          console.log(`${shortHash} ${author} ${date} ${line.line.toString().padStart(4)}: ${line.content}`);
        });
      } catch (error) {
        console.error('Error:', (error as Error).message);
        process.exit(1);
      }
    });

  // vcs log
  cmd
    .command('log')
    .description('Show commit history')
    .option('-n, --limit <number>', 'Limit number of commits', '10')
    .option('--since <date>', 'Show commits since date')
    .option('--until <date>', 'Show commits until date')
    .option('--author <name>', 'Filter by author')
    .action(async (options: any) => {
      try {
        const log = await service.getGitLog({
          limit: parseInt(options.limit, 10),
          since: options.since,
          until: options.until,
          author: options.author,
        });

        if (log.commits.length === 0) {
          console.log('No commits found');
          return;
        }

        console.log(`\n=== Commit History (${log.total} commits) ===\n`);

        log.commits.forEach(commit => {
          console.log(`commit ${commit.hash}`);
          console.log(`Author: ${commit.author} <${commit.authorEmail}>`);
          console.log(`Date:   ${commit.date.toISOString()}`);
          console.log();
          console.log(`    ${commit.message}`);
          if (commit.body) {
            console.log();
            commit.body.split('\n').forEach(line => console.log(`    ${line}`));
          }
          console.log();
          console.log(`    ${commit.filesChanged} files changed, ${commit.insertions} insertions(+), ${commit.deletions} deletions(-)`);
          console.log();
        });
      } catch (error) {
        console.error('Error:', (error as Error).message);
        process.exit(1);
      }
    });

  // vcs branches
  cmd
    .command('branches')
    .description('List all branches')
    .action(async () => {
      try {
        const branches = await service.getGitBranches();

        console.log(`\n=== Branches ===\n`);

        branches.forEach(branch => {
          const current = branch.current ? '* ' : '  ';
          const name = branch.name.padEnd(30);
          const commit = branch.commit.substring(0, 8);

          let info = `${current}${name} ${commit}`;

          if (branch.upstream) {
            info += ` [${branch.upstream}`;
            if (branch.ahead) info += `, ahead ${branch.ahead}`;
            if (branch.behind) info += `, behind ${branch.behind}`;
            info += ']';
          }

          console.log(info);
        });
      } catch (error) {
        console.error('Error:', (error as Error).message);
        process.exit(1);
      }
    });

  // vcs compare
  cmd
    .command('compare <base> <compare>')
    .description('Compare two branches')
    .action(async (baseBranch: string, compareBranch: string) => {
      try {
        const diff = await service.compareGitBranches(baseBranch, compareBranch);

        console.log(`\n=== Branch Comparison: ${baseBranch}...${compareBranch} ===\n`);

        if (diff.files.length === 0) {
          console.log('No differences');
          return;
        }

        console.log(`Files changed: ${diff.filesChanged}`);
        console.log(`Additions: +${diff.totalAdditions}`);
        console.log(`Deletions: -${diff.totalDeletions}`);
        console.log();

        console.log('Changed files:');
        diff.files.forEach(file => {
          const icon = file.changeType === 'added' ? '  +' : file.changeType === 'deleted' ? '  -' : '  M';
          console.log(`${icon} ${file.file} (+${file.additions}, -${file.deletions})`);
        });
      } catch (error) {
        console.error('Error:', (error as Error).message);
        process.exit(1);
      }
    });

  return cmd;
}
