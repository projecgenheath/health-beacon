import { useState } from 'react';
import { FileDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ExamResult, HealthSummary } from '@/types/exam';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ExportPDFButtonProps {
  exams: ExamResult[];
  summary: HealthSummary;
  userName?: string;
}

export const ExportPDFButton = ({ exams, summary, userName }: ExportPDFButtonProps) => {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (exams.length === 0) {
      toast.error('Nenhum exame para exportar');
      return;
    }

    setExporting(true);

    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 20;
      let yPos = 20;

      // Header
      pdf.setFontSize(24);
      pdf.setTextColor(20, 184, 166); // Primary Teal color
      pdf.text('BHB - Biomedical Health Bank', margin, yPos);

      yPos += 10;
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text('Relatório de Exames', margin, yPos);

      // User info and date
      yPos += 15;
      pdf.setFontSize(12);
      pdf.setTextColor(50, 50, 50);
      if (userName) {
        pdf.text(`Paciente: ${userName}`, margin, yPos);
        yPos += 7;
      }
      pdf.text(`Data do relatório: ${format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`, margin, yPos);

      // Summary section
      yPos += 15;
      pdf.setFontSize(14);
      pdf.setTextColor(0, 0, 0);
      pdf.text('Resumo da Saúde', margin, yPos);

      yPos += 10;
      pdf.setFontSize(11);

      // Summary boxes
      const boxWidth = (pageWidth - margin * 2 - 20) / 3;

      // Healthy box
      pdf.setFillColor(236, 253, 245);
      pdf.setDrawColor(34, 197, 94);
      pdf.roundedRect(margin, yPos, boxWidth, 25, 3, 3, 'FD');
      pdf.setTextColor(22, 163, 74);
      pdf.text(`${summary.healthy}`, margin + boxWidth / 2, yPos + 10, { align: 'center' });
      pdf.setFontSize(9);
      pdf.text('Normal', margin + boxWidth / 2, yPos + 18, { align: 'center' });

      // Warning box
      pdf.setFillColor(255, 251, 235);
      pdf.setDrawColor(245, 158, 11);
      pdf.roundedRect(margin + boxWidth + 10, yPos, boxWidth, 25, 3, 3, 'FD');
      pdf.setTextColor(217, 119, 6);
      pdf.setFontSize(11);
      pdf.text(`${summary.warning}`, margin + boxWidth + 10 + boxWidth / 2, yPos + 10, { align: 'center' });
      pdf.setFontSize(9);
      pdf.text('Atenção', margin + boxWidth + 10 + boxWidth / 2, yPos + 18, { align: 'center' });

      // Danger box
      pdf.setFillColor(254, 242, 242);
      pdf.setDrawColor(239, 68, 68);
      pdf.roundedRect(margin + (boxWidth + 10) * 2, yPos, boxWidth, 25, 3, 3, 'FD');
      pdf.setTextColor(220, 38, 38);
      pdf.setFontSize(11);
      pdf.text(`${summary.danger}`, margin + (boxWidth + 10) * 2 + boxWidth / 2, yPos + 10, { align: 'center' });
      pdf.setFontSize(9);
      pdf.text('Alterado', margin + (boxWidth + 10) * 2 + boxWidth / 2, yPos + 18, { align: 'center' });

      // Exams list
      yPos += 40;
      pdf.setFontSize(14);
      pdf.setTextColor(0, 0, 0);
      pdf.text('Resultados dos Exames', margin, yPos);

      yPos += 10;

      // Table header
      pdf.setFillColor(248, 250, 252);
      pdf.rect(margin, yPos, pageWidth - margin * 2, 10, 'F');
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text('Exame', margin + 5, yPos + 7);
      pdf.text('Valor', margin + 70, yPos + 7);
      pdf.text('Referência', margin + 100, yPos + 7);
      pdf.text('Status', margin + 140, yPos + 7);

      yPos += 12;

      // Group exams by category
      const examsByCategory = exams.reduce((acc, exam) => {
        const cat = exam.category || 'Geral';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(exam);
        return acc;
      }, {} as Record<string, ExamResult[]>);

      for (const [category, categoryExams] of Object.entries(examsByCategory)) {
        // Check if we need a new page
        if (yPos > 270) {
          pdf.addPage();
          yPos = 20;
        }

        // Category header
        pdf.setFillColor(240, 253, 250);
        pdf.rect(margin, yPos, pageWidth - margin * 2, 8, 'F');
        pdf.setFontSize(10);
        pdf.setTextColor(0, 150, 136);
        pdf.text(category, margin + 5, yPos + 6);
        yPos += 12;

        for (const exam of categoryExams) {
          if (yPos > 280) {
            pdf.addPage();
            yPos = 20;
          }

          pdf.setFontSize(10);
          pdf.setTextColor(50, 50, 50);
          pdf.text(exam.name.substring(0, 25), margin + 5, yPos);
          pdf.text(`${exam.value} ${exam.unit}`, margin + 70, yPos);
          pdf.text(`${exam.referenceMin}-${exam.referenceMax}`, margin + 100, yPos);

          // Status with color
          const statusText = exam.status === 'healthy' ? 'Normal' : exam.status === 'warning' ? 'Atenção' : 'Alterado';
          if (exam.status === 'healthy') pdf.setTextColor(22, 163, 74);
          else if (exam.status === 'warning') pdf.setTextColor(217, 119, 6);
          else pdf.setTextColor(220, 38, 38);
          pdf.text(statusText, margin + 140, yPos);

          yPos += 8;
        }

        yPos += 5;
      }

      // Footer
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text(
        `Generated by BHB - Biomedical Health Bank`,
        pageWidth / 2,
        pdf.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );

      // Save the PDF
      pdf.save(`meuexame-relatorio-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      toast.success('Relatório exportado com sucesso!');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Erro ao exportar relatório');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={exporting || exams.length === 0}
      className="gap-2"
    >
      {exporting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <FileDown className="h-4 w-4" />
      )}
      Exportar PDF
    </Button>
  );
};
