
import { useState, useEffect, memo } from 'react';
import { getVnsByIds, getCharactersByIds } from '../services/vndbService';
import { VisualNovel, Character } from '../types';
import Spinner from './Spinner';
import VnCard from './VnCard';
import CharacterCard from './CharacterCard';

type BookmarkType = 'vn' | 'char';

interface BookmarksPageProps {
  bookmarkedVnIds: string[];
  bookmarkedCharIds: string[];
  toggleBookmark: (id: string, type: BookmarkType) => void;
  onVnSelect: (id: string) => void;
  onCharSelect: (id: string) => void;
  loading: boolean;
}

const BookmarksPage = ({
  bookmarkedVnIds,
  bookmarkedCharIds,
  toggleBookmark,
  onVnSelect,
  onCharSelect,
  loading: bookmarksLoading,
}: BookmarksPageProps) => {
  const [activeTab, setActiveTab] = useState<BookmarkType>('vn');
  const [vns, setVns] = useState<VisualNovel[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (bookmarksLoading) {
      return; // Wait for the initial list of IDs to load
    }

    const fetchBookmarkedItems = async () => {
      setLoading(true);
      setError(null);
      try {
        if (activeTab === 'vn') {
          if (bookmarkedVnIds.length === 0) {
            setVns([]);
            setLoading(false);
            return;
          }
          const results = await getVnsByIds(bookmarkedVnIds);
          const vnMap = new Map(results.map(vn => [vn.id, vn]));
          const sortedVns = bookmarkedVnIds.map(id => vnMap.get(id)).filter(Boolean) as VisualNovel[];
          setVns(sortedVns);
        } else {

          if (bookmarkedCharIds.length === 0) {
            setCharacters([]);
            setLoading(false);
            return;
          }
          const results = await getCharactersByIds(bookmarkedCharIds);
          const charMap = new Map(results.map(char => [char.id, char]));
          const sortedChars = bookmarkedCharIds.map(id => charMap.get(id)).filter(Boolean) as Character[];
          setCharacters(sortedChars);
        }
      } catch (e) {
        console.error(`Failed to fetch bookmarked ${activeTab}s`, e);
        setError(`Could not load your bookmarked ${activeTab === 'vn' ? 'visual novels' : 'characters'}.`);
      } finally {
        setLoading(false);
      }
    };

    fetchBookmarkedItems();
  }, [activeTab, bookmarkedVnIds, bookmarkedCharIds, bookmarksLoading]);

  const handleToggleBookmark = (id: string, type: BookmarkType) => {
    toggleBookmark(id, type);
    if (type === 'vn') {
      setVns(vns.filter(vn => vn.id !== id));
    } else {
      setCharacters(characters.filter(char => char.id !== id));
    }
  };

  const renderContent = () => {
    if (loading || bookmarksLoading) {
      return (
        <div className="flex justify-center items-center h-96">
          <Spinner />
        </div>
      );
    }

    if (error) {
      return <div className="text-center text-red-400 p-8 bg-red-900/20 rounded-lg">{error}</div>;
    }

    if (activeTab === 'vn') {
      if (vns.length === 0) {
        return (
          <div className="text-center text-gray-400 p-8 bg-gray-800/50 rounded-lg animate-fade-in">
            <h2 className="text-2xl font-semibold mb-2">No Bookmarked Visual Novels</h2>
            <p>Click the bookmark icon on any visual novel to save it here.</p>
          </div>
        );
      }

      return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {vns.map((vn) => (
            <VnCard
              key={vn.id}
              vn={vn}
              onVnSelect={onVnSelect}
              isBookmarked={true}
              toggleBookmark={(id) => handleToggleBookmark(id, 'vn')}
            />
          ))}
        </div>
      );
    }

    if (activeTab === 'char') {
      if (characters.length === 0) {
        return (
          <div className="text-center text-gray-400 p-8 bg-gray-800/50 rounded-lg animate-fade-in">
            <h2 className="text-2xl font-semibold mb-2">No Bookmarked Characters</h2>
            <p>Click the bookmark icon on any character to save them here.</p>
          </div>
        );
      }

      return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {characters.map((char) => (
            <CharacterCard
              key={char.id}
              character={char}
              role="main"
              onCharSelect={onCharSelect}
              isBookmarked={true}
              toggleBookmark={() => handleToggleBookmark(char.id, 'char')}
            />
          ))}
        </div>
      );
    }
    return null;
  }

  return (
    <div className="animate-fade-in">
      <h2 className="text-3xl font-bold mb-6 text-white">Your Bookmarks</h2>
      <div className="flex space-x-2 border-b border-gray-700 mb-6">
        <button
          onClick={() => setActiveTab('vn')}
          className={`py-2 px-4 text-lg font-semibold transition-colors ${activeTab === 'vn' ? 'text-white border-b-2 border-indigo-500' : 'text-gray-400 hover:text-white'}`}
        >
          Visual Novels ({bookmarkedVnIds.length})
        </button>
        <button
          onClick={() => setActiveTab('char')}
          className={`py-2 px-4 text-lg font-semibold transition-colors ${activeTab === 'char' ? 'text-white border-b-2 border-indigo-500' : 'text-gray-400 hover:text-white'}`}
        >
          Characters ({bookmarkedCharIds.length})
        </button>
      </div>
      {renderContent()}
    </div>
  );
};

export default memo(BookmarksPage);