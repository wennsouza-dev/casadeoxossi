import React from 'react';
import MemberSidebar from '../components/MemberSidebar';

const MemberDonations: React.FC = () => {
    return (
        <div className="bg-background-light dark:bg-background-dark min-h-screen flex overflow-hidden font-display">
            <MemberSidebar />
            <main className="flex-1 ml-0 md:ml-72 p-6 md:p-10 overflow-y-auto">
                <div className="max-w-4xl mx-auto space-y-8">
                    <header>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Doações e Campanhas</h2>
                        <p className="text-gray-500 dark:text-gray-400">Contribua com os elementos necessários para nossas giras.</p>
                    </header>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Destaque Urgente */}
                        <div className="md:col-span-2 bg-[#FFF8E1] dark:bg-amber-900/20 p-8 rounded-3xl border border-[#FFE082] dark:border-amber-700/30 relative overflow-hidden">
                            <div className="relative z-10">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="material-symbols-outlined text-amber-600">warning</span>
                                    <span className="text-amber-700 dark:text-amber-500 font-bold uppercase tracking-wider text-xs">Urgente</span>
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Velas Brancas (7 dias)</h3>
                                <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-lg">Estamos com estoque baixo para a próxima gira de Caboclo. Precisamos arrecadar 20 unidades até sexta-feira.</p>
                                <button className="bg-[#D4A017] hover:bg-[#B38600] text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-amber-500/20 transition-all">
                                    Vou Levar
                                </button>
                            </div>
                            <span className="material-symbols-outlined absolute -right-4 -bottom-4 text-[150px] text-amber-500/10">light_mode</span>
                        </div>

                        {/* Item Necessário */}
                        <div className="bg-white dark:bg-surface-dark p-6 rounded-3xl border border-gray-100 dark:border-border-dark shadow-sm flex flex-col">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                                    <span className="material-symbols-outlined text-green-600 dark:text-green-400">eco</span>
                                </div>
                                <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 px-2 py-1 rounded text-[10px] font-bold uppercase">Necessário</span>
                            </div>
                            <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-2">Erva Guiné Fresca</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 flex-1">Para banhos e defumação de sexta-feira.</p>
                            <button className="w-full border border-primary text-primary hover:bg-primary/5 py-3 rounded-xl font-bold transition-colors">
                                Contribuir
                            </button>
                        </div>

                        {/* Item Opcional */}
                        <div className="bg-white dark:bg-surface-dark p-6 rounded-3xl border border-gray-100 dark:border-border-dark shadow-sm flex flex-col">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                                    <span className="material-symbols-outlined text-purple-600 dark:text-purple-400">scents</span>
                                </div>
                                <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 px-2 py-1 rounded text-[10px] font-bold uppercase">Opcional</span>
                            </div>
                            <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-2">Incenso de Defumação</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 flex-1">Qualquer aroma de limpeza espiritual.</p>
                            <button className="w-full border border-primary text-primary hover:bg-primary/5 py-3 rounded-xl font-bold transition-colors">
                                Contribuir
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default MemberDonations;
