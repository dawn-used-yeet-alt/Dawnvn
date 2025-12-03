import { useState, useCallback, useEffect } from 'react';
import HomePage from './components/HomePage';
import VnDetailPage from './components/VnDetailPage';
import BookmarksPage from './components/BookmarksPage';
import CharacterDetailPage from './components/CharacterDetailPage';
import { VisualNovel, Tag, SortOption } from './types';
import { searchVns, getTagsByIds, getBookmarkedIds, addBookmark, removeBookmark } from './services/vndbService';

const resultsPerPage = 26;

type BookmarkType = 'vn' | 'char';

const App = () => {
  const [selectedVnId, setSelectedVnId] = useState<string | null>(null);
  const [selectedCharId, setSelectedCharId] = useState<string | null>(null);
  const [view, setView] = useState<'home' | 'bookmarks'>('home');
  const [bookmarkedVnIds, setBookmarkedVnIds] = useState<Set<string>>(new Set());
  const [bookmarkedCharIds, setBookmarkedCharIds] = useState<Set<string>>(new Set());
  const [bookmarksLoading, setBookmarksLoading] = useState(true);

  // State for search/filter, now driven by URL
  const [vns, setVns] = useState<VisualNovel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [sortOption, setSortOption] = useState<SortOption>('votecount');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  // State to track if the initial state has been loaded from the URL
  const [isInitialized, setIsInitialized] = useState(false);

  // Fetch bookmarks
  useEffect(() => {
    const fetchBookmarks = async () => {
      setBookmarksLoading(true);
      try {
        const [vnIds, charIds] = await Promise.all([
          getBookmarkedIds('vn'),
          getBookmarkedIds('char'),
        ]);
        setBookmarkedVnIds(new Set(vnIds));
        setBookmarkedCharIds(new Set(charIds));
      } catch (e) {
        console.error("Failed to fetch bookmarks", e);
      } finally {
        setBookmarksLoading(false);
      }
    };
    fetchBookmarks();
  }, []);

  // Effect to sync state FROM URL on initial load and on browser back/forward
  useEffect(() => {
    const handleUrlChange = async () => {
      const params = new URLSearchParams(window.location.search);
      const path = window.location.pathname;

      let vnId = params.get('vn');
      let charId = params.get('char');

      if (path.startsWith('/v')) {
        vnId = path.substring(1);
      } else if (path.startsWith('/c')) {
        charId = path.substring(1);
      }


      const viewParam = params.get('view');
      const q = params.get('q') || '';
      const tagsStr = params.get('tags');
      const sort = (params.get('sort') as SortOption) || 'votecount';
      const page = parseInt(params.get('page') || '1', 10);

      setSelectedVnId(vnId);
      setSelectedCharId(charId);
      setView(viewParam === 'bookmarks' ? 'bookmarks' : 'home');
      setSearchQuery(q);
      setSortOption(sort);
      setCurrentPage(page);

      if (tagsStr) {
        const tagIds = tagsStr.split(',').filter(Boolean);
        if (tagIds.length > 0 && tagIds.join(',') !== selectedTags.map(t => t.id).join(',')) {
          try {
            const tagsData = await getTagsByIds(tagIds);
            const tagMap = new Map(tagsData.map(t => [t.id, t]));
            const sortedTags = tagIds.map(id => tagMap.get(id)).filter((t): t is Tag => !!t);
            setSelectedTags(sortedTags);
          } catch (e) {
            console.error("Failed to fetch tags from URL", e);
            setSelectedTags([]);
          }
        } else if (tagIds.length === 0) {
          setSelectedTags([]);
        }
      } else {
        setSelectedTags([]);
      }

      if (!isInitialized) {
        setIsInitialized(true);
      }
    };

    window.addEventListener('popstate', handleUrlChange);
    handleUrlChange(); // Initial load

    return () => {
      window.removeEventListener('popstate', handleUrlChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Effect to sync state TO the URL
  useEffect(() => {
    if (!isInitialized) return;

    const params = new URLSearchParams();
    let pathname = '/';

    if (selectedCharId) {
      pathname = `/${selectedCharId}`;
    } else if (selectedVnId) {
      pathname = `/${selectedVnId}`;
    } else {
      if (view === 'bookmarks') {
        params.set('view', 'bookmarks');
      } else {
        if (searchQuery) params.set('q', searchQuery);
        if (selectedTags.length > 0) {
          params.set('tags', selectedTags.map(t => t.id).join(','));
        }
        if (sortOption !== 'votecount') params.set('sort', sortOption);
        if (currentPage > 1) params.set('page', String(currentPage));
      }
    }

    const newSearchString = params.toString();
    const newUrl = `${pathname}${newSearchString ? `?${newSearchString}` : ''}`;

    // Check if the full URL is different
    if (window.location.pathname + window.location.search !== newUrl) {
      history.pushState({}, '', newUrl);
    }
  }, [selectedVnId, selectedCharId, view, searchQuery, selectedTags, sortOption, currentPage, isInitialized]);


  const toggleBookmark = useCallback(async (id: string, type: BookmarkType) => {
    const isVn = type === 'vn';
    const currentBookmarks = isVn ? bookmarkedVnIds : bookmarkedCharIds;
    const setBookmarks = isVn ? setBookmarkedVnIds : setBookmarkedCharIds;

    const isBookmarked = currentBookmarks.has(id);
    const newBookmarkedIds = new Set(currentBookmarks);

    if (isBookmarked) {
      newBookmarkedIds.delete(id);
    } else {
      newBookmarkedIds.add(id);
    }

    setBookmarks(newBookmarkedIds);

    try {
      if (isBookmarked) {
        await removeBookmark(id, type);
      } else {
        await addBookmark(id, type);
      }
    } catch (e) {
      console.error("Failed to update bookmark", e);
      // Revert state on failure
      setBookmarks(current => {
        const revertedIds = new Set(current);
        if (isBookmarked) {
          revertedIds.add(id);
        } else {
          revertedIds.delete(id);
        }
        return revertedIds;
      });
    }
  }, [bookmarkedVnIds, bookmarkedCharIds]);

  const fetchVisualNovels = useCallback(async (pageToFetch: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await searchVns(searchQuery, selectedTags, sortOption, pageToFetch, resultsPerPage);
      setVns(data.results);
      if (data.count) {
        setTotalPages(Math.ceil(data.count / resultsPerPage));
      } else {
        setTotalPages(0);
      }
    } catch (e) {
      setError('Failed to fetch visual novels. The API might be down or your request was throttled.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedTags, sortOption]);

  useEffect(() => {
    if (isInitialized && view === 'home' && !selectedVnId && !selectedCharId) {
      fetchVisualNovels(currentPage);
    }
  }, [currentPage, view, selectedVnId, selectedCharId, fetchVisualNovels, isInitialized]);

  const handleVnSelect = useCallback((id: string) => {
    setSelectedVnId(id);
    setSelectedCharId(null);
    window.scrollTo(0, 0);
  }, []);

  const handleCharSelect = useCallback((id: string) => {
    setSelectedCharId(id);
    window.scrollTo(0, 0);
  }, []);

  const handleBackToGrid = useCallback(() => {
    setSelectedVnId(null);
    setSelectedCharId(null);
  }, []);

  const handleBackToVn = useCallback(() => {
    setSelectedCharId(null);
  }, []);

  const handleBackToHome = useCallback(() => {
    setSelectedVnId(null);
    setSelectedCharId(null);
    setView('home');
    setSearchQuery('');
    setSelectedTags([]);
    setSortOption('votecount');
    setCurrentPage(1);
  }, []);


  const handleSearch = useCallback(() => {
    if (currentPage === 1) {
      fetchVisualNovels(1);
    } else {
      setCurrentPage(1);
    }
  }, [currentPage, fetchVisualNovels]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  }, []);


  const renderContent = () => {
    if (selectedCharId) {
      return (
        <CharacterDetailPage
          charId={selectedCharId}
          onBack={handleBackToVn}
          onVnSelect={handleVnSelect}
          isBookmarked={bookmarkedCharIds.has(selectedCharId)}
          toggleBookmark={toggleBookmark}
        />
      );
    }
    if (selectedVnId) {
      return (
        <VnDetailPage
          vnId={selectedVnId}
          onBack={handleBackToGrid}
          isBookmarked={bookmarkedVnIds.has(selectedVnId)}
          toggleBookmark={toggleBookmark}
          onCharSelect={handleCharSelect}
          bookmarkedCharIds={bookmarkedCharIds}
          bookmarkedVnIds={bookmarkedVnIds}
          onVnSelect={handleVnSelect}
        />
      );
    }
    if (view === 'bookmarks') {
      return (
        <BookmarksPage
          bookmarkedVnIds={Array.from(bookmarkedVnIds)}
          bookmarkedCharIds={Array.from(bookmarkedCharIds)}
          toggleBookmark={toggleBookmark}
          onVnSelect={handleVnSelect}
          onCharSelect={handleCharSelect}
          loading={bookmarksLoading}
        />
      );
    }
    return (
      <HomePage
        vns={vns}
        loading={loading}
        error={error}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedTags={selectedTags}
        setSelectedTags={setSelectedTags}
        sortOption={sortOption}
        setSortOption={setSortOption}
        currentPage={currentPage}
        totalPages={totalPages}
        onSearch={handleSearch}
        onPageChange={handlePageChange}
        onVnSelect={handleVnSelect}
        bookmarkedVnIds={bookmarkedVnIds}
        toggleBookmark={(id) => toggleBookmark(id, 'vn')}
      />
    );
  };

  const NavButton = ({
    targetView,
    children,
  }: {
    targetView: 'home' | 'bookmarks';
    children: React.ReactNode;
  }) => {
    const isActive = view === targetView && !selectedVnId && !selectedCharId;
    return (
      <button
        onClick={() => {
          setView(targetView);
          setSelectedVnId(null);
          setSelectedCharId(null);
        }}
        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${isActive
          ? 'bg-indigo-600 text-white'
          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
          }`}
        aria-current={isActive ? 'page' : undefined}
      >
        {children}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans">
      <header className="bg-gray-800 shadow-lg sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <h1
            className="text-2xl font-bold text-white cursor-pointer hover:text-indigo-400 transition-colors"
            onClick={handleBackToHome}
            role="button"
          >
            Sister Sex
          </h1>
          <nav className="flex items-center space-x-2">
            <NavButton targetView="home">Explore</NavButton>
            <NavButton targetView="bookmarks">Bookmarks</NavButton>
          </nav>
        </div>
      </header>
      <main className="container mx-auto p-4">
        {renderContent()}
      </main>
      <footer className="text-center py-4 text-gray-500 text-sm">
        <p>Powered by the VNDB.org API</p>
      </footer>
    </div>
  );
};

export default App;
