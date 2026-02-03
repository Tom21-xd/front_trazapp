'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { authService } from '@/services';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authService.login({ email, password });
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-800 via-primary-900 to-primary-950">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-primary-600/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-1/4 right-0 w-80 h-80 bg-secondary-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -right-20 w-[500px] h-[500px] bg-secondary-600/15 rounded-full blur-3xl" />
        </div>
        {/* Pattern overlay */}
        <div className="absolute inset-0 opacity-5 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%221%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')]" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex">
        {/* Left - Branding Panel */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12">
          {/* Logo */}
          <div className="flex items-center gap-6">
            <div className="bg-white p-3 rounded-2xl shadow-2xl">
              <Image
                src="/logo_normal.webp"
                alt="Escudo Alcaldía de Florencia"
                width={80}
                height={100}
                className="object-contain"
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Alcaldía de Florencia</h1>
              <p className="text-primary-300">Caquetá - Colombia</p>
            </div>
          </div>

          {/* Main content */}
          <div className="space-y-8 max-w-lg">
            <div>
              <p className="text-primary-400 text-sm font-semibold uppercase tracking-wider mb-3">
                Sistema de Gestión
              </p>
              <h2 className="text-5xl font-black text-white leading-tight mb-6">
                Plataforma de
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-secondary-400 via-secondary-300 to-secondary-400">
                  Seguimiento
                </span>
                de Proyectos
              </h2>
              <p className="text-primary-200 text-lg leading-relaxed">
                Herramienta institucional para la gestión, control y seguimiento de actividades y proyectos de la administración municipal.
              </p>
            </div>

            {/* Features */}
            <div className="grid grid-cols-2 gap-4">
              <div className="group bg-white/5 hover:bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/10 transition-all duration-300">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <h3 className="text-white font-bold mb-1">Seguimiento</h3>
                <p className="text-primary-300 text-sm">Monitoreo de actividades</p>
              </div>

              <div className="group bg-white/5 hover:bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/10 transition-all duration-300">
                <div className="w-12 h-12 bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-white font-bold mb-1">Colaboración</h3>
                <p className="text-primary-300 text-sm">Trabajo en equipo</p>
              </div>

              <div className="group bg-white/5 hover:bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/10 transition-all duration-300">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-white font-bold mb-1">Reportes</h3>
                <p className="text-primary-300 text-sm">Métricas en tiempo real</p>
              </div>

              <div className="group bg-white/5 hover:bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/10 transition-all duration-300">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-white font-bold mb-1">Aprobaciones</h3>
                <p className="text-primary-300 text-sm">Flujos de trabajo</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between text-primary-400 text-sm">
            <p>© 2026 Alcaldía de Florencia</p>
            <p>Todos los derechos reservados</p>
          </div>
        </div>

        {/* Right - Form Panel */}
        <div className="flex-1 lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-md">
            {/* Mobile Logo */}
            <div className="lg:hidden flex flex-col items-center mb-8">
              <div className="bg-white p-3 rounded-2xl shadow-xl mb-4">
                <Image
                  src="/logo_normal.webp"
                  alt="Escudo Alcaldía de Florencia"
                  width={60}
                  height={75}
                  className="object-contain"
                />
              </div>
              <h1 className="text-xl font-bold text-white">Alcaldía de Florencia</h1>
              <p className="text-primary-300 text-sm">Sistema de Gestión de Proyectos</p>
            </div>

            {/* Form Card */}
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
              {/* Header con bandera */}
              <div className="h-2 flex">
                <div className="flex-1 bg-primary-500" />
                <div className="flex-1 bg-white" />
                <div className="flex-1 bg-secondary-500" />
              </div>

              <div className="p-8 lg:p-10">
                <div className="text-center mb-8">
                  <div className="hidden lg:block mb-4">
                    <Image
                      src="/Logohorizontal.png"
                      alt="Alcaldía de Florencia"
                      width={250}
                      height={60}
                      className="mx-auto object-contain"
                    />
                  </div>
                  <h2 className="text-2xl font-bold text-accent-900 mb-2">Iniciar Sesión</h2>
                  <p className="text-accent-500">Ingresa tus credenciales para acceder</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {error && (
                    <div className="flex items-center gap-3 p-4 bg-secondary-50 border-l-4 border-secondary-500 rounded-r-xl text-secondary-700 text-sm animate-shake">
                      <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {error}
                    </div>
                  )}

                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-accent-700 mb-2">
                      Correo electrónico
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg className="w-5 h-5 text-accent-400 group-focus-within:text-primary-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="usuario@florencia.gov.co"
                        required
                        className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-accent-200 bg-accent-50/50 text-accent-900 placeholder:text-accent-400 focus:outline-none focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-semibold text-accent-700 mb-2">
                      Contraseña
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg className="w-5 h-5 text-accent-400 group-focus-within:text-primary-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="w-full pl-12 pr-12 py-4 rounded-xl border-2 border-accent-200 bg-accent-50/50 text-accent-900 placeholder:text-accent-400 focus:outline-none focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-accent-400 hover:text-primary-500 transition-colors"
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

                  <button
                    type="submit"
                    disabled={loading}
                    className="relative w-full py-4 px-6 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-bold rounded-xl shadow-lg shadow-primary-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden group"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {loading ? (
                        <>
                          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Verificando...
                        </>
                      ) : (
                        <>
                          Ingresar al Sistema
                          <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                        </>
                      )}
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-secondary-600 to-secondary-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </button>
                </form>

                <div className="mt-8 pt-6 border-t border-accent-200">
                  <p className="text-center text-accent-500">
                    ¿No tienes cuenta?{' '}
                    <Link href="/register" className="text-primary-600 hover:text-primary-700 font-semibold hover:underline">
                      Solicitar acceso
                    </Link>
                  </p>
                </div>
              </div>
            </div>

            <p className="lg:hidden text-center text-xs text-primary-300 mt-6">
              © 2026 Alcaldía de Florencia - Caquetá
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
