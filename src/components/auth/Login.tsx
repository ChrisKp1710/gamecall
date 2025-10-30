import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

export function Login() {
  const { login, register, isLoading, error } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === 'login') {
      await login(username, password);
    } else {
      await register(username, password);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] relative overflow-hidden">
      {/* 🌌 Background gradient blobs - Stile 2025 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-purple-600/10 to-blue-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md px-6">
        {/* 🎯 Logo moderno con icona stilizzata */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 via-purple-600 to-blue-600 rounded-2xl mb-5 shadow-lg shadow-purple-500/50 relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-blue-500 rounded-2xl blur opacity-75 group-hover:opacity-100 transition" />
            <svg className="w-8 h-8 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent mb-2">
            GameCall
          </h1>
          <p className="text-gray-500 text-sm font-medium">
            La piattaforma per gamers professionisti
          </p>
        </div>

        {/* 🎨 Card ultra-moderna con glassmorphism */}
        <div className="bg-[#111]/80 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/10 overflow-hidden">
          {/* Tab switcher moderno */}
          <div className="flex gap-1 p-1.5 bg-[#0a0a0a]/50 m-4 rounded-2xl">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`flex-1 py-2.5 px-4 rounded-xl font-semibold text-sm transition-all ${
                mode === 'login'
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/30'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              Accedi
            </button>
            <button
              type="button"
              onClick={() => setMode('register')}
              className={`flex-1 py-2.5 px-4 rounded-xl font-semibold text-sm transition-all ${
                mode === 'register'
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/30'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              Registrati
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Username input */}
            <div>
              <label htmlFor="username" className="block text-sm font-semibold text-gray-300 mb-2">
                Username
              </label>
              <div className="relative group">
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="mario_gamer"
                  required
                  className="w-full px-4 py-3.5 bg-[#0a0a0a]/50 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                />
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-600/0 to-blue-600/0 group-focus-within:from-purple-600/5 group-focus-within:to-blue-600/5 pointer-events-none transition" />
              </div>
            </div>

            {/* Password input */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-300 mb-2">
                Password
              </label>
              <div className="relative group">
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••"
                  required
                  className="w-full px-4 py-3.5 bg-[#0a0a0a]/50 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                />
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-600/0 to-blue-600/0 group-focus-within:from-purple-600/5 group-focus-within:to-blue-600/5 pointer-events-none transition" />
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
                <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-400 text-sm font-medium">{error}</p>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading}
              className="relative w-full py-3.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
              {isLoading ? (
                <span className="flex items-center justify-center gap-3 relative z-10">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Elaborazione...</span>
                </span>
              ) : (
                <span className="relative z-10">
                  {mode === 'login' ? '🚀 Accedi' : '✨ Crea Account'}
                </span>
              )}
            </button>
          </form>

          {/* Footer info */}
          <div className="px-6 pb-6 pt-2">
            <div className="bg-[#0a0a0a]/50 rounded-xl p-4 border border-white/5">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-gray-400 text-xs leading-relaxed">
                    {mode === 'login' 
                      ? '💡 Modalità demo: usa qualsiasi username e password (min 3 caratteri)' 
                      : '📝 Username minimo 3 caratteri, password minimo 6 caratteri'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer branding */}
        <p className="text-center text-gray-600 text-xs mt-6">
          Powered by WebRTC • P2P Video Calling
        </p>
      </div>
    </div>
  );
}
