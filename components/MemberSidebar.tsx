import React from 'react';
import { useLocation, Link } from 'react-router-dom';

interface MemberSidebarProps {
    onLogout: () => void;
    isOpen?: boolean;
    onClose?: () => void;
}

const MemberSidebar: React.FC<MemberSidebarProps> = ({ onLogout, isOpen = false, onClose }) => {
    const location = useLocation();

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
                    <Link onClick={onClose} to="/filhos/checklist" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${isActive('/filhos/checklist')}`}>
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
        </>
    );
};

export default MemberSidebar;
