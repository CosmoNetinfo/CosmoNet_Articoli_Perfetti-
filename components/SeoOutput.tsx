import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { SeoResult, SeoChecklistItem } from '../types';
import { Loader } from './Loader';
import { ClipboardIcon, CheckIcon, EyeIcon, CodeBracketIcon, CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon, BookmarkIcon, PhotoIcon, SparklesIcon } from './IconComponents';
import { generateImage } from '../services/geminiService';

interface SeoOutputProps {
    result: SeoResult | null;
    isLoading: boolean;
    error: string | null;
    onSave: (finalHtml?: string) => void;
}

const OutputPlaceholder: React.FC = () => (
    <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 p-8 border-2 border-dashed border-slate-700 rounded-lg">
        <CodeBracketIcon className="w-16 h-16 mb-4"/>
        <h3 className="text-xl font-semibold text-slate-400">In attesa dell'articolo</h3>
        <p>L'analisi SEO e il contenuto ottimizzato appariranno qui.</p>
    </div>
);

const HtmlCopyButton: React.FC<{ textToCopy: string }> = ({ textToCopy }) => {
    const [copied, setCopied] = useState(false);
    const handleCopy = useCallback(() => {
        navigator.clipboard.writeText(textToCopy).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    }, [textToCopy]);

    return (
        <button onClick={handleCopy} className="absolute top-3 right-3 p-2 bg-slate-700/50 hover:bg-slate-600/50 rounded-md transition-colors z-10" title="Copy HTML">
            {copied ? <CheckIcon className="w-5 h-5 text-green-400" /> : <ClipboardIcon className="w-5 h-5 text-slate-400" />}
        </button>
    );
};

const SeoDataItem: React.FC<{ label: string; value: string; mono?: boolean }> = ({ label, value, mono = false }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = useCallback(() => {
        if (!value) return;
        navigator.clipboard.writeText(value).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    }, [value]);

    return (
        <div className="relative">
            <label className="block text-sm font-medium text-slate-400 mb-1">{label}</label>
            <div className="flex items-center">
                <p className={`w-full text-slate-200 p-2 pr-10 bg-slate-800 rounded text-sm whitespace-pre-wrap break-words ${mono ? 'font-mono' : ''}`}>
                    {value}
                </p>
                <button
                    onClick={handleCopy}
                    title={`Copia ${label}`}
                    className="absolute right-2 p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-md transition-colors"
                >
                    {copied ? <CheckIcon className="w-4 h-4 text-green-400" /> : <ClipboardIcon className="w-4 h-4" />}
                </button>
            </div>
        </div>
    );
};


const ChecklistStatusIcon: React.FC<{ status: 'pass' | 'fail' | 'manual_action' }> = ({ status }) => {
    switch (status) {
        case 'pass':
            return <CheckCircleIcon className="w-6 h-6 text-green-500 flex-shrink-0" />;
        case 'fail':
            return <XCircleIcon className="w-6 h-6 text-red-500 flex-shrink-0" />;
        case 'manual_action':
            return <ExclamationTriangleIcon className="w-6 h-6 text-yellow-500 flex-shrink-0" />;
        default:
            return null;
    }
};

const KeywordDensityIndicator: React.FC<{ count: number; limit: number }> = ({ count, limit }) => {
    const percentage = Math.min((count / limit) * 100, 100);
    let barColor = 'bg-green-500';
    if (percentage > 80) {
        barColor = 'bg-red-500';
    } else if (percentage > 50) {
        barColor = 'bg-yellow-500';
    }

    return (
        <div className="mt-2">
            <div className="flex justify-between items-center mb-1 text-sm">
                <span className="font-medium text-slate-300">Utilizzo</span>
                <span className="font-mono text-slate-300">{count} / {limit}</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2.5">
                <div className={`${barColor} h-2.5 rounded-full transition-all duration-500`} style={{ width: `${percentage}%` }}></div>
            </div>
        </div>
    );
};

const SeoChecklistReport: React.FC<{ checklist: SeoChecklistItem[] }> = ({ checklist }) => {
    const parseKeywordCount = (details: string): number | null => {
        const match = details.match(/\b(\d+)\b/);
        return match ? parseInt(match[0], 10) : null;
    };

    return (
        <div>
            <h3 className="text-xl font-semibold mb-3 text-indigo-400">Analisi Checklist SEO</h3>
            <div className="space-y-3">
                {checklist.map((check, index) => {
                    const isKeywordDensityItem = check.item.toLowerCase().includes('densità');
                    const keywordCount = isKeywordDensityItem ? parseKeywordCount(check.details) : null;

                    return (
                        <div key={index} className="flex items-start gap-3 bg-slate-900 p-3 rounded-lg border border-slate-700">
                            <ChecklistStatusIcon status={check.status} />
                            <div className="flex-1">
                                <p className="font-semibold text-slate-200">{check.item}</p>
                                <p className="text-sm text-slate-400">{check.details}</p>
                                {isKeywordDensityItem && keywordCount !== null && (
                                    <KeywordDensityIndicator count={keywordCount} limit={10} />
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};


const ImageGenerator: React.FC<{ keyPhrase: string; onImageGenerated: (url: string) => void }> = ({ keyPhrase, onImageGenerated }) => {
    const [prompt, setPrompt] = useState('');
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const handleGenerate = useCallback(async () => {
        if (!prompt.trim()) return;
        setIsGenerating(true);
        setError(null);
        setGeneratedImage(null);
        try {
            const imageData = await generateImage(prompt);
            const imageUrl = `data:image/jpeg;base64,${imageData}`;
            setGeneratedImage(imageUrl);
            onImageGenerated(imageUrl);
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'Errore sconosciuto durante la generazione dell\'immagine.';
            setError(errorMessage);
        } finally {
            setIsGenerating(false);
        }
    }, [prompt, onImageGenerated]);

    const imageHtml = generatedImage ? `<img src="${generatedImage}" alt="${keyPhrase}" style="width: 50%; max-width: 100%; height: auto; display: block; margin: 20px auto;" />` : '';

    const handleCopyHtml = useCallback(() => {
        if (!imageHtml) return;
        navigator.clipboard.writeText(imageHtml).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    }, [imageHtml]);
    

    return (
        <div>
            <h3 className="text-xl font-semibold mb-3 text-indigo-400">Generatore di Immagini</h3>
            <div className="bg-slate-900 p-4 rounded-lg border border-slate-700 space-y-4">
                <div className="flex flex-col sm:flex-row gap-2">
                    <input
                        type="text"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Descrivi l'immagine da creare..."
                        className="w-full p-2 bg-slate-800 border border-slate-700 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200 text-slate-300"
                        disabled={isGenerating}
                    />
                    <button 
                        onClick={handleGenerate} 
                        disabled={isGenerating || !prompt.trim()}
                        className="flex items-center justify-center gap-2 w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-900/50 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg transition-all duration-200"
                    >
                        {isGenerating ? 'Generazione...' : <><SparklesIcon className="w-5 h-5" /> Genera</>}
                    </button>
                </div>
                
                {isGenerating && <div className="flex justify-center py-4"><Loader /></div>}
                {error && <p className="text-center text-red-400 bg-red-900/20 p-3 rounded-md border border-red-800">{error}</p>}
                
                {generatedImage && (
                    <div className="space-y-4 pt-4">
                        <img src={generatedImage} alt={prompt} className="rounded-lg border-2 border-slate-700 max-w-full mx-auto" />
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Codice HTML da copiare</label>
                             <div className="relative group">
                                <pre className="p-3 pr-12 bg-slate-800 rounded text-sm text-cyan-300 whitespace-pre-wrap break-all overflow-x-auto">
                                    <code>{imageHtml}</code>
                                </pre>
                                <button
                                    onClick={handleCopyHtml}
                                    title="Copia HTML"
                                    className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-white bg-slate-700/50 hover:bg-slate-600/80 rounded-md transition-all opacity-50 group-hover:opacity-100"
                                >
                                    {copied ? <CheckIcon className="w-4 h-4 text-green-400" /> : <ClipboardIcon className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};


export const SeoOutput: React.FC<SeoOutputProps> = ({ result, isLoading, error, onSave }) => {
    const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');
    const [justSaved, setJustSaved] = useState(false);
    const [imageMap, setImageMap] = useState<Record<number, string>>({});
    const [lastGeneratedImageUrl, setLastGeneratedImageUrl] = useState<string | null>(null);

    // Reset image map when result changes (new optimization)
    useEffect(() => {
        setImageMap({});
        setLastGeneratedImageUrl(null);
    }, [result]);

    const placeholders = useMemo(() => {
        if (!result) return [];
        const regex = /<!-- IMAGE_PLACEHOLDER: (.*?) -->/g;
        const matches = [];
        let match;
        // Reset lastIndex to ensure loop starts from beginning if regex is reused (though regex is created fresh here)
        while ((match = regex.exec(result.htmlContent)) !== null) {
            matches.push({ index: matches.length, alt: match[1], fullMatch: match[0] });
        }
        return matches;
    }, [result]);

    const finalHtml = useMemo(() => {
        if (!result) return '';
        let count = 0;
        return result.htmlContent.replace(/<!-- IMAGE_PLACEHOLDER: (.*?) -->/g, (match, alt) => {
            const url = imageMap[count];
            count++;
            if (url) {
                return `<img src="${url}" alt="${alt}" style="width: 50%; max-width: 100%; height: auto; display: block; margin: 20px auto; border-radius: 8px;" />`;
            }
            return match;
        });
    }, [result, imageMap]);

    const handleSave = () => {
        onSave(finalHtml);
        setJustSaved(true);
        setTimeout(() => setJustSaved(false), 2500);
    };

    const handleImageMapChange = (index: number, value: string) => {
        setImageMap(prev => ({ ...prev, [index]: value }));
    };


    const renderContent = () => {
        if (isLoading) {
            return <div className="flex items-center justify-center h-full"><Loader /></div>;
        }
        if (error) {
            return <div className="flex items-center justify-center h-full text-red-400 bg-red-900/20 p-4 rounded-lg border border-red-800">{error}</div>;
        }
        if (!result) {
            return <OutputPlaceholder />;
        }

        const previewHtml = `<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${result.title}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
            line-height: 1.8;
            font-size: 18px;
            color: #333;
            max-width: 800px;
            margin: 2rem auto;
            padding: 0 1.5rem;
            background-color: #fff;
        }
        h1, h2, h3, h4, h5, h6 {
            margin-top: 2.2em;
            margin-bottom: 0.8em;
            color: #1a1a1a;
            line-height: 1.3;
            font-weight: 700;
        }
        h1 { font-size: 2.4rem; }
        h2 { font-size: 2rem; }
        h3 { font-size: 1.6rem; }
        img {
            max-width: 100%;
            height: auto;
            border-radius: 8px;
            margin: 2.5rem 0;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            display: block;
        }
        a {
            color: #0056b3;
            text-decoration: none;
            font-weight: 500;
        }
        a:hover { text-decoration: underline; }
        p { margin-bottom: 1.3em; }
        ul, ol {
            padding-left: 2em;
            margin-bottom: 1.3em;
        }
        li { margin-bottom: 0.6em; }
        blockquote {
            border-left: 4px solid #ccc;
            padding-left: 1.5rem;
            margin: 2em 0;
            color: #6c757d;
            font-style: italic;
            font-size: 1.2rem;
        }
        code {
            background-color: #e9ecef;
            padding: 0.2em 0.4em;
            border-radius: 3px;
            font-size: 85%;
        }
        pre {
            background-color: #e9ecef;
            padding: 1rem;
            border-radius: 8px;
            overflow-x: auto;
            margin: 2em 0;
        }
        pre code {
            padding: 0;
            font-size: inherit;
            background-color: transparent;
        }
    </style>
</head>
<body>
    ${finalHtml}
</body>
</html>`;

        return (
             <div className="space-y-6">
                <div>
                    <h3 className="text-xl font-semibold mb-3 text-indigo-400">Dati SEO e Contenuti Generati</h3>
                    <div className="bg-slate-900 p-4 rounded-lg border border-slate-700 space-y-4">
                        <SeoDataItem label="Frase Chiave Primaria" value={result.keyPhrase} mono />
                        <SeoDataItem label="Meta Title" value={result.title} mono />
                        <SeoDataItem label="Meta Description" value={result.description} />
                        <SeoDataItem label="URL Slug" value={result.slug} mono />
                        <SeoDataItem label="Tag SEO" value={result.tags} />
                        <SeoDataItem label="Categorie Blog" value={result.categories} />
                        <hr className="border-slate-700" />
                        <SeoDataItem label="Post per Social Media" value={result.socialMediaPost} />
                    </div>
                </div>

                <SeoChecklistReport checklist={result.seoChecklist} />

                <ImageGenerator keyPhrase={result.keyPhrase} onImageGenerated={setLastGeneratedImageUrl} />

                {placeholders.length > 0 && (
                    <div>
                        <h3 className="text-xl font-semibold mb-3 text-indigo-400">Gestione Immagini nel Testo</h3>
                        <div className="bg-slate-900 p-4 rounded-lg border border-slate-700 space-y-4">
                            <p className="text-sm text-slate-400 mb-2">L'IA ha identificato {placeholders.length} punti dove inserire immagini. Incolla l'URL dell'immagine qui sotto.</p>
                            {placeholders.map((p, idx) => (
                                <div key={idx} className="bg-slate-800/50 p-3 rounded border border-slate-700">
                                    <div className="flex items-center gap-2 mb-2 text-indigo-300 text-sm font-semibold">
                                        <PhotoIcon className="w-4 h-4" />
                                        <span>Immagine {idx + 1}</span>
                                    </div>
                                    <p className="text-xs text-slate-500 mb-1">Alt Text Suggerito:</p>
                                    <p className="text-sm text-slate-300 mb-3 italic">"{p.alt}"</p>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={imageMap[idx] || ''}
                                            onChange={(e) => handleImageMapChange(idx, e.target.value)}
                                            placeholder="https://esempio.com/immagine.jpg"
                                            className="flex-1 p-2 bg-slate-900 border border-slate-700 rounded text-sm text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                        />
                                        {lastGeneratedImageUrl && (
                                            <button
                                                onClick={() => handleImageMapChange(idx, lastGeneratedImageUrl)}
                                                className="px-3 py-2 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 text-xs font-semibold rounded border border-indigo-600/30 transition-colors"
                                                title="Usa l'immagine appena generata"
                                            >
                                                Usa Generata
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div>
                    <div className="flex justify-between items-center mb-2 flex-wrap gap-2">
                        <h3 className="text-xl font-semibold text-indigo-400">Articolo Ottimizzato</h3>
                        <div className="flex items-center gap-2">
                             <button
                                onClick={handleSave}
                                disabled={justSaved}
                                className="px-3 py-1 text-sm rounded-md transition-colors flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 disabled:bg-green-800/40 disabled:border-green-700"
                            >
                                {justSaved ? (
                                    <>
                                        <CheckIcon className="w-5 h-5 text-green-400" />
                                        <span className="text-green-400">Salvato!</span>
                                    </>
                                ) : (
                                    <>
                                        <BookmarkIcon className="w-5 h-5" />
                                        <span>Salva</span>
                                    </>
                                )}
                            </button>
                            <div className="flex items-center bg-slate-800 p-1 rounded-lg border border-slate-700">
                                <button
                                    onClick={() => setViewMode('preview')}
                                    className={`px-3 py-1 text-sm rounded-md transition-colors flex items-center gap-1.5 ${viewMode === 'preview' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}
                                >
                                    <EyeIcon className="w-5 h-5" />
                                    Preview
                                </button>
                                <button
                                    onClick={() => setViewMode('code')}
                                    className={`px-3 py-1 text-sm rounded-md transition-colors flex items-center gap-1.5 ${viewMode === 'code' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}
                                >
                                    <CodeBracketIcon className="w-5 h-5" />
                                    HTML
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="relative bg-slate-900 border border-slate-700 rounded-lg min-h-[300px] max-h-[50vh] overflow-auto">
                        {viewMode === 'code' ? (
                            <>
                                <pre className="p-4 text-sm text-cyan-300 whitespace-pre-wrap break-words">
                                    <code>{finalHtml}</code>
                                </pre>
                                <HtmlCopyButton textToCopy={finalHtml} />
                            </>
                        ) : (
                             <div className="p-1">
                                <iframe
                                    srcDoc={previewHtml}
                                    title="HTML Preview"
                                    className="w-full h-[48vh] bg-white rounded-md"
                                    sandbox="allow-scripts"
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="bg-slate-800/50 p-6 rounded-lg shadow-lg border border-slate-700 h-full overflow-y-auto">
            {renderContent()}
        </div>
    );
};