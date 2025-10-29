import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import express from 'express';
import { z } from 'zod';
import { crawlWebFn } from './crawlWeb.js';
// Create an MCP server
const server = new McpServer({
    name: 'mcp-server-crawl',
    version: '1.0.0'
});
// Register weather tools
server.tool("crawlWeb", "爬取获取网页内容", {
    url: z.string().url().describe('需要被爬取的网页链接')
}, async ({ url }) => {
    try {
        const result = await crawlWebFn(url);
        return {
            content: [
                {
                    type: "text",
                    text: result,
                },
            ],
        };
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: '爬取网页失败',
                },
            ],
        };
    }
});
// Set up Express and HTTP transport
const app = express();
app.use(express.json());
app.post('/mcp', async (req, res) => {
    console.log(req.headers);
    // Create a new transport for each request to prevent request ID collisions
    const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined
    });
    res.on('close', () => {
        transport.close();
    });
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
    req.on('error', () => {
        console.log('error');
    });
});
const port = parseInt(process.env.PORT || '4002');
app.listen(port, () => {
    console.log(`MCP Server running on http://localhost:${port}/mcp`);
}).on('error', error => {
    console.error('Server error:', error);
    process.exit(1);
});
