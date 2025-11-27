import { GoogleGenAI, Chat, GenerateContentResponse, Part } from "@google/genai";
import { Attachment, GeminiModelId } from "../types";

// We no longer rely solely on process.env.API_KEY. 
// Keys are passed dynamically from the UI.

// Singleton chat session to maintain history across renders
let chatSession: Chat | null = null;
let currentModelId: GeminiModelId = 'gemini-3-pro-preview';
let currentApiKey: string = '';

export const AVAILABLE_MODELS: { id: GeminiModelId; name: string; description: string }[] = [
  { 
    id: 'gemini-3-pro-preview', 
    name: 'Gemini 3 Pro', 
    description: 'Smartest, best for complex math & reasoning.' 
  },
  {
    id: 'gemini-2.0-pro-exp-02-05',
    name: 'Gemini 2.5 Pro',
    description: 'Advanced reasoning, balanced speed/quality.'
  },
  { 
    id: 'gemini-2.5-flash', 
    name: 'Gemini 2.5 Flash', 
    description: 'Fast, higher rate limits, great for daily tasks.' 
  },
  { 
    id: 'gemini-flash-lite-latest', 
    name: 'Gemini Flash Lite', 
    description: 'Fastest, "Unlimited" feel, lightweight.' 
  }
];

export const getChatSession = (modelId: GeminiModelId = 'gemini-3-pro-preview', apiKey: string): Chat => {
  // If the model changed or session doesn't exist, create a new one
  if (!chatSession || currentModelId !== modelId || currentApiKey !== apiKey) {
    currentModelId = modelId;
    currentApiKey = apiKey;
    
    const ai = new GoogleGenAI({ apiKey: apiKey });
    
    chatSession = ai.chats.create({
      model: modelId,
      config: {
        systemInstruction: `You are 'Ayat Bayyinat' (أيات بينات), a highly advanced AI assistant powered by ${modelId}.

CRITICAL RULE: DO NOT GENERATE HTML SIMULATIONS AUTOMATICALLY.
- You must ONLY generate an HTML simulation or Quiz if the user explicitly asks for it or clicks a specific button (like "Simulation" or "Quiz").
- In normal conversation, explain concepts using text and Markdown only.

VISUAL RULES (When requested):
1. **Golden Symbols**: ALWAYS use MathJax ($$ equation $$) for ALL math formulas, variables, and physical laws.
2. **Single Example**: If requested, generate EXACTLY ONE high-quality interactive HTML5 simulation.
3. **Placement**: The \`\`\`html block MUST be the VERY LAST thing in your response.

MODE 1: INTERACTIVE QUIZ (Triggered by: "Quiz", "(QZ)", "اختبار")
- OUTPUT: A standalone HTML/JS Widget.
- CONTENT: 5-10 *NEW* Multiple Choice Questions.
- FORMAT: Include <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">.
- FEEDBACK: Immediate Right/Wrong feedback with explanation.

MODE 2: VISUAL SIMULATION (Triggered by: "Simulation", "visualize", "show me", "محاكاة")
- OUTPUT: An interactive HTML5 Canvas or SVG simulation.
- CONTENT: Moving parts, graphs, sliders. High quality animations.
- BRANDING: Include "Ayat Bayyinat" and Book Icon in header.
- MATH: If the simulation shows formulas, use KaTeX/MathJax inside the HTML.

HTML TEMPLATE REQUIREMENT:
When generating HTML, you MUST include this CSS in the <style> block:
.katex { color: #fbbf24 !important; text-shadow: 0 0 10px rgba(251, 191, 36, 0.3); direction: ltr; font-weight: bold; }
body { background-color: #0d1117; color: white; font-family: 'Cairo', sans-serif; }
.btn-gold { background: linear-gradient(to right, #fbbf24, #d97706); color: black; border: none; font-weight: bold; }

FILE ANALYSIS & OCR:
- Perform high-accuracy OCR on images.
- Solve math problems found in images using MathJax.

GENERAL RULES:
1. **Formatting**: Use arrow symbols (→), Cairo font for headers.
2. **Emphasis**: Use **bold** for key terms.
3. **Language**: Fluent Arabic and English. Auto-detect direction.

Start now.`,
      },
    });
  }
  return chatSession;
};

export const resetChatSession = (): void => {
  chatSession = null;
};

export const sendMessageStream = async (message: string, attachments: Attachment[] = [], modelId: GeminiModelId = 'gemini-3-pro-preview', apiKey: string) => {
  if (!apiKey) throw new Error("API Key is required");
  
  const chat = getChatSession(modelId, apiKey);
  try {
    // Construct parts for multimodal input
    let parts: (string | Part)[] = [{ text: message }];

    if (attachments.length > 0) {
      const attachmentParts = attachments.map(att => ({
        inlineData: {
          mimeType: att.file.type,
          data: att.base64 || ''
        }
      }));
      parts = [...attachmentParts, { text: message }];
    }

    const result = await chat.sendMessageStream({ 
      message: parts.length === 1 ? message : parts 
    });
    
    return result;
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
};