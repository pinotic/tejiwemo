import {
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Pencil,
  Plus,
  RefreshCw,
  Shield,
  Trash2,
  UserCheck,
  UserPlus,
  UserX,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { authFetch } from '../lib/auth';
import { formatDateId } from '../lib/format';
import type { AuthUser } from '../types';

interface SuperadminUsersPanelProps {
  currentUser: AuthUser;
}

export function SuperadminUsersPanel({ currentUser }: SuperadminUsersPanelProps) {
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ kind: 'ok' | 'err'; text: string } | null>(
    null
  );

  // Create form
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newPosition, setNewPosition] = useState('');
  const [newActive, setNewActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Edit form
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editPosition, setEditPosition] = useState('');
  const [editActive, setEditActive] = useState(true);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/admin/users');
      const data = (await res.json()) as { users?: AuthUser[]; error?: string };
      if (!res.ok) {
        throw new Error(data.error || 'Gagal memuat daftar akun.');
      }
      setUsers(data.users || []);
    } catch (err) {
      setFeedback({
        kind: 'err',
        text: err instanceof Error ? err.message : 'Gagal memuat daftar akun.',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let out = '';
    for (let i = 0; i < 10; i++) {
      out += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return out;
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setSubmitting(true);
    try {
      const res = await authFetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: newUsername.trim().toLowerCase(),
          password: newPassword,
          displayName: newDisplayName.trim(),
          position: newPosition.trim(),
          active: newActive,
        }),
      });
      const data = (await res.json()) as { user?: AuthUser; error?: string };
      if (!res.ok || !data.user) {
        throw new Error(data.error || 'Gagal membuat akun pengurus.');
      }
      setUsers((prev) => [...prev, data.user!]);
      setFeedback({
        kind: 'ok',
        text: `Akun pengurus "${data.user.username}" (${data.user.displayName}) berhasil dibuat.`,
      });
      setNewUsername('');
      setNewPassword('');
      setNewDisplayName('');
      setNewPosition('');
      setNewActive(true);
    } catch (err) {
      setFeedback({
        kind: 'err',
        text: err instanceof Error ? err.message : 'Terjadi kesalahan.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (u: AuthUser) => {
    setEditingId(u.id);
    setEditUsername(u.username);
    setEditPassword('');
    setShowEditPassword(false);
    setEditDisplayName(u.displayName);
    setEditPosition(u.position);
    setEditActive(u.active);
    setConfirmDeleteId(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    setFeedback(null);
    setSubmitting(true);
    try {
      const res = await authFetch(`/api/admin/users/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: editUsername.trim().toLowerCase(),
          displayName: editDisplayName.trim(),
          position: editPosition.trim(),
          active: editActive,
          ...(editPassword.trim() ? { password: editPassword } : {}),
        }),
      });
      const data = (await res.json()) as { user?: AuthUser; error?: string };
      if (!res.ok || !data.user) {
        throw new Error(data.error || 'Gagal memperbarui akun.');
      }
      setUsers((prev) => prev.map((u) => (u.id === editingId ? data.user! : u)));
      setEditingId(null);
      setEditPassword('');
      setFeedback({
        kind: 'ok',
        text: `Akun "${data.user.username}" berhasil diperbarui.`,
      });
    } catch (err) {
      setFeedback({
        kind: 'err',
        text: err instanceof Error ? err.message : 'Terjadi kesalahan.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    setFeedback(null);
    try {
      const res = await authFetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) {
        throw new Error(data.error || 'Gagal menghapus akun pengurus.');
      }
      setUsers((prev) => prev.filter((u) => u.id !== id));
      setConfirmDeleteId(null);
      if (editingId === id) setEditingId(null);
      setFeedback({ kind: 'ok', text: 'Akun pengurus berhasil dihapus.' });
    } catch (err) {
      setFeedback({
        kind: 'err',
        text: err instanceof Error ? err.message : 'Terjadi kesalahan.',
      });
    }
  };

  return (
    <div className="p-5 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <h3 className="font-display text-base font-bold text-slate-900">
            Kelola Akun Pengurus RT (Superadmin)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Buat username dan password login untuk pengurus, ubah jabatan, reset password, atau
            nonaktifkan/hapus akun.
          </p>
        </div>
        <div className="text-xs text-slate-500 font-mono tabular-nums">
          Total {users.length} akun terdaftar
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3 text-xs rounded-lg border flex items-center gap-2 ${
            feedback.kind === 'ok'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {feedback.kind === 'ok' && (
            <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Create Pengurus Account Form */}
        <form
          onSubmit={handleCreateUser}
          className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5 space-y-3.5"
        >
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-900">
            <UserPlus className="w-4 h-4 text-emerald-700" aria-hidden="true" />
            <span>Buat Akun Pengurus Baru</span>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Nama Lengkap Pengurus
            </label>
            <input
              type="text"
              required
              value={newDisplayName}
              onChange={(e) => setNewDisplayName(e.target.value)}
              placeholder="Contoh: Ibu Dewi Kartika"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Jabatan / Bagian
            </label>
            <input
              type="text"
              required
              value={newPosition}
              onChange={(e) => setNewPosition(e.target.value)}
              placeholder="Contoh: Sekretaris RT / Bendahara"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Username Login
            </label>
            <input
              type="text"
              required
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value.toLowerCase())}
              placeholder="Contoh: sekretaris_rt01"
              className="w-full px-3 py-2 text-sm font-mono bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
            />
            <p className="mt-1 text-[11px] text-slate-500">
              Minimal 3 karakter: huruf kecil, angka, titik, strip, atau garis bawah.
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-slate-700">
                Password Awal
              </label>
              <button
                type="button"
                onClick={() => {
                  setNewPassword(generateRandomPassword());
                  setShowNewPassword(true);
                }}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-800 hover:underline"
              >
                <RefreshCw className="w-3 h-3" aria-hidden="true" />
                <span>Buat Otomatis</span>
              </button>
            </div>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                className="w-full pl-3 pr-10 py-2 text-sm font-mono bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword((p) => !p)}
                aria-label={showNewPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700"
              >
                {showNewPassword ? (
                  <EyeOff className="w-4 h-4" aria-hidden="true" />
                ) : (
                  <Eye className="w-4 h-4" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={newActive}
              onChange={(e) => setNewActive(e.target.checked)}
              className="rounded border-slate-300 text-emerald-700 focus:ring-emerald-700"
            />
            <span>Aktifkan akun langsung setelah dibuat</span>
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{submitting ? 'Menyimpan...' : 'Buat Akun Pengurus'}</span>
          </button>
        </form>

        {/* Accounts List */}
        <div className="lg:col-span-7 space-y-3">
          <div className="text-xs font-semibold text-slate-800">
            Daftar Akun Pengurus &amp; Superadmin
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-slate-500 border border-slate-200 rounded-xl">
              Memuat daftar akun...
            </div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 border border-slate-200 rounded-xl">
              Belum ada akun pengurus terdaftar.
            </div>
          ) : (
            <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl bg-white overflow-hidden">
              {users.map((u) => {
                const isEditing = editingId === u.id;
                const isConfirmDelete = confirmDeleteId === u.id;
                const isSuperadminAccount = u.role === 'superadmin';
                const isSelf = u.id === currentUser.id;

                return (
                  <div key={u.id} className="p-4 space-y-3">
                    {isEditing ? (
                      <form onSubmit={handleSaveEdit} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-emerald-900">
                            Edit Akun: {u.username}
                          </span>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="text-xs text-slate-500 hover:text-slate-800"
                          >
                            Batal
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-medium text-slate-600 mb-1">
                              Nama Lengkap
                            </label>
                            <input
                              type="text"
                              required
                              value={editDisplayName}
                              onChange={(e) => setEditDisplayName(e.target.value)}
                              className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-medium text-slate-600 mb-1">
                              Jabatan
                            </label>
                            <input
                              type="text"
                              required
                              value={editPosition}
                              onChange={(e) => setEditPosition(e.target.value)}
                              className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-medium text-slate-600 mb-1">
                              Username
                            </label>
                            <input
                              type="text"
                              required
                              value={editUsername}
                              onChange={(e) => setEditUsername(e.target.value.toLowerCase())}
                              className="w-full px-2.5 py-1.5 text-xs font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-medium text-slate-600 mb-1">
                              Password Baru (Opsional)
                            </label>
                            <div className="relative">
                              <input
                                type={showEditPassword ? 'text' : 'password'}
                                minLength={6}
                                value={editPassword}
                                onChange={(e) => setEditPassword(e.target.value)}
                                placeholder="Kosongkan jika tetap"
                                className="w-full pl-2.5 pr-8 py-1.5 text-xs font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                              />
                              <button
                                type="button"
                                onClick={() => setShowEditPassword((p) => !p)}
                                aria-label="Tampilkan password baru"
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                              >
                                {showEditPassword ? (
                                  <EyeOff className="w-3.5 h-3.5" aria-hidden="true" />
                                ) : (
                                  <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>

                        {!isSuperadminAccount && (
                          <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={editActive}
                              onChange={(e) => setEditActive(e.target.checked)}
                              className="rounded border-slate-300 text-emerald-700 focus:ring-emerald-700"
                            />
                            <span>Akun aktif (dapat login ke Laman Pengurus)</span>
                          </label>
                        )}

                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                          >
                            Batal
                          </button>
                          <button
                            type="submit"
                            disabled={submitting}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg"
                          >
                            <KeyRound className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>{submitting ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                            <span className="text-sm font-semibold text-slate-900">
                              {u.displayName}
                            </span>
                            <span aria-hidden="true" className="text-slate-300">
                              ·
                            </span>
                            <span className="text-xs text-slate-600">{u.position}</span>
                            {isSelf && (
                              <span className="text-[11px] font-medium text-emerald-800">
                                (Akun Anda)
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-500">
                            <span className="font-mono text-slate-800 font-medium">
                              @{u.username}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                              {isSuperadminAccount ? (
                                <>
                                  <Shield className="w-3 h-3 text-emerald-700" aria-hidden="true" />
                                  Superadmin
                                </>
                              ) : (
                                'Pengurus RT'
                              )}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span
                              className={`inline-flex items-center gap-1 font-medium ${
                                u.active ? 'text-emerald-800' : 'text-red-700'
                              }`}
                            >
                              {u.active ? (
                                <>
                                  <UserCheck className="w-3 h-3" aria-hidden="true" />
                                  Aktif
                                </>
                              ) : (
                                <>
                                  <UserX className="w-3 h-3" aria-hidden="true" />
                                  Nonaktif
                                </>
                              )}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span className="text-[11px] tabular-nums">
                              Dibuat {formatDateId(u.createdAt)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => startEdit(u)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Edit / Password</span>
                          </button>

                          {!isSuperadminAccount &&
                            (isConfirmDelete ? (
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteUser(u.id)}
                                  className="px-2.5 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg"
                                >
                                  Hapus
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                                >
                                  Batal
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(u.id)}
                                aria-label={`Hapus akun ${u.username}`}
                                className="p-2 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" aria-hidden="true" />
                              </button>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
