import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/Toast';

interface CsvData {
  [key: string]: string;
}

interface CsvUploadProps {
  onDataLoaded: (data: CsvData[]) => void;
  templateFields: string[];
}

export function CsvUpload({ onDataLoaded, templateFields }: CsvUploadProps) {
  const [csvData, setCsvData] = useState<CsvData[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      Papa.parse(file, {
        complete: (results) => {
          if (results.data.length > 0) {
            const headers = results.data[0] as string[];
            const data = results.data.slice(1).map((row) => {
              const obj: CsvData = {};
              headers.forEach((header, index) => {
                obj[header] = row[index] as string;
              });
              return obj;
            });
            setHeaders(headers);
            setCsvData(data);
            
            // Initialize field mapping
            const initialMapping: Record<string, string> = {};
            templateFields.forEach(field => {
              // Try to find a matching header
              const matchingHeader = headers.find(header => 
                header.toLowerCase().includes(field.toLowerCase())
              );
              if (matchingHeader) {
                initialMapping[field] = matchingHeader;
              }
            });
            setFieldMapping(initialMapping);
          }
        },
        header: false,
        skipEmptyLines: true,
      });
    }
  }, [templateFields]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv'],
    },
    multiple: false,
  });

  const handleFieldMapping = (templateField: string, csvField: string) => {
    setFieldMapping(prev => ({
      ...prev,
      [templateField]: csvField
    }));
  };

  const handleConfirm = () => {
    if (csvData.length === 0) {
      toast({
        title: "Error",
        description: "Please upload a CSV file first",
        variant: "destructive",
      });
      return;
    }

    // Transform data according to mapping
    const mappedData = csvData.map(row => {
      const mappedRow: CsvData = {};
      Object.entries(fieldMapping).forEach(([templateField, csvField]) => {
        mappedRow[templateField] = row[csvField] || '';
      });
      return mappedRow;
    });

    onDataLoaded(mappedData);
    toast({
      title: "Success",
      description: `Loaded ${mappedData.length} records`,
    });
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          ${isDragActive ? 'border-primary bg-primary/10' : 'border-gray-300'}`}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop the CSV file here...</p>
        ) : (
          <p>Drag and drop a CSV file here, or click to select a file</p>
        )}
      </div>

      {headers.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Map Fields</h3>
          <div className="grid gap-4">
            {templateFields.map((field) => (
              <div key={field} className="flex items-center gap-4">
                <label className="w-1/3">{field}:</label>
                <select
                  className="flex-1 p-2 border rounded"
                  value={fieldMapping[field] || ''}
                  onChange={(e) => handleFieldMapping(field, e.target.value)}
                >
                  <option value="">Select CSV field</option>
                  {headers.map((header) => (
                    <option key={header} value={header}>
                      {header}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

      {csvData.length > 0 && (
        <>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  {headers.map((header) => (
                    <TableHead key={header}>{header}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {csvData.slice(0, 5).map((row, i) => (
                  <TableRow key={i}>
                    {headers.map((header) => (
                      <TableCell key={header}>{row[header]}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          <div className="flex justify-end">
            <Button onClick={handleConfirm}>
              Confirm Data ({csvData.length} records)
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
