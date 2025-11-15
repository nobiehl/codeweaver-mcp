export function isMCPMode(): boolean {
  // MCP-Server wird über stdio aufgerufen
  // CLI wird mit Terminal-TTY aufgerufen

  // 1. Check: Ist stdin ein TTY? (Terminal = true, Pipe = false)
  if (!process.stdin.isTTY) {
    return true; // stdio → MCP Mode
  }

  // 2. Check: Wurde explizit --mcp Flag gesetzt?
  if (process.argv.includes('--mcp')) {
    return true;
  }

  // 3. Check: Wurde über MCP-Binary aufgerufen?
  const scriptName = process.argv[1];
  if (scriptName?.includes('codeweaver-mcp')) {
    return true;
  }

  // Default: CLI Mode
  return false;
}
