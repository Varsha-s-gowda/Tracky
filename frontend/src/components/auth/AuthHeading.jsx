export default function AuthHeading({ eyebrow, title, description }) {
  return (
    <div className="mb-7">
      {eyebrow ? (
        <p className="mb-2 text-[0.66rem] font-bold uppercase tracking-[0.16em] text-brand-600 dark:text-brand-400">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="font-display text-[1.85rem] font-extrabold tracking-[-0.04em] text-ink-900 dark:text-white">
        {title}
      </h1>
      {description ? (
        <p className="mt-2 text-sm leading-6 text-ink-500 dark:text-ink-400">{description}</p>
      ) : null}
    </div>
  );
}
