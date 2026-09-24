'use client';

import React, { useState } from 'react';
import { GlobalRole, SectorRole } from '@prisma/client';
import {
  AdminUserItem,
  createUserAction,
  toggleUserStatusAction,
  assignSectorRoleAction,
  removeSectorRoleAction,
} from '@/server/actions/user.actions';

interface SectorOption {
  id: string;
  name: string;
}

interface UserManagerProps {
  initialUsers: AdminUserItem[];
  sectors: SectorOption[];
  currentUserId: string;
}

export function UserManager({
  initialUsers,
  sectors,
  currentUserId,
}: UserManagerProps) {
  const [users, setUsers] = useState<AdminUserItem[]>(initialUsers);
  const [search, setSearch] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedUserForRoles, setSelectedUserForRoles] =
    useState<AdminUserItem | null>(null);

  // Formulário de Criação
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newGlobalRole, setNewGlobalRole] = useState<GlobalRole>(
    GlobalRole.USUARIO
  );
  const [createError, setCreateError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filtro
  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setIsSubmitting(true);

    try {
      const res = await createUserAction({
        name: newName,
        email: newEmail,
        password: newPassword,
        globalRole: newGlobalRole,
      });

      if (res.success) {
        setIsCreateModalOpen(false);
        setNewName('');
        setNewEmail('');
        setNewPassword('');
        setNewGlobalRole(GlobalRole.USUARIO);
        // Atualiza estado local adicionando novo usuário
        window.location.reload();
      } else {
        setCreateError(res.error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (user: AdminUserItem) => {
    const nextStatus = !user.isActive;
    const res = await toggleUserStatusAction({
      userId: user.id,
      isActive: nextStatus,
    });

    if (res.success) {
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, isActive: nextStatus } : u))
      );
    }
  };

  const handleToggleSectorRole = async (
    userId: string,
    sectorId: string,
    sectorName: string,
    role: SectorRole,
    hasRole: boolean
  ) => {
    if (hasRole) {
      const res = await removeSectorRoleAction({ userId, sectorId, role });
      if (res.success) {
        setUsers((prev) =>
          prev.map((u) => {
            if (u.id !== userId) return u;
            return {
              ...u,
              sectorRoles: u.sectorRoles.filter(
                (sr) => !(sr.sectorId === sectorId && sr.role === role)
              ),
            };
          })
        );
        if (selectedUserForRoles && selectedUserForRoles.id === userId) {
          setSelectedUserForRoles((curr) => {
            if (!curr) return null;
            return {
              ...curr,
              sectorRoles: curr.sectorRoles.filter(
                (sr) => !(sr.sectorId === sectorId && sr.role === role)
              ),
            };
          });
        }
      }
    } else {
      const res = await assignSectorRoleAction({ userId, sectorId, role });
      if (res.success) {
        const newRoleObj = {
          id: Math.random().toString(),
          sectorId,
          sectorName,
          role,
        };
        setUsers((prev) =>
          prev.map((u) => {
            if (u.id !== userId) return u;
            return {
              ...u,
              sectorRoles: [...u.sectorRoles, newRoleObj],
            };
          })
        );
        if (selectedUserForRoles && selectedUserForRoles.id === userId) {
          setSelectedUserForRoles((curr) => {
            if (!curr) return null;
            return {
              ...curr,
              sectorRoles: [...curr.sectorRoles, newRoleObj],
            };
          });
        }
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Barra de Ações Superiores */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="w-full sm:w-80">
          <input
            type="text"
            placeholder="Filtrar por nome ou e-mail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
          />
        </div>

        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="w-full sm:w-auto px-4 py-2.5 bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          <span>Novo Colaborador</span>
        </button>
      </div>

      {/* Tabela de Usuários */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-6">Colaborador</th>
                <th className="py-3.5 px-4">Papel Global</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-6">Vínculos por Setor (RBAC)</th>
                <th className="py-3.5 px-6 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Nenhum colaborador encontrado.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const initials = user.name
                    .split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase();

                  const isSelf = user.id === currentUserId;

                  return (
                    <tr key={user.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#182234] text-white flex items-center justify-center font-bold text-xs shrink-0">
                            {initials}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">
                              {user.name} {isSelf && '(Você)'}
                            </span>
                            <span className="text-[11px] text-slate-500 font-mono">
                              {user.email}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            user.globalRole === GlobalRole.ADMIN_GERAL
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {user.globalRole === GlobalRole.ADMIN_GERAL
                            ? 'ADMIN_GERAL'
                            : 'COLABORADOR'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <button
                          type="button"
                          disabled={isSelf}
                          onClick={() => handleToggleStatus(user)}
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition ${
                            user.isActive
                              ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                          } ${isSelf ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                          title={isSelf ? 'Não é possível desativar a própria conta' : ''}
                        >
                          {user.isActive ? '● Ativo' : '○ Inativo'}
                        </button>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex flex-wrap gap-1.5 max-w-md">
                          {user.sectorRoles.length === 0 ? (
                            <span className="text-slate-400 italic text-[11px]">
                              Sem vínculos de setor
                            </span>
                          ) : (
                            user.sectorRoles.map((sr) => (
                              <span
                                key={sr.id}
                                className={`px-2 py-0.5 rounded-md text-[10px] font-medium border ${
                                  sr.role === SectorRole.HOMOLOGADOR
                                    ? 'bg-purple-50 text-purple-700 border-purple-200'
                                    : sr.role === SectorRole.EXECUTOR
                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                    : 'bg-blue-50 text-blue-700 border-blue-200'
                                }`}
                              >
                                {sr.sectorName}: <strong>{sr.role}</strong>
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelectedUserForRoles(user)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition"
                        >
                          Gerenciar RBAC
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Novo Colaborador */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Cadastrar Novo Colaborador
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Crie uma conta de acesso para a organização.
            </p>

            {createError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome Completo
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ex: Carlos Silva"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  E-mail Corporativo
                </label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="carlos@empresa.com.br"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Senha Provisória
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Papel Global
                </label>
                <select
                  value={newGlobalRole}
                  onChange={(e) =>
                    setNewGlobalRole(e.target.value as GlobalRole)
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                >
                  <option value={GlobalRole.USUARIO}>
                    USUÁRIO (Padrão corporativo)
                  </option>
                  <option value={GlobalRole.ADMIN_GERAL}>
                    ADMIN_GERAL (Acesso irrestrito a configurações)
                  </option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-xs font-semibold rounded-xl transition shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? 'Cadastrando...' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Gerenciar RBAC por Setor */}
      {selectedUserForRoles && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Matriz RBAC: {selectedUserForRoles.name}
                </h3>
                <p className="text-xs text-slate-500">
                  Atribua ou revogue permissões setoriais de execução e homologação.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUserForRoles(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 max-h-96 overflow-y-auto space-y-4 divide-y divide-slate-100">
              {sectors.map((sec) => {
                const userRolesInSec = selectedUserForRoles.sectorRoles
                  .filter((sr) => sr.sectorId === sec.id)
                  .map((sr) => sr.role);

                const hasSolicitante = userRolesInSec.includes(
                  SectorRole.SOLICITANTE
                );
                const hasExecutor = userRolesInSec.includes(
                  SectorRole.EXECUTOR
                );
                const hasHomologador = userRolesInSec.includes(
                  SectorRole.HOMOLOGADOR
                );

                return (
                  <div key={sec.id} className="pt-3 first:pt-0">
                    <div className="font-bold text-xs text-slate-800 mb-2">
                      🏢 {sec.name}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {/* Solicitante */}
                      <button
                        type="button"
                        onClick={() =>
                          handleToggleSectorRole(
                            selectedUserForRoles.id,
                            sec.id,
                            sec.name,
                            SectorRole.SOLICITANTE,
                            hasSolicitante
                          )
                        }
                        className={`p-2 rounded-xl text-center text-xs font-semibold border transition ${
                          hasSolicitante
                            ? 'bg-blue-50 border-blue-300 text-blue-700'
                            : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100'
                        }`}
                      >
                        {hasSolicitante ? '✓ Solicitante' : '+ Solicitante'}
                      </button>

                      {/* Executor */}
                      <button
                        type="button"
                        onClick={() =>
                          handleToggleSectorRole(
                            selectedUserForRoles.id,
                            sec.id,
                            sec.name,
                            SectorRole.EXECUTOR,
                            hasExecutor
                          )
                        }
                        className={`p-2 rounded-xl text-center text-xs font-semibold border transition ${
                          hasExecutor
                            ? 'bg-amber-50 border-amber-300 text-amber-700'
                            : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100'
                        }`}
                      >
                        {hasExecutor ? '✓ Executor' : '+ Executor'}
                      </button>

                      {/* Homologador */}
                      <button
                        type="button"
                        onClick={() =>
                          handleToggleSectorRole(
                            selectedUserForRoles.id,
                            sec.id,
                            sec.name,
                            SectorRole.HOMOLOGADOR,
                            hasHomologador
                          )
                        }
                        className={`p-2 rounded-xl text-center text-xs font-semibold border transition ${
                          hasHomologador
                            ? 'bg-purple-50 border-purple-300 text-purple-700'
                            : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100'
                        }`}
                      >
                        {hasHomologador ? '✓ Homologador' : '+ Homologador'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedUserForRoles(null)}
                className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl hover:bg-slate-800 transition"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
