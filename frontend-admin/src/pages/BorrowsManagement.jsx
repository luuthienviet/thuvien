import { useState, useEffect, useRef } from 'react';
import { Check, X, AlertCircle, Plus, Search } from 'lucide-react';
import { borrowAPI, bookAPI } from '../services/api';
import api from '../services/api';

export default function BorrowsManagement() {
  const [borrows, setBorrows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [showDaysModal, setShowDaysModal] = useState(false);
  const [selectedBorrowId, setSelectedBorrowId] = useState(null);
  const [borrowDays, setBorrowDays] = useState(7);

  // States cho mượn sách trực tiếp
  const [showDirectBorrowModal, setShowDirectBorrowModal] = useState(false);
  const [bookSearchTerm, setBookSearchTerm] = useState('');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [bookSuggestions, setBookSuggestions] = useState([]);
  const [userSuggestions, setUserSuggestions] = useState([]);
  const [showBookSuggestions, setShowBookSuggestions] = useState(false);
  const [showUserSuggestions, setShowUserSuggestions] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [directBorrowDays, setDirectBorrowDays] = useState(7);
  const [searchingBooks, setSearchingBooks] = useState(false);
  const [searchingUsers, setSearchingUsers] = useState(false);
  
  const bookInputRef = useRef(null);
  const userInputRef = useRef(null);
  const bookSuggestionsRef = useRef(null);
  const userSuggestionsRef = useRef(null);

  useEffect(() => {
    fetchBorrows();
  }, [activeTab]);

  // Đóng suggestions khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (bookSuggestionsRef.current && !bookSuggestionsRef.current.contains(event.target) &&
          !bookInputRef.current?.contains(event.target)) {
        setShowBookSuggestions(false);
      }
      if (userSuggestionsRef.current && !userSuggestionsRef.current.contains(event.target) &&
          !userInputRef.current?.contains(event.target)) {
        setShowUserSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounce search cho sách
  useEffect(() => {
    const timer = setTimeout(() => {
      if (bookSearchTerm.trim().length >= 2) {
        handleSearchBooksAutocomplete();
      } else {
        setBookSuggestions([]);
        setShowBookSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [bookSearchTerm]);

  // Debounce search cho người dùng
  useEffect(() => {
    const timer = setTimeout(() => {
      if (userSearchTerm.trim().length >= 2) {
        handleSearchUsersAutocomplete();
      } else {
        setUserSuggestions([]);
        setShowUserSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [userSearchTerm]);

  const fetchBorrows = async () => {
    try {
      setLoading(true);
      const response = await borrowAPI.getBorrows({ 
        status: activeTab === 'all' ? undefined : activeTab 
      });
      
      const validBorrows = response.data.data.filter(borrow => {
        return borrow.userId && borrow.bookId;
      });
      
      setBorrows(validBorrows);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenApproveModal = (id) => {
    setSelectedBorrowId(id);
    setBorrowDays(7);
    setShowDaysModal(true);
  };

  const handleApprove = async () => {
    try {
      await borrowAPI.approveBorrow(selectedBorrowId, { borrowDays });
      setShowDaysModal(false);
      fetchBorrows();
      alert('Duyệt mượn sách thành công!');
    } catch (error) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleReturn = async (id) => {
    if (!confirm('Xác nhận sách đã được trả?')) return;
    try {
      await borrowAPI.returnBorrow(id);
      fetchBorrows();
      alert('Trả sách thành công!');
    } catch (error) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  // Hàm tạo mã sách (giống BooksManagement)
  const generateBookCode = (book) => {
    const categoryCodeMap = {
      'Văn học': 'VH',
      'Khoa học - Kỹ thuật': 'KHKT',
      'Xã hội - Nhân văn': 'XHNV',
      'Giáo dục - Học tập': 'GDHT',
      'Giáo dục - Tham khảo': 'GDTK',
      'Thiếu nhi': 'TN',
      'Kinh tế': 'KT',
      'Lịch sử': 'LS',
      'Tâm lý': 'TL',
      'Kỹ năng sống': 'KNS',
      'Công nghệ': 'CN',
      'Công nghệ thông tin': 'CNTT',
      'Nghệ thuật': 'NT'
    };

    const getInitials = (str) => {
      if (!str) return '';
      const stopWords = ['và', 'của', 'các', 'cho', 'với', 'từ', 'trong', 'về', 'là', 'cơ', 'bản'];
      return str
        .split(/[\s\-–—]+/)
        .filter(word => word.length > 0 && !stopWords.includes(word.toLowerCase()))
        .map(word => word.charAt(0).toUpperCase())
        .join('');
    };

    const catCode = categoryCodeMap[book.category] || book.category?.substring(0, 2).toUpperCase() || 'XX';
    const year = book.publishYear || 'YYYY';
    const titleInitials = getInitials(book.title);
    return `${catCode}-${year}-${titleInitials}`;
  };

  // Tìm kiếm sách với autocomplete
  const handleSearchBooksAutocomplete = async () => {
    if (!bookSearchTerm.trim()) {
      setBookSuggestions([]);
      return;
    }

    try {
      setSearchingBooks(true);
      const response = await bookAPI.getBooks({ limit: 1000 });
      const allBooks = response.data.data;
      
      const filtered = allBooks.filter(book => {
        const code = generateBookCode(book).toLowerCase();
        const title = book.title.toLowerCase();
        const author = book.author?.toLowerCase() || '';
        const search = bookSearchTerm.toLowerCase();
        
        return code.includes(search) || 
               title.includes(search) || 
               author.includes(search);
      }).filter(book => book.available > 0) // Chỉ hiển thị sách còn
        .slice(0, 5); // Giới hạn 5 suggestions

      setBookSuggestions(filtered);
      setShowBookSuggestions(filtered.length > 0);
    } catch (error) {
      console.error('Error searching books:', error);
    } finally {
      setSearchingBooks(false);
    }
  };

  // Tìm kiếm người dùng với autocomplete
  const handleSearchUsersAutocomplete = async () => {
    if (!userSearchTerm.trim()) {
      setUserSuggestions([]);
      return;
    }

    try {
      setSearchingUsers(true);
      const response = await api.get('/users');
      const allUsers = response.data.data;
      
      const filtered = allUsers.filter(user => {
        if (user.role !== 'reader' || user.status !== 'active') return false;
        
        const search = userSearchTerm.toLowerCase();
        const fullName = user.fullName?.toLowerCase() || '';
        const email = user.email?.toLowerCase() || '';
        
        return fullName.includes(search) || email.includes(search);
      }).slice(0, 5); // Giới hạn 5 suggestions

      setUserSuggestions(filtered);
      setShowUserSuggestions(filtered.length > 0);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setSearchingUsers(false);
    }
  };

  // Chọn sách từ suggestions
  const handleSelectBook = (book) => {
    setSelectedBook(book);
    setBookSearchTerm(generateBookCode(book));
    setShowBookSuggestions(false);
  };

  // Chọn user từ suggestions
  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setUserSearchTerm(user.email);
    setShowUserSuggestions(false);
  };

  // Xử lý mượn sách trực tiếp
  const handleDirectBorrow = async () => {
    if (!selectedBook || !selectedUser) {
      alert('Vui lòng chọn sách và người mượn!');
      return;
    }

    if (selectedBook.available <= 0) {
      alert('Sách này hiện không còn để cho mượn!');
      return;
    }

    try {
      await borrowAPI.createDirectBorrow({
        userId: selectedUser._id,
        bookId: selectedBook._id,
        borrowDays: directBorrowDays
      });

      alert('Mượn sách trực tiếp thành công!');
      handleCloseDirectBorrowModal();
      fetchBorrows();
    } catch (error) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleCloseDirectBorrowModal = () => {
    setShowDirectBorrowModal(false);
    setBookSearchTerm('');
    setUserSearchTerm('');
    setBookSuggestions([]);
    setUserSuggestions([]);
    setShowBookSuggestions(false);
    setShowUserSuggestions(false);
    setSelectedBook(null);
    setSelectedUser(null);
    setDirectBorrowDays(7);
  };

  const tabs = [
    { key: 'pending', label: 'Chờ duyệt', color: 'yellow' },
    { key: 'approved', label: 'Đang mượn', color: 'green' },
    { key: 'overdue', label: 'Quá hạn', color: 'red' },
    { key: 'returned', label: 'Đã trả', color: 'gray' },
  ];

  const formatDate = (date) => new Date(date).toLocaleDateString('vi-VN');

  const previewDueDate = () => {
    const today = new Date();
    today.setDate(today.getDate() + borrowDays);
    return today.toLocaleDateString('vi-VN');
  };

  const previewDirectBorrowDueDate = () => {
    const today = new Date();
    today.setDate(today.getDate() + directBorrowDays);
    return today.toLocaleDateString('vi-VN');
  };

  const renderUserInfo = (borrow) => {
    if (!borrow.userId) {
      return (
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500" />
          <div>
            <div className="text-sm font-medium text-red-600">[Người dùng đã bị xóa]</div>
            <div className="text-xs text-gray-400">Không có thông tin</div>
          </div>
        </div>
      );
    }
    return (
      <div>
        <div className="text-sm font-medium text-gray-900">
          {borrow.userId.fullName}
        </div>
        <div className="text-sm text-gray-500">
          {borrow.userId.email}
        </div>
      </div>
    );
  };

  const renderBookInfo = (borrow) => {
    if (!borrow.bookId) {
      return (
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500" />
          <div>
            <div className="text-sm font-medium text-red-600">[Sách đã bị xóa]</div>
            <div className="text-xs text-gray-400">Không có thông tin</div>
          </div>
        </div>
      );
    }
    return (
      <div>
        <div className="text-sm font-medium text-gray-900">
          {borrow.bookId.title}
        </div>
        <div className="text-sm text-gray-500">
          {borrow.bookId.author}
        </div>
      </div>
    );
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Quản lý mượn/trả</h1>
        <button
          onClick={() => setShowDirectBorrowModal(true)}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          <Plus className="w-5 h-5 mr-2" />
          Mượn sách trực tiếp
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="flex border-b">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-6 py-4 font-medium transition-colors ${
                activeTab === tab.key
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : borrows.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            Không có dữ liệu
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Người mượn</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sách</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày mượn</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hạn trả</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Thao tác</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {borrows.map((borrow) => (
                  <tr key={borrow._id} className={!borrow.userId || !borrow.bookId ? 'bg-red-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {renderUserInfo(borrow)}
                    </td>
                    <td className="px-6 py-4">
                      {renderBookInfo(borrow)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatDate(borrow.borrowDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {borrow.status === 'pending' ? (
                        <span className="text-gray-400 italic">Chưa định</span>
                      ) : (
                        formatDate(borrow.dueDate)
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        borrow.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        borrow.status === 'approved' ? 'bg-green-100 text-green-800' :
                        borrow.status === 'overdue' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {borrow.status === 'pending' ? 'Chờ duyệt' :
                         borrow.status === 'approved' ? 'Đang mượn' :
                         borrow.status === 'overdue' ? 'Quá hạn' : 'Đã trả'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {borrow.status === 'pending' && borrow.userId && borrow.bookId && (
                        <button
                          onClick={() => handleOpenApproveModal(borrow._id)}
                          className="text-green-600 hover:text-green-900 mr-4"
                        >
                          <Check className="w-5 h-5" />
                        </button>
                      )}
                      {(borrow.status === 'approved' || borrow.status === 'extended' || borrow.status === 'overdue') && 
                       borrow.userId && borrow.bookId && (
                        <button
                          onClick={() => handleReturn(borrow._id)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Xác nhận trả
                        </button>
                      )}
                      {(!borrow.userId || !borrow.bookId) && (
                        <span className="text-xs text-red-500">Không thể xử lý</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal nhập số ngày mượn (cho duyệt online) */}
      {showDaysModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center border-b px-6 py-4">
              <h2 className="text-lg font-bold text-gray-800">Nhập thời gian mượn</h2>
              <button
                onClick={() => setShowDaysModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số ngày cho mượn
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setBorrowDays(prev => Math.max(1, prev - 1))}
                    className="w-9 h-9 rounded-lg border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 text-lg font-bold"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={borrowDays}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (!isNaN(val) && val >= 1 && val <= 365) setBorrowDays(val);
                      else if (e.target.value === '') setBorrowDays(1);
                    }}
                    className="w-20 text-center text-xl font-semibold border rounded-lg py-1.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setBorrowDays(prev => Math.min(365, prev + 1))}
                    className="w-9 h-9 rounded-lg border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 text-lg font-bold"
                  >
                    +
                  </button>
                  <span className="text-sm text-gray-500 ml-1">ngày</span>
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-2">Chọn nhanh</label>
                <div className="flex gap-2 flex-wrap">
                  {[3, 7, 14, 30, 60].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setBorrowDays(d)}
                      className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                        borrowDays === d
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-gray-300 text-gray-600 hover:border-blue-400'
                      }`}
                    >
                      {d} ngày
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg px-4 py-3 flex justify-between items-center">
                <span className="text-sm text-blue-700">Hạn trả dự kiến:</span>
                <span className="text-sm font-semibold text-blue-800">{previewDueDate()}</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t px-6 py-4">
              <button
                onClick={() => setShowDaysModal(false)}
                className="px-5 py-2 border rounded-lg text-gray-600 hover:bg-gray-100"
              >
                Hủy
              </button>
              <button
                onClick={handleApprove}
                className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Duyệt mượn
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal mượn sách trực tiếp */}
      {showDirectBorrowModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center border-b px-6 py-4">
              <h2 className="text-2xl font-bold text-gray-800">Mượn sách trực tiếp</h2>
              <button
                onClick={handleCloseDirectBorrowModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Tìm sách */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      🔍 Tìm sách (theo mã sách hoặc tên)
                    </label>
                    <div className="relative">
                      <div className="relative">
                        <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                        <input
                          ref={bookInputRef}
                          type="text"
                          value={bookSearchTerm}
                          onChange={(e) => setBookSearchTerm(e.target.value)}
                          onFocus={() => bookSuggestions.length > 0 && setShowBookSuggestions(true)}
                          placeholder="VD: TN-2022-CVEDHM hoặc Cà voi"
                          className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      
                      {/* Book Suggestions Dropdown */}
                      {showBookSuggestions && bookSuggestions.length > 0 && (
                        <div 
                          ref={bookSuggestionsRef}
                          className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-80 overflow-y-auto"
                        >
                          {bookSuggestions.map((book) => (
                            <div
                              key={book._id}
                              onClick={() => handleSelectBook(book)}
                              className="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-b-0"
                            >
                              <div className="flex gap-3">
                                <img
                                  src={book.coverImage}
                                  alt={book.title}
                                  className="w-10 h-14 object-cover rounded border"
                                  onError={(e) => {
                                    e.target.src = 'https://via.placeholder.com/40x56?text=No+Image';
                                  }}
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs font-mono font-semibold text-indigo-700">
                                    {generateBookCode(book)}
                                  </div>
                                  <div className="text-sm font-medium text-gray-900 truncate">
                                    {book.title}
                                  </div>
                                  <div className="text-xs text-gray-500">{book.author}</div>
                                  <div className="text-xs text-green-600 mt-0.5">
                                    Còn: {book.available} quyển
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Sách đã chọn */}
                  {selectedBook && (
                    <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
                      <div className="flex justify-between items-start mb-2">
                        <div className="text-sm font-semibold text-blue-700">✓ Đã chọn:</div>
                        <button
                          onClick={() => {
                            setSelectedBook(null);
                            setBookSearchTerm('');
                          }}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex gap-3">
                        <img
                          src={selectedBook.coverImage}
                          alt={selectedBook.title}
                          className="w-12 h-16 object-cover rounded border"
                        />
                        <div>
                          <div className="text-sm font-mono font-semibold text-indigo-700">
                            {generateBookCode(selectedBook)}
                          </div>
                          <div className="text-sm font-medium">{selectedBook.title}</div>
                          <div className="text-xs text-gray-600">{selectedBook.author}</div>
                          <div className="text-xs text-green-600 mt-1">
                            Còn lại: {selectedBook.available} quyển
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Tìm người dùng */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      👤 Tìm người mượn (theo email hoặc tên)
                    </label>
                    <div className="relative">
                      <div className="relative">
                        <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                        <input
                          ref={userInputRef}
                          type="text"
                          value={userSearchTerm}
                          onChange={(e) => setUserSearchTerm(e.target.value)}
                          onFocus={() => userSuggestions.length > 0 && setShowUserSuggestions(true)}
                          placeholder="VD: nguyen@email.com hoặc Nguyễn Văn A"
                          className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                        />
                      </div>

                      {/* User Suggestions Dropdown */}
                      {showUserSuggestions && userSuggestions.length > 0 && (
                        <div 
                          ref={userSuggestionsRef}
                          className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-80 overflow-y-auto"
                        >
                          {userSuggestions.map((user) => (
                            <div
                              key={user._id}
                              onClick={() => handleSelectUser(user)}
                              className="p-3 hover:bg-green-50 cursor-pointer border-b last:border-b-0"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold flex-shrink-0">
                                  {user.fullName.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium text-gray-900">
                                    {user.fullName}
                                  </div>
                                  <div className="text-xs text-gray-500 truncate">{user.email}</div>
                                  <div className="text-xs text-gray-400">{user.phone}</div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Người dùng đã chọn */}
                  {selectedUser && (
                    <div className="bg-green-50 rounded-lg p-4 border-2 border-green-200">
                      <div className="flex justify-between items-start mb-2">
                        <div className="text-sm font-semibold text-green-700">✓ Đã chọn:</div>
                        <button
                          onClick={() => {
                            setSelectedUser(null);
                            setUserSearchTerm('');
                          }}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold flex-shrink-0">
                          {selectedUser.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-medium">{selectedUser.fullName}</div>
                          <div className="text-xs text-gray-600">{selectedUser.email}</div>
                          <div className="text-xs text-gray-500">{selectedUser.phone}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Số ngày mượn */}
              {(selectedBook || selectedUser) && (
                <div className="mt-6 border-t pt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ⏰ Số ngày cho mượn
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setDirectBorrowDays(prev => Math.max(1, prev - 1))}
                      className="w-9 h-9 rounded-lg border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 text-lg font-bold"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={directBorrowDays}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        if (!isNaN(val) && val >= 1 && val <= 365) setDirectBorrowDays(val);
                      }}
                      className="w-20 text-center text-xl font-semibold border rounded-lg py-1.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setDirectBorrowDays(prev => Math.min(365, prev + 1))}
                      className="w-9 h-9 rounded-lg border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 text-lg font-bold"
                    >
                      +
                    </button>
                    <span className="text-sm text-gray-500 ml-1">ngày</span>
                  </div>

                  <div className="flex gap-2 flex-wrap mt-3">
                    {[3, 7, 14, 30, 60].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDirectBorrowDays(d)}
                        className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                          directBorrowDays === d
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'border-gray-300 text-gray-600 hover:border-blue-400'
                        }`}
                      >
                        {d} ngày
                      </button>
                    ))}
                  </div>

                  <div className="bg-blue-50 rounded-lg px-4 py-3 flex justify-between items-center mt-3">
                    <span className="text-sm text-blue-700">Hạn trả dự kiến:</span>
                    <span className="text-sm font-semibold text-blue-800">
                      {previewDirectBorrowDueDate()}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 border-t px-6 py-4">
              <button
                onClick={handleCloseDirectBorrowModal}
                className="px-6 py-2 border rounded-lg text-gray-600 hover:bg-gray-100"
              >
                Hủy
              </button>
              <button
                onClick={handleDirectBorrow}
                disabled={!selectedBook || !selectedUser}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
              >
                Xác nhận mượn sách
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}