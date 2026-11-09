import { cn } from '../../utils/cn';

export default function Card({ children, className, as: Component = 'div', ...props }) {
  return (
    <Component className={cn('surface-card', className)} {...props}>
      {children}
    </Component>
  );
}
