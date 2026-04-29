import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, Tag, BookOpen, Loader2 } from 'lucide-react';
import { bookAPI } from '../services/api';

export default function CategoryManagement() {
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [books, setBooks] = useState([]);
  const [booksLoading, setBooksLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', code: '', description: '' });

  useEffect(() => {
    loadCategories();
    loadBooks();
  }, []);

  const loadCategories = () => {
    const stored = localStorage.getItem('bookCategories');
    if (stored) {
      setCategories(JSON.parse(stored));
    } else {
      const defaultCategories = [
        { id: '1',  name: 'Văn học',             code: 'VH',   description: 'Sách văn học trong và ngoài nước' },
        { id: '2',  name: 'Khoa học - Kỹ thuật', code: 'KHKT', description: 'Sách về khoa học và kỹ thuật' },
        { id: '3',  name: 'Xã hội - Nhân văn',   code: 'XHNV', description: 'Sách về xã hội và nhân văn' },
        { id: '4',  name: 'Giáo dục - Học tập',  code: 'GDHT', description: 'Sách giáo khoa và học tập' },
        { id: '5',  name: 'Thiếu nhi',            code: 'TN',   description: 'Sách dành cho trẻ em' },
        { id: '6',  name: 'Kinh tế',              code: 'KT',   description: 'Sách về kinh tế và kinh doanh' },
        { id: '7',  name: 'Lịch sử',              code: 'LS',   description: 'Sách về lịch sử' },
        { id: '8',  name: 'Tâm lý',               code: 'TL',   description: 'Sách về tâm lý học' },
        { id: '9',  name: 'Kỹ năng sống',         code: 'KNS',  description: 'Sách phát triển bản thân' },
        { id: '10', name: 'Công nghệ',            code: 'CN',   description: 'Sách về công nghệ' },
        { id: '11', name: 'Nghệ thuật',           code: 'NT',   description: 'Sách về nghệ thuật' },
      ];
      localStorage.setItem('bookCategories', JSON.stringify(defaultCategories));
      setCategories(defaultCategories);
    }
  };

  const loadBooks = async () => {
    setBooksLoading(true);
    try {
      const response = await bookAPI.getBooks({ limit: 1000 });
      const raw = response.data;
      const list = Array.isArray(raw) ? raw : (raw.data || raw.books || []);
      setBooks(list);
    } catch (err) {
      console.warn('Không thể tải sách từ API:', err.message);
      setBooks([]);
    } finally {
      setBooksLoading(false);
    }
  };

  const getBooksForCategory = (categoryName) =>
    books.filter(b => {
      const cat = typeof b.category === 'object' ? b.category?.name : b.category;
      return cat === categoryName;
    });

  const saveCategories = (newCategories) => {
    localStorage.setItem('bookCategories', JSON.stringify(newCategories));
    setCategories(newCategories);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingCategory) {
      saveCategories(categories.map(cat =>
        cat.id === editingCategory.id ? { ...formData, id: editingCategory.id } : cat
      ));
    } else {
      saveCategories([...categories, { ...formData, id: Date.now().toString() }]);
    }
    setShowModal(false);
    resetForm();
  };

  const handleDelete = (id, e) => {
    e.stopPropagation();
    if (!confirm('Bạn có chắc muốn xóa thể loại này?')) return;
    saveCategories(categories.filter(cat => cat.id !== id));
    if (selectedCategory?.id === id) setSelectedCategory(null);
  };

  const handleEdit = (category, e) => {
    e.stopPropagation();
    setEditingCategory(category);
    setFormData({ name: category.name, code: category.code, description: category.description || '' });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({ name: '', code: '', description: '' });
    setEditingCategory(null);
  };

  const sortedCategories = [...categories].sort((a, b) => a.name.localeCompare(b.name, 'vi'));

  const grouped = sortedCategories.reduce((acc, cat) => {
    const first = cat.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').charAt(0).toUpperCase();
    if (!acc[first]) acc[first] = [];
    acc[first].push(cat);
    return acc;
  }, {});

  const letters = Object.keys(grouped).sort();

  const tagColors = [
    { bg: 'bg-blue-50',    border: 'border-blue-200',    text: 'text-blue-700',    code: 'text-blue-400',    hover: 'hover:bg-blue-100 hover:border-blue-400',       active: 'bg-blue-600 border-blue-600 text-white' },
    { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', code: 'text-emerald-400', hover: 'hover:bg-emerald-100 hover:border-emerald-400', active: 'bg-emerald-600 border-emerald-600 text-white' },
    { bg: 'bg-violet-50',  border: 'border-violet-200',  text: 'text-violet-700',  code: 'text-violet-400',  hover: 'hover:bg-violet-100 hover:border-violet-400',   active: 'bg-violet-600 border-violet-600 text-white' },
    { bg: 'bg-amber-50',   border: 'border-amber-200',   text: 'text-amber-700',   code: 'text-amber-400',   hover: 'hover:bg-amber-100 hover:border-amber-400',     active: 'bg-amber-500 border-amber-500 text-white' },
    { bg: 'bg-rose-50',    border: 'border-rose-200',    text: 'text-rose-700',    code: 'text-rose-400',    hover: 'hover:bg-rose-100 hover:border-rose-400',       active: 'bg-rose-600 border-rose-600 text-white' },
    { bg: 'bg-cyan-50',    border: 'border-cyan-200',    text: 'text-cyan-700',    code: 'text-cyan-400',    hover: 'hover:bg-cyan-100 hover:border-cyan-400',       active: 'bg-cyan-600 border-cyan-600 text-white' },
  ];

  const categoryColorMap = {};
  sortedCategories.forEach((cat, i) => { categoryColorMap[cat.id] = i; });

  const getCategoryColor = (id) => tagColors[categoryColorMap[id] % tagColors.length];

  const drawerData = selectedCategory ? (() => {
    const catBooks = getBooksForCategory(selectedCategory.name);
    const total = catBooks.reduce((s, b) => s + (b.quantity || 0), 0);
    return { catBooks, total, color: getCategoryColor(selectedCategory.id) };
  })() : null;

  return (
    <>
      <div className="p-8 min-h-screen bg-gray-50">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quản lý thể loại sách</h1>
            <p className="text-gray-500 mt-1">Quản lý danh mục thể loại cho hệ thống thư viện</p>
          </div>
          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            className="flex items-center px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm font-medium"
          >
            <Plus className="w-4 h-4 mr-2" />
            Thêm thể loại
          </button>
        </div>

        {/* Summary */}
        <p className="text-sm text-gray-500 mb-6">
          Tổng <strong className="text-gray-700">{categories.length}</strong> thể loại
        </p>

        {/* Categories grouped by letter */}
        {letters.length === 0 ? (
          <div className="text-center py-20">
            <Tag className="w-14 h-14 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400">Chưa có thể loại nào</p>
          </div>
        ) : (
          <div className="space-y-6">
            {letters.map((letter) => (
              <div key={letter}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest w-6 text-center">{letter}</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>
                <div className="flex flex-wrap gap-2 pl-9">
                  {grouped[letter].map((category) => {
                    const color = getCategoryColor(category.id);
                    const isSelected = selectedCategory?.id === category.id;
                    return (
                      <div key={category.id} className="relative group">
                        <button
                          onClick={() => setSelectedCategory(isSelected ? null : category)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-150 text-sm font-medium
                            ${isSelected
                              ? `${color.active} shadow-md scale-105`
                              : `${color.bg} ${color.border} ${color.text} ${color.hover}`
                            }`}
                        >
                          <Tag className="w-3.5 h-3.5 opacity-70" />
                          <span>{category.name}</span>
                          <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${isSelected ? 'bg-white/20 text-white' : `bg-white/60 ${color.code}`}`}>
                            {category.code}
                          </span>
                        </button>
                        <div className="absolute -top-2 -right-2 hidden group-hover:flex gap-1 z-10">
                          <button
                            onClick={(e) => handleEdit(category, e)}
                            className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600 shadow-sm"
                            title="Chỉnh sửa"
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => handleDelete(category.id, e)}
                            className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow-sm"
                            title="Xóa"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Category Detail Modal */}
      {selectedCategory && drawerData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden">
            <div className={`${drawerData.color.bg} border-b ${drawerData.color.border} px-6 py-4 flex items-center justify-between`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${drawerData.color.active}`}>
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className={`font-bold text-lg ${drawerData.color.text}`}>{selectedCategory.name}</h3>
                  {selectedCategory.description && (
                    <p className="text-xs text-gray-500">{selectedCategory.description}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-xs text-gray-500">Số đầu sách</p>
                  <p className={`text-2xl font-bold ${drawerData.color.text}`}>{drawerData.catBooks.length}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Tổng số cuốn</p>
                  <p className={`text-2xl font-bold ${drawerData.color.text}`}>{drawerData.total}</p>
                </div>
                <button
                  onClick={() => setSelectedCategory(null)}
                  className="ml-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {booksLoading ? (
                <div className="py-12 text-center text-gray-400">
                  <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin opacity-40" />
                  <p className="text-sm">Đang tải sách...</p>
                </div>
              ) : drawerData.catBooks.length === 0 ? (
                <div className="py-12 text-center text-gray-400">
                  <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Chưa có sách nào trong thể loại này</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {drawerData.catBooks.map((book, i) => (
                    <div key={book._id} className="flex items-center px-6 py-3 hover:bg-gray-50 transition-colors">
                      <span className="text-xs text-gray-400 w-6 font-mono">{i + 1}</span>
                      <div className="flex-1 ml-3">
                        <p className="text-sm font-medium text-gray-800">{book.title}</p>
                        {book.author && <p className="text-xs text-gray-400">{book.author}</p>}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-gray-500">Số lượng:</span>
                        <span className={`text-sm font-bold ${drawerData.color.text} bg-white px-2.5 py-0.5 rounded-full border ${drawerData.color.border}`}>
                          {book.quantity || 0}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t px-6 py-3 flex justify-end bg-gray-50">
              <button
                onClick={() => setSelectedCategory(null)}
                className="px-5 py-2 border rounded-xl hover:bg-gray-100 text-sm font-medium text-gray-600 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">
                {editingCategory ? 'Cập nhật thể loại' : 'Thêm thể loại mới'}
              </h2>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Tên thể loại *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="VD: Văn học"
                  required
                  className="w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Mã thể loại *</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="VD: VH"
                  required
                  maxLength={10}
                  className="w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                />
                <p className="text-xs text-gray-400 mt-1">Dùng cho mã sách (tối đa 10 ký tự)</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Mô tả</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Mô tả về thể loại này..."
                  rows={3}
                  className="w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="px-5 py-2 border rounded-xl hover:bg-gray-50 text-sm font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 text-sm font-medium"
                >
                  {editingCategory ? 'Cập nhật' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
// frontend-admin/pages/CategoryManagement.jsx