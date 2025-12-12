import React, { useState } from 'react';
import { UploadZone } from './components/UploadZone';
import { PaymentButton } from './components/PaymentButton';
import { PaymentModal } from './components/PaymentModal';
import { WrappedView } from './components/WrappedView';
import { SessionData, AppStep } from './types';
import { demoStats } from './utils/demoData';
import { MessageCircle, Lock, ShieldCheck, PlayCircle } from 'lucide-react';

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>('upload');
  const [session, setSession] = useState<SessionData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);

  const handleUploadSuccess = (data: SessionData) => {
    setSession(data);
    setStep('preview');
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    setStep('result');
  };

  const handleViewDemo = () => {
    setIsDemoMode(true);
  };

  const closeDemo = () => {
    setIsDemoMode(false);
  };

  // If in Demo Mode, render WrappedView with demo data
  if (isDemoMode) {
    return <WrappedView sessionId="demo" initialStats={demoStats} onRestart={closeDemo} />;
  }

  // If in Result mode (Paid), render the Story View
  if (step === 'result' && session) {
    return <WrappedView sessionId={session.session_id} initialStats={session.stats} onRestart={() => setStep('upload')} />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-b from-gray-900 to-black text-white font-sans">
      <header className="w-full p-6 flex items-center justify-between max-w-4xl mx-auto">
        <div className="flex items-center gap-2">
          <MessageCircle className="text-whatsapp w-8 h-8" />
          <h1 className="text-2xl font-bold tracking-tighter">
            Zap<span className="text-whatsapp">Recap</span>
          </h1>
        </div>
        <div className="text-xs text-gray-500 flex items-center gap-1">
          <ShieldCheck className="w-3 h-3" />
          <span>100% Client-Side Privacy</span>
        </div>
      </header>

      <main className="flex-1 w-full max-w-2xl px-4 flex flex-col justify-center items-center pb-20">
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-200 text-sm w-full text-center">
            {error}
          </div>
        )}

        {step === 'upload' && (
          <div className="w-full animate-fade-in flex flex-col gap-10">
            <div className="text-center">
              <div className="inline-block px-3 py-1 bg-whatsapp/20 text-whatsapp rounded-full text-xs font-bold mb-4 tracking-wider uppercase">
                Edição {new Date().getFullYear()}
              </div>
              <h2 className="text-5xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-whatsapp to-wrapped-yellow leading-tight">
                Sua retrospectiva de conversas
              </h2>
              <p className="text-gray-400 text-lg mb-8">
                Descubra quem fala mais, suas palavras favoritas e a personalidade do seu grupo.
              </p>
              
              <button 
                onClick={handleViewDemo}
                className="flex items-center justify-center gap-2 mx-auto bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-full transition-colors border border-white/10 text-sm font-medium"
              >
                <PlayCircle className="w-4 h-4" /> Ver Exemplo
              </button>
            </div>

            <UploadZone 
              onSuccess={handleUploadSuccess} 
              onError={setError} 
              setIsLoading={setIsLoading} 
            />

            <div className="flex justify-center gap-8 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                <span>Nenhum dado sai do seu navegador</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full border border-gray-600 flex items-center justify-center text-[10px]">.</div>
                <span>Suporta .zip e .txt</span>
              </div>
            </div>
          </div>
        )}

        {step === 'preview' && session && (
          <div className="w-full animate-fade-in text-center">
            <div className="bg-wrapped-card p-8 rounded-2xl border border-gray-800 shadow-2xl mb-8">
              <h3 className="text-2xl font-bold mb-2">Arquivo Processado!</h3>
              <p className="text-gray-400 mb-6">Encontramos dados incríveis de <strong>{new Date().getFullYear()}</strong>.</p>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-800/50 p-4 rounded-xl">
                  <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Mensagens</p>
                  <p className="text-2xl font-mono font-bold text-wrapped-purple">
                    {session.stats.total_messages.toLocaleString()}
                  </p>
                </div>
                <div className="bg-gray-800/50 p-4 rounded-xl">
                  <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Participantes</p>
                  <p className="text-2xl font-mono font-bold text-wrapped-pink">
                    {session.stats.participant_count}
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-800 pt-6">
                <p className="text-sm text-gray-300 mb-4">
                  Desbloqueie a retrospectiva completa estilo Spotify Wrapped com gráficos, Persona IA e nuvem de palavras.
                </p>
                <PaymentButton sessionId={session.session_id} onPaymentInitiated={() => setShowPaymentModal(true)} />
              </div>
            </div>
            <button 
              onClick={() => { setStep('upload'); setSession(null); }}
              className="text-gray-500 hover:text-white transition-colors text-sm underline"
            >
              Começar de novo
            </button>
          </div>
        )}
      </main>

      {showPaymentModal && session && (
        <PaymentModal 
          sessionId={session.session_id} 
          onClose={() => setShowPaymentModal(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}

      {step !== 'result' && !isDemoMode && (
        <footer className="p-6 text-center text-gray-700 text-xs">
          © {new Date().getFullYear()} ZapRecap MVP. Não oficial. Não afiliado ao WhatsApp Inc.
        </footer>
      )}
    </div>
  );
};

export default App;