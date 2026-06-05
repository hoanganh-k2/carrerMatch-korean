import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Brain, X, User, Send } from 'lucide-react';
import { Candidate, queryChatbot } from '@/lib/api';

interface ChatbotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  candidates: Candidate[];
  activeUser: Candidate | null;
  setActiveUser: (candidate: Candidate) => void;
}

export function ChatbotDrawer({
  isOpen,
  onClose,
  candidates,
  activeUser,
  setActiveUser,
}: ChatbotDrawerProps) {
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'bot'; text: string }>>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Initialize and reset chat when candidate profile is switched
  useEffect(() => {
    if (activeUser) {
      setChatMessages([
        {
          sender: 'bot',
          text: `Xin chào ${activeUser.fullName}! Tôi là AI Career Advisor của CareerMatch.
          Hồ sơ của bạn hiện có trình độ: **${activeUser.topikLevel}** và các kỹ năng: **${activeUser.skillsExtracted.join(', ')}**. 
          Tôi có thể giúp bạn kiểm tra xem mình còn thiếu kỹ năng gì để ứng tuyển các job BrSE hoặc đề xuất các vị trí phù hợp nhất trên hệ thống không?`,
        },
      ]);
    }
  }, [activeUser]);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, chatLoading]);

  // Send message
  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeUser) return;

    const userMsg = chatInput;
    setChatMessages((prev) => [...prev, { sender: 'user', text: userMsg }]);
    setChatInput('');
    setChatLoading(true);

    try {
      const data = await queryChatbot(activeUser.userId, userMsg);
      setChatMessages((prev) => [...prev, { sender: 'bot', text: data.reply }]);
    } catch (err: any) {
      console.error(err);
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: 'Hệ thống AI Advisor hiện đang bận do lượng truy cập cao (503). Bạn vui lòng thử lại sau vài giây nhé!',
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  // Clean raw AI chatbot text output for rich display
  const formatBotReply = (text: string) => {
    return text.split('\n').map((line, index) => {
      let content: React.ReactNode = line;
      // Replace bold markdown tags
      if (line.includes('**')) {
        const parts = line.split('**');
        content = parts.map((part, i) =>
          i % 2 === 1 ? (
            <strong key={i} className="font-semibold text-indigo-600 dark:text-indigo-400">
              {part}
            </strong>
          ) : (
            part
          )
        );
      }

      // Bullets parsing
      if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
        const cleanLine = line.replace(/^[\s*-]+/, '');
        return (
          <li key={index} className="ml-4 list-disc my-1 text-sm text-zinc-700 dark:text-zinc-300">
            {cleanLine}
          </li>
        );
      }

      return (
        <p key={index} className="my-1.5 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 min-h-[0.5rem]">
          {content}
        </p>
      );
    });
  };

  if (!isOpen) return null;

  return (
    <div className="w-[380px] sm:w-[400px] h-[550px] bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-300">
      {/* Chatbot Header */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-900 px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-indigo-400" />
          <div>
            <h4 className="font-bold text-sm text-zinc-100">Cố vấn sự nghiệp CareerMatch</h4>
            <span className="text-[10px] font-medium text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              AI Advisor Online
            </span>
          </div>
        </div>
        <Button
          onClick={onClose}
          variant="ghost"
          size="icon"
          className="w-8 h-8 rounded-full text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Profile Selector */}
      <div className="px-4 py-2 bg-zinc-950 border-b border-zinc-800 text-xs flex items-center justify-between gap-2">
        <span className="text-zinc-500 font-medium whitespace-nowrap">Vai trò tư vấn:</span>
        {candidates.length > 0 && activeUser ? (
          <select
            value={activeUser.userId}
            onChange={(e) => {
              const selected = candidates.find((c) => c.userId === e.target.value);
              if (selected) {
                setActiveUser(selected);
              }
            }}
            className="bg-zinc-900 border border-zinc-800 rounded px-1.5 py-0.5 text-zinc-300 w-full text-[11px] focus:outline-none focus:border-zinc-700"
          >
            {candidates.map((c) => (
              <option key={c.userId} value={c.userId}>
                {c.fullName} ({c.topikLevel.replace('TOPIK_II_LEVEL_', 'Level ')},{' '}
                {c.skillsExtracted.slice(0, 2).join(', ')})
              </option>
            ))}
          </select>
        ) : (
          <span className="text-zinc-400 font-semibold italic">Không có ứng viên trong DB</span>
        )}
      </div>

      {/* Message Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-zinc-900/60 scrollbar-thin scrollbar-thumb-zinc-800">
        {chatMessages.length === 0 ? (
          <div className="text-center py-12 px-6">
            <Brain className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-500 text-xs leading-relaxed">
              Chào mừng bạn đến với Cố vấn CareerMatch! Hãy chọn một hồ sơ ứng viên ở trên để làm context tư vấn cá nhân hóa (RAG), sau đó nhập câu hỏi của bạn.
            </p>
          </div>
        ) : (
          chatMessages.map((msg, index) => (
            <div key={index} className={`flex items-start gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.sender === 'bot' && (
                <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                  <Brain className="w-4 h-4 text-indigo-400" />
                </div>
              )}

              <div
                className={`p-3 rounded-2xl max-w-[82%] text-xs shadow-md ${
                  msg.sender === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-none'
                    : 'bg-zinc-800 text-zinc-200 rounded-tl-none border border-zinc-750'
                }`}
              >
                {msg.sender === 'bot' ? formatBotReply(msg.text) : <p>{msg.text}</p>}
              </div>

              {msg.sender === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-zinc-850 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-zinc-400" />
                </div>
              )}
            </div>
          ))
        )}

        {/* Bot typing state */}
        {chatLoading && (
          <div className="flex items-start gap-2.5 justify-start">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
              <Brain className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="p-3 bg-zinc-800 text-zinc-400 rounded-2xl rounded-tl-none border border-zinc-750 flex items-center gap-1 text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Chat Input Form */}
      <form onSubmit={handleChatSubmit} className="p-3 bg-zinc-950 border-t border-zinc-800 flex gap-2">
        <Input
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          placeholder="Nhập câu hỏi định hướng sự nghiệp..."
          className="flex-1 bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus-visible:border-zinc-700 focus-visible:ring-0 text-xs"
          disabled={chatLoading}
        />
        <Button type="submit" size="icon" disabled={chatLoading} className="bg-indigo-600 hover:bg-indigo-500 text-white shrink-0 rounded-lg">
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
}
