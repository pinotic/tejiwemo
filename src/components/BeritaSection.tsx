import { Newspaper, Plus, Trash2, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { formatDateId } from '../lib/format';
import type { NewsItem, UserRole } from '../types';

interface BeritaSectionProps {
  news: NewsItem[];
  role: UserRole;
  compact?: boolean;
  regionCode?: string;
  locationName?: string;
  onViewAll?: () => void;
}

const NEWS_PHOTO_PRESETS = [
  { label: 'Tanpa Foto', url: '' },
  { label: 'Balai Warga Dinoyo', url: '/src/assets/images/hero_dinoyo_rt01_1794982207800.jpg' },
  { label: 'Kerja Bakti Warga', url: '/src/assets/images/kegiatan_kerja_bakti_1794973651734.jpg' },
  { label: 'Posyandu & Sosial', url: '/src/assets/images/kegiatan_posyandu_1794973652119.jpg' },
  { label: 'Ronda & Keamanan', url: '/src/assets/images/kegiatan_ronda_malam_1794973653012.jpg' },
];

export function BeritaSection({
  news,
  role,
  compact = false,
  regionCode = 'RT 01 / RW 05',
  locationName = 'Balai Warga Kelurahan Dinoyo',
  onViewAll,
}: BeritaSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [readingNews, setReadingNews] = useState<NewsItem | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Create news modal states
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Pengumuman');
  const [author, setAuthor] = useState('Pengurus RT 01 / RW 05');
  const [imageUrl, setImageUrl] = useState(NEWS_PHOTO_PRESETS[1].url);
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const categories = useMemo(() => {
    const set = new Set<string>(news.map((n) => n.category).filter(Boolean));
    return Array.from(set);
  }, [news]);

  const visibleNews = useMemo(() => {
    const filtered =
      selectedCategory === 'all'
        ? news
        : news.filter((n) => n.category === selectedCategory);
    return compact ? filtered.slice(0, 3) : filtered;
  }, [news, selectedCategory, compact]);

  const handleCreateNews = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          category,
          author,
          imageUrl,
          summary,
          content,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || 'Gagal menerbitkan berita');
      setShowCreateModal(false);
      setTitle('');
      setSummary('');
      setContent('');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteNews = async (newsId: string) => {
    try {
      const res = await fetch(`/api/news/${newsId}`, { method: 'DELETE' });
      if (!res.ok) return;
      setConfirmDeleteId(null);
      if (readingNews?.id === newsId) {
        setReadingNews(null);
      }
    } catch {
      // ignore
    }
  };

  return (
    <div className={compact ? 'space-y-5' : 'space-y-8'}>
      {!compact && (
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Berita {regionCode}
            </h1>
            <p className="mt-1.5 text-sm text-slate-600">
              Kabar lingkungan, laporan kegiatan, dan pengumuman resmi warga {locationName}.
            </p>
          </div>

          {role === 'pengurus' && (
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span>Buat Berita</span>
            </button>
          )}
        </div>
      )}

      {!compact && (
        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200 w-fit">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              selectedCategory === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Semua Berita
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                selectedCategory === cat
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {compact && (
        <div className="flex items-center justify-between gap-4 pb-2 border-b border-slate-200">
          <div>
            <h2 className="font-display text-lg sm:text-xl font-bold tracking-tight text-slate-900">
              Berita {regionCode}
            </h2>
            <p className="text-xs text-slate-500">
              Kabar lingkungan & pengumuman resmi pengurus
            </p>
          </div>
          {onViewAll && (
            <button
              type="button"
              onClick={onViewAll}
              className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 whitespace-nowrap shrink-0"
            >
              Semua Berita →
            </button>
          )}
        </div>
      )}

      {visibleNews.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
          <p className="text-sm font-medium text-slate-800">
            Belum ada berita yang diterbitkan.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {visibleNews.map((item) => (
            <article
              key={item.id}
              className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col justify-between transition-colors hover:border-slate-300"
            >
              <div>
                <div className="aspect-[16/9] bg-slate-100 overflow-hidden">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-emerald-50 via-slate-50 to-slate-100 p-4 text-center">
                      <Newspaper className="w-6 h-6 text-emerald-700 mb-1" aria-hidden="true" />
                      <span className="text-[11px] font-medium text-slate-600">
                        {item.category}
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-4 sm:p-5">
                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    <span className="font-semibold text-emerald-800">
                      {item.category}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{formatDateId(item.publishedAt.slice(0, 10))}</span>
                  </div>

                  <h3 className="mt-1.5 font-display text-sm sm:text-base font-bold text-slate-900 leading-snug line-clamp-2">
                    {item.title}
                  </h3>

                  <p className="mt-1.5 text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {item.summary}
                  </p>
                </div>
              </div>

              <div className="px-4 sm:px-5 py-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-500 truncate">
                  {item.author}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  {!compact && role === 'pengurus' && (
                    confirmDeleteId === item.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleDeleteNews(item.id)}
                          className="px-2 py-0.5 text-[11px] font-semibold text-white bg-red-600 rounded"
                        >
                          Hapus
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-2 py-0.5 text-[11px] text-slate-600 hover:bg-slate-100 rounded"
                        >
                          Batal
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(item.id)}
                        aria-label={`Hapus berita ${item.title}`}
                        className="p-1 text-slate-400 hover:text-red-700 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )
                  )}
                  <button
                    type="button"
                    onClick={() => setReadingNews(item)}
                    className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 whitespace-nowrap"
                  >
                    Baca →
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Article Reader Modal */}
      {readingNews && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="news-reader-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4"
          onClick={() => setReadingNews(null)}
        >
          <div
            className="bg-white border border-slate-200 rounded-xl max-w-xl w-full overflow-hidden max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {readingNews.imageUrl && (
              <div className="aspect-[16/9] bg-slate-100 overflow-hidden shrink-0">
                <img
                  src={readingNews.imageUrl}
                  alt={readingNews.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="p-6 overflow-y-auto space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="text-xs text-slate-500">
                  <span className="font-semibold text-emerald-800">
                    {readingNews.category}
                  </span>{' '}
                  · {formatDateId(readingNews.publishedAt.slice(0, 10))}
                </div>
                <button
                  type="button"
                  onClick={() => setReadingNews(null)}
                  aria-label="Tutup berita"
                  className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <h3
                id="news-reader-title"
                className="font-display text-xl font-bold text-slate-900 leading-snug"
              >
                {readingNews.title}
              </h3>

              <div className="text-xs text-slate-500 pb-3 border-b border-slate-100">
                Ditulis oleh <span className="font-medium text-slate-800">{readingNews.author}</span>
              </div>

              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {readingNews.content}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Create News Modal (shortcut for Pengurus) */}
      {showCreateModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-news-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3
                id="create-news-modal-title"
                className="font-display text-lg font-bold text-slate-900"
              >
                Terbitkan Berita Baru
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                aria-label="Tutup form berita"
                className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNews} className="mt-4 space-y-4">
              {formError && (
                <div className="p-3 text-xs text-red-800 bg-red-50 border border-red-200 rounded-lg">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Judul Berita
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Pemeliharaan Lampu Jalan Blok A–C Selesai"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Kategori
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  >
                    <option value="Pengumuman">Pengumuman</option>
                    <option value="Lingkungan">Lingkungan</option>
                    <option value="Keamanan">Keamanan</option>
                    <option value="Kesehatan">Kesehatan</option>
                    <option value="Sosial">Sosial</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Foto Ilustrasi
                  </label>
                  <select
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  >
                    {NEWS_PHOTO_PRESETS.map((p) => (
                      <option key={p.label} value={p.url}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Penulis / Divisi
                </label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Ringkasan Singkat (Opsional)
                </label>
                <input
                  type="text"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Ringkasan satu kalimat untuk kartu berita..."
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Isi Berita Lengkap
                </label>
                <textarea
                  rows={4}
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Tulis informasi lengkap untuk warga RT 01 / RW 05..."
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 rounded-lg"
                >
                  {submitting ? 'Menerbitkan...' : 'Terbitkan Berita'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
