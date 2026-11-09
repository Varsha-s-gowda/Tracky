import { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  Bot,
  Loader2,
  MessageSquarePlus,
  RefreshCw,
  Send,
  Sparkles,
  Trash2,
  UserRound,
} from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import EmptyState from '../ui/EmptyState';
import ErrorState from '../ui/ErrorState';
import ConfirmDialog from '../ui/ConfirmDialog';
import { Skeleton } from '../ui/Loaders';
import FormAlert from '../../components/auth/FormAlert';
import MessageContent from './MessageContent';
import { useToast } from '../../context/ToastContext';
import { aiService } from '../../services/aiService';
import { getErrorMessage } from '../../utils/errors';
import { cn } from '../../utils/cn';

function formatRelativeTime(value) {
  if (!value) return '';
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

const SUGGESTIONS = [
  'What should I focus on today?',
  'How did my week go?',
  'Which habit needs the most attention?',
  'Help me plan the next three days.',
];

function Composer({ value, onChange, onSend, sending, disabled, error }) {
  const textareaRef = useRef(null);

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      onSend();
    }
  };

  return (
    <div className="border-t border-ink-100 px-4 py-3 dark:border-white/[0.06] sm:px-5">
      {error ? <div className="mb-3"><FormAlert>{error}</FormAlert></div> : null}
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          rows={1}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled || sending}
          placeholder={
            disabled
              ? 'AI chat is unavailable until the backend provider is configured.'
              : 'Ask about your tasks, habits, streaks, or next steps…'
          }
          aria-label="Message your AI coach"
          className="focus-ring max-h-32 min-h-[46px] w-full resize-y rounded-xl border border-ink-200 bg-white px-3.5 py-3 text-sm leading-5 text-ink-900 placeholder:text-ink-400 disabled:cursor-not-allowed disabled:bg-ink-50 disabled:text-ink-400 dark:border-white/10 dark:bg-white/[0.035] dark:text-white dark:placeholder:text-ink-500 dark:disabled:bg-white/[0.02]"
        />
        <Button
          onClick={onSend}
          loading={sending}
          disabled={disabled || !value.trim()}
          size="md"
          className="shrink-0"
          leftIcon={<Send className="h-4 w-4" />}
          aria-label="Send message"
        >
          Send
        </Button>
      </div>
      <p className="mt-1.5 text-[0.6rem] text-ink-400 dark:text-ink-500">
        Enter to send · Shift + Enter for a new line. Replies use only your saved Tracky data.
      </p>
    </div>
  );
}

export default function ChatPanel({ configured }) {
  const { toast } = useToast();
  const [conversations, setConversations] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState('');
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesError, setMessagesError] = useState('');
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setListLoading(true);
      setListError('');
      try {
        const list = await aiService.listConversations();
        if (!mounted) return;
        setConversations(list);
        if (list.length) {
          setActiveId(list[0]._id);
          setMessagesLoading(true);
          const result = await aiService.getConversation(list[0]._id);
          if (!mounted) return;
          setMessages(result.messages);
          setActiveId(result.conversation._id);
        }
      } catch (requestError) {
        if (mounted) setListError(getErrorMessage(requestError, 'Your conversations could not be loaded.'));
      } finally {
        if (mounted) {
          setListLoading(false);
          setMessagesLoading(false);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const element = scrollRef.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [messages, sending]);

  const openConversation = async (id) => {
    if (id === activeId) return;
    setActiveId(id);
    setMessages([]);
    setMessagesError('');
    setSendError('');
    setMessagesLoading(true);
    try {
      const result = await aiService.getConversation(id);
      setMessages(result.messages);
      setActiveId(result.conversation._id);
    } catch (requestError) {
      setMessagesError(getErrorMessage(requestError, 'This conversation could not be loaded.'));
    } finally {
      setMessagesLoading(false);
    }
  };

  const startNewConversation = () => {
    setActiveId(null);
    setMessages([]);
    setMessagesError('');
    setSendError('');
    setInput('');
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending || !configured) return;

    const optimisticId = `optimistic-${Date.now()}`;
    const optimistic = { _id: optimisticId, role: 'user', content: text, createdAt: new Date().toISOString() };
    setInput('');
    setSendError('');
    setMessages((current) => [...current, optimistic]);
    setSending(true);

    try {
      const result = await aiService.sendMessage(activeId, text);
      setMessages((current) => [
        ...current.filter((message) => message._id !== optimisticId),
        ...result.messages,
      ]);
      setActiveId(result.conversation._id);
      setConversations((current) => {
        const without = current.filter((conversation) => conversation._id !== result.conversation._id);
        return [result.conversation, ...without];
      });
    } catch (requestError) {
      setMessages((current) => current.filter((message) => message._id !== optimisticId));
      setInput(text);
      setSendError(getErrorMessage(requestError, 'The coach could not respond. Please try again.'));
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await aiService.removeConversation(deleteTarget._id);
      setConversations((current) => current.filter((item) => item._id !== deleteTarget._id));
      if (activeId === deleteTarget._id) {
        setActiveId(null);
        setMessages([]);
      }
      setDeleteTarget(null);
      toast.success('Conversation deleted.');
    } catch (requestError) {
      toast.error(getErrorMessage(requestError, 'The conversation could not be deleted.'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="mt-5">
      {!configured ? (
        <Card className="mb-4 p-4">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-warning-50 text-warning-600 dark:bg-warning-500/10 dark:text-warning-500">
              <AlertCircle className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-ink-900 dark:text-white">AI chat is not configured</h2>
              <p className="mt-1 text-xs leading-5 text-ink-500 dark:text-ink-400">
                Add <code className="rounded bg-ink-100 px-1 py-0.5 dark:bg-white/[0.06]">GEMINI_API_KEY</code> or{' '}
                <code className="rounded bg-ink-100 px-1 py-0.5 dark:bg-white/[0.06]">OPENAI_API_KEY</code> to the backend environment to enable live coaching. Saved conversations remain visible below, but Tracky will never invent a reply.
              </p>
            </div>
          </div>
        </Card>
      ) : null}

      <Card className="overflow-hidden">
        <div className="grid lg:grid-cols-[290px_minmax(0,1fr)]">
          <aside className="border-b border-ink-100 dark:border-white/[0.06] lg:border-b-0 lg:border-r">
            <div className="flex items-center justify-between gap-2 px-4 py-3.5">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-brand-500" />
                <h2 className="text-sm font-semibold text-ink-900 dark:text-white">Conversations</h2>
              </div>
              <Button
                variant="subtle"
                size="xs"
                onClick={startNewConversation}
                leftIcon={<MessageSquarePlus className="h-3.5 w-3.5" />}
              >
                New
              </Button>
            </div>

            {listLoading ? (
              <div className="space-y-2 px-3 pb-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={index} className="h-14 w-full rounded-xl" />
                ))}
              </div>
            ) : listError ? (
              <div className="px-4 pb-4">
                <p className="text-xs text-danger-600 dark:text-danger-500">{listError}</p>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="focus-ring mt-2 inline-flex items-center gap-1 rounded-lg text-xs font-semibold text-brand-600 dark:text-brand-400"
                >
                  <RefreshCw className="h-3 w-3" /> Reload
                </button>
              </div>
            ) : conversations.length ? (
              <div className="max-h-[250px] space-y-1 overflow-y-auto px-2 pb-3 lg:max-h-[560px]">
                {conversations.map((conversation) => {
                  const active = conversation._id === activeId;
                  return (
                    <div key={conversation._id} className="group relative">
                      <button
                        type="button"
                        onClick={() => openConversation(conversation._id)}
                        className={cn(
                          'focus-ring w-full rounded-xl border p-2.5 pr-8 text-left transition',
                          active
                            ? 'border-brand-300 bg-brand-50/70 dark:border-brand-400/40 dark:bg-brand-400/[0.07]'
                            : 'border-transparent hover:border-ink-200 hover:bg-ink-50 dark:hover:border-white/10 dark:hover:bg-white/[0.03]'
                        )}
                        aria-current={active ? 'true' : undefined}
                      >
                        <p className="truncate text-xs font-semibold text-ink-800 dark:text-ink-100">
                          {conversation.title}
                        </p>
                        <p className="mt-0.5 line-clamp-2 text-[0.62rem] leading-4 text-ink-400 dark:text-ink-500">
                          {conversation.lastMessagePreview || 'No messages yet'}
                        </p>
                        <p className="mt-1 text-[0.58rem] text-ink-400 dark:text-ink-500">
                          {conversation.messageCount || 0} messages · {formatRelativeTime(conversation.lastMessageAt)}
                        </p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(conversation)}
                        className="focus-ring absolute right-1.5 top-1.5 rounded-lg p-1.5 text-ink-300 opacity-0 transition hover:bg-danger-50 hover:text-danger-600 focus:opacity-100 group-hover:opacity-100 dark:hover:bg-danger-500/10 dark:hover:text-danger-500"
                        aria-label={`Delete conversation ${conversation.title}`}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="px-4 pb-4 text-xs leading-5 text-ink-400 dark:text-ink-500">
                No saved conversations yet. Start one on the right.
              </p>
            )}
          </aside>

          <section className="flex min-h-[520px] min-w-0 flex-col">
            <div className="flex items-center justify-between gap-2 border-b border-ink-100 px-4 py-3.5 dark:border-white/[0.06] sm:px-5">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-400/10 dark:text-brand-300">
                  <Bot className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-ink-900 dark:text-white">AI Coach</p>
                  <p className="text-[0.62rem] text-ink-400 dark:text-ink-500">
                    {configured ? 'Connected to your Tracky data' : 'Rules-only mode'}
                  </p>
                </div>
              </div>
              <Badge variant={configured ? 'success' : 'outline'} dot>
                {configured ? 'Online' : 'Offline'}
              </Badge>
            </div>

            <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-5" style={{ maxHeight: '420px' }}>
              {messagesLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-16 w-3/4 rounded-2xl" />
                  <Skeleton className="ml-auto h-12 w-1/2 rounded-2xl" />
                  <Skeleton className="h-20 w-4/5 rounded-2xl" />
                </div>
              ) : messagesError ? (
                <ErrorState title="Conversation unavailable" message={messagesError} />
              ) : messages.length ? (
                messages.map((message) => {
                  const isUser = message.role === 'user';
                  return (
                    <div
                      key={message._id}
                      className={cn('flex items-start gap-2.5', isUser ? 'justify-end' : 'justify-start')}
                    >
                      {!isUser ? (
                        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white">
                          <Bot className="h-3.5 w-3.5" />
                        </span>
                      ) : null}
                      <div
                        className={cn(
                          'max-w-[85%] rounded-2xl px-3.5 py-2.5',
                          isUser
                            ? 'rounded-br-md bg-brand-600 text-white'
                            : 'rounded-bl-md border border-ink-100 bg-ink-50/70 text-ink-700 dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-ink-200'
                        )}
                      >
                        {isUser ? (
                          <p className="whitespace-pre-wrap text-sm leading-6">{message.content}</p>
                        ) : (
                          <MessageContent content={message.content} />
                        )}
                        <p className={cn('mt-1.5 text-[0.55rem]', isUser ? 'text-white/60' : 'text-ink-400 dark:text-ink-500')}>
                          {formatRelativeTime(message.createdAt)}
                        </p>
                      </div>
                      {isUser ? (
                        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink-200 text-ink-600 dark:bg-white/[0.08] dark:text-ink-300">
                          <UserRound className="h-3.5 w-3.5" />
                        </span>
                      ) : null}
                    </div>
                  );
                })
              ) : (
                <div className="py-6">
                  <EmptyState
                    icon={Bot}
                    title="A calm place to think"
                    description="Ask about your progress, what to prioritise, or how to rebuild a habit. Replies are generated from your own Tracky records."
                    action={
                      <div className="flex flex-wrap justify-center gap-2">
                        {SUGGESTIONS.map((suggestion) => (
                          <button
                            key={suggestion}
                            type="button"
                            onClick={() => setInput(suggestion)}
                            disabled={!configured}
                            className="focus-ring rounded-full border border-ink-200 bg-white px-3 py-1.5 text-[0.68rem] font-medium text-ink-600 transition hover:border-brand-300 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.03] dark:text-ink-300 dark:hover:border-brand-400/40 dark:hover:text-brand-300"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    }
                  />
                </div>
              )}

              {sending ? (
                <div className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white">
                    <Bot className="h-3.5 w-3.5" />
                  </span>
                  <div className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-ink-100 bg-ink-50/70 px-3.5 py-3 text-xs text-ink-500 dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-ink-400">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Thinking with your data…
                  </div>
                </div>
              ) : null}
            </div>

            <Composer
              value={input}
              onChange={setInput}
              onSend={handleSend}
              sending={sending}
              disabled={!configured}
              error={sendError}
            />
          </section>
        </div>
      </Card>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete this conversation?"
        description="All messages in this conversation will be permanently removed from your account."
        confirmLabel="Delete conversation"
      />
    </div>
  );
}
