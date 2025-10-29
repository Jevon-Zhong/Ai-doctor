import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import express from 'express';
import { z } from 'zod';
import { crawlWebFn } from './crawlWeb.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
// Create an MCP server
// const server = new McpServer({
//     name: 'mcp-server-crawl',
//     version: '1.0.0'
// });



// Set up Express and HTTP transport
const app = express();
app.use(express.json());


// Map to store transports by session ID
const transports: { [sessionId: string]: StreamableHTTPServerTransport } = {};

// Handle POST requests for client-to-server communication
app.post('/mcp', async (req, res) => {
    // Check for existing session ID
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    // console.log('sessionId', sessionId)
    let transport: StreamableHTTPServerTransport;

    if (sessionId && transports[sessionId]) {
        // Reuse existing transport
        transport = transports[sessionId];
    } else if (!sessionId && isInitializeRequest(req.body)) {
        // New initialization request
        transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: () => crypto.randomUUID(),
            onsessioninitialized: sessionId => {
                // Store the transport by session ID
                transports[sessionId] = transport;
            }
            // DNS rebinding protection is disabled by default for backwards compatibility. If you are running this server
            // locally, make sure to set:
            // enableDnsRebindingProtection: true,
            // allowedHosts: ['127.0.0.1'],
        });

        // Clean up transport when closed
        transport.onclose = () => {
            if (transport.sessionId) {
                delete transports[transport.sessionId];
            }
        };
        const server = new McpServer({
            name: 'example-server',
            version: '1.0.0'
        });

        // ... set up server resources, tools, and prompts ...
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
        // Connect to the MCP server
        await server.connect(transport);
    } else {
        // Invalid request
        res.status(400).json({
            jsonrpc: '2.0',
            error: {
                code: -32000,
                message: 'Bad Request: No valid session ID provided'
            },
            id: null
        });
        return;
    }

    // Handle the request
    await transport.handleRequest(req, res, req.body);
});

const port = parseInt(process.env.PORT || '4002');
app.listen(port, () => {
    console.log(`MCP Server running on http://localhost:${port}/mcp`);
}).on('error', error => {
    console.error('Server error:', error);
    process.exit(1);
});