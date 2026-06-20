import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { X, Send, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { queryChatbot } from '@/lib/api';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

interface Message {
  from: 'user' | 'bot';
  text: string;
}

interface ChatbotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginClick: () => void;
}

const GREETING: Message = {
  from: 'bot',
  text: 'Xin chào! Mình là trợ lý nghề nghiệp KBRIDGE. Hỏi mình bất cứ điều gì về việc làm IT tiếng Hàn, TOPIK, hay hồ sơ BrSE nhé 화이팅!',
};

export function ChatbotDrawer({ isOpen, onClose, onLoginClick }: ChatbotDrawerProps) {
  const { token, userId } = useAuth();
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setMessages((m) => [...m, { from: 'user', text }]);
    setInput('');
    setLoading(true);
    try {
      const res = await queryChatbot(userId ?? 'guest', text, token ?? undefined);
      setMessages((m) => [...m, { from: 'bot', text: res.reply }]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Có lỗi xảy ra';
      setMessages((m) => [
        ...m,
        { from: 'bot', text: token ? msg : 'Bạn cần đăng nhập để dùng trợ lý AI. Đăng nhập rồi quay lại nhé!' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
      className="flex h-[72vh] max-h-[560px] w-[min(92vw,380px)] flex-col overflow-hidden rounded-xl border border-border bg-popover shadow-2xl"
    >
      <div className="flex items-center justify-between border-b border-border bg-primary px-4 py-3 text-primary-foreground">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          <span className="font-display text-sm font-bold">Trợ lý nghề nghiệp AI</span>
        </div>
        <button type="button" onClick={onClose} aria-label="Đóng" className="rounded p-1 hover:bg-white/15">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((m, i) => (
          <div key={i} className={cn('flex', m.from === 'user' ? 'justify-end' : 'justify-start')}>
            <div
              className={cn(
                'max-w-[85%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm leading-relaxed',
                m.from === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground',
              )}
            >
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Spinner className="h-4 w-4" /> Đang soạn câu trả lời…
          </div>
        )}
        {!token && (
          <button onClick={onLoginClick} className="text-xs font-medium text-primary underline-offset-2 hover:underline">
            Đăng nhập để cá nhân hoá tư vấn theo hồ sơ của bạn →
          </button>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="flex items-center gap-2 border-t border-border p-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Nhập câu hỏi…"
          className="h-10 flex-1 rounded-md border border-input bg-card px-3 text-sm focus-visible:border-ring focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground disabled:opacity-50"
          aria-label="Gửi"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </motion.div>
  );
}
