import { useExamData } from '@/hooks/useExamData';
import { HealthSummaryCard } from '@/components/HealthSummaryCard';
import { UploadSection } from '@/components/UploadSection';
import { UploadHistory } from '@/components/UploadHistory';
import { AlertsSection } from '@/components/AlertsSection';
import { ExamsList } from '@/components/ExamsList';
import { DashboardSkeleton } from '@/components/skeletons';
import { ExportPDFButton } from '@/components/ExportPDFButton';

const Index = () => {
  const { exams, histories, summary, loading: dataLoading, refetch } = useExamData();

  if (dataLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Left column - Summary and Upload */}
      <div className="space-y-6 lg:col-span-1">
        <HealthSummaryCard summary={summary} />
        <UploadSection onUploadComplete={refetch} />
        <UploadHistory onReprocess={refetch} />
        <AlertsSection exams={exams} />
      </div>

      {/* Right column - Exams list */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex justify-end">
          <ExportPDFButton exams={exams} summary={summary} />
        </div>
        <ExamsList exams={exams} histories={histories} onExamDeleted={refetch} />
      </div>
    </div>
  );
};

export default Index;
