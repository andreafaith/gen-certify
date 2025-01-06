import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../auth/AuthProvider';
import { Button } from '../ui/Button';
import { CertificateGeneration } from './CertificateGeneration';
import { OutputFormat } from '../../services/certificateGenerator';

interface Certificate {
  id: string;
  title: string;
  recipient_name: string;
  issue_date: string;
  created_at: string;
  template: {
    id: string;
    name: string;
    content: any;
  };
}

export function CertificateView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { session } = useAuth();
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showGeneration, setShowGeneration] = useState(false);
  const [generatedBlobs, setGeneratedBlobs] = useState<Blob[]>([]);

  useEffect(() => {
    if (!session?.user) {
      navigate('/login');
      return;
    }

    fetchCertificate();
  }, [session, id]);

  const fetchCertificate = async () => {
    try {
      if (!session?.user) throw new Error('Not authenticated');
      if (!id) throw new Error('No certificate ID provided');

      console.log('Fetching certificate:', { 
        certificateId: id, 
        userId: session.user.id 
      });

      // First check if certificate exists
      const { data: checkData, error: checkError } = await supabase
        .from('certificates')
        .select('id, user_id')
        .eq('id', id)
        .maybeSingle();

      console.log('Certificate check result:', { checkData, checkError });

      if (checkError) {
        console.error('Error checking certificate:', checkError);
        throw new Error(`Failed to check certificate: ${checkError.message}`);
      }

      if (!checkData) {
        console.log('Certificate not found with ID:', id);
        throw new Error('Certificate not found');
      }

      if (checkData.user_id !== session.user.id) {
        console.log('Certificate belongs to different user:', {
          certificateUserId: checkData.user_id,
          currentUserId: session.user.id
        });
        throw new Error('You do not have permission to view this certificate');
      }

      // Now fetch full certificate data
      const { data, error: fetchError } = await supabase
        .from('certificates')
        .select(`
          id,
          title,
          recipient_name,
          issue_date,
          created_at,
          template:template_id (
            id,
            name,
            design_data
          )
        `)
        .eq('id', id)
        .single();

      console.log('Certificate fetch result:', { data, fetchError });

      if (fetchError) {
        console.error('Error fetching certificate details:', fetchError);
        throw fetchError;
      }

      if (!data) {
        throw new Error('Certificate details not found');
      }

      if (!data.template) {
        throw new Error('Certificate template not found');
      }

      setCertificate({
        ...data,
        template: {
          ...data.template,
          content: data.template.design_data
        }
      });
    } catch (err) {
      console.error('Error in fetchCertificate:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch certificate');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerationComplete = (blobs: Blob[]) => {
    setGeneratedBlobs(blobs);
    setShowGeneration(false);
  };

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  if (error || !certificate) {
    return (
      <div className="p-4 text-red-600">
        {error || 'Certificate not found'}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{certificate.title}</h1>
        <Button onClick={() => setShowGeneration(true)}>
          Generate Certificate
        </Button>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">Recipient</dt>
            <dd className="mt-1 text-lg">{certificate.recipient_name}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Issue Date</dt>
            <dd className="mt-1 text-lg">{new Date(certificate.issue_date).toLocaleDateString()}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Template</dt>
            <dd className="mt-1 text-lg">{certificate.template.name}</dd>
          </div>
        </dl>
      </div>

      {showGeneration && (
        <div className="mt-6">
          <CertificateGeneration
            templateData={certificate.template.content}
            recipientData={[{
              name: certificate.recipient_name,
              date: certificate.issue_date,
              title: certificate.title
            }]}
            onComplete={handleGenerationComplete}
          />
        </div>
      )}

      {generatedBlobs.length > 0 && (
        <div className="mt-6 p-4 bg-green-50 rounded-lg">
          <p className="text-green-700">
            Certificate generated successfully! Click the button below to download.
          </p>
          <Button
            onClick={() => {
              const link = document.createElement('a');
              link.href = URL.createObjectURL(generatedBlobs[0]);
              link.download = `${certificate.title}_${certificate.recipient_name}.pdf`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            className="mt-4"
          >
            Download Certificate
          </Button>
        </div>
      )}
    </div>
  );
}
