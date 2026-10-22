import { useState } from 'react';

const HASH = '673a6941fb53d0f9005625d2816b3a8186fbb694255acb630a99b35982c1f94f';

async function sha256(text: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

const ItsmTool = () => {
  const [unlocked, setUnlocked] = useState(false);
  const [pw, setPw] = useState('');
  const [error, setError] = useState(false);

  const check = async () => {
    const h = await sha256(pw);
    if (h === HASH) {
      setUnlocked(true);
    } else {
      setError(true);
      setTimeout(() => setError(false), 1500);
    }
  };

  if (unlocked) {
    return (
      <iframe
        src="/itsm-tool.html"
        className="fixed inset-0 w-full h-full border-none"
        title="ITSM Tool"
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-[#0F1923] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 p-8">
        <div className="font-mono text-xs text-[#546E7A] tracking-widest uppercase">Restricted Access</div>
        <input
          type="password"
          value={pw}
          onChange={e => setPw(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && check()}
          placeholder="Passwort"
          className={`bg-[#0A1628] border ${error ? 'border-red-500 animate-pulse' : 'border-[#1E3A5F]'} text-[#DDE3EC] rounded px-4 py-2 text-sm font-mono focus:outline-none focus:border-[#1565C0] w-64 text-center`}
          autoFocus
        />
        <button onClick={check} className="text-xs font-mono text-[#1565C0] hover:text-[#64B5F6] transition-colors">
          Enter →
        </button>
      </div>
    </div>
  );
};

export default ItsmTool;
