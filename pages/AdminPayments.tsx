import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { supabase } from '../lib/supabase';

interface Payment {
    id: string;
    member_id: string;
    month: number;
    year: number;
    amount: number;
    status: string;
    proof_url: string;
    created_at: string;
    member?: {
        full_name: string;
        avatar_url: string | null;
    };
}

interface MemberStatus {
    id: string;
    full_name: string;
    avatar_url: string | null;
    status: 'up_to_date' | 'defaulting';
    pending_months: number;
    total_due: number;
    last_payment?: string;
}

const AdminPayments: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
    <tr>
        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">Membro</th>
        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">Referência</th>
        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400 text-right">Valor</th>
        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400 text-center">Status</th>
    </tr>
                                </thead >
    <tbody className="divide-y divide-gray-100 dark:divide-[#28392e]">
        {historyPayments.slice(0, 10).map(payment => (
            <tr key={payment.id} className="hover:bg-gray-50 dark:hover:bg-[#20362a]">
                <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">
                    {payment.members?.full_name}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(0, payment.month - 1).toLocaleString('pt-BR', { month: 'short' })}/{payment.year}
                </td>
                <td className="px-6 py-4 text-right font-bold text-gray-900 dark:text-white">
                    R$ {payment.amount.toFixed(2)}
                </td>
                <td className="px-6 py-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${payment.status === 'paid' ? 'bg-green-100 text-green-700' :
                        payment.status === 'rejected' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-500'
                        }`}>
                        {payment.status === 'paid' ? 'Pago' :
                            payment.status === 'rejected' ? 'Rejeitado' : payment.status}
                    </span>
                </td>
            </tr>
        ))}
    </tbody>
                            </table >
                        </div >

                    </div >
                </div >
            </main >
        </div >
    );
};

export default AdminPayments;
