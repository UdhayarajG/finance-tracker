import { Button } from '@/components/ui/button';
import { Download, FileText, Sheet } from 'lucide-react';
import { toast } from 'sonner';

interface ExportButtonsProps {
  onExportCSV: () => Promise<void>;
  onExportPDF: () => Promise<void>;
  isLoading?: boolean;
  label?: string;
}

export function ExportButtons({
  onExportCSV,
  onExportPDF,
  isLoading = false,
  label = 'Export',
}: ExportButtonsProps) {
  const handleExportCSV = async () => {
    try {
      await onExportCSV();
      toast.success('CSV exported successfully');
    } catch (error) {
      toast.error('Failed to export CSV');
      console.error('CSV export error:', error);
    }
  };

  const handleExportPDF = async () => {
    try {
      await onExportPDF();
      toast.success('PDF exported successfully');
    } catch (error) {
      toast.error('Failed to export PDF');
      console.error('PDF export error:', error);
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleExportCSV}
        disabled={isLoading}
        className="gap-2"
      >
        <Sheet className="w-4 h-4" />
        {label} CSV
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleExportPDF}
        disabled={isLoading}
        className="gap-2"
      >
        <FileText className="w-4 h-4" />
        {label} PDF
      </Button>
    </div>
  );
}

/**
 * Utility function to trigger file download
 */
export function downloadFile(content: string | Blob, filename: string, mimeType: string) {
  const blob = typeof content === 'string' ? new Blob([content], { type: mimeType }) : content;
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
