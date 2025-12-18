
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { SeoResult, SeoChecklistItem, ReadabilityItem, GroundingSource } from '../types';
import { Loader } from './Loader';
import { ClipboardIcon, CheckIcon, EyeIcon, CodeBracketIcon, CheckCircleIcon, ExclamationTriangleIcon, BookmarkIcon, PhotoIcon, SparklesIcon, DocumentMagnifyingGlassIcon, PrinterIcon, ArchiveBoxIcon } from './IconComponents';

interface SeoOutputProps {
    result: SeoResult | null;
    isLoading: boolean;
    isEnriching?: boolean;
    onIncreaseDepth?: () => void;
    error: string | null;
    onSave: (finalHtml?: string) => void;
}

const SeoDataItem: React.FC<{ label: string; value: string; mono?: boolean }> = ({ label, value, mono = false }) => {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(value).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };
    return (
        <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-700/30 group">
            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">{label}</label>
            <div className="flex justify-between items-center gap-2">
                <p className={`text-slate-200 text-sm truncate ${mono ? 'font-mono' : ''}`}>{value}</p>
                <button onClick={handleCopy} className="text-slate-500 hover:text-indigo-400 p-1">
                    {copied ? <CheckIcon className="w-4 h-4 text-green-400" /> : <ClipboardIcon className="w-4 h-4" />}
                </button>
            </div>
        </div>
    );
};

export const SeoOutput: React.FC<SeoOutputProps> = ({ result, isLoading, isEnriching, onIncreaseDepth, error, onSave }) => {
    const [activeTab, setActiveTab] = useState<'seo' | 'readability' | 'content'>('seo');
    const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');
    const [socialCopied, setSocialCopied] = useState(false);
    const [tagsCopied, setTagsCopied] = useState(false);
    const [catsCopied, setCatsCopied] = useState(false);

    const wordCount = useMemo(() => {
        if (!result) return 0;
        const text = result.htmlContent.replace(/<[^>]*>/g, ' ');
        return text.trim().split(/\s+/).length;
    }, [result]);

    const handleCopySocial = () => {
        if (!result) return;
        navigator.clipboard.writeText(result.socialMediaPost).then(() => {
            setSocialCopied(true);
            setTimeout(() => setSocialCopied(false), 2000);
        });
    };

    const handleCopyTags = () => {
        if (!result) return;
        navigator.clipboard.writeText(result.tags).then(() => {
            setTagsCopied(true);
            setTimeout(() => setTagsCopied(false), 2000);
        });
    };

    const handleCopyCats = () => {
        if (!result) return;
        navigator.clipboard.writeText(result.categories).then(() => {
            setCatsCopied(true);
            setTimeout(() => setCatsCopied(false), 2000);
        });
    };

    if (isLoading) return <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 h-full flex items-center justify-center"><Loader /></div>;
    if (error) return <div className="bg-slate-800/50 p-6 rounded-2xl border border-red-900/20 text-red-400 flex items-center justify-center text-center">{error}</div>;
    if (!result) return (
        <div className="bg-slate-800/50 p-12 rounded-2xl border border-slate-700 h-full flex flex-col items-center justify-center text-center text-slate-500">
            <SparklesIcon className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-lg font-medium">L'analisi apparirà qui</p>
            <p className="text-sm">Incolla un testo e clicca su Ottimizza.</p>
        </div>
    );

    return (
        <div className="bg-slate-800/50 rounded-2xl shadow-2xl border border-slate-700/50 flex flex-col h-full overflow-hidden">
            <div className="flex bg-slate-900/50 p-1 border-b border-slate-700/50">
                {[
                    { id: 'seo', icon: DocumentMagnifyingGlassIcon, label: 'SEO Tech' },
                    { id: 'readability', icon: SparklesIcon, label: 'Qualità' },
                    { id: 'content', icon: EyeIcon, label: 'Articolo' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold uppercase transition-all rounded-xl ${
                            activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:text-slate-300'
                        }`}
                    >
                        <tab.icon className="w-4 h-4" /> {tab.label}
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {activeTab === 'seo' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 space-y-6">
                        {/* Status Bar */}
                        <div className="flex justify-between items-center bg-indigo-900/20 p-4 rounded-xl border border-indigo-500/20">
                            <div>
                                <h4 className="text-[10px] uppercase font-bold text-indigo-300">Lunghezza SEO</h4>
                                <p className="text-2xl font-bold text-white">{wordCount} <span className="text-sm font-normal text-slate-400">parole</span></p>
                            </div>
                            <div className="text-right">
                                <button
                                    onClick={onIncreaseDepth}
                                    disabled={isEnriching || wordCount >= 3000}
                                    className={`text-[10px] px-3 py-1.5 rounded-full font-bold uppercase transition-all flex items-center gap-2 shadow-sm ${
                                        wordCount >= 2000 
                                            ? 'bg-green-500/20 text-green-400 cursor-default' 
                                            : 'bg-indigo-600 text-white hover:bg-indigo-500 active:scale-95 disabled:opacity-50'
                                    }`}
                                >
                                    {isEnriching ? (
                                        <><div className="w-2 h-2 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Espansione...</>
                                    ) : (
                                        wordCount >= 2000 ? 'Volume Massimo Raggiunto' : <><SparklesIcon className="w-3 h-3" /> Aumenta Profondità & Tag</>
                                    )}
                                </button>
                                <p className="text-[9px] text-slate-500 mt-1 italic">Verranno cercati nuovi link ufficiali</p>
                            </div>
                        </div>

                        {/* Taxonomy Section (Tag e Categorie) - MIGLIORATA PER RILEVANZA E COPIA */}
                        <div className="space-y-4">
                             <div className="bg-slate-900/40 p-4 rounded-xl border border-indigo-500/10 group">
                                <div className="flex justify-between items-center mb-3">
                                    <label className="text-[10px] uppercase font-bold text-indigo-400 flex items-center gap-1.5">
                                        <ArchiveBoxIcon className="w-3 h-3" /> Categorie Suggerite
                                    </label>
                                    <button 
                                        onClick={handleCopyCats}
                                        className="text-[10px] flex items-center gap-1.5 text-slate-400 hover:text-indigo-400 bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700 transition-all"
                                    >
                                        {catsCopied ? <CheckIcon className="w-3.5 h-3.5" /> : <ClipboardIcon className="w-3.5 h-3.5" />}
                                        {catsCopied ? 'Copiate' : 'Copia Categorie'}
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {result.categories.split(',').map((cat, idx) => (
                                        <span key={idx} className="bg-indigo-500/10 text-indigo-300 text-[11px] px-3 py-1.5 rounded-lg border border-indigo-500/20 font-semibold shadow-sm">
                                            {cat.trim()}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="bg-slate-900/40 p-4 rounded-xl border border-indigo-500/10 group">
                                <div className="flex justify-between items-center mb-3">
                                    <label className="text-[10px] uppercase font-bold text-indigo-400 flex items-center gap-1.5">
                                        <SparklesIcon className="w-3 h-3" /> Tag SEO Iper-Pertinenti
                                    </label>
                                    <button 
                                        onClick={handleCopyTags}
                                        className="text-[10px] flex items-center gap-1.5 text-slate-400 hover:text-indigo-400 bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700 transition-all"
                                    >
                                        {tagsCopied ? <CheckIcon className="w-3.5 h-3.5" /> : <ClipboardIcon className="w-3.5 h-3.5" />}
                                        {tagsCopied ? 'Copiati' : 'Copia Lista Tag (CSV)'}
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex flex-wrap gap-1.5">
                                        {result.tags.split(',').map((tag, idx) => (
                                            <span key={idx} className="bg-slate-800/80 text-slate-300 text-[10px] px-2.5 py-1 rounded-md border border-slate-700/50 hover:border-indigo-500/50 transition-colors">
                                                #{tag.trim()}
                                            </span>
                                        ))}
                                    </div>
                                    <div className="relative group/copy">
                                        <div className="text-[10px] font-mono text-indigo-300/80 bg-black/40 p-3 rounded-lg border border-slate-700/50 break-all leading-relaxed max-h-24 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700">
                                            {result.tags}
                                        </div>
                                        <p className="text-[9px] text-slate-500 mt-1.5 italic">Incolla questa riga direttamente nel campo Tag del tuo CMS.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Technical SEO Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <SeoDataItem label="Keyword Principale" value={result.keyPhrase} mono />
                            <SeoDataItem label="URL Slug Ottimizzato" value={result.slug} mono />
                        </div>
                        <SeoDataItem label="SEO Title (Snippet)" value={result.title} />
                        <SeoDataItem label="Meta Description (Rich)" value={result.description} />
                        
                        {/* Checklist */}
                        <div className="space-y-3 pt-4 border-t border-slate-700/50">
                            <h4 className="text-[10px] uppercase font-bold text-indigo-400 tracking-widest">Checklist di Indicizzazione</h4>
                            {result.seoChecklist.map((c, i) => (
                                <div key={i} className="flex items-start gap-3 bg-slate-900/30 p-4 rounded-xl border border-slate-700/30 hover:border-slate-600 transition-colors">
                                    {c.status === 'pass' ? <CheckCircleIcon className="w-5 h-5 text-green-500 mt-0.5" /> : <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500 mt-0.5" />}
                                    <div>
                                        <p className="text-sm font-bold text-slate-200">{c.item}</p>
                                        <p className="text-xs text-slate-400 leading-relaxed">{c.details}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'readability' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 space-y-6">
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {result.readability.map((r, i) => (
                                <div key={i} className="bg-slate-900/30 p-4 rounded-xl border border-slate-700/30">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-xs font-bold text-slate-200">{r.criteria}</span>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                            r.status === 'good' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'
                                        }`}>{r.score}</span>
                                    </div>
                                    <p className="text-xs text-slate-400 leading-relaxed italic">"{r.message}"</p>
                                </div>
                            ))}
                        </div>
                        <div className="bg-indigo-900/10 p-5 rounded-xl border border-indigo-500/10 relative group">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-[10px] uppercase font-bold text-indigo-400 block">Draft Post Social</span>
                                <button onClick={handleCopySocial} className="text-slate-500 hover:text-indigo-400 transition-colors p-1 bg-slate-800/50 rounded">
                                    {socialCopied ? <CheckIcon className="w-4 h-4 text-green-400" /> : <ClipboardIcon className="w-4 h-4" />}
                                </button>
                            </div>
                            <p className="text-sm text-slate-300 italic leading-relaxed">"{result.socialMediaPost}"</p>
                        </div>
                    </div>
                )}

                {activeTab === 'content' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 space-y-6">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-700">
                                <button onClick={() => setViewMode('preview')} className={`px-4 py-1.5 text-[10px] font-bold rounded-md transition-all ${viewMode === 'preview' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}>ANTEPRIMA</button>
                                <button onClick={() => setViewMode('code')} className={`px-4 py-1.5 text-[10px] font-bold rounded-md transition-all ${viewMode === 'code' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}>CODICE HTML</button>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => onSave()} className="bg-emerald-600 p-2.5 rounded-xl text-white hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-600/20" title="Salva articolo"><BookmarkIcon className="w-5 h-5" /></button>
                                <button onClick={() => window.print()} className="bg-slate-700 p-2.5 rounded-xl text-white hover:bg-slate-600 transition-all border border-slate-600" title="Stampa articolo"><PrinterIcon className="w-5 h-5" /></button>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl overflow-hidden min-h-[600px] border-8 border-slate-900 shadow-inner relative ring-1 ring-slate-700/50">
                            {isEnriching && (
                                <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-[2px] flex items-center justify-center z-10 transition-all">
                                    <div className="bg-indigo-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-4 animate-pulse border border-indigo-400/30">
                                        <SparklesIcon className="w-6 h-6" />
                                        <span className="text-sm font-bold tracking-tight">Ricerca link e tag iper-pertinenti...</span>
                                    </div>
                                </div>
                            )}
                            {viewMode === 'preview' ? (
                                <iframe 
                                    srcDoc={`<html><head><style>
                                        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Playfair+Display:wght@700&display=swap');
                                        body{font-family:'Inter', sans-serif; line-height:1.75; color:#334155; padding:60px 40px; max-width:850px; margin:0 auto; font-size: 16px; background: #fff;} 
                                        h1,h2,h3{color:#0f172a; margin-top:1.8em; margin-bottom: 0.8em; font-family: 'Playfair Display', serif;} 
                                        h1{font-size: 3em; border-bottom: 4px solid #6366f1; padding-bottom: 15px; margin-bottom: 1.2em; line-height: 1.1;}
                                        h2{font-size: 1.85em; color: #4338ca; border-left: 4px solid #6366f1; padding-left: 15px;}
                                        h3{font-size: 1.4em; color: #1e293b;}
                                        p{margin-bottom: 1.5em;}
                                        a{color:#4f46e5; text-decoration:none; font-weight:600; border-bottom: 1px dashed #4f46e5; transition: all 0.2s;}
                                        a:hover{color:#3730a3; border-bottom-style: solid; background: #f5f3ff;}
                                        ul, ol{margin-bottom: 1.5em; padding-left: 1.8em;}
                                        li{margin-bottom: 0.8em;}
                                        img{width:100%; border-radius:16px; margin:2.5em 0; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);}
                                        .taxo-box {background:#f8fafc; padding:25px; border-radius:16px; margin-bottom:40px; border:1px solid #e2e8f0; font-size:14px; box-shadow: inset 0 2px 4px 0 rgba(0,0,0,0.06);}
                                        .taxo-label {color: #64748b; font-size: 11px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em; display: block; margin-bottom: 8px;}
                                        .tag-pill {display: inline-block; background: #fff; border: 1px solid #e2e8f0; padding: 4px 10px; border-radius: 8px; margin-right: 5px; margin-bottom: 5px; color: #475569;}
                                    </style></head><body>
                                        <div class="taxo-box">
                                            <div style="margin-bottom:15px;"><span class="taxo-label">Categorie Principali</span> <strong>${result.categories}</strong></div>
                                            <div><span class="taxo-label">Tag SEO Pertinenti</span> ${result.tags.split(',').map(t => `<span class="tag-pill">#${t.trim()}</span>`).join('')}</div>
                                        </div>
                                        <h1>${result.title}</h1>
                                        ${result.htmlContent}
                                    </body></html>`}
                                    className="w-full h-[600px]"
                                />
                            ) : (
                                <div className="p-6 bg-slate-950 h-[600px] overflow-auto font-mono text-[11px] text-cyan-400/90 whitespace-pre-wrap relative leading-relaxed">
                                    {`<!-- INFO SEO BLOG -->\n<!-- CATEGORIA: ${result.categories} -->\n<!-- TAG: ${result.tags} -->\n\n` + result.htmlContent}
                                    <div className="absolute top-4 right-4 flex gap-2">
                                        <button 
                                            onClick={() => {
                                                navigator.clipboard.writeText(`<!-- CATEGORIA: ${result.categories} -->\n<!-- TAG: ${result.tags} -->\n\n` + result.htmlContent);
                                                alert("HTML completo copiato con successo!");
                                            }}
                                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded-lg border border-indigo-400/30 flex items-center gap-2 shadow-lg transition-all active:scale-95"
                                        >
                                            <ClipboardIcon className="w-4 h-4" /> Copia Codice Completo
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
