import { GoogleGenAI, Type } from "@google/genai";

export async function categorizeBookmarksWithAI(bookmarks: any[], existingFolders: string[], strategy: string = 'topic', model: string = "gemini-3-flash-preview") {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Gemini API key is missing. Please add it to your .env file.");
  }

  const ai = new GoogleGenAI({ apiKey });

  let strategyInstruction = "Categorize the following bookmarks into appropriate folders based on their topic (e.g., Tech, Cooking, Finance).";
  if (strategy === 'action') {
    strategyInstruction = "Categorize the following bookmarks into action-oriented folders based on user intent (e.g., To Read, To Watch, To Buy, Reference, Tools).";
  } else if (strategy === 'time') {
    strategyInstruction = "Categorize the following bookmarks into folders based on the era or year they were likely created or are relevant to (e.g., 2023, 2020s, Pre-2010).";
  }

  const prompt = `
    You are an expert bookmark organizer. ${strategyInstruction}
    Existing folders: ${existingFolders.join(', ')}.
    If none of the existing folders fit perfectly, you can suggest a new, concise folder name.
    
    Bookmarks to categorize:
    ${JSON.stringify(bookmarks.map(b => ({ id: b.id, title: b.title, url: b.url })))}
  `;

  const response = await ai.models.generateContent({
    model: model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING, description: "The ID of the bookmark" },
            suggestedFolder: { type: Type.STRING, description: "The name of the folder" }
          },
          required: ["id", "suggestedFolder"]
        }
      }
    }
  });

  if (!response.text) {
    throw new Error("No response from Gemini");
  }

  return JSON.parse(response.text);
}

export async function enrichBookmarksWithAI(bookmarks: any[], model: string = "gemini-3-flash-preview") {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Gemini API key is missing. Please add it to your .env file.");
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
    You are an expert bookmark curator. For each of the following bookmarks, generate:
    1. A concise 1-sentence summary of what the page is likely about based on its title and URL.
    2. An array of 3 highly relevant, short tags.
    
    Bookmarks:
    ${JSON.stringify(bookmarks.map(b => ({ id: b.id, title: b.title, url: b.url })))}
  `;

  const response = await ai.models.generateContent({
    model: model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            summary: { type: Type.STRING },
            tags: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING } 
            }
          },
          required: ["id", "summary", "tags"]
        }
      }
    }
  });

  if (!response.text) {
    throw new Error("No response from Gemini");
  }

  return JSON.parse(response.text);
}
