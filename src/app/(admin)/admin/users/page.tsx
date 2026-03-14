export const dynamic = "force-dynamic";

import Link from "next/link";
import { Users } from "lucide-react";
import { createServiceClient } from "@/lib/supabase/server";
import { AdminSearchForm } from "@/components/admin/AdminSearchForm";
import { AdminPagination } from "@/components/admin/AdminPagination";

interface AdminUsersPageProps {
  searchParams: Promise<{ page?: string; search?: string }>;
}

interface UserRow {
  id: string;
  clerk_user_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export default async function AdminUsersPage({
  searchParams,
}: AdminUsersPageProps) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const limit = 50;
  const offset = (page - 1) * limit;

  const supabase = createServiceClient();

  let query = supabase
    .from("users")
    .select(
      "id, clerk_user_id, email, first_name, last_name, avatar_url, created_at",
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (params.search) {
    query = query.or(
      `email.ilike.%${params.search}%,first_name.ilike.%${params.search}%,last_name.ilike.%${params.search}%`
    );
  }

  const { data: userRows, count } = await query;
  const users = (userRows ?? []) as UserRow[];
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  // Fetch business counts per user
  const userIds = users.map((u) => u.id);
  let businessCounts: Record<string, number> = {};

  if (userIds.length > 0) {
    const { data: memberships } = await supabase
      .from("organization_members")
      .select("user_id, organization_id")
      .in("user_id", userIds);

    if (memberships && memberships.length > 0) {
      const orgIds = [
        ...new Set(
          memberships.map(
            (m: { organization_id: string }) => m.organization_id
          )
        ),
      ];

      const { data: businesses } = await supabase
        .from("businesses")
        .select("id, organization_id")
        .in("organization_id", orgIds);

      if (businesses) {
        const orgBusinessCount: Record<string, number> = {};
        for (const b of businesses as {
          id: string;
          organization_id: string;
        }[]) {
          orgBusinessCount[b.organization_id] =
            (orgBusinessCount[b.organization_id] ?? 0) + 1;
        }

        for (const m of memberships as {
          user_id: string;
          organization_id: string;
        }[]) {
          businessCounts[m.user_id] =
            (businessCounts[m.user_id] ?? 0) +
            (orgBusinessCount[m.organization_id] ?? 0);
        }
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-[#7C3AED]" />
            <h2 className="text-2xl font-semibold text-foreground">Users</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {total} total {total === 1 ? "user" : "users"}
          </p>
        </div>
      </div>

      <AdminSearchForm placeholder="Search by name or email..." />

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  User
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Email
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Businesses
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Joined
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    {params.search
                      ? "No users match your search."
                      : "No users found."}
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const fullName = [user.first_name, user.last_name]
                    .filter(Boolean)
                    .join(" ");
                  return (
                    <tr
                      key={user.id}
                      className="transition-colors hover:bg-muted/30"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/users/${user.id}`}
                          className="flex items-center gap-3"
                        >
                          {user.avatar_url ? (
                            <img
                              src={user.avatar_url}
                              alt=""
                              className="h-8 w-8 rounded-full"
                            />
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                              {(user.first_name?.[0] ?? user.email[0]).toUpperCase()}
                            </div>
                          )}
                          <span className="font-medium text-foreground hover:text-[#7C3AED] hover:underline">
                            {fullName || "No name"}
                          </span>
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {user.email}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {businessCounts[user.id] ?? 0}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AdminPagination currentPage={page} totalPages={totalPages} />
    </div>
  );
}
