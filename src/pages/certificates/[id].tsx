import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSupabase } from '@/lib/supabase/supabase-provider';
import { CsvUpload } from '@/components/certificates/CsvUpload';
import { CertificatePreview } from '@/components/certificates/CertificatePreview';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/Toast';

interface CertificateData {
  [key: string]: string;
}

export default function CertificatePage() {
  const router = useRouter();
  const { id } = router.query;
  const { supabase } = useSupabase();
  const { toast } = useToast();
  const [template, setTemplate] = useState<any>(null);
  const [certificateData, setCertificateData] = useState<CertificateData[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [settings, setSettings] = useState({
    outputFormat: 'PDF',
    batchSize: 10,
    dpi: 300,
    imageQuality: 92
  });

  useEffect(() => {
    if (id) {
      loadTemplate();
    }
  }, [id]);

  const loadTemplate = async () => {
    try {
      const { data: template, error } = await supabase
        .from('templates')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setTemplate(template);
    } catch (error) {
      console.error('Error loading template:', error);
      toast({
        title: 'Error',
        description: 'Failed to load template',
        variant: 'destructive'
      });
    }
  };

  const handleDataLoaded = (data: CertificateData[]) => {
    setCertificateData(data);
  };

  const generateCertificates = async () => {
    if (!certificateData.length) {
      toast({
        title: 'Error',
        description: 'Please upload recipient data first',
        variant: 'destructive'
      });
      return;
    }

    setIsGenerating(true);
    try {
      // Here you'll implement the actual certificate generation
      // This will involve:
      // 1. Sending the template, data, and settings to your backend
      // 2. Processing the certificates in batches
      // 3. Returning download links or triggering downloads

      const response = await fetch('/api/certificates/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateId: id,
          data: certificateData,
          settings
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate certificates');
      }

      const result = await response.json();
      
      toast({
        title: 'Success',
        description: `Generated ${certificateData.length} certificates`
      });

      // Handle the download or next steps based on your implementation
      
    } catch (error) {
      console.error('Error generating certificates:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate certificates',
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  if (!template) {
    return <div>Loading...</div>;
  }

  // Extract dynamic fields from template
  const templateFields = template.design_data?.elements
    ?.filter((element: any) => element.type === 'dynamic')
    ?.map((element: any) => element.content.replace(/[{}]/g, '')) || [];

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{template.name}</h1>
        <Button
          onClick={generateCertificates}
          disabled={isGenerating || !certificateData.length}
        >
          {isGenerating ? 'Generating...' : 'Generate Certificate'}
        </Button>
      </div>

      {/* Preview Section */}
      <div className="border rounded-lg p-4 bg-gray-50">
        <h2 className="text-xl font-semibold mb-4">Preview</h2>
        <CertificatePreview 
          template={template}
          data={certificateData[0] || {}}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Recipient</h2>
            <Input
              placeholder="Enter recipient name"
              value={certificateData[0]?.recipient || ''}
              onChange={(e) => 
                setCertificateData([{ ...certificateData[0], recipient: e.target.value }])
              }
            />
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Issue Date</h2>
            <Input
              type="date"
              value={certificateData[0]?.issueDate || new Date().toISOString().split('T')[0]}
              onChange={(e) =>
                setCertificateData([{ ...certificateData[0], issueDate: e.target.value }])
              }
            />
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Template</h2>
            <Input
              value={template.name}
              disabled
            />
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Generation Settings</h2>
          
          <div className="space-y-4">
            <label className="block">
              <span className="text-sm font-medium">Output Format</span>
              <select
                className="mt-1 block w-full rounded-md border-gray-300"
                value={settings.outputFormat}
                onChange={(e) => setSettings({ ...settings, outputFormat: e.target.value })}
              >
                <option value="PDF">PDF</option>
                <option value="PNG">PNG</option>
                <option value="JPG">JPG</option>
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-medium">Batch Size</span>
              <Input
                type="number"
                min="1"
                max="100"
                value={settings.batchSize}
                onChange={(e) => setSettings({ ...settings, batchSize: parseInt(e.target.value) })}
              />
              <span className="text-xs text-gray-500">
                Number of certificates to generate in each batch (1-100)
              </span>
            </label>

            <div className="space-y-2">
              <h3 className="text-sm font-medium">Quality Settings</h3>
              
              <label className="block">
                <span className="text-sm">DPI</span>
                <Input
                  type="number"
                  min="72"
                  max="600"
                  value={settings.dpi}
                  onChange={(e) => setSettings({ ...settings, dpi: parseInt(e.target.value) })}
                />
              </label>

              <label className="block">
                <span className="text-sm">Image Quality</span>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={settings.imageQuality}
                  onChange={(e) => setSettings({ ...settings, imageQuality: parseInt(e.target.value) })}
                  className="w-full"
                />
                <span className="text-xs text-gray-500">{settings.imageQuality}%</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Bulk Upload</h2>
        <CsvUpload
          onDataLoaded={handleDataLoaded}
          templateFields={templateFields}
        />
      </div>
    </div>
  );
}
