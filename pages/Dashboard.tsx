
import React from 'react';
import Sidebar from '../components/Sidebar';
import { RECENT_ACTIVITIES, UPCOMING_GIRAS } from '../constants';

interface DashboardProps {
  onLogout: () => void;
}

import { supabase } from '../lib/supabase';

const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
  const [memberCount, setMemberCount] = React.useState<number>(0);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchStats = async () => {
      try {
        const { count, error } = await supabase
          .from('members')
          .select('*', { count: 'exact', head: true });

        if (!error && count !== null) {
          setMemberCount(count);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen flex overflow-hidden">
      <Sidebar onLogout={onLogout} />

      <main className="flex-1 ml-0 md:ml-72 flex flex-col h-screen overflow-hidden relative">
        <header className="h-20 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-gray-200 dark:border-[#28392e] flex items-center justify-between px-6 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className="relative w-full max-w-md hidden sm:block">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 dark:text-[#5c7a67]">
                <span className="material-symbols-outlined">search</span>
              </span>
              <input
                className="w-80 py-2.5 pl-10 pr-4 text-sm rounded-xl border-none bg-gray-100 dark:bg-[#1A2C22] text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-[#20362a] transition-all"
                placeholder="Buscar filho, pagamento ou evento..."
                type="text"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 rounded-full text-gray-500 dark:text-[#9db9a6] hover:bg-gray-100 dark:hover:bg-[#1A2C22] transition-colors relative">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-red-500"></span>
            </button>
            <button className="p-2 rounded-full text-gray-500 dark:text-[#9db9a6] hover:bg-gray-100 dark:hover:bg-[#1A2C22] transition-colors">
              <span className="material-symbols-outlined">help</span>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-10">
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
              <div>
                <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight">Bom dia, Pai Antonio</h2>
                <p className="text-gray-500 dark:text-[#9db9a6] mt-2 text-lg">Que a sabedoria de Oxóssi guie suas decisões hoje.</p>
              </div>
              <div className="flex items-center gap-2 bg-accent-gold/10 px-4 py-2 rounded-lg border border-accent-gold/20">
                <span className="material-symbols-outlined text-accent-gold">calendar_month</span>
                <span className="text-accent-gold font-bold text-sm">20 de Janeiro, 2026</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-[#1A2C22] p-6 rounded-2xl border border-gray-100 dark:border-[#28392e] shadow-sm relative overflow-hidden group">
                <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <span className="material-symbols-outlined text-6xl text-primary">payments</span>
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="p-1.5 rounded-md bg-green-500/10 text-green-500">
                      <span className="material-symbols-outlined text-sm">arrow_upward</span>
                    </span>
                    <p className="text-sm font-medium text-gray-500 dark:text-[#9db9a6]">Arrecadado no Mês</p>
                  </div>
                  <p className="text-3xl font-black text-gray-900 dark:text-white">R$ 0,00</p>
                  <p className="text-xs text-green-500 mt-1 font-bold">---</p>
                </div>
              </div>

              <div className="bg-white dark:bg-[#1A2C22] p-6 rounded-2xl border border-gray-100 dark:border-[#28392e] shadow-sm relative overflow-hidden group">
                <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <span className="material-symbols-outlined text-6xl text-accent-gold">group</span>
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="p-1.5 rounded-md bg-gray-500/10 text-gray-500">
                      <span className="material-symbols-outlined text-sm">info</span>
                    </span>
                    <p className="text-sm font-medium text-gray-500 dark:text-[#9db9a6]">Total de Filhos</p>
                  </div>
                  <p className="text-3xl font-black text-gray-900 dark:text-white flex items-end gap-2">
                    {loading ? '-' : memberCount}
                  </p>
                  <div className="w-full bg-gray-100 dark:bg-[#0B1610] h-1.5 rounded-full mt-3 overflow-hidden">
                    <div className="bg-primary h-full rounded-full" style={{ width: '0%' }}></div>
                  </div>
                </div>
              </div>

              <div className="bg-accent-brown dark:bg-gradient-to-br dark:from-[#2e231e] dark:to-[#1A2C22] p-6 rounded-2xl border border-accent-brown/20 shadow-lg relative overflow-hidden text-white">
                <div className="absolute right-[-10px] bottom-[-10px] opacity-10">
                  <span className="material-symbols-outlined text-8xl">forest</span>
                </div>
                <div className="relative z-10">
                  <p className="text-sm font-medium text-white/70 mb-2">Próxima Obrigação</p>
                  <p className="text-2xl font-black text-white mb-1">Toque de Oxóssi</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="material-symbols-outlined text-white/80 text-sm">schedule</span>
                    <span className="text-sm font-bold text-white/80">Sábado, 19:00h</span>
                  </div>
                  <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full bg-white/20 text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm border border-white/10">
                    5 dias restantes
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-white dark:bg-[#1A2C22] rounded-2xl border border-gray-100 dark:border-[#28392e] overflow-hidden shadow-sm">
                <div className="p-6 border-b border-gray-100 dark:border-[#28392e] flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Atividades Recentes</h3>
                  <button className="text-sm text-primary hover:text-primary-hover font-bold">Ver tudo</button>
                </div>
                <div className="divide-y divide-gray-50 dark:divide-[#28392e]">
                  <div className="p-8 text-center text-gray-500 dark:text-[#9db9a6]">
                    Nenhuma atividade recente registrada.
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-[#1A2C22] rounded-2xl border border-gray-100 dark:border-[#28392e] overflow-hidden flex flex-col shadow-sm">
                <div className="p-6 border-b border-gray-100 dark:border-[#28392e]">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Próximos Eventos</h3>
                </div>
                <div className="p-4 flex flex-col gap-3 flex-1 overflow-y-auto">
                  <div className="p-8 text-center text-gray-500 dark:text-[#9db9a6]">
                    Nenhum evento agendado.
                  </div>
                </div>
                <div className="p-4 pt-0">
                  <button className="w-full py-3 rounded-xl border border-gray-200 dark:border-[#3b5443] text-gray-600 dark:text-[#9db9a6] text-xs font-bold hover:bg-gray-100 dark:hover:bg-[#20362a] transition-all">
                    Ver calendário completo
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
