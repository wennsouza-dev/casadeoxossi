
import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
// import { INITIAL_MEMBERS } from '../constants';
import { supabase } from '../lib/supabase';
import { Member, PaymentStatus } from '../types';

interface MemberManagementProps {
  onLogout: () => void;
}

const MemberManagement: React.FC<MemberManagementProps> = ({ onLogout }) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch members from Supabase
  React.useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .order('full_name', { ascending: true });

      if (error) {
        console.error('Error fetching members:', error);
        return;
      }

      if (data) {
        // Map Supabase layout to Frontend Member interface
        const mappedMembers: Member[] = data.map((m: any) => ({
          id: m.id,
          name: m.full_name,
          orixa: m.religious_name || 'Não informado',
          role: m.role || 'Membro',
          // Default to 'Em Dia' if not matching enum, or handle mapping
          status: (m.status as PaymentStatus) || PaymentStatus.EM_DIA,
          active: m.active,
          avatarUrl: m.avatar_url
        }));
        setMembers(mappedMembers);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.EM_DIA: return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400';
      case PaymentStatus.PENDENTE: return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
      case PaymentStatus.ATRASADO: return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case PaymentStatus.ISENTO: return 'bg-slate-100 text-slate-800 dark:bg-slate-700/40 dark:text-slate-400';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusDot = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.EM_DIA: return 'bg-emerald-500';
      case PaymentStatus.PENDENTE: return 'bg-amber-500';
      case PaymentStatus.ATRASADO: return 'bg-red-500';
      case PaymentStatus.ISENTO: return 'bg-slate-400';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen flex">
      <Sidebar onLogout={onLogout} />

      <main className="flex-1 ml-0 md:ml-72 flex flex-col h-screen overflow-hidden">
        <header className="h-20 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-gray-100 dark:border-[#28392e] flex items-center justify-between px-6 sticky top-0 z-10 shrink-0">
          <h2 className="text-xl font-bold dark:text-white">Membros da Casa</h2>
          <button className="bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-primary/20 flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">person_add</span>
            Novo Membro
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-10">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Stats using real data */}
              <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl border border-gray-100 dark:border-border-dark shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-gray-500 dark:text-text-secondary text-[10px] font-bold uppercase tracking-widest">Total de Membros</p>
                  <span className="material-symbols-outlined text-primary bg-primary/10 p-2 rounded-lg">groups</span>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <p className="text-3xl font-black dark:text-white">{loading ? '-' : members.length}</p>
                </div>
              </div>
              <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl border border-gray-100 dark:border-border-dark shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-gray-500 dark:text-text-secondary text-[10px] font-bold uppercase tracking-widest">Em Dia</p>
                  <span className="material-symbols-outlined text-emerald-500 bg-emerald-500/10 p-2 rounded-lg">check_circle</span>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <p className="text-3xl font-black dark:text-white">{loading ? '-' : members.filter(m => m.status === 'Em Dia').length}</p>
                </div>
              </div>
              <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl border border-gray-100 dark:border-border-dark shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-gray-500 dark:text-text-secondary text-[10px] font-bold uppercase tracking-widest">Pendentes</p>
                  <span className="material-symbols-outlined text-amber-500 bg-amber-500/10 p-2 rounded-lg">pending</span>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <p className="text-3xl font-black dark:text-white">{loading ? '-' : members.filter(m => m.status === 'Pendente').length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-surface-dark rounded-2xl border border-gray-100 dark:border-border-dark shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-100 dark:border-border-dark bg-gray-50 dark:bg-surface-dark flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:max-w-xs">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                    <span className="material-symbols-outlined text-[20px]">search</span>
                  </span>
                  <input
                    className="block w-full rounded-xl border-gray-200 dark:border-border-dark bg-white dark:bg-[#112116] py-2 pl-10 pr-4 text-sm dark:text-white placeholder:text-gray-400 focus:ring-primary focus:border-primary"
                    placeholder="Buscar por nome ou cargo..."
                    type="text"
                  />
                </div>
                {/* Filters buttons */}
                <div className="flex gap-2 w-full md:w-auto">
                  {/* ... keeping filters UI but not implementing logic yet for simplicity ... */}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    {/* ... header ... */}
                    <tr className="border-b border-gray-100 dark:border-border-dark bg-gray-50/50 dark:bg-[#112116]/50">
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-text-secondary">Membro / Orixá</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-text-secondary">Cargo</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-text-secondary text-center">Mensalidade</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-text-secondary text-center">Ativo</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-text-secondary text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-border-dark">
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-gray-500">
                          Carregando membros...
                        </td>
                      </tr>
                    ) : members.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-gray-500">
                          Nenhum membro encontrado. Cadastre um novo membro para começar.
                        </td>
                      </tr>
                    ) : (
                      members.map(member => (
                        <tr key={member.id} className="group hover:bg-gray-50/80 dark:hover:bg-[#112116]/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-4">
                              <div className="relative size-10 rounded-full bg-gray-100 dark:bg-border-dark flex items-center justify-center text-gray-500 dark:text-white font-bold overflow-hidden">
                                {member.avatarUrl ? (
                                  <img src={member.avatarUrl} alt={member.name} className={`w-full h-full object-cover ${!member.active ? 'grayscale' : ''}`} />
                                ) : (
                                  <span>{member.name[0]}</span>
                                )}
                              </div>
                              <div className="flex flex-col">
                                <p className={`text-sm font-bold dark:text-white ${!member.active ? 'line-through opacity-50' : ''}`}>{member.name}</p>
                                <p className="text-xs text-gray-500 dark:text-text-secondary">{member.orixa}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="inline-flex items-center rounded-lg bg-gray-100 dark:bg-white/5 px-2 py-1 text-[10px] font-bold text-gray-600 dark:text-gray-300">
                              {member.role}
                            </div>
                          </td>
                          {/* ... keeping rest of row ... */}
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${getStatusColor(member.status)}`}>
                              <span className={`size-1.5 rounded-full ${getStatusDot(member.status)}`}></span>
                              {member.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input checked={member.active} readOnly className="sr-only peer" type="checkbox" />
                              <div className="w-11 h-6 bg-gray-200 dark:bg-border-dark peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                            </label>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                              <button className="text-gray-400 hover:text-primary transition-colors p-1" title="Editar">
                                <span className="material-symbols-outlined text-[18px]">edit</span>
                              </button>
                              <button className="text-gray-400 hover:text-red-500 transition-colors p-1" title="Excluir">
                                <span className="material-symbols-outlined text-[18px]">delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      )))}
                  </tbody>
                </table>
              </div>


              <div className="p-4 border-t border-gray-100 dark:border-border-dark bg-gray-50 dark:bg-surface-dark flex items-center justify-between">
                <p className="text-xs text-gray-500 dark:text-text-secondary font-medium">Mostrando 5 de 142 membros</p>
                <div className="flex gap-2">
                  <button className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-border-dark text-xs font-bold dark:text-white disabled:opacity-50" disabled>Anterior</button>
                  <button className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-bold">Próximo</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MemberManagement;
