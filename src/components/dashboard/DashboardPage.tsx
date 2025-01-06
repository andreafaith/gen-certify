import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../auth/AuthProvider';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { DashboardLayout } from '../layout/DashboardLayout';

interface Template {
  id: string;
  name: string;
}

interface Certificate {
  id: string;
  title: string;
  recipient_name: string;
  issue_date: string;
  created_at: string;
  template: Template;
}

interface Stats {
  totalCertificates: number;
  totalTemplates: number;
}

export function DashboardPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [recentCertificates, setRecentCertificates] = useState<Certificate[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalCertificates: 0,
    totalTemplates: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.user) {
      navigate('/login');
      return;
    }

    fetchDashboardData();
  }, [session]);

  const fetchDashboardData = async () => {
    try {
      const userId = session?.user?.id;

      // Check if certificates table exists
      const { error: tableCheckError } = await supabase
        .from('certificates')
        .select('id')
        .limit(1);

      if (tableCheckError) {
        console.error('Certificates table not ready:', tableCheckError);
        setError('Certificate system is being set up. Please try again later.');
        setStats({
          totalCertificates: 0,
          totalTemplates: 0,
        });
        return;
      }

      // Fetch recent certificates
      const { data: certificates, error: certError } = await supabase
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
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (certError) throw certError;

      const formattedCertificates = certificates?.map(cert => ({
        id: cert.id,
        title: cert.title,
        recipient_name: cert.recipient_name,
        issue_date: cert.issue_date,
        created_at: cert.created_at,
        template: cert.template || { id: '', name: 'Unknown Template' }
      })) || [];

      setRecentCertificates(formattedCertificates);

      // Fetch total counts
      const [certCount, templateCount] = await Promise.all([
        supabase
          .from('certificates')
          .select('id', { count: 'exact' })
          .eq('user_id', userId),
        supabase
          .from('templates')
          .select('id', { count: 'exact' })
          .eq('user_id', userId),
      ]);

      setStats({
        totalCertificates: certCount.count || 0,
        totalTemplates: templateCount.count || 0,
      });
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <div className="space-x-4">
            <Button
              onClick={() => navigate('/dashboard/templates/new')}
              variant="primary"
            >
              Create Template
            </Button>
            <Button
              onClick={() => navigate('/dashboard/certificates/new')}
              variant="primary"
            >
              Create Certificate
            </Button>
          </div>
        </div>

        {error && (
          <div className="mt-4 bg-red-50 text-red-700 p-4 rounded-md">
            {error}
          </div>
        )}

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card>
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">
                Total Certificates
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                {stats.totalCertificates}
              </dd>
            </div>
          </Card>

          <Card>
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">
                Total Templates
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                {stats.totalTemplates}
              </dd>
            </div>
          </Card>
        </div>

        <div className="mt-8">
          <h2 className="text-lg font-medium text-gray-900">Recent Certificates</h2>
          <div className="mt-4">
            {loading ? (
              <p>Loading...</p>
            ) : recentCertificates.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {recentCertificates.map((certificate) => (
                  <li key={certificate.id} className="py-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
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
                      <div>
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
            ) : (
              <p className="text-gray-500">No certificates created yet</p>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
