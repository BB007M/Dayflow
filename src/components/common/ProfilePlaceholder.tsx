import React from 'react';

interface ProfilePlaceholderProps {
  label: string;
  className?: string;
}

export const ProfilePlaceholder: React.FC<ProfilePlaceholderProps> = ({ label, className = '' }) => {
  const initials = label
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return (
    <div className={`flex items-center justify-center rounded-xl bg-slate-200 text-xs font-bold text-slate-600 ring-1 ring-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700 ${className}`} aria-label={`${label} profile`}>
      {initials || '?'}
    </div>
  );
};
