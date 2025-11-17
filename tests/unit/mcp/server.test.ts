import { describe, it, expect, beforeEach } from 'vitest';
import { MCPServer } from '../../../src/mcp/server.js';

describe('MCPServer', () => {
  let server: MCPServer;

  beforeEach(() => {
    server = new MCPServer();
  });

  it('should create server instance', () => {
    expect(server).toBeDefined();
  });

  it('should have name and version', () => {
    expect(server.getName()).toBe('codeweaver');
    expect(server.getVersion()).toBe('0.3.0');
  });

  it('should register tools', () => {
    const handler = async () => ({ result: 'ok' });
    server.registerTool('test-tool', 'Test tool', {}, handler);
    expect(server.hasToolHandler('test-tool')).toBe(true);
  });

  it('should call registered tool', async () => {
    const handler = async (args: any) => ({ echo: args });
    server.registerTool('echo', 'Echo tool', {}, handler);

    const result = await server.callTool('echo', { msg: 'hello' });
    expect(result).toEqual({ echo: { msg: 'hello' } });
  });

  it('should throw error for unknown tool', async () => {
    await expect(server.callTool('unknown', {})).rejects.toThrow('Tool not found: unknown');
  });

  it('should list registered tools', () => {
    server.registerTool('tool1', 'Tool 1', {}, async () => ({}));
    server.registerTool('tool2', 'Tool 2', {}, async () => ({}));

    const tools = server.listTools();
    expect(tools).toHaveLength(2);
    expect(tools[0].name).toBe('tool1');
    expect(tools[1].name).toBe('tool2');
  });
});
