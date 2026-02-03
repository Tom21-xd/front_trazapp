'use client';

import { useState } from 'react';
import { useAuthContext } from '@/store/AuthContext';
import { Avatar } from '@/components/ui';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuthContext();
  const [showMenu, setShowMenu] = useState(false);

  return (
    <header className="h-14 lg:h-16 bg-white border-b border-accent-200 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-3 lg:gap-4">
        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={onMenuClick}
          title="Abrir menú"
          aria-label="Abrir menú de navegación"
          className="lg:hidden p-2 -ml-2 text-accent-600 hover:text-accent-900 hover:bg-accent-100 rounded-lg transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <h1 className="text-sm lg:text-lg font-semibold text-accent-900 truncate max-w-[150px] sm:max-w-none">
          Bienvenido, {user?.name?.split(' ')[0] || 'Usuario'}
        </h1>
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={() => setShowMenu(!showMenu)}
          className="flex items-center gap-2 lg:gap-3 p-1.5 lg:p-2 rounded-lg hover:bg-accent-50 transition-colors"
        >
          <Avatar name={user?.name || 'U'} size="sm" />
          <div className="text-left hidden md:block">
            <p className="text-sm font-medium text-accent-900 truncate max-w-[120px]">{user?.name}</p>
            <p className="text-xs text-accent-500">{user?.role === 'ADMIN' ? 'Administrador' : 'Empleado'}</p>
          </div>
          <svg className="w-4 h-4 text-accent-500 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showMenu && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
            <div className="absolute right-0 mt-2 w-56 sm:w-48 bg-white rounded-xl shadow-lg border border-accent-200 z-20 overflow-hidden">
              <div className="p-3 border-b border-accent-200 bg-accent-50">
                <p className="text-sm font-medium text-accent-900 truncate">{user?.name}</p>
                <p className="text-xs text-accent-500 truncate">{user?.email}</p>
              </div>
              <div className="p-2">
                <button
                  type="button"
                  onClick={logout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-secondary-600 hover:bg-secondary-50 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Cerrar sesión
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
