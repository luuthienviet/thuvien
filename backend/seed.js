const mongoose = require('mongoose');
const User = require('./models/User');
const Book = require('./models/Book');
require('dotenv').config();

const sampleBooks = [
  {
    title: 'Lập trình JavaScript từ cơ bản đến nâng cao',
    author: 'Nguyễn Văn A',
    category: 'Công nghệ',
    publisher: 'NXB Trẻ',
    publishYear: 2023,
    isbn: '978-0-123456-78-9',
    description: 'Sách hướng dẫn lập trình JavaScript từ cơ bản đến nâng cao, phù hợp cho người mới bắt đầu và những người muốn nâng cao kỹ năng.',
    coverImage: 'https://images.unsplash.com/photo-1544256718-3bcf237f3974?w=400',
    quantity: 10,
    available: 10,
    status: 'available'
  },
  {
    title: 'React.js - Xây dựng ứng dụng Web hiện đại',
    author: 'Trần Thị B',
    category: 'Công nghệ',
    publisher: 'NXB Giáo dục',
    publishYear: 2024,
    isbn: '978-0-987654-32-1',
    description: 'Học React.js từ đầu, xây dựng các ứng dụng web hiện đại với React hooks, Context API, và các best practices.',
    coverImage: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400',
    quantity: 15,
    available: 15,
    status: 'available'
  },
  {
    title: 'Node.js Backend Development',
    author: 'Lê Văn C',
    category: 'Công nghệ',
    publisher: 'NXB Đại học Quốc gia',
    publishYear: 2023,
    isbn: '978-0-456789-12-3',
    description: 'Xây dựng backend mạnh mẽ với Node.js, Express, MongoDB và các công nghệ liên quan.',
    coverImage: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400',
    quantity: 8,
    available: 8,
    status: 'available'
  },
  {
    title: 'Đắc Nhân Tâm',
    author: 'Dale Carnegie',
    category: 'Kỹ năng sống',
    publisher: 'NXB Tổng hợp TP.HCM',
    publishYear: 2020,
    isbn: '978-0-147852-96-3',
    description: 'Cuốn sách kinh điển về nghệ thuật giao tiếp và ứng xử, giúp bạn thành công trong cuộc sống.',
    coverImage: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400',
    quantity: 20,
    available: 20,
    status: 'available'
  },
  {
    title: 'Sapiens: Lược sử loài người',
    author: 'Yuval Noah Harari',
    category: 'Lịch sử',
    publisher: 'NXB Văn học',
    publishYear: 2021,
    isbn: '978-0-062316-09-5',
    description: 'Cuốn sách mở mắt về lịch sử loài người từ thời kỳ đồ đá đến thời đại công nghệ.',
    coverImage: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=400',
    quantity: 12,
    available: 12,
    status: 'available'
  },
  {
    title: 'Clean Code - Mã sạch',
    author: 'Robert C. Martin',
    category: 'Công nghệ',
    publisher: 'NXB Lao động',
    publishYear: 2022,
    isbn: '978-0-132350-88-4',
    description: 'Hướng dẫn viết code sạch, dễ đọc, dễ bảo trì cho các lập trình viên.',
    coverImage: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=400',
    quantity: 10,
    available: 10,
    status: 'available'
  },
  {
    title: 'Tâm lý học tội phạm',
    author: 'Nguyễn Thị D',
    category: 'Tâm lý',
    publisher: 'NXB Công an nhân dân',
    publishYear: 2023,
    isbn: '978-0-789456-12-3',
    description: 'Phân tích tâm lý tội phạm, giúp hiểu rõ hơn về hành vi con người.',
    coverImage: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400',
    quantity: 7,
    available: 7,
    status: 'available'
  },
  {
    title: 'Kinh tế học vĩ mô',
    author: 'Phạm Văn E',
    category: 'Kinh tế',
    publisher: 'NXB Thống kê',
    publishYear: 2023,
    isbn: '978-0-321456-78-9',
    description: 'Giáo trình kinh tế học vĩ mô cho sinh viên và người quan tâm đến kinh tế.',
    coverImage: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400',
    quantity: 15,
    available: 15,
    status: 'available'
  },
  {
    title: 'Nghệ thuật nhiếp ảnh',
    author: 'Hoàng Văn F',
    category: 'Nghệ thuật',
    publisher: 'NXB Mỹ thuật',
    publishYear: 2022,
    isbn: '978-0-654321-98-7',
    description: 'Hướng dẫn chụp ảnh từ cơ bản đến nâng cao, các kỹ thuật và bí quyết nhiếp ảnh.',
    coverImage: 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=400',
    quantity: 5,
    available: 5,
    status: 'available'
  },
  {
    title: 'Học Python trong 10 ngày',
    author: 'Vũ Thị G',
    category: 'Công nghệ',
    publisher: 'NXB Khoa học Kỹ thuật',
    publishYear: 2024,
    isbn: '978-0-147852-36-9',
    description: 'Khóa học Python tập trung, giúp bạn nắm vững ngôn ngữ lập trình phổ biến này.',
    coverImage: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400',
    quantity: 18,
    available: 18,
    status: 'available'
  }
];

async function seedDatabase() {
  try {
    console.log('🔄 Đang kết nối MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Đã kết nối MongoDB');

    // Xóa dữ liệu cũ
    console.log('🗑️  Đang xóa dữ liệu cũ...');
    await User.deleteMany({ role: 'admin' });
    await Book.deleteMany({});
    console.log('✅ Đã xóa dữ liệu cũ');

    // Tạo tài khoản Admin
    console.log('👤 Đang tạo tài khoản Admin...');
    const admin = await User.create({
      fullName: 'Administrator',
      email: 'admin@library.com',
      password: 'admin123', // Sẽ tự động hash trong model
      phone: '0123456789',
      address: '123 Đường Admin, Quận 1, TP.HCM',
      role: 'admin',
      status: 'active'
    });
    console.log('✅ Tài khoản Admin đã được tạo:');
    console.log('   📧 Email: admin@library.com');
    console.log('   🔑 Password: admin123');

    // Tạo tài khoản Reader mẫu
    console.log('👥 Đang tạo tài khoản Reader mẫu...');
    const reader = await User.create({
      fullName: 'Nguyễn Văn A',
      email: 'reader@library.com',
      password: 'reader123',
      phone: '0987654321',
      address: '456 Đường Reader, Quận 2, TP.HCM',
      role: 'reader',
      status: 'active'
    });
    console.log('✅ Tài khoản Reader đã được tạo:');
    console.log('   📧 Email: reader@library.com');
    console.log('   🔑 Password: reader123');

    // Thêm sách mẫu
    console.log('📚 Đang thêm sách mẫu...');
    await Book.insertMany(sampleBooks);
    console.log(`✅ Đã thêm ${sampleBooks.length} cuốn sách`);

    console.log('\n🎉 Seed database thành công!');
    console.log('\n📌 Thông tin đăng nhập:');
    console.log('╔════════════════════════════════════════╗');
    console.log('║           ADMIN ACCOUNT                ║');
    console.log('╠════════════════════════════════════════╣');
    console.log('║ Email:    admin@library.com            ║');
    console.log('║ Password: admin123                     ║');
    console.log('╠════════════════════════════════════════╣');
    console.log('║          READER ACCOUNT                ║');
    console.log('╠════════════════════════════════════════╣');
    console.log('║ Email:    reader@library.com           ║');
    console.log('║ Password: reader123                    ║');
    console.log('╚════════════════════════════════════════╝');

    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi khi seed database:', error.message);
    process.exit(1);
  }
}

seedDatabase();