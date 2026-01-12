import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, RefreshCw, ArrowRight, BookOpen, Info, AlertCircle } from 'lucide-react';

/**
 * تطبيق مصحف الذكر المطور
 * يدعم: الهواتف، أجهزة أندرويد TV (التحكم بالريموت)، البحث السريع
 */
const App = () => {
  const [surahs, setSurahs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSurah, setSelectedSurah] = useState(null);
  const [error, setError] = useState(null);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const gridRef = useRef(null);

  // تعريف الهوية البصرية (الألوان)
  const colors = {
    primary: '#1a472a',    // الأخضر القرآني
    secondary: '#c9a44c',  // الذهبي
    accent: '#f4f1ea',     // لون الورق الطبيعي
    text: '#2d3436',
    white: '#ffffff',
    focusShadow: '0 0 0 4px rgba(201, 164, 76, 0.5)'
  };

  // 1. جلب قائمة السور من API
  const fetchSurahs = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('https://api.alquran.cloud/v1/surah');
      const data = await response.json();
      if (data.code === 200) {
        setSurahs(data.data);
      } else {
        throw new Error('فشل جلب البيانات');
      }
    } catch (err) {
      setError('حدث خطأ في الاتصال بالشبكة.');
    } finally {
      setLoading(false);
    }
  };

  // 2. جلب تفاصيل سورة محددة عند اختيارها
  const handleSurahClick = async (surahNumber) => {
    setLoading(true);
    try {
      const response = await fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}`);
      const data = await response.json();
      setSelectedSurah(data.data);
      window.scrollTo(0, 0);
    } catch (err) {
      setError('تعذر تحميل نص السورة.');
    } finally {
      setLoading(false);
    }
  };

  // 3. تصفية السور بناءً على بحث المستخدم
  const filteredSurahs = useMemo(() => {
    return surahs.filter(surah => 
      surah.name.includes(searchQuery) || 
      surah.englishName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      surah.number.toString() === searchQuery
    );
  }, [surahs, searchQuery]);

  // 4. العودة للصفحة الرئيسية
  const resetToHome = () => {
    setSelectedSurah(null);
    setSearchQuery('');
    setError(null);
    setFocusedIndex(0);
  };

  // تحميل البيانات عند بدء التطبيق
  useEffect(() => {
    fetchSurahs();
  }, []);

  // 5. نظام التحكم عن بعد (Android TV Remote)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // إذا كان المستخدم يقرأ سورة، نترك التحكم العادي للمتصفح
      if (selectedSurah) return; 

      const columns = window.innerWidth < 640 ? 1 : window.innerWidth < 1024 ? 2 : 3;
      
      switch(e.key) {
        case 'ArrowRight':
          setFocusedIndex(prev => Math.min(prev + 1, filteredSurahs.length - 1));
          break;
        case 'ArrowLeft':
          setFocusedIndex(prev => Math.max(prev - 1, 0));
          break;
        case 'ArrowDown':
          setFocusedIndex(prev => Math.min(prev + columns, filteredSurahs.length - 1));
          break;
        case 'ArrowUp':
          setFocusedIndex(prev => Math.max(prev - columns, 0));
          break;
        case 'Enter':
          if (filteredSurahs[focusedIndex]) {
            handleSurahClick(filteredSurahs[focusedIndex].number);
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedSurah, filteredSurahs, focusedIndex]);

  // 6. ضمان بقاء العنصر المحدد مرئياً عند استخدام الريموت
  useEffect(() => {
    if (gridRef.current && gridRef.current.children[focusedIndex]) {
      gridRef.current.children[focusedIndex].scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [focusedIndex]);

  return (
    <div className="min-h-screen font-sans text-right pb-10 selection:bg-secondary/30" dir="rtl" style={{ backgroundColor: colors.accent }}>
      
      {/* الشريط العلوي الثابت */}
      <header className="sticky top-0 z-50 shadow-lg p-3 md:p-4 text-white" style={{ backgroundColor: colors.primary }}>
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 md:gap-3">
            <BookOpen size={24} className="text-secondary" style={{ color: colors.secondary }} />
            <h1 className="text-lg md:text-2xl font-bold">مصحف الذكر</h1>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={fetchSurahs} 
              className="p-2 hover:bg-white/10 rounded-full transition-colors active:bg-white/20"
              title="تحديث"
            >
              <RefreshCw size={20} />
            </button>
            {selectedSurah && (
              <button 
                onClick={resetToHome}
                className="flex items-center gap-2 px-4 py-1 bg-secondary rounded-lg text-primary font-bold hover:brightness-110 active:scale-95 transition-all shadow-md"
                style={{ backgroundColor: colors.secondary }}
              >
                <ArrowRight size={18} />
                <span>الرئيسية</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-3 md:p-6">
        {!selectedSurah ? (
          <>
            {/* حقل البحث */}
            <div className="relative mb-6 md:mb-8">
              <input
                type="text"
                placeholder="ابحث عن اسم السورة أو رقمها..."
                className="w-full p-4 pr-12 rounded-2xl border-none shadow-md focus:ring-2 focus:ring-secondary outline-none text-lg transition-all"
                style={{ color: colors.text }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={22} />
            </div>

            {/* عرض الحالات (تحميل / خطأ / قائمة) */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24">
                <RefreshCw className="animate-spin text-primary mb-4" size={50} style={{ color: colors.primary }} />
                <p className="text-xl font-medium text-primary">جاري جلب السور...</p>
              </div>
            ) : filteredSurahs.length > 0 ? (
              <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSurahs.map((surah, index) => (
                  <button
                    key={surah.number}
                    onClick={() => handleSurahClick(surah.number)}
                    onMouseEnter={() => setFocusedIndex(index)}
                    className={`group bg-white p-5 rounded-2xl shadow-sm border-2 transition-all flex justify-between items-center text-right outline-none
                      ${focusedIndex === index ? 'scale-[1.03] shadow-xl z-10' : 'border-transparent'}
                    `}
                    style={{ 
                      borderColor: focusedIndex === index ? colors.secondary : 'transparent',
                      boxShadow: focusedIndex === index ? `0 10px 25px -5px rgba(0, 0, 0, 0.1), ${colors.focusShadow}` : ''
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white relative overflow-hidden shrink-0" style={{ backgroundColor: colors.primary }}>
                         <span className="z-10">{surah.number}</span>
                         <div className="absolute inset-0 bg-white/10 rotate-12 translate-y-4"></div>
                      </div>
                      <div className="overflow-hidden">
                        <h3 className="text-xl font-bold truncate group-hover:text-primary">{surah.name}</h3>
                        <p className="text-xs text-gray-400 truncate">{surah.englishNameTranslation}</p>
                      </div>
                    </div>
                    <div className="text-left shrink-0">
                      <span className="text-xs px-2 py-1 rounded bg-accent text-primary font-bold block mb-1">
                        {surah.revelationType === 'Meccan' ? 'مكية' : 'مدنية'}
                      </span>
                      <span className="text-xs text-gray-400 block">{surah.numberOfAyahs} آية</span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-white rounded-3xl shadow-sm border-2 border-dashed border-gray-200">
                <AlertCircle size={60} className="mx-auto text-gray-300 mb-4" />
                <h2 className="text-2xl font-bold text-gray-600 mb-2">لا توجد نتائج بحث</h2>
                <p className="text-gray-400 mb-6">تأكد من كتابة اسم السورة بشكل صحيح</p>
                <button 
                  onClick={resetToHome}
                  className="px-10 py-3 rounded-xl text-white font-bold bg-primary hover:opacity-90 transition-all shadow-lg"
                  style={{ backgroundColor: colors.primary }}
                >
                  العودة للقائمة الكاملة
                </button>
              </div>
            )}
          </>
        ) : (
          /* واجهة قراءة السورة */
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-500">
            {/* هيدر السورة */}
            <div className="p-8 md:p-12 text-center text-white relative" style={{ backgroundColor: colors.primary }}>
               <h2 className="text-4xl md:text-6xl font-bold mb-4 drop-shadow-md">{selectedSurah.name}</h2>
               <div className="flex flex-wrap justify-center gap-4 text-sm md:text-base opacity-90">
                 <span className="bg-white/20 px-4 py-1 rounded-full border border-white/20 flex items-center gap-2">
                   <Info size={16} />
                   {selectedSurah.revelationType === 'Meccan' ? 'مكية' : 'مدنية'}
                 </span>
                 <span className="bg-white/20 px-4 py-1 rounded-full border border-white/20">عدد الآيات: {selectedSurah.numberOfAyahs}</span>
                 <span className="bg-white/20 px-4 py-1 rounded-full border border-white/20">رقم السورة: {selectedSurah.number}</span>
               </div>
               <div className="mt-10">
                 <p className="text-secondary text-3xl md:text-5xl font-serif drop-shadow-sm" style={{ color: colors.secondary }}>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</p>
               </div>
            </div>

            {/* نص السورة */}
            <div className="p-6 md:p-16 leading-[3] md:leading-[3.5] text-center bg-[url('https://www.transparenttextures.com/patterns/paper.png')]">
              {selectedSurah.ayahs.map((ayah) => (
                <span key={ayah.number} className="inline-block mb-4 text-2xl md:text-4xl font-serif text-slate-800 p-2 hover:bg-secondary/10 rounded-xl transition-all duration-300">
                  {ayah.text.replace('بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ', '')}
                  <span className="inline-flex items-center justify-center w-10 h-10 md:w-12 md:h-12 mx-3 text-sm md:text-lg border-2 rounded-full border-secondary text-primary font-bold shadow-sm" style={{ borderColor: colors.secondary, color: colors.primary }}>
                    {ayah.numberInSurah}
                  </span>
                </span>
              ))}
            </div>

            {/* تذييل صفحة السورة (زر الرجوع) */}
            <div className="p-8 bg-gray-50 border-t flex justify-center">
              <button 
                onClick={resetToHome}
                className="flex items-center gap-3 px-10 py-4 bg-primary text-white rounded-2xl font-bold hover:scale-105 active:scale-95 transition-all shadow-xl text-lg"
                style={{ backgroundColor: colors.primary }}
              >
                <ArrowRight size={24} />
                العودة لقائمة السور
              </button>
            </div>
          </div>
        )}
      </main>

      <footer className="py-10 text-center text-gray-400 text-sm">
        <div className="flex justify-center gap-4 mb-2">
          <BookOpen size={20} className="opacity-30" />
        </div>
        <p>مصحف الذكر - مصمم للعرض على كافة الأجهزة والشاشات الذكية</p>
      </footer>
    </div>
  );
};

export default App;