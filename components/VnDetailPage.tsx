import { useState, useEffect, useCallback, useRef } from 'react';
import { getVnById, getCharactersByVnId } from '../services/vndbService';
import { VisualNovel, CharacterInList } from '../types';
import Spinner from './Spinner';
import TagBadge from './TagBadge';
import ImageViewer from './ImageViewer';
import CharacterCard from './CharacterCard';
import VnCard from './VnCard';

interface VnDetailPageProps {
  vnId: string;
  onBack: () => void;
  isBookmarked: boolean;
  toggleBookmark: (id: string, type: 'vn' | 'char') => void;
  onCharSelect: (id: string) => void;
  bookmarkedCharIds: Set<string>;
  bookmarkedVnIds: Set<string>;
  onVnSelect: (id: string) => void;
}

const VnDetailPage = ({ vnId, onBack, isBookmarked, toggleBookmark, onCharSelect, bookmarkedCharIds, bookmarkedVnIds, onVnSelect }: VnDetailPageProps) => {
  const [vn, setVn] = useState<VisualNovel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewingImageIndex, setViewingImageIndex] = useState<number | null>(null);

  const [characters, setCharacters] = useState<CharacterInList[]>([]);
  const [charsLoading, setCharsLoading] = useState(true);

  const [isTagsExpanded, setIsTagsExpanded] = useState(false);
  const [tagsOverflow, setTagsOverflow] = useState(false);
  const [tagsFullHeight, setTagsFullHeight] = useState<number | null>(null);
  const tagsContentRef = useRef<HTMLDivElement>(null);

  const COLLAPSED_HEIGHT_REM = '5rem'; // Corresponds to Tailwind's h-20
  const COLLAPSED_HEIGHT_PX = 80;

  useEffect(() => {
    // Reset state on VN change for a clean slate
    setIsTagsExpanded(false);
    setTagsOverflow(false);
    setTagsFullHeight(null);

    // We need to measure the element's full height after it has been rendered
    // and the browser has calculated the layout of the wrapped flex items.
    // A timeout defers this measurement until after the current render cycle,
    // ensuring the calculation is accurate.
    const timer = setTimeout(() => {
      if (tagsContentRef.current) {
        const fullHeight = tagsContentRef.current.scrollHeight;
        // Add a small buffer to prevent the last line from being clipped
        // due to subpixel rendering discrepancies.
        const buffer = 5;
        setTagsFullHeight(fullHeight + buffer);

        if (fullHeight > COLLAPSED_HEIGHT_PX) {
          setTagsOverflow(true);
        } else {
          setTagsOverflow(false);
        }
      }
    }, 100); // A 100ms delay is robust for waiting on layout calcs.

    return () => clearTimeout(timer);
  }, [vn?.id]); // Re-calculate when the page content changes


  useEffect(() => {
    const fetchVnAndChars = async () => {
      setLoading(true);
      setCharsLoading(true);
      setError(null);
      setVn(null);
      setCharacters([]);

      try {
        const vnData = await getVnById(vnId);
        setVn(vnData);
      } catch (e) {
        setError('Failed to fetch visual novel details.');
        console.error(e);
      } finally {
        setLoading(false);
      }

      try {
        const charData = await getCharactersByVnId(vnId);
        setCharacters(charData);
      } catch (e) {
        console.error("Failed to fetch characters", e);
        // Non-critical error, so we don't set the main error state
      } finally {
        setCharsLoading(false);
      }
    };
    fetchVnAndChars();
  }, [vnId]);

  const handleNextImage = useCallback(() => {
    if (vn && viewingImageIndex !== null && viewingImageIndex < vn.screenshots.length - 1) {
      setViewingImageIndex(viewingImageIndex + 1);
    }
  }, [vn, viewingImageIndex]);

  const handlePrevImage = useCallback(() => {
    if (viewingImageIndex !== null && viewingImageIndex > 0) {
      setViewingImageIndex(viewingImageIndex - 1);
    }
  }, [viewingImageIndex]);


  const renderDescription = (desc: string | null | undefined) => {
    if (!desc) return <p className="text-gray-400 italic">No description available.</p>;

    // Improved parser for VNDB's BBCode-like [url] tags
    const urlRegex = /\[url=(.*?)\]([\s\S]*?)\[\/url\]/g;

    return desc.split('\n').map((paragraph, pIndex) => {
      // FIX: Use React.ReactNode which is a more appropriate type for an array of strings and JSX elements.
      const parts: React.ReactNode[] = [];
      let lastIndex = 0;
      let match;

      while ((match = urlRegex.exec(paragraph)) !== null) {
        // Push the text before the match
        if (match.index > lastIndex) {
          parts.push(paragraph.substring(lastIndex, match.index));
        }

        // Push the link as a JSX element
        const href = match[1];
        const text = match[2];
        parts.push(
          <a href={href} key={`${pIndex}-${match.index}`} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">
            {text}
          </a>
        );

        lastIndex = urlRegex.lastIndex;
      }

      // Push any remaining text after the last match
      if (lastIndex < paragraph.length) {
        parts.push(paragraph.substring(lastIndex));
      }

      return <p key={pIndex} className="mb-2">{parts}</p>;
    });
  };

  const getSpoilerLevelClass = (level: number) => {
    if (level === 1) return 'border-yellow-500/50 bg-yellow-900/30';
    if (level === 2) return 'border-red-500/50 bg-red-900/30';
    return 'border-gray-600/50 bg-gray-800/30';
  };

  const getCharacterRole = (char: CharacterInList): string => {
    const appearance = char.vns.find(v => v.id === vnId);
    return appearance ? appearance.role : 'appears';
  }

  if (loading) return <div className="flex justify-center items-center h-96"><Spinner /></div>;
  if (error) return <div className="text-center text-red-400 p-4">{error}</div>;
  if (!vn) return <div className="text-center text-gray-400 p-4">Visual novel not found.</div>;

  const sortedTags = [...(vn.tags || [])].sort((a, b) => b.rating - a.rating);

  return (
    <>
      <div className="animate-fade-in">
        <button onClick={onBack} className="mb-6 bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
          Back
        </button>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            {vn.image && (
              <img src={vn.image.url} alt={vn.title} className="w-full h-auto object-cover rounded-lg shadow-lg" />
            )}
            <div className="mt-4 bg-gray-800 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2 text-white">Details</h3>
              <div className="space-y-2 text-sm">
                <p><strong>Rating:</strong> {vn.rating ? (vn.rating / 10).toFixed(2) : 'N/A'} ({vn.votecount} votes)</p>
                <p><strong>Length:</strong> {vn.length_minutes ? `${Math.round(vn.length_minutes / 60)} hours` : 'N/A'}</p>
                <p><strong>Languages:</strong> {vn.languages.join(', ')}</p>
                <p><strong>Platforms:</strong> {vn.platforms.join(', ')}</p>
              </div>
            </div>

            {sortedTags.length > 0 && (
              <div className="mt-4 hidden md:block">
                <h3 className="text-lg font-semibold mb-3 text-white">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {sortedTags.map(tag => (
                    <TagBadge key={tag.id} tag={tag} className={getSpoilerLevelClass(tag.spoiler)} />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="md:col-span-2">
            <div className="flex items-start gap-4 mb-1">
              <h1 className="text-4xl font-bold text-white flex-grow">{vn.title}</h1>
              <button
                onClick={() => toggleBookmark(vn.id, 'vn')}
                aria-label={isBookmarked ? 'Remove from bookmarks' : 'Add to bookmarks'}
                className={`p-2 rounded-full hover:bg-gray-700 transition-all transform hover:scale-110 active:scale-95 flex-shrink-0 ${isBookmarked ? 'text-white hover:text-gray-300' : 'text-gray-400 hover:text-white'
                  }`}
              >
                <svg
                  key={isBookmarked ? 'bookmarked' : 'not-bookmarked'}
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-7 w-7 animate-pop-in"
                  viewBox="0 0 20 20"
                  fill={isBookmarked ? 'currentColor' : 'none'}
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-3.13L5 18V4z" />
                </svg>
              </button>
            </div>
            {vn.alttitle && <h2 className="text-xl text-gray-400 mb-4">{vn.alttitle}</h2>}

            <div className="prose prose-invert max-w-none bg-gray-800/50 p-6 rounded-lg break-words">
              {renderDescription(vn.description)}
            </div>

            {sortedTags.length > 0 && (
              <div className="mt-8 md:hidden">
                <h3 className="text-2xl font-semibold mb-4 text-white">Tags</h3>
                <div className="relative">
                  <div
                    style={{ maxHeight: isTagsExpanded && tagsFullHeight ? `${tagsFullHeight}px` : COLLAPSED_HEIGHT_REM }}
                    className="transition-all duration-500 ease-in-out overflow-hidden"
                  >
                    <div ref={tagsContentRef} className="flex flex-wrap gap-2 pt-px pb-1">
                      {sortedTags.map(tag => (
                        <TagBadge key={tag.id} tag={tag} className={getSpoilerLevelClass(tag.spoiler)} />
                      ))}
                    </div>
                  </div>
                  {tagsOverflow && (
                    <div className="absolute -bottom-4 left-0 right-0 flex justify-center pt-6 bg-gradient-to-t from-gray-900 to-transparent">
                      <button
                        onClick={() => setIsTagsExpanded(!isTagsExpanded)}
                        className="text-indigo-400 hover:text-indigo-300 text-sm font-semibold"
                      >
                        {isTagsExpanded ? 'Show Less' : 'Show More'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="mt-8">
              <h3 className="text-2xl font-semibold mb-4 text-white">Characters</h3>
              {charsLoading ? (
                <div className="flex justify-center py-8"><Spinner /></div>
              ) : characters.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {characters.map(char => (
                    <CharacterCard
                      key={char.id}
                      character={char}
                      role={getCharacterRole(char)}
                      onCharSelect={onCharSelect}
                      isBookmarked={bookmarkedCharIds.has(char.id)}
                      toggleBookmark={() => toggleBookmark(char.id, 'char')}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-gray-400">No character information available.</p>
              )}
            </div>

            {vn.screenshots && vn.screenshots.length > 0 && (
              <div className="mt-8">
                <h3 className="text-2xl font-semibold mb-4 text-white">Screenshots</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {vn.screenshots.map((ss, index) => (
                    <img
                      key={ss.url}
                      src={ss.thumbnail}
                      alt={`Screenshot ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => setViewingImageIndex(index)}
                      loading="lazy"
                    />
                  ))}
                </div>
              </div>
            )}

            {vn.relations && vn.relations.length > 0 && (
              <div className="mt-8">
                <h3 className="text-2xl font-semibold mb-4 text-white">Related Novels</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {vn.relations.map(relation => (
                    <VnCard
                      key={relation.id}
                      vn={relation}
                      onVnSelect={() => onVnSelect(relation.id)}
                      isBookmarked={bookmarkedVnIds.has(relation.id)}
                      toggleBookmark={() => toggleBookmark(relation.id, 'vn')}
                      relationType={relation.relation}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {viewingImageIndex !== null && (
        <ImageViewer
          screenshots={vn.screenshots}
          currentIndex={viewingImageIndex}
          onClose={() => setViewingImageIndex(null)}
          onNext={handleNextImage}
          onPrev={handlePrevImage}
        />
      )}
    </>
  );
};


export default VnDetailPage;
