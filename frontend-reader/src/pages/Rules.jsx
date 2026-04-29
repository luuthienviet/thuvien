import { Link } from 'react-router-dom';
import { 
  AlertCircle, 
  Clock, 
  DollarSign, 
  XCircle,
  Shield,
  FileText,
  ArrowLeft
} from 'lucide-react';
import Navbar from '../components/Navbar';

export default function Rules() {
  const violations = [
    {
      icon: <Clock className="w-8 h-8 text-orange-500" />,
      title: "Trả sách trễ hạn",
      description: "Quá thời gian quy định trong phiếu mượn",
      penalty: "Phạt 5.000đ/ngày cho mỗi quyển sách",
      details: [
        "Thời gian mượn tiêu chuẩn: 14 ngày",
        "Có thể gia hạn 1 lần (thêm 7 ngày) nếu không có người đặt trước",
        "Sau 30 ngày trễ hạn, bạn đọc sẽ bị tạm khóa tài khoản"
      ]
    },
    {
      icon: <XCircle className="w-8 h-8 text-red-500" />,
      title: "Làm hỏng/mất sách",
      description: "Sách bị rách, ướt, mất trang hoặc làm mất hoàn toàn",
      penalty: "Bồi thường 100% - 200% giá trị sách",
      details: [
        "Rách nhẹ, bẩn ít: Phạt 20.000đ - 50.000đ",
        "Rách nhiều, ướt, mất trang: Bồi thường 100% giá sách",
        "Mất sách hoàn toàn: Bồi thường 200% giá sách hoặc mua sách mới cùng loại",
        "Nếu độc giả tìm và mang đến cuốn sách giống hệt (cùng tên, tác giả, nhà xuất bản, phiên bản), sẽ được miễn toàn bộ tiền bồi thường"
      ]
    },
    {
      icon: <FileText className="w-8 h-8 text-blue-500" />,
      title: "Viết, vẽ, ghi chú lên sách",
      description: "Làm bẩn, viết lên sách của thư viện",
      penalty: "Phạt 50.000đ - 200.000đ",
      details: [
        "Viết nhẹ bằng bút chì: Phạt 50.000đ",
        "Viết bằng bút mực, gấp góc trang: Phạt 100.000đ",
        "Viết vẽ nhiều, làm hỏng nội dung: Bồi thường như làm hỏng sách"
      ]
    },
    {
      icon: <DollarSign className="w-8 h-8 text-yellow-500" />,
      title: "Không nộp phạt đúng hạn",
      description: "Chậm thanh toán tiền phạt sau khi bị xử lý vi phạm",
      penalty: "Tạm khóa tài khoản cho đến khi thanh toán xong",
      details: [
        "Phải thanh toán trong vòng 7 ngày kể từ khi phát hiện vi phạm",
        "Sau 7 ngày: Tạm khóa tài khoản",
        "Sau 30 ngày: Khóa vĩnh viễn và chuyển xử lý pháp lý (nếu số tiền lớn)"
      ]
    }
  ];

  const generalRules = [
    {
      title: "Giữ gìn sách",
      points: [
        "Không gấp góc, viết vẽ lên sách",
        "Giữ sách sạch sẽ, tránh xa nước và thức ăn",
        "Bảo quản sách ở nơi khô ráo, thoáng mát",
        "Sử dụng bookmark thay vì gấp góc trang"
      ]
    },
    {
      title: "Trách nhiệm bạn đọc",
      points: [
        "Kiểm tra tình trạng sách khi mượn và báo ngay nếu có hỏng hóc",
        "Trả sách đúng hạn hoặc liên hệ gia hạn trước khi hết hạn",
        "Thông báo ngay cho thư viện nếu làm mất hoặc hỏng sách",
        "Chịu trách nhiệm hoàn toàn về sách đã mượn"
      ]
    },
    {
      title: "Quy trình xử lý vi phạm",
      points: [
        "Thư viện sẽ thông báo vi phạm qua email hoặc điện thoại",
        "Bạn đọc có 3 ngày để giải trình hoặc khiếu nại",
        "Sau khi xác định vi phạm, phải thanh toán trong 7 ngày",
        "Có thể khiếu nại lên Ban Giám đốc Thư viện nếu không đồng ý"
      ]
    },
    {
      title: "Quyền lợi bạn đọc",
      points: [
        "Được giải trình và khiếu nại về quyết định xử phạt",
        "Được giảm hoặc miễn phạt trong trường hợp bất khả kháng",
        "Được khôi phục tài khoản sau khi hoàn tất nghĩa vụ",
        "Được hỗ trợ tư vấn về cách bảo quản sách đúng cách"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            to="/"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại trang chủ
          </Link>
          
          <div className="flex items-center mb-4">
            <AlertCircle className="w-10 h-10 text-red-500 mr-3" />
            <h1 className="text-4xl font-bold text-gray-800">
              Quy định và Xử lý Vi phạm
            </h1>
          </div>
          
          <p className="text-gray-600 text-lg">
            Các quy định về mượn, trả sách và mức xử phạt khi vi phạm
          </p>
        </div>

        {/* Violations Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            Các hành vi vi phạm và mức phạt
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {violations.map((violation, index) => (
              <div 
                key={index}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-shadow"
              >
                {/* Icon & Title */}
                <div className="flex items-start mb-4">
                  <div className="flex-shrink-0 mr-4">
                    {violation.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                      {violation.title}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {violation.description}
                    </p>
                  </div>
                </div>

                {/* Penalty */}
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <p className="text-red-700 font-semibold">
                    Mức phạt: {violation.penalty}
                  </p>
                </div>

                {/* Details */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Chi tiết:</p>
                  <ul className="space-y-1">
                    {violation.details.map((detail, idx) => (
                      <li key={idx} className="text-sm text-gray-600 flex items-start">
                        <span className="text-blue-500 mr-2">•</span>
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* General Rules Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            Quy định chung
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {generalRules.map((rule, index) => (
              <div 
                key={index}
                className="bg-white rounded-lg shadow-md p-6"
              >
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                  <Shield className="w-5 h-5 text-blue-600 mr-2" />
                  {rule.title}
                </h3>
                
                <ul className="space-y-2">
                  {rule.points.map((point, idx) => (
                    <li key={idx} className="text-gray-600 flex items-start">
                      <span className="text-green-500 mr-2 mt-1">✓</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>


      </div>
    </div>
  );
}