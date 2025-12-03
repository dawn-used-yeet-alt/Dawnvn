
import { memo } from 'react';
import { Tag, TagLink, TraitLink } from '../types';

interface TagBadgeProps {
  tag: Tag | TagLink | TraitLink;
  onRemove?: (tagId: string) => void;
  className?: string;
}

const TagBadge = ({ tag, onRemove, className = '' }: TagBadgeProps) => {
  const categoryColor: { [key: string]: string } = {
    cont: 'bg-blue-900/50 text-blue-300 border-blue-500/50',
    ero: 'bg-pink-900/50 text-pink-300 border-pink-500/50',
    tech: 'bg-green-900/50 text-green-300 border-green-500/50',
  };

  const defaultColor = 'bg-gray-700 text-gray-300 border-gray-600/50';

  // Check if 'category' exists and is a key in categoryColor
  const colorClass = ('category' in tag && tag.category && tag.category in categoryColor)
    ? categoryColor[tag.category]
    : defaultColor;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClass} ${className}`}>
      {tag.name}
      {onRemove && (
        <button
          type="button"
          className="flex-shrink-0 ml-1.5 -mr-1 p-1 rounded-full inline-flex items-center justify-center text-gray-400 hover:bg-gray-600 hover:text-white focus:outline-none focus:bg-gray-600 focus:text-white"
          onClick={() => onRemove(tag.id)}
        >
          <span className="sr-only">Remove tag</span>
          <svg className="h-2 w-2" stroke="currentColor" fill="none" viewBox="0 0 8 8">
            <path strokeLinecap="round" strokeWidth="1.5" d="M1 1l6 6m0-6L1 7" />
          </svg>
        </button>
      )}
    </span>
  );
};

export default memo(TagBadge);
