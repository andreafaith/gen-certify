import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import pptxgen from 'pptxgenjs';
import { saveAs } from 'file-saver';

export type OutputFormat = 'pdf' | 'docx' | 'ppt';
export type QualitySettings = {
  dpi: number;
  imageQuality: number;
  fontQuality: 'normal' | 'high';
};

export type GenerationProgress = {
  current: number;
  total: number;
  status: string;
};

export type GenerationOptions = {
  format: OutputFormat;
  batchSize: number;
  quality: QualitySettings;
  onProgress?: (progress: GenerationProgress) => void;
};

export class CertificateGenerator {
  private defaultQuality: QualitySettings = {
    dpi: 300,
    imageQuality: 0.92,
    fontQuality: 'normal',
  };

  async generateCertificate(
    templateData: any,
    recipientData: any[],
    options: GenerationOptions
  ): Promise<Blob[]> {
    const { format, batchSize, quality, onProgress } = options;
    const results: Blob[] = [];
    const totalCertificates = recipientData.length;
    let processedCount = 0;

    // Process in batches
    for (let i = 0; i < totalCertificates; i += batchSize) {
      const batch = recipientData.slice(i, i + batchSize);
      
      for (const recipient of batch) {
        try {
          const blob = await this.generateSingleCertificate(
            templateData,
            recipient,
            format,
            quality || this.defaultQuality
          );
          results.push(blob);
          processedCount++;

          if (onProgress) {
            onProgress({
              current: processedCount,
              total: totalCertificates,
              status: `Generating certificate ${processedCount} of ${totalCertificates}`,
            });
          }
        } catch (error) {
          console.error('Error generating certificate:', error);
          throw error;
        }
      }
    }

    return results;
  }

  private async generateSingleCertificate(
    templateData: any,
    recipientData: any,
    format: OutputFormat,
    quality: QualitySettings
  ): Promise<Blob> {
    switch (format) {
      case 'pdf':
        return this.generatePDF(templateData, recipientData, quality);
      case 'docx':
        return this.generateDOCX(templateData, recipientData, quality);
      case 'ppt':
        return this.generatePPT(templateData, recipientData, quality);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  private async generatePDF(
    templateData: any,
    recipientData: any,
    quality: QualitySettings
  ): Promise<Blob> {
    const doc = new jsPDF({
      orientation: templateData.orientation || 'landscape',
      unit: 'mm',
    });

    // Set PDF quality
    doc.setProperties({
      title: `Certificate - ${recipientData.name}`,
      creator: 'Certificate Generator',
    });

    // Add content based on template
    // TODO: Implement actual template rendering
    doc.setFontSize(40);
    doc.text('Certificate of Achievement', 105, 80, { align: 'center' });
    doc.setFontSize(20);
    doc.text(recipientData.name, 105, 120, { align: 'center' });

    return doc.output('blob');
  }

  private async generateDOCX(
    templateData: any,
    recipientData: any,
    quality: QualitySettings
  ): Promise<Blob> {
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: 'Certificate of Achievement',
                size: 40,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: recipientData.name,
                size: 20,
              }),
            ],
          }),
        ],
      }],
    });

    return await Packer.toBlob(doc);
  }

  private async generatePPT(
    templateData: any,
    recipientData: any,
    quality: QualitySettings
  ): Promise<Blob> {
    const pres = new pptxgen();
    const slide = pres.addSlide();

    // Add content based on template
    slide.addText('Certificate of Achievement', {
      x: 1,
      y: 1,
      w: '80%',
      h: 1,
      fontSize: 40,
      align: 'center',
    });

    slide.addText(recipientData.name, {
      x: 1,
      y: 2,
      w: '80%',
      h: 1,
      fontSize: 20,
      align: 'center',
    });

    return await pres.writeFile({ outputType: 'blob' });
  }

  downloadCertificate(blob: Blob, filename: string, format: OutputFormat) {
    const extension = format === 'pdf' ? 'pdf' : format === 'docx' ? 'docx' : 'pptx';
    saveAs(blob, `${filename}.${extension}`);
  }
}

export const certificateGenerator = new CertificateGenerator();
