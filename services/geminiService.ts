import { GoogleGenAI, Type } from "@google/genai";
import { StoryResponse } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Constant Character Description to enforce visual consistency
const PROTAGONIST_VISUALS = "A rugged adventurer wearing a weathered leather trench coat, carrying a glowing blue crystal lantern attached to their belt, distinct scarred face, anime-realism hybrid style.";

// Game Engine Model: Optimized for speed
const GAME_MODEL = 'gemini-flash-lite-latest'; 

// Chat Model: Optimized for reasoning
const CHAT_MODEL = 'gemini-3-pro-preview';

// Image Model
const IMAGE_MODEL = 'imagen-4.0-generate-001';

export const generateStoryStep = async (
  history: string[], 
  action: string, 
  currentInventory: string[], 
  currentQuest: string
): Promise<StoryResponse> => {
  
  const systemInstruction = `
    You are the Dungeon Master of an infinite text adventure game. 
    Your goal is to generate the next segment of the story based on the user's action.
    
    Rules:
    1. Respond strictly in JSON format.
    2. The 'story_segment' should be engaging, atmospheric (Dark Fantasy/Cyberpunk blend), and concise (under 100 words).
    3. The 'image_prompt' must be a detailed visual description of the current scene for an image generator. IMPORTANT: You MUST include the following character description in every image prompt to ensure consistency: "${PROTAGONIST_VISUALS}".
    4. Provide 2-4 meaningful 'choices' for the player.
    5. Manage 'inventory_updates'. 'add' items found, 'remove' items used.
    6. Update 'quest_update' only if the quest changes or advances. Otherwise returns null.
    7. Set 'is_game_over' to true only if the player dies or reaches a distinct ending.
  `;

  // Use schema for structured output
  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      story_segment: { type: Type.STRING },
      image_prompt: { type: Type.STRING },
      choices: { type: Type.ARRAY, items: { type: Type.STRING } },
      inventory_updates: {
        type: Type.OBJECT,
        properties: {
          add: { type: Type.ARRAY, items: { type: Type.STRING } },
          remove: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
      },
      quest_update: { type: Type.STRING, nullable: true },
      is_game_over: { type: Type.BOOLEAN }
    },
    required: ['story_segment', 'image_prompt', 'choices', 'inventory_updates', 'is_game_over']
  };

  // Construct prompt with full context to ensure continuity
  const contextHistory = history.length > 0 
    ? `STORY HISTORY (Previous scenes):\n${history.join('\n')}\n` 
    : "STARTING CONTEXT: The player is beginning a new adventure.";

  const userPrompt = `
    ${contextHistory}

    CURRENT STATUS:
    Inventory: ${JSON.stringify(currentInventory)}
    Active Quest: ${currentQuest}

    PLAYER ACTION: ${action}
  `;

  try {
    const response = await ai.models.generateContent({
      model: GAME_MODEL,
      contents: userPrompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: responseSchema as any, // Cast as any due to strict typing in SDK vs standard JSON
        temperature: 0.7,
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as StoryResponse;
  } catch (error) {
    console.error("Story Generation Error:", error);
    throw error;
  }
};

export const generateSceneImage = async (prompt: string): Promise<string | null> => {
  try {
    const response = await ai.models.generateImages({
      model: IMAGE_MODEL,
      prompt: prompt,
      config: {
        numberOfImages: 1,
        aspectRatio: '16:9',
        outputMimeType: 'image/jpeg'
      }
    });

    const base64 = response.generatedImages?.[0]?.image?.imageBytes;
    if (base64) {
      return `data:image/jpeg;base64,${base64}`;
    }
    return null;
  } catch (error) {
    console.error("Image Generation Error:", error);
    // Return null to show placeholder or handle gracefully
    return null;
  }
};

export const sendChatMessage = async (message: string, context: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: CHAT_MODEL,
      contents: `Context of the game so far: ${context}\n\nUser Question: ${message}`,
      config: {
        systemInstruction: "You are a mystical disembodied guide. Answer the player's questions about the lore, game mechanics, or offer vague hints. Be helpful but cryptic.",
      }
    });
    
    return response.text || "The spirits are silent...";
  } catch (error) {
    console.error("Chat Error:", error);
    return "I cannot connect to the void right now.";
  }
};
