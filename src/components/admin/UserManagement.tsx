import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../auth/AuthProvider';
import { Button } from '../ui/Button';

interface User {
  id: string;
  email: string;
  role: 'user' | 'admin' | 'super_admin';
  account_status: 'active' | 'suspended' | 'pending' | 'deactivated';
  permissions: string[];
  created_at: string;
  last_sign_in_at: string;
}

interface UserFilters {
  role?: User['role'];
  status?: User['account_status'];
  search?: string;
}

export function UserManagement() {
  const { session } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<UserFilters>({});
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [users, filters, searchTerm]);

  const fetchUsers = async () => {
    try {
      const { data: { users }, error } = await supabase.auth.admin.listUsers();
      if (error) throw error;
      setUsers(users);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...users];
    
    if (filters.role) {
      filtered = filtered.filter(user => user.role === filters.role);
    }
    
    if (filters.status) {
      filtered = filtered.filter(user => user.account_status === filters.status);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredUsers(filtered);
  };

  const updateUserRole = async (userId: string, role: User['role']) => {
    try {
      const { error } = await supabase.auth.admin.updateUserById(
        userId,
        { user_metadata: { role } }
      );
      if (error) throw error;
      await fetchUsers();
    } catch (err) {
      console.error('Error updating user role:', err);
      setError(err instanceof Error ? err.message : 'Failed to update user role');
    }
  };

  const updateAccountStatus = async (userId: string, status: User['account_status']) => {
    try {
      const { error } = await supabase.auth.admin.updateUserById(
        userId,
        { user_metadata: { account_status: status } }
      );
      if (error) throw error;
      await fetchUsers();
    } catch (err) {
      console.error('Error updating account status:', err);
      setError(err instanceof Error ? err.message : 'Failed to update account status');
    }
  };

  const bulkUpdateStatus = async (status: User['account_status']) => {
    try {
      await Promise.all(
        selectedUsers.map(userId =>
          supabase.auth.admin.updateUserById(userId, {
            user_metadata: { account_status: status }
          })
        )
      );
      await fetchUsers();
      setSelectedUsers([]);
    } catch (err) {
      console.error('Error in bulk status update:', err);
      setError(err instanceof Error ? err.message : 'Failed to update users');
    }
  };

  const bulkUpdateRole = async (role: User['role']) => {
    try {
      await Promise.all(
        selectedUsers.map(userId =>
          supabase.auth.admin.updateUserById(userId, {
            user_metadata: { role }
          })
        )
      );
      await fetchUsers();
      setSelectedUsers([]);
    } catch (err) {
      console.error('Error in bulk role update:', err);
      setError(err instanceof Error ? err.message : 'Failed to update users');
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
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
        <h1 className="text-2xl font-bold">User Management</h1>
        <div className="flex gap-2">
          <Button onClick={fetchUsers}>Refresh</Button>
          {selectedUsers.length > 0 && (
            <div className="flex gap-2">
              <select
                onChange={(e) => bulkUpdateStatus(e.target.value as User['account_status'])}
                className="rounded border-gray-300"
              >
                <option value="">Bulk Status Update</option>
                <option value="active">Set Active</option>
                <option value="suspended">Set Suspended</option>
                <option value="deactivated">Set Deactivated</option>
              </select>
              <select
                onChange={(e) => bulkUpdateRole(e.target.value as User['role'])}
                className="rounded border-gray-300"
              >
                <option value="">Bulk Role Update</option>
                <option value="user">Set User</option>
                <option value="admin">Set Admin</option>
                <option value="super_admin">Set Super Admin</option>
              </select>
            </div>
          )}
        </div>
      </div>

      <div className="mb-4 flex gap-4">
        <input
          type="text"
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="rounded border-gray-300 px-4 py-2"
        />
        <select
          value={filters.role || ''}
          onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value as User['role'] || undefined }))}
          className="rounded border-gray-300"
        >
          <option value="">All Roles</option>
          <option value="user">User</option>
          <option value="admin">Admin</option>
          <option value="super_admin">Super Admin</option>
        </select>
        <select
          value={filters.status || ''}
          onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as User['account_status'] || undefined }))}
          className="rounded border-gray-300"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="pending">Pending</option>
          <option value="deactivated">Deactivated</option>
        </select>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="w-4 px-6 py-3">
                <input
                  type="checkbox"
                  checked={selectedUsers.length === filteredUsers.length}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedUsers(filteredUsers.map(u => u.id));
                    } else {
                      setSelectedUsers([]);
                    }
                  }}
                  className="rounded border-gray-300"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created At
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Sign In
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredUsers.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4">
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user.id)}
                    onChange={() => toggleUserSelection(user.id)}
                    className="rounded border-gray-300"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {user.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <select
                    value={user.role}
                    onChange={(e) => updateUserRole(user.id, e.target.value as User['role'])}
                    className="rounded border-gray-300"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <select
                    value={user.account_status}
                    onChange={(e) => updateAccountStatus(user.id, e.target.value as User['account_status'])}
                    className="rounded border-gray-300"
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="pending">Pending</option>
                    <option value="deactivated">Deactivated</option>
                  </select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {user.last_sign_in_at 
                    ? new Date(user.last_sign_in_at).toLocaleDateString()
                    : 'Never'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {/* TODO: Implement user details view */}}
                  >
                    View Details
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
