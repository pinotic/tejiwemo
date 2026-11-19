import 'dotenv/config';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import express from 'express';
import fs from 'fs';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import type {
  ActivityItem,
  AgendaAttendee,
  AgendaItem,
  AuthRole,
  AuthUser,
  DivisionId,
  DivisionInfo,
  HeroConfig,
  NewsItem,
  NotificationItem,
  ProposalItem,
  ProposalStatus,
  ProposalUrgency,
  RtOfficial,
  RtRealtimeEvent,
  RtSnapshotState,
  SiteSettings,
  TreasuryTransaction,
} from './src/types.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'rt-state.json');
const AUTH_FILE = path.join(DATA_DIR, 'rt-auth.json');

const IS_SERVERLESS = Boolean(
  process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME
);
const SUPABASE_URL = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
const SUPABASE_SERVICE_ROLE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
const USE_SUPABASE = Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);

let supabaseInitError: string | null = null;
let supabaseAdmin: SupabaseClient | null = null;

if (USE_SUPABASE) {
  try {
    if (!/^https?:\/\/.+/.test(SUPABASE_URL)) {
      throw new Error(
        `SUPABASE_URL tidak valid ("${SUPABASE_URL.slice(0, 30)}"). Harus diawali https://`
      );
    }
    if (
      SUPABASE_SERVICE_ROLE_KEY === 'SUPABASE_SERVICE_ROLE_KEY' ||
      SUPABASE_SERVICE_ROLE_KEY.length < 20
    ) {
      throw new Error(
        'SUPABASE_SERVICE_ROLE_KEY masih berisi placeholder atau terlalu pendek. Salin nilai asli dari Supabase Project Settings -> API Keys.'
      );
    }
    supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  } catch (err) {
    supabaseInitError =
      err instanceof Error ? err.message : 'Gagal inisialisasi klien Supabase admin.';
    console.error('Supabase init error:', supabaseInitError);
  }
}

let dirtyState = false;
let dirtyAuth = false;

const VALID_STATUSES: ProposalStatus[] = [
  'Diajukan',
  'Ditinjau',
  'Disetujui',
  'Dikerjakan',
  'Selesai',
  'Ditolak',
];

function isValidDivision(divisionId: string | undefined): divisionId is DivisionId {
  return Boolean(divisionId && state.divisions.some((d) => d.id === divisionId));
}

function createSeedState(): RtSnapshotState {
  return {
    siteSettings: {
      webTitle: 'Portal Warga',
      regionCode: 'RT 01 / RW 05',
      regionIdentity: 'RT 01 / RW 05 · Kelurahan Dinoyo',
      locationName: 'Balai Warga Kelurahan Dinoyo',
    },
    hero: {
      eyebrow: 'RT 01 / RW 05 · Kelurahan Dinoyo',
      title: 'Portal Warga RT 01 Dinoyo',
      subtitle:
        'Info kegiatan, laporan kas divisi bulanan, dan pantau usulan secara real-time.',
      imageUrl: '/src/assets/images/hero_dinoyo_rt01_1794982207800.jpg',
      primaryCtaLabel: 'Ajukan Usulan',
      secondaryCtaLabel: 'Kas Divisi',
    },
    officials: [
      {
        id: 'off-1',
        name: 'Bpk. H. Ahmad Fauzi',
        position: 'Ketua RT 01',
        roleGroup: 'inti',
        block: 'Blok A-01 · Dinoyo',
        schedule: 'Layanan Warga: Senin–Sabtu, 18:30–21:00 WIB',
        photoUrl: '/src/assets/images/pengurus_ketua_rt_1794982800746.jpg',
      },
      {
        id: 'off-2',
        name: 'Ibu Dewi Kartika',
        position: 'Sekretaris RT',
        roleGroup: 'inti',
        block: 'Blok B-05 · Dinoyo',
        schedule: 'Administrasi & Surat Pengantar',
        photoUrl: '/src/assets/images/pengurus_sekretaris_rt_1794982801152.jpg',
      },
      {
        id: 'off-3',
        name: 'Bpk. Bambang Sutrisno',
        position: 'Bendahara RT',
        roleGroup: 'inti',
        block: 'Blok A-11 · Dinoyo',
        schedule: 'Verifikasi Laporan Kas Bulanan',
        photoUrl: '/src/assets/images/pengurus_bendahara_rt_1794982800996.jpg',
      },
    ],
    divisions: [
      {
        id: 'kebersihan',
        name: 'Divisi Kebersihan & Lingkungan',
        shortName: 'Kebersihan',
        coordinator: 'Bpk. Hendra Wijaya',
        description:
          'Pengelolaan sampah rumah tangga, bank sampah, penghijauan jalur taman, dan saluran drainase lingkungan.',
        annualBudget: 18000000,
        photoUrl: '/src/assets/images/koordinator_kebersihan_1794982802849.jpg',
      },
      {
        id: 'keamanan',
        name: 'Divisi Keamanan & Ketertiban',
        shortName: 'Keamanan',
        coordinator: 'Bpk. Rahmat Hidayat',
        description:
          'Operasional satpam cluster, pemeliharaan CCTV portal utama, jadwal ronda warga, dan sistem akses gerbang.',
        annualBudget: 24000000,
        photoUrl: '/src/assets/images/koordinator_keamanan_1794982803960.jpg',
      },
      {
        id: 'sosial',
        name: 'Divisi Sosial, Kesehatan & PKK',
        shortName: 'Sosial & PKK',
        coordinator: 'Ibu Ratna Sari',
        description:
          'Layanan Posyandu balita & lansia, santunan duka/sakit warga, dan kegiatan pemberdayaan keluarga.',
        annualBudget: 14500000,
        photoUrl: '/src/assets/images/koordinator_sosial_1794982804581.jpg',
      },
      {
        id: 'pemuda',
        name: 'Divisi Pemuda & Olahraga',
        shortName: 'Pemuda',
        coordinator: 'Sdr. Dimas Pratama',
        description:
          'Pengelolaan lapangan serbaguna, senam pagi mingguan, karang taruna, dan peringatan hari besar nasional.',
        annualBudget: 12000000,
        photoUrl: '/src/assets/images/koordinator_pemuda_1794982803573.jpg',
      },
      {
        id: 'infrastruktur',
        name: 'Divisi Infrastruktur & Penerangan',
        shortName: 'Infrastruktur',
        coordinator: 'Bpk. Agus Santoso',
        description:
          'Pemeliharaan PJU (lampu jalan), pengaspalan jalan blok, perbaikan pos kamling, dan balai warga.',
        annualBudget: 22000000,
        photoUrl: '/src/assets/images/koordinator_infrastruktur_1794982804740.jpg',
      },
    ],
    activities: [
      {
        id: 'act-1',
        title: 'Kerja Bakti Pembersihan Drainase & Peremajaan Taman Blok A–C',
        category: 'Lingkungan',
        divisionId: 'kebersihan',
        date: '2026-11-22',
        time: '07:00 – 10:00 WIB',
        location: 'Sepanjang Jl. Anggrek & Taman Tengah RT 04',
        summary:
          'Pembersihan selokan sebelum puncak musim hujan serta penanaman 30 bibit pucuk merah di area fasum.',
        details:
          'Seluruh kepala keluarga diharapkan membawa peralatan kebersihan pribadi (sapu lidi, cangkul kecil, atau sarung tangan). Konsumsi pagi dan kantong sampah besar disediakan oleh Divisi Kebersihan mulai pukul 06:45 WIB di Balai Warga.',
        coordinator: 'Bpk. Hendra Wijaya',
        imageUrl: '/src/assets/images/kegiatan_kerja_bakti_1794973651734.jpg',
        attendeesCount: 42,
        status: 'Terjadwal',
      },
      {
        id: 'act-2',
        title: 'Posyandu Melati & Pemeriksaan Kesehatan Lansia Terpadu',
        category: 'Kesehatan',
        divisionId: 'sosial',
        date: '2026-11-25',
        time: '08:30 – 11:30 WIB',
        location: 'Balai Warga RT 01 Dinoyo',
        summary:
          'Penimbangan balita, pemberian vitamin, serta cek tekanan darah dan gula darah gratis bekerja sama dengan Puskesmas Kelurahan.',
        details:
          'Warga lansia dan ibu balita dimohon membawa buku KIA atau kartu berobat masing-masing. Tim kader PKK RT 01 juga akan membagikan paket makanan tambahan bergizi untuk 28 balita terdaftar.',
        coordinator: 'Ibu Ratna Sari',
        imageUrl: '/src/assets/images/kegiatan_posyandu_1794973652119.jpg',
        attendeesCount: 31,
        status: 'Terjadwal',
      },
      {
        id: 'act-3',
        title: 'Evaluasi Sistem Patroli Malam & Pemasangan CCTV Titik Sudut Blok D',
        category: 'Keamanan',
        divisionId: 'keamanan',
        date: '2026-11-15',
        time: '19:30 – 21:00 WIB',
        location: 'Pos Kamling Utama Gerbang Dinoyo',
        summary:
          'Penambahan dua unit kamera pengawas beresolusi tinggi serta pembaruan jadwal ronda akhir pekan bersama petugas keamanan.',
        details:
          'Pemasangan dua kamera night-vision di simpang Blok D dan area parkir tamu telah selesai diuji coba. Rekaman terhubung ke monitor Pos Kamling 24 jam untuk memastikan keamanan lingkungan.',
        coordinator: 'Bpk. Rahmat Hidayat',
        imageUrl: '/src/assets/images/kegiatan_ronda_malam_1794973653012.jpg',
        attendeesCount: 19,
        status: 'Selesai',
      },
    ],
    treasury: [
      {
        id: 'trx-101',
        divisionId: 'kebersihan',
        date: '2026-11-02',
        description: 'Alokasi Iuran Kebersihan Warga Bulan November (64 KK)',
        type: 'pemasukan',
        amount: 3200000,
        recordedBy: 'Bendahara RT',
        referenceCode: 'KAS-KBR-1101',
      },
      {
        id: 'trx-102',
        divisionId: 'kebersihan',
        date: '2026-11-06',
        description: 'Retribusi Pengangkutan Sampah & Armada Gerobak',
        type: 'pengeluaran',
        amount: 1450000,
        recordedBy: 'Bpk. Hendra Wijaya',
        referenceCode: 'KAS-KBR-1102',
      },
      {
        id: 'trx-103',
        divisionId: 'kebersihan',
        date: '2026-11-12',
        description: 'Pembelian 30 Bibit Tanaman & Kantong Sampah Biodegradable',
        type: 'pengeluaran',
        amount: 480000,
        recordedBy: 'Bpk. Hendra Wijaya',
        referenceCode: 'KAS-KBR-1103',
      },
      {
        id: 'trx-104',
        divisionId: 'keamanan',
        date: '2026-11-02',
        description: 'Alokasi Iuran Keamanan Lingkungan Bulan November',
        type: 'pemasukan',
        amount: 5120000,
        recordedBy: 'Bendahara RT',
        referenceCode: 'KAS-KMN-1101',
      },
      {
        id: 'trx-105',
        divisionId: 'keamanan',
        date: '2026-11-05',
        description: 'Honorarium 2 Petugas Keamanan Shift Malam & Pagi',
        type: 'pengeluaran',
        amount: 3400000,
        recordedBy: 'Bpk. Rahmat Hidayat',
        referenceCode: 'KAS-KMN-1102',
      },
      {
        id: 'trx-106',
        divisionId: 'keamanan',
        date: '2026-11-14',
        description: 'Pengadaan 2 Kamera CCTV Night-Vision Titik Blok D',
        type: 'pengeluaran',
        amount: 1150000,
        recordedBy: 'Bpk. Rahmat Hidayat',
        referenceCode: 'KAS-KMN-1103',
      },
      {
        id: 'trx-111',
        divisionId: 'infrastruktur',
        date: '2026-11-01',
        description: 'Alokasi Dana Pemeliharaan Infrastruktur November',
        type: 'pemasukan',
        amount: 4500000,
        recordedBy: 'Bendahara RT',
        referenceCode: 'KAS-INF-1101',
      },
      {
        id: 'trx-112',
        divisionId: 'infrastruktur',
        date: '2026-11-13',
        description: 'Pengadaan 6 Unit Lampu LED PJU 40W & Kabel Tiang Blok C',
        type: 'pengeluaran',
        amount: 1920000,
        recordedBy: 'Bpk. Agus Santoso',
        referenceCode: 'KAS-INF-1102',
      },
      {
        id: 'trx-091',
        divisionId: 'kebersihan',
        date: '2026-10-03',
        description: 'Iuran Kebersihan Warga Bulan Oktober (64 KK)',
        type: 'pemasukan',
        amount: 3200000,
        recordedBy: 'Bendahara RT',
        referenceCode: 'KAS-KBR-1001',
      },
      {
        id: 'trx-092',
        divisionId: 'kebersihan',
        date: '2026-10-18',
        description: 'Retribusi Pengangkutan Sampah Bulan Oktober',
        type: 'pengeluaran',
        amount: 1450000,
        recordedBy: 'Bpk. Hendra Wijaya',
        referenceCode: 'KAS-KBR-1002',
      },
      {
        id: 'trx-093',
        divisionId: 'keamanan',
        date: '2026-10-04',
        description: 'Iuran Keamanan Lingkungan Bulan Oktober',
        type: 'pemasukan',
        amount: 5120000,
        recordedBy: 'Bendahara RT',
        referenceCode: 'KAS-KMN-1001',
      },
      {
        id: 'trx-094',
        divisionId: 'keamanan',
        date: '2026-10-20',
        description: 'Honorarium Petugas Keamanan Bulan Oktober',
        type: 'pengeluaran',
        amount: 3400000,
        recordedBy: 'Bpk. Rahmat Hidayat',
        referenceCode: 'KAS-KMN-1002',
      },
      {
        id: 'trx-107',
        divisionId: 'sosial',
        date: '2026-10-05',
        description: 'Dana Sosial Warga & Subsidi Kelurahan untuk Posyandu Oktober',
        type: 'pemasukan',
        amount: 2450000,
        recordedBy: 'Ibu Ratna Sari',
        referenceCode: 'KAS-SOS-1001',
      },
      {
        id: 'trx-108',
        divisionId: 'sosial',
        date: '2026-10-19',
        description: 'Santunan Rawat Inap Warga Blok B-09 & Paket Buah',
        type: 'pengeluaran',
        amount: 600000,
        recordedBy: 'Ibu Ratna Sari',
        referenceCode: 'KAS-SOS-1002',
      },
      {
        id: 'trx-109',
        divisionId: 'pemuda',
        date: '2026-10-08',
        description: 'Donasi Turnamen Tenis Meja & Iuran Pemuda Oktober',
        type: 'pemasukan',
        amount: 1850000,
        recordedBy: 'Sdr. Dimas Pratama',
        referenceCode: 'KAS-PMD-1001',
      },
      {
        id: 'trx-110',
        divisionId: 'pemuda',
        date: '2026-10-22',
        description: 'Penggantian Net Lapangan Bulutangkis & Bola Voli',
        type: 'pengeluaran',
        amount: 425000,
        recordedBy: 'Sdr. Dimas Pratama',
        referenceCode: 'KAS-PMD-1002',
      },
      {
        id: 'trx-095',
        divisionId: 'infrastruktur',
        date: '2026-10-10',
        description: 'Perbaikan Engsel Pintu Gerbang Utama & Cat Trotoar',
        type: 'pengeluaran',
        amount: 850000,
        recordedBy: 'Bpk. Agus Santoso',
        referenceCode: 'KAS-INF-1001',
      },
    ],
    proposals: [
      {
        id: 'prop-1',
        code: 'USL-2026-014',
        title: 'Penggantian 4 Titik Lampu Penerangan Jalan Umum (PJU) di Gang Anggrek Blok C',
        divisionId: 'infrastruktur',
        residentName: 'Bpk. Kurniawan',
        houseBlock: 'Blok C-08',
        urgency: 'Mendesak',
        estimatedBudget: 1650000,
        description:
          'Empat lampu jalan di sepanjang tikungan Gang Anggrek Blok C mati sejak minggu lalu sehingga area tersebut sangat gelap saat warga pulang malam dan berpotensi rawan.',
        status: 'Dikerjakan',
        createdAt: '2026-11-10T08:30:00.000Z',
        updatedAt: '2026-11-17T11:20:00.000Z',
        supportersCount: 24,
        history: [
          {
            id: 'h-1',
            status: 'Diajukan',
            timestamp: '2026-11-10T08:30:00.000Z',
            updatedBy: 'Bpk. Kurniawan (Blok C-08)',
            note: 'Usulan dikirim beserta titik lokasi tiang PJU yang padam.',
          },
          {
            id: 'h-2',
            status: 'Ditinjau',
            timestamp: '2026-11-11T14:15:00.000Z',
            updatedBy: 'Bpk. Agus Santoso (Div. Infrastruktur)',
            note: 'Survei lokasi selesai; ditemukan modul ballast lama rusak akibat rembesan hujan.',
          },
          {
            id: 'h-3',
            status: 'Disetujui',
            timestamp: '2026-11-13T19:00:00.000Z',
            updatedBy: 'Ketua RT 04',
            note: 'Anggaran Rp 1.650.000 disetujui dari kas Divisi Infrastruktur.',
          },
          {
            id: 'h-4',
            status: 'Dikerjakan',
            timestamp: '2026-11-17T11:20:00.000Z',
            updatedBy: 'Teknisi & Div. Infrastruktur',
            note: 'Pemasangan 4 unit lampu LED waterproof sedang berlangsung hingga sore ini.',
          },
        ],
      },
      {
        id: 'prop-2',
        code: 'USL-2026-015',
        title: 'Penambahan Tempat Sampah Terpilah (Organik & Anorganik) di Taman Tengah',
        divisionId: 'kebersihan',
        residentName: 'Ibu Melati Putri',
        houseBlock: 'Blok A-14',
        urgency: 'Prioritas',
        estimatedBudget: 950000,
        description:
          'Setiap sore taman ramai anak-anak dan warga berolahraga, namun baru ada satu bak sampah kecil yang sering penuh sebelum jadwal angkut.',
        status: 'Disetujui',
        createdAt: '2026-11-12T10:05:00.000Z',
        updatedAt: '2026-11-16T16:40:00.000Z',
        supportersCount: 18,
        history: [
          {
            id: 'h-5',
            status: 'Diajukan',
            timestamp: '2026-11-12T10:05:00.000Z',
            updatedBy: 'Ibu Melati Putri (Blok A-14)',
            note: 'Mengusulkan 2 set tempat sampah terpilah di sisi utara dan selatan taman.',
          },
          {
            id: 'h-6',
            status: 'Ditinjau',
            timestamp: '2026-11-14T09:30:00.000Z',
            updatedBy: 'Bpk. Hendra Wijaya (Div. Kebersihan)',
            note: 'Cek ketersediaan vendor tempat sampah fiber 2-pilah.',
          },
          {
            id: 'h-7',
            status: 'Disetujui',
            timestamp: '2026-11-16T16:40:00.000Z',
            updatedBy: 'Ketua & Bendahara RT 04',
            note: 'Disetujui untuk dibelanjakan dan dipasang saat Kerja Bakti 22 November.',
          },
        ],
      },
      {
        id: 'prop-3',
        code: 'USL-2026-016',
        title: 'Pengadaan Cermin Cembung Lalu Lintas di Pertigaan Blok B',
        divisionId: 'keamanan',
        residentName: 'Bpk. Fajar Nugroho',
        houseBlock: 'Blok B-03',
        urgency: 'Prioritas',
        estimatedBudget: 720000,
        description:
          'Tikungan keluar Blok B terhalang pagar tinggi sehingga pengendara motor dan mobil sering kaget saat berpapasan.',
        status: 'Ditinjau',
        createdAt: '2026-11-15T15:20:00.000Z',
        updatedAt: '2026-11-17T09:10:00.000Z',
        supportersCount: 15,
        history: [
          {
            id: 'h-8',
            status: 'Diajukan',
            timestamp: '2026-11-15T15:20:00.000Z',
            updatedBy: 'Bpk. Fajar Nugroho (Blok B-03)',
            note: 'Mohon pemasangan cermin cembung 60cm pada tiang sudut Blok B.',
          },
          {
            id: 'h-9',
            status: 'Ditinjau',
            timestamp: '2026-11-17T09:10:00.000Z',
            updatedBy: 'Bpk. Rahmat Hidayat (Div. Keamanan)',
            note: 'Sedang memeriksa sudut pandang optimal bersama pengurus keamanan.',
          },
        ],
      },
      {
        id: 'prop-4',
        code: 'USL-2026-013',
        title: 'Perbaikan Papan Pengumuman & Atap Teras Balai Warga',
        divisionId: 'infrastruktur',
        residentName: 'Ibu Ningsih',
        houseBlock: 'Blok A-02',
        urgency: 'Normal',
        estimatedBudget: 1200000,
        description:
          'Talang air di teras Balai Warga bocor saat hujan deras dan papan informasi jadwal warga perlu diganti dengan kaca pelindung.',
        status: 'Selesai',
        createdAt: '2026-11-01T11:00:00.000Z',
        updatedAt: '2026-11-12T17:00:00.000Z',
        supportersCount: 29,
        history: [
          {
            id: 'h-10',
            status: 'Diajukan',
            timestamp: '2026-11-01T11:00:00.000Z',
            updatedBy: 'Ibu Ningsih (Blok A-02)',
            note: 'Usulan perbaikan talang dan papan pengumuman Balai Warga.',
          },
          {
            id: 'h-11',
            status: 'Disetujui',
            timestamp: '2026-11-04T19:30:00.000Z',
            updatedBy: 'Ketua RT 04',
            note: 'Disetujui dalam rapat koordinasi pengurus awal bulan.',
          },
          {
            id: 'h-12',
            status: 'Dikerjakan',
            timestamp: '2026-11-08T09:00:00.000Z',
            updatedBy: 'Bpk. Agus Santoso',
            note: 'Penggantian talang PVC dan pemasangan papan mading baru.',
          },
          {
            id: 'h-13',
            status: 'Selesai',
            timestamp: '2026-11-12T17:00:00.000Z',
            updatedBy: 'Bpk. Agus Santoso',
            note: 'Pekerjaan rampung dan telah dicek langsung saat hujan turun.',
          },
        ],
      },
    ],
    agenda: [
      {
        id: 'agd-1',
        title: 'Kerja Bakti Drainase & Penanaman Pohon',
        date: '2026-11-22',
        startTime: '07:00',
        endTime: '10:00',
        location: 'Jl. Anggrek & Taman Tengah',
        divisionId: 'kebersihan',
        category: 'Gotong Royong',
        description:
          'Pembersihan saluran air warga dan pemasangan 2 unit tempat sampah terpilah baru.',
        rsvpCount: 38,
        attendees: [
          { id: 'att-1', name: 'Bpk. Kurniawan', block: 'Blok C-08', timestamp: '2026-11-16T08:15:00.000Z' },
          { id: 'att-2', name: 'Ibu Melati Putri', block: 'Blok A-14', timestamp: '2026-11-16T09:40:00.000Z' },
          { id: 'att-3', name: 'Bpk. Fajar Nugroho', block: 'Blok B-03', timestamp: '2026-11-17T07:20:00.000Z' },
        ],
      },
      {
        id: 'agd-2',
        title: 'Posyandu Balita & Cek Kesehatan Lansia',
        date: '2026-11-25',
        startTime: '08:30',
        endTime: '11:30',
        location: 'Balai Warga RT 04',
        divisionId: 'sosial',
        category: 'Kesehatan',
        description:
          'Layanan rutin bulanan bersama kader PKK dan bidan Puskesmas Dinoyo.',
        rsvpCount: 27,
        attendees: [
          { id: 'att-4', name: 'Ibu Ningsih', block: 'Blok A-02', timestamp: '2026-11-16T10:10:00.000Z' },
          { id: 'att-5', name: 'Ibu Dewi Kartika', block: 'Blok B-05', timestamp: '2026-11-17T08:05:00.000Z' },
        ],
      },
      {
        id: 'agd-3',
        title: 'Senam Pagi Bersama & Sarapan Sehat Warga',
        date: '2026-11-29',
        startTime: '06:30',
        endTime: '08:30',
        location: 'Lapangan Serbaguna RT 04',
        divisionId: 'pemuda',
        category: 'Olahraga',
        description:
          'Senam jantung sehat dipandu instruktur warga dilanjutkan ramah tamah.',
        rsvpCount: 44,
        attendees: [
          { id: 'att-6', name: 'Sdr. Dimas Pratama', block: 'Blok D-04', timestamp: '2026-11-15T18:30:00.000Z' },
          { id: 'att-7', name: 'Ibu Ratna Sari', block: 'Blok B-10', timestamp: '2026-11-16T14:20:00.000Z' },
        ],
      },
      {
        id: 'agd-4',
        title: 'Musyawarah Warga & Laporan Kas Akhir Bulan',
        date: '2026-12-05',
        startTime: '19:30',
        endTime: '21:30',
        location: 'Balai Warga RT 04',
        divisionId: 'keamanan',
        category: 'Rapat Warga',
        description:
          'Pembahasan laporan kas 5 divisi, evaluasi usulan warga bulan November, dan persiapan libur akhir tahun.',
        rsvpCount: 33,
        attendees: [
          { id: 'att-8', name: 'Bpk. H. Ahmad Fauzi', block: 'Blok A-01', timestamp: '2026-11-16T19:00:00.000Z' },
          { id: 'att-9', name: 'Bpk. Bambang Sutrisno', block: 'Blok A-11', timestamp: '2026-11-16T19:15:00.000Z' },
        ],
      },
    ],
    news: [
      {
        id: 'news-1',
        title: 'Pemasangan 2 Titik CCTV Tambahan di Simpang Blok D Rampung Diuji',
        category: 'Keamanan',
        summary:
          'Dua kamera pengawas night-vision kini aktif memantau akses masuk simpang Blok D selama 24 jam penuh.',
        content:
          'Pengurus Divisi Keamanan bersama tim teknis warga telah menyelesaikan pemasangan dan kalibrasi dua unit kamera CCTV beresolusi tinggi di simpang Blok D serta area parkir tamu. Rekaman terhubung langsung ke monitor Pos Kamling Utama untuk meningkatkan keamanan lingkungan terutama pada malam hari.',
        author: 'Bpk. Rahmat Hidayat · Div. Keamanan',
        publishedAt: '2026-11-16T09:00:00.000Z',
        imageUrl: '/src/assets/images/kegiatan_ronda_malam_1794973653012.jpg',
      },
      {
        id: 'news-2',
        title: 'Jadwal Angkut Sampah Terpilah & Kerja Bakti Menjelang Musim Hujan',
        category: 'Lingkungan',
        summary:
          'Pengangkutan sampah organik dilakukan setiap Selasa dan Jumat pagi; warga diimbau memilah dari rumah.',
        content:
          'Menjelang puncak musim hujan di wilayah Kelurahan Dinoyo, warga RT 01/RW 05 diimbau memastikan saluran air depan rumah bebas dari sampah plastik serta melakukan pemilahan sampah basah dan kering. Kerja bakti bersama akan dilaksanakan pada Minggu 22 November mulai pukul 07:00 WIB.',
        author: 'Bpk. Hendra Wijaya · Div. Kebersihan',
        publishedAt: '2026-11-14T14:30:00.000Z',
        imageUrl: '/src/assets/images/kegiatan_kerja_bakti_1794973651734.jpg',
      },
      {
        id: 'news-3',
        title: 'Layanan Cek Kesehatan Lansia & Balita Gratis di Balai Warga Dinoyo',
        category: 'Kesehatan',
        summary:
          'Kader PKK bersama Puskesmas membuka pemeriksaan tekanan darah, gula darah, dan vitamin balita pada 25 November.',
        content:
          'Divisi Sosial & PKK mengundang seluruh orang tua balita dan warga lansia RT 01/RW 05 untuk hadir dalam layanan Posyandu terpadu di Balai Warga. Tersedia pemeriksaan tekanan darah, cek gula darah gratis, penimbangan balita, serta paket makanan tambahan bergizi.',
        author: 'Ibu Ratna Sari · Div. Sosial & PKK',
        publishedAt: '2026-11-12T10:15:00.000Z',
        imageUrl: '/src/assets/images/kegiatan_posyandu_1794973652119.jpg',
      },
    ],
    notifications: [
      {
        id: 'notif-1',
        type: 'proposal_status',
        title: 'Progress Usulan USL-2026-014 Diperbarui',
        message:
          'Usulan "Penggantian 4 Titik Lampu PJU Gang Anggrek Blok C" kini berstatus Dikerjakan oleh Teknisi & Div. Infrastruktur.',
        proposalId: 'prop-1',
        status: 'Dikerjakan',
        timestamp: '2026-11-17T11:20:00.000Z',
        read: false,
      },
      {
        id: 'notif-2',
        type: 'proposal_status',
        title: 'Usulan USL-2026-016 Sedang Ditinjau',
        message:
          'Bpk. Rahmat Hidayat (Div. Keamanan) sedang meninjau lokasi untuk usulan cermin cembung pertigaan Blok B.',
        proposalId: 'prop-3',
        status: 'Ditinjau',
        timestamp: '2026-11-17T09:10:00.000Z',
        read: false,
      },
      {
        id: 'notif-3',
        type: 'proposal_status',
        title: 'Usulan USL-2026-015 Disetujui Pengurus',
        message:
          'Pengadaan 2 set tempat sampah terpilah di Taman Tengah telah disetujui dan dijadwalkan untuk pemasangan.',
        proposalId: 'prop-2',
        status: 'Disetujui',
        timestamp: '2026-11-16T16:40:00.000Z',
        read: true,
      },
      {
        id: 'notif-4',
        type: 'activity_new',
        title: 'Info Kegiatan Baru: Kerja Bakti 22 November',
        message:
          'Divisi Kebersihan mengundang seluruh warga dalam kegiatan pembersihan drainase hari Minggu pukul 07:00 WIB.',
        timestamp: '2026-11-15T08:00:00.000Z',
        read: true,
      },
    ],
  };
}

function normalizeLoadedState(parsed: RtSnapshotState): {
  normalized: RtSnapshotState;
  mutated: boolean;
} {
  const seedRef = createSeedState();
  let mutated = false;
  if (!parsed.siteSettings || !parsed.siteSettings.webTitle) {
    parsed.siteSettings = seedRef.siteSettings;
    mutated = true;
  }
  if (!parsed.hero || !parsed.hero.title) {
    parsed.hero = seedRef.hero;
    mutated = true;
  }
  if (!Array.isArray(parsed.news)) {
    parsed.news = seedRef.news;
    mutated = true;
  }
  if (!Array.isArray(parsed.officials) || parsed.officials.length === 0) {
    parsed.officials = seedRef.officials;
    mutated = true;
  } else {
    parsed.officials = parsed.officials.map((off) => {
      if (off.photoUrl) return off;
      const match = seedRef.officials.find((s) => s.id === off.id);
      if (match?.photoUrl) {
        mutated = true;
        return { ...off, photoUrl: match.photoUrl };
      }
      return off;
    });
  }
  parsed.divisions = parsed.divisions.map((div) => {
    if (div.photoUrl) return div;
    const match = seedRef.divisions.find((s) => s.id === div.id);
    if (match?.photoUrl) {
      mutated = true;
      return { ...div, photoUrl: match.photoUrl };
    }
    return div;
  });
  if (Array.isArray(parsed.activities)) {
    parsed.activities = parsed.activities.map((act) => {
      const loc = act.location
        .replace(/RT 04 Harmoni/gi, 'RT 01 Dinoyo')
        .replace(/Harmoni/gi, 'Dinoyo');
      const det = act.details.replace(/Harmoni/gi, 'Dinoyo');
      if (loc !== act.location || det !== act.details) {
        mutated = true;
        return { ...act, location: loc, details: det };
      }
      return act;
    });
  }
  if (Array.isArray(parsed.agenda)) {
    parsed.agenda = parsed.agenda.map((agd) => {
      const desc = agd.description.replace(/Harmoni/gi, 'Dinoyo');
      const loc = agd.location.replace(/Harmoni/gi, 'Dinoyo');
      let next = agd;
      if (desc !== agd.description || loc !== agd.location) {
        mutated = true;
        next = { ...next, description: desc, location: loc };
      }
      if (Array.isArray(next.attendees)) return next;
      const match = seedRef.agenda.find((s) => s.id === next.id);
      mutated = true;
      return { ...next, attendees: match?.attendees || [] };
    });
  }
  return { normalized: parsed, mutated };
}

function loadState(): RtSnapshotState {
  if (USE_SUPABASE || IS_SERVERLESS) {
    return createSeedState();
  }
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw) as RtSnapshotState;
      if (parsed && Array.isArray(parsed.proposals) && Array.isArray(parsed.divisions)) {
        const { normalized, mutated } = normalizeLoadedState(parsed);
        if (mutated) {
          saveState(normalized);
        }
        return normalized;
      }
    }
  } catch (err) {
    console.error('Failed to load rt-state.json, initializing seed state:', err);
  }
  const seed = createSeedState();
  saveState(seed);
  return seed;
}

function saveState(nextState: RtSnapshotState): void {
  dirtyState = true;
  if (USE_SUPABASE || IS_SERVERLESS) {
    return;
  }
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(nextState, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to persist rt-state.json:', err);
  }
}

let state: RtSnapshotState = loadState();

// --- Auth & Session Store (Isolated from public RtSnapshotState) ---
interface StoredAuthUser extends AuthUser {
  passwordHash: string;
}

interface AuthStoreData {
  sessionSecret: string;
  users: StoredAuthUser[];
}

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split(':');
  if (parts.length !== 2) return false;
  const [salt, expectedHex] = parts;
  const actualBuf = crypto.scryptSync(password, salt, 64);
  const expectedBuf = Buffer.from(expectedHex, 'hex');
  if (actualBuf.length !== expectedBuf.length) return false;
  return crypto.timingSafeEqual(actualBuf, expectedBuf);
}

function createSeedAuthStore(): AuthStoreData {
  const now = new Date().toISOString();
  return {
    sessionSecret: crypto.randomBytes(32).toString('hex'),
    users: [
      {
        id: 'usr-superadmin',
        username: 'superadmin',
        role: 'superadmin',
        displayName: 'Superadmin Portal RT 01',
        position: 'Superadmin Sistem',
        active: true,
        createdAt: now,
        passwordHash: hashPassword('superadmin123'),
      },
      {
        id: 'usr-pengurus-1',
        username: 'pengurus1',
        role: 'pengurus',
        displayName: 'Bpk. H. Ahmad Fauzi',
        position: 'Ketua RT 01',
        active: true,
        createdAt: now,
        passwordHash: hashPassword('pengurus123'),
      },
    ],
  };
}

function saveAuthStore(store: AuthStoreData): void {
  dirtyAuth = true;
  if (USE_SUPABASE || IS_SERVERLESS) {
    return;
  }
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(AUTH_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to persist rt-auth.json:', err);
  }
}

function loadAuthStore(): AuthStoreData {
  if (USE_SUPABASE || IS_SERVERLESS) {
    return createSeedAuthStore();
  }
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(AUTH_FILE)) {
      const raw = fs.readFileSync(AUTH_FILE, 'utf-8');
      const parsed = JSON.parse(raw) as AuthStoreData;
      if (parsed && typeof parsed.sessionSecret === 'string' && Array.isArray(parsed.users)) {
        const hasSuperadmin = parsed.users.some((u) => u.role === 'superadmin');
        if (!hasSuperadmin) {
          const seed = createSeedAuthStore();
          parsed.users.unshift(seed.users[0]);
          saveAuthStore(parsed);
        }
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to load rt-auth.json, creating seed store:', err);
  }
  const seed = createSeedAuthStore();
  saveAuthStore(seed);
  return seed;
}

let authStore: AuthStoreData = loadAuthStore();

interface SupabaseAuthUserRow {
  id: string;
  username: string;
  password_hash: string;
  role: AuthRole;
  display_name: string;
  position: string;
  active: boolean;
  created_at: string;
  updated_at?: string | null;
}

async function syncFromSupabase(): Promise<void> {
  if (!supabaseAdmin) return;

  const { data: stateRow, error: stateErr } = await supabaseAdmin
    .from('rt_app_state')
    .select('data')
    .eq('id', 'main')
    .maybeSingle();

  if (stateErr) {
    throw new Error(`Supabase rt_app_state read error: ${stateErr.message}`);
  }

  if (stateRow?.data) {
    const parsed = stateRow.data as RtSnapshotState;
    const { normalized, mutated } = normalizeLoadedState(parsed);
    state = normalized;
    if (mutated) {
      await supabaseAdmin
        .from('rt_app_state')
        .upsert(
          { id: 'main', data: normalized, updated_at: new Date().toISOString() },
          { onConflict: 'id' }
        );
    }
  } else {
    const seed = createSeedState();
    state = seed;
    await supabaseAdmin
      .from('rt_app_state')
      .upsert(
        { id: 'main', data: seed, updated_at: new Date().toISOString() },
        { onConflict: 'id' }
      );
  }

  const { data: userRows, error: userErr } = await supabaseAdmin
    .from('rt_auth_users')
    .select('*')
    .order('created_at', { ascending: true });

  if (userErr) {
    throw new Error(`Supabase rt_auth_users read error: ${userErr.message}`);
  }

  if (userRows && userRows.length > 0) {
    authStore.users = (userRows as SupabaseAuthUserRow[]).map((r) => ({
      id: r.id,
      username: r.username,
      passwordHash: r.password_hash,
      role: r.role,
      displayName: r.display_name,
      position: r.position,
      active: r.active,
      createdAt: r.created_at,
      updatedAt: r.updated_at || undefined,
    }));
  } else {
    const seedAuth = createSeedAuthStore();
    authStore.users = seedAuth.users;
    await persistAuthUsersToSupabase(seedAuth.users);
  }

  dirtyState = false;
  dirtyAuth = false;
}

async function persistAuthUsersToSupabase(users: StoredAuthUser[]): Promise<void> {
  if (!supabaseAdmin) return;
  const rows: SupabaseAuthUserRow[] = users.map((u) => ({
    id: u.id,
    username: u.username,
    password_hash: u.passwordHash,
    role: u.role,
    display_name: u.displayName,
    position: u.position,
    active: u.active,
    created_at: u.createdAt,
    updated_at: u.updatedAt || null,
  }));

  if (rows.length > 0) {
    const { error: upsertErr } = await supabaseAdmin
      .from('rt_auth_users')
      .upsert(rows, { onConflict: 'id' });
    if (upsertErr) {
      throw new Error(`Supabase rt_auth_users upsert error: ${upsertErr.message}`);
    }
  }

  const { data: existingIds } = await supabaseAdmin
    .from('rt_auth_users')
    .select('id');
  const keepSet = new Set(users.map((u) => u.id));
  const idsToDelete = (existingIds || [])
    .map((r: { id: string }) => r.id)
    .filter((id: string) => !keepSet.has(id));
  if (idsToDelete.length > 0) {
    const { error: delErr } = await supabaseAdmin
      .from('rt_auth_users')
      .delete()
      .in('id', idsToDelete);
    if (delErr) {
      throw new Error(`Supabase rt_auth_users delete error: ${delErr.message}`);
    }
  }
}

async function flushSupabasePersistence(): Promise<void> {
  if (!supabaseAdmin) return;
  if (dirtyState) {
    const { error } = await supabaseAdmin
      .from('rt_app_state')
      .upsert(
        { id: 'main', data: state, updated_at: new Date().toISOString() },
        { onConflict: 'id' }
      );
    if (error) {
      throw new Error(`Supabase rt_app_state upsert error: ${error.message}`);
    }
    dirtyState = false;
  }
  if (dirtyAuth) {
    await persistAuthUsersToSupabase(authStore.users);
    dirtyAuth = false;
  }
}

function getSigningSecret(): string {
  return process.env.AUTH_SECRET || authStore.sessionSecret;
}

function sanitizeUser(u: StoredAuthUser): AuthUser {
  const { passwordHash: _ignored, ...rest } = u;
  return rest;
}

const TOKEN_COOKIE_NAME = 'portal_warga_token';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function signAuthToken(user: StoredAuthUser): string {
  const payload = {
    sub: user.id,
    role: user.role,
    exp: Date.now() + SESSION_TTL_MS,
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload), 'utf-8').toString('base64url');
  const sig = crypto
    .createHmac('sha256', getSigningSecret())
    .update(payloadB64)
    .digest('hex');
  return `${payloadB64}.${sig}`;
}

function verifyAuthToken(token: string | undefined): StoredAuthUser | null {
  if (!token) return null;
  const dotIdx = token.indexOf('.');
  if (dotIdx <= 0) return null;
  const payloadB64 = token.slice(0, dotIdx);
  const sigHex = token.slice(dotIdx + 1);
  const expectedHex = crypto
    .createHmac('sha256', getSigningSecret())
    .update(payloadB64)
    .digest('hex');
  const sigBuf = Buffer.from(sigHex, 'hex');
  const expectedBuf = Buffer.from(expectedHex, 'hex');
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }
  try {
    const decoded = JSON.parse(
      Buffer.from(payloadB64, 'base64url').toString('utf-8')
    ) as { sub?: string; exp?: number };
    if (!decoded.sub || !decoded.exp || decoded.exp < Date.now()) {
      return null;
    }
    const found = authStore.users.find((u) => u.id === decoded.sub && u.active);
    return found || null;
  } catch {
    return null;
  }
}

function extractToken(req: express.Request): string | undefined {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const bearer = authHeader.slice(7).trim();
    if (bearer) return bearer;
  }
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    const cookies = cookieHeader.split(';');
    for (const part of cookies) {
      const eqIdx = part.indexOf('=');
      if (eqIdx === -1) continue;
      const key = part.slice(0, eqIdx).trim();
      const val = part.slice(eqIdx + 1).trim();
      if (key === TOKEN_COOKIE_NAME && val) {
        return decodeURIComponent(val);
      }
    }
  }
  return undefined;
}

interface AuthedRequest extends express.Request {
  authUser?: StoredAuthUser;
}

function requirePengurusOrSuperadmin(
  req: AuthedRequest,
  res: express.Response,
  next: express.NextFunction
): void {
  const user = verifyAuthToken(extractToken(req));
  if (!user) {
    res.status(401).json({ error: 'Silakan login sebagai Pengurus RT atau Superadmin.' });
    return;
  }
  if (user.role !== 'pengurus' && user.role !== 'superadmin') {
    res.status(403).json({ error: 'Akses ditolak.' });
    return;
  }
  req.authUser = user;
  next();
}

function requireSuperadmin(
  req: AuthedRequest,
  res: express.Response,
  next: express.NextFunction
): void {
  const user = verifyAuthToken(extractToken(req));
  if (!user) {
    res.status(401).json({ error: 'Silakan login sebagai Superadmin.' });
    return;
  }
  if (user.role !== 'superadmin') {
    res.status(403).json({ error: 'Hanya Superadmin yang dapat mengakses fitur ini.' });
    return;
  }
  req.authUser = user;
  next();
}

const app = express();
app.use(express.json({ limit: '1mb' }));

// Health endpoint runs before Supabase sync so deployment checks always return diagnostics
app.get('/api/health', async (_req, res) => {
  let dbOk = !USE_SUPABASE && !IS_SERVERLESS;
  let dbError: string | null = supabaseInitError;
  if (IS_SERVERLESS && !USE_SUPABASE) {
    dbOk = false;
    dbError =
      'SUPABASE_URL atau SUPABASE_SERVICE_ROLE_KEY belum terisi di Environment Variables Vercel (Production).';
  } else if (USE_SUPABASE && supabaseAdmin) {
    try {
      await syncFromSupabase();
      dbOk = true;
    } catch (err) {
      dbOk = false;
      dbError = err instanceof Error ? err.message : 'Unknown Supabase error';
    }
  }
  res.json({
    ok: dbOk,
    storage: USE_SUPABASE ? 'supabase' : 'local-json',
    serverless: IS_SERVERLESS,
    hasSupabaseUrl: Boolean(SUPABASE_URL),
    hasServiceRoleKey: Boolean(SUPABASE_SERVICE_ROLE_KEY),
    keyFormat: SUPABASE_SERVICE_ROLE_KEY
      ? `${SUPABASE_SERVICE_ROLE_KEY.slice(0, 6)}...(${SUPABASE_SERVICE_ROLE_KEY.length} chars)`
      : null,
    dbError,
    clients: wss?.clients.size || 0,
  });
});

if (USE_SUPABASE || IS_SERVERLESS) {
  app.use('/api', async (_req, res, next) => {
    if (supabaseInitError) {
      res.status(500).json({ error: supabaseInitError });
      return;
    }
    if (!supabaseAdmin) {
      res.status(500).json({
        error:
          'Environment Variables SUPABASE_URL atau SUPABASE_SERVICE_ROLE_KEY belum terisi di Vercel (Production).',
      });
      return;
    }
    try {
      await syncFromSupabase();
      const origJson = res.json.bind(res);
      res.json = ((body: unknown) => {
        if (dirtyState || dirtyAuth) {
          Promise.resolve()
            .then(() => flushSupabasePersistence())
            .then(() => origJson(body))
            .catch((err) => {
              console.error('Supabase persist failed:', err);
              res.status(500);
              origJson({ error: 'Gagal menyimpan data ke database Supabase.' });
            });
          return res;
        }
        return origJson(body);
      }) as typeof res.json;
      next();
    } catch (err) {
      console.error('Supabase sync failed:', err);
      const rawMsg = err instanceof Error ? err.message : 'Unknown error';
      let friendly = 'Gagal terhubung ke database Supabase.';
      if (/invalid api key|jwt/i.test(rawMsg)) {
        friendly =
          'SUPABASE_SERVICE_ROLE_KEY tidak valid. Pastikan Anda mengisi nilai key asli dari Supabase (bukan nama variabelnya), lalu Redeploy di Vercel.';
      } else if (/permission denied/i.test(rawMsg)) {
        friendly =
          'Izin tabel Supabase ditolak (permission denied). Jalankan perintah GRANT terbaru di SQL Editor Supabase dan pastikan SUPABASE_SERVICE_ROLE_KEY memakai Secret/service_role key.';
      } else if (/does not exist|schema cache|Could not find the table/i.test(rawMsg)) {
        friendly =
          'Tabel Supabase (rt_app_state / rt_auth_users) belum dibuat. Jalankan isi file supabase/schema.sql di SQL Editor Supabase.';
      } else {
        friendly = `Gagal terhubung ke Supabase: ${rawMsg}`;
      }
      res.status(500).json({ error: friendly });
    }
  });
}

const server = !IS_SERVERLESS ? http.createServer(app) : null;
const wss = server ? new WebSocketServer({ server, path: '/ws' }) : null;

function broadcastEvent(event: RtRealtimeEvent): void {
  if (!wss) return;
  const payload = JSON.stringify(event);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

wss?.on('connection', (ws) => {
  const syncEvent: RtRealtimeEvent = {
    type: 'state:sync',
    payload: state,
  };
  ws.send(JSON.stringify(syncEvent));
});

app.get('/api/state', (_req, res) => {
  res.json(state);
});

// --- Auth & Superadmin Account Management Routes ---
app.post('/api/auth/login', (req, res) => {
  const body = (req.body || {}) as Partial<{ username: string; password: string }>;
  const username = (body.username || '').trim().toLowerCase();
  const password = body.password || '';

  if (!username || !password) {
    res.status(400).json({ error: 'Username dan password wajib diisi.' });
    return;
  }

  const found = authStore.users.find((u) => u.username.toLowerCase() === username);
  if (!found || !verifyPassword(password, found.passwordHash)) {
    res.status(401).json({ error: 'Username atau password tidak sesuai.' });
    return;
  }
  if (!found.active) {
    res.status(403).json({ error: 'Akun pengurus ini sedang dinonaktifkan oleh Superadmin.' });
    return;
  }

  const token = signAuthToken(found);
  res.setHeader(
    'Set-Cookie',
    `${TOKEN_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}`
  );
  res.json({ token, user: sanitizeUser(found) });
});

app.post('/api/auth/logout', (_req, res) => {
  res.setHeader(
    'Set-Cookie',
    `${TOKEN_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
  );
  res.json({ ok: true });
});

app.get('/api/auth/me', (req, res) => {
  const user = verifyAuthToken(extractToken(req));
  if (!user) {
    res.json({ authenticated: false, user: null });
    return;
  }
  res.json({ authenticated: true, user: sanitizeUser(user) });
});

app.get('/api/admin/users', requireSuperadmin, (_req, res) => {
  const users = authStore.users.map(sanitizeUser);
  res.json({ users });
});

app.post('/api/admin/users', requireSuperadmin, (req, res) => {
  const body = (req.body || {}) as Partial<{
    username: string;
    password: string;
    displayName: string;
    position: string;
    active: boolean;
    role: AuthRole;
  }>;

  const username = (body.username || '').trim().toLowerCase();
  const password = body.password || '';
  const displayName = (body.displayName || '').trim();
  const position = (body.position || '').trim();

  if (!/^[a-z0-9._-]{3,32}$/.test(username)) {
    res.status(400).json({
      error: 'Username harus 3–32 karakter (huruf kecil, angka, titik, garis bawah, atau strip).',
    });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: 'Password minimal 6 karakter.' });
    return;
  }
  if (!displayName || !position) {
    res.status(400).json({ error: 'Nama lengkap dan jabatan pengurus wajib diisi.' });
    return;
  }
  if (authStore.users.some((u) => u.username.toLowerCase() === username)) {
    res.status(409).json({ error: `Username "${username}" sudah digunakan.` });
    return;
  }

  const now = new Date().toISOString();
  const newUser: StoredAuthUser = {
    id: `usr-${Date.now()}`,
    username,
    role: 'pengurus',
    displayName: displayName.slice(0, 80),
    position: position.slice(0, 60),
    active: body.active !== false,
    createdAt: now,
    updatedAt: now,
    passwordHash: hashPassword(password),
  };

  authStore.users = [...authStore.users, newUser];
  saveAuthStore(authStore);

  res.status(201).json({ user: sanitizeUser(newUser) });
});

app.patch('/api/admin/users/:id', requireSuperadmin, (req, res) => {
  const { id } = req.params;
  const idx = authStore.users.findIndex((u) => u.id === id);
  if (idx === -1) {
    res.status(404).json({ error: 'Akun tidak ditemukan.' });
    return;
  }

  const existing = authStore.users[idx];
  const body = (req.body || {}) as Partial<{
    username: string;
    password: string;
    displayName: string;
    position: string;
    active: boolean;
  }>;

  const nextUsername =
    body.username !== undefined ? body.username.trim().toLowerCase() : existing.username;
  if (!/^[a-z0-9._-]{3,32}$/.test(nextUsername)) {
    res.status(400).json({
      error: 'Username harus 3–32 karakter (huruf kecil, angka, titik, garis bawah, atau strip).',
    });
    return;
  }
  if (
    nextUsername !== existing.username.toLowerCase() &&
    authStore.users.some((u) => u.id !== id && u.username.toLowerCase() === nextUsername)
  ) {
    res.status(409).json({ error: `Username "${nextUsername}" sudah digunakan.` });
    return;
  }

  const nextDisplayName =
    body.displayName !== undefined ? body.displayName.trim() : existing.displayName;
  const nextPosition =
    body.position !== undefined ? body.position.trim() : existing.position;
  if (!nextDisplayName || !nextPosition) {
    res.status(400).json({ error: 'Nama lengkap dan jabatan wajib diisi.' });
    return;
  }

  let nextPasswordHash = existing.passwordHash;
  if (typeof body.password === 'string' && body.password.length > 0) {
    if (body.password.length < 6) {
      res.status(400).json({ error: 'Password baru minimal 6 karakter.' });
      return;
    }
    nextPasswordHash = hashPassword(body.password);
  }

  const nextActive =
    existing.role === 'superadmin'
      ? true
      : body.active !== undefined
        ? Boolean(body.active)
        : existing.active;

  const updated: StoredAuthUser = {
    ...existing,
    username: nextUsername,
    displayName: nextDisplayName.slice(0, 80),
    position: nextPosition.slice(0, 60),
    active: nextActive,
    updatedAt: new Date().toISOString(),
    passwordHash: nextPasswordHash,
  };

  authStore.users[idx] = updated;
  saveAuthStore(authStore);

  res.json({ user: sanitizeUser(updated) });
});

app.delete('/api/admin/users/:id', requireSuperadmin, (req, res) => {
  const { id } = req.params;
  const target = authStore.users.find((u) => u.id === id);
  if (!target) {
    res.status(404).json({ error: 'Akun tidak ditemukan.' });
    return;
  }
  if (target.role === 'superadmin') {
    res.status(400).json({ error: 'Akun Superadmin utama tidak dapat dihapus.' });
    return;
  }

  authStore.users = authStore.users.filter((u) => u.id !== id);
  saveAuthStore(authStore);
  res.json({ ok: true, userId: id });
});

const handleUpdateSiteSettings: express.RequestHandler = (req, res) => {
  const body = (req.body || {}) as Partial<SiteSettings> & { syncHeroEyebrow?: boolean };
  const webTitle = (body.webTitle ?? state.siteSettings.webTitle).trim();
  const regionIdentity = (body.regionIdentity ?? state.siteSettings.regionIdentity).trim();
  const regionCode = (body.regionCode ?? state.siteSettings.regionCode).trim();
  const locationName = (body.locationName ?? state.siteSettings.locationName).trim();

  if (!webTitle || !regionIdentity) {
    res.status(400).json({ error: 'Judul web dan tulisan identitas wilayah wajib diisi.' });
    return;
  }

  const nextSettings: SiteSettings = {
    webTitle: webTitle.slice(0, 60),
    regionIdentity: regionIdentity.slice(0, 100),
    regionCode: (regionCode || 'RT 01 / RW 05').slice(0, 40),
    locationName: (locationName || 'Balai Warga Kelurahan Dinoyo').slice(0, 90),
  };

  state.siteSettings = nextSettings;

  let updatedHero: HeroConfig | undefined;
  if (body.syncHeroEyebrow !== false) {
    state.hero = {
      ...state.hero,
      eyebrow: nextSettings.regionIdentity.slice(0, 80),
    };
    updatedHero = state.hero;
  }

  saveState(state);

  broadcastEvent({
    type: 'site:updated',
    payload: {
      siteSettings: nextSettings,
      hero: updatedHero,
    },
  });

  res.json({ siteSettings: nextSettings, hero: state.hero });
};

app.patch('/api/site-settings', requireSuperadmin, handleUpdateSiteSettings);
app.put('/api/site-settings', requireSuperadmin, handleUpdateSiteSettings);

app.patch('/api/hero', requirePengurusOrSuperadmin, (req, res) => {
  const body = req.body as Partial<HeroConfig>;
  const title = (body.title ?? state.hero.title).trim();
  const eyebrow = (body.eyebrow ?? state.hero.eyebrow).trim();
  const subtitle = (body.subtitle ?? state.hero.subtitle).trim();
  const imageUrl = (body.imageUrl ?? state.hero.imageUrl).trim();
  const primaryCtaLabel = (body.primaryCtaLabel ?? state.hero.primaryCtaLabel).trim();
  const secondaryCtaLabel = (body.secondaryCtaLabel ?? state.hero.secondaryCtaLabel).trim();

  if (!title || !subtitle) {
    res.status(400).json({ error: 'Judul dan deskripsi singkat hero wajib diisi.' });
    return;
  }

  const hero: HeroConfig = {
    eyebrow: (eyebrow || 'RT 01 / RW 05 · Kelurahan Dinoyo').slice(0, 80),
    title: title.slice(0, 90),
    subtitle: subtitle.slice(0, 200),
    imageUrl: (imageUrl || '/src/assets/images/hero_dinoyo_rt01_1794982207800.jpg').slice(0, 300),
    primaryCtaLabel: (primaryCtaLabel || 'Ajukan Usulan').slice(0, 32),
    secondaryCtaLabel: (secondaryCtaLabel || 'Kas Divisi').slice(0, 32),
  };

  state.hero = hero;
  saveState(state);

  broadcastEvent({
    type: 'hero:updated',
    payload: { hero },
  });

  res.json({ hero });
});

app.post('/api/officials', requirePengurusOrSuperadmin, (req, res) => {
  const body = req.body as Partial<RtOfficial>;
  const name = (body.name || '').trim();
  const position = (body.position || '').trim();
  const block = (body.block || '').trim();
  const schedule = (body.schedule || '').trim();
  const photoUrl = (body.photoUrl || '').trim();

  if (!name || !position) {
    res.status(400).json({ error: 'Nama pengurus dan jabatan wajib diisi.' });
    return;
  }

  const official: RtOfficial = {
    id: `off-${Date.now()}`,
    name: name.slice(0, 80),
    position: position.slice(0, 60),
    roleGroup: body.roleGroup === 'koordinator' ? 'koordinator' : 'inti',
    block: (block || 'RT 01 / RW 05 · Dinoyo').slice(0, 60),
    schedule: (schedule || 'Layanan Warga').slice(0, 90),
    photoUrl: photoUrl ? photoUrl.slice(0, 300) : undefined,
  };

  state.officials = [...state.officials, official];
  saveState(state);

  broadcastEvent({
    type: 'official:created',
    payload: { official },
  });

  res.status(201).json({ official });
});

app.patch('/api/officials/:id', requirePengurusOrSuperadmin, (req, res) => {
  const { id } = req.params;
  const idx = state.officials.findIndex((o) => o.id === id);
  if (idx === -1) {
    res.status(404).json({ error: 'Data pengurus tidak ditemukan.' });
    return;
  }

  const existing = state.officials[idx];
  const body = req.body as Partial<RtOfficial>;
  const name = (body.name ?? existing.name).trim();
  const position = (body.position ?? existing.position).trim();

  if (!name || !position) {
    res.status(400).json({ error: 'Nama pengurus dan jabatan wajib diisi.' });
    return;
  }

  const updated: RtOfficial = {
    ...existing,
    name: name.slice(0, 80),
    position: position.slice(0, 60),
    roleGroup: body.roleGroup === 'koordinator' ? 'koordinator' : existing.roleGroup,
    block: ((body.block ?? existing.block) || 'RT 01 / RW 05 · Dinoyo').trim().slice(0, 60),
    schedule: ((body.schedule ?? existing.schedule) || 'Layanan Warga').trim().slice(0, 90),
    photoUrl:
      body.photoUrl !== undefined
        ? body.photoUrl.trim().slice(0, 300) || undefined
        : existing.photoUrl,
  };

  state.officials = state.officials.map((o) => (o.id === id ? updated : o));
  saveState(state);

  broadcastEvent({
    type: 'official:updated',
    payload: { official: updated },
  });

  res.json({ official: updated });
});

app.delete('/api/officials/:id', requirePengurusOrSuperadmin, (req, res) => {
  const { id } = req.params;
  const exists = state.officials.some((o) => o.id === id);
  if (!exists) {
    res.status(404).json({ error: 'Data pengurus tidak ditemukan.' });
    return;
  }
  if (state.officials.length <= 1) {
    res.status(400).json({ error: 'Minimal harus ada 1 pengurus aktif.' });
    return;
  }

  state.officials = state.officials.filter((o) => o.id !== id);
  saveState(state);

  broadcastEvent({
    type: 'official:deleted',
    payload: { officialId: id },
  });

  res.json({ ok: true, officialId: id });
});

app.post('/api/proposals', (req, res) => {
  const body = req.body as Partial<{
    title: string;
    divisionId: DivisionId;
    residentName: string;
    houseBlock: string;
    urgency: ProposalUrgency;
    estimatedBudget: number;
    description: string;
  }>;

  const title = (body.title || '').trim();
  const residentName = (body.residentName || '').trim();
  const houseBlock = (body.houseBlock || '').trim();
  const description = (body.description || '').trim();
  const divisionId = body.divisionId;
  const urgency: ProposalUrgency =
    body.urgency === 'Mendesak' || body.urgency === 'Prioritas'
      ? body.urgency
      : 'Normal';
  const estimatedBudget =
    typeof body.estimatedBudget === 'number' && Number.isFinite(body.estimatedBudget)
      ? Math.max(0, Math.round(body.estimatedBudget))
      : 0;

  if (!title || !residentName || !houseBlock || !description || !isValidDivision(divisionId)) {
    res.status(400).json({ error: 'Mohon lengkapi judul, nama warga, blok rumah, divisi, dan deskripsi usulan.' });
    return;
  }

  const now = new Date().toISOString();
  const nextNumber = state.proposals.length + 13;
  const code = `USL-2026-${String(nextNumber).padStart(3, '0')}`;
  const proposalId = `prop-${Date.now()}`;

  const proposal: ProposalItem = {
    id: proposalId,
    code,
    title: title.slice(0, 140),
    divisionId,
    residentName: residentName.slice(0, 80),
    houseBlock: houseBlock.slice(0, 30),
    urgency,
    estimatedBudget,
    description: description.slice(0, 1000),
    status: 'Diajukan',
    createdAt: now,
    updatedAt: now,
    supportersCount: 1,
    history: [
      {
        id: `hist-${Date.now()}`,
        status: 'Diajukan',
        timestamp: now,
        updatedBy: `${residentName} (${houseBlock})`,
        note: 'Usulan baru diajukan oleh warga melalui Portal RT.',
      },
    ],
  };

  const notification: NotificationItem = {
    id: `notif-${Date.now()}`,
    type: 'proposal_new',
    title: `Usulan Baru ${code} Diajukan`,
    message: `${residentName} (${houseBlock}) mengajukan "${proposal.title}".`,
    proposalId: proposal.id,
    status: 'Diajukan',
    timestamp: now,
    read: false,
  };

  state.proposals = [proposal, ...state.proposals];
  state.notifications = [notification, ...state.notifications].slice(0, 60);
  saveState(state);

  broadcastEvent({
    type: 'proposal:created',
    payload: { proposal, notification },
  });

  res.status(201).json({ proposal, notification });
});

app.patch('/api/proposals/:id/status', requirePengurusOrSuperadmin, (req, res) => {
  const { id } = req.params;
  const body = req.body as Partial<{
    status: ProposalStatus;
    note: string;
    updatedBy: string;
  }>;

  if (!body.status || !VALID_STATUSES.includes(body.status)) {
    res.status(400).json({ error: 'Status usulan tidak valid.' });
    return;
  }

  const idx = state.proposals.findIndex((p) => p.id === id);
  if (idx === -1) {
    res.status(404).json({ error: 'Usulan tidak ditemukan.' });
    return;
  }

  const existing = state.proposals[idx];
  const now = new Date().toISOString();
  const updatedBy = (body.updatedBy || 'Pengurus RT 04').trim().slice(0, 80);
  const note =
    (body.note || '').trim().slice(0, 400) ||
    `Status diperbarui menjadi ${body.status}.`;

  const updated: ProposalItem = {
    ...existing,
    status: body.status,
    updatedAt: now,
    history: [
      ...existing.history,
      {
        id: `hist-${Date.now()}`,
        status: body.status,
        timestamp: now,
        updatedBy,
        note,
      },
    ],
  };

  state.proposals[idx] = updated;

  const notification: NotificationItem = {
    id: `notif-${Date.now()}`,
    type: 'proposal_status',
    title: `Status ${updated.code}: ${body.status}`,
    message: `"${updated.title}" diperbarui menjadi ${body.status} — ${note}`,
    proposalId: updated.id,
    status: body.status,
    timestamp: now,
    read: false,
  };

  state.notifications = [notification, ...state.notifications].slice(0, 60);
  saveState(state);

  broadcastEvent({
    type: 'proposal:updated',
    payload: { proposal: updated, notification },
  });

  res.json({ proposal: updated, notification });
});

app.patch('/api/proposals/:id', requirePengurusOrSuperadmin, (req, res) => {
  const { id } = req.params;
  const idx = state.proposals.findIndex((p) => p.id === id);
  if (idx === -1) {
    res.status(404).json({ error: 'Usulan tidak ditemukan.' });
    return;
  }

  const existing = state.proposals[idx];
  const body = (req.body || {}) as Partial<{
    title: string;
    divisionId: DivisionId;
    residentName: string;
    houseBlock: string;
    urgency: ProposalUrgency;
    estimatedBudget: number;
    description: string;
  }>;

  const title = (body.title ?? existing.title).trim();
  const residentName = (body.residentName ?? existing.residentName).trim();
  const houseBlock = (body.houseBlock ?? existing.houseBlock).trim();
  const description = (body.description ?? existing.description).trim();
  const divisionId = body.divisionId ?? existing.divisionId;

  if (!title || !residentName || !houseBlock || !description || !isValidDivision(divisionId)) {
    res.status(400).json({ error: 'Data usulan tidak lengkap atau divisi tidak valid.' });
    return;
  }

  const urgency: ProposalUrgency =
    body.urgency === 'Mendesak' || body.urgency === 'Prioritas' || body.urgency === 'Normal'
      ? body.urgency
      : existing.urgency;
  const estimatedBudget =
    typeof body.estimatedBudget === 'number' && Number.isFinite(body.estimatedBudget)
      ? Math.max(0, Math.round(body.estimatedBudget))
      : existing.estimatedBudget;

  const updated: ProposalItem = {
    ...existing,
    title: title.slice(0, 140),
    divisionId,
    residentName: residentName.slice(0, 80),
    houseBlock: houseBlock.slice(0, 30),
    urgency,
    estimatedBudget,
    description: description.slice(0, 1000),
    updatedAt: new Date().toISOString(),
  };

  state.proposals[idx] = updated;
  saveState(state);

  broadcastEvent({
    type: 'proposal:updated',
    payload: { proposal: updated },
  });

  res.json({ proposal: updated });
});

app.delete('/api/proposals/:id', requirePengurusOrSuperadmin, (req, res) => {
  const { id } = req.params;
  const exists = state.proposals.some((p) => p.id === id);
  if (!exists) {
    res.status(404).json({ error: 'Usulan tidak ditemukan.' });
    return;
  }

  state.proposals = state.proposals.filter((p) => p.id !== id);
  saveState(state);

  broadcastEvent({
    type: 'proposal:deleted',
    payload: { proposalId: id },
  });

  res.json({ ok: true, proposalId: id });
});

app.post('/api/proposals/:id/support', (req, res) => {
  const { id } = req.params;
  const idx = state.proposals.findIndex((p) => p.id === id);
  if (idx === -1) {
    res.status(404).json({ error: 'Usulan tidak ditemukan.' });
    return;
  }

  const updated: ProposalItem = {
    ...state.proposals[idx],
    supportersCount: state.proposals[idx].supportersCount + 1,
  };
  state.proposals[idx] = updated;
  saveState(state);

  broadcastEvent({
    type: 'proposal:updated',
    payload: { proposal: updated },
  });

  res.json({ proposal: updated });
});

app.post('/api/treasury', requirePengurusOrSuperadmin, (req, res) => {
  const body = req.body as Partial<{
    divisionId: DivisionId;
    date: string;
    description: string;
    type: 'pemasukan' | 'pengeluaran';
    amount: number;
    recordedBy: string;
  }>;

  const divisionId = body.divisionId;
  const description = (body.description || '').trim();
  const type = body.type === 'pemasukan' || body.type === 'pengeluaran' ? body.type : null;
  const amount = typeof body.amount === 'number' && Number.isFinite(body.amount) ? Math.round(body.amount) : 0;

  if (!isValidDivision(divisionId) || !description || !type || amount <= 0) {
    res.status(400).json({ error: 'Data transaksi kas tidak lengkap atau nominal harus lebih dari 0.' });
    return;
  }

  const now = new Date().toISOString();
  const division = state.divisions.find((d) => d.id === divisionId);
  const prefix = (division?.shortName || divisionId)
    .replace(/[^a-zA-Z]/g, '')
    .slice(0, 3)
    .toUpperCase() || 'KAS';

  const transaction: TreasuryTransaction = {
    id: `trx-${Date.now()}`,
    divisionId,
    date: body.date || now.slice(0, 10),
    description: description.slice(0, 160),
    type,
    amount,
    recordedBy: (body.recordedBy || 'Bendahara RT').trim().slice(0, 60),
    referenceCode: `KAS-${prefix}-${String(state.treasury.length + 1101)}`,
  };

  const formattedAmt = new Intl.NumberFormat('id-ID').format(amount);

  const notification: NotificationItem = {
    id: `notif-${Date.now()}`,
    type: 'treasury_new',
    title: `Catatan Kas ${division?.shortName || divisionId}`,
    message: `${type === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran'} Rp ${formattedAmt}: ${transaction.description}`,
    timestamp: now,
    read: false,
  };

  state.treasury = [transaction, ...state.treasury];
  state.notifications = [notification, ...state.notifications].slice(0, 60);
  saveState(state);

  broadcastEvent({
    type: 'treasury:created',
    payload: { transaction, notification },
  });

  res.status(201).json({ transaction, notification });
});

app.patch('/api/treasury/:id', requirePengurusOrSuperadmin, (req, res) => {
  const { id } = req.params;
  const idx = state.treasury.findIndex((t) => t.id === id);
  if (idx === -1) {
    res.status(404).json({ error: 'Transaksi kas tidak ditemukan.' });
    return;
  }

  const existing = state.treasury[idx];
  const body = (req.body || {}) as Partial<{
    divisionId: DivisionId;
    date: string;
    description: string;
    type: 'pemasukan' | 'pengeluaran';
    amount: number;
    recordedBy: string;
  }>;

  const divisionId = body.divisionId ?? existing.divisionId;
  const description = (body.description ?? existing.description).trim();
  const type =
    body.type === 'pemasukan' || body.type === 'pengeluaran' ? body.type : existing.type;
  const amount =
    typeof body.amount === 'number' && Number.isFinite(body.amount)
      ? Math.round(body.amount)
      : existing.amount;

  if (!isValidDivision(divisionId) || !description || amount <= 0) {
    res.status(400).json({ error: 'Data transaksi kas tidak valid atau nominal harus lebih dari 0.' });
    return;
  }

  const updated: TreasuryTransaction = {
    ...existing,
    divisionId,
    date: (body.date ?? existing.date).trim() || existing.date,
    description: description.slice(0, 160),
    type,
    amount,
    recordedBy: ((body.recordedBy ?? existing.recordedBy) || 'Bendahara RT').trim().slice(0, 60),
  };

  state.treasury[idx] = updated;
  saveState(state);

  broadcastEvent({
    type: 'treasury:updated',
    payload: { transaction: updated },
  });

  res.json({ transaction: updated });
});

app.delete('/api/treasury/:id', requirePengurusOrSuperadmin, (req, res) => {
  const { id } = req.params;
  const exists = state.treasury.some((t) => t.id === id);
  if (!exists) {
    res.status(404).json({ error: 'Transaksi kas tidak ditemukan.' });
    return;
  }

  state.treasury = state.treasury.filter((t) => t.id !== id);
  saveState(state);

  broadcastEvent({
    type: 'treasury:deleted',
    payload: { transactionId: id },
  });

  res.json({ ok: true, transactionId: id });
});

app.post('/api/divisions', requirePengurusOrSuperadmin, (req, res) => {
  const body = req.body as Partial<{
    name: string;
    shortName: string;
    coordinator: string;
    description: string;
    annualBudget: number;
  }>;

  const name = (body.name || '').trim();
  const shortName = (body.shortName || '').trim();
  const coordinator = (body.coordinator || '').trim();
  const description = (body.description || '').trim();
  const annualBudget =
    typeof body.annualBudget === 'number' && Number.isFinite(body.annualBudget)
      ? Math.max(0, Math.round(body.annualBudget))
      : 10000000;

  if (!name || !shortName || !coordinator) {
    res.status(400).json({ error: 'Mohon lengkapi nama divisi, nama singkat, dan koordinator.' });
    return;
  }

  const baseSlug = shortName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'divisi';
  let id = baseSlug;
  if (state.divisions.some((d) => d.id === id)) {
    id = `${baseSlug}-${Date.now().toString().slice(-4)}`;
  }

  const division: DivisionInfo = {
    id,
    name: name.slice(0, 90),
    shortName: shortName.slice(0, 32),
    coordinator: coordinator.slice(0, 70),
    description: (description || `Pengelolaan program dan kas ${name}.`).slice(0, 260),
    annualBudget,
  };

  const now = new Date().toISOString();
  const notification: NotificationItem = {
    id: `notif-${Date.now()}`,
    type: 'division_new',
    title: `Divisi Kas Baru: ${division.shortName}`,
    message: `${division.name} (Koordinator: ${division.coordinator}) ditambahkan ke daftar kas divisi.`,
    timestamp: now,
    read: false,
  };

  state.divisions = [...state.divisions, division];
  state.notifications = [notification, ...state.notifications].slice(0, 60);
  saveState(state);

  broadcastEvent({
    type: 'division:created',
    payload: { division, notification },
  });

  res.status(201).json({ division, notification });
});

app.patch('/api/divisions/:id', requirePengurusOrSuperadmin, (req, res) => {
  const { id } = req.params;
  const idx = state.divisions.findIndex((d) => d.id === id);
  if (idx === -1) {
    res.status(404).json({ error: 'Divisi kas tidak ditemukan.' });
    return;
  }

  const existing = state.divisions[idx];
  const body = req.body as Partial<DivisionInfo>;
  const name = (body.name ?? existing.name).trim();
  const shortName = (body.shortName ?? existing.shortName).trim();
  const coordinator = (body.coordinator ?? existing.coordinator).trim();

  if (!name || !shortName || !coordinator) {
    res.status(400).json({ error: 'Nama divisi, nama singkat, dan koordinator wajib diisi.' });
    return;
  }

  const annualBudget =
    typeof body.annualBudget === 'number' && Number.isFinite(body.annualBudget)
      ? Math.max(0, Math.round(body.annualBudget))
      : existing.annualBudget;

  const updated: DivisionInfo = {
    ...existing,
    name: name.slice(0, 90),
    shortName: shortName.slice(0, 32),
    coordinator: coordinator.slice(0, 70),
    description: ((body.description ?? existing.description) || '').trim().slice(0, 260),
    annualBudget,
    photoUrl:
      body.photoUrl !== undefined
        ? body.photoUrl.trim().slice(0, 300) || undefined
        : existing.photoUrl,
  };

  state.divisions = state.divisions.map((d) => (d.id === id ? updated : d));
  saveState(state);

  broadcastEvent({
    type: 'division:updated',
    payload: { division: updated },
  });

  res.json({ division: updated });
});

app.delete('/api/divisions/:id', requirePengurusOrSuperadmin, (req, res) => {
  const { id } = req.params;
  const target = state.divisions.find((d) => d.id === id);
  if (!target) {
    res.status(404).json({ error: 'Divisi kas tidak ditemukan.' });
    return;
  }

  if (state.divisions.length <= 1) {
    res.status(400).json({ error: 'Minimal harus tersedia 1 divisi kas aktif.' });
    return;
  }

  state.divisions = state.divisions.filter((d) => d.id !== id);
  state.treasury = state.treasury.filter((t) => t.divisionId !== id);

  const now = new Date().toISOString();
  const notification: NotificationItem = {
    id: `notif-${Date.now()}`,
    type: 'division_deleted',
    title: `Kas Divisi Dihapus: ${target.shortName}`,
    message: `${target.name} beserta catatan kas divisinya telah dihapus oleh Pengurus RT.`,
    timestamp: now,
    read: false,
  };

  state.notifications = [notification, ...state.notifications].slice(0, 60);
  saveState(state);

  broadcastEvent({
    type: 'division:deleted',
    payload: { divisionId: id, notification },
  });

  res.json({ ok: true, divisionId: id });
});

app.post('/api/activities', requirePengurusOrSuperadmin, (req, res) => {
  const body = req.body as Partial<{
    title: string;
    category: string;
    divisionId: DivisionId;
    date: string;
    time: string;
    location: string;
    summary: string;
    details: string;
    coordinator: string;
  }>;

  const title = (body.title || '').trim();
  const divisionId = body.divisionId;
  const date = (body.date || '').trim();
  const time = (body.time || '').trim();
  const location = (body.location || '').trim();
  const summary = (body.summary || '').trim();

  if (!title || !isValidDivision(divisionId) || !date || !location || !summary) {
    res.status(400).json({ error: 'Mohon lengkapi judul, divisi, tanggal, lokasi, dan ringkasan kegiatan.' });
    return;
  }

  const now = new Date().toISOString();
  const activity: ActivityItem = {
    id: `act-${Date.now()}`,
    title: title.slice(0, 140),
    category: (body.category || 'Warga').trim().slice(0, 40),
    divisionId,
    date,
    time: time || '08:00 – selesai WIB',
    location: location.slice(0, 120),
    summary: summary.slice(0, 260),
    details: (body.details || summary).trim().slice(0, 800),
    coordinator: (body.coordinator || 'Pengurus RT 04').trim().slice(0, 80),
    attendeesCount: 1,
    status: 'Terjadwal',
  };

  const notification: NotificationItem = {
    id: `notif-${Date.now()}`,
    type: 'activity_new',
    title: `Info Kegiatan Baru: ${activity.title}`,
    message: `Dijadwalkan pada ${activity.date} di ${activity.location}.`,
    timestamp: now,
    read: false,
  };

  state.activities = [activity, ...state.activities];
  state.notifications = [notification, ...state.notifications].slice(0, 60);
  saveState(state);

  broadcastEvent({
    type: 'activity:created',
    payload: { activity, notification },
  });

  res.status(201).json({ activity, notification });
});

app.post('/api/agenda', requirePengurusOrSuperadmin, (req, res) => {
  const body = req.body as Partial<{
    title: string;
    date: string;
    startTime: string;
    endTime: string;
    location: string;
    divisionId: DivisionId;
    category: string;
    description: string;
  }>;

  const title = (body.title || '').trim();
  const date = (body.date || '').trim();
  const divisionId = body.divisionId;
  const location = (body.location || '').trim();

  if (!title || !date || !isValidDivision(divisionId) || !location) {
    res.status(400).json({ error: 'Mohon lengkapi judul, tanggal, divisi, dan lokasi agenda.' });
    return;
  }

  const now = new Date().toISOString();
  const agendaItem: AgendaItem = {
    id: `agd-${Date.now()}`,
    title: title.slice(0, 120),
    date,
    startTime: (body.startTime || '08:00').slice(0, 10),
    endTime: (body.endTime || '10:00').slice(0, 10),
    location: location.slice(0, 100),
    divisionId,
    category: (body.category || 'Kegiatan RT').trim().slice(0, 40),
    description: (body.description || 'Agenda resmi warga RT 04/RW 07.').trim().slice(0, 300),
    rsvpCount: 1,
  };

  const notification: NotificationItem = {
    id: `notif-${Date.now()}`,
    type: 'agenda_new',
    title: `Agenda Baru: ${agendaItem.title}`,
    message: `${agendaItem.date} (${agendaItem.startTime}–${agendaItem.endTime} WIB) di ${agendaItem.location}.`,
    timestamp: now,
    read: false,
  };

  state.agenda = [...state.agenda, agendaItem].sort((a, b) => a.date.localeCompare(b.date));
  state.notifications = [notification, ...state.notifications].slice(0, 60);
  saveState(state);

  broadcastEvent({
    type: 'agenda:created',
    payload: { agenda: agendaItem, notification },
  });

  res.status(201).json({ agenda: agendaItem, notification });
});

app.post('/api/agenda/:id/rsvp', (req, res) => {
  const { id } = req.params;
  const idx = state.agenda.findIndex((a) => a.id === id);
  if (idx === -1) {
    res.status(404).json({ error: 'Agenda tidak ditemukan.' });
    return;
  }

  const body = (req.body || {}) as Partial<{
    attending: boolean;
    attendeeId: string;
    name: string;
    block: string;
  }>;

  const existing = state.agenda[idx];
  const currentAttendees = Array.isArray(existing.attendees) ? existing.attendees : [];

  if (body.attending === false) {
    const nextAttendees = body.attendeeId
      ? currentAttendees.filter((att) => att.id !== body.attendeeId)
      : currentAttendees;
    const updated: AgendaItem = {
      ...existing,
      rsvpCount: Math.max(0, existing.rsvpCount - 1),
      attendees: nextAttendees,
    };
    state.agenda[idx] = updated;
    saveState(state);

    broadcastEvent({
      type: 'agenda:updated',
      payload: { agenda: updated },
    });

    res.json({ agenda: updated });
    return;
  }

  const name = (body.name || 'Warga RT 01').trim().slice(0, 80);
  const block = (body.block || 'RT 01 / RW 05').trim().slice(0, 40);
  const attendee: AgendaAttendee = {
    id: `att-${Date.now()}`,
    name,
    block,
    timestamp: new Date().toISOString(),
  };

  const updated: AgendaItem = {
    ...existing,
    rsvpCount: existing.rsvpCount + 1,
    attendees: [attendee, ...currentAttendees],
  };
  state.agenda[idx] = updated;
  saveState(state);

  broadcastEvent({
    type: 'agenda:updated',
    payload: { agenda: updated },
  });

  res.json({ agenda: updated, attendee });
});

app.patch('/api/agenda/:id', requirePengurusOrSuperadmin, (req, res) => {
  const { id } = req.params;
  const idx = state.agenda.findIndex((a) => a.id === id);
  if (idx === -1) {
    res.status(404).json({ error: 'Agenda tidak ditemukan.' });
    return;
  }

  const existing = state.agenda[idx];
  const body = (req.body || {}) as Partial<{
    title: string;
    date: string;
    startTime: string;
    endTime: string;
    location: string;
    divisionId: DivisionId;
    category: string;
    description: string;
  }>;

  const title = (body.title ?? existing.title).trim();
  const date = (body.date ?? existing.date).trim();
  const divisionId = body.divisionId ?? existing.divisionId;
  const location = (body.location ?? existing.location).trim();

  if (!title || !date || !isValidDivision(divisionId) || !location) {
    res.status(400).json({ error: 'Mohon lengkapi judul, tanggal, divisi, dan lokasi agenda.' });
    return;
  }

  const updated: AgendaItem = {
    ...existing,
    title: title.slice(0, 120),
    date,
    startTime: ((body.startTime ?? existing.startTime) || '08:00').slice(0, 10),
    endTime: ((body.endTime ?? existing.endTime) || '10:00').slice(0, 10),
    location: location.slice(0, 100),
    divisionId,
    category: ((body.category ?? existing.category) || 'Kegiatan RT').trim().slice(0, 40),
    description: ((body.description ?? existing.description) || '').trim().slice(0, 300),
  };

  state.agenda = state.agenda
    .map((a) => (a.id === id ? updated : a))
    .sort((a, b) => a.date.localeCompare(b.date));
  saveState(state);

  broadcastEvent({
    type: 'agenda:updated',
    payload: { agenda: updated },
  });

  res.json({ agenda: updated });
});

app.delete('/api/agenda/:id', requirePengurusOrSuperadmin, (req, res) => {
  const { id } = req.params;
  const exists = state.agenda.some((a) => a.id === id);
  if (!exists) {
    res.status(404).json({ error: 'Agenda tidak ditemukan.' });
    return;
  }

  state.agenda = state.agenda.filter((a) => a.id !== id);
  saveState(state);

  broadcastEvent({
    type: 'agenda:deleted',
    payload: { agendaId: id },
  });

  res.json({ ok: true, agendaId: id });
});

app.post('/api/news', requirePengurusOrSuperadmin, (req, res) => {
  const body = req.body as Partial<{
    title: string;
    category: string;
    summary: string;
    content: string;
    author: string;
    imageUrl: string;
  }>;

  const title = (body.title || '').trim();
  const content = (body.content || '').trim();
  const summary = (body.summary || '').trim();

  if (!title || !content) {
    res.status(400).json({ error: 'Judul berita dan isi berita wajib diisi.' });
    return;
  }

  const now = new Date().toISOString();
  const newsItem: NewsItem = {
    id: `news-${Date.now()}`,
    title: title.slice(0, 140),
    category: (body.category || 'Pengumuman').trim().slice(0, 40),
    summary: (summary || content.slice(0, 160)).slice(0, 220),
    content: content.slice(0, 2000),
    author: (body.author || 'Pengurus RT 01 / RW 05').trim().slice(0, 80),
    publishedAt: now,
    imageUrl: body.imageUrl ? body.imageUrl.trim().slice(0, 300) || undefined : undefined,
  };

  const notification: NotificationItem = {
    id: `notif-${Date.now()}`,
    type: 'news_new',
    title: `Berita Baru: ${newsItem.title}`,
    message: newsItem.summary,
    timestamp: now,
    read: false,
  };

  state.news = [newsItem, ...state.news];
  state.notifications = [notification, ...state.notifications].slice(0, 60);
  saveState(state);

  broadcastEvent({
    type: 'news:created',
    payload: { news: newsItem, notification },
  });

  res.status(201).json({ news: newsItem, notification });
});

app.patch('/api/news/:id', requirePengurusOrSuperadmin, (req, res) => {
  const { id } = req.params;
  const idx = state.news.findIndex((n) => n.id === id);
  if (idx === -1) {
    res.status(404).json({ error: 'Berita tidak ditemukan.' });
    return;
  }

  const existing = state.news[idx];
  const body = (req.body || {}) as Partial<{
    title: string;
    category: string;
    summary: string;
    content: string;
    author: string;
    imageUrl: string;
  }>;

  const title = (body.title ?? existing.title).trim();
  const content = (body.content ?? existing.content).trim();
  if (!title || !content) {
    res.status(400).json({ error: 'Judul berita dan isi berita wajib diisi.' });
    return;
  }

  const summaryInput = body.summary !== undefined ? body.summary.trim() : existing.summary;
  const updated: NewsItem = {
    ...existing,
    title: title.slice(0, 140),
    category: ((body.category ?? existing.category) || 'Pengumuman').trim().slice(0, 40),
    summary: (summaryInput || content.slice(0, 160)).slice(0, 220),
    content: content.slice(0, 2000),
    author: ((body.author ?? existing.author) || 'Pengurus RT 01 / RW 05').trim().slice(0, 80),
    imageUrl:
      body.imageUrl !== undefined
        ? body.imageUrl.trim().slice(0, 300) || undefined
        : existing.imageUrl,
  };

  state.news[idx] = updated;
  saveState(state);

  broadcastEvent({
    type: 'news:updated',
    payload: { news: updated },
  });

  res.json({ news: updated });
});

app.delete('/api/news/:id', requirePengurusOrSuperadmin, (req, res) => {
  const { id } = req.params;
  const exists = state.news.some((n) => n.id === id);
  if (!exists) {
    res.status(404).json({ error: 'Berita tidak ditemukan.' });
    return;
  }

  state.news = state.news.filter((n) => n.id !== id);
  saveState(state);

  broadcastEvent({
    type: 'news:deleted',
    payload: { newsId: id },
  });

  res.json({ ok: true, newsId: id });
});

app.patch('/api/notifications/read', (req, res) => {
  const body = req.body as Partial<{ id: string; all: boolean }>;
  if (body.all) {
    state.notifications = state.notifications.map((n) => ({ ...n, read: true }));
    saveState(state);
    broadcastEvent({ type: 'notifications:read', payload: { all: true } });
    res.json({ ok: true });
    return;
  }
  if (body.id) {
    state.notifications = state.notifications.map((n) =>
      n.id === body.id ? { ...n, read: true } : n
    );
    saveState(state);
    broadcastEvent({ type: 'notifications:read', payload: { id: body.id } });
    res.json({ ok: true });
    return;
  }
  res.status(400).json({ error: 'Parameter id atau all diperlukan.' });
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  app.get('/favicon.ico', (_req, res) => {
    const logoPath = path.join(
      __dirname,
      isProd ? 'dist' : 'public',
      'assets/aistudio/500309821_1300971965363211_2221899409798109426_n__1__55125c15.png'
    );
    if (fs.existsSync(logoPath)) {
      res.type('image/png').sendFile(logoPath);
      return;
    }
    res.status(404).end();
  });

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('/{*splat}', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = Number(process.env.PORT) || 3000;
  server?.listen(PORT, '0.0.0.0', () => {
    console.log(`Server Portal Warga RT 01 berjalan di http://0.0.0.0:${PORT}`);
  });
}

if (!IS_SERVERLESS) {
  startServer().catch((err) => {
    console.error('Gagal memulai server:', err);
    process.exit(1);
  });
}

export { app };
export default app;
