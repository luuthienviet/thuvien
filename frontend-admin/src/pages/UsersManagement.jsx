import { useState, useEffect } from 'react';
import { Search, Ban, CheckCircle, Eye, Check, X, CreditCard } from 'lucide-react';
import { userAPI } from '../services/api';

export default function UsersManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingPaymentId, setProcessingPaymentId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const apiOrigin = 'https://luuthienvietthuvien.vercel.app';

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await userAPI.getUsers();
      const readers = response.data.data.filter(user => user.role === 'reader');
      setUsers(readers);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'blocked' : 'active';
    
    if (!confirm(`Bạn có chắc muốn ${newStatus === 'blocked' ? 'khóa' : 'mở khóa'} tài khoản này?`)) {
      return;
    }

    try {
      await userAPI.updateUserStatus(userId, newStatus);
      alert(`${newStatus === 'blocked' ? 'Khóa' : 'Mở khóa'} tài khoản thành công!`);
      fetchUsers();
    } catch (error) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleViewDetail = async (userId) => {
    try {
      const response = await userAPI.getUser(userId);
      setSelectedUser(response.data.data);
      setShowDetailModal(true);
    } catch (error) {
      alert('Không thể tải thông tin người dùng');
    }
  };

  const handleApprovePayment = async (userId) => {
    try {
      setProcessingPaymentId(userId);
      await userAPI.approveSubscriptionPayment(userId);
      alert('Duyệt thanh toán thành công');
      await fetchUsers();
      if (selectedUser?._id === userId) {
        const refreshed = await userAPI.getUser(userId);
        setSelectedUser(refreshed.data.data);
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Không thể duyệt thanh toán');
    } finally {
      setProcessingPaymentId('');
    }
  };

  const handleRejectPayment = async (userId) => {
    const reason = prompt('Nhập lý do từ chối bill (có thể để trống):', '');
    if (reason === null) return;

    try {
      setProcessingPaymentId(userId);
      await userAPI.rejectSubscriptionPayment(userId, { reason });
      alert('Đã từ chối bill thanh toán');
      await fetchUsers();
      if (selectedUser?._id === userId) {
        const refreshed = await userAPI.getUser(userId);
        setSelectedUser(refreshed.data.data);
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Không thể từ chối bill');
    } finally {
      setProcessingPaymentId('');
    }
  };

  const getPaymentStatusBadge = (subscription = {}) => {
    const status = subscription.pendingPaymentStatus === 'pending_review'
      ? 'pending_review'
      : (subscription.paymentStatus || 'none');
    const config = {
      none: { label: 'Chưa gửi bill', className: 'bg-gray-100 text-gray-700' },
      pending_review: { label: 'Chờ duyệt', className: 'bg-amber-100 text-amber-800' },
      approved: { label: 'Đã duyệt', className: 'bg-green-100 text-green-800' },
      rejected: { label: 'Từ chối', className: 'bg-red-100 text-red-800' }
    };

    const item = config[status] || config.none;
    return <span className={`px-3 py-1 rounded-full text-xs font-medium ${item.className}`}>{item.label}</span>;
  };

  const getPlanLabel = (subscription = {}) => {
    const planType = subscription.planType || 'none';
    if (planType === 'monthly') return 'Gói Bình Thường';
    if (planType === 'yearly') return 'Gói Cao Cấp';
    return 'Chưa chọn';
  };

  const hasPendingPayment = (subscription = {}) => {
    return subscription.paymentStatus === 'pending_review' || subscription.pendingPaymentStatus === 'pending_review';
  };

  const pendingCount = users.filter(u => hasPendingPayment(u.subscription)).length;

  const filteredUsers = users.filter(user =>
    user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.cccd && user.cccd.includes(searchTerm)) ||
    (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (user.phone && user.phone.includes(searchTerm))
  );

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Quản lý độc giả</h1>
          <p className="text-gray-600 mt-1">
            Tổng số: <span className="font-semibold">{users.length}</span> độc giả
          </p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-amber-800 flex items-center">
          <CreditCard className="w-4 h-4 mr-2" />
          Bill chờ duyệt: <span className="font-semibold ml-1">{pendingCount}</span>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm theo tên, CCCD, email, số điện thoại..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600"
          />
        </div>
        {searchTerm && (
          <p className="text-sm text-gray-500 mt-2">
            Tìm thấy <span className="font-semibold">{filteredUsers.length}</span> kết quả
          </p>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <p className="text-gray-500 text-lg">
            {searchTerm ? 'Không tìm thấy độc giả nào' : 'Chưa có độc giả nào đăng ký'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Họ tên</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Số CCCD</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Số điện thoại</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Địa chỉ</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gói</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thanh toán</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold mr-3">
                        {user.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div className="text-sm font-medium text-gray-900">{user.fullName}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-mono text-gray-800 bg-gray-100 px-2 py-1 rounded">
                      {user.cccd || '—'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {user.email || '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.phone}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate" title={user.address}>
                    {user.address}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {getPlanLabel(user.subscription)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getPaymentStatusBadge(user.subscription)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      user.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {user.status === 'active' ? 'Hoạt động' : 'Bị khóa'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleViewDetail(user._id)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                      title="Xem chi tiết"
                    >
                      <Eye className="w-5 h-5 inline" />
                    </button>
                    {hasPendingPayment(user.subscription) && (
                      <>
                        <button
                          onClick={() => handleApprovePayment(user._id)}
                          disabled={processingPaymentId === user._id}
                          className="inline-flex items-center px-3 py-1 rounded-lg text-green-600 hover:bg-green-50 mr-2 disabled:opacity-50"
                          title="Duyệt bill"
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Duyệt
                        </button>
                        <button
                          onClick={() => handleRejectPayment(user._id)}
                          disabled={processingPaymentId === user._id}
                          className="inline-flex items-center px-3 py-1 rounded-lg text-orange-600 hover:bg-orange-50 mr-2 disabled:opacity-50"
                          title="Từ chối bill"
                        >
                          <X className="w-4 h-4 mr-1" />
                          Từ chối
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleToggleStatus(user._id, user.status)}
                      className={`inline-flex items-center px-3 py-1 rounded-lg ${
                        user.status === 'active'
                          ? 'text-red-600 hover:bg-red-50'
                          : 'text-green-600 hover:bg-green-50'
                      }`}
                      title={user.status === 'active' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                    >
                      {user.status === 'active' ? (
                        <>
                          <Ban className="w-4 h-4 mr-1" />
                          Khóa
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Mở khóa
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header cố định – luôn hiển thị nút đóng */}
            <div className="flex justify-between items-center px-6 py-4 border-b bg-white sticky top-0 z-10">
              <h2 className="text-2xl font-bold text-gray-800">Thông tin độc giả</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                title="Đóng"
              >
                ✕
              </button>
            </div>

            {/* Nội dung cuộn được */}
            <div className="overflow-y-auto flex-1 px-6 py-4">
            <div className="space-y-4">
              <div className="flex items-center mb-6">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-3xl mr-4">
                  {selectedUser.fullName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xl font-semibold">{selectedUser.fullName}</h3>
                  <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-medium ${
                    selectedUser.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {selectedUser.status === 'active' ? 'Hoạt động' : 'Bị khóa'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* CCCD - hiển thị nổi bật */}
                <div className="col-span-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <label className="text-sm font-medium text-blue-600">Số căn cước công dân</label>
                  <p className="text-gray-800 font-mono text-lg font-semibold tracking-widest mt-1">
                    {selectedUser.cccd || '—'}
                  </p>
                </div>

                <div className="col-span-2 border rounded-lg p-3 bg-slate-50">
                  <label className="text-sm font-medium text-gray-600">Thông tin thanh toán gói</label>
                  <div className="mt-2 space-y-2">
                    <div className="flex flex-wrap gap-3 items-center justify-between">
                      <div>
                        <span className="text-gray-800 font-medium">{getPlanLabel(selectedUser.subscription)}</span>
                        {selectedUser.subscription?.price && (
                          <span className="ml-2 text-lg font-bold text-blue-600">
                            {selectedUser.subscription.price.toLocaleString('vi-VN')} VND
                          </span>
                        )}
                      </div>
                      {getPaymentStatusBadge(selectedUser.subscription)}
                    </div>

                    {(selectedUser.subscription?.maxBooksPerMonth) && (
                      <div className="grid grid-cols-1 gap-2 bg-white rounded p-2 border border-gray-200">
                        {selectedUser.subscription?.maxBooksPerMonth > 0 && (
                          <div className="text-sm">
                            <span className="text-gray-500">Mượn tối đa:</span>
                            <p className="font-semibold text-gray-800">{selectedUser.subscription.maxBooksPerMonth} quyển</p>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex gap-2 text-sm text-gray-500">
                      <span>
                        Gửi bill: {(selectedUser.subscription?.pendingSubmittedAt || selectedUser.subscription?.submittedAt)
                          ? new Date(selectedUser.subscription?.pendingSubmittedAt || selectedUser.subscription?.submittedAt).toLocaleDateString('vi-VN')
                          : '—'}
                      </span>
                    </div>
                  </div>
                  {selectedUser.subscription?.rejectionReason && (
                    <p className="text-sm text-red-600 mt-2">Lý do từ chối: {selectedUser.subscription.rejectionReason}</p>
                  )}

                  {(selectedUser.subscription?.pendingBillImageUrl || selectedUser.subscription?.billImageUrl) && (
                    <div className="mt-3">
                      <p className="text-sm text-gray-500 mb-2">Ảnh bill:</p>
                      <img
                        src={`${apiOrigin}${selectedUser.subscription?.pendingBillImageUrl || selectedUser.subscription?.billImageUrl}`}
                        alt="Bill thanh toán"
                        className="w-full max-h-72 object-contain rounded-lg border bg-white"
                      />
                    </div>
                  )}

                  {hasPendingPayment(selectedUser.subscription) && (
                    <div className="mt-3 flex gap-3">
                      <button
                        onClick={() => handleApprovePayment(selectedUser._id)}
                        disabled={processingPaymentId === selectedUser._id}
                        className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                      >
                        Duyệt thanh toán
                      </button>
                      <button
                        onClick={() => handleRejectPayment(selectedUser._id)}
                        disabled={processingPaymentId === selectedUser._id}
                        className="px-4 py-2 rounded-lg bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50"
                      >
                        Từ chối bill
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="text-gray-800">{selectedUser.email || '—'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Số điện thoại</label>
                  <p className="text-gray-800">{selectedUser.phone}</p>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-500">Địa chỉ</label>
                  <p className="text-gray-800">{selectedUser.address}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Ngày đăng ký</label>
                  <p className="text-gray-800">
                    {new Date(selectedUser.createdAt).toLocaleDateString('vi-VN')}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Vai trò</label>
                  <p className="text-gray-800">Độc giả</p>
                </div>
              </div>
            </div>
            </div>{/* end scroll wrapper */}

            {/* Footer cố định ở đáy modal */}
            <div className="flex justify-end space-x-4 px-6 py-4 border-t bg-white">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-6 py-2 border rounded-lg hover:bg-gray-100"
              >
                Đóng
              </button>
              <button
                onClick={() => {
                  handleToggleStatus(selectedUser._id, selectedUser.status);
                  setShowDetailModal(false);
                }}
                className={`px-6 py-2 rounded-lg text-white ${
                  selectedUser.status === 'active'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {selectedUser.status === 'active' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
// frontend-admin/src/pages/UsersManagement.jsx