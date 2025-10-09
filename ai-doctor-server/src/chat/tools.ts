import { intentUnderstandingPrompt } from "./roleDefinition"
// 工具：意图理解用户的追问问题
export const toolsData: any = [
    {
        "type": "function",
        "function": {
            "name": "H300",
            "description": intentUnderstandingPrompt,
            "parameters": {
                "type": "object",
                "properties": {
                    "clarified_question": {
                        "type": "string",
                        "description": "如果问题存在续问，结合上下文生成完整问题，若无续问，忽略此字段"
                    }
                },
                "required": []
            }
        }
    }
]