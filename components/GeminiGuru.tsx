
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

  const askGuru = async () => {
    if (!prompt.trim()) return;
    
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      setResponse("Guru Error: API Key is missing. Please check your environment.");
      return;
    }

    setLoading(true);
    setResponse('');
    setSources([]);
    try {
      const ai = new GoogleGenAI({ apiKey });
      const result = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `User Context: ${context}. User Question: ${prompt}`,
        config: {
          systemInstruction: "You are a world-class study tutor. You can use Google Search to find public study guides, PDFs, and official documentation. Always summarize complex topics and provide 3-5 source links if you use external information.",
          tools: [{ googleSearch: {} }]
        }
      });
      
      setResponse(result.text || "I couldn't generate an answer.");
      
      // Extract Search Grounding Sources
      const chunks = result.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks) {
        const extractedSources = chunks
          .filter(chunk => chunk.web)
          .map(chunk => ({
            uri: chunk.web!.uri,
            title: chunk.web!.title || 'External Source'
          }));
        setSources(extractedSources);
      }

    } catch (error) {
      console.error("Gemini Guru Error:", error);
      setResponse("Sorry, I'm having trouble connecting to the AI brain. Check your internet connection or API limits.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-2xl border border-indigo-100 overflow-hidden flex flex-col max-h-[600px] animate-in slide-in-from-bottom-4">
      <div className="bg-indigo-600 p-5 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
            <Sparkles size={18} className="text-yellow-300 fill-current" />
          </div>
          <div>
            <h3 className="font-black text-sm uppercase tracking-widest">Study AI Guru</h3>
            <p className="text-[9px] opacity-60 font-bold uppercase tracking-tighter">Powered by Google Search</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="hover:bg-white/10 p-2 rounded-xl transition-colors">
            <X size={20} />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm leading-relaxed hide-scrollbar">
        {response ? (
          <div className="space-y-6">
            <div className="bg-slate-50 p-5 rounded-2xl whitespace-pre-wrap font-medium text-slate-700 border border-slate-100 leading-relaxed">
              {response}
            </div>
            
            {sources.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Search size={12} /> Verified Learning Sources
                </h4>
                <div className="grid grid-cols-1 gap-2">
                  {sources.slice(0, 4).map((source, idx) => (
                    <a 
                      key={idx} 
                      href={source.uri} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-100/50 rounded-xl group transition-all"
                    >
                      <span className="text-xs font-bold text-indigo-600 truncate mr-4">{source.title}</span>
                      <ExternalLink size={14} className="text-indigo-300 group-hover:text-indigo-600 shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-400 rounded-full flex items-center justify-center animate-pulse">
                <Search size={32} />
            </div>
            <div>
                <p className="text-slate-800 font-bold">I can find anything for you.</p>
                <p className="text-slate-400 text-xs mt-1">Try: "Find a public PDF on Quantum Physics" or "Explain this topic with sources."</p>
            </div>
          </div>
        )}
        
        {loading && (
          <div className="flex items-center gap-3 text-indigo-600 font-black text-[10px] uppercase tracking-widest">
            <Loader2 className="animate-spin" size={16} />
            <span>Consulting Web Repositories...</span>
          </div>
        )}
      </div>

      <div className="p-5 border-t border-slate-100 flex gap-2 bg-slate-50/50">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ask Guru to find or explain..."
          className="flex-1 bg-white border border-slate-200 rounded-2xl px-5 py-3 text-sm focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-medium"
          onKeyDown={(e) => e.key === 'Enter' && askGuru()}
        />
        <button
          onClick={askGuru}
          disabled={loading || !prompt.trim()}
          className="bg-indigo-600 text-white w-12 h-12 rounded-2xl flex items-center justify-center disabled:opacity-50 hover:bg-indigo-700 shadow-lg shadow-indigo-100 active:scale-90 transition-all"
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
};
