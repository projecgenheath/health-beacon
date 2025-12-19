import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useExamData } from '@/hooks/useExamData';
import { Header } from '@/components/Header';
import { HealthSummaryCard } from '@/components/HealthSummaryCard';
import { UploadSection } from '@/components/UploadSection';
import { AlertsSection } from '@/components/AlertsSection';
import { ExamsList } from '@/components/ExamsList';
import { Activity } from 'lucide-react';

const Index = () => {
  const { user, loading: authLoading } = useAuth();
  const { exams, histories, summary, loading: dataLoading, refetch } = useExamData();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  if (authLoading || dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-medical-light/20 to-background">
        <div className="animate-pulse">
          <Activity className="h-12 w-12 text-primary" />
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-6 pb-20">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left column - Summary and Upload */}
          <div className="space-y-6 lg:col-span-1">
            <HealthSummaryCard summary={summary} />
            <UploadSection onUploadComplete={refetch} />
            <AlertsSection exams={exams} />
          </div>

          {/* Right column - Exams list */}
          <div className="lg:col-span-2">
            <ExamsList exams={exams} histories={histories} onExamDeleted={refetch} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
