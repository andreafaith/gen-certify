import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import { useAuth } from '../auth/AuthProvider';
import { supabase } from '../../lib/supabase';

interface CSVData {
  headers: string[];
  rows: string[][];
}

interface ColumnMapping {
  [key: string]: string;
}

export function CSVUpload() {
  const [csvData, setCSVData] = useState<CSVData | null>(null);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError('');
    const file = acceptedFiles[0];
    
    if (!file) {
      setError('Please upload a CSV file');
      return;
    }

    if (!file.name.endsWith('.csv')) {
      setError('Please upload a valid CSV file');
      return;
    }

    Papa.parse(file, {
      complete: (results) => {
        if (results.errors.length > 0) {
          setError('Error parsing CSV file');
          return;
        }

        const headers = results.data[0] as string[];
        const rows = results.data.slice(1) as string[][];

        setCSVData({ headers, rows });
        
        // Initialize column mapping with empty values
        const initialMapping = headers.reduce((acc, header) => {
          acc[header] = '';
          return acc;
        }, {} as ColumnMapping);
        
        setColumnMapping(initialMapping);
      },
      error: (error) => {
        setError('Error reading CSV file: ' + error.message);
      }
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv']
    },
    multiple: false
  });

  const handleColumnMappingChange = (originalColumn: string, mappedColumn: string) => {
    setColumnMapping(prev => ({
      ...prev,
      [originalColumn]: mappedColumn
    }));
  };

  const validateData = (data: CSVData, mapping: ColumnMapping): boolean => {
    // Add your validation logic here
    // For example, check if required fields are mapped and not empty
    return true;
  };

  const handleSubmit = async () => {
    if (!csvData || !user) return;

    setIsLoading(true);
    setError('');

    try {
      if (!validateData(csvData, columnMapping)) {
        setError('Invalid data format');
        return;
      }

      // Process the data according to the column mapping
      const processedData = csvData.rows.map(row => {
        const mappedRow: Record<string, string> = {};
        csvData.headers.forEach((header, index) => {
          const mappedColumn = columnMapping[header];
          if (mappedColumn) {
            mappedRow[mappedColumn] = row[index];
          }
        });
        return mappedRow;
      });

      // Save to database
      const { error: uploadError } = await supabase
        .from('csv_data')
        .insert(processedData.map(row => ({
          ...row,
          user_id: user.id,
          uploaded_at: new Date().toISOString()
        })));

      if (uploadError) throw uploadError;

      // Reset form
      setCSVData(null);
      setColumnMapping({});
    } catch (err) {
      setError('Error uploading data: ' + (err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">CSV Data Upload</h2>
      
      {/* File Upload Area */}
      <div 
        {...getRootProps()} 
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop the CSV file here</p>
        ) : (
          <p>Drag and drop a CSV file here, or click to select a file</p>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {/* Column Mapping */}
      {csvData && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Map Columns</h3>
          <div className="space-y-4">
            {csvData.headers.map((header) => (
              <div key={header} className="flex items-center gap-4">
                <span className="w-1/3">{header}</span>
                <select
                  className="w-2/3 border rounded-md p-2"
                  value={columnMapping[header]}
                  onChange={(e) => handleColumnMappingChange(header, e.target.value)}
                >
                  <option value="">Select field</option>
                  <option value="recipient_name">Recipient Name</option>
                  <option value="email">Email</option>
                  <option value="certificate_id">Certificate ID</option>
                  <option value="issue_date">Issue Date</option>
                  {/* Add more mapping options as needed */}
                </select>
              </div>
            ))}
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className={`mt-6 px-4 py-2 rounded-md text-white
              ${isLoading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}
            `}
          >
            {isLoading ? 'Uploading...' : 'Upload Data'}
          </button>
        </div>
      )}
    </div>
  );
}
