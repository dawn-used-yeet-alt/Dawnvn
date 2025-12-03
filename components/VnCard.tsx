import { memo } from 'react';
import { VisualNovel } from '../types';

interface VnCardProps {
  vn: VisualNovel;
  onVnSelect: (id: string) => void;
  isBookmarked: boolean;
  toggleBookmark: (vnId: string) => void;
  relationType?: string;
}

const VnCard = ({ vn, onVnSelect, isBookmarked, toggleBookmark, relationType }: VnCardProps) => {
  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleBookmark(vn.id);
  };

  return (
    <div
      className="bg-gray-800 rounded-lg overflow-hidden shadow-lg cursor-pointer transform hover:scale-105 transition-transform duration-300 group"
      onClick={() => onVnSelect(vn.id)}
    >
      <div className="relative aspect-[3/4]">
        <img
          src={vn.image?.url || `https://picsum.photos/seed/${vn.id}/300/400`}
          alt={vn.title}
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
        <div className="absolute bottom-0 left-0 p-2 text-white z-10">
          {relationType && (
            <span className="text-xs text-indigo-300 font-medium mb-1 block capitalize">{relationType.replace(/_/g, ' ')}</span>
          )}
          <h3 className="font-bold text-sm leading-tight group-hover:text-indigo-300 transition-colors">{vn.title}</h3>
        </div>
      </div>
      <div className="p-2 bg-gray-800 text-xs text-gray-400 flex justify-between items-center">
        <span>⭐ {vn.rating ? (vn.rating / 10).toFixed(2) : 'N/A'}</span>
        <span>👥 {vn.votecount}</span>
      </div>
    </div>
  );
};

export default memo(VnCard);