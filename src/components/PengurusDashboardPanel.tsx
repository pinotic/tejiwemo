import {
  CalendarPlus,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  FolderPlus,
  Globe,
  Image as ImageIcon,
  KeyRound,
  Newspaper,
  Pencil,
  Plus,
  Trash2,
  UserPlus,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { authFetch } from '../lib/auth';
import {
  formatDateId,
  formatRelativeTime,
  formatRupiah,
  getDivisionShortLabel,
  getStatusMeta,
  PROPOSAL_STEPS,
} from '../lib/format';
import type {
  AgendaItem,
  AuthUser,
  DivisionId,
  DivisionInfo,
  HeroConfig,
  NewsItem,
  ProposalItem,
  ProposalStatus,
  ProposalUrgency,
  RtOfficial,
  SiteSettings,
  TreasuryTransaction,
} from '../types';
import { SuperadminSiteSettingsPanel } from './SuperadminSiteSettingsPanel';
import { SuperadminUsersPanel } from './SuperadminUsersPanel';

export type DashboardTool =
  | 'input_kas'
  | 'kelola_divisi'
  | 'tambah_agenda'
  | 'buat_berita'
  | 'kelola_usulan'
  | 'edit_hero'
  | 'edit_pengurus'
  | 'identitas_web'
  | 'akun_pengurus';

interface PengurusDashboardPanelProps {
  authUser: AuthUser;
  activeTool: DashboardTool;
  siteSettings: SiteSettings;
  hero: HeroConfig;
  officials: RtOfficial[];
  divisions: DivisionInfo[];
  treasury: TreasuryTransaction[];
  agenda: AgendaItem[];
  news: NewsItem[];
  proposals: ProposalItem[];
}

const HERO_PRESETS = [
  {
    label: 'Balai Warga Dinoyo',
    url: '/src/assets/images/hero_dinoyo_rt01_1794982207800.jpg',
  },
  {
    label: 'Kerja Bakti Warga',
    url: '/src/assets/images/kegiatan_kerja_bakti_1794973651734.jpg',
  },
  {
    label: 'Posyandu & Sosial',
    url: '/src/assets/images/kegiatan_posyandu_1794973652119.jpg',
  },
  {
    label: 'Ronda & Keamanan',
    url: '/src/assets/images/kegiatan_ronda_malam_1794973653012.jpg',
  },
];

const PORTRAIT_PRESETS = [
  { label: 'Ketua RT', url: '/src/assets/images/pengurus_ketua_rt_1794982800746.jpg' },
  { label: 'Sekretaris', url: '/src/assets/images/pengurus_sekretaris_rt_1794982801152.jpg' },
  { label: 'Bendahara', url: '/src/assets/images/pengurus_bendahara_rt_1794982800996.jpg' },
  { label: 'Koor. Kebersihan', url: '/src/assets/images/koordinator_kebersihan_1794982802849.jpg' },
  { label: 'Koor. Keamanan', url: '/src/assets/images/koordinator_keamanan_1794982803960.jpg' },
  { label: 'Koor. Sosial', url: '/src/assets/images/koordinator_sosial_1794982804581.jpg' },
  { label: 'Koor. Pemuda', url: '/src/assets/images/koordinator_pemuda_1794982803573.jpg' },
  { label: 'Koor. Infrastruktur', url: '/src/assets/images/koordinator_infrastruktur_1794982804740.jpg' },
];

export function PengurusDashboardPanel({
  authUser,
  activeTool,
  siteSettings,
  hero,
  officials,
  divisions,
  treasury,
  agenda,
  news,
  proposals,
}: PengurusDashboardPanelProps) {
  // Input / Edit Kas states
  const [editingTxId, setEditingTxId] = useState<string | null>(null);
  const [txDivision, setTxDivision] = useState<DivisionId>(divisions[0]?.id || 'kebersihan');
  const [txType, setTxType] = useState<'pemasukan' | 'pengeluaran'>('pemasukan');
  const [txAmount, setTxAmount] = useState('');
  const [txDate, setTxDate] = useState('2026-11-17');
  const [txDesc, setTxDesc] = useState('');
  const [txRecorder, setTxRecorder] = useState(authUser.displayName || 'Bendahara RT 01');
  const [txFilterDiv, setTxFilterDiv] = useState<'all' | DivisionId>('all');
  const [txSubmitting, setTxSubmitting] = useState(false);
  const [txFeedback, setTxFeedback] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [confirmDeleteTxId, setConfirmDeleteTxId] = useState<string | null>(null);

  // Add / Edit Division states
  const [editingDivId, setEditingDivId] = useState<string | null>(null);
  const [divName, setDivName] = useState('');
  const [divShortName, setDivShortName] = useState('');
  const [divCoordinator, setDivCoordinator] = useState('');
  const [divBudget, setDivBudget] = useState('12000000');
  const [divDesc, setDivDesc] = useState('');
  const [divSubmitting, setDivSubmitting] = useState(false);
  const [divFeedback, setDivFeedback] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [confirmDeleteDivId, setConfirmDeleteDivId] = useState<string | null>(null);

  // Tambah / Edit Agenda states
  const [editingAgdId, setEditingAgdId] = useState<string | null>(null);
  const [agdTitle, setAgdTitle] = useState('');
  const [agdDate, setAgdDate] = useState('2026-11-30');
  const [agdStart, setAgdStart] = useState('08:00');
  const [agdEnd, setAgdEnd] = useState('10:00');
  const [agdLocation, setAgdLocation] = useState('');
  const [agdDivision, setAgdDivision] = useState<DivisionId>(divisions[0]?.id || 'kebersihan');
  const [agdCategory, setAgdCategory] = useState('Kegiatan RT');
  const [agdDesc, setAgdDesc] = useState('');
  const [agdSubmitting, setAgdSubmitting] = useState(false);
  const [agdFeedback, setAgdFeedback] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [confirmDeleteAgdId, setConfirmDeleteAgdId] = useState<string | null>(null);
  const [expandedAgendaId, setExpandedAgendaId] = useState<string | null>(null);

  // Buat / Edit Berita states
  const [editingNewsId, setEditingNewsId] = useState<string | null>(null);
  const [newsTitle, setNewsTitle] = useState('');
  const [newsCategory, setNewsCategory] = useState('Pengumuman');
  const [newsAuthor, setNewsAuthor] = useState(authUser.displayName || 'Pengurus RT 01 / RW 05');
  const [newsImageUrl, setNewsImageUrl] = useState(HERO_PRESETS[0].url);
  const [newsSummary, setNewsSummary] = useState('');
  const [newsContent, setNewsContent] = useState('');
  const [newsSubmitting, setNewsSubmitting] = useState(false);
  const [newsFeedback, setNewsFeedback] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [confirmDeleteNewsId, setConfirmDeleteNewsId] = useState<string | null>(null);

  // Kelola Usulan states (Add, Edit, Status Update, Delete)
  const [propFormMode, setPropFormMode] = useState<'create' | 'edit'>('create');
  const [editingPropId, setEditingPropId] = useState<string | null>(null);
  const [propTitle, setPropTitle] = useState('');
  const [propDivision, setPropDivision] = useState<DivisionId>(divisions[0]?.id || 'infrastruktur');
  const [propResident, setPropResident] = useState('');
  const [propBlock, setPropBlock] = useState('');
  const [propUrgency, setPropUrgency] = useState<ProposalUrgency>('Normal');
  const [propBudget, setPropBudget] = useState('0');
  const [propDesc, setPropDesc] = useState('');
  const [propSubmitting, setPropSubmitting] = useState(false);
  const [propFeedback, setPropFeedback] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [statusPropId, setStatusPropId] = useState<string | null>(null);
  const [nextPropStatus, setNextPropStatus] = useState<ProposalStatus>('Ditinjau');
  const [statusPropNote, setStatusPropNote] = useState('');
  const [confirmDeletePropId, setConfirmDeletePropId] = useState<string | null>(null);

  // Edit Hero states
  const [heroEyebrow, setHeroEyebrow] = useState(hero.eyebrow);
  const [heroTitle, setHeroTitle] = useState(hero.title);
  const [heroSubtitle, setHeroSubtitle] = useState(hero.subtitle);
  const [heroImageUrl, setHeroImageUrl] = useState(hero.imageUrl);
  const [heroPrimaryCta, setHeroPrimaryCta] = useState(hero.primaryCtaLabel);
  const [heroSecondaryCta, setHeroSecondaryCta] = useState(hero.secondaryCtaLabel);
  const [heroSubmitting, setHeroSubmitting] = useState(false);
  const [heroFeedback, setHeroFeedback] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    setHeroEyebrow(hero.eyebrow);
    setHeroTitle(hero.title);
    setHeroSubtitle(hero.subtitle);
    setHeroImageUrl(hero.imageUrl);
    setHeroPrimaryCta(hero.primaryCtaLabel);
    setHeroSecondaryCta(hero.secondaryCtaLabel);
  }, [hero]);

  // Edit Jajaran Pengurus states
  const [editingOfficialId, setEditingOfficialId] = useState<string | null>(null);
  const [editOffName, setEditOffName] = useState('');
  const [editOffPosition, setEditOffPosition] = useState('');
  const [editOffBlock, setEditOffBlock] = useState('');
  const [editOffPhoto, setEditOffPhoto] = useState('');
  const [newOffName, setNewOffName] = useState('');
  const [newOffPosition, setNewOffPosition] = useState('');
  const [newOffBlock, setNewOffBlock] = useState('');
  const [newOffPhoto, setNewOffPhoto] = useState(PORTRAIT_PRESETS[0].url);
  const [confirmDeleteOffId, setConfirmDeleteOffId] = useState<string | null>(null);

  // Edit Division Coordinator inline states
  const [editingDivCoordId, setEditingDivCoordId] = useState<string | null>(null);
  const [editDivCoordinator, setEditDivCoordinator] = useState('');
  const [editDivShortName, setEditDivShortName] = useState('');
  const [editDivPhoto, setEditDivPhoto] = useState('');

  const [pengurusSubmitting, setPengurusSubmitting] = useState(false);
  const [pengurusFeedback, setPengurusFeedback] = useState<{ kind: 'ok' | 'err'; text: string } | null>(
    null
  );

  const effectiveTxDivision = divisions.some((d) => d.id === txDivision)
    ? txDivision
    : divisions[0]?.id || '';

  const effectiveAgdDivision = divisions.some((d) => d.id === agdDivision)
    ? agdDivision
    : divisions[0]?.id || '';

  const effectivePropDivision = divisions.some((d) => d.id === propDivision)
    ? propDivision
    : divisions[0]?.id || '';

  const filteredTreasury =
    txFilterDiv === 'all'
      ? treasury
      : treasury.filter((t) => t.divisionId === txFilterDiv);

  // --- Kas Divisi Handlers ---
  const resetKasForm = () => {
    setEditingTxId(null);
    setTxAmount('');
    setTxDesc('');
    setTxType('pemasukan');
    setTxDate('2026-11-17');
    setTxRecorder(authUser.displayName || 'Bendahara RT 01');
  };

  const startEditTx = (trx: TreasuryTransaction) => {
    setEditingTxId(trx.id);
    setTxDivision(trx.divisionId);
    setTxType(trx.type);
    setTxAmount(String(trx.amount));
    setTxDate(trx.date);
    setTxDesc(trx.description);
    setTxRecorder(trx.recordedBy);
    setTxFeedback(null);
  };

  const handleSubmitKas = async (e: React.FormEvent) => {
    e.preventDefault();
    setTxFeedback(null);
    const amountNum = Number(txAmount.replace(/[^0-9]/g, ''));
    if (!amountNum || amountNum <= 0) {
      setTxFeedback({ kind: 'err', text: 'Nominal kas harus lebih dari Rp 0.' });
      return;
    }

    setTxSubmitting(true);
    try {
      const isEdit = Boolean(editingTxId);
      const url = isEdit ? `/api/treasury/${editingTxId}` : '/api/treasury';
      const method = isEdit ? 'PATCH' : 'POST';
      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          divisionId: effectiveTxDivision,
          type: txType,
          amount: amountNum,
          date: txDate,
          description: txDesc,
          recordedBy: txRecorder,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan mutasi kas');

      resetKasForm();
      setTxFeedback({
        kind: 'ok',
        text: isEdit
          ? 'Mutasi kas berhasil diperbarui secara real-time.'
          : 'Transaksi kas baru berhasil dicatat dan disiarkan real-time.',
      });
    } catch (err) {
      setTxFeedback({
        kind: 'err',
        text: err instanceof Error ? err.message : 'Terjadi kesalahan',
      });
    } finally {
      setTxSubmitting(false);
    }
  };

  const handleDeleteTx = async (txId: string) => {
    try {
      const res = await authFetch(`/api/treasury/${txId}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error || 'Gagal menghapus transaksi');
      }
      if (editingTxId === txId) resetKasForm();
      setConfirmDeleteTxId(null);
      setTxFeedback({ kind: 'ok', text: 'Transaksi kas berhasil dihapus.' });
    } catch (err) {
      setTxFeedback({
        kind: 'err',
        text: err instanceof Error ? err.message : 'Gagal menghapus mutasi kas',
      });
    }
  };

  // --- Divisi Kas Handlers ---
  const resetDivForm = () => {
    setEditingDivId(null);
    setDivName('');
    setDivShortName('');
    setDivCoordinator('');
    setDivBudget('12000000');
    setDivDesc('');
  };

  const startEditDiv = (div: DivisionInfo) => {
    setEditingDivId(div.id);
    setDivName(div.name);
    setDivShortName(div.shortName);
    setDivCoordinator(div.coordinator);
    setDivBudget(String(div.annualBudget));
    setDivDesc(div.description);
    setDivFeedback(null);
  };

  const handleSubmitDivision = async (e: React.FormEvent) => {
    e.preventDefault();
    setDivFeedback(null);
    setDivSubmitting(true);
    const budgetNum = Number(divBudget.replace(/[^0-9]/g, '')) || 0;
    try {
      const isEdit = Boolean(editingDivId);
      const url = isEdit ? `/api/divisions/${editingDivId}` : '/api/divisions';
      const method = isEdit ? 'PATCH' : 'POST';
      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: divName,
          shortName: divShortName,
          coordinator: divCoordinator,
          annualBudget: budgetNum,
          description: divDesc,
        }),
      });
      const data = (await res.json()) as { error?: string; division?: DivisionInfo };
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan divisi');

      if (!isEdit && data.division) {
        setTxDivision(data.division.id);
      }
      resetDivForm();
      setDivFeedback({
        kind: 'ok',
        text: isEdit ? 'Data divisi kas berhasil diperbarui.' : 'Divisi kas baru berhasil ditambahkan.',
      });
    } catch (err) {
      setDivFeedback({
        kind: 'err',
        text: err instanceof Error ? err.message : 'Terjadi kesalahan',
      });
    } finally {
      setDivSubmitting(false);
    }
  };

  const handleDeleteDivision = async (divisionId: string) => {
    setDivFeedback(null);
    try {
      const res = await authFetch(`/api/divisions/${divisionId}`, {
        method: 'DELETE',
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || 'Gagal menghapus divisi');
      if (editingDivId === divisionId) resetDivForm();
      setConfirmDeleteDivId(null);
      setDivFeedback({
        kind: 'ok',
        text: 'Divisi kas beserta mutasinya berhasil dihapus.',
      });
    } catch (err) {
      setDivFeedback({
        kind: 'err',
        text: err instanceof Error ? err.message : 'Terjadi kesalahan',
      });
    }
  };

  // --- Agenda Handlers ---
  const resetAgendaForm = () => {
    setEditingAgdId(null);
    setAgdTitle('');
    setAgdDate('2026-11-30');
    setAgdStart('08:00');
    setAgdEnd('10:00');
    setAgdLocation('');
    setAgdCategory('Kegiatan RT');
    setAgdDesc('');
  };

  const startEditAgenda = (item: AgendaItem) => {
    setEditingAgdId(item.id);
    setAgdTitle(item.title);
    setAgdDate(item.date);
    setAgdStart(item.startTime);
    setAgdEnd(item.endTime);
    setAgdLocation(item.location);
    setAgdDivision(item.divisionId);
    setAgdCategory(item.category);
    setAgdDesc(item.description);
    setAgdFeedback(null);
  };

  const handleSubmitAgenda = async (e: React.FormEvent) => {
    e.preventDefault();
    setAgdFeedback(null);
    setAgdSubmitting(true);
    try {
      const isEdit = Boolean(editingAgdId);
      const url = isEdit ? `/api/agenda/${editingAgdId}` : '/api/agenda';
      const method = isEdit ? 'PATCH' : 'POST';
      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: agdTitle,
          date: agdDate,
          startTime: agdStart,
          endTime: agdEnd,
          location: agdLocation,
          divisionId: effectiveAgdDivision,
          category: agdCategory,
          description: agdDesc,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan agenda');

      resetAgendaForm();
      setAgdFeedback({
        kind: 'ok',
        text: isEdit
          ? 'Agenda kegiatan berhasil diperbarui.'
          : 'Agenda kegiatan berhasil ditambahkan dan tampil di Laman Warga.',
      });
    } catch (err) {
      setAgdFeedback({
        kind: 'err',
        text: err instanceof Error ? err.message : 'Terjadi kesalahan',
      });
    } finally {
      setAgdSubmitting(false);
    }
  };

  const handleDeleteAgenda = async (agendaId: string) => {
    setAgdFeedback(null);
    try {
      const res = await authFetch(`/api/agenda/${agendaId}`, { method: 'DELETE' });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || 'Gagal menghapus agenda');
      if (editingAgdId === agendaId) resetAgendaForm();
      setConfirmDeleteAgdId(null);
      setAgdFeedback({ kind: 'ok', text: 'Agenda berhasil dihapus.' });
    } catch (err) {
      setAgdFeedback({
        kind: 'err',
        text: err instanceof Error ? err.message : 'Gagal menghapus agenda',
      });
    }
  };

  // --- Berita Handlers ---
  const resetNewsForm = () => {
    setEditingNewsId(null);
    setNewsTitle('');
    setNewsCategory('Pengumuman');
    setNewsAuthor(authUser.displayName || 'Pengurus RT 01 / RW 05');
    setNewsImageUrl(HERO_PRESETS[0].url);
    setNewsSummary('');
    setNewsContent('');
  };

  const startEditNews = (item: NewsItem) => {
    setEditingNewsId(item.id);
    setNewsTitle(item.title);
    setNewsCategory(item.category);
    setNewsAuthor(item.author);
    setNewsImageUrl(item.imageUrl || '');
    setNewsSummary(item.summary);
    setNewsContent(item.content);
    setNewsFeedback(null);
  };

  const handleSubmitNews = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewsFeedback(null);
    setNewsSubmitting(true);
    try {
      const isEdit = Boolean(editingNewsId);
      const url = isEdit ? `/api/news/${editingNewsId}` : '/api/news';
      const method = isEdit ? 'PATCH' : 'POST';
      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newsTitle,
          category: newsCategory,
          author: newsAuthor,
          imageUrl: newsImageUrl,
          summary: newsSummary,
          content: newsContent,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan berita');
      resetNewsForm();
      setNewsFeedback({
        kind: 'ok',
        text: isEdit
          ? 'Berita berhasil diperbarui dan disinkronkan.'
          : 'Berita baru berhasil diterbitkan dan disiarkan ke warga.',
      });
    } catch (err) {
      setNewsFeedback({
        kind: 'err',
        text: err instanceof Error ? err.message : 'Terjadi kesalahan',
      });
    } finally {
      setNewsSubmitting(false);
    }
  };

  const handleDeleteNews = async (newsId: string) => {
    setNewsFeedback(null);
    try {
      const res = await authFetch(`/api/news/${newsId}`, { method: 'DELETE' });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || 'Gagal menghapus berita');
      if (editingNewsId === newsId) resetNewsForm();
      setConfirmDeleteNewsId(null);
      setNewsFeedback({ kind: 'ok', text: 'Berita berhasil dihapus.' });
    } catch (err) {
      setNewsFeedback({
        kind: 'err',
        text: err instanceof Error ? err.message : 'Gagal menghapus berita',
      });
    }
  };

  // --- Usulan Warga Handlers ---
  const resetPropForm = () => {
    setPropFormMode('create');
    setEditingPropId(null);
    setPropTitle('');
    setPropResident('');
    setPropBlock('');
    setPropUrgency('Normal');
    setPropBudget('0');
    setPropDesc('');
  };

  const startEditProposal = (p: ProposalItem) => {
    setPropFormMode('edit');
    setEditingPropId(p.id);
    setPropTitle(p.title);
    setPropDivision(p.divisionId);
    setPropResident(p.residentName);
    setPropBlock(p.houseBlock);
    setPropUrgency(p.urgency);
    setPropBudget(String(p.estimatedBudget));
    setPropDesc(p.description);
    setPropFeedback(null);
  };

  const handleSubmitProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    setPropFeedback(null);
    setPropSubmitting(true);
    const budgetNum = Number(propBudget.replace(/[^0-9]/g, '')) || 0;
    try {
      const isEdit = propFormMode === 'edit' && Boolean(editingPropId);
      const url = isEdit ? `/api/proposals/${editingPropId}` : '/api/proposals';
      const method = isEdit ? 'PATCH' : 'POST';
      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: propTitle,
          divisionId: effectivePropDivision,
          residentName: propResident,
          houseBlock: propBlock,
          urgency: propUrgency,
          estimatedBudget: budgetNum,
          description: propDesc,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan usulan');
      resetPropForm();
      setPropFeedback({
        kind: 'ok',
        text: isEdit ? 'Detail usulan berhasil diperbarui.' : 'Usulan baru berhasil ditambahkan.',
      });
    } catch (err) {
      setPropFeedback({
        kind: 'err',
        text: err instanceof Error ? err.message : 'Terjadi kesalahan',
      });
    } finally {
      setPropSubmitting(false);
    }
  };

  const handleUpdateProposalStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusPropId) return;
    setPropFeedback(null);
    setPropSubmitting(true);
    try {
      const res = await authFetch(`/api/proposals/${statusPropId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: nextPropStatus,
          note: statusPropNote,
          updatedBy: `${authUser.displayName} (${authUser.position})`,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || 'Gagal memperbarui status usulan');
      setStatusPropId(null);
      setStatusPropNote('');
      setPropFeedback({
        kind: 'ok',
        text: `Status usulan berhasil diubah menjadi ${nextPropStatus}.`,
      });
    } catch (err) {
      setPropFeedback({
        kind: 'err',
        text: err instanceof Error ? err.message : 'Terjadi kesalahan',
      });
    } finally {
      setPropSubmitting(false);
    }
  };

  const handleDeleteProposal = async (id: string) => {
    setPropFeedback(null);
    try {
      const res = await authFetch(`/api/proposals/${id}`, { method: 'DELETE' });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || 'Gagal menghapus usulan');
      if (editingPropId === id) resetPropForm();
      if (statusPropId === id) setStatusPropId(null);
      setConfirmDeletePropId(null);
      setPropFeedback({ kind: 'ok', text: 'Usulan warga berhasil dihapus.' });
    } catch (err) {
      setPropFeedback({
        kind: 'err',
        text: err instanceof Error ? err.message : 'Gagal menghapus usulan',
      });
    }
  };

  // --- Hero Handlers ---
  const handleSaveHero = async (e: React.FormEvent) => {
    e.preventDefault();
    setHeroFeedback(null);
    setHeroSubmitting(true);
    try {
      const res = await authFetch('/api/hero', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eyebrow: heroEyebrow,
          title: heroTitle,
          subtitle: heroSubtitle,
          imageUrl: heroImageUrl,
          primaryCtaLabel: heroPrimaryCta,
          secondaryCtaLabel: heroSecondaryCta,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan perubahan hero');
      setHeroFeedback({
        kind: 'ok',
        text: 'Tampilan Hero Laman Warga berhasil diperbarui secara real-time.',
      });
    } catch (err) {
      setHeroFeedback({
        kind: 'err',
        text: err instanceof Error ? err.message : 'Terjadi kesalahan',
      });
    } finally {
      setHeroSubmitting(false);
    }
  };

  // --- Officials Handlers ---
  const startEditOfficial = (off: RtOfficial) => {
    setEditingOfficialId(off.id);
    setEditOffName(off.name);
    setEditOffPosition(off.position);
    setEditOffBlock(off.block);
    setEditOffPhoto(off.photoUrl || '');
    setPengurusFeedback(null);
  };

  const handleSaveOfficial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOfficialId) return;
    setPengurusSubmitting(true);
    setPengurusFeedback(null);
    try {
      const res = await authFetch(`/api/officials/${editingOfficialId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editOffName,
          position: editOffPosition,
          block: editOffBlock,
          photoUrl: editOffPhoto,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || 'Gagal memperbarui pengurus');
      setEditingOfficialId(null);
      setPengurusFeedback({ kind: 'ok', text: 'Data pengurus inti berhasil diperbarui.' });
    } catch (err) {
      setPengurusFeedback({
        kind: 'err',
        text: err instanceof Error ? err.message : 'Terjadi kesalahan',
      });
    } finally {
      setPengurusSubmitting(false);
    }
  };

  const handleAddOfficial = async (e: React.FormEvent) => {
    e.preventDefault();
    setPengurusSubmitting(true);
    setPengurusFeedback(null);
    try {
      const res = await authFetch('/api/officials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newOffName,
          position: newOffPosition,
          block: newOffBlock || 'RT 01 / RW 05 · Dinoyo',
          photoUrl: newOffPhoto,
          roleGroup: 'inti',
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || 'Gagal menambahkan pengurus');
      setNewOffName('');
      setNewOffPosition('');
      setNewOffBlock('');
      setPengurusFeedback({ kind: 'ok', text: 'Pengurus baru ditambahkan ke slide.' });
    } catch (err) {
      setPengurusFeedback({
        kind: 'err',
        text: err instanceof Error ? err.message : 'Terjadi kesalahan',
      });
    } finally {
      setPengurusSubmitting(false);
    }
  };

  const handleDeleteOfficial = async (id: string) => {
    setPengurusFeedback(null);
    try {
      const res = await authFetch(`/api/officials/${id}`, { method: 'DELETE' });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || 'Gagal menghapus pengurus');
      setConfirmDeleteOffId(null);
      setPengurusFeedback({ kind: 'ok', text: 'Pengurus dihapus dari daftar.' });
    } catch (err) {
      setPengurusFeedback({
        kind: 'err',
        text: err instanceof Error ? err.message : 'Terjadi kesalahan',
      });
    }
  };

  const startEditDivCoordinator = (div: DivisionInfo) => {
    setEditingDivCoordId(div.id);
    setEditDivCoordinator(div.coordinator);
    setEditDivShortName(div.shortName);
    setEditDivPhoto(div.photoUrl || '');
    setPengurusFeedback(null);
  };

  const handleSaveDivCoordinator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDivCoordId) return;
    setPengurusSubmitting(true);
    setPengurusFeedback(null);
    try {
      const res = await authFetch(`/api/divisions/${editingDivCoordId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coordinator: editDivCoordinator,
          shortName: editDivShortName,
          photoUrl: editDivPhoto,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || 'Gagal memperbarui koordinator divisi');
      setEditingDivCoordId(null);
      setPengurusFeedback({ kind: 'ok', text: 'Koordinator divisi berhasil diperbarui.' });
    } catch (err) {
      setPengurusFeedback({
        kind: 'err',
        text: err instanceof Error ? err.message : 'Terjadi kesalahan',
      });
    } finally {
      setPengurusSubmitting(false);
    }
  };

  return (
    <section
      aria-label="Panel Manajemen Portal Pengurus"
      className="bg-white border border-slate-200 rounded-xl overflow-hidden"
    >
      {/* Tool 1: Input, Edit & Hapus Kas Divisi */}
      {activeTool === 'input_kas' && (
        <div className="p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form onSubmit={handleSubmitKas} className="lg:col-span-6 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-semibold text-slate-900">
                {editingTxId ? 'Edit Mutasi Kas Divisi' : 'Tambah Mutasi Kas Divisi'}
              </div>
              {editingTxId && (
                <button
                  type="button"
                  onClick={resetKasForm}
                  className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900"
                >
                  <X className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Batal Edit</span>
                </button>
              )}
            </div>

            {txFeedback && (
              <div
                className={`p-3 text-xs rounded-lg border flex items-center gap-2 ${
                  txFeedback.kind === 'ok'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}
              >
                {txFeedback.kind === 'ok' && (
                  <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                )}
                <span>{txFeedback.text}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Pilih Divisi
                </label>
                <select
                  value={effectiveTxDivision}
                  onChange={(e) => setTxDivision(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                >
                  {divisions.map((div) => (
                    <option key={div.id} value={div.id}>
                      {div.shortName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Jenis Transaksi
                </label>
                <select
                  value={txType}
                  onChange={(e) =>
                    setTxType(e.target.value as 'pemasukan' | 'pengeluaran')
                  }
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                >
                  <option value="pemasukan">Pemasukan (+)</option>
                  <option value="pengeluaran">Pengeluaran (-)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Tanggal
                </label>
                <input
                  type="date"
                  required
                  value={txDate}
                  onChange={(e) => setTxDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Nominal (Rp)
                </label>
                <input
                  type="number"
                  min={1000}
                  required
                  value={txAmount}
                  onChange={(e) => setTxAmount(e.target.value)}
                  placeholder="500000"
                  className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Keterangan Laporan Kas
                </label>
                <input
                  type="text"
                  required
                  value={txDesc}
                  onChange={(e) => setTxDesc(e.target.value)}
                  placeholder="Contoh: Laporan kas Posyandu November 2026"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-600 whitespace-nowrap">
                  Pencatat:
                </label>
                <input
                  type="text"
                  required
                  value={txRecorder}
                  onChange={(e) => setTxRecorder(e.target.value)}
                  className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <button
                type="submit"
                disabled={txSubmitting || divisions.length === 0}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                <span>
                  {txSubmitting
                    ? 'Menyimpan...'
                    : editingTxId
                      ? 'Simpan Perubahan Kas'
                      : 'Simpan Mutasi Kas'}
                </span>
              </button>
            </div>
          </form>

          {/* Kas Entries List with Edit & Delete */}
          <div className="lg:col-span-6 lg:border-l lg:border-slate-100 lg:pl-6 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs font-semibold text-slate-800">
                Daftar Mutasi Kas ({filteredTreasury.length})
              </div>
              <select
                aria-label="Filter mutasi berdasarkan divisi"
                value={txFilterDiv}
                onChange={(e) => setTxFilterDiv(e.target.value)}
                className="px-2.5 py-1 text-xs bg-white border border-slate-200 rounded-lg"
              >
                <option value="all">Semua Divisi</option>
                {divisions.map((div) => (
                  <option key={div.id} value={div.id}>
                    {div.shortName}
                  </option>
                ))}
              </select>
            </div>

            <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto pr-1">
              {filteredTreasury.map((trx) => {
                const confirming = confirmDeleteTxId === trx.id;
                const isEditingThis = editingTxId === trx.id;
                return (
                  <div
                    key={trx.id}
                    className={`py-2.5 px-2 rounded-lg flex items-center justify-between gap-3 ${
                      isEditingThis ? 'bg-emerald-50/70' : ''
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-slate-900 truncate">
                        {trx.description}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono tabular-nums">
                        {getDivisionShortLabel(trx.divisionId, divisions)} ·{' '}
                        {formatDateId(trx.date)} ·{' '}
                        <span
                          className={
                            trx.type === 'pemasukan'
                              ? 'text-emerald-800 font-semibold'
                              : 'text-slate-700 font-semibold'
                          }
                        >
                          {trx.type === 'pemasukan' ? '+' : '-'}
                          {formatRupiah(trx.amount)}
                        </span>
                      </div>
                    </div>

                    {confirming ? (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleDeleteTx(trx.id)}
                          className="px-2 py-1 text-[11px] font-semibold text-white bg-red-600 hover:bg-red-700 rounded"
                        >
                          Hapus
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteTxId(null)}
                          className="px-2 py-1 text-[11px] text-slate-600 hover:bg-slate-100 rounded"
                        >
                          Batal
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => startEditTx(trx)}
                          aria-label={`Edit mutasi ${trx.description}`}
                          className="p-1.5 text-slate-500 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteTxId(trx.id)}
                          aria-label={`Hapus mutasi ${trx.description}`}
                          className="p-1.5 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tool 2: Tambah / Edit / Hapus Divisi Kas */}
      {activeTool === 'kelola_divisi' && (
        <div className="p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form onSubmit={handleSubmitDivision} className="lg:col-span-6 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-semibold text-slate-900">
                {editingDivId ? 'Edit Kas Divisi' : 'Tambah Kas Divisi Baru'}
              </div>
              {editingDivId && (
                <button
                  type="button"
                  onClick={resetDivForm}
                  className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900"
                >
                  <X className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Batal Edit</span>
                </button>
              )}
            </div>

            {divFeedback && (
              <div
                className={`p-3 text-xs rounded-lg border flex items-center gap-2 ${
                  divFeedback.kind === 'ok'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}
              >
                {divFeedback.kind === 'ok' && (
                  <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                )}
                <span>{divFeedback.text}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Nama Lengkap Divisi
                </label>
                <input
                  type="text"
                  required
                  value={divName}
                  onChange={(e) => setDivName(e.target.value)}
                  placeholder="Contoh: Divisi Pendidikan & Taman Baca"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Nama Singkat
                </label>
                <input
                  type="text"
                  required
                  value={divShortName}
                  onChange={(e) => setDivShortName(e.target.value)}
                  placeholder="Contoh: Pendidikan"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Nama Koordinator Divisi
                </label>
                <input
                  type="text"
                  required
                  value={divCoordinator}
                  onChange={(e) => setDivCoordinator(e.target.value)}
                  placeholder="Contoh: Ibu Lestari Ningrum"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Target Anggaran Tahunan (Rp)
                </label>
                <input
                  type="number"
                  min={0}
                  value={divBudget}
                  onChange={(e) => setDivBudget(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Deskripsi Bidang (Opsional)
              </label>
              <input
                type="text"
                value={divDesc}
                onChange={(e) => setDivDesc(e.target.value)}
                placeholder="Fokus kegiatan dan penggunaan kas divisi..."
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={divSubmitting}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                <span>
                  {divSubmitting
                    ? 'Menyimpan...'
                    : editingDivId
                      ? 'Simpan Perubahan Divisi'
                      : 'Tambahkan Kas Divisi'}
                </span>
              </button>
            </div>
          </form>

          <div className="lg:col-span-6 lg:border-l lg:border-slate-100 lg:pl-6 space-y-3">
            <div className="text-xs font-semibold text-slate-800">
              Daftar Kas Divisi Aktif ({divisions.length})
            </div>
            <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto pr-1">
              {divisions.map((div) => {
                const txCount = treasury.filter((t) => t.divisionId === div.id).length;
                const confirming = confirmDeleteDivId === div.id;
                const isEditingThis = editingDivId === div.id;
                return (
                  <div
                    key={div.id}
                    className={`py-3 px-2 rounded-lg flex items-center justify-between gap-3 ${
                      isEditingThis ? 'bg-emerald-50/70' : ''
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-900 truncate">
                        {div.name}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 tabular-nums">
                        {div.coordinator} · {formatRupiah(div.annualBudget)} · {txCount} mutasi
                      </div>
                    </div>

                    {confirming ? (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleDeleteDivision(div.id)}
                          className="px-2.5 py-1 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-md"
                        >
                          Ya, Hapus
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteDivId(null)}
                          className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-md"
                        >
                          Batal
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => startEditDiv(div)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-lg"
                        >
                          <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          disabled={divisions.length <= 1}
                          onClick={() => setConfirmDeleteDivId(div.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 border border-red-200 rounded-lg disabled:opacity-40 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Hapus</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tool 3: Tambah, Edit & Kelola Agenda + Daftar Hadir */}
      {activeTool === 'tambah_agenda' && (
        <div className="p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form onSubmit={handleSubmitAgenda} className="lg:col-span-6 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-semibold text-slate-900">
                {editingAgdId ? 'Edit Agenda Kegiatan' : 'Tambah Agenda Kegiatan Warga'}
              </div>
              {editingAgdId && (
                <button
                  type="button"
                  onClick={resetAgendaForm}
                  className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900"
                >
                  <X className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Batal Edit</span>
                </button>
              )}
            </div>

            {agdFeedback && (
              <div
                className={`p-3 text-xs rounded-lg border flex items-center gap-2 ${
                  agdFeedback.kind === 'ok'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}
              >
                {agdFeedback.kind === 'ok' && (
                  <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                )}
                <span>{agdFeedback.text}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Judul Agenda
                </label>
                <input
                  type="text"
                  required
                  value={agdTitle}
                  onChange={(e) => setAgdTitle(e.target.value)}
                  placeholder="Contoh: Rapat Persiapan Lomba 17 Agustus"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Divisi Penyelenggara
                </label>
                <select
                  value={effectiveAgdDivision}
                  onChange={(e) => setAgdDivision(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                >
                  {divisions.map((div) => (
                    <option key={div.id} value={div.id}>
                      {div.shortName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Tanggal
                </label>
                <input
                  type="date"
                  required
                  value={agdDate}
                  onChange={(e) => setAgdDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Jam Mulai
                </label>
                <input
                  type="time"
                  required
                  value={agdStart}
                  onChange={(e) => setAgdStart(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Jam Selesai
                </label>
                <input
                  type="time"
                  required
                  value={agdEnd}
                  onChange={(e) => setAgdEnd(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Kategori
                </label>
                <input
                  type="text"
                  value={agdCategory}
                  onChange={(e) => setAgdCategory(e.target.value)}
                  placeholder="Rapat Warga"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Lokasi
                </label>
                <input
                  type="text"
                  required
                  value={agdLocation}
                  onChange={(e) => setAgdLocation(e.target.value)}
                  placeholder="Balai Warga RT 01 Dinoyo"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Catatan Singkat
                </label>
                <input
                  type="text"
                  value={agdDesc}
                  onChange={(e) => setAgdDesc(e.target.value)}
                  placeholder="Agenda pembahasan atau perlengkapan warga"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={agdSubmitting || divisions.length === 0}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                <span>
                  {agdSubmitting
                    ? 'Menyimpan...'
                    : editingAgdId
                      ? 'Simpan Perubahan Agenda'
                      : 'Tambahkan Agenda'}
                </span>
              </button>
            </div>
          </form>

          <div className="lg:col-span-6 lg:border-l lg:border-slate-100 lg:pl-6 space-y-3">
            <div className="text-xs font-semibold text-slate-800">
              Agenda Terjadwal &amp; Daftar Hadir ({agenda.length})
            </div>
            <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto pr-1">
              {agenda.map((item) => {
                const confirming = confirmDeleteAgdId === item.id;
                const isExpanded = expandedAgendaId === item.id;
                const isEditingThis = editingAgdId === item.id;
                const attendees = item.attendees ?? [];
                return (
                  <div
                    key={item.id}
                    className={`py-2.5 px-2 rounded-lg space-y-2 ${
                      isEditingThis ? 'bg-emerald-50/70' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-slate-900 truncate">
                          {item.title}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono tabular-nums truncate">
                          {formatDateId(item.date)} · {item.startTime} · {item.location} ·{' '}
                          <span className="text-emerald-800 font-semibold">
                            {item.rsvpCount} hadir
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedAgendaId(isExpanded ? null : item.id)
                          }
                          className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                        >
                          <Users className="w-3 h-3 text-emerald-700" aria-hidden="true" />
                          <span>Hadir</span>
                          {isExpanded ? (
                            <ChevronUp className="w-3 h-3" aria-hidden="true" />
                          ) : (
                            <ChevronDown className="w-3 h-3" aria-hidden="true" />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => startEditAgenda(item)}
                          aria-label={`Edit agenda ${item.title}`}
                          className="p-1.5 text-slate-500 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>

                        {confirming ? (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleDeleteAgenda(item.id)}
                              className="px-2 py-1 text-[11px] font-semibold text-white bg-red-600 hover:bg-red-700 rounded"
                            >
                              Hapus
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteAgdId(null)}
                              className="px-2 py-1 text-[11px] text-slate-600 hover:bg-slate-100 rounded"
                            >
                              Batal
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteAgdId(item.id)}
                            aria-label={`Hapus agenda ${item.title}`}
                            className="p-1.5 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                        )}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700">
                          <span>Warga Konfirmasi Hadir</span>
                          <span className="font-mono tabular-nums text-emerald-800">
                            {item.rsvpCount} total
                          </span>
                        </div>

                        {attendees.length === 0 ? (
                          <p className="text-[11px] text-slate-500">
                            Belum ada nama warga tercatat pada daftar konfirmasi.
                          </p>
                        ) : (
                          <div className="divide-y divide-slate-200/70">
                            {attendees.map((att) => (
                              <div
                                key={att.id}
                                className="py-1.5 flex items-center justify-between gap-2 text-[11px]"
                              >
                                <div className="min-w-0 truncate">
                                  <span className="font-medium text-slate-900">
                                    {att.name}
                                  </span>{' '}
                                  <span className="text-slate-500 font-mono">
                                    ({att.block})
                                  </span>
                                </div>
                                <span className="text-[10px] text-slate-400 shrink-0 tabular-nums">
                                  {formatRelativeTime(att.timestamp)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        {attendees.length > 0 && item.rsvpCount > attendees.length && (
                          <p className="text-[10px] text-slate-500">
                            Menampilkan {attendees.length} konfirmasi terbaru dari{' '}
                            {item.rsvpCount} warga hadir.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tool 4: Buat, Edit & Hapus Berita */}
      {activeTool === 'buat_berita' && (
        <div className="p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form onSubmit={handleSubmitNews} className="lg:col-span-6 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-semibold text-slate-900">
                {editingNewsId ? 'Edit Berita Warga' : 'Terbitkan Berita / Pengumuman Warga'}
              </div>
              {editingNewsId && (
                <button
                  type="button"
                  onClick={resetNewsForm}
                  className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900"
                >
                  <X className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Batal Edit</span>
                </button>
              )}
            </div>

            {newsFeedback && (
              <div
                className={`p-3 text-xs rounded-lg border flex items-center gap-2 ${
                  newsFeedback.kind === 'ok'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}
              >
                {newsFeedback.kind === 'ok' && (
                  <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                )}
                <span>{newsFeedback.text}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Judul Berita
              </label>
              <input
                type="text"
                required
                value={newsTitle}
                onChange={(e) => setNewsTitle(e.target.value)}
                placeholder="Contoh: Jadwal Fogging & Kerja Bakti Minggu Ini"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Kategori
                </label>
                <select
                  value={newsCategory}
                  onChange={(e) => setNewsCategory(e.target.value)}
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
                  Penulis / Pengirim
                </label>
                <input
                  type="text"
                  value={newsAuthor}
                  onChange={(e) => setNewsAuthor(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Foto Berita
                </label>
                <select
                  value={newsImageUrl}
                  onChange={(e) => setNewsImageUrl(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                >
                  <option value="">Tanpa Foto</option>
                  {HERO_PRESETS.map((p) => (
                    <option key={p.url} value={p.url}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Ringkasan Singkat (Opsional)
              </label>
              <input
                type="text"
                value={newsSummary}
                onChange={(e) => setNewsSummary(e.target.value)}
                placeholder="Ringkasan singkat yang tampil di kartu berita..."
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
                value={newsContent}
                onChange={(e) => setNewsContent(e.target.value)}
                placeholder="Tulis isi berita atau informasi resmi untuk warga..."
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={newsSubmitting}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                <span>
                  {newsSubmitting
                    ? 'Menyimpan...'
                    : editingNewsId
                      ? 'Simpan Perubahan Berita'
                      : 'Terbitkan Berita'}
                </span>
              </button>
            </div>
          </form>

          <div className="lg:col-span-6 lg:border-l lg:border-slate-100 lg:pl-6 space-y-3">
            <div className="text-xs font-semibold text-slate-800">
              Berita Terbit ({news.length})
            </div>
            <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto pr-1">
              {news.map((item) => {
                const confirming = confirmDeleteNewsId === item.id;
                const isEditingThis = editingNewsId === item.id;
                return (
                  <div
                    key={item.id}
                    className={`py-2.5 px-2 rounded-lg flex items-center justify-between gap-3 ${
                      isEditingThis ? 'bg-emerald-50/70' : ''
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-900 truncate">
                        {item.title}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {item.category} · {formatDateId(item.publishedAt.slice(0, 10))} ·{' '}
                        {item.author}
                      </div>
                    </div>

                    {confirming ? (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleDeleteNews(item.id)}
                          className="px-2 py-1 text-[11px] font-semibold text-white bg-red-600 hover:bg-red-700 rounded"
                        >
                          Hapus
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteNewsId(null)}
                          className="px-2 py-1 text-[11px] text-slate-600 hover:bg-slate-100 rounded"
                        >
                          Batal
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => startEditNews(item)}
                          aria-label={`Edit berita ${item.title}`}
                          className="p-1.5 text-slate-500 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteNewsId(item.id)}
                          aria-label={`Hapus berita ${item.title}`}
                          className="p-1.5 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tool 5: Kelola Usulan Warga (Tambah, Edit, Update Status, Hapus) */}
      {activeTool === 'kelola_usulan' && (
        <div className="p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form onSubmit={handleSubmitProposal} className="lg:col-span-5 space-y-3.5">
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-semibold text-slate-900">
                {propFormMode === 'edit' ? 'Edit Detail Usulan' : 'Tambah Usulan Warga'}
              </div>
              {propFormMode === 'edit' && (
                <button
                  type="button"
                  onClick={resetPropForm}
                  className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900"
                >
                  <X className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Batal Edit</span>
                </button>
              )}
            </div>

            {propFeedback && (
              <div
                className={`p-3 text-xs rounded-lg border flex items-center gap-2 ${
                  propFeedback.kind === 'ok'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}
              >
                {propFeedback.kind === 'ok' && (
                  <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                )}
                <span>{propFeedback.text}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Judul Usulan
              </label>
              <input
                type="text"
                required
                value={propTitle}
                onChange={(e) => setPropTitle(e.target.value)}
                placeholder="Contoh: Perbaikan Pagar Taman Bermain"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Nama Pengusul
                </label>
                <input
                  type="text"
                  required
                  value={propResident}
                  onChange={(e) => setPropResident(e.target.value)}
                  placeholder="Nama warga"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Blok Rumah
                </label>
                <input
                  type="text"
                  required
                  value={propBlock}
                  onChange={(e) => setPropBlock(e.target.value)}
                  placeholder="Blok A-04"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Divisi
                </label>
                <select
                  value={effectivePropDivision}
                  onChange={(e) => setPropDivision(e.target.value)}
                  className="w-full px-2.5 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                >
                  {divisions.map((div) => (
                    <option key={div.id} value={div.id}>
                      {div.shortName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Urgensi
                </label>
                <select
                  value={propUrgency}
                  onChange={(e) => setPropUrgency(e.target.value as ProposalUrgency)}
                  className="w-full px-2.5 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                >
                  <option value="Normal">Normal</option>
                  <option value="Prioritas">Prioritas</option>
                  <option value="Mendesak">Mendesak</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Est. Biaya (Rp)
                </label>
                <input
                  type="number"
                  min={0}
                  value={propBudget}
                  onChange={(e) => setPropBudget(e.target.value)}
                  className="w-full px-2.5 py-2 text-xs font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Deskripsi Usulan
              </label>
              <textarea
                rows={3}
                required
                value={propDesc}
                onChange={(e) => setPropDesc(e.target.value)}
                placeholder="Rincian usulan warga..."
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>

            <button
              type="submit"
              disabled={propSubmitting}
              className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              <span>
                {propSubmitting
                  ? 'Menyimpan...'
                  : propFormMode === 'edit'
                    ? 'Simpan Perubahan Usulan'
                    : 'Tambah Usulan Warga'}
              </span>
            </button>
          </form>

          <div className="lg:col-span-7 lg:border-l lg:border-slate-100 lg:pl-6 space-y-3">
            <div className="text-xs font-semibold text-slate-800">
              Daftar Usulan Warga ({proposals.length})
            </div>

            <div className="divide-y divide-slate-100 max-h-[460px] overflow-y-auto pr-1">
              {proposals.map((p) => {
                const statusMeta = getStatusMeta(p.status);
                const confirmingDel = confirmDeletePropId === p.id;
                const isStatusOpen = statusPropId === p.id;
                const isEditingThis = editingPropId === p.id;

                return (
                  <div
                    key={p.id}
                    className={`py-3 px-2 rounded-lg space-y-2.5 ${
                      isEditingThis ? 'bg-emerald-50/70' : ''
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex flex-wrap items-center gap-x-2 text-[11px] text-slate-500">
                          <span className="font-mono font-semibold text-slate-700">
                            {p.code}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className={`font-semibold ${statusMeta.textClass}`}>
                            {statusMeta.label}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{getDivisionShortLabel(p.divisionId, divisions)}</span>
                        </div>
                        <div className="text-xs font-semibold text-slate-900 truncate">
                          {p.title}
                        </div>
                        <div className="text-[11px] text-slate-500 tabular-nums">
                          {p.residentName} ({p.houseBlock}) · {formatRupiah(p.estimatedBudget)}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            if (isStatusOpen) {
                              setStatusPropId(null);
                            } else {
                              setStatusPropId(p.id);
                              setNextPropStatus(p.status);
                              setStatusPropNote('');
                            }
                          }}
                          className="px-2.5 py-1 text-[11px] font-medium text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md"
                        >
                          Ubah Status
                        </button>
                        <button
                          type="button"
                          onClick={() => startEditProposal(p)}
                          aria-label={`Edit usulan ${p.title}`}
                          className="p-1.5 text-slate-500 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg"
                        >
                          <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                        {confirmingDel ? (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleDeleteProposal(p.id)}
                              className="px-2 py-1 text-[11px] font-semibold text-white bg-red-600 hover:bg-red-700 rounded"
                            >
                              Hapus
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeletePropId(null)}
                              className="px-2 py-1 text-[11px] text-slate-600 hover:bg-slate-100 rounded"
                            >
                              Batal
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeletePropId(p.id)}
                            aria-label={`Hapus usulan ${p.title}`}
                            className="p-1.5 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                        )}
                      </div>
                    </div>

                    {isStatusOpen && (
                      <form
                        onSubmit={handleUpdateProposalStatus}
                        className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2.5"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <div>
                            <label className="block text-[11px] font-medium text-slate-600 mb-1">
                              Status Baru
                            </label>
                            <select
                              value={nextPropStatus}
                              onChange={(e) =>
                                setNextPropStatus(e.target.value as ProposalStatus)
                              }
                              className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                            >
                              {[...PROPOSAL_STEPS, 'Ditolak' as ProposalStatus].map((st) => (
                                <option key={st} value={st}>
                                  {st}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[11px] font-medium text-slate-600 mb-1">
                              Catatan Progress
                            </label>
                            <input
                              type="text"
                              value={statusPropNote}
                              onChange={(e) => setStatusPropNote(e.target.value)}
                              placeholder="Catatan tindak lanjut pengurus..."
                              className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setStatusPropId(null)}
                            className="px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-200 rounded"
                          >
                            Tutup
                          </button>
                          <button
                            type="submit"
                            disabled={propSubmitting}
                            className="px-3 py-1 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg"
                          >
                            Simpan Status
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tool 6: Edit Hero */}
      {activeTool === 'edit_hero' && (
        <form onSubmit={handleSaveHero} className="p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="text-sm font-semibold text-slate-900">
              Ubah Konten &amp; Foto Hero Portal Warga
            </div>
          </div>

          {heroFeedback && (
            <div
              className={`p-3 text-xs rounded-lg border flex items-center gap-2 ${
                heroFeedback.kind === 'ok'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}
            >
              {heroFeedback.kind === 'ok' && (
                <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
              )}
              <span>{heroFeedback.text}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Label Wilayah (Eyebrow)
                  </label>
                  <input
                    type="text"
                    required
                    value={heroEyebrow}
                    onChange={(e) => setHeroEyebrow(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Judul Utama Hero
                  </label>
                  <input
                    type="text"
                    required
                    value={heroTitle}
                    onChange={(e) => setHeroTitle(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Subjudul / Deskripsi Singkat
                </label>
                <input
                  type="text"
                  required
                  value={heroSubtitle}
                  onChange={(e) => setHeroSubtitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Label Tombol Utama
                  </label>
                  <input
                    type="text"
                    value={heroPrimaryCta}
                    onChange={(e) => setHeroPrimaryCta(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Label Tombol Kedua
                  </label>
                  <input
                    type="text"
                    value={heroSecondaryCta}
                    onChange={(e) => setHeroSecondaryCta(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  URL Foto Latar Hero
                </label>
                <input
                  type="text"
                  value={heroImageUrl}
                  onChange={(e) => setHeroImageUrl(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>
            </div>

            <div className="lg:col-span-5 space-y-3">
              <div className="text-xs font-medium text-slate-700">
                Pilih Preset Foto Lingkungan
              </div>
              <div className="grid grid-cols-2 gap-2">
                {HERO_PRESETS.map((preset) => (
                  <button
                    key={preset.url}
                    type="button"
                    onClick={() => setHeroImageUrl(preset.url)}
                    className={`p-1.5 rounded-lg border text-left transition-colors ${
                      heroImageUrl === preset.url
                        ? 'border-emerald-700 bg-emerald-50/70'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <img
                      src={preset.url}
                      alt={preset.label}
                      referrerPolicy="no-referrer"
                      className="w-full h-16 object-cover rounded"
                    />
                    <div className="mt-1 text-[11px] font-medium text-slate-800 truncate">
                      {preset.label}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={heroSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 rounded-lg transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{heroSubmitting ? 'Menyimpan...' : 'Simpan Perubahan Hero'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Tool 7: Edit Jajaran Pengurus */}
      {activeTool === 'edit_pengurus' && (
        <div className="p-5 sm:p-6 space-y-6">
          {pengurusFeedback && (
            <div
              className={`p-3 text-xs rounded-lg border flex items-center gap-2 ${
                pengurusFeedback.kind === 'ok'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}
            >
              {pengurusFeedback.kind === 'ok' && (
                <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
              )}
              <span>{pengurusFeedback.text}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Pengurus Inti List & Inline Editor */}
            <div className="lg:col-span-7 space-y-4">
              <div className="text-xs font-semibold text-slate-800">
                Pengurus Inti {siteSettings.regionCode} ({officials.length})
              </div>

              <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg px-4">
                {officials.map((off) => {
                  const isEditing = editingOfficialId === off.id;
                  const isConfirmingDel = confirmDeleteOffId === off.id;

                  if (isEditing) {
                    return (
                      <form
                        key={off.id}
                        onSubmit={handleSaveOfficial}
                        className="py-3.5 space-y-3"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          <input
                            type="text"
                            required
                            value={editOffPosition}
                            onChange={(e) => setEditOffPosition(e.target.value)}
                            placeholder="Jabatan"
                            className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg"
                          />
                          <input
                            type="text"
                            required
                            value={editOffName}
                            onChange={(e) => setEditOffName(e.target.value)}
                            placeholder="Nama Lengkap"
                            className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg"
                          />
                          <input
                            type="text"
                            value={editOffBlock}
                            onChange={(e) => setEditOffBlock(e.target.value)}
                            placeholder="Blok / Alamat"
                            className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg"
                          />
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <select
                            value={editOffPhoto}
                            onChange={(e) => setEditOffPhoto(e.target.value)}
                            className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                          >
                            <option value="">Tanpa Foto (Inisial)</option>
                            {PORTRAIT_PRESETS.map((p) => (
                              <option key={p.url} value={p.url}>
                                Foto: {p.label}
                              </option>
                            ))}
                          </select>
                          <button
                            type="submit"
                            disabled={pengurusSubmitting}
                            className="px-3 py-1.5 text-xs font-medium text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg"
                          >
                            Simpan
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingOfficialId(null)}
                            className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                          >
                            Batal
                          </button>
                        </div>
                      </form>
                    );
                  }

                  return (
                    <div
                      key={off.id}
                      className="py-3 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {off.photoUrl && (
                          <img
                            src={off.photoUrl}
                            alt={off.name}
                            referrerPolicy="no-referrer"
                            className="w-9 h-9 rounded-lg object-cover border border-slate-200 shrink-0"
                          />
                        )}
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-slate-900 truncate">
                            {off.name}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate">
                            {off.position} · {off.block}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => startEditOfficial(off)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-lg"
                        >
                          <Pencil className="w-3 h-3" aria-hidden="true" />
                          <span>Edit</span>
                        </button>
                        {isConfirmingDel ? (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleDeleteOfficial(off.id)}
                              className="px-2 py-1 text-[11px] font-semibold text-white bg-red-600 rounded"
                            >
                              Ya
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteOffId(null)}
                              className="px-2 py-1 text-[11px] text-slate-600 hover:bg-slate-100 rounded"
                            >
                              Batal
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            disabled={officials.length <= 1}
                            onClick={() => setConfirmDeleteOffId(off.id)}
                            aria-label={`Hapus ${off.name}`}
                            className="p-1.5 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded-lg disabled:opacity-40"
                          >
                            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Koordinator Divisi Editor */}
              <div className="text-xs font-semibold text-slate-800 pt-2">
                Koordinator Divisi ({divisions.length})
              </div>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg px-4">
                {divisions.map((div) => {
                  const isEditing = editingDivCoordId === div.id;
                  if (isEditing) {
                    return (
                      <form
                        key={div.id}
                        onSubmit={handleSaveDivCoordinator}
                        className="py-3 space-y-2.5"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <input
                            type="text"
                            required
                            value={editDivShortName}
                            onChange={(e) => setEditDivShortName(e.target.value)}
                            placeholder="Nama Divisi"
                            className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg"
                          />
                          <input
                            type="text"
                            required
                            value={editDivCoordinator}
                            onChange={(e) => setEditDivCoordinator(e.target.value)}
                            placeholder="Nama Koordinator"
                            className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg"
                          />
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <select
                            value={editDivPhoto}
                            onChange={(e) => setEditDivPhoto(e.target.value)}
                            className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                          >
                            <option value="">Tanpa Foto (Inisial)</option>
                            {PORTRAIT_PRESETS.map((p) => (
                              <option key={p.url} value={p.url}>
                                Foto: {p.label}
                              </option>
                            ))}
                          </select>
                          <button
                            type="submit"
                            disabled={pengurusSubmitting}
                            className="px-3 py-1.5 text-xs font-medium text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg"
                          >
                            Simpan
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingDivCoordId(null)}
                            className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                          >
                            Batal
                          </button>
                        </div>
                      </form>
                    );
                  }

                  return (
                    <div
                      key={div.id}
                      className="py-2.5 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {div.photoUrl && (
                          <img
                            src={div.photoUrl}
                            alt={div.coordinator}
                            referrerPolicy="no-referrer"
                            className="w-8 h-8 rounded-lg object-cover border border-slate-200 shrink-0"
                          />
                        )}
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-slate-900 truncate">
                            {div.coordinator}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate">
                            Koordinator {div.shortName}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => startEditDivCoordinator(div)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-lg shrink-0"
                      >
                        <Pencil className="w-3 h-3" aria-hidden="true" />
                        <span>Edit</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tambah Pengurus Baru */}
            <form
              onSubmit={handleAddOfficial}
              className="lg:col-span-5 lg:border-l lg:border-slate-100 lg:pl-6 space-y-3"
            >
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                <UserPlus className="w-4 h-4 text-emerald-800" aria-hidden="true" />
                <span>Tambah Anggota Pengurus</span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  required
                  value={newOffName}
                  onChange={(e) => setNewOffName(e.target.value)}
                  placeholder="Contoh: Bpk. Wahyu Hidayat"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Jabatan
                </label>
                <input
                  type="text"
                  required
                  value={newOffPosition}
                  onChange={(e) => setNewOffPosition(e.target.value)}
                  placeholder="Contoh: Wakil Ketua RT"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Blok / Keterangan
                </label>
                <input
                  type="text"
                  value={newOffBlock}
                  onChange={(e) => setNewOffBlock(e.target.value)}
                  placeholder="Blok B-09 · Dinoyo"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Foto Profil Pengurus
                </label>
                <select
                  value={newOffPhoto}
                  onChange={(e) => setNewOffPhoto(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                >
                  <option value="">Tanpa Foto (Inisial)</option>
                  {PORTRAIT_PRESETS.map((p) => (
                    <option key={p.url} value={p.url}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={pengurusSubmitting}
                className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{pengurusSubmitting ? 'Menyimpan...' : 'Tambah ke Jajaran Pengurus'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Tool 8: Superadmin Web Title & Identity */}
      {activeTool === 'identitas_web' && authUser.role === 'superadmin' && (
        <SuperadminSiteSettingsPanel siteSettings={siteSettings} />
      )}

      {/* Tool 9: Superadmin Account Management */}
      {activeTool === 'akun_pengurus' && authUser.role === 'superadmin' && (
        <SuperadminUsersPanel currentUser={authUser} />
      )}
    </section>
  );
}

export const PENGURUS_TOOL_ITEMS: Array<{
  id: DashboardTool;
  label: string;
  description: string;
  icon: typeof Wallet;
  superadminOnly?: boolean;
}> = [
  {
    id: 'input_kas',
    label: 'Kas Divisi',
    description: 'Tambah, edit & hapus mutasi kas',
    icon: Wallet,
  },
  {
    id: 'kelola_divisi',
    label: 'Divisi Kas',
    description: 'Kelola divisi & anggaran tahunan',
    icon: FolderPlus,
  },
  {
    id: 'tambah_agenda',
    label: 'Agenda & Hadir',
    description: 'Kelola jadwal & daftar hadir warga',
    icon: CalendarPlus,
  },
  {
    id: 'buat_berita',
    label: 'Berita RT',
    description: 'Terbitkan, edit & hapus berita',
    icon: Newspaper,
  },
  {
    id: 'kelola_usulan',
    label: 'Usulan Warga',
    description: 'Tindak lanjut, edit & hapus usulan',
    icon: ClipboardList,
  },
  {
    id: 'edit_hero',
    label: 'Edit Hero',
    description: 'Ubah judul & gambar utama portal',
    icon: ImageIcon,
  },
  {
    id: 'edit_pengurus',
    label: 'Jajaran Pengurus',
    description: 'Kelola profil pengurus & koordinator',
    icon: Users,
  },
  {
    id: 'identitas_web',
    label: 'Judul & Identitas Web',
    description: 'Ubah judul web & identitas wilayah RT/RW',
    icon: Globe,
    superadminOnly: true,
  },
  {
    id: 'akun_pengurus',
    label: 'Akun Pengurus',
    description: 'Buat username & password pengurus',
    icon: KeyRound,
    superadminOnly: true,
  },
];
