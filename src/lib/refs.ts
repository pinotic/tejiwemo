export const SITE = {
  name: "RT Kita",
  tagline: "Portal warga & sistem informasi pengurus RT",
};

// Tautan media sosial. Isi lewat environment variable (lihat .env.example);
// ikon hanya tampil jika URL-nya diisi.
export const SOCIAL = [
  { key: "instagram", label: "Instagram", url: process.env.NEXT_PUBLIC_INSTAGRAM_URL ?? "" },
  { key: "youtube", label: "YouTube", url: process.env.NEXT_PUBLIC_YOUTUBE_URL ?? "" },
].filter((s) => s.url);

// ---------- Lini keuangan ----------
export const LINI = [
  { key: "kas_rt", label: "Kas RT" },
  { key: "dasawisma_1", label: "Dasawisma 1" },
  { key: "dasawisma_2", label: "Dasawisma 2" },
  { key: "dasawisma_3", label: "Dasawisma 3" },
  { key: "dasawisma_4", label: "Dasawisma 4" },
  { key: "tahlil", label: "Tahlil" },
  { key: "sdm", label: "SDM" },
  { key: "pkk", label: "PKK" },
  { key: "masjid", label: "Masjid" },
] as const;

export type LiniKey = (typeof LINI)[number]["key"];
export const LINI_KEYS = LINI.map((l) => l.key) as unknown as [LiniKey, ...LiniKey[]];
export const liniLabel = (k: string) => LINI.find((l) => l.key === k)?.label ?? k;

// ---------- Usulan ----------
export const PROPOSAL_STATUS = [
  { key: "diterima", label: "Diterima", desc: "Usulan sudah masuk dan tercatat." },
  { key: "dibahas", label: "Dibahas", desc: "Sedang dibahas dalam rapat pengurus." },
  { key: "disetujui", label: "Disetujui", desc: "Disetujui dan menunggu pelaksanaan." },
  { key: "dikerjakan", label: "Dikerjakan", desc: "Sedang dilaksanakan." },
  { key: "selesai", label: "Selesai", desc: "Usulan telah terlaksana." },
  { key: "ditolak", label: "Tidak dapat dilanjutkan", desc: "Usulan belum dapat ditindaklanjuti." },
] as const;
export const statusLabel = (k: string) => PROPOSAL_STATUS.find((s) => s.key === k)?.label ?? k;

export const PROPOSAL_CATEGORY = [
  { key: "infrastruktur", label: "Infrastruktur & lingkungan" },
  { key: "keamanan", label: "Keamanan" },
  { key: "sosial", label: "Sosial & kegiatan warga" },
  { key: "keuangan", label: "Iuran & keuangan" },
  { key: "lainnya", label: "Lainnya" },
] as const;
export const categoryLabel = (k: string) =>
  PROPOSAL_CATEGORY.find((c) => c.key === k)?.label ?? k;

// ---------- Penduduk ----------
export const RESIDENT_STATUS = [
  { key: "tetap", label: "Tetap" },
  { key: "kontrak", label: "Kontrak" },
  { key: "kos", label: "Kos" },
] as const;
export const residentStatusLabel = (k: string) =>
  RESIDENT_STATUS.find((s) => s.key === k)?.label ?? k;

// ---------- Arsip ----------
export const ARCHIVE_CATEGORY = [
  { key: "surat_masuk", label: "Surat Masuk" },
  { key: "surat_keluar", label: "Surat Keluar" },
  { key: "notulen", label: "Notulen" },
  { key: "berita_acara", label: "Berita Acara" },
  { key: "perjanjian", label: "Perjanjian" },
  { key: "proposal", label: "Proposal" },
  { key: "lainnya", label: "Dokumen Lain" },
] as const;
export const archiveLabel = (k: string) => ARCHIVE_CATEGORY.find((c) => c.key === k)?.label ?? k;

// ---------- Peran & hak akses ----------
export const ROLES = [
  { key: "superadmin", label: "Superadmin" },
  { key: "ketua", label: "Ketua" },
  { key: "sekretaris", label: "Sekretaris" },
  { key: "bendahara", label: "Bendahara" },
  { key: "anggota", label: "Anggota / Seksi" },
] as const;
export const roleLabel = (k: string) => ROLES.find((r) => r.key === k)?.label ?? k;

export type Module = "berita" | "keuangan" | "usulan" | "penduduk" | "arsip" | "pengurus" | "akun";

// Siapa boleh MENGUBAH data pada tiap modul. Superadmin boleh semuanya.
// Semua pengurus yang login boleh MELIHAT kecuali data penduduk (ketua, sekretaris,
// superadmin) dan akun (hanya superadmin).
export const WRITE_ACCESS: Record<Module, string[]> = {
  berita: ["superadmin", "ketua", "sekretaris", "anggota"],
  keuangan: ["superadmin", "ketua", "bendahara"],
  usulan: ["superadmin", "ketua", "sekretaris"],
  penduduk: ["superadmin", "ketua", "sekretaris"],
  arsip: ["superadmin", "ketua", "sekretaris"],
  pengurus: ["superadmin", "ketua", "sekretaris"],
  akun: ["superadmin"],
};
export const READ_ACCESS: Record<Module, string[]> = {
  berita: ["superadmin", "ketua", "sekretaris", "bendahara", "anggota"],
  keuangan: ["superadmin", "ketua", "sekretaris", "bendahara", "anggota"],
  usulan: ["superadmin", "ketua", "sekretaris", "bendahara", "anggota"],
  penduduk: ["superadmin", "ketua", "sekretaris"],
  arsip: ["superadmin", "ketua", "sekretaris", "bendahara", "anggota"],
  pengurus: ["superadmin", "ketua", "sekretaris", "bendahara", "anggota"],
  akun: ["superadmin"],
};

// ---------- Susunan pengurus (ditampilkan di situs warga) ----------
export const OFFICER_GROUP = [
  { key: "inti", label: "Pengurus Inti" },
  { key: "seksi", label: "Seksi & Koordinator" },
] as const;
