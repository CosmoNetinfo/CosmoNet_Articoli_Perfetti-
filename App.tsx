import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ArticleInput } from './components/ArticleInput';
import { SeoOutput } from './components/SeoOutput';
import { optimizeArticleForSeo } from './services/geminiService';
import { SeoResult, SavedSeoResult } from './types';
import { SparklesIcon } from './components/IconComponents';
import { LoadModal } from './components/LoadModal';

const App: React.FC = () => {
    const [articleText, setArticleText] = useState<string>('');
    const [seoResult, setSeoResult] = useState<SeoResult | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [savedArticles, setSavedArticles] = useState<SavedSeoResult[]>([]);
    const [isLoadModalOpen, setIsLoadModalOpen] = useState(false);
    const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);

    const STORAGE_KEY = 'seo-optimizer-saved-articles';
    const AUTOSAVE_KEY = 'cosmonet-autosave-draft';
    
    // Ref per accedere al valore corrente di articleText all'interno del setInterval senza re-triggerare l'effetto
    const articleTextRef = useRef(articleText);

    // Manteniamo il ref sincronizzato
    useEffect(() => {
        articleTextRef.current = articleText;
    }, [articleText]);

    // Caricamento dati iniziali (Articoli salvati + Bozza automatica)
    useEffect(() => {
        try {
            const storedArticles = localStorage.getItem(STORAGE_KEY);
            if (storedArticles) {
                setSavedArticles(JSON.parse(storedArticles));
            }
            
            // Ripristino bozza automatica
            const autoSavedDraft = localStorage.getItem(AUTOSAVE_KEY);
            if (autoSavedDraft) {
                setArticleText(autoSavedDraft);
                setLastAutoSave(new Date()); // Indichiamo che c'è un contenuto recuperato
            }
        } catch (error) {
            console.error("Failed to load data from localStorage", error);
            localStorage.removeItem(STORAGE_KEY);
        }
    }, []);

    // Timer per Auto-Save ogni 2 minuti (120000 ms)
    useEffect(() => {
        const intervalId = setInterval(() => {
            const currentText = articleTextRef.current;
            if (currentText && currentText.trim().length > 0) {
                localStorage.setItem(AUTOSAVE_KEY, currentText);
                setLastAutoSave(new Date());
            }
        }, 120000);

        return () => clearInterval(intervalId);
    }, []);

    const handleOptimize = useCallback(async () => {
        if (!articleText.trim()) {
            setError('Per favore, inserisci il testo dell\'articolo da ottimizzare.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setSeoResult(null);

        try {
            const result = await optimizeArticleForSeo(articleText);
            setSeoResult(result);
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'Si è verificato un errore inaspettato.';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, [articleText]);

    const handleSaveArticle = useCallback((finalHtml?: string) => {
        if (!seoResult) return;

        const newSavedArticle: SavedSeoResult = {
            ...seoResult,
            htmlContent: finalHtml || seoResult.htmlContent,
            id: Date.now().toString(),
            originalArticleText: articleText,
        };

        const updatedArticles = [...savedArticles, newSavedArticle];
        setSavedArticles(updatedArticles);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedArticles));
    }, [seoResult, articleText, savedArticles]);

    const handleLoadArticle = useCallback((article: SavedSeoResult) => {
        setArticleText(article.originalArticleText);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, originalArticleText, ...resultData } = article;
        setSeoResult(resultData);
        setIsLoadModalOpen(false);
        setError(null);
    }, []);

    const handleDeleteArticle = useCallback((articleId: string) => {
        const updatedArticles = savedArticles.filter(a => a.id !== articleId);
        setSavedArticles(updatedArticles);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedArticles));
    }, [savedArticles]);


    return (
        <div className="bg-slate-900 min-h-screen text-slate-200 font-sans">
            <div className="container mx-auto p-4 md:p-8">
                <header className="text-center mb-8 md:mb-12">
                    <div className="flex items-center justify-center gap-3">
                        <SparklesIcon className="w-10 h-10 text-indigo-400" />
                        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 text-transparent bg-clip-text">
                            CosmoNet_Articoli_Perfetti
                        </h1>
                    </div>
                    <p className="mt-4 text-slate-400 max-w-2xl mx-auto">
                        Incolla il tuo articolo qui sotto. La nostra IA lo ottimizzerà secondo la checklist SEO di Cosmonet.info e lo strutturerà in HTML pulito.
                    </p>
                </header>

                <main className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <ArticleInput
                        value={articleText}
                        onChange={setArticleText}
                        onOptimize={handleOptimize}
                        isLoading={isLoading}
                        onLoadClick={() => setIsLoadModalOpen(true)}
                        savedCount={savedArticles.length}
                        lastAutoSave={lastAutoSave}
                    />
                    <SeoOutput
                        result={seoResult}
                        isLoading={isLoading}
                        error={error}
                        onSave={handleSaveArticle}
                    />
                </main>
                 <footer className="text-center mt-12 text-slate-500">
                    <p>Powered by Google Gemini</p>
                </footer>
            </div>
            <LoadModal
                isOpen={isLoadModalOpen}
                onClose={() => setIsLoadModalOpen(false)}
                articles={savedArticles}
                onLoad={handleLoadArticle}
                onDelete={handleDeleteArticle}
            />
        </div>
    );
};

export default App;