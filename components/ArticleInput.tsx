import React from 'react';
import { SparklesIcon, ArchiveBoxIcon, CheckCircleIcon } from './IconComponents';

interface ArticleInputProps {
    value: string;
    onChange: (value: string) => void;
    onOptimize: () => void;
    isLoading: boolean;
    savedCount: number;
    onLoadClick: () => void;
    lastAutoSave: Date | null;
}

export const ArticleInput: React.FC<ArticleInputProps> = ({ value, onChange, onOptimize, isLoading, savedCount, onLoadClick, lastAutoSave }) => {
    return (
        <div className="flex flex-col gap-4 bg-slate-800/50 p-6 rounded-lg shadow-lg border border-slate-700 relative">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold text-slate-100">Il Tuo Articolo</h2>
                {lastAutoSave && (
                    <div className="flex items-center gap-1.5 text-xs text-green-400/80 bg-green-900/20 px-2 py-1 rounded-full border border-green-900/30">
                        <CheckCircleIcon className="w-3 h-3" />
                        <span>Salvataggio auto: {lastAutoSave.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                )}
            </div>
            
            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Incolla qui il testo del tuo articolo..."
                className="w-full h-96 min-h-[300px] md:min-h-[500px] p-4 bg-slate-900 border border-slate-700 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200 text-slate-300 resize-y"
                disabled={isLoading}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                 <button
                    onClick={onLoadClick}
                    disabled={isLoading || savedCount === 0}
                    className="flex items-center justify-center gap-2 w-full bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800/50 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all duration-200"
                >
                    <ArchiveBoxIcon className="w-5 h-5" />
                    Carica ({savedCount})
                </button>
                <button
                    onClick={onOptimize}
                    disabled={isLoading || !value.trim()}
                    className="flex items-center justify-center gap-2 w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-900/50 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:scale-100 shadow-lg shadow-indigo-600/20"
                >
                    {isLoading ? (
                        'Ottimizzazione in corso...'
                    ) : (
                        <>
                            <SparklesIcon className="w-5 h-5" />
                            Ottimizza con IA
                        </>
                    )}
                </button>

            </div>
            <p className="text-xs text-slate-500 text-center italic">
                Le bozze vengono salvate automaticamente ogni 2 minuti.
            </p>
        </div>
    );
};