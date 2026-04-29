import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { bookAPI } from '../services/api';
import BookCard from '../components/BookCard';
import Navbar from '../components/Navbar';

export default function Categories() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [books, setBooks] = useState([]);
  const [allBooks, setAllBooks] = useState([]); // Lưu tất cả sách để filter
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [error, setError] = useState('');

  // Danh sách thể loại
  const categories = [
    'Văn học',
    'Khoa học - Kỹ thuật',
    'Xã hội - Nhân văn',
    'Giáo dục - Học tập',
    'Thiếu nhi',
    'Kinh tế',
    'Lịch sử',
    'Tâm lý',
    'Kỹ năng sống',
    'Công nghệ',
    'Nghệ thuật',
  ];

  // Fetch tất cả sách khi component mount
  useEffect(() => {
    fetchAllBooks();
  }, []);

  // Filter sách khi selectedCategory hoặc searchQuery thay đổi
  useEffect(() => {
    filterBooks();
  }, [selectedCategory, searchQuery, allBooks]);

  const fetchAllBooks = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await bookAPI.getBooks({ page: 1, limit: 100 });
      setAllBooks(response.data.data);
    } catch (error) {
      console.error('Error fetching books:', error);
      setError('Không thể tải danh sách sách. Vui lòng kiểm tra kết nối Backend.');
      setAllBooks([]);
    } finally {
      setLoading(false);
    }
  };

  const filterBooks = () => {
    let filteredBooks = [...allBooks];
    
    // Lọc theo thể loại nếu có
    if (selectedCategory) {
      filteredBooks = filteredBooks.filter(book => book.category === selectedCategory);
    }
    
    // Lọc theo từ khóa tìm kiếm nếu có
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filteredBooks = filteredBooks.filter(book =>
        book.title.toLowerCase().includes(query) ||
        book.author.toLowerCase().includes(query)
      );
    }
    
    setBooks(filteredBooks);
  };

  const handleCategoryClick = (category) => {
    if (selectedCategory === category) {
      // Bỏ chọn nếu click lại
      setSelectedCategory('');
      setSearchParams({});
    } else {
      setSelectedCategory(category);
      setSearchParams({ category });
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    // Filter sẽ tự động chạy qua useEffect
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    // Filter sẽ tự động chạy qua useEffect khi searchQuery thay đổi
  };

  const handleClearAll = () => {
    setSelectedCategory('');
    setSearchQuery('');
    setSearchParams({});
    // Filter sẽ tự động chạy qua useEffect
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-6">
          {/* SIDEBAR - Danh sách thể loại */}
          <div className="w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-md p-4 sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-800">Chọn thể loại</h2>
                {selectedCategory && (
                  <button
                    onClick={handleClearAll}
                    className="text-xs text-blue-600 hover:text-blue-700"
                  >
                    Xóa
                  </button>
                )}
              </div>
              
              <div className="space-y-1 max-h-[calc(100vh-200px)] overflow-y-auto">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => handleCategoryClick(category)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      selectedCategory === category
                        ? 'bg-blue-600 text-white font-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* MAIN CONTENT */}
          <div className="flex-1">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                {selectedCategory || 'Tất cả sách'}
              </h1>
              <p className="text-gray-600">
                {selectedCategory 
                  ? `Khám phá các đầu sách thuộc thể loại ${selectedCategory}`
                  : 'Tất cả sách trong thư viện'
                }
              </p>
            </div>

            {/* Search Bar */}
            <div className="mb-6">
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm kiếm sách theo tên, tác giả..."
                    className="w-full px-4 py-3 pl-12 pr-32 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                  <Search className="absolute left-4 top-3.5 text-gray-400 w-5 h-5" />
                  
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={handleClearSearch}
                      className="absolute right-24 top-2 p-2 text-gray-400 hover:text-gray-600"
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
                </div>
              </form>

              {/* Active Filters Display */}
              {(selectedCategory || searchQuery) && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="text-sm text-gray-600">Đang lọc:</span>
                  
                  {selectedCategory && (
                    <span className="inline-flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                      {selectedCategory}
                      <button
                        onClick={() => handleCategoryClick(selectedCategory)}
                        className="ml-2 text-blue-600 hover:text-blue-800 font-bold"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  
                  {searchQuery && (
                    <span className="inline-flex items-center bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                      "{searchQuery}"
                      <button
                        onClick={handleClearSearch}
                        className="ml-2 text-green-600 hover:text-green-800 font-bold"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  
                  <button
                    onClick={handleClearAll}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Xóa hết
                  </button>
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6">
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg">
                  <p className="font-medium">{error}</p>
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
            ) : books.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-white rounded-lg shadow-md p-12">
                  <svg className="w-24 h-24 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <p className="text-gray-500 text-lg font-medium mb-2">Không tìm thấy sách nào</p>
                  {searchQuery ? (
                    <>
                      <p className="text-gray-400 text-sm mb-4">
                        Không tìm thấy sách nào với từ khóa "{searchQuery}"
                        {selectedCategory && ` trong thể loại "${selectedCategory}"`}
                      </p>
                      <button
                        onClick={handleClearAll}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Xem tất cả sách
                      </button>
                    </>
                  ) : selectedCategory ? (
                    <>
                      <p className="text-gray-400 text-sm mb-4">
                        Không có sách nào trong thể loại "{selectedCategory}"
                      </p>
                      <button
                        onClick={() => setSelectedCategory('')}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Xem tất cả sách
                      </button>
                    </>
                  ) : (
                    <p className="text-gray-400 text-sm">Thư viện chưa có sách nào</p>
                  )}
                </div>
              </div>
            ) : (
              <>
                {/* Results Count */}
                <div className="mb-4 text-gray-600 text-sm">
                  Tìm thấy <strong>{books.length}</strong> cuốn sách
                </div>

                {/* Books Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {books.map((book) => (
                    <BookCard key={book._id} book={book} />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}