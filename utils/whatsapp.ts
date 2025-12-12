import JSZip from 'jszip';
import { SessionStats, SessionAwards } from '../types';

interface Message {
  date: Date;
  author: string;
  content: string;
}

// Regex patterns for different WhatsApp formats
const REGEX_PATTERNS = [
  // Android: 20/06/2023 15:30 - Author: Message
  /^(\d{2}\/\d{2}\/\d{4}),?\s(\d{2}:\d{2})\s-\s(.*?):(.*)/,
  // iOS: [20/06/2023 15:30:12] Author: Message
  /^\[(\d{2}\/\d{2}\/\d{4}),?\s(\d{2}:\d{2}:\d{2})\]\s(.*?):(.*)/,
  // US format (simple variant): 6/20/23, 3:30 PM - Author: Message
  /^(\d{1,2}\/\d{1,2}\/\d{2,4}),?\s(\d{1,2}:\d{2}(?:\s?[aApP][mM])?)\s-\s(.*?):(.*)/
];

export class WhatsAppParser {
  static async parseFile(file: File): Promise<string> {
    if (file.name.endsWith('.zip')) {
      const zip = new JSZip();
      const contents = await zip.loadAsync(file);
      const chatFile = Object.keys(contents.files).find(name => name.endsWith('.txt') && !name.startsWith('__MACOSX'));
      
      if (!chatFile) throw new Error("Arquivo .txt de conversa não encontrado dentro do ZIP.");
      return await contents.files[chatFile].async("string");
    } else {
      return await file.text();
    }
  }

  static parseMessages(rawText: string): Message[] {
    const lines = rawText.split('\n');
    const messages: Message[] = [];
    let currentMessage: Partial<Message> | null = null;

    for (const line of lines) {
      // Clean hidden chars
      const cleanLine = line.replace(/[\u200e\u200f]/g, "").trim();
      if (!cleanLine) continue;

      let match = null;
      let detectedPatternIndex = -1;

      // Try to match date patterns
      for (let i = 0; i < REGEX_PATTERNS.length; i++) {
        const m = cleanLine.match(REGEX_PATTERNS[i]);
        if (m) {
          match = m;
          detectedPatternIndex = i;
          break;
        }
      }

      if (match) {
        // Detected a new message line
        if (currentMessage) {
           // Save previous
           messages.push(currentMessage as Message);
        }

        const [_, dateStr, timeStr, author, content] = match;
        
        // Skip system messages
        if (content.trim() === '<Media omitted>' || content.trim() === '<Mídia oculta>' || author.includes('changed the subject') || author.includes('security code')) {
             currentMessage = null;
             continue;
        }

        // Parse Date
        const [day, month, year] = dateStr.includes('/') ? dateStr.split('/') : dateStr.split('-');
        const fullYear = year.length === 2 ? `20${year}` : year;
        // Parse Time
        const [hours, minutes] = timeStr.replace(/[ap]m/i, '').split(':').map(n => parseInt(n));
        
        const dateObj = new Date(parseInt(fullYear), parseInt(month) - 1, parseInt(day), hours, minutes);

        currentMessage = {
          date: dateObj,
          author: author.trim(),
          content: content.trim()
        };

      } else {
        // Append to previous message (multiline)
        if (currentMessage) {
          currentMessage.content += `\n${cleanLine}`;
        }
      }
    }
    
    // Push last message
    if (currentMessage) messages.push(currentMessage as Message);
    
    return messages;
  }
}

export class WhatsAppAnalyzer {
  static analyze(allMessages: Message[], chatTitle: string): SessionStats {
    if (allMessages.length === 0) {
      throw new Error("Nenhuma mensagem válida encontrada.");
    }

    // FILTER: ONLY CURRENT YEAR
    const currentYear = new Date().getFullYear();
    const messages = allMessages.filter(msg => msg.date.getFullYear() === currentYear);

    if (messages.length === 0) {
      throw new Error(`Nenhuma mensagem encontrada em ${currentYear}.`);
    }

    const authorCounts: Record<string, number> = {};
    const dayCounts: Record<string, number> = {};
    const hourCounts: Record<string, number> = {};
    const wordCounts: Record<string, number> = {};
    
    // Awards Tracking
    let maxMsgLength = 0;
    let maxMsgAuthor = "";
    
    const nightOwlCounts: Record<string, number> = {};
    
    let minDate = messages[0].date;
    let maxDate = messages[0].date;

    messages.forEach(msg => {
      // Author stats
      authorCounts[msg.author] = (authorCounts[msg.author] || 0) + 1;

      // Date stats
      if (msg.date < minDate) minDate = msg.date;
      if (msg.date > maxDate) maxDate = msg.date;

      const dayKey = msg.date.toLocaleDateString();
      dayCounts[dayKey] = (dayCounts[dayKey] || 0) + 1;

      const hour = msg.date.getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;

      // Awards Logic
      // 1. Longest Message
      const msgLen = msg.content.length;
      if (msgLen > maxMsgLength) {
          maxMsgLength = msgLen;
          maxMsgAuthor = msg.author;
      }

      // 2. Night Owl (00:00 to 05:00)
      if (hour >= 0 && hour < 5) {
          nightOwlCounts[msg.author] = (nightOwlCounts[msg.author] || 0) + 1;
      }

      // Basic Word stats (naive split)
      const words = msg.content.toLowerCase().split(/\s+/);
      const ignoreWords = new Set(['que', 'para', 'com', 'não', 'sim', 'mas', 'por', 'você', 'audio', 'omitted', 'media', 'imagem', 'oculta', 'arquivo', 'figurinha']);
      
      words.forEach(w => {
        const cleanWord = w.replace(/[^a-zà-ú]/g, '');
        if (cleanWord.length > 3 && !ignoreWords.has(cleanWord)) { 
             wordCounts[cleanWord] = (wordCounts[cleanWord] || 0) + 1;
        }
      });
    });

    // Calculate Top stats
    const topActiveDay = Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
    const topActiveHourNum = parseInt(Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "0");
    const mostActiveHour = `${topActiveHourNum}:00 - ${topActiveHourNum + 1}:00`;

    // Calculate Awards
    // Night Owl
    const nightOwlEntry = Object.entries(nightOwlCounts).sort((a, b) => b[1] - a[1])[0];
    const nightOwl = nightOwlEntry ? { author: nightOwlEntry[0], count: nightOwlEntry[1] } : { author: 'Ninguém', count: 0 };
    
    // Ghost (Lowest count but > 0)
    const sortedAuthors = Object.entries(authorCounts).sort((a, b) => a[1] - b[1]); // Ascending
    const ghostEntry = sortedAuthors[0];
    
    const awards: SessionAwards = {
        longestMessage: { author: maxMsgAuthor, length: maxMsgLength },
        nightOwl: nightOwl,
        ghost: { author: ghostEntry?.[0] || "Ninguém", count: ghostEntry?.[1] || 0 }
    };

    // Increased from 5 to 50 for Cloud
    const sortedWords = Object.entries(wordCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 50)
      .map(([word, count]) => ({word, count}));

    return {
      chatTitle: chatTitle,
      total_messages: messages.length,
      participant_count: Object.keys(authorCounts).length,
      date_range: [minDate.toLocaleDateString(), maxDate.toLocaleDateString()],
      messages_by_author: authorCounts,
      top_active_day: topActiveDay,
      most_active_hour: mostActiveHour,
      top_words: sortedWords,
      top_emoji: "😂",
      awards: awards
    };
  }
}