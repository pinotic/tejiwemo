"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, proposals, proposalUpdates } from "@/db";
import { requireAccess } from "@/lib/auth";
import { PROPOSAL_STATUS } from "@/lib/refs";

const schema = z.object({
  status: z.enum(PROPOSAL_STATUS.map((s) => s.key) as [string, ...string[]]),
  note: z.string().trim().max(1000).default(""),
});

export async function updateProposalStatus(id: number, _: { error?: string; ok?: boolean } | undefined, form: FormData) {
  const user = await requireAccess("usulan", "write");
  const p = schema.safeParse({ status: form.get("status"), note: form.get("note") ?? "" });
  if (!p.success) return { error: "Data tidak valid." };

  await db.update(proposals).set({ status: p.data.status }).where(eq(proposals.id, id));
  await db.insert(proposalUpdates).values({ proposalId: id, status: p.data.status, note: p.data.note, updatedBy: user.id });
  revalidatePath(`/pengurus/usulan/${id}`);
  revalidatePath("/pengurus/usulan");
  revalidatePath("/usulan/lacak", "layout");
  return { ok: true };
}
