import { useExamData } from '@/hooks/useExamData';
import { useGoalNotifications } from '@/hooks/useGoalNotifications';
import { HealthSummaryCard } from '@/components/HealthSummaryCard';
import { UploadSection } from '@/components/UploadSection';
import { UploadHistory } from '@/components/UploadHistory';
import { AlertsSection } from '@/components/AlertsSection';
import { ExamsList } from '@/components/ExamsList';
import { DashboardSkeleton } from '@/components/skeletons';
import { ExportPDFButton } from '@/components/ExportPDFButton';
import { HealthGoals } from '@/components/HealthGoals';
import { AIInsightsWidget } from '@/components/AIInsightsWidget';
import { useSearchAndFilter } from '@/hooks/useSearchAndFilter';

const Index = () => {
  const { exams, histories, summary, loading: dataLoading, refetch } = useExamData();

  // Unified Search and Filter State
  const {
    filters,
    filteredData,
    stats,
    setSearchTerm,
    setDateRange,
    toggleStatus,
    toggleCategory,
    toggleLab,
    setSorting,
    resetFilters,
  } = useSearchAndFilter(exams as unknown as Record<string, unknown>[], {
    searchFields: ['name', 'category'],
    dateField: 'date',
    statusField: 'status',
    categoryField: 'category',
  });

  // Initialize goal notifications
  useGoalNotifications();

  if (dataLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Left column - AI Insights and Upload */}
      <div className="space-y-6 lg:col-span-1">
        <AIInsightsWidget exams={exams} />
        <HealthGoals />
        <UploadSection onUploadComplete={refetch} />
        <UploadHistory onReprocess={refetch} />
        <AlertsSection exams={exams} />
      </div>

      {/* Center/Right column - Summary and Exams */}
      <div className="lg:col-span-2 space-y-6">
        <HealthSummaryCard
          summary={summary}
          onStatusClick={toggleStatus}
          activeStatuses={filters.statuses}
        />

        <div className="flex justify-end">
          <ExportPDFButton exams={exams} summary={summary} />
        </div>

        <ExamsList
          exams={exams}
          histories={histories}
          onExamDeleted={refetch}
          filterProps={{
            filters,
            filteredData: filteredData as typeof exams,
            stats,
            setSearchTerm,
            setDateRange,
            toggleStatus,
            toggleCategory,
            toggleLab,
            setSorting,
            resetFilters
          }}
        />
      </div>
    </div>
  );
};

export default Index;
