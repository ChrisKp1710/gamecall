import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface ValidationErrors {
  username?: string;
  password?: string;
}

export function Login() {
  const { login, register, isLoading, error } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState({ username: false, password: false });
  const [showPassword, setShowPassword] = useState(false);

  // Real-time validation
  useEffect(() => {
    const errors: ValidationErrors = {};

    if (touched.username && username.length > 0) {
      if (username.length < 3) {
        errors.username = 'Username troppo corto (min 3 caratteri)';
      } else if (username.length > 20) {
        errors.username = 'Username troppo lungo (max 20 caratteri)';
      } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        errors.username = 'Solo lettere, numeri e underscore';
      }
    }

    if (touched.password && password.length > 0 && mode === 'register') {
      if (password.length < 8) {
        errors.password = 'Password troppo corta (min 8 caratteri)';
      } else if (!/[a-zA-Z]/.test(password)) {
        errors.password = 'Deve contenere almeno una lettera';
      } else if (!/[0-9]/.test(password)) {
        errors.password = 'Deve contenere almeno un numero';
      }
    }

    setValidationErrors(errors);
  }, [username, password, mode, touched]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched
    setTouched({ username: true, password: true });

    // Check validation
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    if (mode === 'login') {
      await login(username, password);
    } else {
      await register(username, password);
    }
  };

  const handleModeSwitch = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setValidationErrors({});
    setTouched({ username: false, password: false });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 animate-fade-in">
      <div className="w-full max-w-md px-6">
        {/* Logo */}
        <div className="text-center mb-10 animate-scale-in">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-500 rounded-3xl mb-6 shadow-lg shadow-primary-500/30">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
            GameCall
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
            Videochiamate P2P per gamer
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl p-8 border border-gray-200/50 dark:border-gray-800/50 shadow-2xl animate-slide-in-up">
          {/* Tabs */}
          <div className="flex gap-2 p-1.5 bg-gray-100 dark:bg-gray-800/50 rounded-2xl mb-8">
            <button
              type="button"
              onClick={handleModeSwitch}
              className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                mode === 'login'
                  ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Accedi
            </button>
            <button
              type="button"
              onClick={handleModeSwitch}
              className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                mode === 'register'
                  ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Registrati
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onBlur={() => setTouched(prev => ({ ...prev, username: true }))}
                placeholder="mario_rossi"
                autoComplete="username"
                className={`w-full px-4 py-3.5 bg-white dark:bg-gray-800 border rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 transition-all duration-200 ${
                  validationErrors.username && touched.username
                    ? 'border-error-500 focus:ring-error-500/30'
                    : 'border-gray-300 dark:border-gray-700 focus:ring-primary-500/30 focus:border-primary-500'
                }`}
              />
              {validationErrors.username && touched.username && (
                <p className="mt-2 text-xs text-error-600 dark:text-error-400 flex items-center gap-1.5 animate-slide-in-down">
                  <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {validationErrors.username}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => setTouched(prev => ({ ...prev, password: true }))}
                  placeholder="••••••••"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  className={`w-full px-4 py-3.5 pr-12 bg-white dark:bg-gray-800 border rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 transition-all duration-200 ${
                    validationErrors.password && touched.password
                      ? 'border-error-500 focus:ring-error-500/30'
                      : 'border-gray-300 dark:border-gray-700 focus:ring-primary-500/30 focus:border-primary-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {validationErrors.password && touched.password && (
                <p className="mt-2 text-xs text-error-600 dark:text-error-400 flex items-center gap-1.5 animate-slide-in-down">
                  <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {validationErrors.password}
                </p>
              )}
            </div>

            {/* Error from backend */}
            {error && (
              <div className="p-4 bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800/50 rounded-xl animate-slide-in-down">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-error-600 dark:text-error-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm text-error-700 dark:text-error-300 font-medium">{error}</p>
                </div>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading || Object.keys(validationErrors).length > 0}
              className="w-full py-3.5 bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-700 hover:to-accent-700 text-white rounded-xl font-semibold shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {mode === 'login' ? 'Accesso...' : 'Registrazione...'}
                </span>
              ) : (
                mode === 'login' ? 'Accedi' : 'Crea Account'
              )}
            </button>
          </form>

          {/* Footer hint */}
          <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            {mode === 'login' ? 'Primo accesso?' : 'Hai già un account?'}{' '}
            <button
              type="button"
              onClick={handleModeSwitch}
              className="text-primary-600 dark:text-primary-400 font-semibold hover:underline transition-colors"
            >
              {mode === 'login' ? 'Registrati ora' : 'Accedi'}
            </button>
          </p>
        </div>

        {/* Privacy */}
        <p className="mt-8 text-center text-xs text-gray-500 dark:text-gray-500">
          Procedendo accetti i{' '}
          <button className="text-gray-700 dark:text-gray-400 hover:underline font-medium">
            Termini di Servizio
          </button>{' '}
          e l'{' '}
          <button className="text-gray-700 dark:text-gray-400 hover:underline font-medium">
            Informativa Privacy
          </button>
        </p>
      </div>
    </div>
  );
}
