'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { authService } from '@/services';

function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const validToken = token.length >= 32;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden');
      return;
    }
    setLoading(true);
    try {
      await authService.resetPassword(token, password);
      setDone(true);
      window.setTimeout(() => router.push('/login'), 2500);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo restablecer la contraseña',
      );
    } finally {
      setLoading(false);
    }
  };

  if (!validToken) {
    return (
      <div className="text-center space-y-4">
        <div className="w-14 h-14 mx-auto bg-secondary-50 rounded-full flex items-center justify-center">
          <svg
            className="w-7 h-7 text-secondary-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-accent-900">
          Enlace no válido
        </h2>
        <p className="text-sm text-accent-600">
          El enlace está incompleto o caducó. Solicita uno nuevo.
        </p>
        <Link
          href="/forgot-password"
          className="inline-block text-sm font-medium text-primary-700 hover:text-primary-800"
        >
          Solicitar uno nuevo →
        </Link>
      </div>
    );
  }

  if (done) {
    return (
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
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-accent-900">
          Contraseña actualizada
        </h2>
        <p className="text-sm text-accent-600">
          Ya puedes iniciar sesión con tu nueva contraseña. Te llevamos al login…
        </p>
      </div>
    );
  }

  return (
    <>
      <h2 className="text-2xl font-bold text-accent-900 mb-2">
        Crea tu nueva contraseña
      </h2>
      <p className="text-sm text-accent-500 mb-6">
        Elige una clave que recuerdes. Mínimo 6 caracteres.
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
            htmlFor="password"
            className="block text-sm font-semibold text-accent-700 mb-2"
          >
            Nueva contraseña
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
              autoFocus
              className="w-full pl-4 pr-12 py-3.5 rounded-xl border-2 border-accent-200 bg-accent-50/50 text-accent-900 placeholder:text-accent-400 focus:outline-none focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-accent-400 hover:text-primary-500"
              tabIndex={-1}
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
        </div>

        <div>
          <label
            htmlFor="confirm"
            className="block text-sm font-semibold text-accent-700 mb-2"
          >
            Confirmar contraseña
          </label>
          <input
            id="confirm"
            type={showPassword ? 'text' : 'password'}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            minLength={6}
            required
            className="w-full px-4 py-3.5 rounded-xl border-2 border-accent-200 bg-accent-50/50 text-accent-900 placeholder:text-accent-400 focus:outline-none focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10 transition-all"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 px-6 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-bold rounded-xl shadow-lg shadow-primary-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Guardando…' : 'Actualizar contraseña'}
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
  );
}

export default function ResetPasswordPage() {
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
            <Suspense
              fallback={
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
                </div>
              }
            >
              <ResetPasswordForm />
            </Suspense>
          </div>
        </div>

        <p className="text-center text-xs text-primary-300 mt-5">
          © 2026 Alcaldía de Florencia - Caquetá
        </p>
      </div>
    </div>
  );
}
