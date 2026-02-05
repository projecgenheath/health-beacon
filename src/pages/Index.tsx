import { useRef, useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useExamData } from '@/hooks/useExamData';
import { useGoalNotifications } from '@/hooks/useGoalNotifications';
import { HealthSummaryCard } from '@/components/dashboard/HealthSummaryCard';
import { DashboardSkeleton } from '@/components/skeletons';
import { HealthGoals } from '@/components/dashboard/HealthGoals';
import { UploadModal } from '@/components/exams/UploadModal';
import { useUserType } from '@/hooks/useUserType';
import { Bell, ChevronRight, Flag, Calendar, FileText, CheckCircle2, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

  useGoalNotifications();

  const handleUploadClick = () => {
    setShowUploadModal(true);
  };

  if (dataLoading) {
    return <DashboardSkeleton />;
  }

  // Mock data for Metas and Appointments to match Image 1
  const dailyGoals = [
    { label: 'Passos', current: 5240, target: 8000, color: 'bg-primary' },
    { label: 'Hidratação', current: 800, target: 2500, unit: 'ml', color: 'bg-blue-400' }
  ];

  return (
    <div className="space-y-6 pb-20 animate-fade-in max-w-md mx-auto md:max-w-4xl lg:max-w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-muted-foreground text-sm font-medium mb-1">PACIENTE</div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            Olá, {profile?.full_name?.split(' ')[0] || 'João'} <span className="animate-wave">👋</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            Aqui está o resumo da sua saúde hoje.
          </p>
        </div>
        <Button size="icon" variant="ghost" className="rounded-full bg-card/50 relative">
          <Bell className="w-5 h-5 text-foreground" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-card" />
        </Button>
      </div>

      {/* Health Score Card */}
      <HealthSummaryCard
        summary={summary}
      />

      {/* Insights & Metas Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-foreground">Insights & Metas</h3>
          <Button
            variant="link"
            className="text-primary font-medium p-0 h-auto"
            onClick={() => navigate('/dashboard/health-progress')}
          >
            Ver todos
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* AI Insights Card (Custom Style) */}
          <div
            className="rounded-3xl p-6 bg-gradient-to-br from-blue-900/50 to-slate-900 border border-blue-500/20 relative overflow-hidden group hover:scale-[1.02] transition-transform cursor-pointer"
            onClick={() => navigate('/dashboard/health-progress')}
          >
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <div className="text-9xl font-bold">✨</div>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <div className="text-white text-lg">✨</div>
              </div>
              <span className="font-bold text-blue-400">AI Insights</span>
            </div>
            <h4 className="text-xl font-bold text-white mb-2">Vitamina D +10%</h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              Seus níveis subiram em relação ao mês anterior. Ótimo progresso!
            </p>
          </div>

          {/* Metas Diárias Card */}
          <Card className="rounded-3xl p-6 bg-card border-none shadow-sm hover:scale-[1.02] transition-transform">
            <div className="flex items-center gap-2 mb-6">
              <Flag className="w-5 h-5 text-orange-500 fill-orange-500" />
              <span className="font-bold text-foreground">Metas Diárias</span>
            </div>

            <div className="space-y-5">
              {dailyGoals.map((goal, idx) => (
                <div key={idx}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground font-medium">{goal.label}</span>
                    <span className="font-bold text-foreground">
                      {goal.current.toLocaleString()} <span className="text-muted-foreground font-normal">/ {goal.target.toLocaleString()}{goal.unit ? ' ' + goal.unit : ''}</span>
                    </span>
                  </div>
                  <Progress value={(goal.current / goal.target) * 100} className="h-2.5 bg-muted" indicatorClassName={goal.color} />
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Horizontal Scroll / Grid Section (Next & Upload) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Próximo Appointment */}
        <div className="rounded-3xl p-5 bg-card border-none shadow-sm flex flex-col justify-between h-40 group hover:bg-card/80 transition-colors cursor-pointer relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-purple-500/10 rounded-2xl text-purple-400">
              <Calendar className="w-6 h-6" />
            </div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">PRÓXIMO</span>
          </div>
          <div>
            <div className="text-muted-foreground text-sm mb-1">14 Out, 08:00</div>
            <div className="font-bold text-lg text-foreground">Hemograma Completo</div>
          </div>
        </div>

        {/* Envio Recente */}
        <div
          className="rounded-3xl p-5 bg-card border-none shadow-sm flex flex-col justify-between h-40 group hover:bg-card/80 transition-colors cursor-pointer relative overflow-hidden"
          onClick={() => {
            const latestExam = exams[0];
            if (latestExam?.examId) {
              navigate(`/exam/${latestExam.examId}`);
            } else {
              handleUploadClick();
            }
          }}
        >
          <div className="flex justify-between items-start">
            <div className="p-3 bg-green-500/10 rounded-2xl text-green-500">
              <FileText className="w-6 h-6" />
            </div>
            <CheckCircle2 className="w-5 h-5 text-green-500 fill-green-500/20" />
          </div>
          <div>
            <div className="text-muted-foreground text-sm mb-1">
              {exams.length > 0 ? format(new Date(exams[0].date), "d 'de' MMMM", { locale: ptBR }) : 'Envio Recente'}
            </div>
            <div className="font-bold text-lg text-foreground truncate">
              {exams.length > 0 ? (exams[0].fileName || exams[0].name) : 'Enviar novo exame'}
            </div>
            {exams.length > 0 && (
              <span className="text-xs font-bold text-green-500 mt-1 inline-block">Analisado</span>
            )}
          </div>
        </div>
      </div>



      {/* NOVO: Acesso Rápido ao Design Novo (Health Progress) */}
      <Link to="/dashboard/health-progress">
        <div className="mt-4 mb-4 rounded-3xl p-5 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700 shadow-xl flex items-center justify-between cursor-pointer group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="p-3 bg-sky-500/20 rounded-2xl text-sky-400 border border-sky-500/20 shadow-[0_0_15px_rgba(14,165,233,0.3)]">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-sky-500 mb-1 block">NOVO DESIGN</span>
              <h4 className="font-bold text-white text-lg group-hover:text-sky-400 transition-colors">Progresso da Saúde</h4>
              <p className="text-slate-400 text-sm">Visualizar análise detalhada de Vitamina D</p>
            </div>
          </div>
          <ChevronRight className="w-6 h-6 text-slate-500 group-hover:text-white transition-colors" />
        </div>
      </Link>

      {/* Laboratórios Parceiros Banner */}
      <div className="rounded-3xl p-1 bg-card border-none shadow-sm hover:shadow-md transition-all cursor-pointer group">
        <div className="relative rounded-[1.3rem] overflow-hidden bg-gradient-to-r from-slate-900 to-slate-800 p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10 shadow-inner">
              {/* Placeholder for bottle/product image */}
              <div className="w-8 h-12 bg-blue-500/30 rounded-md border border-blue-400/50" />
            </div>
            <div>
              <h4 className="font-bold text-white text-lg group-hover:text-primary transition-colors">Laboratórios Parceiros</h4>
              <p className="text-gray-400 text-sm max-w-[200px] leading-tight mt-1">Agende seus exames com desconto em nossa rede.</p>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
            <ChevronRight className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      <UploadModal
        open={showUploadModal}
        onOpenChange={setShowUploadModal}
        onUploadComplete={refetch}
      />
    </div >
  );
};

export default Index;
