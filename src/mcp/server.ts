import type { ToolDefinition, ToolHandler, ToolRegistration } from '../types/mcp.js';

export class MCPServer {
  private name = 'codeweaver';
  private version = '0.1.0';
  private tools: Map<string, ToolRegistration> = new Map();

  getName(): string {
    return this.name;
  }

  getVersion(): string {
    return this.version;
  }

  registerTool(
    name: string,
    description: string,
    inputSchema: Record<string, any>,
    handler: ToolHandler
  ): void {
    const definition: ToolDefinition = {
      name,
      description,
      inputSchema
    };

    this.tools.set(name, { definition, handler });
  }

  hasToolHandler(name: string): boolean {
    return this.tools.has(name);
  }

  async callTool(name: string, args: any): Promise<any> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Tool not found: ${name}`);
    }
    return tool.handler(args);
  }

  listTools(): ToolDefinition[] {
    return Array.from(this.tools.values()).map(t => t.definition);
  }
}
