import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { pipelineSummary, stageCounts } from '../services/metrics';
import { staleApplications } from '../services/followups';
import { recentApplications } from '../services/activity';
import { StatTiles } from '../components/dashboard/StatTiles';
import { StageCounts } from '../components/dashboard/StageCounts';
import { PipelineBreakdown } from '../components/dashboard/PipelineBreakdown';
import { RecentActivity } from '../components/dashboard/RecentActivity';
import { FollowUpList } from '../components/dashboard/FollowUpList';

export default function DashboardPage() {
  const stages = useAppStore((s) => s.stages);
  const applications = useAppStore((s) => s.applications);
  const updateApplication = useAppStore((s) => s.updateApplication);

  const view = useMemo(() => {
    const data = { stages, applications };
    return {
      summary: pipelineSummary(data),
      counts: stageCounts(data),
      recent: recentApplications(applications, 6),
      followUps: staleApplications(applications, stages),
      stageById: new Map(stages.map((s) => [s.id, s])),
      companyCount: new Set(applications.map((a) => a.company)).size,
    };
  }, [stages, applications]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Dashboard</h1>
          <p className="text-sm text-slate-500">
            Overview of your job search pipeline.
          </p>
        </div>
        <Link
          to="/board"
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          Open board →
        </Link>
      </div>

      <StatTiles
        total={view.summary.total}
        responseRate={view.summary.responseRate}
        companyCount={view.companyCount}
        followUpCount={view.followUps.length}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <StageCounts counts={view.counts} />
        <PipelineBreakdown summary={view.summary} />
        <RecentActivity items={view.recent} stageById={view.stageById} />
        <FollowUpList
          items={view.followUps}
          stageById={view.stageById}
          onMarkFollowedUp={(id) => updateApplication(id, {})}
        />
      </div>
    </div>
  );
}
