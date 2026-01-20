import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface MemberSidebarProps {
    onLogout: () => void;
    isOpen?: boolean;
    onClose?: () => void;
    userRole?: 'admin' | 'member' | null;
}

const MemberSidebar: React.FC<MemberSidebarProps> = ({ onLogout, isOpen = false, onClose, userRole }) => {
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
                if (data) setUserProfile(data);
            }
        };
        fetchProfile();
    }, []);

    const isActive = (path: string) => {
        return location.pathname === path ? 'bg-[#E8F5E9] text-primary dark:bg-primary/20 dark:text-primary' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5';
    };

    return (
        <>
            <div
                className={`fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
            />
            <aside className={`flex flex-col w-72 h-screen px-6 py-8 bg-white dark:bg-surface-dark border-r border-gray-100 dark:border-border-dark fixed left-0 top-0 z-50 transition-transform duration-300 md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex items-center justify-between mb-10">
                    <div className="flex items-center gap-3 px-2">
                        <div className="bg-primary/10 p-2 rounded-xl">
                            <span className="material-symbols-outlined text-primary text-2xl">forest</span>
                        </div>
                        <div>
                            <h1 className="text-lg font-bold tracking-tight text-gray-900 dark:text-white leading-none">Casa de Oxóssi</h1>
                            <p className="text-xs text-gray-500 dark:text-[#9db9a6] mt-1">OKÊ ARÔ, FILHO!</p>
                        </div>
                    </div>
                    {onClose && (
                        <button onClick={onClose} className="md:hidden text-gray-400 hover:text-gray-600">
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    )}
                </div>

                <nav className="flex-1 space-y-1">
                    <Link onClick={onClose} to="/filhos" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${isActive('/filhos')}`}>
                        <span className="material-symbols-outlined text-[20px]">dashboard</span>
                        <span className="text-sm font-bold">Painel</span>
                    </Link>
                    <Link onClick={onClose} to="/filhos/agenda" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${isActive('/filhos/agenda')}`}>
                        <span className="material-symbols-outlined text-[20px]">calendar_month</span>
                        <span className="text-sm font-bold">Agenda</span>
                    </Link>
                    <Link onClick={onClose} to="/filhos/doacoes" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${isActive('/filhos/doacoes')}`}>
                        <span className="material-symbols-outlined text-[20px]">volunteer_activism</span>
                        <span className="text-sm font-bold">Doações</span>
                    </Link>
                    <Link onClick={onClose} to="/filhos/mensalidades" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${isActive('/filhos/mensalidades')}`}>
                        <span className="material-symbols-outlined text-[20px]">payments</span>
                        <span className="text-sm font-bold">Mensalidades</span>
                    </Link>

                    <div className="my-2 border-t border-gray-100 dark:border-border-dark/50"></div>

                    <Link onClick={onClose} to="/filhos/settings" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${isActive('/filhos/settings')}`}>
                        <span className="material-symbols-outlined text-[20px]">person_edit</span>
                        <span className="text-sm font-bold">Meus Dados</span>
                    </Link>

                    {userRole === 'admin' && (
                        <Link onClick={onClose} to="/admin" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group text-amber-600 hover:bg-amber-50 dark:text-amber-500 dark:hover:bg-amber-900/10 mt-2`}>
                            <span className="material-symbols-outlined text-[20px]">admin_panel_settings</span>
                            <span className="text-sm font-bold">Voltar ao Admin</span>
                        </Link>
                    )}
                </nav>

                <div className="mt-auto">
                    {userProfile && (
                        <div className="flex items-center gap-3 px-4 py-3 mb-2 rounded-xl bg-gray-50 dark:bg-white/5 mx-2">
                            <div
                                className="h-8 w-8 rounded-full bg-cover bg-center border border-gray-200 dark:border-gray-700 bg-gray-100"
                                style={{ backgroundImage: userProfile.avatar_url ? `url('${userProfile.avatar_url}')` : 'none' }}
                            >
                                {!userProfile.avatar_url && <span className="material-symbols-outlined text-gray-400 text-sm flex items-center justify-center h-full">person</span>}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{userProfile.full_name}</p>
                            </div>
                        </div>
                    )}

                    <button
                        onClick={onLogout}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all w-full"
                    >
                        <span className="material-symbols-outlined text-[20px]">logout</span>
                        <span className="text-sm font-bold">Sair</span>
                    </button>
                </div>
            </aside>
        </>
    );
};

export default MemberSidebar;
