import React, { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  ColumnDef,
  SortingState,
  ColumnFiltersState,
} from '@tanstack/react-table';
import { useAuth } from '../auth/AuthProvider';
import { supabase } from '../../lib/supabase';
import { ChevronUpIcon, ChevronDownIcon, FunnelIcon } from '@heroicons/react/24/outline';

interface DataRow {
  id: string;
  recipient_name: string;
  email: string;
  certificate_id: string;
  issue_date: string;
  [key: string]: any;
}

export function DataPreview() {
  const [data, setData] = useState<DataRow[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [editingCell, setEditingCell] = useState<{ rowId: string; columnId: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  // Fetch data
  React.useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      try {
        const { data: csvData, error: fetchError } = await supabase
          .from('csv_data')
          .select('*')
          .order('uploaded_at', { ascending: false });

        if (fetchError) throw fetchError;
        setData(csvData || []);
      } catch (err) {
        setError('Failed to fetch data: ' + (err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Define columns
  const columns = useMemo<ColumnDef<DataRow>[]>(() => [
    {
      accessorKey: 'recipient_name',
      header: 'Recipient Name',
      cell: ({ row, column, getValue }) => {
        const isEditing = editingCell?.rowId === row.id && editingCell?.columnId === column.id;
        const value = getValue() as string;

        if (isEditing) {
          return (
            <input
              className="w-full px-2 py-1 border rounded"
              value={value}
              onChange={e => handleCellEdit(row.id, column.id, e.target.value)}
              onBlur={() => setEditingCell(null)}
              autoFocus
            />
          );
        }
        return (
          <div
            className="px-2 py-1 cursor-pointer hover:bg-gray-50"
            onClick={() => setEditingCell({ rowId: row.id, columnId: column.id })}
          >
            {value}
          </div>
        );
      },
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row, column, getValue }) => {
        const isEditing = editingCell?.rowId === row.id && editingCell?.columnId === column.id;
        const value = getValue() as string;

        if (isEditing) {
          return (
            <input
              className="w-full px-2 py-1 border rounded"
              value={value}
              onChange={e => handleCellEdit(row.id, column.id, e.target.value)}
              onBlur={() => setEditingCell(null)}
              autoFocus
            />
          );
        }
        return (
          <div
            className="px-2 py-1 cursor-pointer hover:bg-gray-50"
            onClick={() => setEditingCell({ rowId: row.id, columnId: column.id })}
          >
            {value}
          </div>
        );
      },
    },
    {
      accessorKey: 'certificate_id',
      header: 'Certificate ID',
    },
    {
      accessorKey: 'issue_date',
      header: 'Issue Date',
      cell: ({ getValue }) => {
        const value = getValue() as string;
        return value ? new Date(value).toLocaleDateString() : '';
      },
    },
  ], [editingCell]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const handleCellEdit = async (rowId: string, columnId: string, value: string) => {
    try {
      // Update local state
      setData(prev => prev.map(row => 
        row.id === rowId ? { ...row, [columnId]: value } : row
      ));

      // Update database
      const { error: updateError } = await supabase
        .from('csv_data')
        .update({ [columnId]: value })
        .eq('id', rowId);

      if (updateError) throw updateError;
    } catch (err) {
      setError('Failed to update: ' + (err as Error).message);
      // Revert changes on error
      const { data: originalData } = await supabase
        .from('csv_data')
        .select('*')
        .eq('id', rowId)
        .single();
      
      if (originalData) {
        setData(prev => prev.map(row =>
          row.id === rowId ? originalData : row
        ));
      }
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-700 p-4 rounded-md">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Data Preview</h2>
        <div className="flex gap-2">
          {/* Add any additional controls here */}
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-4">
        {table.getAllColumns().map(column => (
          <div key={column.id} className="flex items-center gap-2">
            <input
              type="text"
              placeholder={`Filter ${column.id}`}
              value={column.getFilterValue() as string || ''}
              onChange={e => column.setFilterValue(e.target.value)}
              className="px-2 py-1 border rounded text-sm"
            />
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto border rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-2">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getIsSorted() === 'asc' ? (
                        <ChevronUpIcon className="w-4 h-4" />
                      ) : header.column.getIsSorted() === 'desc' ? (
                        <ChevronDownIcon className="w-4 h-4" />
                      ) : (
                        <FunnelIcon className="w-4 h-4 text-gray-300" />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {table.getRowModel().rows.map(row => (
              <tr key={row.id} className="hover:bg-gray-50">
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="px-6 py-4 whitespace-nowrap">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No data available. Upload some data to get started.
        </div>
      )}
    </div>
  );
}
