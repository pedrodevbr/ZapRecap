import { GoogleGenAI, Type } from "@google/genai";
import { SessionStats, ChatPersona } from "../types";

// Initialize AI Client
// Note: process.env.API_KEY is assumed to be available in the build environment
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function generateChatPersona(stats: SessionStats): Promise<ChatPersona> {
  // 1. Generate Text Analysis (Title/Description)
  const topWords = stats.top_words?.slice(0, 10).map(w => w.word).join(", ") || "";
  const topAuthors = Object.entries(stats.messages_by_author || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name]) => name)
    .join(", ");

  const prompt = `
    Analise as seguintes estatísticas de um grupo de WhatsApp e defina uma 'Persona' (Classe/Arquétipo) engraçada e viral para eles.
    
    Dados:
    - Total Mensagens: ${stats.total_messages}
    - Participantes: ${stats.participant_count}
    - Horário de Pico: ${stats.most_active_hour}
    - Dia mais ativo: ${stats.top_active_day}
    - Top Palavras: ${topWords}
    - Top Membros: ${topAuthors}

    Responda EXCLUSIVAMENTE com um objeto JSON seguindo este schema. 
    O 'title' deve ser curto, criativo e em Português (ex: "Os Inimigos do Fim", "A Seita do Bom Dia", "Os Áudios de 5 min").
    A 'description' deve ser uma frase curta e debochada sobre o comportamento do grupo.
    O 'imagePrompt' deve ser um prompt em inglês descrevendo uma imagem visualmente impactante, surrealista ou artistica que represente essa vibe, sem texto, estilo poster 3D.
  `;

  try {
    const textResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            imagePrompt: { type: Type.STRING },
          },
          required: ["title", "description", "imagePrompt"],
        },
      },
    });

    const personaData = JSON.parse(textResponse.text || "{}") as ChatPersona;

    // 2. Generate Image based on the persona
    try {
        const imageResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash-image",
            contents: {
                parts: [
                    { text: personaData.imagePrompt + " high quality, 4k, vibrant colors, 3d render style, abstract background, no text" }
                ]
            },
            config: {
                imageConfig: {
                    aspectRatio: "1:1"
                }
            }
        });

        // Extract image
        let imageUrl = "";
        for (const part of imageResponse.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                imageUrl = `data:image/png;base64,${part.inlineData.data}`;
                break;
            }
        }
        
        return {
            ...personaData,
            imageUrl: imageUrl
        };

    } catch (imgError) {
        console.error("Image generation failed:", imgError);
        return personaData; // Return text only if image fails
    }

  } catch (error) {
    console.error("AI Generation failed:", error);
    // Fallback
    return {
      title: "Os Misteriosos",
      description: "A inteligência artificial não conseguiu decifrar esse enigma.",
      imagePrompt: "Mystery box",
    };
  }
}