import { useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../services/api';
import Navbar from '../components/Navbar';
import { CreditCard, Upload, CalendarCheck, XCircle, Clock3 } from 'lucide-react';

export default function Subscription() {
  const { user, refreshUser } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState('monthly');
  const [billFile, setBillFile] = useState(null);
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState({ type: '', text: '' });

  const subscription = user?.subscription || {};
  const isApproved = subscription.paymentStatus === 'approved';
  const remainingBooks = Number(subscription.remainingBooks);
  const displayedRemainingBooks = Number.isFinite(remainingBooks) && remainingBooks > 0
    ? remainingBooks
    : (isApproved
      ? (subscription.planType === 'monthly' ? 15 : 30)
      : 5);

  const subscriptionDisplay = useMemo(() => {
    const planLabel = {
      none: 'Chưa đăng ký',
      monthly: 'Gói Bình Thường',
      yearly: 'Gói Cao Cấp'
    };

    const statusLabel = {
      none: 'Chưa gửi bill',
      pending_review: 'Đang chờ admin duyệt',
      approved: 'Đã duyệt',
      rejected: 'Bị từ chối'
    };

    return {
      plan: planLabel[subscription.planType || 'none'] || 'Chưa đăng ký',
      status: statusLabel[subscription.paymentStatus || 'none'] || 'Chưa gửi bill'
    };
  }, [subscription.planType, subscription.paymentStatus]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setPaymentMessage({ type: 'error', text: 'Vui lòng chọn file ảnh hợp lệ' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setPaymentMessage({ type: 'error', text: 'Ảnh bill không được vượt quá 5MB' });
      return;
    }

    setBillFile(file);
    setPaymentMessage({ type: '', text: '' });
  };

  const handlePaymentProofSubmit = async (e) => {
    e.preventDefault();
    if (!billFile) {
      setPaymentMessage({ type: 'error', text: 'Vui lòng chọn ảnh bill trước khi gửi' });
      return;
    }

    try {
      setSubmittingPayment(true);
      setPaymentMessage({ type: '', text: '' });

      const formDataUpload = new FormData();
      formDataUpload.append('planType', selectedPlan);
      formDataUpload.append('billImage', billFile);

      const response = await userAPI.submitPaymentProof(formDataUpload);
      await refreshUser();
      setBillFile(null);
      setPaymentMessage({
        type: 'success',
        text: response.data.message || 'Đã gửi bill thành công'
      });
    } catch (error) {
      setPaymentMessage({
        type: 'error',
        text: error.response?.data?.message || 'Không thể gửi bill, vui lòng thử lại'
      });
    } finally {
      setSubmittingPayment(false);
    }
  };

  const formatDate = (value) => {
    if (!value) return '—';
    return new Date(value).toLocaleDateString('vi-VN');
  };

  const statusPillClass = {
    none: 'bg-gray-100 text-gray-700',
    pending_review: 'bg-amber-100 text-amber-800',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700'
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Đăng ký gói</h1>

        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <CreditCard className="w-5 h-5 mr-2 text-blue-600" />
                Gói sử dụng thư viện
              </h3>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusPillClass[subscription.paymentStatus || 'none']}`}>
                {subscriptionDisplay.status}
              </span>
            </div>

            <div className="grid md:grid-cols-1 gap-4 mb-4">
              <div className="border rounded-lg p-4 bg-slate-50">
                <p className="text-sm text-gray-500">Gói hiện tại</p>
                <p className="text-lg font-semibold text-gray-800">{subscriptionDisplay.plan}</p>
              </div>
            </div>

            <div className="grid md:grid-cols-1 gap-4 mb-4">
              {subscription.paymentStatus === 'approved' && (
                <div className="border rounded-lg p-4 bg-blue-50 border-blue-200">
                  <p className="text-sm font-medium text-blue-700 mb-1">Lượt còn lại</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {displayedRemainingBooks} quyển
                  </p>
                </div>
              )}
              {!subscription.paymentStatus || subscription.paymentStatus === 'rejected' || subscription.paymentStatus === 'pending_review' ? (
                <div className="border rounded-lg p-4 bg-amber-50 border-amber-200">
                  <p className="text-sm font-medium text-amber-700 mb-1">Lượt còn lại</p>
                  <p className="text-2xl font-bold text-amber-600">{displayedRemainingBooks} quyển</p>
                </div>
              ) : null}
            </div>

            {subscription.paymentStatus === 'rejected' && subscription.rejectionReason && (
              <div className="mb-4 bg-red-50 text-red-700 p-3 rounded-lg text-sm flex items-start">
                <XCircle className="w-4 h-4 mr-2 mt-0.5" />
                Lý do từ chối: {subscription.rejectionReason}
              </div>
            )}

            {subscription.paymentStatus === 'approved' && (
              <div className="mb-4 bg-green-50 text-green-700 p-3 rounded-lg text-sm flex items-start">
                <CalendarCheck className="w-4 h-4 mr-2 mt-0.5" />
                Tài khoản đã được duyệt gói. Bạn còn {displayedRemainingBooks} quyển có thể mượn.
              </div>
            )}

            {subscription.paymentStatus === 'pending_review' && (
              <div className="mb-4 bg-amber-50 text-amber-700 p-3 rounded-lg text-sm flex items-start">
                <Clock3 className="w-4 h-4 mr-2 mt-0.5" />
                Bill đã gửi ngày {formatDate(subscription.submittedAt)}. Vui lòng chờ admin xác nhận.
              </div>
            )}

            {(subscription.paymentStatus === 'none' || subscription.paymentStatus === 'rejected' || !subscription.paymentStatus) && (
              <div className="mb-4 bg-amber-50 text-amber-700 p-3 rounded-lg text-sm flex items-start">
                <Clock3 className="w-4 h-4 mr-2 mt-0.5" />
                Bạn chưa đăng ký gói, hiện có thể mượn {displayedRemainingBooks} quyển. Khi dùng hết, hệ thống sẽ tự reset sau 1 tháng.
              </div>
            )}

            <form onSubmit={handlePaymentProofSubmit} className="border rounded-lg p-4 bg-white">
              <p className="text-sm text-gray-700 mb-4">
                Chuyển khoản theo thông tin sau rồi tải bill lên để admin duyệt.
              </p>

              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div
                  className={`border-2 rounded-lg p-4 cursor-pointer transition ${
                    selectedPlan === 'monthly'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedPlan('monthly')}
                >
                  <h4 className="font-semibold text-gray-800 mb-2">Gói Bình Thường</h4>
                  <p className="text-2xl font-bold text-blue-600 mb-3">30,000 VND</p>
                  <ul className="text-sm text-gray-700 space-y-1 mb-3">
                    <li>✓ Mượn tối đa 15 đầu sách</li>
                    <li>✓ Phù hợp nhu cầu đọc thường xuyên</li>
                  </ul>
                  <button
                    type="button"
                    className={`w-full py-2 rounded ${
                      selectedPlan === 'monthly'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {selectedPlan === 'monthly' ? '✓ Đã chọn' : 'Chọn gói này'}
                  </button>
                </div>

                <div
                  className={`border-2 rounded-lg p-4 cursor-pointer transition ${
                    selectedPlan === 'yearly'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedPlan('yearly')}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-gray-800">Gói Cao Cấp</h4>
                    <span className="bg-green-500 text-white text-xs px-2 py-1 rounded">Tiết kiệm 6%</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-600 mb-3">300,000 VND</p>
                  <ul className="text-sm text-gray-700 space-y-1 mb-3">
                    <li>✓ Mượn tối đa 30 đầu sách</li>
                    <li>✓ Lý tưởng cho người đọc chuyên sâu</li>
                  </ul>
                  <button
                    type="button"
                    className={`w-full py-2 rounded ${
                      selectedPlan === 'yearly'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {selectedPlan === 'yearly' ? '✓ Đã chọn' : 'Chọn gói này'}
                  </button>
                </div>
              </div>

              <div className="mb-6 text-sm bg-blue-50 border border-blue-100 rounded-lg p-4 text-blue-900">
                <h4 className="font-semibold mb-2">📌 Thông tin chuyển khoản:</h4>
                <p><strong>Ngân hàng:</strong> MB Bank</p>
                <p><strong>Số tài khoản:</strong> 0123456789</p>
                <p><strong>Chủ tài khoản:</strong> THU VIEN SO</p>
                <p><strong>Nội dung CK:</strong> CCCD + GOI THANG/NAM</p>
              </div>

              <label className="block text-sm font-medium text-gray-700 mb-2">Tải ảnh bill</label>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <label className="inline-flex items-center px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 cursor-pointer w-fit">
                  <Upload className="w-4 h-4 mr-2" />
                  Chọn ảnh
                  <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                </label>
                <span className="text-sm text-gray-600">{billFile ? billFile.name : 'Chưa chọn file'}</span>
              </div>

              {paymentMessage.text && (
                <div
                  className={`mt-4 p-3 rounded-lg text-sm ${
                    paymentMessage.type === 'success'
                      ? 'bg-green-50 text-green-700'
                      : 'bg-red-50 text-red-700'
                  }`}
                >
                  {paymentMessage.text}
                </div>
              )}

              <button
                type="submit"
                disabled={submittingPayment}
                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60"
              >
                {submittingPayment ? 'Đang gửi bill...' : 'Gửi bill cho admin duyệt'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}