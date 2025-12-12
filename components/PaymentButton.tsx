import React, { useState } from 'react';
import { CreditCard, Zap } from 'lucide-react';

interface PaymentButtonProps {
  sessionId: string;
  onPaymentInitiated: () => void;
}

export const PaymentButton: React.FC<PaymentButtonProps> = ({ sessionId, onPaymentInitiated }) => {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);
    
    // Simulate Network Request/Setup
    setTimeout(() => {
        setLoading(false);
        onPaymentInitiated();
    }, 600);
  };

  return (
    <button
      onClick={handleCheckout}
      disabled={loading}
      className="w-full group bg-gradient-to-r from-wrapped-primary to-green-600 hover:from-green-400 hover:to-green-500 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-between transition-all shadow-lg shadow-green-900/20"
    >
      <div className="flex flex-col text-left">
        <span className="text-xs font-medium opacity-90 uppercase tracking-widest">Desbloquear Relatório</span>
        <span className="text-xl">R$ 5,00</span>
      </div>
      <div className="flex items-center gap-3 bg-white/20 p-2 rounded-lg group-hover:bg-white/30 transition-colors">
        <span className="text-sm font-semibold">Pagar com PIX</span>
        {loading ? (
          <Zap className="w-5 h-5 animate-bounce" />
        ) : (
          <CreditCard className="w-5 h-5" />
        )}
      </div>
    </button>
  );
};