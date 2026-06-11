"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { useEffect, useState } from "react";
import { Plus, UserCog, Pencil, Trash2, Loader2, Shield, CheckCircle, XCircle } from "lucide-react";
import { adminApi } from "@/lib/admin-api";

export default function AdminUsersPage() {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);

  const load = () =>
    adminApi.getUsers().then((res: any) => setUsers(res.data || [])).catch(() => {}).finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: number) => {
    if (!confirm(isRtl ? "هل أنت متأكد من حذف هذا المستخدم؟" : "Are you sure you want to delete this user?")) return;
    setDeleting(id);
    try {
      await adminApi.deleteUser(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch { }
    setDeleting(null);
  };

  return (
    <div className="au-root">
      <div className="au-header">
        <div>
          <h1 className="au-title">{isRtl ? "المستخدمين" : "Admin Users"}</h1>
          <p className="au-sub">{isRtl ? "إدارة حسابات المديرين والمشرفين" : "Manage administrator accounts"}</p>
        </div>
        <Link href="/admin/users/new" className="au-add-btn">
          <Plus className="size-4" />
          {isRtl ? "إضافة مستخدم" : "Add User"}
        </Link>
      </div>

      {loading ? (
        <div className="au-loading"><Loader2 className="size-6 animate-spin" /></div>
      ) : users.length === 0 ? (
        <div className="au-empty">
          <UserCog className="size-12 text-muted-foreground/30" />
          <p>{isRtl ? "لا يوجد مستخدمين" : "No users found"}</p>
        </div>
      ) : (
        <div className="au-table-wrap">
          <table className="au-table">
            <thead>
              <tr>
                <th>{isRtl ? "اسم المستخدم" : "Username"}</th>
                <th>{isRtl ? "الاسم الكامل" : "Full Name"}</th>
                <th>{isRtl ? "الأدوار" : "Roles"}</th>
                <th>{isRtl ? "الحالة" : "Status"}</th>
                <th className="au-th-actions">{isRtl ? "الإجراءات" : "Actions"}</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className={!user.active ? "inactive" : ""}>
                  <td className="au-td-user">
                    <div className="au-avatar">
                      <Shield className="size-4" />
                    </div>
                    <span className="au-username">{user.username}</span>
                  </td>
                  <td>{user.fullName}</td>
                  <td>
                    <div className="au-roles">
                      {(user.roles || []).map((ur: any) => (
                        <span key={ur.roleId || ur.role?.id} className="au-role-badge">
                          {ur.role?.name || ur.role || "N/A"}
                        </span>
                      ))}
                      {(!user.roles || user.roles.length === 0) && <span className="text-muted-foreground text-xs">—</span>}
                    </div>
                  </td>
                  <td>
                    {user.active ? (
                      <span className="au-status active"><CheckCircle className="size-3.5" />{isRtl ? "نشط" : "Active"}</span>
                    ) : (
                      <span className="au-status inactive"><XCircle className="size-3.5" />{isRtl ? "غير نشط" : "Inactive"}</span>
                    )}
                  </td>
                  <td>
                    <div className="au-actions">
                      <Link href={`/admin/users/${user.id}/edit`} className="au-action-btn edit">
                        <Pencil className="size-3.5" />
                        {isRtl ? "تعديل" : "Edit"}
                      </Link>
                      {user.username !== "admin" && (
                        <button onClick={() => handleDelete(user.id)} disabled={deleting === user.id} className="au-action-btn danger">
                          {deleting === user.id ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
                          {isRtl ? "حذف" : "Delete"}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <style>{`
        .au-root { display: flex; flex-direction: column; gap: 1.25rem; }
        .au-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
        .au-title { font-size: 1.5rem; font-weight: 800; }
        .au-sub { font-size: 0.83rem; color: var(--muted-foreground); margin-top: 0.15rem; }
        .au-add-btn { display: inline-flex; align-items: center; gap: 0.5rem; background: var(--primary); color: #fff; padding: 0.6rem 1.25rem; border-radius: 999px; font-weight: 700; font-size: 0.85rem; text-decoration: none; transition: opacity 0.2s; white-space: nowrap; }
        .au-add-btn:hover { opacity: 0.9; }
        .au-loading { display: flex; justify-content: center; padding: 3rem; }
        .au-empty { display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 3rem; color: var(--muted-foreground); }
        .au-table-wrap { background: var(--card); border: 1px solid var(--border); border-radius: 1rem; overflow: hidden; }
        .au-table { width: 100%; border-collapse: collapse; }
        .au-table th { text-align: start; font-size: 0.72rem; font-weight: 700; color: var(--muted-foreground); text-transform: uppercase; letter-spacing: 0.05em; padding: 0.875rem 1rem; border-bottom: 1px solid var(--border); background: var(--muted/30); }
        .au-table td { padding: 0.75rem 1rem; font-size: 0.875rem; border-bottom: 1px solid var(--border); vertical-align: middle; }
        .au-table tr:last-child td { border-bottom: none; }
        .au-table tr.inactive td { opacity: 0.6; }
        .au-table tr:hover td { background: var(--muted/20); }
        .au-th-actions { text-align: end; }
        .au-td-user { display: flex; align-items: center; gap: 0.625rem; }
        .au-avatar { width: 32px; height: 32px; border-radius: 0.5rem; background: var(--accent); display: flex; align-items: center; justify-content: center; color: var(--primary); flex-shrink: 0; }
        .au-username { font-weight: 600; }
        .au-roles { display: flex; flex-wrap: wrap; gap: 0.3rem; }
        .au-role-badge { font-size: 0.68rem; font-weight: 600; background: var(--muted); color: var(--muted-foreground); padding: 0.15rem 0.5rem; border-radius: 999px; white-space: nowrap; }
        .au-status { display: inline-flex; align-items: center; gap: 0.3rem; font-size: 0.75rem; font-weight: 600; }
        .au-status.active { color: #16a34a; }
        .au-status.inactive { color: #dc2626; }
        .au-actions { display: flex; align-items: center; gap: 0.4rem; justify-content: flex-end; }
        .au-action-btn { display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.35rem 0.7rem; border-radius: 0.5rem; font-size: 0.78rem; font-weight: 600; border: none; cursor: pointer; text-decoration: none; transition: all 0.2s; background: var(--muted); color: var(--foreground); }
        .au-action-btn:hover { opacity: 0.8; }
        .au-action-btn.danger { color: #dc2626; }
        .au-action-btn.danger:hover { background: rgba(220,38,38,0.1); }
      `}</style>
    </div>
  );
}
