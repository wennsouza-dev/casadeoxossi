import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { supabase } from '../lib/supabase';
import NotificationBell from '../components/NotificationBell';
import { Member } from '../types';

interface MemberManagementProps {
  onLogout: () => void;
}

const MemberManagement: React.FC<MemberManagementProps> = ({ onLogout }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'inactive'>('all'); // Filter functionality

  // Fetch Members
  const fetchMembers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      if (data) {
        // Map Supabase data to Member interface
        const mappedMembers: Member[] = data.map((item: any) => ({
          id: item.id,
          name: item.full_name,
          orixa: item.religious_name || '-',
          role: item.role || 'Membro',
          // Map status to PaymentStatus (assuming monthly_fee_status corresponds to it)
          status: item.monthly_fee_status || 'Pendente',
          active: item.active,
          avatarUrl: item.avatar_url,
          email: item.email // Add email to interface in types.ts if needed, or just use here
        }));
        setMembers(mappedMembers);
      }
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('members')
        .update({ active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      // Refresh list
      fetchMembers();
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Erro ao atualizar status do membro.');
    }
  };

  const filteredMembers = members.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (member.orixa && member.orixa.toLowerCase().includes(searchTerm.toLowerCase()));

    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'active') return matchesSearch && member.active;
    if (activeTab === 'inactive') return matchesSearch && !member.active;
    return matchesSearch;
  });

  // ... (rest of the code is structure, skipping to render logic)

  // (We need to be careful with replace_file_content regular expression matching huge blocks)
  // Let's target smaller chunks for render logic updates.


  // ... inside logic
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [newReligiousName, setNewReligiousName] = useState('');
  const [newRole, setNewRole] = useState('');
  const [savingOrixa, setSavingOrixa] = useState(false);

  const openEditModal = (member: Member) => {
    setEditingMember(member);
    setNewReligiousName(member.orixa !== '-' ? member.orixa : '');
    setNewRole(member.role || 'Membro');
  };

  const handleSaveOrixa = async () => {
    if (!editingMember) return;
    setSavingOrixa(true);
    try {
      const { error } = await supabase
        .from('members')
        .update({
          religious_name: newReligiousName,
          role: newRole
        })
        .eq('id', editingMember.id);

      if (error) throw error;

      // Update local state and refresh full list to be safe or just map
      // Let's just update local map for speed
      setMembers(members.map(m => m.id === editingMember.id ? {
        ...m,
        orixa: newReligiousName || '-',
        role: newRole || 'Membro'
      } : m));
      setEditingMember(null);
    } catch (err) {
      console.error('Error updating member:', err);
      alert('Erro ao atualizar dados do membro.');
    } finally {
      setSavingOrixa(false);
    }
  };

  return (

    <div className="bg-background-light dark:bg-background-dark min-h-screen flex overflow-hidden font-display">
      <Sidebar onLogout={onLogout} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 ml-0 md:ml-72 flex flex-col h-screen overflow-hidden relative">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-4 md:py-0 px-6 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-gray-200 dark:border-[#28392e] sticky top-0 z-10">
          <div className="flex flex-col md:flex-row items-center gap-4 w-full">
            <div className="flex items-center gap-4 w-full md:w-auto">
              <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg dark:text-white dark:hover:bg-white/10 shrink-0">
                <span className="material-symbols-outlined">menu</span>
              </button>
              {/* Mobile Search Toggle or Input could go here, but keeping simple for now */}
            </div>

            {/* Search Bar - Responsive */}
            <div className="relative w-full max-w-md">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 dark:text-[#5c7a67]">
                <span className="material-symbols-outlined">search</span>
              </span>
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full py-2.5 pl-10 pr-4 text-sm rounded-xl border-none bg-gray-100 dark:bg-[#1A2C22] text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-[#20362a] transition-all"
                placeholder="Buscar por nome ou orixá..."
                type="text"
              />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-10">
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
              {/* Title ... */}
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight">Filhos da Casa</h2>
                  <div className="mt-2"><NotificationBell userRole="admin" /></div>
                </div>
                <p className="text-gray-500 dark:text-[#9db9a6] mt-2 text-lg break-words">Gerencie os membros e suas obrigações.</p>
              </div>
              <button
                className="w-full md:w-auto flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-primary/20 transition-all font-display"
                onClick={() => alert('Feature in development: Add Manual Member')}
              >
                <span className="material-symbols-outlined">add</span>
                Novo Filho
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-gray-200 dark:border-[#28392e] overflow-x-auto pb-1">
              {/* ... Tabs logic same as before ... */}
              <button
                onClick={() => setActiveTab('all')}
                className={`pb-3 px-2 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'all' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                Todos
              </button>
              <button
                onClick={() => setActiveTab('active')}
                className={`pb-3 px-2 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'active' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                Ativos
              </button>
              <button
                onClick={() => setActiveTab('inactive')}
                className={`pb-3 px-2 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'inactive' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                Pendentes <span className="ml-1 bg-red-100 text-red-600 px-1.5 rounded-full text-[10px]">{members.filter(m => !m.active).length}</span>
              </button>
            </div>

            <div className="bg-white dark:bg-[#1A2C22] rounded-3xl border border-gray-100 dark:border-[#28392e] shadow-sm overflow-hidden">
              {loading ? (
                <div className="p-10 text-center text-gray-500">Carregando membros...</div>
              ) : filteredMembers.length === 0 ? (
                <div className="p-10 text-center text-gray-500">Nenhum membro encontrado.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left hidden md:table">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-[#28392e]">
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-[#5c7a67]">Filho</th>
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-[#5c7a67]">Email</th>
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-[#5c7a67]">Orixá</th>
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-[#5c7a67]">Status</th>
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-[#5c7a67] text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-[#28392e]">
                      {filteredMembers.map((member) => (
                        <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-[#20362a] transition-colors group">
                          {/* ... Columns ... */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold">
                                {member.avatarUrl ? (
                                  <img src={member.avatarUrl} alt={member.name} className="h-full w-full rounded-full object-cover" />
                                ) : (
                                  member.name.charAt(0)
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-gray-900 dark:text-white">{member.name}</p>
                                <p className="text-xs text-gray-500 dark:text-[#9db9a6]">{member.role}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                            {(member as any).email || '-'}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 group/edit cursor-pointer" onClick={() => openEditModal(member)}>
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-[#111813] text-xs font-bold text-gray-600 dark:text-gray-300">
                                {member.orixa}
                              </span>
                              <span className="material-symbols-outlined text-[14px] text-gray-400 opacity-0 group-hover/edit:opacity-100">edit</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${member.active
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                              }`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${member.active ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                              {member.active ? 'Ativo' : 'Pendente'}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {/* Actions */}
                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => openEditModal(member)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg" title="Editar Orixá">
                                <span className="material-symbols-outlined text-[20px]">edit</span>
                              </button>
                              <button
                                onClick={() => handleToggleStatus(member.id, member.active)}
                                className={`p-2 rounded-lg transition-colors ${member.active
                                  ? 'text-red-500 hover:bg-red-50'
                                  : 'text-green-500 hover:bg-green-50'
                                  }`}
                                title={member.active ? 'Desativar Membro' : 'Aprovar/Ativar Membro'}
                              >
                                <span className="material-symbols-outlined text-[20px]">
                                  {member.active ? 'block' : 'check_circle'}
                                </span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Mobile Card View */}
                  <div className="md:hidden divide-y divide-gray-100 dark:divide-[#28392e]">
                    {filteredMembers.map(member => (
                      <div key={member.id} className="p-4 space-y-4">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold overflow-hidden">
                              {member.avatarUrl ? (
                                <img src={member.avatarUrl} alt={member.name} className="h-full w-full object-cover" />
                              ) : (
                                member.name.charAt(0)
                              )}
                            </div>
                            <div>
                              <p className="text-base font-bold text-gray-900 dark:text-white">{member.name}</p>
                              <div className="flex flex-col">
                                <span className="text-sm text-gray-500 dark:text-[#9db9a6]">{member.role}</span>
                                <span className="text-xs text-primary font-bold">{member.orixa}</span>
                              </div>
                            </div>
                          </div>
                          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${member.active
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                            }`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${member.active ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                            {member.active ? 'Ativo' : 'Pendente'}
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <button
                            onClick={() => openEditModal(member)}
                            className="flex-1 py-3 bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-white rounded-xl font-bold text-sm hover:bg-gray-200 dark:hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                            Editar
                          </button>
                          <button
                            onClick={() => handleToggleStatus(member.id, member.active)}
                            className={`flex-1 py-3 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 ${member.active
                              ? 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20'
                              : 'bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-900/20'
                              }`}
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              {member.active ? 'block' : 'check_circle'}
                            </span>
                            {member.active ? 'Desativar' : 'Aprovar'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Edit Orixa Modal */}
        {editingMember && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-surface-dark rounded-3xl p-6 w-full max-w-md shadow-2xl">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Editar Filho</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-[#9db9a6] mb-2">
                    Nome do Filho
                  </label>
                  <p className="font-bold text-gray-900 dark:text-white">{editingMember.name}</p>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-[#9db9a6] mb-2">
                    Orixá / Entidade
                  </label>
                  <input
                    type="text"
                    value={newReligiousName}
                    onChange={(e) => setNewReligiousName(e.target.value)}
                    className="w-full rounded-xl border-gray-200 dark:border-border-dark p-3 text-sm dark:text-white dark:bg-[#1A2C22] focus:ring-primary focus:border-primary"
                    placeholder="Ex: Ogum Beira Mar"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-[#9db9a6] mb-2">
                    Cargo / Função
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full rounded-xl border-gray-200 dark:border-border-dark p-3 text-sm dark:text-white dark:bg-[#1A2C22] focus:ring-primary focus:border-primary"
                  >
                    <option value="Membro">Membro</option>
                    <option value="Ogã">Ogã</option>
                    <option value="Ekedji">Ekedji</option>
                    <option value="Mãe Pequena">Mãe Pequena</option>
                    <option value="Pai Pequeno">Pai Pequeno</option>
                    <option value="Ialorixá">Ialorixá</option>
                    <option value="Babalorixá">Babalorixá</option>
                    <option value="Visitante">Visitante</option>
                  </select>
                </div>
                <div className="flex gap-3 mt-6 pt-2">
                  <button
                    onClick={() => setEditingMember(null)}
                    className="flex-1 py-3 font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveOrixa}
                    disabled={savingOrixa}
                    className="flex-1 py-3 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold shadow-lg shadow-primary/20 transition-all disabled:opacity-70"
                  >
                    {savingOrixa ? 'Salvando...' : 'Salvar'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default MemberManagement;
