import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Sparkles, Send, Loader2, X, ExternalLink, Search } from 'lucide-react';

interface GeminiGuruProps {
  context: string;
  onClose?: () => void;
}

export const GeminiGuru: React.FC<GeminiGuruProps> = ({ context, onClose }) => {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [sources, setSources] = useState<{ uri: string, title: string }[]>([]);

  // Safe API Key retrieval for Netlify/Production
  const getApiKey = () => {
    try {
      if (typeof process !== 'undefined' && process.env.API_KEY) return process.env.API_KEY;
      return (window as any).API_KEY;
    } catch (e) {
      return null;
    }
  };

  const askGuru = async () => {
    if (!prompt.trim()) return;
    
    const apiKey = getApiKey();
    if (!apiKey) {
      setResponse("Guru Error: API Key is not configured. Please check your environment variables.");
      return;
    }

    setLoading(true);
    setResponse('');
    setSources([]);
    try {
      const ai = new GoogleGenAI({ apiKey });
      const result = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `User Context: ${context}. Question: ${prompt}`,
        config: {
          systemInstruction: "You are Study Guru AI. Use Google Search to find public PDFs, academic papers, and detailed explanations. Provide clear summaries and include source links for verification.",
          tools: [{ googleSearch: {} }]
        }
      });
      
      setResponse(result.text || "I couldn't process that. Try rephrasing.");
      
      const chunks = result.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks) {
        setSources(chunks.filter(c => c.web).map(c => ({ uri: c.web!.uri, title: c.web!.title || 'External Guide' })));
      }
    } catch (error) {
      console.error("Guru Error:", error);
      setResponse("Network bottleneck or API limit reached. Try again in a moment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-[2.5rem] shadow-2xl border border-indigo-100 overflow-hidden flex flex-col max-h-[600px] animate-in slide-in-from-bottom-6 duration-500">
      <div className="bg-indigo-600 p-6 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
            <Sparkles size={20} className="text-yellow-300 fill-current" />
          </div>
          <div>
            <h3 className="font-black text-xs uppercase tracking-[0.15em]">AI Mentor</h3>
            <p className="text-[9px] opacity-60 font-black tracking-widest uppercase">Search Grounding Enabled</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="hover:bg-white/10 p-2 rounded-xl transition-colors">
            <X size={20} />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm hide-scrollbar bg-slate-50/30">
        {response ? (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl whitespace-pre-wrap font-medium text-slate-700 border border-slate-100 leading-relaxed shadow-sm">
              {response}
            </div>
            
            {sources.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-2">
                  <Search size={12} /> External Repositories
                </h4>
                <div className="grid grid-cols-1 gap-2">
                  {sources.slice(0, 5).map((source, idx) => (
                    <a key={idx} href={source.uri} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 bg-white hover:bg-indigo-50 border border-slate-100 rounded-2xl group transition-all">
                      <span className="text-xs font-bold text-indigo-600 truncate mr-4">{source.title}</span>
                      <ExternalLink size={14} className="text-slate-300 group-hover:text-indigo-600" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
            <div className="w-20 h-20 bg-indigo-50 text-indigo-200 rounded-full flex items-center justify-center animate-pulse">
                <Search size={40} />
            </div>
            <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Awaiting Your Input</p>
          </div>
        )}
        
        {loading && (
          <div className="flex items-center gap-3 text-indigo-600 font-black text-[10px] uppercase tracking-widest px-4">
            <Loader2 className="animate-spin" size={16} />
            <span>Scanning Knowledge Bases...</span>
          </div>
        )}
      </div>

      <div className="p-6 border-t border-slate-100 flex gap-3 bg-white">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ask anything or request a PDF search..."
          className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-sm focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-medium"
          onKeyDown={(e) => e.key === 'Enter' && askGuru()}
        />
        <button
          onClick={askGuru}
          disabled={loading || !prompt.trim()}
          className="bg-indigo-600 text-white w-12 h-12 rounded-2xl flex items-center justify-center disabled:opacity-50 hover:bg-indigo-700 shadow-xl shadow-indigo-100 active:scale-95 transition-all"
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
};