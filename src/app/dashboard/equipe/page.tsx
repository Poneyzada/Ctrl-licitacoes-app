"use client";

import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Shield, Mail, Lock, 
  CheckCircle2, Plus, Edit3, Trash2, X, Save, Loader2, 
  Search, ShieldCheck, KeyRound, Check, RefreshCw
} from 'lucide-react';

export default function EquipeAcessosPage() {
  const [systemUsers, setSystemUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  // Modal Novo Usuário de Acesso ao Sistema
  const [modalUserOpen, setModalUserOpen] = useState(false);
  const [savingUser, setSavingUser] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'OPERADOR'
  });

  // Modal Editar Usuário de Acesso ao Sistema
  const [editUserModalOpen, setEditUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editUserData, setEditUserData] = useState({
    name: '',
    email: '',
    role: 'OPERADOR',
    active: true,
    newPassword: ''
  });
  const [savingEditUser, setSavingEditUser] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/usuarios');
      if (res.ok) {
        const data = await res.json();
        setSystemUsers(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email || !newUser.password) {
      alert('Preencha todos os campos obrigatórios.');
      return;
    }

    setSavingUser(true);
    try {
      const res = await fetch('/api/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      });

      if (res.ok) {
        setModalUserOpen(false);
        setNewUser({
          name: '',
          email: '',
          password: '',
          role: 'OPERADOR'
        });
        loadUsers();
        alert('Usuário cadastrado com sucesso!');
      } else {
        const err = await res.json();
        alert(err.error || 'Erro ao criar usuário');
      }
    } catch (e) {
      console.error(e);
      alert('Erro de conexão ao criar usuário');
    } finally {
      setSavingUser(false);
    }
  };

  const openEditUserModal = (u: any) => {
    setEditingUser(u);
    setEditUserData({
      name: u.name || '',
      email: u.email || '',
      role: u.role || 'OPERADOR',
      active: u.active !== undefined ? u.active : true,
      newPassword: ''
    });
    setEditUserModalOpen(true);
  };

  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setSavingEditUser(true);
    try {
      const payload: any = {
        name: editUserData.name,
        role: editUserData.role,
        active: editUserData.active
      };
      if (editUserData.newPassword) {
        payload.password = editUserData.newPassword;
      }

      const res = await fetch(`/api/usuarios/${editingUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setEditUserModalOpen(false);
        loadUsers();
        alert('Usuário atualizado com sucesso!');
      } else {
        alert('Erro ao atualizar usuário');
      }
    } catch (e) {
      console.error(e);
      alert('Erro de conexão ao salvar');
    } finally {
      setSavingEditUser(false);
    }
  };

  const handleDeleteUser = async (u: any) => {
    if (!confirm(`Deseja realmente excluir o acesso do usuário "${u.name}"?`)) return;

    try {
      const res = await fetch(`/api/usuarios/${u.id}`, { method: 'DELETE' });
      if (res.ok) {
        loadUsers();
        alert('Usuário removido com sucesso!');
      } else {
        alert('Não foi possível remover o usuário.');
      }
    } catch (e) {
      console.error(e);
      alert('Erro de conexão ao excluir.');
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'DIRETORIA':
      case 'DIRETOR':
        return { label: 'Diretoria / Administrador', bg: 'rgba(232, 93, 93, 0.15)', color: 'var(--color-primary)', border: 'rgba(232, 93, 93, 0.3)' };
      case 'COORDENADOR':
        return { label: 'Coordenador de Licitações', bg: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: 'rgba(59, 130, 246, 0.3)' };
      case 'OPERADOR_CAMPO':
      case 'OPERADOR':
        return { label: 'Operador / Analista', bg: 'rgba(34, 197, 94, 0.15)', color: '#34d399', border: 'rgba(34, 197, 94, 0.3)' };
      case 'MANUTENCAO_MASTER':
        return { label: 'Manutenção Master', bg: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', border: 'rgba(168, 85, 247, 0.3)' };
      default:
        return { label: role, bg: 'rgba(255, 255, 255, 0.08)', color: 'var(--text-secondary)', border: 'var(--border-color)' };
    }
  };

  const filteredUsers = systemUsers.filter(u => {
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchesSearch = !searchQuery || 
      (u.name && u.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesRole && matchesSearch;
  });

  const totalDiretoria = systemUsers.filter(u => u.role === 'DIRETORIA' || u.role === 'DIRETOR').length;
  const totalCoord = systemUsers.filter(u => u.role === 'COORDENADOR').length;
  const totalOp = systemUsers.filter(u => u.role === 'OPERADOR' || u.role === 'OPERADOR_CAMPO' || u.role === 'OPERADOR_ADM').length;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '22px' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <KeyRound size={26} style={{ color: 'var(--color-primary)' }} />
            Equipe & Perfis de Acesso ao Sistema
          </h1>
          <p className="page-subtitle">
            Gestão de credenciais, permissões de acesso ao portal e controle individual de operadores e diretores
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={() => setModalUserOpen(true)} 
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <UserPlus size={18} />
            Criar Novo Usuário
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '18px 20px', background: 'var(--bg-surface)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Usuários Cadastrados</span>
            <Users size={18} style={{ color: '#60a5fa' }} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '8px', color: 'var(--text-primary)' }}>
            {systemUsers.length}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Contas ativas na plataforma</span>
        </div>

        <div className="card" style={{ padding: '18px 20px', background: 'var(--bg-surface)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Diretoria & Gestores</span>
            <ShieldCheck size={18} style={{ color: 'var(--color-primary)' }} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '8px', color: 'var(--color-primary)' }}>
            {totalDiretoria}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Acesso total a decisões e auditoria</span>
        </div>

        <div className="card" style={{ padding: '18px 20px', background: 'var(--bg-surface)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Coordenadores</span>
            <Shield size={18} style={{ color: '#60a5fa' }} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '8px', color: '#60a5fa' }}>
            {totalCoord}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Aprovação e gestão de editais</span>
        </div>

        <div className="card" style={{ padding: '18px 20px', background: 'var(--bg-surface)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Operadores & Analistas</span>
            <CheckCircle2 size={18} style={{ color: '#34d399' }} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '8px', color: '#34d399' }}>
            {totalOp}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Triagem, documentos e campo</span>
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className="card" style={{ padding: '14px 18px', marginBottom: '20px', background: 'var(--bg-surface)' }}>
        <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Buscar por nome ou e-mail..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-control"
              style={{ paddingLeft: '36px', height: '38px', fontSize: '0.85rem' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Perfil:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="form-control"
              style={{ height: '38px', fontSize: '0.85rem', minWidth: '170px' }}
            >
              <option value="ALL">Todos os Perfis</option>
              <option value="DIRETORIA">Diretoria</option>
              <option value="COORDENADOR">Coordenador</option>
              <option value="OPERADOR">Operador</option>
              <option value="MANUTENCAO_MASTER">Manutenção Master</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabela de Usuários */}
      <div className="card" style={{ padding: '0', overflow: 'hidden', background: 'var(--bg-surface)' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <Loader2 size={28} className="animate-spin" style={{ margin: '0 auto 12px', color: 'var(--color-primary)' }} />
            Carregando usuários do sistema...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Nenhum usuário encontrado com os filtros aplicados.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Usuário</th>
                  <th>E-mail de Login</th>
                  <th>Nível de Acesso</th>
                  <th>Status</th>
                  <th>Data de Cadastro</th>
                  <th style={{ textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => {
                  const badge = getRoleBadge(u.role);
                  return (
                    <tr key={u.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '50%',
                            background: 'var(--gradient-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            color: '#fff',
                            fontSize: '0.85rem',
                            flexShrink: 0
                          }}>
                            {u.name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div>
                            <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)', display: 'block' }}>
                              {u.name}
                            </strong>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: '#60a5fa' }}>
                          {u.email}
                        </span>
                      </td>
                      <td>
                        <span style={{ 
                          fontSize: '0.75rem', 
                          fontWeight: 700, 
                          padding: '3px 9px', 
                          borderRadius: 'var(--radius-sm)',
                          background: badge.bg,
                          color: badge.color,
                          border: `1px solid ${badge.border}`
                        }}>
                          {badge.label}
                        </span>
                      </td>
                      <td>
                        <span style={{ 
                          fontSize: '0.72rem', 
                          fontWeight: 700, 
                          color: u.active ? '#34d399' : '#f87171' 
                        }}>
                          {u.active ? '● Ativo' : '● Inativo'}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString('pt-BR') : '-'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                          <button 
                            onClick={() => openEditUserModal(u)}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '6px 10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                            title="Editar Perfil ou Resetar Senha"
                          >
                            <Edit3 size={13} /> Editar / Senha
                          </button>
                          <button 
                            onClick={() => handleDeleteUser(u)}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '6px 8px', color: '#ef4444' }}
                            title="Excluir Usuário"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* MODAL: NOVO USUÁRIO                                        */}
      {/* ─────────────────────────────────────────────────────────── */}
      {modalUserOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}
        onClick={() => setModalUserOpen(false)}
        >
          <div 
            className="card" 
            style={{ 
              maxWidth: '520px', 
              width: '100%', 
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color-strong)',
              borderRadius: 'var(--radius-xl)',
              padding: '26px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: 'var(--radius-md)', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                  <UserPlus size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Criar Novo Usuário</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Cadastrar credenciais para acesso à plataforma</p>
                </div>
              </div>
              <button onClick={() => setModalUserOpen(false)} className="btn btn-ghost btn-sm">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Nome Completo *</label>
                <input 
                  value={newUser.name} 
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="form-control" 
                  placeholder="Ex: João Ferreira"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">E-mail Corporativo (Login) *</label>
                <input 
                  type="email"
                  value={newUser.email} 
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="form-control" 
                  placeholder="usuario@empresa.com.br"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Senha Inicial de Acesso *</label>
                <input 
                  type="password"
                  value={newUser.password} 
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="form-control" 
                  placeholder="Digite uma senha forte"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Perfil de Acesso / Permissão *</label>
                <select 
                  value={newUser.role} 
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="form-control"
                  required
                >
                  <option value="OPERADOR">Operador (Acesso a triagem e visualização)</option>
                  <option value="COORDENADOR">Coordenador (Gestão de licitações e aprovações)</option>
                  <option value="DIRETORIA">Diretoria / Administrador (Acesso pleno a relatórios e decisões)</option>
                  <option value="MANUTENCAO_MASTER">Manutenção Master (Configurações do sistema)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button type="button" onClick={() => setModalUserOpen(false)} className="btn btn-secondary">
                  Cancelar
                </button>
                <button type="submit" disabled={savingUser} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {savingUser ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Salvar Usuário
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* MODAL: EDITAR USUÁRIO & SENHA                              */}
      {/* ─────────────────────────────────────────────────────────── */}
      {editUserModalOpen && editingUser && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}
        onClick={() => setEditUserModalOpen(false)}
        >
          <div 
            className="card" 
            style={{ 
              maxWidth: '520px', 
              width: '100%', 
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color-strong)',
              borderRadius: 'var(--radius-xl)',
              padding: '26px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: 'var(--radius-md)', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                  <Edit3 size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Editar Acesso de Usuário</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Alterar permissões, status ou redefinir senha</p>
                </div>
              </div>
              <button onClick={() => setEditUserModalOpen(false)} className="btn btn-ghost btn-sm">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEditUser} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Nome Completo</label>
                <input 
                  value={editUserData.name} 
                  onChange={(e) => setEditUserData({ ...editUserData, name: e.target.value })}
                  className="form-control" 
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">E-mail de Login</label>
                <input 
                  value={editUserData.email} 
                  disabled
                  className="form-control" 
                  style={{ opacity: 0.6, cursor: 'not-allowed' }}
                />
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>O e-mail de login não pode ser alterado diretamente.</span>
              </div>

              <div className="form-group">
                <label className="form-label">Perfil de Acesso</label>
                <select 
                  value={editUserData.role} 
                  onChange={(e) => setEditUserData({ ...editUserData, role: e.target.value })}
                  className="form-control"
                >
                  <option value="OPERADOR">Operador</option>
                  <option value="COORDENADOR">Coordenador</option>
                  <option value="DIRETORIA">Diretoria</option>
                  <option value="MANUTENCAO_MASTER">Manutenção Master</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Status da Conta</label>
                <select 
                  value={editUserData.active ? 'true' : 'false'} 
                  onChange={(e) => setEditUserData({ ...editUserData, active: e.target.value === 'true' })}
                  className="form-control"
                >
                  <option value="true">Ativo (Acesso permitido)</option>
                  <option value="false">Inativo (Acesso bloqueado)</option>
                </select>
              </div>

              <div className="form-group" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '14px', marginTop: '4px' }}>
                <label className="form-label" style={{ color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Lock size={14} /> Redefinir Senha (opcional)
                </label>
                <input 
                  type="password"
                  value={editUserData.newPassword} 
                  onChange={(e) => setEditUserData({ ...editUserData, newPassword: e.target.value })}
                  className="form-control" 
                  placeholder="Deixe em branco para manter a senha atual"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button type="button" onClick={() => setEditUserModalOpen(false)} className="btn btn-secondary">
                  Cancelar
                </button>
                <button type="submit" disabled={savingEditUser} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {savingEditUser ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
