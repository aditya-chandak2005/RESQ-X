import React, { useState } from 'react';
import { Bot, Send, X, Sparkles, Database, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { PortalModal } from '../components/PortalModal';

interface AICopilotModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AICopilotModal: React.FC<AICopilotModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'copilot'; text: string; data?: any }>>([
    {
      sender: 'copilot',
      text: 'Greetings. I am **RESQ Copilot**, your emergency spatial intelligence assistant. Every numerical answer is strictly grounded in live PostGIS database queries, NetworkX road topology, and SAR segmentation outputs.\n\nHow can I support command triage today?',
    },
  ]);

  if (!isOpen) return null;

  const quickQueries = [
    'Which settlements are currently isolated?',
    'What is the highest priority settlement?',
    'Which bridges are affected?',
    'Why is Raini Village priority 94.5?',
    'Which missions need dynamic rerouting?',
    'Summarize current flood extent & impact.'
  ];

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    const userText = textToSend;
    setMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setQuery('');
    setLoading(true);

    try {
      const res = await api.queryCopilot(userText, 1);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'copilot',
          text: res.response,
          data: res.grounded_data,
        },
      ]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'copilot',
          text: 'Unable to complete database telemetry query. Please verify backend connection.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PortalModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-2xl"
      className="bg-[#0b1222] border border-cyan-500/50 h-[80vh] max-h-[600px] flex flex-col justify-between"
    >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-command-border flex items-center justify-between bg-command-panel">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-400 flex items-center justify-center text-cyan-400">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-mono font-extrabold text-sm text-slate-100">RESQ COPILOT</span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                  GROUNDED AI
                </span>
              </div>
              <p className="text-[10px] text-slate-400">Strictly grounded in verified GIS and relational metrics</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat Stream */}
        <div className="flex-1 p-4 overflow-y-auto custom-scrollbar space-y-3.5">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] p-3 rounded-lg text-xs leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-cyan-600 text-slate-950 font-medium'
                    : 'bg-command-panel border border-command-border text-slate-200'
                }`}
              >
                {/* Render formatted markdown-style text simply */}
                <div className="whitespace-pre-wrap font-sans">
                  {m.text.split('\n').map((line, lIdx) => (
                    <p key={lIdx} className={line.startsWith('-') || line.startsWith('•') ? 'ml-2 text-slate-300' : ''}>
                      {line}
                    </p>
                  ))}
                </div>

                {m.data && (
                  <div className="mt-2 pt-2 border-t border-command-border/60 flex items-center space-x-2 text-[10px] text-cyan-400 font-mono">
                    <Database className="w-3 h-3" />
                    <span>Verified via Live PostGIS DB Telemetry</span>
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-command-panel p-3 rounded-lg border border-command-border text-cyan-400 font-mono text-xs flex items-center space-x-2">
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>Querying GIS engine & topological database...</span>
              </div>
            </div>
          )}
        </div>

        {/* Quick query chips */}
        <div className="px-4 py-2 border-t border-command-border/40 bg-command-panel/40 flex flex-wrap gap-1.5 overflow-x-auto">
          {quickQueries.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              className="text-[10px] font-mono px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all text-left truncate max-w-xs"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-command-border bg-command-panel flex items-center space-x-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend(query)}
            placeholder="Ask RESQ Copilot about isolated settlements, bridge damage, routes..."
            className="flex-1 bg-command-bg border border-command-border rounded-md px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-sans text-xs"
          />
          <button
            onClick={() => handleSend(query)}
            disabled={loading || !query.trim()}
            className="px-4 py-2 rounded-md bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold transition-all flex items-center space-x-1"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
    </PortalModal>
  );
};
