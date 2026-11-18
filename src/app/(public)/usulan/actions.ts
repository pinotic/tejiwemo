"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db, proposals, proposalUpdates } from "@/db";
import { PROPOSAL_CATEGORY } from "@/lib/refs";
import { trackingCode } from "@/lib/utils";

const schema = z.object({
  name: z.string().trim().min(2, "Nama wajib diisi").max(100),
  contact: z.string().trim().max(100).optional().default(""),
  category: z.enum(PROPOSAL_CATEGORY.map((c) => c.key) as [string, ...string[]]),
  title: z.string().trim().min(5, "Judul minimal 5 karakter").max(150),
  description: z.string().trim().min(15, "Jelaskan usulan minimal 15 karakter").max(3000),
});

// Pembatas sederhana: maks 5 usulan per 10 menit per instance server
const recent: number[] = [];

export async function submitProposal(_: { error?: string } | undefined, form: FormData) {
  // honeypot: kolom tersembunyi yang hanya diisi bot
  if (String(form.get("website") ?? "") !== "") redirect("/usulan");

  const now = Date.now();
  while (recent.length && now - recent[0] > 10 * 60 * 1000) recent.shift();
  if (recent.length >= 5) return { error: "Terlalu banyak usulan masuk. Coba lagi beberapa menit lagi." };

  const parsed = schema.safeParse({
    name: form.get("name"),
    contact: form.get("contact") ?? "",
    category: form.get("category"),
    title: form.get("title"),
    description: form.get("description"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;

  let code = "";
  for (let i = 0; i < 5; i++) {
    code = trackingCode();
    try {
      const [p] = await db
        .insert(proposals)
        .values({
          code,
          title: d.title,
          description: d.description,
          category: d.category,
          submitterName: d.name,
          submitterContact: d.contact,
        })
        .returning({ id: proposals.id });
      await db.insert(proposalUpdates).values({
        proposalId: p.id,
        status: "diterima",
        note: "Usulan diterima dan tercatat.",
      });
      recent.push(now);
      redirect(`/usulan/lacak/${code}?baru=1`);
    } catch (e) {
      // redirect() melempar error khusus Next; lempar ulang
      if (e instanceof Error && e.message === "NEXT_REDIRECT") throw e;
      if (typeof e === "object" && e && "digest" in e) throw e;
      // kemungkinan kode bentrok: coba lagi
    }
  }
  return { error: "Gagal menyimpan usulan. Silakan coba lagi." };
}
