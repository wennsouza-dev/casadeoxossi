import React from 'react';
import { useLocation, Link } from 'react-router-dom';

interface MemberSidebarProps {
    onLogout: () => void;
}

const MemberSidebar: React.FC<MemberSidebarProps> = ({ onLogout }) => {
    const location = useLocation();

    const isActive = (path: string) => {
        return location.pathname === path ? 'bg-[#E8F5E9] text-primary dark:bg-primary/20 dark:text-primary' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5';
    };

    return (
        <aside className="hidden md:flex flex-col w-72 h-screen px-6 py-8 bg-white dark:bg-surface-dark border-r border-gray-100 dark:border-border-dark fixed left-0 top-0 z-50">
            <div className="flex items-center gap-3 px-2 mb-10">
                <div className="bg-primary/10 p-2 rounded-xl">
                    <span className="material-symbols-outlined text-primary text-2xl">forest</span>
                </div>
                <div>
                    <h1 className="text-lg font-bold tracking-tight text-gray-900 dark:text-white leading-none">Casa de Oxóssi</h1>
                    <p className="text-xs text-gray-500 dark:text-[#9db9a6] mt-1">OKÊ ARÔ, FILHO!</p>
                </div>
            </div>

            <nav className="flex-1 space-y-1">
                <Link to="/filhos" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${isActive('/filhos')}`}>
                    <span className="material-symbols-outlined text-[20px]">dashboard</span>
                    <span className="text-sm font-bold">Painel</span>
                </Link>
                <Link to="/filhos/agenda" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${isActive('/filhos/agenda')}`}>
                    <span className="material-symbols-outlined text-[20px]">calendar_month</span>
                    <span className="text-sm font-bold">Agenda</span>
                </Link>
                <Link to="/filhos/doacoes" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${isActive('/filhos/doacoes')}`}>
                    <span className="material-symbols-outlined text-[20px]">volunteer_activism</span>
                    <span className="text-sm font-bold">Doações</span>
                </Link>
                <Link to="/filhos/checklist" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${isActive('/filhos/checklist')}`}>
                    <span className="material-symbols-outlined text-[20px]">checklist</span>
                    <span className="text-sm font-bold">Checklist</span>
                </Link>
            </nav>

            <div className="mt-auto">
                <button
                    onClick={onLogout}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all w-full"
                >
                    <span className="material-symbols-outlined text-[20px]">logout</span>
                    <span className="text-sm font-bold">Sair</span>
                </button>
            </div>
        </aside>
    );
};

export default MemberSidebar;
