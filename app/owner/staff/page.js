import { redirect } from 'next/navigation';
import { KeyRound, ShieldAlert, ShieldCheck, UserCheck, Users } from 'lucide-react';
import prisma from '@/lib/db';
import { getPlatformOwnerConfig, getPlatformOwnerSession } from '@/lib/platform-owner';
import { formatDateTime } from '@/lib/utils';
import AdminHeader from '@/components/owner/AdminHeader';
import CreateAdminModal from '@/components/owner/CreateAdminModal';
import AdminStaffControls from '@/components/owner/AdminStaffControls';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Admin Staff & Permissions - PharmaPulse Administration' };

export default async function StaffPage() {
  const session = await getPlatformOwnerSession();
  if (!session) redirect('/login');

  const { name: ownerName, emails: ownerEmails } = getPlatformOwnerConfig();
  const admins = await prisma.platformAdmin.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Admin Staff & Permissions"
        description="Manage administrative accounts, assign granular role permissions, and review superuser access."
        icon={UserCheck}
        actions={<CreateAdminModal />}
      />

      {/* Root Superuser Banner */}
      <section className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5 shadow-xs">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-extrabold text-emerald-950">
                  {ownerName} (Root Superuser)
                </h2>
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-emerald-800">
                  Environment Credential
                </span>
              </div>
              <p className="mt-1 text-xs text-emerald-800">
                Authorized Email(s): {ownerEmails.join(', ')}
              </p>
              <p className="mt-1 text-[11px] text-emerald-700/80">
                Root access is immutable, defined via server environment variables, and holds unconstrained administrative privileges across all multi-tenant partitions.
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-block rounded-lg border border-emerald-300 bg-white px-3 py-1 text-xs font-bold text-emerald-900">
            Full Privileges
          </span>
        </div>
      </section>

      {/* Additional Administrative Operators Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-sm font-extrabold text-slate-900">Platform Operators & Delegated Staff</h2>
          <p className="text-[10px] text-slate-500">
            Staff accounts with scoped administrative capabilities
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-180 text-left text-xs">
            <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3">Administrator</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Assigned Permissions</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Created</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {admins.length > 0 ? (
                admins.map((adm) => {
                  let perms = [];
                  try {
                    perms = JSON.parse(adm.permissions);
                  } catch {}

                  return (
                    <tr key={adm.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3.5">
                        <p className="font-bold text-slate-900">{adm.name}</p>
                        <p className="text-[11px] text-slate-500">{adm.email}</p>
                      </td>
                      <td className="px-5 py-3.5 font-bold text-slate-800">{adm.role}</td>
                      <td className="px-5 py-3.5 max-w-xs">
                        <div className="flex flex-wrap gap-1">
                          {perms.length > 0 ? (
                            perms.map((p) => (
                              <span
                                key={p}
                                className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-700"
                              >
                                {p.replace('_', ' ')}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-400 text-[11px]">No specific permissions</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            adm.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {adm.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-500">{formatDateTime(adm.createdAt)}</td>
                      <td className="px-5 py-3.5 text-right">
                        <AdminStaffControls admin={adm} />
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-500">
                    No delegated platform administrators added yet. Use the &ldquo;Add Administrator&rdquo; button above to grant scoped access.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
