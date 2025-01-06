import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../auth/AuthProvider';
import { Button } from '../ui/Button';
import { DashboardLayout } from '../layout/DashboardLayout';

interface Certificate {
  id: string;
  title: string;
  recipient_name: string;
  issue_date: string;
  created_at: string;
  template: {
    id: string;
    name: string;
  };
}

export function CertificatesPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.user) {
      navigate('/login');
      return;
    }

    fetchCertificates();
  }, [session]);

  const fetchCertificates = async () => {
    try {
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
            name
          )
        `)
        .eq('user_id', session?.user?.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setCertificates(data || []);
    } catch (err) {
      console.error('Error fetching certificates:', err);
      setError('Failed to load certificates');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">Certificates</h1>
          <Button
            onClick={() => navigate('/dashboard/certificates/new')}
            variant="primary"
          >
            Create Certificate
          </Button>
        </div>

        {error && (
          <div className="mt-4 bg-red-50 text-red-700 p-4 rounded-md">
            {error}
          </div>
        )}

        <div className="mt-8">
          {loading ? (
            <p>Loading...</p>
          ) : certificates.length > 0 ? (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {certificates.map((certificate) => (
                  <li key={certificate.id}>
                    <div className="px-4 py-4 flex items-center justify-between sm:px-6">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-indigo-600 truncate">
                          {certificate.title}
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                          Recipient: {certificate.recipient_name}
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                          Template: {certificate.template?.name || 'Unknown Template'}
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                          Issued: {new Date(certificate.issue_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        <Button
                          onClick={() => navigate(`/dashboard/certificates/${certificate.id}`)}
                          variant="secondary"
                          size="sm"
                        >
                          View
                        </Button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-gray-500">No certificates found</p>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
