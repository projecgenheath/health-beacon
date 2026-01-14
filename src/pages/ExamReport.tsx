import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, FileText, Calendar, Building2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ExamStatus } from '@/types/exam';

interface ExamDetails {
  id: string;
  file_name: string;
  exam_date: string | null;
  lab_name: string | null;
  upload_date: string;
}

interface ExamResultItem {
  id: string;
  name: string;
  value: number;
  unit: string;
  reference_min: number | null;
  reference_max: number | null;
  status: ExamStatus;
  category: string | null;
}

export default function ExamReport() {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [exam, setExam] = useState<ExamDetails | null>(null);
  const [results, setResults] = useState<ExamResultItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchExamDetails = useCallback(async () => {
    if (!examId) return;

    try {
      // Fetch exam details
      const { data: examData, error: examError } = await supabase
        .from('exams')
        .select('*')
        .eq('id', examId)
        .maybeSingle();

      if (examError) throw examError;
      if (!examData) {
        navigate('/dashboard');
        return;
      }

      setExam(examData);

      // Fetch exam results
      const { data: resultsData, error: resultsError } = await supabase
        .from('exam_results')
        .select('*')
        .eq('exam_id', examId)
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (resultsError) throw resultsError;
      setResults(resultsData as ExamResultItem[] || []);
    } catch (error) {
      console.error('Error fetching exam details:', error);
    } finally {
      setLoading(false);
    }
  }, [examId, navigate]);

  useEffect(() => {
    if (user && examId) {
      fetchExamDetails();
    }
  }, [user, examId, fetchExamDetails]);

  const getStatusConfig = (status: ExamStatus) => {
    const configs = {
      healthy: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', label: 'Normal' },
      warning: { bg: 'bg-amber-500/10', text: 'text-amber-500', label: 'Atenção' },
      danger: { bg: 'bg-red-500/10', text: 'text-red-500', label: 'Crítico' },
    };
    return configs[status];
  };

  const generatePDF = () => {
    // Create printable content
    const printContent = document.getElementById('report-content');
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Relatório de Exame - ${exam?.file_name || 'Exame'}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              padding: 40px;
              color: #1a1a1a;
            }
            h1 { font-size: 24px; margin-bottom: 8px; }
            h2 { font-size: 18px; margin-top: 24px; margin-bottom: 16px; color: #444; }
            .info { color: #666; margin-bottom: 4px; font-size: 14px; }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-top: 16px;
              font-size: 13px;
            }
            th, td { 
              padding: 12px; 
              text-align: left; 
              border-bottom: 1px solid #e5e5e5; 
            }
            th { 
              background: #f5f5f5; 
              font-weight: 600;
            }
            .status-healthy { color: #10b981; }
            .status-warning { color: #f59e0b; }
            .status-danger { color: #ef4444; }
            .category { 
              background: #f8f8f8; 
              font-weight: 600; 
              padding: 8px 12px;
              margin-top: 16px;
            }
            @media print {
              body { padding: 20px; }
            }
          </style>
        </head>
        <body>
          <h1>Relatório de Exame</h1>
          <p class="info"><strong>Arquivo:</strong> ${exam?.file_name || '-'}</p>
          <p class="info"><strong>Data do exame:</strong> ${exam?.exam_date ? format(new Date(exam.exam_date), "d 'de' MMMM 'de' yyyy", { locale: ptBR }) : '-'}</p>
          <p class="info"><strong>Laboratório:</strong> ${exam?.lab_name || '-'}</p>
          <p class="info"><strong>Upload:</strong> ${exam?.upload_date ? format(new Date(exam.upload_date), "d 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR }) : '-'}</p>
          
          <h2>Resultados (${results.length} exames)</h2>
          <table>
            <thead>
              <tr>
                <th>Exame</th>
                <th>Resultado</th>
                <th>Referência</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${results.map(r => `
                <tr>
                  <td>
                    <div>${r.name}</div>
                    <div style="font-size: 11px; color: #888;">${r.category || 'Geral'}</div>
                  </td>
                  <td><strong>${r.value}</strong> ${r.unit}</td>
                  <td>${r.reference_min ?? '-'} - ${r.reference_max ?? '-'} ${r.unit}</td>
                  <td class="status-${r.status}">${getStatusConfig(r.status).label}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Exame não encontrado.</p>
      </div>
    );
  }

  // Group results by category
  const groupedResults = results.reduce((acc, result) => {
    const category = result.category || 'Geral';
    if (!acc[category]) acc[category] = [];
    acc[category].push(result);
    return acc;
  }, {} as Record<string, ExamResultItem[]>);

  const summaryStats = {
    total: results.length,
    healthy: results.filter(r => r.status === 'healthy').length,
    warning: results.filter(r => r.status === 'warning').length,
    danger: results.filter(r => r.status === 'danger').length,
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>

          <Button onClick={generatePDF} className="gap-2">
            <Download className="h-4 w-4" />
            Baixar PDF
          </Button>
        </div>

        <div id="report-content">
          {/* Exam Info Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {exam.file_name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm">
                    {exam.exam_date
                      ? format(new Date(exam.exam_date), "d 'de' MMMM 'de' yyyy", { locale: ptBR })
                      : 'Data não informada'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Building2 className="h-4 w-4" />
                  <span className="text-sm">{exam.lab_name || 'Laboratório não informado'}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  Upload: {format(new Date(exam.upload_date), "d MMM yyyy 'às' HH:mm", { locale: ptBR })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-foreground">{summaryStats.total}</div>
                <div className="text-sm text-muted-foreground">Total de exames</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-emerald-500">{summaryStats.healthy}</div>
                <div className="text-sm text-muted-foreground">Normais</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-amber-500">{summaryStats.warning}</div>
                <div className="text-sm text-muted-foreground">Atenção</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-red-500">{summaryStats.danger}</div>
                <div className="text-sm text-muted-foreground">Críticos</div>
              </CardContent>
            </Card>
          </div>

          {/* Results Table */}
          <Card>
            <CardHeader>
              <CardTitle>Resultados dos Exames</CardTitle>
            </CardHeader>
            <CardContent>
              {Object.entries(groupedResults).map(([category, categoryResults]) => (
                <div key={category} className="mb-6 last:mb-0">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    {category}
                  </h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Exame</TableHead>
                        <TableHead>Resultado</TableHead>
                        <TableHead>Referência</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categoryResults.map((result) => {
                        const config = getStatusConfig(result.status);
                        return (
                          <TableRow key={result.id}>
                            <TableCell className="font-medium">{result.name}</TableCell>
                            <TableCell>
                              <span className="font-semibold">{result.value}</span>{' '}
                              <span className="text-muted-foreground">{result.unit}</span>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {result.reference_min ?? '-'} - {result.reference_max ?? '-'} {result.unit}
                            </TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
                                {config.label}
                              </span>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ))}

              {results.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum resultado encontrado para este exame.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
