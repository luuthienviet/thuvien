import { useState, useEffect } from 'react';
import { Calendar, Clock, RefreshCw, Trash2 } from 'lucide-react';
import { borrowAPI } from '../services/api';
import Navbar from '../components/Navbar';

export default function MyBorrows() {
  const [borrows, setBorrows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchBorrows();
  }, []);

  const fetchBorrows = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);

      const response = await borrowAPI.getBorrows();
      setBorrows(response.data.data);
    } catch (error) {
      console.error('Error fetching borrows:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleCancel = async (borrowId) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy phiếu mượn này?')) return;

    try {
      setMessage({ type: '', text: '' });
      const response = await borrowAPI.cancelBorrow(borrowId);
      setMessage({
        type: 'success',
        text: response.data.message || 'Hủy phiếu mượn thành công'
      });
      fetchBorrows(true);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Hủy phiếu mượn thất bại'
      });
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      overdue: 'bg-red-100 text-red-800',
      returned: 'bg-gray-100 text-gray-800'
    };

    const labels = {
      pending: 'Chờ duyệt',
      approved: 'Đang mượn',
      overdue: 'Quá hạn',
      returned: 'Đã trả'
    };

    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${badges[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const formatDate = (date) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString('vi-VN');
  };

  const isNearDueDate = (dueDate, status) => {
    if (!dueDate) return false;
    if (status !== 'approved') return false;

    const days =
      Math.ceil((new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24));
    return days <= 3 && days >= 0;
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Sách của tôi</h1>
          <button
            onClick={() => fetchBorrows(true)}
            disabled={refreshing}
            className="flex items-center px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 text-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
        </div>

        {message.text && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800'
                : 'bg-red-50 text-red-800'
            }`}
          >
            {message.text}
          </div>
        )}

        {borrows.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500 text-lg">Bạn chưa mượn sách nào</p>
          </div>
        ) : (
          <div className="space-y-4">
            {borrows.map((borrow) => (
              <div key={borrow._id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <img
                    src={borrow.bookId.coverImage}
                    alt={borrow.bookId.title}
                    className="w-32 h-48 object-cover rounded-lg"
                  />

                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-800">
                          {borrow.bookId.title}
                        </h3>
                        <p className="text-gray-600">{borrow.bookId.author}</p>
                      </div>
                      {getStatusBadge(borrow.status)}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        Ngày mượn: {formatDate(borrow.borrowDate)}
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-2" />
                        Hạn trả:{' '}
                        {borrow.dueDate ? (
                          formatDate(borrow.dueDate)
                        ) : (
                          <span className="italic text-gray-400">
                            Chưa định (chờ duyệt)
                          </span>
                        )}
                      </div>
                    </div>

                    {isNearDueDate(borrow.dueDate, borrow.status) && (
                      <div className="bg-yellow-50 text-yellow-800 p-3 rounded-lg text-sm">
                        ⚠️ Sách sắp đến hạn trả!
                      </div>
                    )}

                    {borrow.status === 'pending' && (
                      <button
                        onClick={() => handleCancel(borrow._id)}
                        className="flex items-center px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Hủy phiếu mượn
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
