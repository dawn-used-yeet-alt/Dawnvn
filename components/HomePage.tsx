
import { memo } from 'react';
import { VisualNovel, Tag, SortOption } from '../types';
import VnCard from './VnCard';
import Spinner from './Spinner';
import Pagination from './Pagination';
import SearchBar from './SearchBar';

interface HomePageProps {
  vns: VisualNovel[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedTags: Tag[];
  setSelectedTags: (tags: Tag[]) => void;
  sortOption: SortOption;
  setSortOption: (option: SortOption) => void;
  currentPage: number;
  totalPages: number;
  onSearch: () => void;
  onPageChange: (page: number) => void;
  onVnSelect: (id: string) => void;
  bookmarkedVnIds: Set<string>;
  toggleBookmark: (vnId: string) => void;
}

const HomePage = ({
  vns,
  loading,
  error,
  searchQuery,
  setSearchQuery,
  selectedTags,
  setSelectedTags,
  sortOption,
  setSortOption,
  currentPage,
  totalPages,
  onSearch,
  onPageChange,
  onVnSelect,
  bookmarkedVnIds,
  toggleBookmark,
}: HomePageProps) => {
  return (
    <div className="animate-fade-in">
      <SearchBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedTags={selectedTags}
        setSelectedTags={setSelectedTags}
        sortOption={sortOption}
        setSortOption={setSortOption}
        onSearch={onSearch}
      />

      {loading ? (
        <div className="flex justify-center items-center h-96">
          <Spinner />
        </div>
      ) : error ? (
        <div className="text-center text-red-400 p-8 bg-red-900/20 rounded-lg">{error}</div>
      ) : vns.length > 0 ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {vns.map((vn) => (
              <VnCard
                key={vn.id}
                vn={vn}
                onVnSelect={onVnSelect}
                isBookmarked={bookmarkedVnIds.has(vn.id)}
                toggleBookmark={toggleBookmark}
              />
            ))}
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        </>
      ) : (
        <div className="text-center text-gray-400 p-8 bg-gray-800/50 rounded-lg">
          No visual novels found matching your criteria.
        </div>
      )}
    </div>
  );
};

export default memo(HomePage);