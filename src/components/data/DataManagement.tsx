import React from 'react';
import { Link, Outlet, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import {
  TableCellsIcon,
  ClipboardDocumentListIcon,
  ArrowsPointingInIcon,
} from '@heroicons/react/24/outline';

const features = [
  {
    name: 'Upload Data',
    description: 'Upload CSV files and map them to your certificate templates.',
    href: '/dashboard/data/upload',
    icon: TableCellsIcon,
  },
  {
    name: 'Preview Data',
    description: 'View, edit, and manage your uploaded data.',
    href: '/dashboard/data/preview',
    icon: ClipboardDocumentListIcon,
  },
  {
    name: 'Field Mapping',
    description: 'Configure how your CSV data maps to certificate fields.',
    href: '/dashboard/data/mapping',
    icon: ArrowsPointingInIcon,
  },
];

export function DataManagement() {
  const location = useLocation();
  const { session, loading } = useAuth();
  const isRoot = location.pathname === '/dashboard/data';

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500" />
      </div>
    );
  }

  // Check authentication
  if (!session) {
    return <Navigate to="/login" />;
  }

  if (!isRoot) {
    return <Outlet />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center">
        <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
          Data Management
        </h2>
        <p className="mt-4 text-xl text-gray-600">
          Upload, preview, and configure your certificate data
        </p>
      </div>

      <div className="mt-12">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.name}
              className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-500 rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <div>
                <span className="rounded-lg inline-flex p-3 bg-indigo-50 text-indigo-700 ring-4 ring-white">
                  <feature.icon className="h-6 w-6" aria-hidden="true" />
                </span>
              </div>
              <div className="mt-8">
                <h3 className="text-lg font-medium">
                  <Link to={feature.href} className="focus:outline-none">
                    <span className="absolute inset-0" aria-hidden="true" />
                    {feature.name}
                  </Link>
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  {feature.description}
                </p>
              </div>
              <span
                className="pointer-events-none absolute top-6 right-6 text-gray-300 group-hover:text-gray-400"
                aria-hidden="true"
              >
                <svg
                  className="h-6 w-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M20 4h1a1 1 0 00-1-1v1zm-1 12a1 1 0 102 0h-2zM8 3a1 1 0 000 2V3zM3.293 19.293a1 1 0 101.414 1.414l-1.414-1.414zM19 4v12h2V4h-2zm1-1H8v2h12V3zm-.707.293l-16 16 1.414 1.414 16-16-1.414-1.414z" />
                </svg>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
