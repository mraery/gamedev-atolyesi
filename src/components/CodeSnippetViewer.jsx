import React, { useState } from 'react';
import { Copy, Check, Terminal } from 'lucide-react';
import { sounds } from '../utils/sound';

export default function CodeSnippetViewer({ code, language = 'javascript', title, note }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    sounds.click();
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl overflow-hidden border border-slate-800 bg-[#0d121d] text-left text-xs font-mono shadow-xl">
      <div className="bg-[#151c2c] px-4 py-2 flex items-center justify-between border-b border-slate-800 text-slate-400">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-sky-400" />
          <span className="font-semibold text-slate-200">{title || language}</span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-[11px] hover:text-white px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 transition"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          <span>{copied ? 'Kopyalandı' : 'Kopyala'}</span>
        </button>
      </div>

      <pre className="p-4 text-slate-300 overflow-x-auto leading-relaxed selection:bg-sky-500/30">
        <code>{code}</code>
      </pre>

      {note && (
        <div className="bg-sky-950/30 border-t border-sky-800/30 px-4 py-2.5 text-[11px] text-sky-300/90 font-sans flex items-start gap-2">
          <span className="text-sky-400 font-bold">💡 İpucu:</span>
          <span>{note}</span>
        </div>
      )}
    </div>
  );
}
