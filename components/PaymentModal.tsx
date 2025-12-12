import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { X, Copy, Download, CheckCircle2, Loader2, QrCode } from 'lucide-react';

interface PaymentModalProps {
  sessionId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ sessionId, onClose, onSuccess }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  
  // Updated Payload provided by user
  const payloadForQR = "00020126670014br.gov.bcb.pix01367ac72576-ce71-4cb6-bcb9-e4602d9abb9e0205Recap52040000530398654045.005802BR5925PEDRO HENRIQUE VASCONCELO6013FOZ DO IGUACU62290525JeqdQnYLtnavPXLWCgaPArSei63040269"; 
  const amount = "5,00";

  const [status, setStatus] = useState<'waiting' | 'paid'>('waiting');

  useEffect(() => {
    // Generate QR Code from the payload
    QRCode.toDataURL(payloadForQR, { 
      width: 300,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' }
    })
    .then(url => setQrDataUrl(url))
    .catch(err => console.error(err));

    // Simulate Payment Polling
    const timer = setTimeout(() => {
      setStatus('paid');
      setTimeout(onSuccess, 2000);
    }, 10000); // 10 seconds to pretend we are waiting for bank

    return () => clearTimeout(timer);
  }, [onSuccess]);

  const handleCopy = () => {
    // Copy the simple key for easier manual entry
    navigator.clipboard.writeText(payloadForQR);
    alert('Código PIX Copia e Cola copiado!');
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.download = 'zapwrapped-pix.png';
    link.href = qrDataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-gray-900 border border-gray-700 w-full max-w-md rounded-3xl p-6 relative shadow-2xl">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {status === 'waiting' ? (
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-white">Desbloquear Relatório</h3>
              <p className="text-gray-400 text-sm">Escaneie o QR Code para pagar.</p>
            </div>

            <div className="relative group">
              {qrDataUrl ? (
                <div className="p-4 bg-white rounded-xl shadow-lg">
                  <img src={qrDataUrl} alt="QR Code PIX" className="w-48 h-48" />
                </div>
              ) : (
                <div className="w-48 h-48 bg-gray-800 rounded-xl animate-pulse flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
              )}
              <div className="absolute -bottom-3 -right-3 bg-whatsapp text-white p-2 rounded-full shadow-lg">
                <QrCode className="w-5 h-5" />
              </div>
            </div>

            <div className="text-3xl font-bold text-green-400">R$ {amount}</div>
            <div className="text-xs text-gray-500 max-w-[200px] truncate">Payload: {payloadForQR}</div>

            <div className="grid grid-cols-2 gap-3 w-full">
              <button 
                onClick={handleCopy}
                className="flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 py-3 rounded-xl font-medium transition-colors border border-gray-600"
              >
                <Copy className="w-4 h-4" /> Copia e Cola
              </button>
              <button 
                onClick={handleDownload}
                className="flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 py-3 rounded-xl font-medium transition-colors border border-gray-600"
              >
                <Download className="w-4 h-4" /> Salvar QR
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-500 animate-pulse">
              <Loader2 className="w-3 h-3 animate-spin" />
              Aguardando confirmação do banco...
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center py-10 space-y-6">
            <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mb-2">
              <CheckCircle2 className="w-16 h-16 text-green-500" />
            </div>
            <h3 className="text-3xl font-bold text-white">Pagamento Recebido!</h3>
            <p className="text-gray-400">Preparando sua experiência...</p>
          </div>
        )}
      </div>
    </div>
  );
};