import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  bigint,
  date,
  boolean,
  index,
  unique,
} from "drizzle-orm/pg-core";

// ---------- Pengurus (akun yang boleh login ke SIM) ----------
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  name: text("name").notNull(),
  jabatan: text("jabatan").notNull().default(""),
  role: text("role").notNull().default("anggota"), // superadmin | ketua | sekretaris | bendahara | anggota
  passwordHash: text("password_hash").notNull(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ---------- Berita & kegiatan warga ----------
export const news = pgTable("news", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  excerpt: text("excerpt").notNull().default(""),
  body: text("body").notNull(),
  published: boolean("published").notNull().default(true),
  eventDate: date("event_date"),
  authorId: integer("author_id").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ---------- Keuangan (semua lini) ----------
export const transactions = pgTable(
  "transactions",
  {
    id: serial("id").primaryKey(),
    lini: text("lini").notNull(), // lihat src/lib/constants.ts
    type: text("type").notNull(), // masuk | keluar
    amount: bigint("amount", { mode: "number" }).notNull(), // rupiah, bilangan bulat
    description: text("description").notNull(),
    txDate: date("tx_date").notNull(),
    createdBy: integer("created_by").references(() => users.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({ liniIdx: index("tx_lini_idx").on(t.lini, t.txDate) })
);

// ---------- Usulan warga ----------
export const proposals = pgTable("proposals", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(), // kode lacak, mis. USL-7K2M9Q
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull().default("lainnya"),
  submitterName: text("submitter_name").notNull(),
  submitterContact: text("submitter_contact").notNull().default(""),
  status: text("status").notNull().default("diterima"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const proposalUpdates = pgTable("proposal_updates", {
  id: serial("id").primaryKey(),
  proposalId: integer("proposal_id")
    .notNull()
    .references(() => proposals.id, { onDelete: "cascade" }),
  status: text("status").notNull(),
  note: text("note").notNull().default(""),
  updatedBy: integer("updated_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ---------- Data penduduk (NIK & KK disimpan terenkripsi) ----------
export const residents = pgTable(
  "residents",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    kkEnc: text("kk_enc").notNull(),
    nikEnc: text("nik_enc").notNull(),
    status: text("status").notNull(), // tetap | kontrak | kos
    address: text("address").notNull().default(""),
    phone: text("phone").notNull().default(""),
    notes: text("notes").notNull().default(""),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({ nameIdx: index("res_name_idx").on(t.name) })
);

// ---------- Arsip digital ----------
export const archives = pgTable(
  "archives",
  {
    id: serial("id").primaryKey(),
    category: text("category").notNull(), // surat_masuk | surat_keluar | notulen | berita_acara | perjanjian | proposal | lainnya
    title: text("title").notNull(),
    number: text("number").notNull().default(""),
    docDate: date("doc_date").notNull(),
    party: text("party").notNull().default(""), // pengirim / tujuan / pihak terkait
    description: text("description").notNull().default(""),
    fileUrl: text("file_url").notNull(),
    fileName: text("file_name").notNull(),
    fileType: text("file_type").notNull().default(""),
    fileSize: integer("file_size").notNull().default(0),
    uploadedBy: integer("uploaded_by").references(() => users.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({ catIdx: index("arc_cat_idx").on(t.category, t.docDate) })
);

// ---------- Susunan pengurus RT (tampil di situs warga; terpisah dari akun login) ----------
export const officers = pgTable("officers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  jabatan: text("jabatan").notNull(), // mis. Ketua RT, Sekretaris, Koordinator Dasawisma 1
  grup: text("grup").notNull().default("inti"), // inti | seksi
  sortOrder: integer("sort_order").notNull().default(0),
  visible: boolean("visible").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ---------- Bidang keuangan (dapat ditambah admin; transaksi merujuk ke bidang.key) ----------
export const bidang = pgTable("bidang", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(), // slug tetap, dipakai di transactions.lini
  label: text("label").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  active: boolean("active").notNull().default(true), // nonaktif = disembunyikan, riwayat tetap tersimpan
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ---------- Keterangan laporan per bidang per bulan (tampil di situs warga) ----------
export const reportNotes = pgTable(
  "report_notes",
  {
    id: serial("id").primaryKey(),
    lini: text("lini").notNull(),
    month: text("month").notNull(), // YYYY-MM
    note: text("note").notNull(),
    updatedBy: integer("updated_by").references(() => users.id),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({ uq: unique("report_notes_lini_month").on(t.lini, t.month) })
);
