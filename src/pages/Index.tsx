import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExamData } from '@/hooks/useExamData';
import { useGoalNotifications } from '@/hooks/useGoalNotifications';
import { HealthSummaryCard } from '@/components/dashboard/HealthSummaryCard';
import { UploadHistory } from '@/components/exams/UploadHistory';
import { AlertsSection } from '@/components/dashboard/AlertsSection';
import { ExamResultsList } from '@/components/exams/ExamResultsList';
import { DashboardSkeleton } from '@/components/skeletons';
import { ExportPDFButton } from '@/components/exams/ExportPDFButton';
import { HealthGoals } from '@/components/dashboard/HealthGoals';
import { AIInsightsWidget } from '@/components/dashboard/AIInsightsWidget';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { UploadModal } from '@/components/exams/UploadModal';
import { useSearchAndFilter } from '@/hooks/useSearchAndFilter';
import { useUserType } from '@/hooks/useUserType';
import { ExamRemindersWidget } from '@/components/exams/ExamRemindersWidget';


const Index = () => {
  const { exams, histories, summary, loading: dataLoading, refetch } = useExamData();
  const { profile } = useUserType();
  const navigate = useNavigate();
  const [showUploadModal, setShowUploadModal] = useState(false);

  useEffect(() => {
    if (profile?.user_type === 'laboratory') {
      navigate('/laboratory/dashboard');
    }
  }, [profile, navigate]);

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
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* Welcome & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Olá, {profile?.full_name?.split(' ')[0] || 'Paciente'} 👋
          </h1>
          <p className="text-muted-foreground">
            Bem-vindo ao seu Banco de Saúde. Aqui estão os seus dados mais recentes.
          </p>
        </div>
        <QuickActions onUploadClick={handleUploadClick} />
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        {/* Main Content (Left on Desktop) */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          <HealthSummaryCard
            summary={summary}
            onStatusClick={toggleStatus}
            activeStatuses={filters.statuses}
          />

          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Seus Exames</h3>
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

        {/* Widgets Sidebar (Right on Desktop) */}
        <div className="space-y-4 sm:space-y-6 lg:col-span-1">
          <AIInsightsWidget exams={exams} histories={histories} />
          <ExamRemindersWidget />
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
