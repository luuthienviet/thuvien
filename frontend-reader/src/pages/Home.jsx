import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { bookAPI } from '../services/api';
import BookCard from '../components/BookCard';
import Navbar from '../components/Navbar';

export default function Home() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const searchRef = useRef(null);

  useEffect(() => {
    fetchBooks();
  }, [page, selectedCategories]);

  // Close suggestions when click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch suggestions when typing
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.length >= 2) {
        try {
          const response = await bookAPI.searchBooks(searchQuery);
          setSuggestions(response.data.data.slice(0, 5)); // Top 5 suggestions
          setShowSuggestions(true);
        } catch (error) {
          console.error('Error fetching suggestions:', error);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      setError('');
      setIsSearching(false);
      
      // Nếu có filter thể loại
      if (selectedCategories.length > 0) {
        // Lọc sách theo thể loại
        const response = await bookAPI.getBooks({ page, limit: 12 });
        const allBooks = response.data.data;
        
        // Filter client-side (nếu backend chưa hỗ trợ)
        const filteredBooks = allBooks.filter(book => 
          selectedCategories.includes(book.category)
        );
        
        setBooks(filteredBooks);
        setTotalPages(Math.ceil(filteredBooks.length / 12));
      } else {
        // Không có filter, lấy tất cả
        const response = await bookAPI.getBooks({ page, limit: 12 });
        setBooks(response.data.data);
        setTotalPages(response.data.totalPages);
      }
    } catch (error) {
      console.error('Error fetching books:', error);
      setError('Không thể tải danh sách sách. Vui lòng kiểm tra kết nối Backend.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setShowSuggestions(false);
    
    if (!searchQuery.trim()) {
      fetchBooks();
      return;
    }

    try {
      setLoading(true);
      setError('');
      setIsSearching(true);
      const response = await bookAPI.searchBooks(searchQuery);
      let results = response.data.data;
      
      // Nếu có filter thể loại, áp dụng thêm
      if (selectedCategories.length > 0) {
        results = results.filter(book => 
          selectedCategories.includes(book.category)
        );
      }
      
      setBooks(results);
      
      if (results.length === 0) {
        setError(`Không tìm thấy sách với từ khóa "${searchQuery}"`);
      }
    } catch (error) {
      console.error('Error searching books:', error);
      setError('Lỗi khi tìm kiếm. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (book) => {
    setSearchQuery(book.title);
    setShowSuggestions(false);
    handleSearchWithQuery(book.title);
  };

  const handleSearchWithQuery = async (query) => {
    try {
      setLoading(true);
      setError('');
      setIsSearching(true);
      const response = await bookAPI.searchBooks(query);
      let results = response.data.data;
      
      // Áp dụng filter thể loại nếu có
      if (selectedCategories.length > 0) {
        results = results.filter(book => 
          selectedCategories.includes(book.category)
        );
      }
      
      setBooks(results);
    } catch (error) {
      console.error('Error searching books:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setIsSearching(false);
    setError('');
    setPage(1);
    setSuggestions([]);
    setShowSuggestions(false);
    fetchBooks();
  };

  const handleCategoryChange = (category) => {
    if (category === null) {
      // Clear all categories
      setSelectedCategories([]);
    } else {
      // Toggle category
      setSelectedCategories(prev => {
        if (prev.includes(category)) {
          return prev.filter(c => c !== category);
        } else {
          return [...prev, category];
        }
      });
    }
    setPage(1); // Reset về trang 1 khi thay đổi filter
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar 
        onCategoryChange={handleCategoryChange}
        selectedCategories={selectedCategories}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Chào mừng đến với Thư Viện
          </h1>
          <p className="text-gray-600 text-lg">
            Khám phá hàng ngàn đầu sách phong phú
          </p>
          
          {/* Hiển thị filter đang áp dụng */}
          {selectedCategories.length > 0 && (
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <span className="text-sm text-gray-600">Đang lọc:</span>
              {selectedCategories.map(cat => (
                <span
                  key={cat}
                  className="inline-flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                >
                  {cat}
                  <button
                    onClick={() => handleCategoryChange(cat)}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              ))}
              <button
                onClick={() => handleCategoryChange(null)}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Xóa hết
              </button>
            </div>
          )}
        </div>

        {/* Search Bar with Autocomplete */}
        <div className="mb-8">
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="relative" ref={searchRef}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery.length >= 2 && setShowSuggestions(true)}
                placeholder="Tìm kiếm sách theo tên, tác giả, thể loại..."
                className="w-full px-4 py-3 pl-12 pr-32 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
              <Search className="absolute left-4 top-3.5 text-gray-400 w-5 h-5" />
              
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-24 top-2 p-2 text-gray-400 hover:text-gray-600"
                  title="Xóa tìm kiếm"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
              
              <button
                type="submit"
                className="absolute right-2 top-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Tìm
              </button>

              {/* Autocomplete Suggestions */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-96 overflow-y-auto">
                  <div className="p-2">
                    <p className="text-xs text-gray-500 px-3 py-2 font-medium">
                      Gợi ý tìm kiếm
                    </p>
                    {suggestions.map((book) => (
                      <button
                        key={book._id}
                        onClick={() => handleSuggestionClick(book)}
                        className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-lg flex items-center space-x-3"
                      >
                        <img
                          src={book.coverImage}
                          alt={book.title}
                          className="w-12 h-16 object-cover rounded"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/48x64?text=No+Image';
                          }}
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-800 line-clamp-1">
                            {book.title}
                          </p>
                          <p className="text-xs text-gray-500">{book.author}</p>
                          <p className="text-xs text-gray-400">{book.category}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </form>

          {isSearching && (
            <div className="max-w-2xl mx-auto mt-4 flex items-center justify-between bg-blue-50 px-4 py-3 rounded-lg">
              <p className="text-blue-800 text-sm">
                Đang tìm kiếm: <strong>"{searchQuery}"</strong>
              </p>
              <button
                onClick={handleClearSearch}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Xem tất cả sách
              </button>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="max-w-2xl mx-auto mb-8">
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg">
              <p className="font-medium">{error}</p>
              {error.includes('Backend') && (
                <p className="text-sm mt-2">
                  Hãy đảm bảo Backend đang chạy tại <code>http://localhost:5000</code>
                </p>
              )}
            </div>
          </div>
        )}

        {/* Books Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Đang tải sách...</p>
            </div>
          </div>
        ) : books.length === 0 && !error ? (
          <div className="text-center py-12">
            <div className="bg-white rounded-lg shadow-md p-12 max-w-md mx-auto">
              <svg className="w-24 h-24 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <p className="text-gray-500 text-lg font-medium">Không tìm thấy sách nào</p>
              {selectedCategories.length > 0 ? (
                <>
                  <p className="text-gray-400 text-sm mt-2">
                    Không có sách nào trong thể loại đã chọn
                  </p>
                  <button
                    onClick={() => handleCategoryChange(null)}
                    className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Xóa bộ lọc
                  </button>
                </>
              ) : (
                <p className="text-gray-400 text-sm mt-2">Thử tìm kiếm với từ khóa khác</p>
              )}
              {isSearching && (
                <button
                  onClick={handleClearSearch}
                  className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Xem tất cả sách
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Hiển thị số lượng kết quả */}
            <div className="mb-4 text-gray-600 text-sm">
              {selectedCategories.length > 0 ? (
                <p>Tìm thấy <strong>{books.length}</strong> sách trong thể loại đã chọn</p>
              ) : (
                <p>Hiển thị <strong>{books.length}</strong> sách</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {books.map((book) => (
                <BookCard key={book._id} book={book} />
              ))}
            </div>

            {/* Pagination */}
            {!isSearching && selectedCategories.length === 0 && totalPages > 1 && (
              <div className="flex justify-center items-center space-x-2 mt-8">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  ← Trước
                </button>
                
                <div className="flex items-center space-x-2">
                  {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                          page === pageNum
                            ? 'bg-blue-600 text-white'
                            : 'border border-gray-300 hover:bg-gray-100'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Sau →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}