import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '../ui/Input';

export default function PasswordInput({ label = 'Password', ...props }) {
  const [visible, setVisible] = useState(false);

  return (
    <Input
      label={label}
      type={visible ? 'text' : 'password'}
      autoComplete={props.autoComplete || 'current-password'}
      rightElement={
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          className="focus-ring mr-1 rounded-lg p-2 text-ink-400 transition hover:bg-ink-100 hover:text-ink-700 dark:hover:bg-white/[0.06] dark:hover:text-white"
          aria-label={visible ? 'Hide password' : 'Show password'}
          tabIndex={-1}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      }
      {...props}
    />
  );
}
