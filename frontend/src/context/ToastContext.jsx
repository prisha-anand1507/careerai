import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);
export const useToast = () => useContext(ToastContext);

const styles = {
  success: { icon: CheckCircle2, cls: 'border-emerald-200 text-emerald-700' },
  error: { icon: AlertCircle, cls: 'border-red-200 text-red-700' },
  info: { icon: Info, cls: 'border-electric-100 text-electric-600' },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const push = useCallback((type, message) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, type, message }]);
    setTimeout(() => remove(id), 5000);
  }, [remove]);

  const api = useMemo(() => ({
    success: (m) => push('success', m),
    error: (m) => push('error', m),
    info: (m) => push('info', m),
  }), [push]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2" role="status" aria-live="polite">
        {toasts.map((t) => {
          const { icon: Icon, cls } = styles[t.type];
          return (
            <div key={t.id} className={`pointer-events-auto flex animate-fade-up items-start gap-3 rounded-xl border bg-white p-3.5 shadow-lift ${cls}`}>
              <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
              <p className="flex-1 text-sm font-medium text-navy">{t.message}</p>
              <button onClick={() => remove(t.id)} aria-label="Dismiss notification" className="text-navy-400 hover:text-navy">
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
