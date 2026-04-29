import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function BookCard({ book }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleClick = (e) => {
    e.preventDefault();

    // Kiểm tra xem đã đăng nhập chưa
    if (!user) {
      // Lưu thông tin sách muốn xem vào localStorage
      localStorage.setItem('redirectAfterLogin', `/books/${book._id}`);

      // Hiển thị thông báo và chuyển đến trang đăng nhập
      alert('Vui lòng đăng nhập để xem chi tiết sách!');
      navigate('/login');
      return;
    }

    // Nếu đã đăng nhập, cho phép xem chi tiết
    navigate(`/books/${book._id}`);
  };

  return (
    <div onClick={handleClick} className="block h-full cursor-pointer">
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 h-full flex flex-col">

        {/* IMAGE */}
        <div
          className="w-full flex items-center justify-center"
          style={{ height: '220px', background: '#f5f5f0', padding: '8px' }}
        >
          <img
            src={book.coverImage}
            alt={book.title}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              width: 'auto',
              height: '100%',
              objectFit: 'contain',
              display: 'block',
            }}
            onError={(e) => {
              e.target.src =
                'https://via.placeholder.com/300x450?text=No+Image';
            }}
          />
        </div>

        {/* CONTENT */}
        <div className="p-4 flex-1 flex flex-col">

          {/* TITLE – 2 lines cố định */}
          <h3
            className="text-base font-semibold text-gray-800 mb-2 overflow-hidden"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              lineHeight: '1.5rem',
              height: '3rem',
            }}
          >
            {book.title}
          </h3>

          <p className="text-sm text-gray-600 mb-1 truncate">
            <span className="font-medium">Tác giả:</span> {book.author}
          </p>

          <p className="text-xs text-gray-500 mb-3 truncate">
            <span className="font-medium">Thể loại:</span> {book.category}
          </p>

          {/* FOOTER */}
          <div className="mt-auto flex items-center justify-between pt-3 border-t">
            <span
              className={`text-sm font-medium ${book.available > 0
                  ? 'text-green-600'
                  : 'text-red-600'
                }`}
            >
              {book.available > 0
                ? `Còn ${book.available} quyển`
                : 'Hết sách'}
            </span>

            <span className="text-sm text-blue-600 font-medium hover:text-blue-700">
              Xem chi tiết →
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}