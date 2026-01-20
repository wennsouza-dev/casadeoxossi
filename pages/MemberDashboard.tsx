import React from 'react';
import MemberSidebar from '../components/MemberSidebar';

interface MemberDashboardProps {
    onLogout: () => void;
}

const MemberDashboard: React.FC<MemberDashboardProps> = ({ onLogout }) => {
    const [sidebarOpen, setSidebarOpen] = React.useState(false);

    return (
        <div className="bg-background-light dark:bg-background-dark min-h-screen flex overflow-hidden font-display">
            <MemberSidebar onLogout={onLogout} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <main className="flex-1 ml-0 md:ml-72 flex flex-col h-screen overflow-y-auto p-6 md:p-10 relative">
                <button
                    onClick={() => setSidebarOpen(true)}
                    className="md:hidden absolute top-6 left-6 p-2 bg-white dark:bg-surface-dark rounded-lg shadow-sm text-gray-500 dark:text-white z-10"
                >
                    <span className="material-symbols-outlined">menu</span>
                </button>

                <div className="max-w-7xl mx-auto space-y-8 w-full mt-8 md:mt-0">

                    {/* Header Section */}
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight font-serif italic mb-2">
                            Painel dos Filhos de Santo
                        </h1>
                        <p className="text-gray-500 dark:text-[#9db9a6] text-lg max-w-2xl">
                            Acompanhe suas obrigações, a agenda da casa e contribua com a nossa comunidade.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 bg-[#E8F5E9] dark:bg-primary/10 w-fit px-4 py-2 rounded-full border border-primary/20">
                        <span className="text-primary font-bold text-sm">14 Outubro, 2023</span>
                        <span className="material-symbols-outlined text-primary text-sm">spa</span>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* Agenda de Giras */}
                        <div className="bg-white dark:bg-surface-dark rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-border-dark">
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary">calendar_month</span>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white font-serif">Agenda de Giras</h3>
                                </div>
                                <button className="text-primary hover:underline text-xs font-bold uppercase tracking-wider">Ver tudo</button>
                            </div>

                            <div className="space-y-6 relative">
                                <div className="absolute left-[11px] top-2 bottom-2 w-[2px] bg-gray-100 dark:bg-gray-700"></div>

                                <div className="relative pl-8">
                                    <div className="absolute left-0 top-0 size-6 rounded-full bg-primary flex items-center justify-center text-white z-10">
                                        <span className="material-symbols-outlined text-[14px]">church</span>
                                    </div>
                                    <div>
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className="font-bold text-gray-900 dark:text-white">Gira de Caboclo</h4>
                                            <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Firmeza</span>
                                        </div>
                                        <p className="text-xs text-gray-400 font-medium mb-2">Sábado, 18:00</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Firmeza de mata e passes de cura.</p>
                                    </div>
                                </div>

                                <div className="relative pl-8">
                                    <div className="absolute left-0 top-0 size-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 z-10">
                                        <span className="material-symbols-outlined text-[14px]">elderly</span>
                                    </div>
                                    <div>
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className="font-bold text-gray-900 dark:text-white">Gira de Pretos Velhos</h4>
                                            <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Caridade</span>
                                        </div>
                                        <p className="text-xs text-gray-400 font-medium mb-2">Quarta-feira, 19:30</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Atendimento público e aconselhamento.</p>
                                    </div>
                                </div>

                                <div className="relative pl-8">
                                    <div className="absolute left-0 top-0 size-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 z-10">
                                        <span className="material-symbols-outlined text-[14px]">shield</span>
                                    </div>
                                    <div>
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className="font-bold text-gray-900 dark:text-white">Gira de Exu</h4>
                                            <span className="bg-black text-white px-2 py-0.5 rounded text-[10px] font-bold uppercase">Proteção</span>
                                        </div>
                                        <p className="text-xs text-gray-400 font-medium mb-2">Sexta-feira, 21:00</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Descarrego e proteção da casa.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Pedidos de Doações */}
                        <div className="bg-white dark:bg-surface-dark rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-border-dark flex flex-col">
                            <div className="flex items-center gap-2 mb-6">
                                <span className="material-symbols-outlined text-primary">volunteer_activism</span>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white font-serif">Pedidos de Doações</h3>
                            </div>

                            <div className="space-y-4 flex-1">
                                <div className="bg-[#FFF8E1] dark:bg-amber-900/20 p-5 rounded-2xl border border-[#FFE082] dark:border-amber-700/30 relative">
                                    <span className="absolute top-4 right-4 text-amber-500 font-bold">!</span>
                                    <span className="bg-[#FFE082] text-amber-900 px-2 py-0.5 rounded text-[10px] font-bold uppercase mb-2 inline-block">Urgente</span>
                                    <h4 className="font-bold text-gray-900 dark:text-white mb-1">Velas Brancas (7 dias)</h4>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">Estamos com estoque baixo para a próxima gira de Caboclo.</p>
                                    <button className="w-full bg-[#D4A017] hover:bg-[#B38600] text-white py-2 rounded-xl text-sm font-bold transition-colors">
                                        Vou levar
                                    </button>
                                </div>

                                <div className="border border-gray-100 dark:border-border-dark p-5 rounded-2xl relative">
                                    <span className="absolute top-4 right-4 text-green-500 material-symbols-outlined text-sm">leaf</span>
                                    <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase mb-2 inline-block">Necessário</span>
                                    <h4 className="font-bold text-gray-900 dark:text-white mb-1">Erva Guiné Fresca</h4>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Para banhos e defumação de sexta-feira.</p>
                                    <button className="w-full border border-primary text-primary hover:bg-primary/5 py-2 rounded-xl text-sm font-bold transition-colors">
                                        Contribuir
                                    </button>
                                </div>

                                <div className="border border-gray-100 dark:border-border-dark p-5 rounded-2xl relative">
                                    <span className="absolute top-4 right-4 text-gray-400 material-symbols-outlined text-sm">settings</span>
                                    <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase mb-2 inline-block">Opcional</span>
                                    <h4 className="font-bold text-gray-900 dark:text-white mb-1">Incenso de Defumação</h4>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Qualquer aroma de limpeza espiritual.</p>
                                    <button className="w-full border border-primary text-primary hover:bg-primary/5 py-2 rounded-xl text-sm font-bold transition-colors">
                                        Contribuir
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Checklist */}
                        <div className="bg-[#F1F8F6] dark:bg-[#1A2C22] rounded-3xl p-6 shadow-sm border border-primary/10 flex flex-col h-full">
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary">checklist</span>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white font-serif">Preparação Pessoal</h3>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs font-bold text-primary block">3/5</span>
                                    <span className="text-[10px] font-bold text-primary block uppercase">Concluído</span>
                                </div>
                            </div>

                            <p className="text-xs text-gray-500 dark:text-[#9db9a6] italic mb-6">"O que levar na Gira - Checklist de fundamentos"</p>

                            <div className="space-y-3 flex-1">
                                <div className="bg-white dark:bg-surface-dark p-3 rounded-xl flex items-center gap-3 shadow-sm">
                                    <div className="size-5 rounded-full bg-primary flex items-center justify-center text-white">
                                        <span className="material-symbols-outlined text-[14px]">check</span>
                                    </div>
                                    <span className="text-sm font-bold text-gray-700 dark:text-gray-200">Roupa Branca limpa</span>
                                </div>
                                <div className="bg-white dark:bg-surface-dark p-3 rounded-xl flex items-center gap-3 shadow-sm">
                                    <div className="size-5 rounded-full bg-primary flex items-center justify-center text-white">
                                        <span className="material-symbols-outlined text-[14px]">check</span>
                                    </div>
                                    <span className="text-sm font-bold text-gray-700 dark:text-gray-200">Guias de Proteção</span>
                                </div>
                                <div className="bg-white dark:bg-surface-dark p-3 rounded-xl flex items-center gap-3 shadow-sm">
                                    <div className="size-5 rounded-full border-2 border-gray-200 dark:border-gray-600"></div>
                                    <span className="text-sm font-bold text-gray-700 dark:text-gray-200">Pano de Cabeça</span>
                                </div>
                                <div className="bg-white dark:bg-surface-dark p-3 rounded-xl flex items-center gap-3 shadow-sm">
                                    <div className="size-5 rounded-full bg-primary flex items-center justify-center text-white">
                                        <span className="material-symbols-outlined text-[14px]">check</span>
                                    </div>
                                    <span className="text-sm font-bold text-gray-700 dark:text-gray-200">Toalha de Batismo</span>
                                </div>
                                <div className="bg-white dark:bg-surface-dark p-3 rounded-xl flex items-center gap-3 shadow-sm">
                                    <div className="size-5 rounded-full border-2 border-gray-200 dark:border-gray-600"></div>
                                    <span className="text-sm font-bold text-gray-700 dark:text-gray-200">Amuleto Pessoal</span>
                                </div>
                            </div>

                            <div className="mt-6 pt-6 border-t border-primary/10 text-center">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-[#9db9a6]">Tudo pronto para a Gira?</p>
                            </div>
                        </div>
                    </div>

                    <div className="w-full bg-[#2E7D32] rounded-3xl p-8 relative overflow-hidden mt-6 text-white text-center md:text-left flex flex-col md:flex-row items-center gap-6">
                        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '10px 10px' }}></div>
                        <div className="flex-1 relative z-10">
                            <h3 className="text-2xl font-serif italic font-bold mb-2">Mensagem do Zelador</h3>
                            <p className="text-white/90 text-sm md:text-base italic">"Que o arco de Oxóssi aponte sempre para a fartura de axé em sua vida. A casa se fortalece com a sua dedicação e caridade. Saravá!"</p>
                        </div>
                        <div className="relative z-10 bg-white/20 p-4 rounded-full backdrop-blur-sm">
                            <span className="material-symbols-outlined text-4xl">local_florist</span>
                        </div>
                        <div className="absolute bottom-4 right-6 text-[10px] font-bold uppercase tracking-[0.2em] opacity-60 hidden md:block">Respeito & Tradição</div>
                    </div>

                </div>
            </main>
        </div>
    );
};

export default MemberDashboard;
