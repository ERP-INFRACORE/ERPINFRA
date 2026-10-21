import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { Construction, Lock, User, ArrowRight, AlertCircle } from 'lucide-react';

const Login = () => {
    const [username, setUsername] = useState('admin');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const { login } = useApp();
    const { addToast } = useToast();
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        await new Promise(resolve => setTimeout(resolve, 600));

        try {
            const result = await login(username, password, rememberMe);
            if (result.success) {
                navigate('/');
            } else {
                setError(result.message || 'Erro desconhecido ao tentar logar.');
                setIsLoading(false);
            }
        } catch (err) {
            console.error(err);
            setError('Falha crítica na autenticação.');
            setIsLoading(false);
        }
    };

    const handleReset = () => {
        addToast('Isso limpará todos os dados locais e tentará baixar do banco novamente. Confirmar?', 'warning', 10000, {
            label: 'SIM, RESETAR',
            onClick: () => {
                localStorage.clear();
                sessionStorage.clear();
                window.location.reload();
            }
        });
    };

    const handleForgotPassword = (e: React.MouseEvent) => {
        e.preventDefault();
        addToast(
            'Para redefinir sua senha, solicite ao Administrador em Configurações > Segurança & Acesso (ou use admin / 123 no primeiro acesso).',
            'info',
            6000
        );
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4 font-body">
            <div className="w-full max-w-5xl bg-white dark:bg-slate-800 rounded-[40px] shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px] animate-in zoom-in duration-300">

                {/* Left Side - Hero / Branding */}
                <div className="md:w-1/2 bg-slate-900 relative flex flex-col justify-between p-12 text-white">
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-500 via-slate-900 to-slate-900"></div>
                    <div className="absolute top-0 right-0 p-12 opacity-10">
                        <Construction size={400} />
                    </div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="bg-cyan-500 text-white p-2 rounded-xl shadow-lg shadow-cyan-500/20">
                                <Construction size={24} strokeWidth={2.5} />
                            </div>
                            <span className="text-2xl font-bold font-display tracking-tight">InfraCore ERP</span>
                        </div>

                        <h1 className="text-4xl md:text-5xl font-black mb-6 leading-tight tracking-tight">
                            Construindo o <span className="text-cyan-400">Futuro</span>, Gerenciando o <span className="text-indigo-400">Presente</span>.
                        </h1>
                        <p className="text-slate-400 text-lg max-w-sm leading-relaxed">
                            Sistema integrado de alta performance para gestão de obras, frota e engenharia.
                        </p>
                    </div>

                    <div className="relative z-10 flex gap-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                        <span>© 2024 InfraCore</span>
                        <span>•</span>
                        <span>v2.0 Cloud</span>
                    </div>
                </div>

                {/* Right Side - Login Form */}
                <div className="md:w-1/2 p-12 flex flex-col justify-center bg-white dark:bg-slate-800">
                    <div className="max-w-md mx-auto w-full">
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Bem-vindo de volta!</h2>
                        <p className="text-slate-500 text-sm mb-10">Insira suas credenciais para acessar o painel.</p>

                        {error && (
                            <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-300 text-xs font-bold flex flex-col gap-2 animate-in slide-in-from-top-2">
                                <div className="flex items-center gap-3">
                                    <AlertCircle size={16} />
                                    {error}
                                </div>
                                <button type="button" onClick={handleReset} className="w-full mt-2 py-2 bg-rose-100 dark:bg-rose-900/40 hover:bg-rose-200 dark:hover:bg-rose-900/60 rounded-lg text-rose-700 dark:text-rose-200 text-[10px] uppercase tracking-wider font-black transition-colors">
                                    Resetar Dados Locais (Correção)
                                </button>
                            </div>
                        )}

                        <form onSubmit={handleLogin} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Usuário</label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                                        <User size={18} />
                                    </div>
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-transparent dark:border-slate-700 focus:border-indigo-500 dark:focus:border-indigo-500 rounded-2xl py-4 pl-12 pr-4 font-bold text-sm text-slate-700 dark:text-slate-200 outline-none transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600"
                                        placeholder="ex: admin"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Senha de Acesso</label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                                        <Lock size={18} />
                                    </div>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-transparent dark:border-slate-700 focus:border-indigo-500 dark:focus:border-indigo-500 rounded-2xl py-4 pl-12 pr-4 font-bold text-sm text-slate-700 dark:text-slate-200 outline-none transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <span className="text-xs font-bold text-slate-500">Lembrar de mim</span>
                                </label>
                                <button
                                    type="button"
                                    onClick={handleForgotPassword}
                                    className="text-xs font-bold text-indigo-500 hover:text-indigo-600"
                                >
                                    Esqueceu a senha?
                                </button>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-900/10 dark:shadow-indigo-600/20 transform active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        Entrar no Sistema <ArrowRight size={16} />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
