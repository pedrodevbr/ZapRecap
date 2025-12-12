import React, { useCallback, useState } from 'react';
import { UploadCloud, FileType, AlertTriangle } from 'lucide-react';
import { SessionData } from '../types';
import { WhatsAppParser, WhatsAppAnalyzer } from '../utils/whatsapp';

interface UploadZoneProps {
  onSuccess: (data: SessionData) => void;
  onError: (msg: string) => void;
  setIsLoading: (loading: boolean) => void;
}

export const UploadZone: React.FC<UploadZoneProps> = ({ onSuccess, onError, setIsLoading }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setUploadingState] = useState(false);

  const handleFile = async (file: File) => {
    // Validation
    if (file.size > 100 * 1024 * 1024) { // 100MB limit for browser memory safety
      onError("O arquivo excede o limite de 100MB.");
      return;
    }

    if (!file.name.endsWith('.txt') && !file.name.endsWith('.zip')) {
      onError("Formato inválido. Envie apenas arquivos .txt ou .zip exportados do WhatsApp.");
      return;
    }

    setUploadingState(true);
    setIsLoading(true);
    onError("");

    try {
      // 0. Extract Chat Title from filename
      // Typical format: "WhatsApp Chat with Name.txt"
      let chatTitle = file.name
        .replace(/^WhatsApp Chat with /i, '')
        .replace(/\.(txt|zip)$/i, '');
      
      if (chatTitle.trim() === '') chatTitle = "Seu Grupo";

      // 1. Read & Unzip
      const text = await WhatsAppParser.parseFile(file);
      
      // 2. Parse Messages
      const messages = WhatsAppParser.parseMessages(text);
      
      // 3. Analyze
      const stats = WhatsAppAnalyzer.analyze(messages, chatTitle);

      // 4. Create local session
      const sessionData: SessionData = {
        session_id: crypto.randomUUID(),
        status: 'pending',
        stats: stats,
        created_at: Date.now()
      };

      // Artificial delay for UX
      await new Promise(resolve => setTimeout(resolve, 800));
      
      onSuccess(sessionData);
    } catch (err: any) {
      console.error(err);
      onError(err.message || "Falha ao processar arquivo. Verifique se o formato está correto.");
    } finally {
      setUploadingState(false);
      setIsLoading(false);
    }
  };

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <div 
      className={`
        relative border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center transition-all duration-300
        ${isDragging ? 'border-whatsapp bg-whatsapp/10' : 'border-gray-700 bg-gray-900/50 hover:bg-gray-800/50'}
        ${isUploading ? 'opacity-50 pointer-events-none' : ''}
      `}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {isUploading ? (
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-whatsapp border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-lg font-semibold animate-pulse">Processando no navegador...</p>
        </div>
      ) : (
        <>
          <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-6 shadow-lg">
            <UploadCloud className="w-8 h-8 text-whatsapp" />
          </div>
          
          <h3 className="text-xl font-bold mb-2 text-white">Arraste seu chat aqui</h3>
          <p className="text-gray-400 mb-6 text-sm max-w-xs mx-auto">
            Exporte a conversa do WhatsApp <strong className="text-red-400">SEM MÍDIA</strong> (.txt ou .zip)
          </p>
          
          <label className="bg-whatsapp hover:bg-whatsapp-dark text-white font-bold py-3 px-8 rounded-full cursor-pointer transition-transform transform hover:scale-105 active:scale-95 shadow-lg shadow-whatsapp/20">
            Selecionar Arquivo
            <input type="file" className="hidden" accept=".txt,.zip" onChange={onChange} />
          </label>

          <div className="mt-6 flex flex-col gap-2 text-xs text-gray-500 bg-gray-950 p-3 rounded border border-gray-800 max-w-sm">
            <div className="flex items-start gap-2 text-left">
              <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0" />
              <span>Processamento 100% local. Seus dados não saem do seu dispositivo.</span>
            </div>
            <div className="flex items-start gap-2 text-left">
              <FileType className="w-4 h-4 text-blue-500 shrink-0" />
              <span>Formatos suportados: .txt e .zip</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};