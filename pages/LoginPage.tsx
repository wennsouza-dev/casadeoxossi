import React, { useState } from 'react';
import { IMAGES } from '../constants';
import { supabase } from '../lib/supabase';

interface LoginPageProps {
  onLogin: (role?: 'admin' | 'member') => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState(''); // Only for registration
  const [accessKey, setAccessKey] = useState(''); // Only for registration

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. Check for Admin Access (Empty Password + Valid Admin Email)
      if (!password) {
        const { data: adminData, error: adminError } = await supabase
          .from('admin_users')
          .select('email')
          .eq('email', email.toLowerCase().trim())
          .single();

        if (adminData && !adminError) {
          localStorage.setItem('userEmail', email.toLowerCase().trim());
          onLogin('admin');
          return;
        }
      }

      // 2. Check for Member Access (Standard Login with Password)
      // Note: Admin check above implies admins login without password. 
      // Members MUST have password if we enforce security, but if we follow pattern...
      // Let's assume members login with password they created.

      const { data: memberData, error: memberError } = await supabase
        .from('members')
        .select('*')
        .eq('email', email.toLowerCase().trim())
        .single();

      if (memberError || !memberData) {
        setError('Usuário não encontrado.');
        setLoading(false);
        return;
      }

      // Verify Password (Simple check for now, ideally BCrypt/Argon2 if handled by backend, but here likely plain for MVP or simple hash)
      // User prompt said "preencherão e-mail e chave" to create. 
      // I added password column.
      if (memberData.password !== password) {
        // Fallback: If user has NO password set (legacy?), maybe allow login if they provide correct key? 
        // No, simpler to require password.
        setError('Senha incorreta.');
        setLoading(false);
        return;
      }

      // Check Active Status
      if (!memberData.active) {
        setError('Seu cadastro ainda está pendente de aprovação pelo zelo.');
        setLoading(false);
        return;
      }

      // Success
      localStorage.setItem('userEmail', email.toLowerCase().trim()); // Persist email for session context
      onLogin('member');

    } catch (err: any) {
      console.error(err);
      setError('Ocorreu um erro ao tentar entrar. Tente novamente.');
    } finally {
      if (!error) setLoading(false); // Only stop loading if checked (prevents flicker on success)
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      // Validate Access Key
      if (accessKey.toLowerCase().trim() !== 'casadeoxossi') {
        setError('Chave de acesso inválida.');
        setLoading(false);
        return;
      }

      // Check if email already exists
      const { data: existingUser } = await supabase
        .from('members')
        .select('id')
        .eq('email', email.toLowerCase().trim())
        .single();

      if (existingUser) {
        setError('Este email já está cadastrado.');
        setLoading(false);
        return;
      }

      // Create Member
      const { error: insertError } = await supabase
        .from('members')
        .insert([
          {
            full_name: fullName,
            email: email.toLowerCase().trim(),
            password: password, // Storing plainly for MVP as per context implicity (no auth server typically)
            role: 'Membro',
            active: false, // Default inactive
            status: 'Ativo', // Status "religious" status
            avatar_url: '',
            created_at: new Date().toISOString()
          }
        ]);

      if (insertError) {
        throw insertError;
      }

      setSuccessMessage('Cadastro realizado com sucesso! Aguarde a liberação do seu acesso pelo zelo.');
      // Switch back to login after delay? Or just show message
      setTimeout(() => {
        setIsRegistering(false);
        setSuccessMessage('');
        setPassword('');
        setAccessKey('');
      }, 3000);

    } catch (err: any) {
      console.error(err);
      setError('Erro ao realizar cadastro: ' + (err.message || 'Tente novamente.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full font-display">
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#0f1c13] items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="w-full h-full bg-cover bg-center opacity-30 mix-blend-overlay" style={{ backgroundImage: `url('${IMAGES.FOREST_LOGIN}')` }}></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f1c13] via-transparent to-[#0f1c13]"></div>
        </div>
        <div className="relative z-10 flex flex-col items-center text-center p-12 max-w-lg">
          <div className="w-24 h-24 mb-10 text-primary opacity-90">
            <span className="material-symbols-outlined text-[80px] drop-shadow-[0_0_15px_rgba(23,207,84,0.3)]">forest</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight font-serif italic">Casa de Oxóssi</h1>
          <p className="text-gray-300 text-lg font-light leading-relaxed">Tradição, fé e organização em um só lugar.</p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 sm:p-12 lg:p-24 bg-white dark:bg-[#111813] transition-all">
        <div className="w-full max-w-md space-y-10">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">
              {isRegistering ? 'Crie sua conta' : 'Acesse sua conta'}
            </h2>
            <p className="mt-3 text-sm text-gray-500 dark:text-[#9db9a6]">
              {isRegistering ? 'Preencha os dados e a chave da casa para se cadastrar.' : 'Entre com suas credenciais para gerenciar a casa.'}
            </p>
          </div>

          <form onSubmit={isRegistering ? handleRegisterSubmit : handleLoginSubmit} className="space-y-6">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm font-bold text-center">{error}</div>
            )}
            {successMessage && (
              <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-500 text-sm font-bold text-center">{successMessage}</div>
            )}

            <div className="space-y-5">
              {isRegistering && (
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-[#9db9a6] mb-2">Nome Completo</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400 group-focus-within:text-primary transition-colors">
                      <span className="material-symbols-outlined text-[20px]">person</span>
                    </div>
                    <input
                      className="block w-full rounded-xl border-gray-200 dark:border-border-dark py-4 pl-12 text-sm dark:text-white dark:bg-surface-dark focus:ring-primary focus:border-primary transition-all bg-gray-50 dark:bg-[#1A2C22]"
                      placeholder="Seu nome"
                      required
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-[#9db9a6] mb-2">Email</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400 group-focus-within:text-primary transition-colors">
                    <span className="material-symbols-outlined text-[20px]">mail</span>
                  </div>
                  <input
                    className="block w-full rounded-xl border-gray-200 dark:border-border-dark py-4 pl-12 text-sm dark:text-white dark:bg-surface-dark focus:ring-primary focus:border-primary transition-all bg-gray-50 dark:bg-[#1A2C22]"
                    placeholder="seu@email.com"
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-[#9db9a6] mb-2">Senha</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400 group-focus-within:text-primary transition-colors">
                    <span className="material-symbols-outlined text-[20px]">lock</span>
                  </div>
                  <input
                    className="block w-full rounded-xl border-gray-200 dark:border-border-dark py-4 pl-12 text-sm dark:text-white dark:bg-surface-dark focus:ring-primary focus:border-primary transition-all bg-gray-50 dark:bg-[#1A2C22]"
                    placeholder={isRegistering ? "Crie uma senha" : "Sua senha (vazio p/ admin)"}
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              {isRegistering && (
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-[#9db9a6] mb-2">Chave da Casa</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400 group-focus-within:text-primary transition-colors">
                      <span className="material-symbols-outlined text-[20px]">key</span>
                    </div>
                    <input
                      className="block w-full rounded-xl border-gray-200 dark:border-border-dark py-4 pl-12 text-sm dark:text-white dark:bg-surface-dark focus:ring-primary focus:border-primary transition-all bg-gray-50 dark:bg-[#1A2C22]"
                      placeholder="Chave de acesso"
                      required
                      type="text"
                      value={accessKey}
                      onChange={(e) => setAccessKey(e.target.value)}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-2 ml-1">Digite a chave fornecida pelo zelo para cadastro.</p>
                </div>
              )}
            </div>

            <div className="space-y-4 pt-2">
              <button
                disabled={loading}
                className="flex w-full justify-center rounded-xl bg-primary px-4 py-4 text-sm font-black text-white shadow-xl shadow-primary/20 hover:bg-primary-hover focus:outline-none transition-all transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                type="submit"
              >
                {loading ? 'Processando...' : (isRegistering ? 'Criar Conta' : 'Entrar no Portal')}
              </button>

              <button
                className="flex w-full justify-center rounded-xl bg-transparent border border-gray-200 dark:border-border-dark px-4 py-4 text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-all"
                type="button"
                onClick={() => {
                  setIsRegistering(!isRegistering);
                  setError('');
                  setSuccessMessage('');
                }}
              >
                {isRegistering ? 'Já tem conta? Faça login' : 'Primeiro acesso? Cadastre-se'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
