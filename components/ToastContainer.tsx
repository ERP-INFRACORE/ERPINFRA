import React, { useEffect, useState } from 'react';
import { useToast, ToastType } from '../context/ToastContext';
import { AlertCircle, CheckCircle, Info, X, XCircle } from 'lucide-react';

const ToastIcon = ({ type }: { type: ToastType }) => {
    switch (type) {
        case 'success':
            return <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />;
        case 'error':
            return <XCircle className="w-5 h-5 text-rose-500 shrink-0" />;
        case 'warning':
            return <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />;
        case 'info':
        default:
            return <Info className="w-5 h-5 text-cyan-500 shrink-0" />;
    }
};

const ToastItem = ({
    id,
    message,
    type,
    action,
    onRemove
}: {
    id: string;
    message: string;
    type: ToastType;
    action?: { label: string; onClick: () => void };
    onRemove: (id: string) => void;
}) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        requestAnimationFrame(() => setIsVisible(true));
    }, []);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(() => {
            onRemove(id);
        }, 250);
    };

    const getBorderColor = () => {
        switch (type) {
            case 'success':
                return 'border-l-emerald-500';
            case 'error':
                return 'border-l-rose-500';
            case 'warning':
                return 'border-l-amber-500';
            case 'info':
            default:
                return 'border-l-cyan-500';
        }
    };

    return (
        <div
            className={`
                flex flex-col gap-2 w-full p-4 mb-3 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 border-l-4
                transform transition-all duration-300 ease-out
                ${getBorderColor()}
                ${isVisible ? 'translate-x-0 opacity-100 scale-100' : 'translate-x-full opacity-0 scale-95'}
            `}
            role="alert"
        >
            <div className="flex items-start gap-3 w-full">
                <div className="mt-0.5">
                    <ToastIcon type={type} />
                </div>
                <div className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex-1 break-words leading-snug pr-1">
                    {message}
                </div>
                <button
                    type="button"
                    className="shrink-0 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg p-1.5 hover:bg-slate-200 dark:hover:bg-slate-600 inline-flex items-center justify-center transition-colors"
                    onClick={handleClose}
                    aria-label="Fechar notificação"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
            {action && (
                <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-700/60">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            action.onClick();
                            handleClose();
                        }}
                        className="px-3.5 py-1.5 bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold rounded-lg hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors shadow-2xs"
                    >
                        {action.label}
                    </button>
                </div>
            )}
        </div>
    );
};

export const ToastContainer: React.FC = () => {
    const { toasts, removeToast } = useToast();

    if (toasts.length === 0) return null;

    return (
        <div className="fixed top-20 right-4 sm:right-6 z-[9999] flex flex-col items-end w-[calc(100vw-2rem)] sm:w-full max-w-md max-h-[calc(100vh-6rem)] overflow-y-auto pointer-events-none pr-1">
            <div className="pointer-events-auto w-full">
                {toasts.map((toast) => (
                    <ToastItem
                        key={toast.id}
                        {...toast}
                        onRemove={removeToast}
                    />
                ))}
            </div>
        </div>
    );
};
