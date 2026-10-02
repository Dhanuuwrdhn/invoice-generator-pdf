import { listUsersForAdmin } from '@/lib/admin';
import { requireAdmin } from '@/lib/auth/current-user';
import { topUpAction } from './actions';

export const metadata = { title: 'Admin — Invoice PDF' };

export default async function AdminPage() {
  await requireAdmin();
  const users = await listUsersForAdmin();
  return (
    <main className="max-w-5xl mx-auto px-4 py-6 space-y-4">
      <h1 className="text-lg font-semibold text-[#19261F]">Users</h1>
      <div className="bg-white rounded-lg border border-[#C9D1C2] divide-y divide-[#D7DDCF]">
        {users.map((u) => (
          <div key={u.id} className="px-4 py-3 flex items-center gap-4 text-sm flex-wrap">
            <span className="font-medium text-[#19261F]">{u.email}</span>
            <span className="text-xs text-[#8A9587]">{u.emailVerifiedAt ? 'verified' : 'unverified'}</span>
            <span className="ml-auto font-mono text-xs">{u.tokenBalance} tokens</span>
            <form action={topUpAction} className="flex items-center gap-2">
              <input type="hidden" name="userId" value={u.id} />
              <input name="amount" type="number" min={1} max={1000} defaultValue={10} className="w-20 border border-[#BCC6B6] rounded px-2 py-1 text-sm" />
              <button className="px-3 py-1 rounded bg-[#0B5C42] text-white text-xs font-bold">TOP UP</button>
            </form>
          </div>
        ))}
      </div>
    </main>
  );
}
