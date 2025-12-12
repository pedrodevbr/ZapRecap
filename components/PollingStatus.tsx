import React, { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, ArrowLeft } from 'lucide-react';

interface PollingStatusProps {
  sessionId: string;
  onPaid: () => void;
  onBack: () => void;
}

export const PollingStatus: React.FC<PollingStatusProps> = ({ sessionId, onPaid, onBack }) => {
  const [status, setStatus] = useState<'pending' | 'paid'>('pending');

  useEffect(() => {
    if (status === 'paid') return;

    // SIMULATION: Auto-approve payment after 5 seconds for Demo purposes
    const timer = setTimeout(() => {
        setStatus('paid');
        setTimeout(onPaid, 1500); 
    }, 5000);

    return () => clearTimeout(timer);
  }, [sessionId, status, onPaid]);

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-gray-900 rounded-2xl border border-gray-800">
      {status === 'pending' ? (
        <>
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 rounded-full"></div>
            <Loader2 className="w-16 h-16 text-blue-500 animate-spin relative z-10" />
          </div>
          <h3 className="text-xl font-bold mb-2">Simulando Pagamento...</h3>
          <p className="text-gray-400 text-center mb-6 max-w-xs">
            (Modo Demo Client-Side) O pagamento será aprovado automaticamente em 5 segundos.
          </p>
          <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" /> Cancelar
          </button>
        </>
      ) : (
        <>
          <CheckCircle2 className="w-20 h-20 text-green-500 mb-6 animate-bounce" />
          <h3 className="text-2xl font-bold text-green-400 mb-2">Pagamento Confirmado!</h3>
          <p className="text-gray-400">Gerando seu ZapWrapped...</p>
        </>
      )}
    </div>
  );
};