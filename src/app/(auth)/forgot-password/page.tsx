'use client';

import { useState } from 'react';
import Link from 'next/link';
import { authService } from '@/services';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authService.forgotPassword(email);
      setSubmitted(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'No se pudo procesar la solicitud',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-primary-800 via-primary-900 to-primary-950">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-primary-600/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary-500/20 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <div className="bg-white p-3 rounded-2xl shadow-xl mb-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo_normal.webp"
              alt="Escudo Alcaldía de Florencia"
              width={56}
              height={70}
              className="object-contain"
            />
          </div>
          <h1 className="text-lg font-bold text-white">Alcaldía de Florencia</h1>
          <p className="text-primary-300 text-sm">Sistema TrazApp</p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="h-2 flex">
            <div className="flex-1 bg-primary-500" />
            <div className="flex-1 bg-white" />
            <div className="flex-1 bg-secondary-500" />
          </div>
          <div className="p-8">
            {submitted ? (
              <div className="text-center space-y-4">
                <div className="w-14 h-14 mx-auto bg-primary-50 rounded-full flex items-center justify-center">
                  <svg
                    className="w-7 h-7 text-primary-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-accent-900">
                  Revisa tu correo
                </h2>
                <p className="text-sm text-accent-600 leading-relaxed">
                  Si <strong>{email}</strong> está registrada, te enviamos un
                  enlace para restablecer tu contraseña. Es válido por 1 hora.
                </p>
                <p className="text-xs text-accent-500">
                  ¿No te llega? Revisa la bandeja de spam o intenta más tarde.
                </p>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-700 hover:text-primary-800"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                  </svg>
                  Volver a iniciar sesión
                </Link>
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-accent-900 mb-2">
                  ¿Olvidaste tu contraseña?
                </h2>
                <p className="text-sm text-accent-500 mb-6">
                  Escribe tu correo institucional y te enviaremos un enlace para
                  restablecerla.
                </p>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {error && (
                    <div className="flex items-center gap-3 p-3 bg-secondary-50 border-l-4 border-secondary-500 rounded-r-lg text-secondary-700 text-sm">
                      <svg
                        className="w-5 h-5 shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {error}
                    </div>
                  )}

                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-semibold text-accent-700 mb-2"
                    >
                      Correo electrónico
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg
                          className="w-5 h-5 text-accent-400 group-focus-within:text-primary-500 transition-colors"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="usuario@florencia.gov.co"
                        required
                        autoFocus
                        className="w-full pl-12 pr-4 py-3.5 rounded-xl border-2 border-accent-200 bg-accent-50/50 text-accent-900 placeholder:text-accent-400 focus:outline-none focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10 transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 px-6 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-bold rounded-xl shadow-lg shadow-primary-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Enviando…' : 'Enviar enlace'}
                  </button>
                </form>

                <div className="mt-6 pt-5 border-t border-accent-200 text-center">
                  <Link
                    href="/login"
                    className="text-sm text-accent-500 hover:text-accent-700"
                  >
                    ← Volver a iniciar sesión
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-primary-300 mt-5">
          © 2026 Alcaldía de Florencia - Caquetá
        </p>
      </div>
    </div>
  );
}
