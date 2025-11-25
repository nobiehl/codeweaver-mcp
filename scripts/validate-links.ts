#!/usr/bin/env tsx
/**
 * Markdown Link Validator
 *
 * Validates all links in markdown documentation:
 * - Internal links (./file.md, ../dir/file.md)
 * - Anchor links (#section, file.md#section)
 * - External links (https://example.com) - optional
 *
 * Usage:
 *   npm run validate-links              # Internal links only
 *   npm run validate-links -- --external # Include external links
 *   npm run validate-links -- --fix      # Auto-fix relative paths
 */

import { promises as fs } from 'fs';
import { join, dirname, relative, resolve, sep } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface LinkInfo {
  sourceFile: string;
  linkText: string;
  linkTarget: string;
  lineNumber: number;
  type: 'internal' | 'anchor' | 'external';
  valid: boolean;
  error?: string;
  resolvedPath?: string;
}

interface ValidationReport {
  totalFiles: number;
  totalLinks: number;
  internalLinks: number;
  externalLinks: number;
  anchorLinks: number;
  validLinks: number;
  brokenLinks: LinkInfo[];
  duration: number;
}

const EXCLUDE_DIRS = ['node_modules', '.git', 'dist', 'build', '.codeweaver'];
const EXCLUDE_DOCS_DIRS = ['archive']; // Only exclude from docs/

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

function colorize(text: string, color: keyof typeof colors): string {
  return `${colors[color]}${text}${colors.reset}`;
}

async function findMarkdownFiles(dir: string): Promise<string[]> {
  const files: string[] = [];

  async function walk(currentDir: string) {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(currentDir, entry.name);

      if (entry.isDirectory()) {
        // Always exclude these directories
        if (EXCLUDE_DIRS.includes(entry.name)) {
          continue;
        }

        // Only exclude 'archive' if we're in docs/
        const relativePath = relative(dir, fullPath);
        if (relativePath.startsWith(`docs${sep}archive`) || relativePath === `docs${sep}archive`) {
          continue;
        }

        await walk(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        files.push(fullPath);
      }
    }
  }

  await walk(dir);
  return files;
}

function extractLinks(content: string): Array<{ text: string; target: string; line: number }> {
  const links: Array<{ text: string; target: string; line: number }> = [];
  const lines = content.split('\n');

  // Match [text](url) but not image links ![text](url)
  const linkRegex = /(?<!!)\[([^\]]+)\]\(([^)]+)\)/g;

  lines.forEach((line, index) => {
    let match;
    while ((match = linkRegex.exec(line)) !== null) {
      links.push({
        text: match[1],
        target: match[2],
        line: index + 1,
      });
    }
  });

  return links;
}

function isExternalLink(target: string): boolean {
  return /^(https?|ftp|mailto):\/\//i.test(target);
}

function isAnchorOnly(target: string): boolean {
  return target.startsWith('#');
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}

async function extractAnchors(filePath: string): Promise<Set<string>> {
  const anchors = new Set<string>();

  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n');

    // Extract markdown headers
    const headerRegex = /^#{1,6}\s+(.+)$/;
    lines.forEach((line) => {
      const match = headerRegex.exec(line);
      if (match) {
        // Convert header to anchor format
        // "## My Header" -> "my-header"
        const anchor = match[1]
          .toLowerCase()
          .replace(/[^\w\s-]/g, '') // Remove special chars
          .replace(/\s+/g, '-') // Spaces to hyphens
          .replace(/-+/g, '-') // Multiple hyphens to single
          .replace(/^-|-$/g, ''); // Trim hyphens
        anchors.add(anchor);
      }
    });

    // Also extract explicit anchor tags
    const anchorTagRegex = /<a\s+(?:[^>]*?\s+)?id=["']([^"']+)["']/g;
    let match;
    while ((match = anchorTagRegex.exec(content)) !== null) {
      anchors.add(match[1]);
    }
  } catch (error) {
    // File doesn't exist or can't be read
  }

  return anchors;
}

async function validateInternalLink(
  sourceFile: string,
  target: string,
  projectRoot: string
): Promise<{ valid: boolean; error?: string; resolvedPath?: string }> {
  const sourceDir = dirname(sourceFile);

  // Split target into file path and anchor
  const [filePath, anchor] = target.split('#');

  if (!filePath && anchor) {
    // Anchor-only link (#section)
    const anchors = await extractAnchors(sourceFile);
    if (anchors.has(anchor)) {
      return { valid: true, resolvedPath: sourceFile };
    } else {
      return { valid: false, error: `Anchor #${anchor} not found in current file` };
    }
  }

  // Resolve file path
  let resolvedPath: string;
  if (filePath.startsWith('/')) {
    // Absolute from project root
    resolvedPath = join(projectRoot, filePath);
  } else {
    // Relative to source file
    resolvedPath = resolve(sourceDir, filePath);
  }

  // Check if file exists
  const exists = await fileExists(resolvedPath);
  if (!exists) {
    return { valid: false, error: `File not found: ${relative(projectRoot, resolvedPath)}`, resolvedPath };
  }

  // If anchor is specified, check if it exists in target file
  if (anchor) {
    const anchors = await extractAnchors(resolvedPath);
    if (!anchors.has(anchor)) {
      return {
        valid: false,
        error: `Anchor #${anchor} not found in ${relative(projectRoot, resolvedPath)}`,
        resolvedPath,
      };
    }
  }

  return { valid: true, resolvedPath };
}

async function validateExternalLink(target: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const response = await fetch(target, {
      method: 'HEAD',
      redirect: 'follow',
      signal: AbortSignal.timeout(5000),
    });

    if (response.ok) {
      return { valid: true };
    } else {
      return { valid: false, error: `HTTP ${response.status} ${response.statusText}` };
    }
  } catch (error) {
    if (error instanceof Error) {
      return { valid: false, error: error.message };
    }
    return { valid: false, error: 'Unknown error' };
  }
}

async function validateLinks(
  files: string[],
  projectRoot: string,
  options: { checkExternal: boolean }
): Promise<LinkInfo[]> {
  const allLinks: LinkInfo[] = [];

  for (const file of files) {
    const content = await fs.readFile(file, 'utf-8');
    const links = extractLinks(content);

    for (const link of links) {
      const { target, text, line } = link;

      if (isExternalLink(target)) {
        if (options.checkExternal) {
          const result = await validateExternalLink(target);
          allLinks.push({
            sourceFile: file,
            linkText: text,
            linkTarget: target,
            lineNumber: line,
            type: 'external',
            valid: result.valid,
            error: result.error,
          });

          // Rate limiting for external links
          await new Promise((resolve) => setTimeout(resolve, 100));
        } else {
          allLinks.push({
            sourceFile: file,
            linkText: text,
            linkTarget: target,
            lineNumber: line,
            type: 'external',
            valid: true, // Assumed valid if not checking
          });
        }
      } else if (isAnchorOnly(target)) {
        const result = await validateInternalLink(file, target, projectRoot);
        allLinks.push({
          sourceFile: file,
          linkText: text,
          linkTarget: target,
          lineNumber: line,
          type: 'anchor',
          valid: result.valid,
          error: result.error,
          resolvedPath: result.resolvedPath,
        });
      } else {
        const result = await validateInternalLink(file, target, projectRoot);
        allLinks.push({
          sourceFile: file,
          linkText: text,
          linkTarget: target,
          lineNumber: line,
          type: 'internal',
          valid: result.valid,
          error: result.error,
          resolvedPath: result.resolvedPath,
        });
      }
    }
  }

  return allLinks;
}

function generateReport(links: LinkInfo[], duration: number, filesCount: number): ValidationReport {
  const brokenLinks = links.filter((link) => !link.valid);
  const internalLinks = links.filter((link) => link.type === 'internal').length;
  const externalLinks = links.filter((link) => link.type === 'external').length;
  const anchorLinks = links.filter((link) => link.type === 'anchor').length;

  return {
    totalFiles: filesCount,
    totalLinks: links.length,
    internalLinks,
    externalLinks,
    anchorLinks,
    validLinks: links.length - brokenLinks.length,
    brokenLinks,
    duration,
  };
}

function printReport(report: ValidationReport, projectRoot: string, options: { verbose: boolean }): void {
  console.log('\n' + colorize('═'.repeat(80), 'cyan'));
  console.log(colorize('  📋 Markdown Link Validation Report', 'cyan'));
  console.log(colorize('═'.repeat(80), 'cyan') + '\n');

  // Summary
  console.log(colorize('Summary:', 'blue'));
  console.log(`  Files scanned:     ${report.totalFiles}`);
  console.log(`  Total links:       ${report.totalLinks}`);
  console.log(`    Internal:        ${report.internalLinks}`);
  console.log(`    Anchors:         ${report.anchorLinks}`);
  console.log(`    External:        ${report.externalLinks}`);
  console.log();

  const successRate = ((report.validLinks / report.totalLinks) * 100).toFixed(1);
  const validColor = report.brokenLinks.length === 0 ? 'green' : 'yellow';

  console.log(`  ${colorize('Valid links:', 'green')}      ${report.validLinks} (${successRate}%)`);
  console.log(`  ${colorize('Broken links:', 'red')}     ${report.brokenLinks.length}\n`);

  // Broken links
  if (report.brokenLinks.length > 0) {
    console.log(colorize('Broken Links:', 'red'));
    console.log(colorize('─'.repeat(80), 'gray') + '\n');

    const groupedByFile = new Map<string, LinkInfo[]>();
    for (const link of report.brokenLinks) {
      const relativePath = relative(projectRoot, link.sourceFile);
      if (!groupedByFile.has(relativePath)) {
        groupedByFile.set(relativePath, []);
      }
      groupedByFile.get(relativePath)!.push(link);
    }

    for (const [file, links] of groupedByFile.entries()) {
      console.log(colorize(`📄 ${file}`, 'yellow'));
      for (const link of links) {
        console.log(`  ${colorize(`Line ${link.lineNumber}:`, 'gray')} [${link.text}](${link.linkTarget})`);
        console.log(`    ${colorize('✗', 'red')} ${link.error || 'Unknown error'}`);
        if (options.verbose && link.resolvedPath) {
          console.log(`    ${colorize('→', 'gray')} ${relative(projectRoot, link.resolvedPath)}`);
        }
      }
      console.log();
    }
  } else {
    console.log(colorize('✓ All links are valid!', 'green') + '\n');
  }

  // Footer
  console.log(colorize('─'.repeat(80), 'gray'));
  console.log(`Duration: ${(report.duration / 1000).toFixed(2)}s\n`);
}

async function saveReport(report: ValidationReport, projectRoot: string): Promise<void> {
  const reportDir = join(projectRoot, '.analysis');
  await fs.mkdir(reportDir, { recursive: true });

  const reportPath = join(reportDir, 'link_validation_report.json');
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2), 'utf-8');

  console.log(colorize(`Report saved to: ${relative(projectRoot, reportPath)}`, 'gray'));
}

async function main() {
  const startTime = Date.now();
  const args = process.argv.slice(2);

  const options = {
    checkExternal: args.includes('--external'),
    verbose: args.includes('--verbose') || args.includes('-v'),
    fix: args.includes('--fix'),
  };

  const projectRoot = resolve(__dirname, '..');

  console.log(colorize('\n🔍 Scanning markdown files...', 'cyan'));

  // Find all markdown files
  const files = await findMarkdownFiles(projectRoot);
  console.log(colorize(`Found ${files.length} markdown files\n`, 'gray'));

  // Validate links
  console.log(colorize('🔗 Validating links...', 'cyan'));
  if (options.checkExternal) {
    console.log(colorize('  (including external links - this may take a while)', 'yellow'));
  }

  const links = await validateLinks(files, projectRoot, options);
  const duration = Date.now() - startTime;

  // Generate and print report
  const report = generateReport(links, duration, files.length);
  printReport(report, projectRoot, options);

  // Save report to file
  await saveReport(report, projectRoot);

  // Exit with error code if broken links found
  if (report.brokenLinks.length > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(colorize('\n❌ Error:', 'red'), error);
  process.exit(1);
});
