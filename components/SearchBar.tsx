
import { useState, useCallback, useRef, useEffect, memo } from 'react';
import { searchTags } from '../services/vndbService';
import { Tag, SortOption } from '../types';
import TagBadge from './TagBadge';

interface SearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedTags: Tag[];
  setSelectedTags: (tags: Tag[]) => void;
  sortOption: SortOption;
  setSortOption: (option: SortOption) => void;
  onSearch: () => void;
}

const SearchBar = ({
  searchQuery,
  setSearchQuery,
  selectedTags,
  setSelectedTags,
  sortOption,
  setSortOption,
  onSearch,
}: SearchBarProps) => {
  const [tagQuery, setTagQuery] = useState('');
  const [tagSuggestions, setTagSuggestions] = useState<Tag[]>([]);
  const [isTagInputFocused, setIsTagInputFocused] = useState(false);
  const debounceTimeout = useRef<number | null>(null);

  const fetchTagSuggestions = useCallback(async (query: string) => {
    if (query.trim()) {
      const results = await searchTags(query);
      setTagSuggestions(results);
    } else {
      setTagSuggestions([]);
    }
  }, []);

  useEffect(() => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    debounceTimeout.current = window.setTimeout(() => {
      fetchTagSuggestions(tagQuery);
    }, 300);
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [tagQuery, fetchTagSuggestions]);

  const addTag = (tag: Tag) => {
    if (!selectedTags.some(t => t.id === tag.id)) {
      setSelectedTags([...selectedTags, tag]);
    }
    setTagQuery('');
    setTagSuggestions([]);
  };

  const removeTag = (tagId: string) => {
    setSelectedTags(selectedTags.filter(t => t.id !== tagId));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === 'Enter' && !(e.target as HTMLElement).matches('button')) {
      e.preventDefault();
      onSearch();
    }
  }

  return (
    <form className="bg-gray-800 p-4 rounded-lg mb-8 shadow-md" onSubmit={(e) => { e.preventDefault(); onSearch(); }} onKeyDown={handleKeyDown}>
      <div className="flex flex-col md:flex-row gap-4 items-start">
        <div className="flex-grow w-full">
          {/* Text Search */}
          <input
            type="text"
            placeholder="Search by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-2 bg-gray-700 text-white rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="relative flex-grow w-full">
          {/* Tag Search */}
          <input
            type="text"
            placeholder="Search by tags..."
            value={tagQuery}
            onChange={(e) => setTagQuery(e.target.value)}
            onFocus={() => setIsTagInputFocused(true)}
            onBlur={() => setTimeout(() => setIsTagInputFocused(false), 200)}
            className="w-full p-2 bg-gray-700 text-white rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {isTagInputFocused && tagSuggestions.length > 0 && (
            <ul className="absolute z-10 w-full bg-gray-700 border border-gray-600 rounded-md mt-1 max-h-60 overflow-y-auto">
              {tagSuggestions.map(tag => (
                <li
                  key={tag.id}
                  onClick={() => addTag(tag)}
                  className="p-2 cursor-pointer hover:bg-gray-600"
                >
                  {tag.name}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Sort Options */}
        <select
          value={sortOption}
          onChange={(e) => setSortOption(e.target.value as SortOption)}
          className="w-full md:w-auto p-2 bg-gray-700 text-white rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="votecount">Popularity</option>
          <option value="rating">Rating</option>
          <option value="released">Release Date</option>
          <option value="id">ID</option>
        </select>

        {/* Search Button */}
        <button
          type="submit"
          className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-md transition-colors"
        >
          Search
        </button>
      </div>

      {/* Selected Tags Display */}
      {selectedTags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2 items-center">
          <span className="text-sm font-medium text-gray-400">Filtering by:</span>
          {selectedTags.map(tag => (
            <TagBadge key={tag.id} tag={tag} onRemove={removeTag} />
          ))}
        </div>
      )}
    </form>
  );
};

export default memo(SearchBar);