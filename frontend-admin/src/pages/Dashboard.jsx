import { useState, useEffect } from 'react';
import { BookOpen, Users, BookMarked, AlertCircle } from 'lucide-react';
import { bookAPI, borrowAPI } from '../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalBooks: 0,
    borrowedBooks: 0,
    totalReaders: 0,
    overdueBooks: 0
  });
  const [recentBorrows, setRecentBorrows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [booksRes, borrowsRes] = await Promise.all([
        bookAPI.getBooks({ limit: 1000 }),
        borrowAPI.getBorrows({ limit: 10 })
      ]);

      const books = booksRes.data.data;
      const borrows = borrowsRes.data.data;

      const borrowedCount = books.reduce((sum, book) => sum + (book.quantity - book.available), 0);
      const overdueCount = borrows.filter(b => b.status === 'overdue').length;

      setStats({
        totalBooks: books.length,
        borrowedBooks: borrowedCount,
        totalReaders: 0,
        overdueBooks: overdueCount
      });

      setRecentBorrows(borrows.slice(0, 5));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { 
      icon: BookOpen, 
      label: 'Tổng số sách', 
      value: stats.totalBooks,
      color: 'bg-blue-500'
    },
    { 
      icon: BookMarked, 
      label: 'Đang được mượn', 
      value: stats.borrowedBooks,
      color: 'bg-green-500'
    },
    { 
      icon: AlertCircle, 
      label: 'Sách quá hạn', 
      value: stats.overdueBooks,
      color: 'bg-red-500'
    }
  ];

  const chartData = [
    { month: 'T1', borrows: 45 },
    { month: 'T2', borrows: 52 },
    { month: 'T3', borrows: 61 },
    { month: 'T4', borrows: 58 },
    { month: 'T5', borrows: 70 },
    { month: 'T6', borrows: 65 }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Thống kê</h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-4 rounded-lg`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Chart */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">
          Lượt mượn sách theo tháng
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="borrows" stroke="#3B82F6" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Borrows */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">
          Hoạt động mượn/trả gần đây
        </h3>
        {recentBorrows.length === 0 ? (
          <p className="text-gray-500">Chưa có hoạt động nào</p>
        ) : (
          <div className="space-y-3">
            {recentBorrows.map((borrow) => (
              <div key={borrow._id} className="flex items-center justify-between border-b pb-3">
                <div>
                  <p className="font-medium text-gray-800">{borrow.bookId.title}</p>
                  <p className="text-sm text-gray-600">{borrow.userId.fullName}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  borrow.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  borrow.status === 'approved' ? 'bg-green-100 text-green-800' :
                  borrow.status === 'returned' ? 'bg-gray-100 text-gray-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {borrow.status === 'pending' ? 'Chờ duyệt' :
                   borrow.status === 'approved' ? 'Đang mượn' :
                   borrow.status === 'returned' ? 'Đã trả' : 'Quá hạn'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}