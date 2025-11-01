import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { ChatCompletionTool } from 'openai/resources/chat/completions'
export class MCPClient {
    private client: Client
    private mcpServerURL: URL
    //   private anthropic: Anthropic;
    private transport: StreamableHTTPClientTransport | null = null
    private tools: ChatCompletionTool[] = []
    private sessionId?: string

    constructor(mcpServerURL: string) {
        // this.anthropic = new Anthropic({
        //   apiKey: ANTHROPIC_API_KEY,
        // });
        this.client = new Client({ name: "mcp-client-cli", version: "1.0.0" })
        this.mcpServerURL = new URL(mcpServerURL)
    }
    // methods will go here
    connectToServer = async () => {
        try {
            this.transport = new StreamableHTTPClientTransport(this.mcpServerURL)
            console.log('没连接前的sessionID', this.sessionId)
            await this.client.connect(this.transport)

            // 连接成功后，从 transport 中获取服务端生成的 sessionId
            this.sessionId = this.transport.sessionId;
            console.log('服务端生成的 sessionId:', this.sessionId);
            console.log('Connected using Streamable HTTP transport');
            //获取的工具列表
            const toolsResult = await this.client.listTools();
            //遍历列表，组装成大模型需要的工具格式
            this.tools = toolsResult.tools.map((tool) => ({
                "type": "function",
                "function": {
                    "name": tool.name,
                    "description": tool.description,
                    "parameters": tool.inputSchema,
                },
            }));
            console.log(
                "Connected to server with tools:",
                JSON.stringify(this.tools)
            );
        } catch (error) {
            console.error("连接失败:", error);
        }

    }
    getTools = () => {
        return this.tools
    }
    callTool = async (toolName: string, toolCallArgsStr: string) => {
        // if (!this.sessionId) {
        //     throw new Error("未连接到服务端，请先调用 connectToServer()");
        // }
        const result = await this.client.callTool({
            name: toolName,
            arguments: JSON.parse(toolCallArgsStr),
        })
        return result
    }
    // 获取当前 sessionId 的方法
    getSessionId = (): string | undefined => {
        return this.sessionId;
    };
}




