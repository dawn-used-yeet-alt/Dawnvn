import { useState, useEffect } from 'react';
import { getCharacterById } from '../services/vndbService';
import { Character } from '../types';
import Spinner from './Spinner';
import TagBadge from './TagBadge';

interface CharacterDetailPageProps {
  charId: string;
  onBack: () => void;
  onVnSelect: (vnId: string) => void;
  isBookmarked: boolean;
  toggleBookmark: (id: string, type: 'vn' | 'char') => void;
}

const CharacterDetailPage = ({
  charId,
  onBack,
  onVnSelect,
  isBookmarked,
  toggleBookmark,
}: CharacterDetailPageProps) => {
  const [character, setCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchChar = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getCharacterById(charId);
        setCharacter(data);
      } catch (e) {
        setError('Failed to fetch character details.');
        console.error(e);
      }
      finally {
        setLoading(false);
      }
    };
    fetchChar();
  }, [charId]);

  const renderDescription = (desc: string | null | undefined) => {
    if (!desc) return <p className="text-gray-400 italic">No description available.</p>;
    const urlRegex = /\[url=(.*?)\]([\s\S]*?)\[\/url\]/g;
    return desc.split('\n').map((paragraph, pIndex) => {
      const parts: React.ReactNode[] = [];
      let lastIndex = 0;
      let match;
      while ((match = urlRegex.exec(paragraph)) !== null) {
        if (match.index > lastIndex) {
          parts.push(paragraph.substring(lastIndex, match.index));
        }
        parts.push(
          <a href={match[1]} key={`${pIndex}-${match.index}`} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">
            {match[2]}
          </a>
        );
        lastIndex = urlRegex.lastIndex;
      }
      if (lastIndex < paragraph.length) {
        parts.push(paragraph.substring(lastIndex));
      }
      return <p key={pIndex} className="mb-2">{parts}</p>;
    });
  };

  const InfoRow = ({ label, value }: { label: string; value?: string | number | null }) => {
    if (value === null || value === undefined) return null;
    return (
      <div className="flex justify-between py-2 border-b border-gray-700">
        <dt className="font-semibold text-gray-400">{label}</dt>
        <dd className="text-gray-200">{value}</dd>
      </div>
    );
  };

  if (loading) return <div className="flex justify-center items-center h-96"><Spinner /></div>;
  if (error) return <div className="text-center text-red-400 p-4">{error}</div>;
  if (!character) return <div className="text-center text-gray-400 p-4">Character not found.</div>;

  const sortedTraits = [...(character.traits || [])].sort((a, b) => (a.name > b.name ? 1 : -1));

  return (
    <div className="animate-fade-in">
      <button onClick={onBack} className="mb-6 bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
        Back to Visual Novel
      </button>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          {character.image && (
            <img src={character.image.url} alt={character.name} className="w-full h-auto object-cover rounded-lg shadow-lg" />
          )}
          <div className="mt-4 bg-gray-800 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-2 text-white">Attributes</h3>
            <dl className="space-y-1 text-sm">
              <InfoRow label="Birthday" value={character.birthday ? `${character.birthday[0]}/${character.birthday[1]}` : null} />
              <InfoRow label="Age" value={character.age} />
              <InfoRow label="Height" value={character.height ? `${character.height} cm` : null} />
              <InfoRow label="Weight" value={character.weight ? `${character.weight} kg` : null} />
              <InfoRow label="Blood Type" value={character.blood_type?.toUpperCase()} />
              <InfoRow label="Bust-Waist-Hips" value={character.bust && character.waist && character.hips ? `${character.bust}-${character.waist}-${character.hips}` : null} />
              <InfoRow label="Cup Size" value={character.cup} />
            </dl>
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white">{character.name}</h1>
              {character.original && <h2 className="text-xl text-gray-400">{character.original}</h2>}
            </div>
            <button
              onClick={() => toggleBookmark(character.id, 'char')}
              aria-label={isBookmarked ? 'Unbookmark character' : 'Bookmark character'}
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

          {character.description && (
            <div className="prose prose-invert max-w-none bg-gray-800/50 p-6 rounded-lg break-words mt-4">
              {renderDescription(character.description)}
            </div>
          )}

          <div className="mt-8">
            <h3 className="text-2xl font-semibold mb-4 text-white">Traits</h3>
            <div className="flex flex-wrap gap-2">
              {sortedTraits.map(trait => (
                <TagBadge key={trait.id} tag={trait} />
              ))}
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-2xl font-semibold mb-4 text-white">Appears In</h3>
            <div className="space-y-2">
              {character.vns.map(vn => (
                <div key={vn.id} className="bg-gray-800 p-3 rounded-md flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-white">{vn.title}</p>
                    <p className="text-sm text-gray-400">{vn.role}</p>
                  </div>
                  <button onClick={() => onVnSelect(vn.id)} className="text-indigo-400 hover:text-indigo-300 text-sm font-semibold">
                    View &rarr;
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CharacterDetailPage;
