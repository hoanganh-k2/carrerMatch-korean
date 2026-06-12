import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Brain, X, User, Send, LogIn } from 'lucide-react';
import { queryChatbot } from '@/lib/api';
import { useAuth } from '@/context/auth-context';

interface ChatbotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginClick?: () => void;
}

export function ChatbotDrawer({ isOpen, onClose, onLoginClick }: ChatbotDrawerProps) {
  const { token, role, userId, displayName } = useAuth();
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'bot'; text: string }>>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const isCandidate = Boolean(token && role === 'candidate' && userId);

  // Lời chào đầu khi mở chat
  useEffect(() => {
    if (isCandidate && chatMessages.length === 0) {
      setChatMessages([
        {
          sender: 'bot',
          text: `안녕하세요, ${displayName || 'bạn'}! Tôi là AI Career Advisor của KBRIDGE.\nTôi đọc trực tiếp hồ sơ của bạn và dữ liệu việc làm trong hệ thống để tư vấn. Bạn có thể hỏi: "Hồ sơ của tôi còn thiếu gì để ứng tuyển BrSE?" hoặc "Gợi ý việc phù hợp với tôi". 화이팅!`,
        },
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCandidate]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, chatLoading]);

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !userId) return;

    const userMsg = chatInput;
    setChatMessages((prev) => [...prev, { sender: 'user', text: userMsg }]);
    setChatInput('');
    setChatLoading(true);

    try {
      const data = await queryChatbot(userId, userMsg, token || undefined);
      setChatMessages((prev) => [...prev, { sender: 'bot', text: data.reply }]);
    } catch (err) {
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

  // Render text bot trả về (hỗ trợ **bold** và bullet đơn giản)
  const formatBotReply = (text: string) => {
    return text.split('\n').map((line, index) => {
      let content: React.ReactNode = line;
      if (line.includes('**')) {
        const parts = line.split('**');
        content = parts.map((part, i) =>
          i % 2 === 1 ? (
            <strong key={i} className="font-semibold text-primary">
              {part}
            </strong>
          ) : (
            part
          ),
        );
      }

      if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
        const cleanLine = line.replace(/^[\s*-]+/, '');
        return (
          <li key={index} className="ml-4 list-disc my-1 text-sm text-foreground/80">
            {cleanLine}
          </li>
        );
      }

      return (
        <p key={index} className="my-1.5 text-sm leading-relaxed text-foreground/80 min-h-[0.5rem]">
          {content}
        </p>
      );
    });
  };

  if (!isOpen) return null;

  return (
    <div className="w-[380px] sm:w-[400px] h-[550px] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-300">
      {/* Header */}
      <div className="bg-foreground px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Brain className="w-4.5 h-4.5 text-primary-foreground" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-background">Cố vấn sự nghiệp KBRIDGE</h4>
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
          className="w-8 h-8 rounded-full text-background/70 hover:text-background hover:bg-background/10"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {!isCandidate ? (
        /* Yêu cầu đăng nhập với role candidate */
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-4 bg-background">
          <Brain className="w-12 h-12 text-muted-foreground/40" />
          <p className="text-muted-foreground text-xs leading-relaxed">
            Cố vấn AI tư vấn dựa trên <strong className="text-foreground">hồ sơ ứng viên thật</strong> của
            bạn trong hệ thống. Hãy đăng nhập bằng tài khoản ứng viên để bắt đầu.
          </p>
          {onLoginClick && (
            <Button
              onClick={onLoginClick}
              className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-xs font-bold flex items-center gap-1.5"
            >
              <LogIn className="w-3.5 h-3.5" />
              Đăng nhập ngay
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-background">
            {chatMessages.map((msg, index) => (
              <div
                key={index}
                className={`flex items-start gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'bot' && (
                  <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center shrink-0">
                    <Brain className="w-4 h-4 text-primary" />
                  </div>
                )}

                <div
                  className={`p-3 rounded-2xl max-w-[82%] text-xs shadow-sm ${
                    msg.sender === 'user'
                      ? 'bg-primary text-primary-foreground rounded-tr-none'
                      : 'bg-card text-foreground rounded-tl-none border border-border'
                  }`}
                >
                  {msg.sender === 'bot' ? formatBotReply(msg.text) : <p>{msg.text}</p>}
                </div>

                {msg.sender === 'user' && (
                  <div className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}

            {chatLoading && (
              <div className="flex items-start gap-2.5 justify-start">
                <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center shrink-0">
                  <Brain className="w-4 h-4 text-primary" />
                </div>
                <div className="p-3 bg-card text-muted-foreground rounded-2xl rounded-tl-none border border-border flex items-center gap-1 text-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleChatSubmit} className="p-3 bg-card border-t border-border flex gap-2">
            <Input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Nhập câu hỏi định hướng sự nghiệp..."
              className="flex-1 bg-background border-border text-foreground placeholder:text-muted-foreground text-xs"
              disabled={chatLoading}
            />
            <Button
              type="submit"
              size="icon"
              disabled={chatLoading}
              className="bg-primary hover:bg-primary/90 text-primary-foreground shrink-0 rounded-lg"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </>
      )}
    </div>
  );
}
