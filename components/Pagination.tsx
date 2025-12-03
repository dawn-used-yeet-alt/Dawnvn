
import { memo, useState, useEffect, useRef } from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination = ({ currentPage, totalPages, onPageChange }: PaginationProps) => {
  const [showInputFor, setShowInputFor] = useState<'start' | 'end' | null>(null);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showInputFor && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showInputFor]);

  if (totalPages <= 1) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setInputValue(value);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const page = parseInt(inputValue, 10);
      if (!isNaN(page) && page >= 1 && page <= totalPages) {
        onPageChange(page);
      }
      setShowInputFor(null);
      setInputValue('');
    } else if (e.key === 'Escape') {
      setShowInputFor(null);
      setInputValue('');
    }
  };

  const handleInputBlur = () => {
    setShowInputFor(null);
    setInputValue('');
  };

  const getPageNumbers = () => {
    const pages: Array<number | 'start-ellipsis' | 'end-ellipsis'> = [];
    const maxPagesToShow = 1;
    const half = Math.floor(maxPagesToShow / 2);

    let start = Math.max(1, currentPage - half);
    let end = Math.min(totalPages, currentPage + half);

    if (currentPage - half < 1) {
      end = Math.min(totalPages, maxPagesToShow);
    }
    if (currentPage + half > totalPages) {
      start = Math.max(1, totalPages - maxPagesToShow + 1);
    }

    if (start > 1) {
      pages.push(1);
      if (start > 2) pages.push('start-ellipsis');
    }
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    if (end < totalPages) {
      if (end < totalPages - 1) pages.push('end-ellipsis');
      pages.push(totalPages);
    }
    return pages;
  };

  const pageNumbers = getPageNumbers();

  const PrevIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <title>Previous page</title>
      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  );

  const NextIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <title>Next page</title>
      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
    </svg>
  );

  return (
    <nav className="flex items-center justify-center mt-8" aria-label="Pagination">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="relative inline-flex items-center px-2 sm:px-4 py-2 rounded-l-md border border-gray-700 bg-gray-800 text-sm font-medium text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="sm:hidden"><PrevIcon /></span>
        <span className="hidden sm:inline">Previous</span>
      </button>
      {pageNumbers.map((page) => {
        if (typeof page === 'number') {
          return (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`-ml-px relative inline-flex items-center px-2 sm:px-4 py-2 border border-gray-700 text-sm font-medium ${page === currentPage
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
            >
              {page}
            </button>
          );
        }

        const position = page === 'start-ellipsis' ? 'start' : 'end';

        if (showInputFor === position) {
          return (
            <span key={`input-${position}`} className="-ml-px relative inline-flex items-center border border-gray-700 bg-gray-700 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:z-10">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleInputKeyDown}
                onBlur={handleInputBlur}
                className="w-16 sm:w-20 text-center bg-transparent text-white py-2 px-1 text-sm focus:outline-none"
                aria-label="Go to page"
                pattern="[0-9]*"
                inputMode="numeric"
              />
            </span>
          );
        }

        return (
          <button
            key={`ellipsis-${position}`}
            onClick={() => setShowInputFor(position)}
            className="-ml-px relative inline-flex items-center px-2 sm:px-4 py-2 border border-gray-700 bg-gray-800 text-sm font-medium text-gray-400 hover:bg-gray-700"
          >
            ...
          </button>
        );
      }
      )}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="-ml-px relative inline-flex items-center px-2 sm:px-4 py-2 rounded-r-md border-t border-b border-r border-gray-700 bg-gray-800 text-sm font-medium text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="hidden sm:inline">Next</span>
        <span className="sm:hidden"><NextIcon /></span>
      </button>
    </nav>
  );
};

export default memo(Pagination);