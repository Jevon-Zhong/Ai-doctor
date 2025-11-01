// src/mcp/mcp.module.ts
import { Module, Global } from '@nestjs/common';
import { MCPClient } from 'utils/mcpClient';

// 定义一个令牌（Token），用于注入时标识
export const MCP_CLIENT_TOKEN = 'MCP_CLIENT_TOKEN';

@Global() // 标记为全局模块，避免在其他模块重复导入
@Module({
  providers: [
    {
      provide: MCP_CLIENT_TOKEN, // 注入令牌
      useValue: new MCPClient('http://127.0.0.1:4002/mcp'), // 实例化mcpClient
    },
  ],
  exports: [MCP_CLIENT_TOKEN], // 导出令牌，供其他模块注入
})
export class McpModule {}