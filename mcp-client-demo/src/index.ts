import express from 'express'
import cors from 'cors'
import { MCPClient } from './mcpClient.js'
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions'
import { OpenAI } from "openai";

interface ExtendedDelta extends OpenAI.Chat.Completions.ChatCompletionChunk.Choice.Delta {
    reasoning_content?: string
}

interface Qwen3 extends OpenAI.Chat.Completions.ChatCompletionCreateParamsStreaming {
    enable_thinking?: boolean
}


const mcpClient: MCPClient = new MCPClient('http://127.0.0.1:4002/mcp')

const openai = new OpenAI(
    {
        // 若没有配置环境变量，请用百炼API Key将下行替换为：apiKey: "sk-xxx",
        apiKey: 'sk-b5e7381995bd4dd8860da06a8e3d8be2',
        baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1"
    }
);

const app = express()
app.use(cors())
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

const prompt = `这是一个可以爬取阅读网页文字内容的工具，如果用户提供了一段完整的网页链接并且需求是获取阅读网页，请调用该工具，否则不调用该工具`
const message: ChatCompletionMessageParam[] = [{
    role: 'system',
    content: prompt
}]



let reasoningContent = ''
let answerContent = ''
let isAnswering = false

app.post('/chat', async (req, res) => {
    console.log(req.body)
    const { userContent } = req.body
    message.push({ role: 'user', content: userContent })
    try {
        const stream = await openai.chat.completions.create({
            // 您可以按需更换为其它 Qwen3 模型、QwQ模型或DeepSeek-R1 模型
            model: 'qwen-plus',
            messages: message,
            tools: mcpClient.getTools(),
            stream: true,
            enable_thinking: true
        } as Qwen3)

        //工具名称
        let toolName = ''
        //工具调用参数
        let toolCallArgsStr = ''
        console.log('\n' + '='.repeat(20) + '思考过程' + '='.repeat(20) + '\n');
        for await (const chunk of stream) {
            if (!chunk.choices?.length) {
                console.log('\nUsage:');
                console.log(chunk.usage);
                continue;
            }
            // console.log(JSON.stringify(chunk))

            const delta: ExtendedDelta = chunk.choices[0].delta;

            // 只收集思考内容
            if (delta.reasoning_content !== undefined && delta.reasoning_content !== null) {
                if (!isAnswering) {
                    process.stdout.write(delta.reasoning_content);
                }
                reasoningContent += delta.reasoning_content;
            }
            //大模型开始思考调用哪个工具，并输出工具和生成参数
            //收集并拼接工具名称
            if (delta.tool_calls && delta.tool_calls[0].function?.arguments) {
                toolCallArgsStr += delta.tool_calls[0].function.arguments
            }
            //收集并拼接工具参数
            if (delta.tool_calls && delta.tool_calls[0].function?.name) {
                toolName += delta.tool_calls[0].function.name
            }
            //判断工具输出结束标志
            if (chunk.choices[0].finish_reason === 'tool_calls') {
                //此处可以调用大模型调用工具
                const result = await mcpClient.callTool(toolName, toolCallArgsStr);
                console.log('mcp爬取网页内容', JSON.stringify(result))
                //再次发送给大模型让大模型输出
                message.push({ role: 'user', content: result.content as string })
                const toolStream = await openai.chat.completions.create({
                    // 您可以按需更换为其它 Qwen3 模型、QwQ模型或DeepSeek-R1 模型
                    model: 'qwen-plus',
                    messages: message,
                    stream: true,
                    enable_thinking: false
                } as Qwen3)
                //流式输出
                for await (const chunk of toolStream) {
                    if (!chunk.choices?.length) {
                        console.log('\nUsage:');
                        console.log(chunk.usage);
                        continue;
                    }
                    const delta: ExtendedDelta = chunk.choices[0].delta;
                    // 收到content，开始进行回复
                    if (delta.content !== undefined && delta.content) {
                        if (!isAnswering) {
                            console.log('\n' + '='.repeat(20) + '调用工具后的回复' + '='.repeat(20) + '\n');
                            isAnswering = true;
                        }
                        process.stdout.write(delta.content);
                        answerContent += delta.content;
                    }
                }

            }
            // 收到content，开始进行回复
            if (delta.content !== undefined && delta.content) {
                if (!isAnswering) {
                    console.log('\n' + '='.repeat(20) + '完整回复' + '='.repeat(20) + '\n');
                    isAnswering = true;
                }
                process.stdout.write(delta.content);
                answerContent += delta.content;
            }
        }
    } catch (error) {
        console.error('Error:', error);
    }
})

app.listen(5000, async () => {
    console.log('mcp服务启动成功， 端口是5000')
    try {
        await mcpClient.connectToServer()
    } catch (error) {
        console.error('mcp服务器连接失败', error)
    }
})