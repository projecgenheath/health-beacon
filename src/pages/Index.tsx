import { useRef, useState } from 'react';
import { useExamData } from '@/hooks/useExamData';
import { useGoalNotifications } from '@/hooks/useGoalNotifications';
import { HealthSummaryCard } from '@/components/HealthSummaryCard';
import { UploadHistory } from '@/components/UploadHistory';
import { AlertsSection } from '@/components/AlertsSection';
import { ExamResultsList } from '@/components/ExamResultsList';
import { DashboardSkeleton } from '@/components/skeletons';
import { ExportPDFButton } from '@/components/ExportPDFButton';
import { HealthGoals } from '@/components/HealthGoals';
import { AIInsightsWidget } from '@/components/AIInsightsWidget';
import { HealthTrendsWidget } from '@/components/HealthTrendsWidget';
import { QuickActions } from '@/components/QuickActions';
import { UploadModal } from '@/components/UploadModal';
import { useSearchAndFilter } from '@/hooks/useSearchAndFilter';


const Index = () => {
  const { exams, histories, summary, loading: dataLoading, refetch } = useExamData();
  const [showUploadModal, setShowUploadModal] = useState(false);

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

  // Open upload modal
  const handleUploadClick = () => {
    setShowUploadModal(true);
  };

  if (dataLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Quick Actions Bar */}
      <QuickActions onUploadClick={handleUploadClick} />

      {/* Mobile-first: Summary first on mobile, then grid reverses on desktop */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        {/* Mobile: Show summary first (order-first on mobile, order-2 on desktop) */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6 order-first lg:order-2">
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
            histories={histories}
            onExamDeleted={refetch}
            filterProps={{
              filteredData,
              setSearchTerm,
              filters: { searchTerm: filters.searchTerm }
            }}
          />
        </div>

        {/* Mobile: AI Insights and other widgets second (order-2 on mobile, order-first on desktop) */}
        <div className="space-y-4 sm:space-y-6 lg:col-span-1 order-2 lg:order-first">
          <AIInsightsWidget exams={exams} />
          <HealthTrendsWidget histories={histories} exams={exams} />
          <HealthGoals />
          <UploadHistory onReprocess={refetch} />
          <AlertsSection exams={exams} />
        </div>
      </div>

      {/* Upload Modal */}
      <UploadModal
        open={showUploadModal}
        onOpenChange={setShowUploadModal}
        onUploadComplete={refetch}
      />
    </div>
  );
};

export default Index;
