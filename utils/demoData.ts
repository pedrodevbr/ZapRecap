import { SessionStats } from '../types';

const currentYear = new Date().getFullYear();

export const demoStats: SessionStats = {
  total_messages: 14503,
  participant_count: 5,
  date_range: [`01/01/${currentYear}`, `15/12/${currentYear}`],
  top_active_day: `12/06/${currentYear}`,
  most_active_hour: "21:00 - 22:00",
  top_emoji: "🤣",
  messages_by_author: {
    "Mãe": 5430,
    "Tia Sonia": 3200,
    "Eu": 4100,
    "Pai": 120,
    "Primo Chat": 1653
  },
  top_words: [
    { word: "kkkkk", count: 850 },
    { word: "bom dia", count: 420 },
    { word: "churrasco", count: 150 },
    { word: "boleto", count: 89 },
    { word: "cerveja", count: 200 },
    { word: "fofoca", count: 310 },
    { word: "família", count: 180 },
    { word: "pix", count: 95 },
    { word: "Deus", count: 400 },
    { word: "amém", count: 380 },
    { word: "bolo", count: 120 },
    { word: "festa", count: 110 },
    { word: "domingo", count: 105 },
    { word: "almoço", count: 98 },
    { word: "grupo", count: 85 }
  ],
  awards: {
      longestMessage: { author: "Tia Sonia", length: 1540 },
      nightOwl: { author: "Eu", count: 450 },
      ghost: { author: "Pai", count: 120 }
  },
  persona: {
    title: "O Grupo do Churrasco",
    description: "Vocês planejam mais do que executam, mas as figurinhas de bom dia nunca falham.",
    imagePrompt: "A chaotic brazilian family barbecue with lots of food and laughter",
    imageUrl: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=1000&auto=format&fit=crop"
  }
};