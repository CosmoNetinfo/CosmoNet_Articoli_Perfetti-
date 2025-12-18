
import { GoogleGenAI, Type } from "@google/genai";
import { SeoResult, GroundingSource } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const responseSchema = {
    type: Type.OBJECT,
    properties: {
        keyPhrase: { type: Type.STRING },
        title: { type: Type.STRING },
        description: { type: Type.STRING },
        slug: { type: Type.STRING },
        htmlContent: { type: Type.STRING },
        tags: { type: Type.STRING },
        categories: { type: Type.STRING },
        socialMediaPost: { type: Type.STRING },
        seoChecklist: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    item: { type: Type.STRING },
                    status: { type: Type.STRING },
                    details: { type: Type.STRING }
                },
                required: ["item", "status", "details"]
            }
        },
        readability: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    criteria: { type: Type.STRING },
                    status: { type: Type.STRING },
                    score: { type: Type.STRING },
                    message: { type: Type.STRING }
                },
                required: ["criteria", "status", "score", "message"]
            }
        }
    },
    required: ["keyPhrase", "title", "description", "slug", "htmlContent", "tags", "categories", "seoChecklist", "socialMediaPost", "readability"],
};

export const optimizeArticleForSeo = async (articleText: string): Promise<SeoResult> => {
    try {
        const prompt = `Sei un Senior SEO Strategist e Content Engineer. Trasforma questo testo in un articolo Pillar (1200+ parole) con focus su autorevolezza e precisione.

**TASSONOMIA E METADATI (FONDAMENTALE):**
1. **TAG SEO (10-15 tag)**: Genera una lista di 10-15 tag iper-pertinenti. Devono essere "long-tail keywords", termini tecnici specifici o entità menzionate nel testo. 
   - EVITA tag generici come "Tecnologia", "News", "Internet".
   - PREFERISCI tag come "[Termine Tecnico Specifico]", "Ottimizzazione [Argomento]", "Guida [Niche]", "[Prodotto] vs [Prodotto]".
   - La lista DEVE essere separata solo da virgole (es: tag1, tag2, tag3).
2. **CATEGORIE (3-5 categorie)**: Genera 3-5 categorie gerarchiche e professionali che riflettano l'architettura di un sito editoriale di alta qualità.
3. **SEO Meta**: Title (max 60 car), Meta Description (max 155 car) e Slug (URL-friendly).

**REGOLE PER IL CONTENUTO:**
- **Ricerca Link Ufficiali**: Usa Google Search per identificare i siti ufficiali, le documentazioni e le pagine di download dei prodotti citati.
- **Link Contestuali**: Inserisci i link ufficiali direttamente nell'HTML (<a href="..." target="_blank">). Niente liste di fonti a fine pagina.
- **HTML5 Semantico**: Struttura ricca con H1, H2, H3, tabelle (se utili), liste e grassetti.

Articolo da processare:
${articleText}`;

        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
                tools: [{ googleSearch: {} }],
            },
        });

        const jsonText = response.text.trim();
        const result: SeoResult = JSON.parse(jsonText);
        result.groundingSources = extractSources(response);
        return result;
    } catch (error) {
        throw new Error("Errore durante l'ottimizzazione SEO. Verifica la connessione.");
    }
};

export const enrichArticleDepth = async (currentResult: SeoResult, originalText: string): Promise<SeoResult> => {
    try {
        const prompt = `Espandi l'articolo esistente per massimizzare il valore informativo (E-E-A-T).

**ISTRUZIONI DI APPROFONDIMENTO:**
1. **Dati e Link**: Usa Google Search per trovare nuovi dati statistici, specifiche tecniche o link di download ufficiali non ancora presenti.
2. **Integrazione**: Inserisci nuove sezioni HTML (H2/H3) con il contenuto arricchito.
3. **Tassonomia**: Aggiorna ed espandi la lista di TAG e CATEGORIE per includere i nuovi argomenti trattati. Genera almeno 15 tag complessivi.

**CONTENUTO ATTUALE**:
${currentResult.htmlContent}`;

        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
                tools: [{ googleSearch: {} }],
            },
        });

        const jsonText = response.text.trim();
        const result: SeoResult = JSON.parse(jsonText);
        
        const newSources = extractSources(response);
        const allSources = [...(currentResult.groundingSources || []), ...newSources];
        result.groundingSources = Array.from(new Map(allSources.map(s => [s.uri, s])).values());
        
        return result;
    } catch (error) {
        throw new Error("Errore durante l'arricchimento del contenuto.");
    }
};

const extractSources = (response: any): GroundingSource[] => {
    const sources: GroundingSource[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
        chunks.forEach((chunk: any) => {
            if (chunk.web?.uri) {
                sources.push({
                    title: chunk.web.title || "Fonte esterna",
                    uri: chunk.web.uri
                });
            }
        });
    }
    return Array.from(new Map(sources.map(s => [s.uri, s])).values());
};

export const generateImage = async (prompt: string): Promise<string> => {
    try {
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: `High-quality professional editorial illustration: ${prompt}`,
            config: { numberOfImages: 1, outputMimeType: 'image/jpeg', aspectRatio: '16:9' },
        });
        return response.generatedImages?.[0]?.image.imageBytes || "";
    } catch (error) { return ""; }
};
