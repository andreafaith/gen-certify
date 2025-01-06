import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/Button';

interface UsageMetrics {
  total_users: number;
  active_users: number;
  total_certificates: number;
  certificates_this_month: number;
  storage_used: number;
  active_templates: number;
  api_calls_today: number;
  api_calls_this_month: number;
  average_generation_time: number;
  error_rate: number;
}

interface SystemPerformance {
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  response_time: number;
  timestamp: string;
}

interface UserActivity {
  date: string;
  certificates_generated: number;
  users_active: number;
  api_calls: number;
  errors: number;
}

export function UsageStatistics() {
  const [metrics, setMetrics] = useState<UsageMetrics | null>(null);
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [performance, setPerformance] = useState<SystemPerformance[]>([]);
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('week');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStatistics();
  }, [timeRange]);

  const fetchStatistics = async () => {
    try {
      // Fetch overall metrics
      const [
        usersData,
        activeUsersData,
        certificatesData,
        certificatesThisMonth,
        templatesData,
        apiCallsToday,
        apiCallsMonth,
        errorLogs
      ] = await Promise.all([
        supabase.from('auth.users').select('count'),
        supabase.from('auth.users').select('count').eq('account_status', 'active'),
        supabase.from('certificates').select('count'),
        supabase.from('certificates')
          .select('count')
          .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
        supabase.from('templates').select('count'),
        supabase.from('api_logs')
          .select('count')
          .gte('created_at', new Date().toISOString().split('T')[0]),
        supabase.from('api_logs')
          .select('count')
          .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
        supabase.from('error_logs')
          .select('count')
          .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
      ]);

      // Calculate average generation time
      const { data: generationTimes } = await supabase
        .from('certificates')
        .select('generation_time')
        .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());

      const avgGenerationTime = generationTimes
        ? generationTimes.reduce((acc, curr) => acc + curr.generation_time, 0) / generationTimes.length
        : 0;

      // Calculate error rate
      const totalRequests = apiCallsMonth.data?.[0]?.count || 0;
      const totalErrors = errorLogs.data?.[0]?.count || 0;
      const errorRate = totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;

      setMetrics({
        total_users: usersData.data?.[0]?.count || 0,
        active_users: activeUsersData.data?.[0]?.count || 0,
        total_certificates: certificatesData.data?.[0]?.count || 0,
        certificates_this_month: certificatesThisMonth.data?.[0]?.count || 0,
        storage_used: 0, // Will be updated with actual storage calculation
        active_templates: templatesData.data?.[0]?.count || 0,
        api_calls_today: apiCallsToday.data?.[0]?.count || 0,
        api_calls_this_month: apiCallsMonth.data?.[0]?.count || 0,
        average_generation_time: avgGenerationTime,
        error_rate: errorRate
      });

      // Fetch system performance data
      const startDate = new Date();
      switch (timeRange) {
        case 'day':
          startDate.setDate(startDate.getDate() - 1);
          break;
        case 'week':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
      }

      const { data: performanceData } = await supabase
        .from('system_performance')
        .select('*')
        .gte('timestamp', startDate.toISOString())
        .order('timestamp', { ascending: true });

      setPerformance(performanceData || []);

      // Fetch activity data
      const { data: activityData } = await supabase
        .from('activity_logs')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      // Process activity data into daily statistics
      const dailyStats = new Map<string, UserActivity>();
      
      activityData?.forEach(activity => {
        const date = new Date(activity.created_at).toISOString().split('T')[0];
        const stats = dailyStats.get(date) || {
          date,
          certificates_generated: 0,
          users_active: 0,
          api_calls: 0,
          errors: 0
        };

        if (activity.action === 'generate_certificate') {
          stats.certificates_generated++;
        }
        if (activity.action === 'api_call') {
          stats.api_calls++;
        }
        if (activity.action === 'error') {
          stats.errors++;
        }
        stats.users_active++;

        dailyStats.set(date, stats);
      });

      setActivities(Array.from(dailyStats.values()));

    } catch (err) {
      console.error('Error fetching statistics:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch statistics');
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">{error}</div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Usage Statistics</h1>
        <div className="flex gap-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as typeof timeRange)}
            className="rounded border-gray-300"
          >
            <option value="day">Last 24 Hours</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
          </select>
          <Button onClick={fetchStatistics}>Refresh</Button>
        </div>
      </div>

      {metrics && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-2">Users</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Total</p>
                  <p className="text-2xl font-bold">{metrics.total_users}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Active</p>
                  <p className="text-2xl font-bold">{metrics.active_users}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-2">Certificates</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Total</p>
                  <p className="text-2xl font-bold">{metrics.total_certificates}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">This Month</p>
                  <p className="text-2xl font-bold">{metrics.certificates_this_month}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-2">API Usage</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Today</p>
                  <p className="text-2xl font-bold">{metrics.api_calls_today}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">This Month</p>
                  <p className="text-2xl font-bold">{metrics.api_calls_this_month}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Average Generation Time</p>
                  <p className="text-xl font-bold">{metrics.average_generation_time.toFixed(2)}ms</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Error Rate</p>
                  <p className="text-xl font-bold">{metrics.error_rate.toFixed(2)}%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Storage Used</p>
                  <p className="text-xl font-bold">{formatBytes(metrics.storage_used)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-4">System Health</h3>
              {performance.length > 0 && (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">CPU Usage</p>
                    <p className="text-xl font-bold">
                      {performance[performance.length - 1].cpu_usage.toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Memory Usage</p>
                    <p className="text-xl font-bold">
                      {formatBytes(performance[performance.length - 1].memory_usage)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Average Response Time</p>
                    <p className="text-xl font-bold">
                      {performance[performance.length - 1].response_time.toFixed(2)}ms
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">Activity Timeline</h3>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Active Users
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Certificates Generated
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    API Calls
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Errors
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {activities.map((activity) => (
                  <tr key={activity.date}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(activity.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {activity.users_active}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {activity.certificates_generated}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {activity.api_calls}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {activity.errors}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
