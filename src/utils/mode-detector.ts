export function isMCPMode(): boolean {
  // MCP-Server wird über stdio aufgerufen
  // CLI wird mit Terminal-TTY aufgerufen

  // 1. Check: Wurde explizit --mcp Flag gesetzt?
  if (process.argv.includes('--mcp')) {
    return true;
  }

  // 2. Check: Wurden CLI-Commands übergeben?
  // If user provides commands like "info", "doctor", "symbols", etc. → CLI Mode
  const cliCommands = ['info', 'doctor', 'file', 'symbols', 'search', 'analysis', 'vcs', 'watch'];
  const hasCliCommand = process.argv.slice(2).some(arg =>
    cliCommands.includes(arg) || arg.startsWith('-')
  );

  if (hasCliCommand) {
    return false; // CLI Mode (user is running a command)
  }

  // 3. Check: Wurde über MCP-Binary aufgerufen?
  const scriptName = process.argv[1];
  if (scriptName?.includes('codeweaver-mcp')) {
    return true;
  }

  // 4. Check: Ist stdin ein TTY? (Terminal = true, Pipe = false)
  // Note: On Windows, process.stdin.isTTY might be undefined
  if (process.stdin.isTTY === true) {
    return false; // TTY → CLI Mode
  }

  if (process.stdin.isTTY === false) {
    return true; // stdio → MCP Mode
  }

  // 5. Default: If no TTY info and no commands, assume MCP Mode
  // This handles cases where stdin.isTTY is undefined (Windows edge case)
  return true;
}
