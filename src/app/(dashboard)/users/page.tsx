'use client';

import { useEffect, useState } from 'react';
import { usersService } from '@/services';
import { Button, Card, CardHeader, CardContent, Badge, Avatar, Modal, Input, Select } from '@/components/ui';
import { formatDateTime } from '@/lib/utils';
import type { User, Role } from '@/types';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', phone: '', role: 'EMPLEADO' as Role });
  const [saving, setSaving] = useState(false);

  const loadUsers = async () => {
    try {
      const data = await usersService.getAll();
      setUsers(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await usersService.create(formData);
      setShowModal(false);
      setFormData({ name: '', email: '', password: '', phone: '', role: 'EMPLEADO' });
      loadUsers();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (user: User) => {
    try {
      if (user.isActive) {
        await usersService.deactivate(user.id);
      } else {
        await usersService.activate(user.id);
      }
      loadUsers();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-accent-900">Usuarios</h1>
          <p className="text-sm lg:text-base text-accent-500">Administra los usuarios del sistema</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="w-full sm:w-auto">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo usuario
        </Button>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-accent-900">{users.length} usuarios</h2>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-accent-50 border-b border-accent-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-accent-500 uppercase">Usuario</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-accent-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-accent-500 uppercase">Rol</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-accent-500 uppercase">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-accent-500 uppercase">Último acceso</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-accent-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-accent-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-accent-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={user.name} size="sm" />
                        <span className="font-medium text-accent-900">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-accent-600">{user.email}</td>
                    <td className="px-6 py-4">
                      <Badge variant={user.role === 'ADMIN' ? 'primary' : 'default'}>{user.role}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={user.isActive ? 'success' : 'danger'}>
                        {user.isActive ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-accent-500">
                      {user.lastLoginAt ? formatDateTime(user.lastLoginAt) : 'Nunca'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        size="sm"
                        variant={user.isActive ? 'danger' : 'primary'}
                        onClick={() => handleToggleActive(user)}
                      >
                        {user.isActive ? 'Desactivar' : 'Activar'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Nuevo usuario" size="lg">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            id="name"
            label="Nombre completo"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Input
            id="email"
            type="email"
            label="Correo electrónico"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
          <Input
            id="password"
            type="password"
            label="Contraseña"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            minLength={6}
            required
          />
          <Input
            id="phone"
            type="tel"
            label="Teléfono (opcional)"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
          <Select
            id="role"
            label="Rol"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
            options={[
              { value: 'EMPLEADO', label: 'Empleado' },
              { value: 'ADMIN', label: 'Administrador' },
            ]}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={saving}>
              Crear usuario
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
