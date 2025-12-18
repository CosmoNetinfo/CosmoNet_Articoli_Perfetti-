
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ArticleInput } from './components/ArticleInput';
import { SeoOutput } from './components/SeoOutput';
import { optimizeArticleForSeo, enrichArticleDepth } from './services/geminiService';
import { SeoResult, SavedSeoResult } from './types';
import { SparklesIcon } from './components/IconComponents';
import { LoadModal } from './components/LoadModal';

const App: React.FC = () => {
    const [articleText, setArticleText] = useState<string>('');
    const [seoResult, setSeoResult] = useState<SeoResult | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isEnriching, setIsEnriching] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [savedArticles, setSavedArticles] = useState<SavedSeoResult[]>([]);
    const [isLoadModalOpen, setIsLoadModalOpen] = useState(false);
    const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);

    const STORAGE_KEY = 'seo-optimizer-saved-articles';
    const AUTOSAVE_KEY = 'cosmonet-autosave-draft';
    const articleTextRef = useRef(articleText);

    useEffect(() => { articleTextRef.current = articleText; }, [articleText]);

    useEffect(() => {
        try {
            const storedArticles = localStorage.getItem(STORAGE_KEY);
            if (storedArticles) setSavedArticles(JSON.parse(storedArticles));
            const autoSavedDraft = localStorage.getItem(AUTOSAVE_KEY);
            if (autoSavedDraft) {
                setArticleText(autoSavedDraft);
                setLastAutoSave(new Date());
            }
        } catch (error) { localStorage.removeItem(STORAGE_KEY); }
    }, []);

    useEffect(() => {
        const intervalId = setInterval(() => {
            const currentText = articleTextRef.current;
            if (currentText?.trim()) {
                localStorage.setItem(AUTOSAVE_KEY, currentText);
                setLastAutoSave(new Date());
            }
        }, 120000);
        return () => clearInterval(intervalId);
    }, []);

    const handleOptimize = useCallback(async () => {
        if (!articleText.trim()) {
            setError('Inserisci il testo dell\'articolo.');
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const result = await optimizeArticleForSeo(articleText);
            setSeoResult(result);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Errore inaspettato.');
        } finally {
            setIsLoading(false);
        }
    }, [articleText]);

    const handleIncreaseDepth = useCallback(async () => {
        if (!seoResult) return;
        setIsEnriching(true);
        setError(null);
        try {
            const enriched = await enrichArticleDepth(seoResult, articleText);
            setSeoResult(enriched);
        } catch (e) {
            setError("Impossibile arricchire l'articolo. Riprova.");
        } finally {
            setIsEnriching(false);
        }
    }, [seoResult, articleText]);

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
                </header>

                <main className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <ArticleInput
                        value={articleText}
                        onChange={setArticleText}
                        onOptimize={handleOptimize}
                        isLoading={isLoading || isEnriching}
                        onLoadClick={() => setIsLoadModalOpen(true)}
                        savedCount={savedArticles.length}
                        lastAutoSave={lastAutoSave}
                        onExportDB={() => {}}
                        onImportDB={() => {}}
                    />
                    <SeoOutput
                        result={seoResult}
                        isLoading={isLoading}
                        isEnriching={isEnriching}
                        onIncreaseDepth={handleIncreaseDepth}
                        error={error}
                        onSave={handleSaveArticle}
                    />
                </main>
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
