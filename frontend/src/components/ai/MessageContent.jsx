import { Fragment } from 'react';

function renderInline(text) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={index} className="font-semibold text-ink-900 dark:text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <Fragment key={index}>{part}</Fragment>;
  });
}

export default function MessageContent({ content, className = '' }) {
  const lines = String(content || '').split('\n');
  return (
    <div className={`space-y-1.5 text-sm leading-6 ${className}`}>
      {lines.map((line, index) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={index} className="h-1" aria-hidden="true" />;
        const bullet = /^[-*•]\s+/.test(trimmed);
        if (bullet) {
          return (
            <p key={index} className="flex gap-2">
              <span className="mt-[0.55rem] h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
              <span>{renderInline(trimmed.replace(/^[-*•]\s+/, ''))}</span>
            </p>
          );
        }
        return <p key={index}>{renderInline(line)}</p>;
      })}
    </div>
  );
}
