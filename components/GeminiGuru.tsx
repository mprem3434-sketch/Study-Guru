
import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Sparkles, Send, Loader2, X } from 'lucide-react';

interface GeminiGuruProps {
  context: string;
  onClose?: () => void;
}

export const GeminiGuru: React.FC<GeminiGuruProps> = ({ context, onClose }) => {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const askGuru = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setResponse('');
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const result = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `You are a helpful study guru. Context: ${context}. Question: ${prompt}`,
        config: {
          systemInstruction: "You provide concise, easy-to-understand explanations for students. Use bullet points and simple analogies."
        }
      });
      setResponse(result.text || "I couldn't generate an answer.");
    } catch (error) {
      setResponse("Sorry, I'm having trouble connecting right now.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-indigo-100 overflow-hidden flex flex-col max-h-[500px]">
      <div className="bg-indigo-600 p-4 text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles size={20} className="text-yellow-300" />
          <h3 className="font-semibold">Gemini Study Guru</h3>
        </div>
        {onClose && (
          <button onClick={onClose} className="hover:bg-white/10 p-1 rounded-lg">
            <X size={20} />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm leading-relaxed">
        {response ? (
          <div className="prose prose-sm bg-slate-50 p-3 rounded-xl">
            {response.split('\n').map((line, i) => (
              <p key={i} className="mb-2">{line}</p>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 italic">Ask me anything about this topic! For example: "Summarize this", "Explain the key concepts", or "Give me 3 quiz questions".</p>
        )}
        {loading && (
          <div className="flex items-center gap-2 text-indigo-600 font-medium">
            <Loader2 className="animate-spin" size={16} />
            <span>Guru is thinking...</span>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-slate-100 flex gap-2">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Type your question..."
          className="flex-1 bg-slate-100 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          onKeyDown={(e) => e.key === 'Enter' && askGuru()}
        />
        <button
          onClick={askGuru}
          disabled={loading || !prompt.trim()}
          className="bg-indigo-600 text-white p-2 rounded-xl disabled:opacity-50 hover:bg-indigo-700"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};
