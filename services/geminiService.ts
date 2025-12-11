import { GoogleGenAI, Type } from "@google/genai";
import { SeoResult } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const responseSchema = {
    type: Type.OBJECT,
    properties: {
        keyPhrase: {
            type: Type.STRING,
            description: "La frase chiave primaria che hai identificato e usato per ottimizzare l'articolo."
        },
        title: {
            type: Type.STRING,
            description: "Il titolo SEO ottimizzato (50-60 caratteri) che inizia con la frase chiave."
        },
        description: {
            type: Type.STRING,
            description: "La meta description ottimizzata (massimo 155 caratteri) che include la frase chiave."
        },
        slug: {
            type: Type.STRING,
            description: "L'URL slug, breve, descrittivo e contenente la frase chiave."
        },
        htmlContent: {
            type: Type.STRING,
            description: "L'articolo in formato HTML, contenente solo i tag che andrebbero nel `<body>`. Pronto per essere incollato in un editor CMS come WordPress."
        },
        tags: {
            type: Type.STRING,
            description: "Una lista di tag SEO pertinenti per l'articolo, separati da una virgola."
        },
        categories: {
            type: Type.STRING,
            description: "Una lista di 3-5 categorie di blog pertinenti per l'articolo, separate da una virgola."
        },
        socialMediaPost: {
            type: Type.STRING,
            description: "Un breve e accattivante post per i social media (es. Twitter, Facebook, LinkedIn) per promuovere l'articolo, includendo hashtag pertinenti."
        },
        seoChecklist: {
            type: Type.ARRAY,
            description: "Un'analisi punto per punto della checklist SEO.",
            items: {
                type: Type.OBJECT,
                properties: {
                    item: { type: Type.STRING, description: "Il punto della checklist analizzato." },
                    status: { type: Type.STRING, description: "Lo stato: 'pass', 'fail', o 'manual_action'." },
                    details: { type: Type.STRING, description: "Una spiegazione di come il punto è stato soddisfatto o cosa deve essere fatto manualmente." }
                },
                required: ["item", "status", "details"]
            }
        },
        readability: {
            type: Type.ARRAY,
            description: "Analisi della leggibilità basata sui 6 criteri richiesti.",
            items: {
                type: Type.OBJECT,
                properties: {
                    criteria: { type: Type.STRING, description: "Il criterio analizzato (es. Forme passive)." },
                    status: { type: Type.STRING, description: "Lo stato: 'good', 'ok', o 'needs_improvement'." },
                    score: { type: Type.STRING, description: "Il valore numerico o qualitativo (es. '15%', 'Nessuna')." },
                    message: { type: Type.STRING, description: "Feedback specifico o suggerimento per migliorare." }
                },
                required: ["criteria", "status", "score", "message"]
            }
        }
    },
    required: ["keyPhrase", "title", "description", "slug", "htmlContent", "tags", "categories", "seoChecklist", "socialMediaPost", "readability"],
};


export const optimizeArticleForSeo = async (articleText: string): Promise<SeoResult> => {
    try {
        const prompt = `Sei un esperto stratega di contenuti SEO e copywriter che segue rigorosamente la "Checklist SEO Cosmonet.info".
Il tuo compito è analizzare l'articolo dell'utente, ottimizzarlo ed espanderlo, e infine restituire un HTML pulito insieme a un'analisi SEO e di Leggibilità dettagliata.

⚠️ OBIETTIVO CONTENUTO: TRASFORMA IL TESTO IN UN ARTICOLO DI ALMENO 1000 PAROLE.
Approfondisci ogni concetto, aggiungi esempi, liste e dettagli.

**Checklist SEO (Output nel campo seoChecklist):**
- Frase chiave, Titolo SEO, Meta Description, Slug, Densità Keyword, Immagini (placeholder), Link Interni/Esterni, Lunghezza, Struttura H1-H3.

**Checklist LEGGIBILITÀ (Output nel campo readability):**
Analizza il TESTO GENERATO secondo questi criteri precisi:
1. **Parole di transizione**: Controlla la presenza di parole come "perché", "quindi", "tuttavia", "inoltre". (Target: >30% delle frasi).
2. **Frasi consecutive**: Segnala se 3 o più frasi consecutive iniziano con la stessa parola.
3. **Distribuzione sottotitoli**: Verifica che non ci siano sezioni di testo più lunghe di 300 parole senza un sottotitolo.
4. **Forme passive**: Calcola la percentuale di frasi passive. (Target: <10%).
5. **Lunghezza paragrafi**: Nessun paragrafo dovrebbe superare le 150 parole.
6. **Lunghezza frasi**: Nessuna frase dovrebbe superare le 20-25 parole per favorire la lettura.

**HTML Output Rules:**
- Solo tag semantici body (h1, h2, h3, p, ul, ol, strong, em, table).
- Inserisci placeholder immagini: <!-- IMAGE_PLACEHOLDER: descrizione alt -->
- Inserisci placeholder link interni: <!-- INSERIRE LINK INTERNO: testo anchor -->

**RISPONDI SOLO CON JSON VALIDO** secondo lo schema fornito.

**Articolo Originale:**
---
${articleText}
---`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
                temperature: 0.7,
            },
        });

        const jsonText = response.text.trim();
        const result: SeoResult = JSON.parse(jsonText);
        return result;

    } catch (error) {
        console.error("Error optimizing article with Gemini:", error);
        if (error instanceof Error && error.message) {
            if (error.message.includes("RESOURCE_EXHAUSTED")) {
                throw new Error("Hai superato la tua quota API. Controlla il tuo piano e i dettagli di fatturazione nel tuo account Google AI.");
            }
            if (error.message.includes("API key not valid")) {
                throw new Error("La chiave API fornita non è valida. Assicurati che sia configurata correttamente.");
            }
        }
        // Generic fallback error
        throw new Error("Si è verificato un errore imprevisto durante la comunicazione con l'IA. Riprova più tardi.");
    }
};


export const generateImage = async (prompt: string): Promise<string> => {
    try {
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
              numberOfImages: 1,
              outputMimeType: 'image/jpeg',
              aspectRatio: '16:9',
            },
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
            return base64ImageBytes;
        } else {
            throw new Error("L'IA non ha restituito alcuna immagine.");
        }
    } catch (error) {
        console.error("Error generating image with Gemini:", error);
        throw new Error("Si è verificato un errore imprevisto durante la generazione dell'immagine. Riprova.");
    }
};