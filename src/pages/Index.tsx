import { useExamData } from '@/hooks/useExamData';
import { useGoalNotifications } from '@/hooks/useGoalNotifications';
import { HealthSummaryCard } from '@/components/HealthSummaryCard';
import { UploadSection } from '@/components/UploadSection';
import { UploadHistory } from '@/components/UploadHistory';
import { AlertsSection } from '@/components/AlertsSection';
import { ExamResultsList } from '@/components/ExamResultsList';
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
  } = useSearchAndFilter(exams, {
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

        <ExamResultsList
          exams={exams}
          onExamDeleted={refetch}
          filterProps={{
            filteredData,
            setSearchTerm,
            filters: { searchTerm: filters.searchTerm }
          }}
        />
      </div>
    </div>
  );
};

export default Index;
