export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, any>;
}

export type ToolHandler = (args: any) => Promise<any>;

export interface ToolRegistration {
  definition: ToolDefinition;
  handler: ToolHandler;
}
