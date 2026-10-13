'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Loader2, MessageSquare, Send } from 'lucide-react';
import { toast } from 'sonner';

export default function TicketDetailsClient({ ticket }) {
  const router = useRouter();
  const [status, setStatus] = useState(ticket.status);
  const [priority, setPriority] = useState(ticket.priority);
  const [resolutionReason, setResolutionReason] = useState(ticket.resolutionReason || '');
  const [newComment, setNewComment] = useState('');
  const [isInternal, setIsInternal] = useState(true);
  const [savingStatus, setSavingStatus] = useState(false);
  const [postingComment, setPostingComment] = useState(false);

  const handleUpdateStatus = async () => {
    setSavingStatus(true);
    try {
      const res = await fetch(`/api/owner/support/${encodeURIComponent(ticket.id)}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, priority, resolutionReason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update ticket status.');
      toast.success('Ticket updated successfully.');
      router.refresh();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSavingStatus(false);
    }
  };

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setPostingComment(true);
    try {
      const res = await fetch(`/api/owner/support/${encodeURIComponent(ticket.id)}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: newComment, isInternal }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to post note.');
      toast.success('Note added to ticket history.');
      setNewComment('');
      router.refresh();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setPostingComment(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Discussion Thread & Description */}
      <div className="space-y-6 lg:col-span-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Subject & Description</h2>
          <h3 className="mt-2 text-base font-extrabold text-slate-900">{ticket.subject}</h3>
          <p className="mt-3 whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-xs leading-relaxed text-slate-700">
            {ticket.description}
          </p>
        </div>

        {/* Notes & Comments Thread */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <h2 className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
            <MessageSquare className="h-4 w-4 text-emerald-600" /> Administrative Notes & Discussion ({ticket.comments.length})
          </h2>

          <div className="space-y-3">
            {ticket.comments.length > 0 ? (
              ticket.comments.map((comment) => (
                <div key={comment.id} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 text-xs">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pb-1">
                    <span className="font-bold text-slate-800">
                      {comment.authorName} · <span className="font-normal text-slate-500">{comment.authorRole}</span>
                    </span>
                    <span>{new Date(comment.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="mt-1 text-slate-700 whitespace-pre-wrap">{comment.message}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 italic py-2">No notes recorded yet.</p>
            )}
          </div>

          {/* Add Note Form */}
          <form onSubmit={handlePostComment} className="pt-3 border-t border-slate-100 space-y-2.5">
            <textarea
              rows={3}
              required
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add internal investigation note, call log, or escalation details..."
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs outline-none focus:border-emerald-500"
            />
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs text-slate-600">
                <input
                  type="checkbox"
                  checked={isInternal}
                  onChange={(e) => setIsInternal(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                Internal Administrative Note
              </label>
              <button
                type="submit"
                disabled={postingComment || !newComment.trim()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {postingComment ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                Add Note
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Status & Priority Management Sidebar */}
      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-extrabold text-slate-900">Ticket Lifecycle Controls</h2>

          <div className="space-y-3 text-xs">
            <label className="block font-semibold text-slate-700">
              Current Status:
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-2 outline-none focus:border-emerald-500"
              >
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="WAITING_RESPONSE">Waiting for Response</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
              </select>
            </label>

            <label className="block font-semibold text-slate-700">
              Priority Level:
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-2 outline-none focus:border-emerald-500"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </label>

            <label className="block font-semibold text-slate-700">
              Resolution Reason / Outcome:
              <textarea
                rows={3}
                value={resolutionReason}
                onChange={(e) => setResolutionReason(e.target.value)}
                placeholder="State the resolution outcome or reason when closing..."
                className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs outline-none focus:border-emerald-500"
              />
            </label>

            <button
              type="button"
              onClick={handleUpdateStatus}
              disabled={savingStatus}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {savingStatus && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Save Ticket Status
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
