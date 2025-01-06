import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { Checkbox } from '../ui/Checkbox';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import {
  PlusIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  ArrowsUpDownIcon,
} from '@heroicons/react/24/outline';

interface Certificate {
  id: string;
  title: string;
  recipient_name: string;
  issue_date: string;
  status: 'draft' | 'issued' | 'revoked';
  created_at: string;
  template: {
    id: string;
    name: string;
  };
}

type SortField = 'title' | 'recipient_name' | 'issue_date' | 'status' | 'created_at';
type SortDirection = 'asc' | 'desc';

export function CertificateList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedCertificates, setSelectedCertificates] = useState<string[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Fetch certificates
  const { data: certificates = [], isLoading } = useQuery({
    queryKey: ['certificates', sortField, sortDirection],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('certificates')
        .select(`
          id,
          title,
          recipient_name,
          issue_date,
          status,
          created_at,
          template:template_id (
            id,
            name
          )
        `)
        .eq('user_id', user.id)
        .order(sortField, { ascending: sortDirection === 'asc' });

      if (error) throw error;
      return data as Certificate[];
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (certificateIds: string[]) => {
      const { error } = await supabase
        .from('certificates')
        .delete()
        .in('id', certificateIds);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificates'] });
      setSelectedCertificates([]);
      setIsDeleteDialogOpen(false);
    },
  });

  // Filtered certificates
  const filteredCertificates = certificates.filter(cert =>
    cert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cert.recipient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cert.template.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle bulk selection
  const handleSelectAll = () => {
    if (selectedCertificates.length === filteredCertificates.length) {
      setSelectedCertificates([]);
    } else {
      setSelectedCertificates(filteredCertificates.map(cert => cert.id));
    }
  };

  const handleSelectCertificate = (certId: string) => {
    setSelectedCertificates(prev =>
      prev.includes(certId)
        ? prev.filter(id => id !== certId)
        : [...prev, certId]
    );
  };

  // Handle bulk actions
  const handleBulkDelete = async () => {
    if (selectedCertificates.length === 0) return;
    setIsDeleteDialogOpen(true);
  };

  const handleBulkDownload = () => {
    // TODO: Implement bulk download functionality
    console.log('Downloading certificates:', selectedCertificates);
  };

  const getStatusColor = (status: Certificate['status']) => {
    switch (status) {
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'issued':
        return 'bg-green-100 text-green-800';
      case 'revoked':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading certificates...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold">Certificates</h2>
        <Button onClick={() => navigate('/dashboard/certificates/new')}>
          <PlusIcon className="h-5 w-5 mr-2" />
          New Certificate
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Input
            type="text"
            placeholder="Search certificates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
        </div>

        {/* Sort Controls */}
        <div className="flex gap-2">
          <select
            value={`${sortField}-${sortDirection}`}
            onChange={(e) => {
              const [field, direction] = e.target.value.split('-') as [SortField, SortDirection];
              setSortField(field);
              setSortDirection(direction);
            }}
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            <option value="title-asc">Title (A-Z)</option>
            <option value="title-desc">Title (Z-A)</option>
            <option value="recipient_name-asc">Recipient (A-Z)</option>
            <option value="recipient_name-desc">Recipient (Z-A)</option>
            <option value="issue_date-desc">Issue Date (Newest)</option>
            <option value="issue_date-asc">Issue Date (Oldest)</option>
            <option value="status-asc">Status (A-Z)</option>
            <option value="status-desc">Status (Z-A)</option>
            <option value="created_at-desc">Created (Newest)</option>
            <option value="created_at-asc">Created (Oldest)</option>
          </select>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedCertificates.length > 0 && (
        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
          <span className="text-sm text-gray-600">
            {selectedCertificates.length} selected
          </span>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={handleBulkDownload}
            >
              <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
              Download
            </Button>
            <Button
              variant="danger"
              onClick={handleBulkDelete}
            >
              <TrashIcon className="h-5 w-5 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      )}

      {/* Certificates Table */}
      {filteredCertificates.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <h3 className="mt-2 text-sm font-medium text-gray-900">No certificates found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {certificates.length === 0
              ? 'Get started by creating a new certificate'
              : 'Try adjusting your search'}
          </p>
        </div>
      ) : (
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <Checkbox
                    checked={selectedCertificates.length === filteredCertificates.length}
                    onChange={handleSelectAll}
                  />
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Recipient
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Template
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Issue Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCertificates.map((certificate) => (
                <tr
                  key={certificate.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => navigate(`/dashboard/certificates/${certificate.id}`)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div onClick={e => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedCertificates.includes(certificate.id)}
                        onChange={() => handleSelectCertificate(certificate.id)}
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {certificate.title}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {certificate.recipient_name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {certificate.template.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(certificate.status)}`}>
                      {certificate.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(certificate.issue_date).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={() => deleteMutation.mutate(selectedCertificates)}
        title="Delete Certificates"
        message={`Are you sure you want to delete ${selectedCertificates.length} certificate${selectedCertificates.length === 1 ? '' : 's'}? This action cannot be undone.`}
      />
    </div>
  );
}
