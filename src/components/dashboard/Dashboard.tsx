import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../auth/AuthProvider';
import { Button } from '../ui/Button';

interface DashboardStats {
  templateCount: number;
  certificateCount: number;
  recentTemplates: Array<{
    id: string;
    name: string;
    created_at: string;
  }>;
  recentCertificates: Array<{
    id: string;
    recipient_name: string;
    template_name: string;
    created_at: string;
  }>;
}

export function Dashboard() {
  const navigate = useNavigate();
  const auth = useAuth();

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      if (!auth.session?.user) throw new Error('Not authenticated');

      const [
        { count: templateCount },
        { count: certificateCount },
        { data: recentTemplates },
        { data: recentCertificates },
      ] = await Promise.all([
        supabase
          .from('templates')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', auth.session.user.id),
        supabase
          .from('certificates')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', auth.session.user.id),
        supabase
          .from('templates')
          .select('id, name, created_at')
          .eq('user_id', auth.session.user.id)
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('certificates')
          .select(\`
            id,
            recipient_name,
            templates:template_id (
              name
            ),
            created_at
          \`)
          .eq('user_id', auth.session.user.id)
          .order('created_at', { ascending: false })
          .limit(5),
      ]);

      return {
        templateCount: templateCount || 0,
        certificateCount: certificateCount || 0,
        recentTemplates: recentTemplates || [],
        recentCertificates: recentCertificates || [],
      };
    },
    enabled: !!auth.session?.user,
  });

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 sm:px-0">
        <h1 className="text-2xl font-bold text-gray-900">Welcome to Certificate Generator</h1>
        <p className="mt-2 text-sm text-gray-600">
          Get started by creating a new template or generating certificates from existing templates.
        </p>

        {/* Quick Actions */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-500 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <div>
              <span className="rounded-lg inline-flex p-3 bg-indigo-50 text-indigo-700 ring-4 ring-white">
                {/* Template Icon */}
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                </svg>
              </span>
            </div>
            <div className="mt-4">
              <h3 className="text-lg font-medium">
                <Button
                  onClick={() => navigate('/dashboard/templates/new')}
                  className="focus:outline-none"
                >
                  <span className="absolute inset-0" aria-hidden="true" />
                  Create New Template
                </Button>
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                Design a new certificate template with our easy-to-use editor
              </p>
            </div>
          </div>

          <div className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-500 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <div>
              <span className="rounded-lg inline-flex p-3 bg-indigo-50 text-indigo-700 ring-4 ring-white">
                {/* Certificate Icon */}
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </span>
            </div>
            <div className="mt-4">
              <h3 className="text-lg font-medium">
                <Button
                  onClick={() => navigate('/dashboard/certificates/generate')}
                  className="focus:outline-none"
                >
                  <span className="absolute inset-0" aria-hidden="true" />
                  Generate Certificates
                </Button>
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                Create certificates using your existing templates
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Templates</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {isLoading ? '...' : stats?.templateCount}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Certificates</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {isLoading ? '...' : stats?.certificateCount}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Recent Templates */}
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Recent Templates</h3>
              <div className="mt-5">
                <div className="flow-root">
                  <ul role="list" className="-mb-8">
                    {stats?.recentTemplates.map((template, idx) => (
                      <li key={template.id}>
                        <div className="relative pb-8">
                          {idx !== stats.recentTemplates.length - 1 && (
                            <span className="absolute left-5 top-5 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                          )}
                          <div className="relative flex items-start space-x-3">
                            <div className="relative">
                              <span className="h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center ring-8 ring-white">
                                <svg className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5z" />
                                </svg>
                              </span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <div>
                                <div className="text-sm">
                                  <a
                                    href={`/dashboard/templates/${template.id}`}
                                    className="font-medium text-gray-900 hover:text-indigo-600"
                                  >
                                    {template.name}
                                  </a>
                                </div>
                                <p className="mt-0.5 text-sm text-gray-500">
                                  Created {new Date(template.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-6">
                  <Button
                    onClick={() => navigate('/dashboard/templates')}
                    variant="secondary"
                    className="w-full"
                  >
                    View All Templates
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Certificates */}
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Recent Certificates</h3>
              <div className="mt-5">
                <div className="flow-root">
                  <ul role="list" className="-mb-8">
                    {stats?.recentCertificates.map((certificate, idx) => (
                      <li key={certificate.id}>
                        <div className="relative pb-8">
                          {idx !== stats.recentCertificates.length - 1 && (
                            <span className="absolute left-5 top-5 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                          )}
                          <div className="relative flex items-start space-x-3">
                            <div className="relative">
                              <span className="h-10 w-10 rounded-full bg-green-50 flex items-center justify-center ring-8 ring-white">
                                <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                </svg>
                              </span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <div>
                                <div className="text-sm">
                                  <a
                                    href={`/dashboard/certificates/${certificate.id}`}
                                    className="font-medium text-gray-900 hover:text-indigo-600"
                                  >
                                    {certificate.recipient_name}
                                  </a>
                                </div>
                                <p className="mt-0.5 text-sm text-gray-500">
                                  Template: {certificate.template_name}
                                </p>
                                <p className="mt-0.5 text-sm text-gray-500">
                                  Generated {new Date(certificate.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-6">
                  <Button
                    onClick={() => navigate('/dashboard/certificates')}
                    variant="secondary"
                    className="w-full"
                  >
                    View All Certificates
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
