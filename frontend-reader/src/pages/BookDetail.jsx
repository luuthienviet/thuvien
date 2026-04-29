import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, Share2 } from 'lucide-react';
import { bookAPI, borrowAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

export default function BookDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [book, setBook] = useState(null);
  const [relatedBooks, setRelatedBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [borrowing, setBorrowing] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchBook();
  }, [id]);

  const fetchBook = async () => {
    try {
      const response = await bookAPI.getBook(id);
      const bookData = response.data.data;
      setBook(bookData);
      
      // Fetch related books
      fetchRelatedBooks(bookData);
    } catch (error) {
      console.error('Error fetching book:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedBooks = async (currentBook) => {
    try {
      // Tìm sách cùng thể loại hoặc cùng tác giả
      const [categoryBooks, authorBooks] = await Promise.all([
        bookAPI.searchBooks(currentBook.category),
        bookAPI.searchBooks(currentBook.author)
      ]);

      // Combine và loại bỏ sách hiện tại
      const combined = [...categoryBooks.data.data, ...authorBooks.data.data];
      const unique = combined.filter((book, index, self) => 
        book._id !== currentBook._id && 
        index === self.findIndex(b => b._id === book._id)
      );

      setRelatedBooks(unique.slice(0, 4)); // Lấy 4 sách đầu
    } catch (error) {
      console.error('Error fetching related books:', error);
    }
  };



  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setMessage({ type: 'success', text: 'Đã sao chép link!' });
    setTimeout(() => setMessage({ type: '', text: '' }), 2000);
  };

  const handleBorrow = async () => {
    try {
      setBorrowing(true);
      setMessage({ type: '', text: '' });
      
      const response = await borrowAPI.createBorrow({ bookId: id });
      await refreshUser();
      setMessage({ type: 'success', text: response.data.message });
      
      setTimeout(() => {
        navigate('/my-borrows');
      }, 2000);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Đăng ký mượn thất bại'
      });
    } finally {
      setBorrowing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <p className="text-center text-gray-500">Không tìm thấy sách</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-800 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Quay lại
        </button>

        {/* Book Detail Card */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-8">
            {/* Book Cover */}
            <div className="md:col-span-1">
              <img
                src={book.coverImage}
                alt={book.title}
                className="w-full rounded-lg shadow-md"
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/300x400?text=No+Image';
                }}
              />
            </div>

            {/* Book Info */}
            <div className="md:col-span-2 space-y-4">
              <h1 className="text-3xl font-bold text-gray-800">{book.title}</h1>
              
              <div className="space-y-2 text-gray-600">
                <p><span className="font-semibold">Tác giả:</span> {book.author}</p>
                <p><span className="font-semibold">Thể loại:</span> {book.category}</p>
                <p><span className="font-semibold">Nhà xuất bản:</span> {book.publisher}</p>
                <p><span className="font-semibold">Năm xuất bản:</span> {book.publishYear}</p>
                {book.isbn && <p><span className="font-semibold">ISBN:</span> {book.isbn}</p>}
              </div>

              <div className="py-4">
                <div className={`inline-flex items-center px-4 py-2 rounded-full ${
                  book.available > 0 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  <BookOpen className="w-5 h-5 mr-2" />
                  {book.available > 0 
                    ? `Còn ${book.available} quyển` 
                    : 'Hết sách'}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Mô tả:</h3>
                <p className="text-gray-600 leading-relaxed">{book.description}</p>
              </div>

              {message.text && (
                <div className={`p-4 rounded-lg ${
                  message.type === 'success' 
                    ? 'bg-green-50 text-green-800' 
                    : 'bg-red-50 text-red-800'
                }`}>
                  {message.text}
                </div>
              )}

              <button
                onClick={handleBorrow}
                disabled={book.available <= 0 || borrowing}
                className="w-full md:w-auto px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {borrowing ? 'Đang xử lý...' : 'Đăng ký mượn sách'}
              </button>
            </div>
          </div>
        </div>

        {/* Related Books Section */}
        {relatedBooks.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Sách liên quan</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedBooks.map((relatedBook) => (
                <Link 
                  key={relatedBook._id} 
                  to={`/books/${relatedBook._id}`}
                  onClick={() => window.scrollTo(0, 0)}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow"
                >
                  <div className="relative h-64 overflow-hidden bg-gray-200">
                    <img
                      src={relatedBook.coverImage}
                      alt={relatedBook.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = '';
                      }}
                    />
                  </div>
                  
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2 h-14">
                      {relatedBook.title}
                    </h3>
                    
                    <p className="text-sm text-gray-600 mb-1">
                      <span className="font-medium">Tác giả:</span> {relatedBook.author}
                    </p>
                    
                    <p className="text-xs text-gray-500 mb-3">
                      <span className="font-medium">Thể loại:</span> {relatedBook.category}
                    </p>
                    
                    <div className="flex items-center justify-between pt-3 border-t">
                      <span className={`text-sm font-medium ${
                        relatedBook.available > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {relatedBook.available > 0 ? `Còn ${relatedBook.available} quyển` : 'Hết sách'}
                      </span>
                      <span className="text-sm text-blue-600 font-medium hover:text-blue-700">
                        Xem chi tiết →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}