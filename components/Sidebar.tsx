
import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { IMAGES } from '../constants';
import { supabase } from '../lib/supabase';
import NotificationBell from './NotificationBell';

interface SidebarProps {
  onLogout: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onLogout, isOpen = false, onClose }) => {
  const location = useLocation();
  const [userProfile, setUserProfile] = useState<{ full_name: string, avatar_url: string | null } | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const email = localStorage.getItem('userEmail');
      if (email) {
        const { data } = await supabase
          .from('members')
          .select('full_name, avatar_url')
          .eq('email', email)
          .single();
        if (data) {
          setUserProfile(data);
        } else {
          // Fallback for Admin
          setUserProfile({ full_name: 'Administrador', avatar_url: null });
        }
      }
    };
    fetchProfile();
  }, []);

  const isActive = (path: string) => location.pathname === path;

  const NavItem = ({ to, icon, label }: { to: string, icon: string, label: string }) => (
    <Link
      to={to}
      onClick={onClose}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive(to)
        ? 'bg-primary/10 text-primary font-bold'
        : 'text-gray-500 dark:text-[#9db9a6] hover:bg-gray-100 dark:hover:bg-[#1A2C22]'
        }`}
    >
      <span className={`material-symbols-outlined ${isActive(to) ? 'material-symbols-fill' : ''}`}>
        {icon}
      </span>
      <span>{label}</span>
    </Link>
  );

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/50 z-20 md:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      <aside className={`w-72 bg-white dark:bg-[#0B1610] border-r border-gray-200 dark:border-[#28392e] flex flex-col h-screen fixed z-30 transition-transform duration-300 md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-[28px]">forest</span>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-gray-900 dark:text-white leading-none">Casa de Oxóssi</h1>
            <p className="text-xs text-gray-500 dark:text-[#9db9a6] mt-1">Portal Filhos</p>
          </div>
          {onClose && (
            <div className="md:hidden ml-auto flex items-center gap-2">
              <NotificationBell userRole={'admin'} />
              <button onClick={onClose} className="text-gray-400">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-4 flex flex-col gap-1">
          <p className="px-4 text-[10px] font-bold text-gray-400 dark:text-[#5c7a67] uppercase tracking-widest mb-2">Menu Principal</p>
          <NavItem to="/admin" icon="dashboard" label="Visão Geral" />
          <NavItem to="/admin/finance" icon="account_balance_wallet" label="Financeiro" />
          <NavItem to="/admin/payments" icon="payments" label="Mensalidades" />
          <NavItem to="/admin/members" icon="groups" label="Filhos da Casa" />
          <NavItem to="/admin/agenda" icon="event" label="Agenda" />
          <NavItem to="/admin/donations" icon="volunteer_activism" label="Doações" />

          <div className="my-4 border-t border-gray-100 dark:border-[#28392e]"></div>

          <p className="px-4 text-[10px] font-bold text-gray-400 dark:text-[#5c7a67] uppercase tracking-widest mb-2">Administração</p>
          <NavItem to="/admin/pros" icon="handshake" label="Profissionais" />
          <NavItem to="/admin/settings" icon="settings" label="Configurações" />

          <div className="my-4 border-t border-gray-100 dark:border-[#28392e]"></div>
          <p className="px-4 text-[10px] font-bold text-gray-400 dark:text-[#5c7a67] uppercase tracking-widest mb-2">Acesso</p>
          <NavItem to="/filhos" icon="visibility" label="Ver como Filho" />
        </div>

        <div className="p-4 border-t border-gray-100 dark:border-[#28392e]">
          <div
            onClick={onLogout}
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/10 cursor-pointer transition-all group"
          >
            <div
              className="h-10 w-10 rounded-full bg-cover bg-center border-2 border-accent-gold bg-gray-200"
              style={{ backgroundImage: `url('${userProfile?.avatar_url || IMAGES.PAI_ANTONIO}')` }}
            ></div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                {userProfile?.full_name || 'Usuário'}
              </p>
              <p className="text-xs text-gray-500 dark:text-[#9db9a6] truncate group-hover:text-red-500">Sair do sistema</p>
            </div>
            <span className="material-symbols-outlined text-gray-400 group-hover:text-red-500 text-[20px]">logout</span>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
