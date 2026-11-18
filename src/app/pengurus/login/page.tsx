import { redirect } from "next/navigation";
import Link from "next/link";
import { getUser } from "@/lib/auth";
import { SITE } from "@/lib/refs";
import LoginForm from "./form";

export const metadata = { title: "Login Pengurus" };
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await getUser()) redirect("/pengurus");
  return (
    <main className="flex min-h-screen items-center justify-center bg-brand-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-lg font-bold text-white">
            RT
          </div>
          <h1 className="text-xl font-semibold">SIM Pengurus {SITE.name}</h1>
          <p className="mt-1 text-sm text-stone-500">Khusus pengurus RT. Silakan masuk.</p>
        </div>
        <div className="card">
          <LoginForm />
        </div>
        <p className="mt-4 text-center text-sm">
          <Link href="/" className="text-stone-500 hover:text-brand-700">
            ← Kembali ke beranda warga
          </Link>
        </p>
      </div>
    </main>
  );
}
