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
        }
    },
    required: ["keyPhrase", "title", "description", "slug", "htmlContent", "tags", "categories", "seoChecklist", "socialMediaPost"],
};


export const optimizeArticleForSeo = async (articleText: string): Promise<SeoResult> => {
    try {
        const prompt = `Sei un esperto stratega di contenuti SEO e sviluppatore front-end che segue rigorosamente la "Checklist SEO Cosmonet.info". Il tuo compito è analizzare l'articolo dell'utente, ottimizzarlo secondo ogni singolo punto della checklist e strutturarlo in un HTML pulito e semantico pronto per WordPress. La lingua per tutti i contenuti generati deve essere l'italiano.

⚠️ ⚠️ ⚠️ REGOLA FONDAMENTALE - ESPANSIONE CONTENUTO ⚠️ ⚠️ ⚠️
Il tuo compito è TRASFORMARE il testo fornito in un ARTICOLO COMPLETO E PROFONDO di almeno 1000 parole.

COSA DEVI FARE (ESPANSIONE):
✅ SE il testo è breve -> ESPANDILO massicciamente approfondendo ogni concetto.
✅ SE il testo è lungo -> Preservalo o miglioralo aggiungendo dettagli.
✅ OBIETTIVO MINIMO: 1000 PAROLE.
✅ Aggiungi ESEMPI pratici, Spiegazioni dettagliate, Liste puntate, Tabelle comparative.
✅ Usa paragrafi brevi ma numerosi.
✅ Scrivi in ottica "Semantic SEO": copri l'argomento in modo esaustivo per diventare la risorsa n.1 su Google.

COSA NON DEVI FARE:
❌ NON essere sintetico.
❌ NON riassumere.
❌ NON tagliare concetti.
❌ NON fermarti a superficiali descrizioni: vai a fondo.

**Checklist SEO Cosmonet.info (OBBLIGATORIA):**
- Frase chiave: Unica, mai usata prima, lunghezza appropriata
- Titolo SEO: Inizia con frase chiave, 50-60 caratteri
- Introduzione: Inizia con frase chiave
- Meta Description: Include frase chiave, max 155 caratteri
- URL Slug: Contiene frase chiave, semplice
- Densità: Naturale, ma presente
- Immagini: MINIMO 3 segnaposto <!-- IMAGE_PLACEHOLDER: alt con keyword -->
- LUNGHEZZA: Obiettivo 1000+ parole (o +30% dell'originale se già lungo)
- Link interni: MINIMO 2 <!-- INSERIRE LINK INTERNO: testo -->
- Link esterni: MINIMO 1 autorevole
- Struttura: H1 potente, H2 per sezioni principali, H3 per dettagli

**COMPITI:**
1. Genera un articolo RICCO e DETTAGLIATO (Target 1000 parole)
2. Preserva il tone of voice ma rendilo autorevole
3. Espandi i punti elenco in paragrafi completi
4. MINIMO 3 <!-- IMAGE_PLACEHOLDER: alt descrittivo -->
5. MINIMO 2 <!-- INSERIRE LINK INTERNO: --> + 1 link esterno
6. Genera: keyphrase, title, description, slug, tags
7. Suggerisci 3-5 categorie
8. Post social engaging con hashtag
9. HTML pulito (solo body tags: h1-h3 p table ol ul)
10. Analisi checklist con status

**RISPONDI SOLO CON JSON VALIDO:**
{
  "keyPhrase": "frase chiave primaria",
  "title": "Titolo SEO 50-60 char",
  "description": "Meta max 155 char",
  "slug": "url-slug-ottimizzato",
  "htmlContent": "HTML COMPLETO SEMANTICO",
  "tags": "tag1, tag2, tag3",
  "categories": "Cat1, Cat2, Cat3",
  "socialMediaPost": "Post social #hashtag",
  "seoChecklist": [{"item":"nome","status":"pass/fail","details":"spiegazione"}]
}

**Articolo da analizzare:**
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