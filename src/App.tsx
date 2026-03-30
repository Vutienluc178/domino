/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutGrid, 
  Wand2, 
  Library, 
  BookOpen, 
  Plus, 
  Trash2, 
  Download, 
  Printer, 
  FileSpreadsheet, 
  Image as ImageIcon,
  ChevronRight,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';

// Types
type GameType = 'domino' | 'matching' | 'triangle';
type DominoTheme = 'classic' | 'neon' | 'nature' | 'luxury';

interface GameData {
  q: string;
  a: string;
}

type View = 'creator' | 'prompt' | 'library' | 'guide';

export default function App() {
  const [activeView, setActiveView] = useState<View>('creator');
  const [gameType, setGameType] = useState<GameType>('domino');
  const [dominoTheme, setDominoTheme] = useState<DominoTheme>('classic');
  const [data, setData] = useState<GameData[]>([{ q: '', a: '' }]);
  const [bgImage, setBgImage] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<'student' | 'answer'>('answer');
  
  // AI Prompt State
  const [promptInfo, setPromptInfo] = useState({
    role: 'Chuyên gia giáo dục',
    grade: '',
    subject: '',
    topic: '',
    level: 'Cơ bản',
    count: '10',
    extra: ''
  });

  const [copied, setCopied] = useState(false);

  const printRef = useRef<HTMLDivElement>(null);

  // Navigation Items
  const navItems = [
    { id: 'creator', label: 'Công cụ tạo game', icon: LayoutGrid },
    { id: 'prompt', label: 'AI Prompt', icon: Wand2 },
    { id: 'library', label: 'Thư viện ý tưởng', icon: Library },
    { id: 'guide', label: 'Hướng dẫn', icon: BookOpen },
  ];

  // Logic for Game Generation
  const handleAddRow = () => setData([...data, { q: '', a: '' }]);
  const handleRemoveRow = (index: number) => {
    const newData = [...data];
    newData.splice(index, 1);
    setData(newData);
  };
  const handleUpdateData = (index: number, field: keyof GameData, value: string) => {
    const newData = [...data];
    newData[index][field] = value;
    setData(newData);
  };

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const excelData = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
      
      const formattedData: GameData[] = excelData
        .filter(row => row[0] || row[1])
        .map(row => ({
          q: String(row[0] || ''),
          a: String(row[1] || '')
        }));
      
      if (formattedData.length > 0) setData(formattedData);
    };
    reader.readAsBinaryString(file);
  };

  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => setBgImage(evt.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPNG = async () => {
    if (!printRef.current) return;
    const pages = printRef.current.querySelectorAll('.game-page');
    if (pages.length > 0) {
      for (let i = 0; i < pages.length; i++) {
        await exportToImage(pages[i] as HTMLElement, `game-${gameType}-page-${i + 1}-${Date.now()}`);
      }
    } else {
      await exportToImage(printRef.current, `game-${gameType}-${Date.now()}`);
    }
  };

  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      { "Câu hỏi/Vế 1": "Ví dụ: 1 + 1", "Đáp án/Vế 2": "2" },
      { "Câu hỏi/Vế 1": "Ví dụ: Thủ đô Việt Nam", "Đáp án/Vế 2": "Hà Nội" }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "EduGame_Template.xlsx");
  };

  // MathJax re-render
  useEffect(() => {
    if ((window as any).MathJax) {
      (window as any).MathJax.typesetPromise?.();
    }
  }, [data, activeView, previewMode, gameType]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <style>
        {`
          @media print {
            @page {
              size: ${gameType === 'triangle' ? 'A4 landscape' : 'A4 portrait'};
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
              background: white;
            }
            #game-canvas {
              width: ${gameType === 'triangle' ? '297mm' : '210mm'} !important;
              padding: 0 !important;
              box-shadow: none !important;
              transform: none !important;
              margin: 0 !important;
              background: white !important;
            }
            .game-page {
              width: ${gameType === 'triangle' ? '297mm' : '210mm'} !important;
              height: ${gameType === 'triangle' ? '210mm' : '297mm'} !important;
              padding: 15mm !important;
              page-break-after: always !important;
              break-after: page !important;
              display: flex !important;
              flex-direction: column !important;
              background: white !important;
            }
            .no-print {
              display: none !important;
            }
          }
        `}
      </style>
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <LayoutGrid size={22} />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight text-slate-800 leading-none">EduGame <span className="text-indigo-600">Creator</span></h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Professional Edition</p>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id as View)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 ${
                  activeView === item.id 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100 font-semibold' 
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                }`}
              >
                <item.icon size={18} />
                <span className="text-sm">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-4 md:p-8">
        <AnimatePresence mode="wait">
          {activeView === 'creator' && (
            <motion.div
              key="creator"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              {/* Left Panel: Controls */}
              <div className="lg:col-span-4 space-y-6">
                <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                  <h2 className="text-base font-black mb-5 flex items-center gap-2 text-slate-800 uppercase tracking-tight">
                    <LayoutGrid size={18} className="text-indigo-600" />
                    Thiết lập trò chơi
                  </h2>
                  
                  <div className="space-y-5">
                    <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                      <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">Loại trò chơi</p>
                      <select 
                        value={gameType}
                        onChange={(e) => setGameType(e.target.value as GameType)}
                        className="w-full bg-transparent font-black text-indigo-900 outline-none cursor-pointer"
                      >
                        <option value="domino">Domino Tiếp Sức</option>
                        <option value="matching">Thẻ Ghép Cặp (Memory)</option>
                        <option value="triangle">Domino Tam Giác</option>
                      </select>
                      <p className="text-[10px] text-indigo-400 mt-1 italic">* Tự động co giãn chữ để vừa ô</p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Phong cách Domino</label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: 'classic', label: 'Cổ điển', color: 'bg-slate-100' },
                          { id: 'neon', label: 'Neon Đêm', color: 'bg-slate-900' },
                          { id: 'nature', label: 'Tự nhiên', color: 'bg-emerald-100' },
                          { id: 'luxury', label: 'Sang trọng', color: 'bg-amber-100' }
                        ].map(theme => (
                          <button
                            key={theme.id}
                            onClick={() => setDominoTheme(theme.id as DominoTheme)}
                            className={`flex items-center gap-2 p-2 rounded-xl border-2 transition-all ${
                              dominoTheme === theme.id 
                                ? 'border-indigo-600 bg-indigo-50' 
                                : 'border-slate-100 hover:border-slate-200 bg-white'
                            }`}
                          >
                            <div className={`w-4 h-4 rounded-full ${theme.color} border border-slate-200`} />
                            <span className="text-xs font-bold text-slate-700">{theme.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Ảnh nền (Tùy chọn)</label>
                      <div className="flex items-center gap-2">
                        <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-all group">
                          <ImageIcon size={18} className="text-slate-400 group-hover:text-indigo-500" />
                          <span className="text-sm text-slate-500 group-hover:text-indigo-600 font-medium">Tải ảnh lên</span>
                          <input type="file" className="hidden" accept="image/*" onChange={handleBgUpload} />
                        </label>
                        {bgImage && (
                          <button 
                            onClick={() => setBgImage(null)}
                            className="p-3 text-red-500 hover:bg-red-50 rounded-2xl border border-red-100 transition-all"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </section>

                <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-base font-black flex items-center gap-2 text-slate-800 uppercase tracking-tight">
                      <FileSpreadsheet size={18} className="text-indigo-600" />
                      Dữ liệu câu hỏi
                    </h2>
                    <div className="flex gap-2">
                      <button 
                        onClick={handleDownloadTemplate}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                        title="Tải file mẫu"
                      >
                        <Download size={16} />
                      </button>
                      <label className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-indigo-100 uppercase tracking-widest transition-all">
                        Excel
                        <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleExcelUpload} />
                      </label>
                    </div>
                  </div>

                  <div className="max-h-[350px] overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                    {data.map((item, idx) => (
                      <div key={idx} className="group relative p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:bg-white transition-all shadow-sm hover:shadow-md">
                        <div className="grid grid-cols-1 gap-3">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-slate-300 w-4">Q</span>
                            <input 
                              placeholder="Câu hỏi..."
                              value={item.q}
                              onChange={(e) => handleUpdateData(idx, 'q', e.target.value)}
                              className="w-full px-0 py-1 bg-transparent border-b border-slate-200 text-sm focus:border-indigo-500 outline-none transition-all"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-indigo-300 w-4">A</span>
                            <input 
                              placeholder="Đáp án..."
                              value={item.a}
                              onChange={(e) => handleUpdateData(idx, 'a', e.target.value)}
                              className="w-full px-0 py-1 bg-transparent border-b border-slate-200 text-sm focus:border-indigo-500 outline-none transition-all"
                            />
                          </div>
                        </div>
                        <button 
                          onClick={() => handleRemoveRow(idx)}
                          className="absolute top-2 right-2 p-1.5 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button 
                    onClick={handleAddRow}
                    className="w-full mt-5 flex items-center justify-center gap-2 py-3 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all font-bold text-sm"
                  >
                    <Plus size={18} />
                    Thêm dòng mới
                  </button>
                </section>

                {/* Pedagogical Tips Section */}
                <section className="bg-indigo-900 p-6 rounded-3xl shadow-xl text-white">
                  <h3 className="text-sm font-black mb-4 flex items-center gap-2 uppercase tracking-widest text-indigo-300">
                    <Info size={16} />
                    Gợi ý sư phạm
                  </h3>
                  <ul className="space-y-3">
                    {PEDAGOGICAL_TIPS[gameType].map((tip, i) => (
                      <li key={i} className="text-xs flex gap-3 leading-relaxed opacity-90">
                        <ChevronRight size={14} className="shrink-0 text-indigo-400" />
                        {tip}
                      </li>
                    ))}
                  </ul>
                </section>
              </div>

              {/* Right Panel: Preview */}
              <div className="lg:col-span-8 space-y-6">
                <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex bg-slate-100 p-1 rounded-2xl">
                    <button 
                      onClick={() => setPreviewMode('answer')}
                      className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                        previewMode === 'answer' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'
                      }`}
                    >
                      Đáp Án
                    </button>
                    <button 
                      onClick={() => setPreviewMode('student')}
                      className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                        previewMode === 'student' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'
                      }`}
                    >
                      Học Sinh
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <button 
                      onClick={handlePrint}
                      className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 text-white rounded-2xl hover:bg-slate-900 transition-all shadow-lg shadow-slate-200 font-bold text-sm"
                    >
                      <Printer size={18} />
                      <span className="hidden sm:inline">In trang</span>
                    </button>
                    <button 
                      onClick={handleDownloadPNG}
                      className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 font-bold text-sm"
                    >
                      <Download size={18} />
                      <span className="hidden sm:inline">Xuất ảnh HD</span>
                    </button>
                  </div>
                </div>

                {/* Preview Area */}
                <div className="bg-slate-200 p-4 md:p-10 rounded-[2rem] overflow-x-auto min-h-[700px] flex justify-center shadow-inner">
                  <div 
                    ref={printRef}
                    className={`bg-white shadow-2xl origin-top transform scale-[0.6] sm:scale-[0.8] md:scale-100 ${
                      gameType === 'triangle' ? 'w-[297mm]' : 'w-[210mm]'
                    }`}
                    id="game-canvas"
                  >
                    <GameRenderer type={gameType} data={data} mode={previewMode} bgImage={bgImage} theme={dominoTheme} />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeView === 'prompt' && (
            <motion.div
              key="prompt"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-4xl mx-auto"
            >
              <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center">
                    <Wand2 size={28} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800">AI Prompt Generator Pro</h2>
                    <p className="text-slate-500">Tạo câu lệnh tối ưu để nhận dữ liệu chất lượng cao từ AI</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-semibold text-slate-700">Vai trò của AI</label>
                    <select 
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                      value={promptInfo.role}
                      onChange={(e) => setPromptInfo({...promptInfo, role: e.target.value})}
                    >
                      <option value="Chuyên gia giáo dục">Chuyên gia giáo dục</option>
                      <option value="Giáo viên bộ môn">Giáo viên bộ môn (Chung)</option>
                      <option value="Giáo viên bộ môn Toán">Giáo viên bộ môn Toán</option>
                      <option value="Giáo viên bộ môn Vật lý">Giáo viên bộ môn Vật lý</option>
                      <option value="Giáo viên bộ môn Hóa học">Giáo viên bộ môn Hóa học</option>
                      <option value="Giáo viên bộ môn Tiếng Anh">Giáo viên bộ môn Tiếng Anh</option>
                      <option value="Giáo viên bộ môn Sinh học">Giáo viên bộ môn Sinh học</option>
                      <option value="Giáo viên bộ môn Lịch sử">Giáo viên bộ môn Lịch sử</option>
                      <option value="Giáo viên bộ môn Địa lý">Giáo viên bộ môn Địa lý</option>
                      <option value="Giáo viên bộ môn Ngữ văn">Giáo viên bộ môn Ngữ văn</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      Khối lớp <span className="text-xs font-normal text-slate-400">(Ví dụ: Lớp 10, Đại học)</span>
                    </label>
                    <input 
                      type="text" 
                      placeholder="Ví dụ: Lớp 10"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                      value={promptInfo.grade}
                      onChange={(e) => setPromptInfo({...promptInfo, grade: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      Môn học <span className="text-xs font-normal text-slate-400">(Ví dụ: Vật lý, Tiếng Anh)</span>
                    </label>
                    <input 
                      type="text" 
                      placeholder="Ví dụ: Toán học"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                      value={promptInfo.subject}
                      onChange={(e) => setPromptInfo({...promptInfo, subject: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      Chủ đề cụ thể <span className="text-xs font-normal text-slate-400">(Càng chi tiết kết quả càng tốt)</span>
                    </label>
                    <input 
                      type="text" 
                      placeholder="Ví dụ: Định luật bảo toàn năng lượng, Câu điều kiện loại 1"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                      value={promptInfo.topic}
                      onChange={(e) => setPromptInfo({...promptInfo, topic: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Mức độ nhận thức</label>
                    <select 
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                      value={promptInfo.level}
                      onChange={(e) => setPromptInfo({...promptInfo, level: e.target.value})}
                    >
                      <option>Nhận biết (Dễ)</option>
                      <option>Thông hiểu (Trung bình)</option>
                      <option>Vận dụng (Khó)</option>
                      <option>Vận dụng cao (Rất khó)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Số lượng cặp dữ liệu</label>
                    <input 
                      type="number" 
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                      value={promptInfo.count}
                      onChange={(e) => setPromptInfo({...promptInfo, count: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      Yêu cầu bổ sung <span className="text-xs font-normal text-slate-400">(Tùy chọn: ngôn ngữ, định dạng số...)</span>
                    </label>
                    <textarea 
                      placeholder="Ví dụ: Sử dụng Tiếng Anh, không dùng số thập phân, tập trung vào các hằng số vật lý..."
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none h-24 resize-none"
                      value={(promptInfo as any).extra || ''}
                      onChange={(e) => setPromptInfo({...promptInfo, extra: e.target.value} as any)}
                    />
                  </div>
                </div>

                <div className="bg-slate-900 rounded-2xl p-6 relative group">
                  <div className="absolute top-4 right-4 transition-all">
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(generateAIPrompt(promptInfo));
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className={`px-4 py-2 text-white text-sm font-semibold rounded-xl shadow-lg transition-all ${copied ? 'bg-green-600' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                    >
                      {copied ? 'Đã sao chép!' : 'Sao chép câu lệnh'}
                    </button>
                  </div>
                  <div className="text-indigo-300 text-sm font-mono leading-relaxed overflow-x-auto">
                    <pre className="whitespace-pre-wrap">{generateAIPrompt(promptInfo)}</pre>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
                  <Info className="text-amber-500 shrink-0" size={20} />
                  <div className="text-sm text-amber-800">
                    <p className="font-bold mb-1">Mẹo để có kết quả tốt nhất:</p>
                    <ul className="list-disc list-inside space-y-1 opacity-90">
                      <li>Hãy cung cấp 1-2 ví dụ mẫu trong phần "Yêu cầu bổ sung".</li>
                      <li>Yêu cầu AI xuất dữ liệu dưới dạng bảng để dễ dàng copy vào Excel.</li>
                      <li>Nếu dùng MathJax, hãy nhắc AI: "Sử dụng dấu $ bao quanh công thức LaTeX".</li>
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeView === 'library' && (
            <motion.div
              key="library"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              <LibraryCard 
                title="Domino Tiếp Sức" 
                desc="Học sinh ghép nối vế A của thẻ này với vế B của thẻ kia để tạo thành một chuỗi khép kín."
                image="https://picsum.photos/seed/domino/400/250"
              />
            </motion.div>
          )}

          {activeView === 'guide' && (
            <motion.div
              key="guide"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="max-w-5xl mx-auto space-y-8"
            >
              {/* Organization Guide */}
              <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
                <h2 className="text-2xl font-black mb-6 flex items-center gap-3 text-slate-800 uppercase tracking-tight">
                  <LayoutGrid className="text-indigo-600" />
                  Hướng dẫn tổ chức trò chơi
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center font-black mb-4">01</div>
                    <h3 className="font-bold mb-2">Chuẩn bị</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">In bộ thẻ ra giấy cứng (hoặc ép plastic). Cắt rời các thẻ theo đường nét đứt. Mỗi nhóm 2-4 HS nhận 1 bộ.</p>
                  </div>
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center font-black mb-4">02</div>
                    <h3 className="font-bold mb-2">Luật chơi</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">HS tìm thẻ "BẮT ĐẦU". Sau đó tìm thẻ có vế trái khớp với vế phải của thẻ trước đó. Cứ thế cho đến khi khép kín.</p>
                  </div>
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center font-black mb-4">03</div>
                    <h3 className="font-bold mb-2">Kiểm tra</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">Giáo viên sử dụng "Phiên bản đáp án" để đối chiếu nhanh. Nhóm nào hoàn thành đúng và nhanh nhất sẽ thắng.</p>
                  </div>
                </div>
              </section>

              {/* Active Learning Scenarios */}
              <section className="bg-indigo-900 p-8 rounded-3xl shadow-xl text-white">
                <h2 className="text-2xl font-black mb-8 flex items-center gap-3 uppercase tracking-tight">
                  <Wand2 className="text-indigo-400" />
                  5 Kịch bản dạy học tích cực
                </h2>
                <div className="space-y-4">
                  {[
                    { title: "Cuộc đua tiếp sức", desc: "Chia lớp thành các đội. Mỗi đội cử 1 đại diện lên ghép 1 thẻ rồi chạy về đập tay người tiếp theo. Tăng tính vận động và hào hứng." },
                    { title: "Trạm học tập xoay vòng", desc: "Đặt các bộ Domino khác nhau ở các trạm. Sau 5-7 phút, các nhóm di chuyển sang trạm tiếp theo. Giúp ôn tập đa dạng kiến thức." },
                    { title: "Mảnh ghép chuyên gia", desc: "Mỗi thành viên trong nhóm chịu trách nhiệm tìm hiểu 1 phần kiến thức, sau đó cả nhóm cùng ghép bộ Domino tổng hợp." },
                    { title: "Thử thách ngược", desc: "Phát bộ Domino đã ghép sẵn nhưng có 2-3 chỗ sai. Yêu cầu HS phát hiện và sửa lại cho đúng. Rèn luyện tư duy phản biện." },
                    { title: "Học sinh làm chủ", desc: "Yêu cầu HS tự thiết kế nội dung Domino cho chương vừa học, sau đó trao đổi bộ thẻ giữa các nhóm để giải đố lẫn nhau." }
                  ].map((s, i) => (
                    <div key={i} className="flex gap-4 p-4 bg-white/10 rounded-2xl border border-white/10 hover:bg-white/20 transition-all">
                      <div className="text-2xl font-black text-indigo-400">0{i+1}</div>
                      <div>
                        <h3 className="font-bold text-lg">{s.title}</h3>
                        <p className="text-sm text-indigo-100/80 mt-1">{s.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* MathJax Guide */}
              <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <BookOpen className="text-indigo-600" />
                  Hướng dẫn sử dụng MathJax
                </h2>
              
              <div className="prose prose-slate max-w-none space-y-6">
                <div className="bg-blue-50 p-4 rounded-xl border-l-4 border-blue-500 flex gap-3">
                  <Info className="text-blue-500 shrink-0" />
                  <p className="text-sm text-blue-800">
                    Để hiển thị công thức toán học, hãy đặt mã LaTeX giữa hai ký hiệu đô la <code>$</code>. 
                    Ví dụ: <code>{'$x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$'}</code>
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h3 className="font-bold text-lg">Các ký hiệu phổ biến</h3>
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-2 text-left">Mô tả</th>
                          <th className="px-4 py-2 text-left">Mã LaTeX</th>
                          <th className="px-4 py-2 text-left">Kết quả</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        <tr>
                          <td className="px-4 py-2">Phân số</td>
                          <td className="px-4 py-2"><code>{'\\frac{1}{2}'}</code></td>
                          <td className="px-4 py-2">{'$\\frac{1}{2}$'}</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2">Số mũ</td>
                          <td className="px-4 py-2"><code>{'x^2'}</code></td>
                          <td className="px-4 py-2">{'$x^2$'}</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2">Căn bậc hai</td>
                          <td className="px-4 py-2"><code>{'\\sqrt{x}'}</code></td>
                          <td className="px-4 py-2">{'$\\sqrt{x}$'}</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2">Nhân/Chia</td>
                          <td className="px-4 py-2"><code>{'\\times, \\div'}</code></td>
                          <td className="px-4 py-2">{'$\\times, \\div$'}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-bold text-lg">Lưu ý quan trọng</h3>
                    <ul className="list-disc list-inside text-sm text-slate-600 space-y-2">
                      <li>Không nên viết công thức quá dài trên một dòng để tránh tràn khung game.</li>
                      <li>Sử dụng <code>{`\\text{...}`}</code> nếu muốn viết chữ tiếng Việt có dấu trong công thức.</li>
                      <li>Kiểm tra kỹ các dấu đóng mở ngoặc nhọn <code>{'{ }'}</code>.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>
          </motion.div>
        )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="mt-12 py-8 border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-slate-400 text-sm">© 2026 EduGame Creator. Thiết kế cho giáo dục hiện đại.</p>
        </div>
      </footer>
    </div>
  );
}

// --- Helper Components ---

// --- Expert Components & Logic ---

/**
 * Pedagogical Tips for Teachers
 */
const PEDAGOGICAL_TIPS: Record<GameType, string[]> = {
  domino: [
    "Khuyến khích học sinh làm việc theo nhóm 2-4 người.",
    "Sử dụng để ôn tập từ vựng, công thức hoặc các mốc lịch sử.",
    "Mẹo: Hãy in trên giấy màu khác nhau cho mỗi nhóm để tránh nhầm lẫn.",
    "Học sinh cần tìm thẻ có Đáp án khớp với Câu hỏi của thẻ trước đó."
  ],
  matching: [
    "Phù hợp cho các cặp khái niệm - định nghĩa hoặc hình ảnh - tên gọi.",
    "Có thể dùng làm trò chơi khởi động nhanh trong 5 phút.",
    "Mẹo: Úp các thẻ xuống để chơi như trò chơi trí nhớ (Memory Game).",
    "Học sinh cần tìm cặp thẻ có nội dung tương ứng với nhau."
  ],
  triangle: [
    "Tăng độ khó so với Domino truyền thống vì mỗi thẻ có 3 cạnh ghép.",
    "Yêu cầu học sinh quan sát đa chiều và tư duy logic cao hơn.",
    "Mẹo: Bắt đầu từ các thẻ ở góc hoặc thẻ có nội dung dễ nhận biết.",
    "Học sinh ghép các cạnh của tam giác sao cho nội dung khớp nhau."
  ]
};

/**
 * High-Quality Export Utility
 */
const exportToImage = async (element: HTMLElement, fileName: string) => {
  try {
    const canvas = await html2canvas(element, {
      scale: 3, // Higher scale for professional printing (300 DPI approx)
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      onclone: (clonedDoc) => {
        // Ensure MathJax is fully rendered in the clone if needed
        const el = clonedDoc.getElementById('game-canvas');
        if (el) el.style.transform = 'scale(1)';
      }
    });
    
    const link = document.createElement('a');
    link.download = `${fileName}.png`;
    link.href = canvas.toDataURL('image/png', 1.0);
    link.click();
  } catch (err) {
    console.error("Export failed:", err);
    alert("Có lỗi xảy ra khi xuất ảnh. Vui lòng thử lại.");
  }
};

/**
 * Auto-fit text component to prevent overflow
 */
const AutoFitText = ({ text, className = "", maxFontSize = 12 }: { text: string, className?: string, maxFontSize?: number }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    
    // Reset to default
    container.style.fontSize = `${maxFontSize}px`;
    
    let currentSize = maxFontSize;
    // Heuristic for long text
    if (text.length > 40) currentSize = Math.min(maxFontSize, 10);
    if (text.length > 80) currentSize = Math.min(maxFontSize, 8);
    if (text.length > 120) currentSize = Math.min(maxFontSize, 7);
    if (text.length > 160) currentSize = Math.min(maxFontSize, 6);
    
    container.style.fontSize = `${currentSize}px`;

    // Check for actual overflow and shrink further if needed
    const checkOverflow = () => {
      let size = currentSize;
      while (
        (container.scrollHeight > container.clientHeight || container.scrollWidth > container.clientWidth) && 
        size > 5
      ) {
        size -= 0.5;
        container.style.fontSize = `${size}px`;
      }
    };

    // Delay slightly to allow MathJax or layout to settle
    const timer = setTimeout(checkOverflow, 50);
    return () => clearTimeout(timer);
  }, [text]);

  return (
    <div ref={containerRef} className={`w-full h-full flex items-center justify-center p-1 text-center overflow-hidden ${className}`}>
      <span className="game-content-text leading-tight">{text}</span>
    </div>
  );
};

/**
 * Domino Component
 */
const DominoGame = ({ data, mode, cutLineClass, theme = 'classic' }: { data: any[], mode: string, cutLineClass: string, theme?: DominoTheme }) => {
  const themeStyles = {
    classic: {
      card: "bg-white border-slate-900",
      left: "bg-slate-50/50 border-slate-300",
      text: "text-slate-900",
      number: "text-slate-300"
    },
    neon: {
      card: "bg-slate-900 border-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.3)]",
      left: "bg-slate-800/50 border-slate-700",
      text: "text-indigo-100",
      number: "text-slate-600"
    },
    nature: {
      card: "bg-emerald-50 border-emerald-800 rounded-xl",
      left: "bg-emerald-100/50 border-emerald-200",
      text: "text-emerald-900",
      number: "text-emerald-300"
    },
    luxury: {
      card: "bg-slate-950 border-amber-500",
      left: "bg-slate-900/50 border-amber-900/30",
      text: "text-amber-100",
      number: "text-amber-900/50"
    }
  };

  const s = themeStyles[theme];

  // Split data into pages (12 dominoes per page for A4 portrait)
  const itemsPerPage = 12;
  const pages = [];
  for (let i = 0; i < data.length; i += itemsPerPage) {
    pages.push(data.slice(i, i + itemsPerPage));
  }

  return (
    <div className="space-y-10">
      {pages.map((pageData, pageIndex) => (
        <div key={pageIndex} className="game-page print:break-after-page min-h-[270mm] flex flex-col p-[15mm]">
          <div className="mb-6 flex justify-between items-end border-b-2 border-slate-100 pb-4">
            <div>
              <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Domino Học Tập</h2>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
                {mode === 'answer' ? 'Phiên bản dành cho Giáo viên' : 'Phiên bản dành cho Học sinh'} - Trang {pageIndex + 1}
              </p>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-black text-slate-400 uppercase">Tác giả: Thầy Vũ Tiến Lực</div>
              <div className="text-[8px] text-slate-400">Trường THPT Nguyễn Hữu Cảnh</div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-x-8 gap-y-6 pt-4">
            {pageData.map((item, i) => {
              const globalIndex = pageIndex * itemsPerPage + i;
              return (
                <div key={globalIndex} className={`flex border-[1.5pt] h-28 rounded-md overflow-hidden shadow-sm relative ${s.card} ${cutLineClass}`}>
                  {/* Scissor Icon for Print */}
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 hidden print:block text-[10px] text-slate-400">✂️</div>
                  
                  {/* Card Numbering */}
                  <div className={`absolute top-1 left-1 text-[8px] font-black uppercase ${s.number}`}>Thẻ #{globalIndex + 1}</div>

                  <div className={`flex-1 flex items-center justify-center border-r-[1pt] relative ${s.left}`}>
                    {/* Start Indicator */}
                    {item.originalIndex === 0 && (
                      <div className="absolute top-1 right-1 bg-green-500 text-white text-[8px] px-1.5 py-0.5 rounded-full font-black animate-pulse">START</div>
                    )}
                    <AutoFitText 
                      text={item.displayLeft} 
                      className={`font-bold ${s.text}`}
                    />
                  </div>
                  <div className="flex-1 flex items-center justify-center">
                    <AutoFitText text={item.displayRight} className={`font-bold ${s.text}`} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

function GameRenderer({ type, data, mode, bgImage, theme }: { type: GameType, data: GameData[], mode: 'student' | 'answer', bgImage: string | null, theme: DominoTheme }) {
  const shuffle = React.useCallback((array: any[]) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }, []);

  const displayData = React.useMemo(() => {
    // Prepare the actual content for each card in a chain (Domino/Triangle)
    const preparedData = data.map((item, index) => {
      return {
        ...item,
        displayLeft: index === 0 ? "BẮT ĐẦU" : data[index - 1].a,
        displayRight: item.q,
        originalIndex: index
      };
    });

    if (mode === 'answer') return preparedData;
    return shuffle(preparedData);
  }, [data, mode, shuffle]);

  const cutLineClass = "print:border-dashed print:border-slate-400 print:border-[0.5pt]";

  if (data.length === 0 || (data.length === 1 && !data[0].q)) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-300 py-20">
        <LayoutGrid size={64} strokeWidth={1} className="mb-4 opacity-20" />
        <p className="text-lg font-medium">Chưa có dữ liệu để hiển thị</p>
        <p className="text-sm">Hãy nhập câu hỏi ở bảng bên trái</p>
      </div>
    );
  }

  if (type === 'matching') return <MatchingGame data={displayData} mode={mode} cutLineClass={cutLineClass} theme={theme} />;
  if (type === 'triangle') return <TriangleGame data={displayData} mode={mode} cutLineClass={cutLineClass} theme={theme} />;
  return <DominoGame data={displayData} mode={mode} cutLineClass={cutLineClass} theme={theme} />;
}

/**
 * Matching Cards Component
 */
const MatchingGame = ({ data, mode, cutLineClass, theme = 'classic' }: { data: GameData[], mode: string, cutLineClass: string, theme?: DominoTheme }) => {
  const themeStyles = {
    classic: { card: "bg-white border-slate-900", text: "text-slate-900" },
    neon: { card: "bg-slate-900 border-indigo-500", text: "text-indigo-100" },
    nature: { card: "bg-emerald-50 border-emerald-800", text: "text-emerald-900" },
    luxury: { card: "bg-slate-950 border-amber-500", text: "text-amber-100" }
  };
  const s = themeStyles[theme];

  // For matching, we need to separate Q and A into individual cards
  const cards = React.useMemo(() => {
    const qCards = data.map((d, i) => ({ text: d.q, id: i, type: 'Q' }));
    const aCards = data.map((d, i) => ({ text: d.a, id: i, type: 'A' }));
    return mode === 'student' ? [...qCards, ...aCards].sort(() => Math.random() - 0.5) : [...qCards, ...aCards];
  }, [data, mode]);

  // Split cards into pages (20 cards per page for A4 portrait)
  const itemsPerPage = 20;
  const pages = [];
  for (let i = 0; i < cards.length; i += itemsPerPage) {
    pages.push(cards.slice(i, i + itemsPerPage));
  }

  return (
    <div className="space-y-10">
      {pages.map((pageData, pageIndex) => (
        <div key={pageIndex} className="game-page print:break-after-page min-h-[270mm] flex flex-col p-[15mm]">
          <div className="mb-6 flex justify-between items-end border-b-2 border-slate-100 pb-4">
            <div>
              <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Thẻ Ghép Đôi</h2>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
                {mode === 'answer' ? 'Phiên bản dành cho Giáo viên' : 'Phiên bản dành cho Học sinh'} - Trang {pageIndex + 1}
              </p>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-black text-slate-400 uppercase">Tác giả: Thầy Vũ Tiến Lực</div>
              <div className="text-[8px] text-slate-400">Trường THPT Nguyễn Hữu Cảnh</div>
            </div>
          </div>
          
          <div className="grid grid-cols-4 gap-4 pt-4">
            {pageData.map((card, i) => {
              const globalIndex = pageIndex * itemsPerPage + i;
              return (
                <div key={globalIndex} className={`aspect-square border-[1.5pt] rounded-2xl flex items-center justify-center p-4 text-center relative shadow-sm ${s.card} ${cutLineClass}`}>
                  <div className="absolute top-2 left-2 text-[8px] opacity-30 font-black uppercase">
                    {mode === 'answer' ? `${card.type}#${card.id + 1}` : `Thẻ #${globalIndex + 1}`}
                  </div>
                  <AutoFitText text={card.text} className={`font-bold ${s.text}`} />
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Triangle Domino Component
 */
const TriangleGame = ({ data, mode, cutLineClass, theme = 'classic' }: { data: any[], mode: string, cutLineClass: string, theme?: DominoTheme }) => {
  const themeStyles = {
    classic: { bg: "white", border: "#0f172a", text: "text-slate-900" },
    neon: { bg: "#0f172a", border: "#6366f1", text: "text-indigo-100" },
    nature: { bg: "#ecfdf5", border: "#065f46", text: "text-emerald-900" },
    luxury: { bg: "#020617", border: "#f59e0b", text: "text-amber-100" }
  };
  const s = themeStyles[theme];

  // Split data into pages (10 triangles per page as per example)
  const itemsPerPage = 10;
  const pages = [];
  for (let i = 0; i < data.length; i += itemsPerPage) {
    pages.push(data.slice(i, i + itemsPerPage));
  }

  return (
    <div className="space-y-6">
      {pages.map((pageData, pageIndex) => (
        <div key={pageIndex} className="game-page print:break-after-page min-h-[180mm] flex flex-col p-[15mm]">
          <div className="mb-2 flex justify-end border-b border-slate-100 pb-1">
            <div className="text-right leading-tight">
              <div className="text-[8px] font-black text-slate-400 uppercase">Tác giả: Thầy Vũ Tiến Lực</div>
              <div className="text-[7px] text-slate-400 italic">Trường THPT Nguyễn Hữu Cảnh</div>
            </div>
          </div>
          
          <div className="flex flex-col gap-12 pt-4">
            {[0, 1].map(rowIndex => {
              const rowData = pageData.slice(rowIndex * 5, (rowIndex + 1) * 5);
              if (rowData.length === 0) return null;
              
              return (
                <div key={rowIndex} className="flex justify-center">
                  {rowData.map((item, i) => {
                    const globalIndex = pageIndex * itemsPerPage + rowIndex * 5 + i;
                    const isDown = i % 2 === 1;
                    
                    return (
                      <div 
                        key={globalIndex} 
                        className={`relative w-[32%] aspect-[1.15/1] ${i > 0 ? '-ml-[16%]' : ''} ${cutLineClass}`}
                      >
                        <svg viewBox="0 0 100 86.6" className="w-full h-full drop-shadow-sm">
                          <polygon 
                            points={isDown ? "0,0 100,0 50,86.6" : "50,0 0,86.6 100,86.6"} 
                            fill={s.bg} 
                            stroke={s.border} 
                            strokeWidth="1.2"
                          />
                          {/* Dashed lines between triangles as seen in example */}
                          {!isDown && i < rowData.length - 1 && (
                            <line x1="100" y1="86.6" x2="100" y2="0" stroke="#94a3b8" strokeWidth="0.5" strokeDasharray="2,2" />
                          )}
                        </svg>
                        
                        {/* Content Overlay */}
                        <div className="absolute inset-0 pointer-events-none">
                          {/* Start Indicator */}
                          {item.originalIndex === 0 && (
                            <div className={`absolute ${isDown ? 'bottom-6' : 'top-6'} left-1/2 -translate-x-1/2 bg-green-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black z-10`}>START</div>
                          )}

                          {isDown ? (
                            <>
                              {/* Top-Left side (A) - Parallel to side */}
                              <div className="absolute top-[18%] left-[15%] w-[35%] h-[25%] rotate-[60deg] text-center flex items-center justify-center">
                                <AutoFitText 
                                  text={item.displayLeft} 
                                  maxFontSize={16}
                                  className={`font-bold leading-[1.2] ${s.text}`} 
                                />
                              </div>
                              {/* Top-Right side (Q) - Parallel to side */}
                              <div className="absolute top-[18%] right-[15%] w-[35%] h-[25%] -rotate-[60deg] text-center flex items-center justify-center">
                                <AutoFitText 
                                  text={item.displayRight} 
                                  maxFontSize={16}
                                  className={`font-bold leading-[1.2] ${s.text}`} 
                                />
                              </div>
                            </>
                          ) : (
                            <>
                              {/* Bottom-Left side (A) - Parallel to side */}
                              <div className="absolute top-[42%] left-[15%] w-[35%] h-[25%] -rotate-[60deg] text-center flex items-center justify-center">
                                <AutoFitText 
                                  text={item.displayLeft} 
                                  maxFontSize={16}
                                  className={`font-bold leading-[1.2] ${s.text}`} 
                                />
                              </div>
                              {/* Bottom-Right side (Q) - Parallel to side */}
                              <div className="absolute top-[42%] right-[15%] w-[35%] h-[25%] rotate-[60deg] text-center flex items-center justify-center">
                                <AutoFitText 
                                  text={item.displayRight} 
                                  maxFontSize={16}
                                  className={`font-bold leading-[1.2] ${s.text}`} 
                                />
                              </div>
                            </>
                          )}
                          
                          {/* ID */}
                          <div className={`absolute ${isDown ? 'top-2' : 'bottom-2'} left-0 w-full text-center opacity-30 text-[10px] font-black`}>
                            #{globalIndex + 1}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

function LibraryCard({ title, desc, image }: { title: string, desc: string, image: string }) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-all group">
      <div className="h-48 overflow-hidden">
        <img src={image} className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500" alt={title} referrerPolicy="no-referrer" />
      </div>
      <div className="p-6">
        <h3 className="text-lg font-bold mb-2 text-slate-800">{title}</h3>
        <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function generateAIPrompt({ role, grade, subject, topic, level, count, extra }: any) {
  return `Hãy đóng vai một ${role || 'chuyên gia giáo dục'} giàu kinh nghiệm. Tôi cần bộ dữ liệu chất lượng cao để tạo trò chơi học tập cho học sinh.

Thông tin chi tiết:
- Khối lớp: ${grade || '[Nhập khối lớp]'}
- Môn học: ${subject || '[Nhập môn học]'}
- Chủ đề: ${topic || '[Nhập chủ đề]'}
- Mức độ nhận thức: ${level}
- Số lượng: ${count} cặp câu hỏi - đáp án.
${extra ? `- Yêu cầu bổ sung: ${extra}` : ''}

Yêu cầu về nội dung:
1. Nội dung phải chính xác tuyệt đối về mặt kiến thức sư phạm.
2. Mỗi vế (Câu hỏi/Đáp án) phải ngắn gọn, súc tích (tối đa 15 từ) để vừa khung hình.
3. Nếu là môn Khoa học (Toán, Lý, Hóa), hãy sử dụng mã LaTeX chuẩn và đặt trong dấu $ (Ví dụ: $E=mc^2$).
4. Trình bày kết quả dưới dạng BẢNG (Table) gồm 2 cột: "Vế 1 (Câu hỏi)" và "Vế 2 (Đáp án)".
5. Tránh các câu hỏi quá dài hoặc có nhiều đáp án đúng.

Hãy bắt đầu tạo dữ liệu ngay bây giờ:`;
}
