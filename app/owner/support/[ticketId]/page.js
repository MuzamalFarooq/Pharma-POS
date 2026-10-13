import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, Building2, Calendar, LifeBuoy, Mail, User } from 'lucide-react';
import prisma from '@/lib/db';
import { getPlatformOwnerSession } from '@/lib/platform-owner';
import { formatDateTime } from '@/lib/utils';
import TicketDetailsClient from '@/components/owner/TicketDetailsClient';

export const dynamic = 'force-dynamic';

export default async function TicketPage({ params }) {
  const session = await getPlatformOwnerSession();
  if (!session) redirect('/login');

  const { ticketId } = await params;
  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    include: {
      comments: { orderBy: { createdAt: 'asc' } },
      organization: { select: { id: true, name: true, code: true, phone: true } },
    },
  });

  if (!ticket) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/owner/support"
          className="mb-2.5 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-emerald-700"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to all tickets & disputes
        </Link>
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
                Ticket #{ticket.ticketNumber}
              </h1>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-800">
                {ticket.status.replace('_', ' ')}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Category: <strong>{ticket.category.replace('_', ' ')}</strong> · Opened {formatDateTime(ticket.createdAt)}
            </p>
          </div>
        </div>
      </div>

      {/* Overview Metadata Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
            <User className="h-4 w-4 text-emerald-600" /> Customer / Submitter
          </h2>
          <p className="mt-2 text-sm font-bold text-slate-900">{ticket.customerName || 'Anonymous Customer'}</p>
          <p className="text-xs text-slate-500">{ticket.customerEmail || 'No email provided'}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
            <Building2 className="h-4 w-4 text-emerald-600" /> Associated Pharmacy
          </h2>
          {ticket.organization ? (
            <div>
              <Link
                href={`/owner/pharmacies/${ticket.organization.id}`}
                className="mt-2 text-sm font-bold text-slate-900 hover:text-emerald-700 block"
              >
                {ticket.organization.name}
              </Link>
              <p className="text-xs text-slate-500">Code: {ticket.organization.code} · Phone: {ticket.organization.phone}</p>
            </div>
          ) : (
            <p className="mt-2 text-xs text-slate-500">{ticket.pharmacyName || 'No specific pharmacy associated'}</p>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
            <LifeBuoy className="h-4 w-4 text-emerald-600" /> Priority & Assignment
          </h2>
          <p className="mt-2 text-sm font-bold text-slate-900">Priority: {ticket.priority}</p>
          <p className="text-xs text-slate-500">Assigned Admin: {ticket.assignedTo || 'Unassigned'}</p>
        </div>
      </div>

      <TicketDetailsClient ticket={ticket} />
    </div>
  );
}
