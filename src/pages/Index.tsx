import { Header } from '@/components/Header';
import { HealthSummaryCard } from '@/components/HealthSummaryCard';
import { UploadSection } from '@/components/UploadSection';
import { AlertsSection } from '@/components/AlertsSection';
import { ExamsList } from '@/components/ExamsList';
import { mockExamResults, mockExamHistory, mockHealthSummary } from '@/data/mockExams';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-6 pb-20">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left column - Summary and Upload */}
          <div className="space-y-6 lg:col-span-1">
            <HealthSummaryCard summary={mockHealthSummary} />
            <UploadSection />
            <AlertsSection exams={mockExamResults} />
          </div>

          {/* Right column - Exams list */}
          <div className="lg:col-span-2">
            <ExamsList exams={mockExamResults} histories={mockExamHistory} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
