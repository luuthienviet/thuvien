import { useState, useEffect, useMemo } from 'react';
import { Plus, Edit, Trash2, Search, Image as ImageIcon, X, BookOpen, Library } from 'lucide-react';
import { bookAPI } from '../services/api';

export default function BooksManagement() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showConditionModal, setShowConditionModal] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [selectedBook, setSelectedBook] = useState(null);
  const [previewImage, setPreviewImage] = useState('');
  const [categories, setCategories] = useState([]);
  const [categoryCodeMap, setCategoryCodeMap] = useState({});
  const [activeCategory, setActiveCategory] = useState(null);
  const [conditionForm, setConditionForm] = useState({ normal: 0, damaged: 0, lost: 0 });
  const [formData, setFormData] = useState({
    title: '', author: '', category: '', publisher: '',
    publishYear: '', isbn: '', description: '', coverImage: '',
    quantity: '', available: ''
  });

  useEffect(() => { fetchBooks(); loadCategories(); }, []);

  const loadCategories = () => {
    const stored = localStorage.getItem('bookCategories');
    if (stored) {
      const categoriesData = JSON.parse(stored);
      setCategories(categoriesData.map(cat => cat.name));
      const catMap = {};
      categoriesData.forEach(cat => { catMap[cat.name] = cat.code; });
      setCategoryCodeMap(catMap);
    } else {
      const defaultCategories = [
        { id: '1', name: 'Văn học', code: 'VH' },
        { id: '2', name: 'Khoa học - Kỹ thuật', code: 'KHKT' },
        { id: '3', name: 'Xã hội - Nhân văn', code: 'XHNV' },
        { id: '4', name: 'Giáo dục - Học tập', code: 'GDHT' },
        { id: '5', name: 'Thiếu nhi', code: 'TN' },
        { id: '6', name: 'Kinh tế', code: 'KT' },
        { id: '7', name: 'Lịch sử', code: 'LS' },
        { id: '8', name: 'Tâm lý', code: 'TL' },
        { id: '9', name: 'Kỹ năng sống', code: 'KNS' },
        { id: '10', name: 'Công nghệ', code: 'CN' },
        { id: '11', name: 'Nghệ thuật', code: 'NT' }
      ];
      localStorage.setItem('bookCategories', JSON.stringify(defaultCategories));
      setCategories(defaultCategories.map(cat => cat.name));
      const catMap = {};
      defaultCategories.forEach(cat => { catMap[cat.name] = cat.code; });
      setCategoryCodeMap(catMap);
    }
  };

  const fetchBooks = async () => {
    try {
      const response = await bookAPI.getBooks({ limit: 1000 });
      setBooks(response.data.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // ── Category statistics (memoized) ────────────────────────────────────────
  const categoryStats = useMemo(() => {
    const stats = {};
    books.forEach(book => {
      const cat = book.category || 'Khác';
      if (!stats[cat]) stats[cat] = { titles: 0, totalQty: 0 };
      stats[cat].titles += 1;
      stats[cat].totalQty += Number(book.quantity) || 0;
    });
    return Object.entries(stats)
      .map(([name, s]) => ({ name, ...s }))
      .sort((a, b) => b.totalQty - a.totalQty);
  }, [books]);

  const grandTotal = useMemo(() => ({
    titles: books.length,
    qty: books.reduce((sum, b) => sum + (Number(b.quantity) || 0), 0)
  }), [books]);

  // Color palette for chips (cycles)
  const palettes = [
    { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', bar: 'bg-blue-500' },
    { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', bar: 'bg-emerald-500' },
    { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700', bar: 'bg-violet-500' },
    { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', bar: 'bg-amber-500' },
    { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', bar: 'bg-rose-500' },
    { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-700', bar: 'bg-cyan-500' },
    { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', bar: 'bg-orange-500' },
    { bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-700', bar: 'bg-teal-500' },
    { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700', bar: 'bg-indigo-500' },
    { bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-700', bar: 'bg-pink-500' },
    { bg: 'bg-lime-50', border: 'border-lime-200', text: 'text-lime-700', bar: 'bg-lime-500' },
  ];
  // ─────────────────────────────────────────────────────────────────────────

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const dataToSubmit = { ...formData, available: editingBook ? formData.available : formData.quantity };
      if (editingBook) {
        await bookAPI.updateBook(editingBook._id, dataToSubmit);
      } else {
        await bookAPI.createBook(dataToSubmit);
      }
      setShowModal(false); resetForm(); fetchBooks();
      alert(editingBook ? 'Cập nhật sách thành công!' : 'Thêm sách mới thành công!');
    } catch (error) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Bạn có chắc muốn xóa sách này?')) return;
    try { await bookAPI.deleteBook(id); fetchBooks(); }
    catch (error) { alert(error.response?.data?.message || 'Có lỗi xảy ra'); }
  };

  const handleEdit = (book) => {
    setEditingBook(book); setFormData(book); setPreviewImage(book.coverImage); setShowModal(true);
  };

  const handleOpenConditionModal = (book) => {
    setSelectedBook(book);
    setConditionForm({ normal: book.bookConditions?.normal || 0, damaged: book.bookConditions?.damaged || 0, lost: book.bookConditions?.lost || 0 });
    setShowConditionModal(true);
  };

  const handleUpdateConditions = async () => {
    try {
      await bookAPI.updateConditions(selectedBook._id, conditionForm);
      setShowConditionModal(false); fetchBooks();
      alert('Cập nhật tình trạng sách thành công!');
    } catch (error) { alert(error.response?.data?.message || 'Có lỗi xảy ra'); }
  };

  const resetForm = () => {
    setFormData({ title: '', author: '', category: '', publisher: '', publishYear: '', isbn: '', description: '', coverImage: '', quantity: '', available: '' });
    setEditingBook(null); setPreviewImage('');
  };

  const handleImageUrlChange = (url) => { setFormData({ ...formData, coverImage: url }); setPreviewImage(url); };

  const getInitials = (str) => {
    if (!str) return '';
    const stopWords = ['và', 'của', 'các', 'cho', 'với', 'từ', 'trong', 'về', 'là', 'cơ', 'bản'];
    return str.split(/[\s\-–—]+/).filter(w => w.length > 0 && !stopWords.includes(w.toLowerCase())).map(w => w.charAt(0).toUpperCase()).join('');
  };

  const generateBookCode = (book) => {
    const catCode = categoryCodeMap[book.category] || book.category?.substring(0, 2).toUpperCase() || 'XX';
    return `${catCode}-${book.publishYear || 'YYYY'}-${getInitials(book.title)}`;
  };

  const filteredBooks = books.filter(book => {
    const lower = searchTerm.toLowerCase();
    const catFilter = activeCategory ? book.category === activeCategory : true;
    return catFilter && (book.title.toLowerCase().includes(lower) || generateBookCode(book).toLowerCase().includes(lower));
  });

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Quản lý sách</h1>
        <button
          onClick={() => { resetForm(); loadCategories(); setShowModal(true); }}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5 mr-2" />
          Thêm sách mới
        </button>
      </div>

      {/* Search + Statistics Panel */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6 space-y-5">

        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm theo tên sách hoặc mã sách..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600"
          />
        </div>

        {/* Section header row */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Library className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-semibold text-gray-600 whitespace-nowrap">Thống kê theo thể loại</span>
          </div>
          <div className="flex-1 h-px bg-gray-200" />
          {/* Grand totals */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
            <span className="inline-flex items-center gap-1.5 bg-blue-600 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
              <BookOpen className="w-3.5 h-3.5" />
              {grandTotal.titles} đầu sách
            </span>
            <span className="inline-flex items-center gap-1.5 bg-gray-700 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
              📦 {grandTotal.qty.toLocaleString()} quyển
            </span>
            {activeCategory && (
              <button
                onClick={() => setActiveCategory(null)}
                className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 border border-red-200 rounded-full px-2 py-1"
              >
                <X className="w-3 h-3" /> Bỏ lọc
              </button>
            )}
          </div>
        </div>

        {/* Category chips */}
        {loading ? (
          <div className="flex gap-2 flex-wrap">
            {[1,2,3,4,5].map(i => <div key={i} className="h-16 w-36 rounded-lg bg-gray-100 animate-pulse" />)}
          </div>
        ) : categoryStats.length === 0 ? (
          <p className="text-sm text-gray-400 italic">Chưa có sách nào.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {categoryStats.map((stat, idx) => {
              const p = palettes[idx % palettes.length];
              const isActive = activeCategory === stat.name;
              const pct = grandTotal.qty > 0 ? (stat.totalQty / grandTotal.qty) * 100 : 0;
              return (
                <button
                  key={stat.name}
                  onClick={() => setActiveCategory(isActive ? null : stat.name)}
                  title={`Nhấn để lọc: ${stat.name}`}
                  className={`
                    flex flex-col items-start gap-1 px-3 py-2.5 rounded-lg border transition-all duration-150 min-w-[120px]
                    ${isActive
                      ? `${p.bg} ${p.border} ${p.text} ring-2 ring-offset-1 ring-current shadow`
                      : `${p.bg} ${p.border} ${p.text} hover:shadow-sm hover:scale-[1.02]`
                    }
                  `}
                >
                  {/* Name */}
                  <span className="text-xs font-bold leading-tight text-left truncate max-w-[140px]">
                    {stat.name}
                  </span>
                  {/* Numbers */}
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold">
                      <BookOpen className="w-3 h-3 inline mr-0.5 opacity-70" />
                      {stat.titles} đầu sách
                    </span>
                    <span className="text-gray-300 text-[10px]">|</span>
                    <span className="text-[11px] font-semibold text-gray-500">
                      {stat.totalQty.toLocaleString()} quyển
                    </span>
                  </div>
                  {/* Proportion bar */}
                  <div className="w-full h-1 rounded-full bg-black bg-opacity-10 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${p.bar} opacity-70`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {activeCategory && (
            <div className="px-6 py-2 bg-blue-50 border-b border-blue-100 text-sm text-blue-700 font-medium flex items-center gap-2">
              <span>Đang lọc:</span>
              <span className="font-bold">{activeCategory}</span>
              <span className="text-blue-400">— {filteredBooks.length} đầu sách</span>
            </div>
          )}
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ảnh</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã sách</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thể loại</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tổng SL</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tình trạng</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Còn lại</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBooks.map((book) => (
                <tr key={book._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="w-16 h-20 rounded-lg overflow-hidden shadow-md border border-gray-200">
                      <img src={book.coverImage} alt={book.title}
                        className="w-full h-full object-cover hover:scale-110 transition-transform duration-200"
                        onError={(e) => { e.target.src = 'https://via.placeholder.com/64x80?text=No+Image'; }} />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-mono font-semibold text-indigo-700 tracking-wide">{generateBookCode(book)}</div>
                    <div className="text-xs text-gray-400 mt-0.5 max-w-xs truncate">{book.title}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{book.category}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-semibold">{book.quantity}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button onClick={() => handleOpenConditionModal(book)} className="text-xs text-blue-600 hover:text-blue-800 hover:underline">
                      <div className="flex flex-col items-start">
                        <span className="text-green-600">✓ {book.bookConditions?.normal || 0} bình thường</span>
                        {(book.bookConditions?.damaged > 0) && <span className="text-orange-600">⚠ {book.bookConditions?.damaged} rách</span>}
                        {(book.bookConditions?.lost > 0) && <span className="text-red-600">✗ {book.bookConditions?.lost} mất</span>}
                      </div>
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-semibold ${book.available > 0 ? 'text-green-600' : 'text-red-600'}`}>{book.available}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => handleEdit(book)} className="text-blue-600 hover:text-blue-900 mr-4" title="Chỉnh sửa"><Edit className="w-5 h-5" /></button>
                    <button onClick={() => handleDelete(book._id)} className="text-red-600 hover:text-red-900" title="Xóa"><Trash2 className="w-5 h-5" /></button>
                  </td>
                </tr>
              ))}
              {filteredBooks.length === 0 && (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-400 text-sm">Không tìm thấy sách nào phù hợp.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold">{editingBook ? 'Cập nhật sách' : 'Thêm sách mới'}</h2>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ảnh bìa sách</label>
                  <div className="mb-4">
                    <div className="w-full h-80 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 overflow-hidden">
                      {previewImage ? (
                        <img src={previewImage} alt="Preview" className="w-full h-full object-cover"
                          onError={(e) => { e.target.src = 'https://via.placeholder.com/300x400?text=Invalid+URL'; }} />
                      ) : (
                        <div className="text-center text-gray-400"><ImageIcon className="w-16 h-16 mx-auto mb-2" /><p className="text-sm">Chưa có ảnh</p></div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">URL ảnh bìa</label>
                    <input type="url" value={formData.coverImage} onChange={(e) => handleImageUrlChange(e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input type="text" placeholder="Tên sách *" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} required className="md:col-span-2 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                  <input type="text" placeholder="Tác giả *" value={formData.author} onChange={(e) => setFormData({...formData, author: e.target.value})} required className="md:col-span-2 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                  <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} required className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white">
                    <option value="">-- Chọn thể loại *</option>
                    {categories.map((cat) => (<option key={cat} value={cat}>{cat}</option>))}
                  </select>
                  <input type="text" placeholder="Nhà xuất bản *" value={formData.publisher} onChange={(e) => setFormData({...formData, publisher: e.target.value})} required className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                  <input type="number" placeholder="Năm xuất bản *" value={formData.publishYear} onChange={(e) => setFormData({...formData, publishYear: e.target.value})} required className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                  <input type="text" placeholder="ISBN" value={formData.isbn} onChange={(e) => setFormData({...formData, isbn: e.target.value})} className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                  <input type="number" placeholder="Số lượng *" value={formData.quantity} onChange={(e) => setFormData({...formData, quantity: e.target.value})} required className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                  <textarea placeholder="Mô tả *" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} required rows={4} className="md:col-span-2 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="flex justify-end space-x-4 mt-6 pt-6 border-t">
                <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="px-6 py-2 border rounded-lg hover:bg-gray-100">Hủy</button>
                <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">{editingBook ? 'Cập nhật' : 'Thêm'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Condition Modal */}
      {showConditionModal && selectedBook && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl">
            <div className="border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold">Quản lý tình trạng sách</h2>
              <button onClick={() => setShowConditionModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
            </div>
            <div className="p-6">
              <div className="mb-4 bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">{selectedBook.title}</h3>
                <p className="text-sm text-gray-600">Tổng số lượng: <span className="font-semibold">{selectedBook.quantity}</span> quyển</p>
              </div>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">⚠️ Sách rách/hư hỏng (không cho mượn)</label>
                  <input type="number" min="0" max={selectedBook.quantity - conditionForm.lost} value={conditionForm.damaged}
                    onChange={(e) => { const damaged = Math.min(parseInt(e.target.value)||0, selectedBook.quantity - conditionForm.lost); setConditionForm({ damaged, lost: conditionForm.lost, normal: selectedBook.quantity - damaged - conditionForm.lost }); }}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">❌ Sách mất (không còn)</label>
                  <input type="number" min="0" max={selectedBook.quantity - conditionForm.damaged} value={conditionForm.lost}
                    onChange={(e) => { const lost = Math.min(parseInt(e.target.value)||0, selectedBook.quantity - conditionForm.damaged); setConditionForm({ damaged: conditionForm.damaged, lost, normal: selectedBook.quantity - conditionForm.damaged - lost }); }}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">📗 Sách bình thường <span className="text-gray-400 font-normal">(tự tính)</span></label>
                  <input type="number" value={conditionForm.normal} readOnly className="w-full px-4 py-2 border rounded-lg bg-green-50 border-green-200 text-green-700 font-semibold cursor-not-allowed" />
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h4 className="font-semibold mb-2">Tóm tắt:</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><p className="text-gray-600">Tổng số sách:</p><p className="font-semibold text-lg">{selectedBook.quantity} quyển</p></div>
                  <div><p className="text-gray-600">Còn lại có thể mượn:</p><p className="font-semibold text-lg text-green-600">{selectedBook.quantity - conditionForm.damaged - conditionForm.lost} quyển</p></div>
                  <div className="col-span-2"><p className="text-xs text-gray-500">Công thức: Còn lại = Tổng số ({selectedBook.quantity}) - Rách ({conditionForm.damaged}) - Mất ({conditionForm.lost})</p></div>
                </div>
              </div>
              <div className="flex justify-end space-x-4">
                <button onClick={() => setShowConditionModal(false)} className="px-6 py-2 border rounded-lg hover:bg-gray-100">Hủy</button>
                <button onClick={handleUpdateConditions} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Cập nhật</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
// frontend-admin/pages/BooksManagement.jsx