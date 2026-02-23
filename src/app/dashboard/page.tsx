import AdminPanel from "@/components/admin/admin-panel";
import { getProjectItems, getStatusOptions } from "@/app/actions/items";
import { getRecentActivities } from "@/app/actions/dashboard";
import { calculateDashboardStats, calculateCurvaS } from "@/lib/dashboard-calculations";
import { prisma } from "@/lib/prisma";
import { buildProjectScope, requireAuth } from "@/lib/access-control";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const currentUser = await requireAuth();
  const scope = buildProjectScope(currentUser);

  // Parallel Fetching: 3 concurrent requests instead of 5 sequential
  const [items, recentActivities, statusOptionsData, totalRisks, openIssues] = await Promise.all([
    getProjectItems(),
    getRecentActivities(),
    getStatusOptions(),
    prisma.projectRisk.count({
      where: {
        project: { is: scope },
      },
    }),
    prisma.issue.count({
      where: {
        AND: [
          { project: { is: scope } },
          {
            OR: [
              { statusId: null },
              { status: { is: { isFinal: false } } },
            ],
          },
        ],
      },
    })
  ]);

  // Local sync calculation (Instant)
  const stats = { ...calculateDashboardStats(items), totalRisks, openIssues };
  const curvaSData = calculateCurvaS(items);
  
  const statusOptions = statusOptionsData.map(opt => opt.label);
  
  return (
    <div className="h-screen">
      <AdminPanel 
        initialItems={items}
        stats={stats}
        curvaSData={curvaSData}
        recentActivities={recentActivities}
        statusOptions={statusOptions.length > 0 ? statusOptions : [
          "Keyuser - Pendente",
          "Keyuser - Concluído",
          "Keyuser - Com problemas"
        ]}
      />
    </div>
  );
}
