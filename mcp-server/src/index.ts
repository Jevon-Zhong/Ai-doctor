import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { intentUnderstandingPrompt } from './toolprompt.js';
import express from 'express';
import { z } from 'zod';
import { crawlWebFn } from './crawlWeb.js';


// Set up Express and HTTP transport
const app = express();
app.use(express.json());

app.post('/mcp', async (req, res) => {
    console.log(req.headers)
    // Create a new transport for each request to prevent request ID collisions
    const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined
    });

    // Create an MCP server
    const server = new McpServer({
        name: 'mcp-server-crawl',
        version: '1.0.0'
    });

    // Register weather tools
    server.tool(
        "crawlWeb",
        "爬取获取网页内容",
        {
            url: z.string().url().describe('需要被爬取的网页链接')
        },
        async ({ url }) => {
            try {
                const result = await crawlWebFn(url) as string
                return {
                    content: [
                        {
                            type: "text",
                            text: result,
                        },
                    ],
                };
            } catch (error) {
                return {
                    content: [
                        {
                            type: "text",
                            text: '爬取网页失败',
                        },
                    ],
                };
            }
        },
    );

    // 将原function calling， 改成mcp的形式，注册一个生成clarified_question的工具,
    // 即让用户根据意图返回参数，这个参数就是我们想要的数据
    server.tool(
        "H300",
        intentUnderstandingPrompt,
        {
            clarified_question: z.string().describe('如果问题存在续问，结合上下文生成完整问题，若无续问，忽略此字段')
        },
        async ({ clarified_question }) => ({
            content: [
                {
                    type: "text",
                    text: clarified_question,
                },
            ],
        }),
    );

    res.on('close', () => {
        transport.close();
    });

    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
    req.on('error', () => {
        console.log('error')
    });
});

const port = parseInt(process.env.PORT || '4002');
app.listen(port, () => {
    console.log(`MCP Server running on http://localhost:${port}/mcp`);
}).on('error', error => {
    console.error('Server error:', error);
    process.exit(1);
});