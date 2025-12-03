import { memo } from 'react';
import { CharacterInList } from '../types';

interface CharacterCardProps {
  character: CharacterInList;
  role: string;
  onCharSelect: (id: string) => void;
  isBookmarked: boolean;
  toggleBookmark: () => void;
}

const CharacterCard = ({ character, role, onCharSelect, isBookmarked, toggleBookmark }: CharacterCardProps) => {
  const roleDisplay: { [key: string]: string } = {
    main: 'Protagonist',
    primary: 'Main Character',
    side: 'Side Character',
    appears: 'Appears',
  };

  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleBookmark();
  };

  return (
    <div
      className="bg-gray-800 rounded-lg overflow-hidden shadow-lg cursor-pointer transform hover:scale-105 transition-transform duration-300 group"
      onClick={() => onCharSelect(character.id)}
    >
      <div className="relative aspect-[3/4]">
        <img
          src={character.image?.url || `https://picsum.photos/seed/${character.id}/300/400`}
          alt={character.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <button
          onClick={handleBookmarkClick}
          aria-label={isBookmarked ? 'Remove from bookmarks' : 'Add to bookmarks'}
          className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 hover:bg-black/75 transition-all transform hover:scale-110 active:scale-95 z-10 text-white"
        >
          <svg
            key={isBookmarked ? 'bookmarked' : 'not-bookmarked'}
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 animate-pop-in"
            viewBox="0 0 20 20"
            fill={isBookmarked ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-3.13L5 18V4z" />
          </svg>
        </button>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
        <div className="absolute bottom-0 left-0 p-2 text-white z-10 w-full">
          <h3 className="font-bold text-sm leading-tight group-hover:text-indigo-300 transition-colors truncate" title={character.name}>
            {character.name}
          </h3>
          <p className="text-xs text-gray-300">{roleDisplay[role] || role}</p>
        </div>
      </div>
    </div>
  );
};

export default memo(CharacterCard);
