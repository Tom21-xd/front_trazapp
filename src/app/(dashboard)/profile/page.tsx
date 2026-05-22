'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuthContext } from '@/store/AuthContext';
import { authService } from '@/services';
import {
  Card,
  CardHeader,
  CardContent,
  Button,
  Input,
  Avatar,
  useToast,
} from '@/components/ui';

const MAX_AVATAR_DIM = 256; // px
const AVATAR_QUALITY = 0.82;

/** Redimensiona una imagen a un cuadrado <=256px y devuelve un data URL JPEG. */
function fileToResizedDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Imagen inválida'));
      img.onload = () => {
        const side = Math.min(img.width, img.height);
        const sx = (img.width - side) / 2;
        const sy = (img.height - side) / 2;
        const dim = Math.min(side, MAX_AVATAR_DIM);
        const canvas = document.createElement('canvas');
        canvas.width = dim;
        canvas.height = dim;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas no disponible'));
        ctx.drawImage(img, sx, sy, side, side, 0, 0, dim, dim);
        resolve(canvas.toDataURL('image/jpeg', AVATAR_QUALITY));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export default function ProfilePage() {
  const { user, refreshUser } = useAuthContext();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatar, setAvatar] = useState<string | undefined>(undefined);
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name ?? '');
      setPhone(user.phone ?? '');
      setAvatar(user.avatar ?? undefined);
    }
  }, [user]);

  const handlePickAvatar = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Selecciona una imagen');
      return;
    }
    try {
      const dataUrl = await fileToResizedDataUrl(file);
      setAvatar(dataUrl);
    } catch {
      toast.error('No se pudo procesar la imagen');
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }
    setSavingProfile(true);
    try {
      await authService.updateProfile({
        name: name.trim(),
        phone: phone.trim(),
        ...(avatar && avatar !== user?.avatar ? { avatar } : {}),
      });
      await refreshUser();
      toast.success('Perfil actualizado');
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'No se pudo guardar el perfil',
      );
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    setSavingPassword(true);
    try {
      await authService.changePassword(currentPassword, newPassword);
      toast.success('Contraseña actualizada');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'No se pudo cambiar la contraseña',
      );
    } finally {
      setSavingPassword(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-accent-900">
          Mi perfil
        </h1>
        <p className="text-sm lg:text-base text-accent-500">
          Edita tus datos y tu contraseña
        </p>
      </div>

      {/* Datos del perfil */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-accent-900">
            Información personal
          </h2>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveProfile} className="space-y-5">
            <div className="flex items-center gap-4">
              <Avatar name={name || user.name} src={avatar} size="lg" />
              <div className="space-y-1.5">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    handlePickAvatar(e.target.files?.[0]);
                    e.target.value = '';
                  }}
                />
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileRef.current?.click()}
                  >
                    Cambiar foto
                  </Button>
                  {avatar && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setAvatar(undefined)}
                    >
                      Quitar
                    </Button>
                  )}
                </div>
                <p className="text-xs text-accent-500">
                  JPG o PNG. Se recorta cuadrada y se reduce a 256px.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                id="name"
                label="Nombre completo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <Input
                id="phone"
                type="tel"
                label="Teléfono"
                placeholder="+57 300 000 0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div>
              <p className="text-xs text-accent-500 uppercase font-semibold mb-1">
                Correo (no editable)
              </p>
              <p className="text-accent-800">{user.email}</p>
            </div>

            <div>
              <p className="text-xs text-accent-500 uppercase font-semibold mb-1">
                Rol
              </p>
              <p className="text-accent-800">{user.appRoleName ?? 'Sin rol'}</p>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" loading={savingProfile} disabled={!name.trim()}>
                Guardar cambios
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Cambiar contraseña */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-accent-900">
            Cambiar contraseña
          </h2>
          <p className="text-xs text-accent-500">
            Al cambiarla se cerrarán tus otras sesiones por seguridad.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <Input
              id="currentPassword"
              type="password"
              label="Contraseña actual"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                id="newPassword"
                type="password"
                label="Nueva contraseña"
                placeholder="Mínimo 6 caracteres"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={6}
                required
              />
              <Input
                id="confirmPassword"
                type="password"
                label="Confirmar nueva contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>
            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                loading={savingPassword}
                disabled={
                  !currentPassword || !newPassword || !confirmPassword
                }
              >
                Actualizar contraseña
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
