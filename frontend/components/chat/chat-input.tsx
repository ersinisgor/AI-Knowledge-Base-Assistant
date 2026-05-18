'use client';

import { useState, useCallback } from 'react';
import { Send } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState('');

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = value.trim();
      if (!trimmed || disabled) return;
      onSend(trimmed);
      setValue('');
    },
    [value, disabled, onSend]
  );

  return (
    <div className="px-7 py-3.5 border-t border-border">
      <form onSubmit={handleSubmit}>
        <div className="bg-card border border-border rounded-[10px] px-4 py-3 flex items-center gap-2.5">
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Ask a question about your knowledge base..."
            disabled={disabled}
            className="flex-1 bg-transparent text-foreground text-base placeholder:text-muted-foreground focus:outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={disabled || !value.trim()}
            className="bg-primary w-[30px] h-[30px] rounded-[7px] flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5 text-primary-foreground" />
          </button>
        </div>
      </form>
    </div>
  );
}
