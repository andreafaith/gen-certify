import React, { useState } from 'react';
import { UserManagement } from './UserManagement';
import { SystemSettings } from './SystemSettings';
import { UsageStatistics } from './UsageStatistics';
import { EmailTemplates } from './EmailTemplates';
import { ActivityLogs } from './ActivityLogs';
import { useAuth } from '../auth/AuthProvider';
import { Navigate } from 'react-router-dom';

type TabType = 'users' | 'settings' | 'statistics' | 'templates' | 'logs';

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('users');
  const { session } = useAuth();

  // Debug log
  console.log('AdminDashboard Session:', {
    user: session?.user,
    metadata: session?.user?.user_metadata,
    role: session?.user?.user_metadata?.role,
  });

  if (!session || !session.user?.user_metadata?.role || session.user?.user_metadata?.role !== 'admin') {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              </div>
            </div>
            <div className="flex items-center">
              <span className="px-3 py-1 text-sm font-medium text-white bg-indigo-600 rounded-full">
                {session.user?.email}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {[
              { id: 'users', name: 'User Management', icon: 'users' },
              { id: 'settings', name: 'System Settings', icon: 'cog' },
              { id: 'statistics', name: 'Usage Statistics', icon: 'chart-bar' },
              { id: 'templates', name: 'Email Templates', icon: 'mail' },
              { id: 'logs', name: 'Activity Logs', icon: 'clipboard-list' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`
                  ${
                    activeTab === tab.id
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                  whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                `}
              >
                <span className="flex items-center space-x-2">
                  <i className={`fas fa-${tab.icon}`}></i>
                  <span>{tab.name}</span>
                </span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Panels */}
        <div className="mt-6">
          {activeTab === 'users' && <UserManagement />}
          {activeTab === 'settings' && <SystemSettings />}
          {activeTab === 'statistics' && <UsageStatistics />}
          {activeTab === 'templates' && <EmailTemplates />}
          {activeTab === 'logs' && <ActivityLogs />}
        </div>
      </div>
    </div>
  );
}
