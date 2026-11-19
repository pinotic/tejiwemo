import { ArrowLeft, Eye, EyeOff, KeyRound, Lock, User } from 'lucide-react';
import { useState } from 'react';
import { loginWithCredentials } from '../lib/auth';
import type { AuthUser } from '../types';

interface PengurusLoginPageProps {
  webTitle?: string;
  regionIdentity?: string;
  onLoginSuccess: (user: AuthUser) => void;
  onBackToWarga: () => void;
}

export function PengurusLoginPage({
  webTitle = 'Portal Warga',
  regionIdentity,
  onLoginSuccess,
  onBackToWarga,
}: PengurusLoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const { user } = await loginWithCredentials(username.trim(), password);
      onLoginSuccess(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal masuk ke laman pengurus.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-900 flex flex-col">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={onBackToWarga}
            className="flex items-center gap-2.5 text-left whitespace-nowrap shrink-0"
          >
            <img
              src="/assets/aistudio/500309821_1300971965363211_2221899409798109426_n__1__55125c15.png"
              alt={`Logo ${webTitle}`}
              className="h-8 w-auto object-contain shrink-0"
            />
            <span className="font-display text-lg font-bold tracking-tight text-slate-900">
              {webTitle}
            </span>
            {regionIdentity && (
              <span className="hidden sm:inline text-xs text-slate-500 font-normal">
                · {regionIdentity}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={onBackToWarga}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Kembali ke Laman Warga</span>
          </button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md space-y-5">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <img
                  src="/assets/aistudio/500309821_1300971965363211_2221899409798109426_n__1__55125c15.png"
                  alt={`Logo ${webTitle}`}
                  className="h-12 w-auto object-contain shrink-0"
                />
              </div>
              <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
                Masuk Laman Pengurus
              </h1>
              <p className="text-sm text-slate-600 leading-relaxed">
                Gunakan akun Pengurus RT atau Superadmin yang terdaftar untuk mengelola kas,
                agenda, berita, usulan warga, serta akun pengurus.
              </p>
            </div>

            {error && (
              <div
                role="alert"
                className="p-3 text-xs font-medium text-red-800 bg-red-50 border border-red-200 rounded-lg"
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="login-username"
                  className="block text-xs font-medium text-slate-700 mb-1.5"
                >
                  Username
                </label>
                <div className="relative">
                  <User
                    className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                    aria-hidden="true"
                  />
                  <input
                    id="login-username"
                    type="text"
                    required
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Masukkan username"
                    className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="login-password"
                  className="block text-xs font-medium text-slate-700 mb-1.5"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock
                    className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                    aria-hidden="true"
                  />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan password"
                    className="w-full pl-9 pr-10 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 rounded"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" aria-hidden="true" />
                    ) : (
                      <Eye className="w-4 h-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 rounded-lg transition-colors"
              >
                <KeyRound className="w-4 h-4" aria-hidden="true" />
                <span>{submitting ? 'Memverifikasi...' : 'Masuk ke Dashboard'}</span>
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
