import React, { useState, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts';
import { SessionStats, ChatPersona } from '../types';
import { Share2, Download, Sparkles, Wand2, Repeat, Trophy, Moon, Ghost, AlignLeft, MessageCircle } from 'lucide-react';
import { generateChatPersona } from '../utils/genai';
import { StorySlide } from './StorySlide';
import html2canvas from 'html2canvas';

interface WrappedViewProps {
  sessionId: string;
  initialStats: SessionStats;
  onRestart: () => void;
}

export const WrappedView: React.FC<WrappedViewProps> = ({ sessionId, initialStats, onRestart }) => {
  const [stats] = useState<SessionStats>(initialStats);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [persona, setPersona] = useState<ChatPersona | null>(null);
  const [isGeneratingPersona, setIsGeneratingPersona] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  
  // We use this ref to capture the hidden "Poster" summary card
  const summaryCardRef = useRef<HTMLDivElement>(null);
  const totalSlides = 8;

  // Pre-calculate derived data
  const topTalkers = Object.entries(stats.messages_by_author || {})
    .map(([name, count]) => ({ name, count: count as number }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  
  const colors = ['#1DB954', '#8C4BF8', '#FF0055', '#F9D00F', '#0096FF'];
  
  const handleGeneratePersona = async () => {
    setIsGeneratingPersona(true);
    try {
      const result = await generateChatPersona(stats);
      setPersona(result);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingPersona(false);
    }
  };

  // Capture Functionality
  const handleCapture = async (action: 'download' | 'share') => {
    if (!summaryCardRef.current) return;
    setIsCapturing(true);

    try {
      // Force a slight delay to ensure fonts/images render
      await new Promise(r => setTimeout(r, 200));

      const canvas = await html2canvas(summaryCardRef.current, {
        useCORS: true,
        backgroundColor: '#121212', 
        scale: 2, // High resolution
        logging: false,
        width: 1080,
        height: 1350 // Vertical Story/Poster format
      });

      if (action === 'download') {
        const link = document.createElement('a');
        link.download = `zaprecap-${sessionId}-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      } else if (action === 'share') {
        canvas.toBlob(async (blob) => {
          if (!blob) return;
          const file = new File([blob], 'zaprecap.png', { type: 'image/png' });
          if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
              await navigator.share({
                files: [file],
                title: 'Meu ZapRecap',
                text: 'Olha como foi meu ano no WhatsApp!',
              });
            } catch (err) {
              console.log('Error sharing', err);
            }
          } else {
            // Fallback to download if web share api fails or isn't supported for files
            const link = document.createElement('a');
            link.download = `zaprecap-${sessionId}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            alert('Imagem salva! Compartilhe manualmente da sua galeria.');
          }
        });
      }

    } catch (err) {
        console.error("Capture failed", err);
        alert("Erro ao gerar imagem.");
    } finally {
        setIsCapturing(false);
    }
  };

  const getWordStyle = (count: number) => {
     // ... logic reused ...
     const max = stats.top_words?.[0]?.count || 1;
     return { opacity: 0.6 + (count/max) * 0.4 };
  };

  const nextSlide = () => {
    if (currentSlideIndex < totalSlides - 1) setCurrentSlideIndex(prev => prev + 1);
  };

  const prevSlide = () => {
    if (currentSlideIndex > 0) setCurrentSlideIndex(prev => prev - 1);
  };

  // Slide Renderers
  const renderSlide = () => {
    switch (currentSlideIndex) {
      case 0: // Intro
        return (
          <StorySlide 
            currentIndex={0} totalSlides={totalSlides} onNext={nextSlide} onPrev={prevSlide}
            colorTheme="bg-gradient-to-br from-black to-whatsapp-dark"
          >
            <div className="text-center animate-slide-up">
              <h1 className="text-4xl font-black mb-4 leading-tight">Como foi seu ano com o {stats.chatTitle || "seu grupo"}</h1>
              <p className="text-xl font-medium text-gray-300">Resumimos tudo para você.</p>
              <div className="mt-8 text-6xl animate-bounce">👋</div>
            </div>
          </StorySlide>
        );

      case 1: // Total Messages
        return (
          <StorySlide 
            currentIndex={1} totalSlides={totalSlides} onNext={nextSlide} onPrev={prevSlide}
            colorTheme="bg-gradient-to-tr from-purple-900 to-black"
          >
            <div className="text-center animate-slide-up w-full">
              <h2 className="text-2xl font-bold mb-8 uppercase tracking-widest text-purple-300">Volume Total</h2>
              <div className="text-[5rem] font-black text-white leading-none mb-4 break-words drop-shadow-[0_0_15px_rgba(140,75,248,0.5)]">
                {stats.total_messages.toLocaleString()}
              </div>
              <p className="text-xl text-gray-300">Mensagens enviadas</p>
              <p className="mt-8 text-sm opacity-50 bg-white/10 py-2 px-4 rounded-full inline-block">
                Entre {stats.date_range[0]} e {stats.date_range[1]}
              </p>
            </div>
          </StorySlide>
        );

      case 2: // Calendar Stats
        return (
          <StorySlide 
            currentIndex={2} totalSlides={totalSlides} onNext={nextSlide} onPrev={prevSlide}
            colorTheme="bg-gradient-to-bl from-pink-900 to-black"
          >
            <div className="flex flex-col gap-8 w-full animate-slide-up">
              <div className="bg-white/10 p-6 rounded-3xl border border-white/5 backdrop-blur-sm">
                <p className="uppercase text-xs font-bold tracking-widest text-pink-400 mb-2">Seu dia favorito</p>
                <p className="text-4xl font-black text-white">{stats.top_active_day}</p>
                <p className="text-sm text-gray-400 mt-2">Vocês não paravam de falar.</p>
              </div>
              
              <div className="bg-white/10 p-6 rounded-3xl border border-white/5 backdrop-blur-sm">
                <p className="uppercase text-xs font-bold tracking-widest text-yellow-400 mb-2">Horário de Pico</p>
                <p className="text-4xl font-black text-white">{stats.most_active_hour}</p>
                <p className="text-sm text-gray-400 mt-2">A hora da fofoca.</p>
              </div>
            </div>
          </StorySlide>
        );

      case 3: // Top Talkers Chart
        return (
          <StorySlide 
            currentIndex={3} totalSlides={totalSlides} onNext={nextSlide} onPrev={prevSlide}
            colorTheme="bg-gradient-to-t from-gray-900 to-green-900"
          >
            <div className="w-full h-full flex flex-col justify-center animate-slide-up">
              <h2 className="text-3xl font-black mb-8 text-center text-green-400">QUEM FALOU MAIS?</h2>
              <div className="h-[50vh] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topTalkers} layout="vertical" margin={{ left: 0, right: 20 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={100} tick={{fill: '#fff', fontSize: 14, fontWeight: 'bold'}} />
                    <Bar dataKey="count" radius={[0, 8, 8, 0]} barSize={40}>
                      {topTalkers.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-center text-gray-400 mt-4">O prêmio de tagarela vai para <span className="text-white font-bold">{topTalkers[0]?.name}</span></p>
            </div>
          </StorySlide>
        );
      
      case 4: // Awards Slide
        return (
          <StorySlide
            currentIndex={4} totalSlides={totalSlides} onNext={nextSlide} onPrev={prevSlide}
            colorTheme="bg-gradient-to-br from-yellow-900 to-red-900"
          >
             <div className="w-full flex flex-col items-center gap-6 animate-slide-up">
                <div className="flex items-center gap-3 mb-4">
                    <Trophy className="w-8 h-8 text-yellow-400" />
                    <h2 className="text-3xl font-black uppercase tracking-widest text-white">Prêmios do Ano</h2>
                </div>

                {/* Longest Message */}
                <div className="bg-white/10 w-full p-4 rounded-xl backdrop-blur-md flex items-center gap-4 border-l-4 border-blue-400">
                    <div className="bg-blue-500/20 p-3 rounded-full">
                        <AlignLeft className="w-6 h-6 text-blue-300" />
                    </div>
                    <div>
                        <p className="text-xs uppercase font-bold text-blue-300">O Palestrinha</p>
                        <p className="text-xl font-bold">{stats.awards?.longestMessage.author || "N/A"}</p>
                        <p className="text-xs text-gray-400">Escreveu um textão de {stats.awards?.longestMessage.length} caracteres.</p>
                    </div>
                </div>

                {/* Night Owl */}
                <div className="bg-white/10 w-full p-4 rounded-xl backdrop-blur-md flex items-center gap-4 border-l-4 border-purple-400">
                    <div className="bg-purple-500/20 p-3 rounded-full">
                        <Moon className="w-6 h-6 text-purple-300" />
                    </div>
                    <div>
                        <p className="text-xs uppercase font-bold text-purple-300">O Madrugueiro</p>
                        <p className="text-xl font-bold">{stats.awards?.nightOwl.author || "N/A"}</p>
                        <p className="text-xs text-gray-400">Mandou {stats.awards?.nightOwl.count} mensagens na madrugada.</p>
                    </div>
                </div>

                {/* Ghost */}
                <div className="bg-white/10 w-full p-4 rounded-xl backdrop-blur-md flex items-center gap-4 border-l-4 border-gray-400">
                    <div className="bg-gray-500/20 p-3 rounded-full">
                        <Ghost className="w-6 h-6 text-gray-300" />
                    </div>
                    <div>
                        <p className="text-xs uppercase font-bold text-gray-300">O Fantasma</p>
                        <p className="text-xl font-bold">{stats.awards?.ghost.author || "N/A"}</p>
                        <p className="text-xs text-gray-400">Só apareceu {stats.awards?.ghost.count} vezes.</p>
                    </div>
                </div>
             </div>
          </StorySlide>
        );

      case 5: // Word Cloud
        return (
          <StorySlide 
            currentIndex={5} totalSlides={totalSlides} onNext={nextSlide} onPrev={prevSlide}
            colorTheme="bg-black"
          >
            <div className="w-full flex flex-col items-center animate-slide-up">
              <h2 className="text-3xl font-black mb-2 text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                OBSESSÕES
              </h2>
              <p className="text-gray-500 mb-8 text-sm">O que vocês mais repetiram</p>
              
              <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-4">
                {(stats.top_words || []).slice(0, 30).map((item, idx) => {
                   const max = stats.top_words?.[0]?.count || 1;
                   const fontSize = 1 + (item.count / max) * 4;
                   return (
                     <span 
                       key={idx} 
                       className="font-bold drop-shadow-md select-none opacity-90"
                       style={{ fontSize: `${fontSize}rem`, color: colors[idx % colors.length] }}
                     >
                       {item.word}
                     </span>
                   )
                })}
              </div>
            </div>
          </StorySlide>
        );

      case 6: // AI Persona Generation
        return (
          <StorySlide 
            currentIndex={6} totalSlides={totalSlides} onNext={nextSlide} onPrev={prevSlide}
            colorTheme="bg-gradient-to-br from-indigo-900 via-purple-900 to-black"
          >
            <div className="flex flex-col items-center justify-center text-center w-full animate-slide-up">
              {!persona ? (
                <>
                  <Sparkles className="w-16 h-16 text-yellow-400 mb-6 animate-pulse" />
                  <h2 className="text-3xl font-bold mb-4">E finalmente...</h2>
                  <p className="text-lg text-gray-300 mb-8">A Inteligência Artificial vai definir a vibe do seu grupo.</p>
                  
                  <button 
                    onClick={handleGeneratePersona}
                    disabled={isGeneratingPersona}
                    className="bg-white text-black font-bold py-4 px-10 rounded-full flex items-center gap-3 hover:scale-105 transition-transform shadow-[0_0_30px_rgba(255,255,255,0.3)]"
                  >
                    {isGeneratingPersona ? (
                      <>
                        <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                        Analisando...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-5 h-5" />
                        Revelar Nossa Vibe
                      </>
                    )}
                  </button>
                </>
              ) : (
                <div className="relative w-full max-w-sm aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl border border-white/20 group">
                   <img src={persona.imageUrl || ''} alt="AI Generated" className="absolute inset-0 w-full h-full object-cover" />
                   <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90"></div>
                   
                   <div className="absolute bottom-0 left-0 w-full p-8 text-left">
                     <div className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-widest mb-3 border border-white/30 text-white">
                        Vibe Check Confirmado
                     </div>
                     <h2 className="text-4xl font-black text-white mb-3 leading-none uppercase drop-shadow-lg">{persona.title}</h2>
                     <p className="text-sm font-medium text-white/90 leading-relaxed">
                        "{persona.description}"
                     </p>
                   </div>
                </div>
              )}
            </div>
          </StorySlide>
        );

      case 7: // Final Share Screen
        return (
          <StorySlide 
            currentIndex={7} totalSlides={totalSlides} onNext={nextSlide} onPrev={prevSlide}
            colorTheme="bg-gradient-to-b from-whatsapp-dark to-black"
          >
             <div className="text-center w-full flex flex-col items-center animate-slide-up">
               <h1 className="text-4xl font-black mb-6">É isso aí.</h1>
               
               <div className="grid grid-cols-2 gap-4 w-full mb-8">
                 <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm">
                   <p className="text-2xl font-bold">{stats.total_messages.toLocaleString()}</p>
                   <p className="text-xs uppercase opacity-70">Mensagens</p>
                 </div>
                 <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm">
                   <p className="text-2xl font-bold">{Object.keys(stats.messages_by_author || {}).length}</p>
                   <p className="text-xs uppercase opacity-70">Pessoas</p>
                 </div>
               </div>

               <div className="flex flex-col gap-3 w-full max-w-xs">
                 <button 
                  onClick={() => handleCapture('share')}
                  disabled={isCapturing}
                  className="w-full py-4 bg-white text-black font-bold rounded-full flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors disabled:opacity-50"
                 >
                   {isCapturing ? <div className="animate-spin w-4 h-4 border-2 border-black border-t-transparent rounded-full"></div> : <Share2 className="w-5 h-5" />}
                   Compartilhar Resumo
                 </button>
                 <button 
                  onClick={() => handleCapture('download')}
                  disabled={isCapturing}
                  className="w-full py-4 bg-gray-800 text-white font-bold rounded-full flex items-center justify-center gap-2 hover:bg-gray-700 transition-colors disabled:opacity-50"
                 >
                   {isCapturing ? <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div> : <Download className="w-5 h-5" />}
                   Baixar Resumo
                 </button>
                 <button 
                  onClick={onRestart}
                  className="mt-4 text-sm text-gray-500 hover:text-white flex items-center justify-center gap-2"
                >
                   <Repeat className="w-4 h-4" /> Analisar outro chat
                 </button>
               </div>
             </div>
          </StorySlide>
        );

      default:
        return null;
    }
  };

  return (
    <>
        <div className="w-full h-screen bg-black text-white">
            {renderSlide()}
        </div>

        {/* HIDDEN MOSAIC CARD FOR GENERATION (1080x1350 vertical poster) */}
        <div 
            ref={summaryCardRef} 
            className="fixed top-0 left-[-9999px] w-[1080px] h-[1350px] bg-black text-white overflow-hidden font-sans p-10"
        >
             <div className="w-full h-full grid grid-cols-2 grid-rows-2 gap-8">
                 
                 {/* 1. Header & Total Stats */}
                 <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-10 flex flex-col justify-between relative overflow-hidden">
                     <div className="absolute top-0 right-0 p-8 opacity-20">
                         <MessageCircle className="w-32 h-32 text-whatsapp" />
                     </div>
                     <div>
                         <h1 className="text-4xl font-bold mb-2 tracking-tight">ZapRecap <span className="text-whatsapp">{new Date().getFullYear()}</span></h1>
                         <p className="text-2xl text-gray-400 truncate">{stats.chatTitle || "Seu Grupo"}</p>
                     </div>
                     <div>
                         <p className="text-xl uppercase text-gray-500 font-bold tracking-widest mb-2">Total</p>
                         <p className="text-8xl font-black text-white">{stats.total_messages.toLocaleString()}</p>
                         <p className="text-2xl text-gray-400 mt-2">mensagens trocadas</p>
                     </div>
                 </div>

                 {/* 2. Persona Image */}
                 <div className="bg-gray-800 rounded-3xl overflow-hidden relative">
                    {persona ? (
                        <>
                            <img src={persona.imageUrl || ''} className="absolute inset-0 w-full h-full object-cover" crossOrigin="anonymous" />
                            <div className="absolute bottom-0 left-0 w-full p-8 bg-gradient-to-t from-black/90 to-transparent">
                                <div className="inline-block px-4 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase mb-4 border border-white/30">Vibe Check</div>
                                <h2 className="text-5xl font-black uppercase leading-none drop-shadow-xl">{persona.title}</h2>
                            </div>
                        </>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-900">
                             <span className="text-3xl text-gray-600">Persona não gerada</span>
                        </div>
                    )}
                 </div>

                 {/* 3. Top Talkers */}
                 <div className="bg-gradient-to-t from-gray-900 to-green-900/20 rounded-3xl p-10 flex flex-col">
                     <h3 className="text-3xl font-black uppercase text-white mb-8">Top Falantes</h3>
                     <div className="flex flex-col gap-6 flex-1 justify-center">
                        {topTalkers.slice(0,5).map((t, i) => (
                             <div key={i} className="flex items-center gap-6">
                                 <span className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-xl font-bold">{i+1}</span>
                                 <div className="flex-1">
                                     <div className="h-4 bg-white/10 rounded-full overflow-hidden w-full">
                                         <div className="h-full bg-whatsapp" style={{ width: `${(t.count / (topTalkers[0].count || 1)) * 100}%` }}></div>
                                     </div>
                                     <div className="flex justify-between mt-1">
                                         <span className="text-xl font-medium truncate max-w-[200px]">{t.name}</span>
                                         <span className="text-xl text-gray-400">{t.count}</span>
                                     </div>
                                 </div>
                             </div>
                        ))}
                     </div>
                 </div>

                 {/* 4. Awards & Footer */}
                 <div className="flex flex-col gap-8">
                     <div className="flex-1 grid grid-rows-3 gap-4">
                        {/* Awards Cards */}
                        <div className="bg-blue-900/20 border border-blue-500/30 rounded-3xl p-6 flex items-center gap-6">
                            <div className="bg-blue-500/20 p-4 rounded-full"><AlignLeft className="w-10 h-10 text-blue-400" /></div>
                            <div>
                                <p className="text-sm uppercase font-bold text-blue-300">O Palestrinha</p>
                                <p className="text-2xl font-bold truncate max-w-[250px]">{stats.awards?.longestMessage.author}</p>
                            </div>
                        </div>
                        <div className="bg-purple-900/20 border border-purple-500/30 rounded-3xl p-6 flex items-center gap-6">
                            <div className="bg-purple-500/20 p-4 rounded-full"><Moon className="w-10 h-10 text-purple-400" /></div>
                            <div>
                                <p className="text-sm uppercase font-bold text-purple-300">O Madrugueiro</p>
                                <p className="text-2xl font-bold truncate max-w-[250px]">{stats.awards?.nightOwl.author}</p>
                            </div>
                        </div>
                        <div className="bg-gray-800/40 border border-gray-600/30 rounded-3xl p-6 flex items-center gap-6">
                            <div className="bg-gray-600/20 p-4 rounded-full"><Ghost className="w-10 h-10 text-gray-400" /></div>
                            <div>
                                <p className="text-sm uppercase font-bold text-gray-300">O Fantasma</p>
                                <p className="text-2xl font-bold truncate max-w-[250px]">{stats.awards?.ghost.author}</p>
                            </div>
                        </div>
                     </div>
                     <div className="bg-black rounded-3xl p-6 flex items-center justify-center text-gray-500 text-xl font-mono">
                         zaprecap.com
                     </div>
                 </div>

             </div>
        </div>
    </>
  );
};