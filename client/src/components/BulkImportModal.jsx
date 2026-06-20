import React, { useState, useRef, useCallback, useMemo } from 'react';
import { Modal, Button, Spin, Table, Alert, Typography, Collapse, message, Tag, Checkbox } from 'antd';
import {
  UploadOutlined, FileTextOutlined, DownloadOutlined,
  CheckCircleFilled, WarningFilled, InfoCircleOutlined
} from '@ant-design/icons';
import Papa from 'papaparse';
import api from '../api/axiosInstance';

const { Text, Title } = Typography;
const { Panel } = Collapse;

const MODULE_FIELDS = {
  products: [
    { name: 'product_name', required: true, uniqueKey: true },
    { name: 'sku', required: true, uniqueKey: true },
    { name: 'composition', required: false },
    { name: 'category_name', required: false },
    { name: 'grade_name', required: false },
    { name: 'packaging_name', required: false },
    { name: 'unit_of_measure', required: false },
    { name: 'shelf_life', required: false },
    { name: 'un_number', required: false },
    { name: 'industry_application', required: false },
    { name: 'hsn_code', required: false },
    { name: 'cas_number', required: false },
    { name: 'description', required: false },
  ],
  companies: [
    { name: 'company_name', required: true, uniqueKey: true },
    { name: 'company_type', required: true },
    { name: 'email', required: false },
    { name: 'phone', required: false },
    { name: 'gst_number', required: false },
    { name: 'pan_number', required: false },
    { name: 'cin_number', required: false },
    { name: 'website', required: false },
    { name: 'industry_type', required: false },
    { name: 'address', required: false },
    { name: 'remarks', required: false },
  ],
  contacts: [
    { name: 'first_name', required: true },
    { name: 'mobile', required: true, uniqueKey: true },
    { name: 'last_name', required: false },
    { name: 'alternate_mobile', required: false },
    { name: 'email', required: false },
    { name: 'contact_type', required: false },
    { name: 'designation', required: false },
    { name: 'preferred_language', required: false },
    { name: 'tags', required: false },
    { name: 'company_name', required: false },
    { name: 'branch_name', required: false },
  ],
  categories: [{ name: 'name', required: true, uniqueKey: true }],
  grades: [{ name: 'name', required: true, uniqueKey: true }],
  departments: [{ name: 'name', required: true, uniqueKey: true }],
  packaging: [
    { name: 'packaging_name', required: true, uniqueKey: true },
    { name: 'size_unit', required: true },
    { name: 'size_value', required: true },
  ],
};

// Get the unique key field name for a module
const getUniqueKey = (module) => {
  const keyField = MODULE_FIELDS[module]?.find(f => f.uniqueKey);
  return keyField?.name || null;
};

const ROW_STATUS = {
  NEW: 'new',
  CSV_DUP: 'csv_dup',
  DB_DUP: 'db_dup',
};

const statusConfig = {
  [ROW_STATUS.NEW]: { label: 'New', color: 'success' },
  [ROW_STATUS.CSV_DUP]: { label: 'Duplicate in CSV', color: 'warning' },
  [ROW_STATUS.DB_DUP]: { label: 'Already in DB', color: 'error' },
};

const BulkImportModal = ({ open, onClose, module, moduleName, onImportSuccess }) => {
  const [step, setStep] = useState(1);
  const [file, setFile] = useState(null);
  const [csvData, setCsvData] = useState([]); // rows with _rowIndex, _status
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [validationError, setValidationError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState(null);
  const fileInputRef = useRef(null);

  const resetState = useCallback(() => {
    setStep(1);
    setFile(null);
    setCsvData([]);
    setSelectedRowKeys([]);
    setValidationError('');
    setResult(null);
    setIsUploading(false);
    setIsChecking(false);
  }, []);

  const handleClose = useCallback(() => {
    resetState();
    onClose();
  }, [resetState, onClose]);

  const handleDownloadTemplate = useCallback(async () => {
    try {
      const res = await api.get(`/${module}/sample-csv`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${module}_sample.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      message.error(`Failed to download template for ${moduleName}`);
    }
  }, [module, moduleName]);

  const handleFileChange = useCallback((e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    if (!selectedFile.name.endsWith('.csv') && selectedFile.type !== 'text/csv') {
      setValidationError('Only CSV files are allowed');
      setFile(null);
      return;
    }
    setFile(selectedFile);
    setValidationError('');
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (!droppedFile) return;
    if (!droppedFile.name.endsWith('.csv') && droppedFile.type !== 'text/csv') {
      setValidationError('Only CSV files are allowed');
      setFile(null);
      return;
    }
    setFile(droppedFile);
    setValidationError('');
  }, []);

  const handleDragOver = useCallback((e) => e.preventDefault(), []);

  const handleNextStep1 = useCallback(() => {
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        if (results.errors.length > 0) {
          setValidationError(`CSV parsing failed: ${results.errors[0].message}`);
          return;
        }

        const data = results.data;
        const requiredHeaders = MODULE_FIELDS[module].filter(f => f.required).map(f => f.name);
        const actualHeaders = Object.keys(data[0] || {});
        const missingHeaders = requiredHeaders.filter(h => !actualHeaders.includes(h));

        if (missingHeaders.length > 0) {
          setValidationError(`Missing required columns: ${missingHeaders.join(', ')}`);
          return;
        }
        if (data.length === 0) {
          setValidationError('CSV file is empty');
          return;
        }

        setIsChecking(true);
        setValidationError('');

        const uniqueKeyField = getUniqueKey(module);
        const tagged = data.map((row, i) => ({ ...row, _rowIndex: i, _status: ROW_STATUS.NEW }));

        // Step 1: Detect intra-CSV duplicates
        if (uniqueKeyField) {
          const seen = new Map();
          tagged.forEach((row) => {
            const val = (row[uniqueKeyField] || '').trim().toLowerCase();
            if (!val) return;
            if (seen.has(val)) {
              row._status = ROW_STATUS.CSV_DUP;
              // Also mark the FIRST occurrence as csv_dup
              const firstIdx = seen.get(val);
              if (tagged[firstIdx]._status === ROW_STATUS.NEW) {
                tagged[firstIdx]._status = ROW_STATUS.CSV_DUP;
              }
            } else {
              seen.set(val, row._rowIndex);
            }
          });

          // Step 2: Check against DB for modules that support it
          const supportsDbCheck = ['products', 'companies', 'contacts'].includes(module);
          if (supportsDbCheck) {
            try {
              const uniqueKeys = tagged
                .filter(r => r._status === ROW_STATUS.NEW)
                .map(r => (r[uniqueKeyField] || '').trim())
                .filter(Boolean);

              if (uniqueKeys.length > 0) {
                const res = await api.post(`/${module}/check-duplicates`, { keys: uniqueKeys });
                const dbDuplicates = new Set((res.data.data?.duplicates || []).map(k => k.toLowerCase()));
                tagged.forEach(row => {
                  if (row._status === ROW_STATUS.NEW) {
                    const val = (row[uniqueKeyField] || '').trim().toLowerCase();
                    if (dbDuplicates.has(val)) row._status = ROW_STATUS.DB_DUP;
                  }
                });
              }
            } catch {
              // DB check failed — treat all as new (non-blocking)
            }
          }
        }

        // Pre-select only rows that are truly new
        const newRowKeys = tagged
          .filter(r => r._status === ROW_STATUS.NEW)
          .map(r => r._rowIndex);

        setCsvData(tagged);
        setSelectedRowKeys(newRowKeys);
        setIsChecking(false);
        setStep(2);
      },
      error: (error) => {
        setValidationError(`Failed to read file: ${error.message}`);
        setIsChecking(false);
      },
    });
  }, [file, module]);

  const handleImport = useCallback(async () => {
    setIsUploading(true);
    const selectedRows = csvData
      .filter(r => selectedRowKeys.includes(r._rowIndex))
      .map(({ _rowIndex, _status, ...rest }) => rest); // strip internal fields

    try {
      const res = await api.post(`/${module}/import-json`, { rows: selectedRows });
      setResult(res.data.data);
      setStep(3);
    } catch (err) {
      message.error(err.response?.data?.message || 'Import failed');
    } finally {
      setIsUploading(false);
    }
  }, [csvData, selectedRowKeys, module]);

  const handleDone = useCallback(() => {
    handleClose();
    if (result && result.imported > 0 && onImportSuccess) {
      onImportSuccess();
    }
  }, [handleClose, result, onImportSuccess]);

  // ─── Stepper ────────────────────────────────────────────────────────────────
  const Stepper = useMemo(() => (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24, fontSize: 15, fontWeight: 500, color: '#8c8c8c' }}>
      {[{ label: 'Upload', n: 1 }, { label: 'Preview', n: 2 }, { label: 'Result', n: 3 }].map(({ label, n }, idx, arr) => (
        <React.Fragment key={n}>
          <span style={{ color: step >= n ? '#13c2c2' : 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
            {step > n
              ? <CheckCircleFilled style={{ fontSize: 18 }} />
              : <span style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: 22, height: 22, borderRadius: '50%', fontSize: 12, fontWeight: 700,
                  border: `2px solid ${step >= n ? '#13c2c2' : '#d9d9d9'}`,
                  background: step === n ? '#13c2c2' : 'transparent',
                  color: step === n ? '#fff' : 'inherit',
                }}>{n}</span>
            }
            {label}
          </span>
          {idx < arr.length - 1 && (
            <span style={{ margin: '0 16px', color: '#d9d9d9', fontSize: 18 }}>→</span>
          )}
        </React.Fragment>
      ))}
    </div>
  ), [step]);

  // ─── Step 1 ─────────────────────────────────────────────────────────────────
  const Step1 = useMemo(() => (
    <div>
      <div style={{ border: '1px dashed #d9d9d9', borderRadius: 8, padding: 16, marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={5} style={{ margin: 0 }}><FileTextOutlined style={{ marginRight: 8, color: '#13c2c2' }} />Download CSV Template</Title>
          <Text type="secondary">Use this template to format your data correctly</Text>
        </div>
        <Button icon={<DownloadOutlined />} onClick={handleDownloadTemplate}>Template</Button>
      </div>

      <div style={{ marginBottom: 20, overflowX: 'auto' }}>
        <Text strong style={{ display: 'block', marginBottom: 8 }}>Field Reference</Text>
        <div style={{ display: 'inline-flex', border: '1px solid #f0f0f0', borderRadius: 6, padding: 8, background: '#fafafa', flexWrap: 'wrap', gap: 4 }}>
          {MODULE_FIELDS[module].map(f => (
            <div key={f.name} style={{ padding: '4px 12px', textAlign: 'center', minWidth: 100 }}>
              <div style={{ color: f.required ? '#d46b08' : '#08979c', fontWeight: 600, fontSize: 12, marginBottom: 2 }}>{f.name}</div>
              <div style={{ color: '#8c8c8c', fontSize: 11 }}>{f.required ? '(Required)' : '(Optional)'}</div>
            </div>
          ))}
        </div>
      </div>

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => fileInputRef.current?.click()}
        style={{ border: '2px dashed #13c2c2', background: '#f0fffe', borderRadius: 8, padding: 40, textAlign: 'center', cursor: 'pointer', marginBottom: 16 }}
      >
        <input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} />
        {file ? (
          <div>
            <CheckCircleFilled style={{ fontSize: 32, color: '#52c41a', marginBottom: 10 }} />
            <Title level={5} style={{ margin: 0 }}>{file.name}</Title>
            <Text type="secondary">{(file.size / 1024).toFixed(1)} KB</Text>
          </div>
        ) : (
          <div>
            <UploadOutlined style={{ fontSize: 32, color: '#13c2c2', marginBottom: 10 }} />
            <Title level={5} style={{ margin: 0, color: '#13c2c2' }}>Drop your CSV file here, or click to browse</Title>
            <Text type="secondary">CSV files only</Text>
          </div>
        )}
      </div>

      {validationError && <Alert message={validationError} type="error" showIcon style={{ marginBottom: 12 }} />}

      <div style={{ textAlign: 'right' }}>
        <Button type="primary" disabled={!file} loading={isChecking} onClick={handleNextStep1}>
          {isChecking ? 'Checking...' : 'Next →'}
        </Button>
      </div>
    </div>
  ), [file, validationError, isChecking, module, handleDownloadTemplate, handleDrop, handleDragOver, handleFileChange, handleNextStep1]);

  // ─── Step 2 ─────────────────────────────────────────────────────────────────
  const summaryStats = useMemo(() => {
    if (!csvData.length) return null;
    const newCount = csvData.filter(r => r._status === ROW_STATUS.NEW).length;
    const csvDupCount = csvData.filter(r => r._status === ROW_STATUS.CSV_DUP).length;
    const dbDupCount = csvData.filter(r => r._status === ROW_STATUS.DB_DUP).length;
    return { newCount, csvDupCount, dbDupCount };
  }, [csvData]);

  const step2Columns = useMemo(() => {
    if (!csvData.length) return [];
    const dataKeys = Object.keys(csvData[0]).filter(k => !k.startsWith('_'));
    return [
      {
        title: 'Status',
        key: '_status',
        width: 160,
        fixed: 'left',
        render: (_, row) => {
          const cfg = statusConfig[row._status];
          return <Tag color={cfg.color} style={{ borderRadius: 4, fontSize: 11 }}>{cfg.label}</Tag>;
        },
      },
      ...dataKeys.map(key => ({
        title: key,
        dataIndex: key,
        key,
        ellipsis: true,
        width: 140,
      })),
    ];
  }, [csvData]);

  const Step2 = useMemo(() => (
    <Spin spinning={isUploading} tip="Importing data...">
      {summaryStats && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <div style={{ background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 6, padding: '6px 16px', fontSize: 13 }}>
            <Text strong style={{ color: '#52c41a' }}>✓ {summaryStats.newCount} new rows</Text>
          </div>
          {summaryStats.csvDupCount > 0 && (
            <div style={{ background: '#fffbe6', border: '1px solid #ffe58f', borderRadius: 6, padding: '6px 16px', fontSize: 13 }}>
              <Text strong style={{ color: '#d46b08' }}>⚠ {summaryStats.csvDupCount} duplicates in CSV</Text>
            </div>
          )}
          {summaryStats.dbDupCount > 0 && (
            <div style={{ background: '#fff2f0', border: '1px solid #ffccc7', borderRadius: 6, padding: '6px 16px', fontSize: 13 }}>
              <Text strong style={{ color: '#cf1322' }}>✕ {summaryStats.dbDupCount} already exist in DB</Text>
            </div>
          )}
        </div>
      )}
      {(summaryStats?.csvDupCount > 0 || summaryStats?.dbDupCount > 0) && (
        <Alert
          type="info"
          showIcon
          icon={<InfoCircleOutlined />}
          message="Duplicate rows are pre-unchecked. You can manually re-check any row to include it."
          style={{ marginBottom: 12 }}
        />
      )}
      <Table
        rowSelection={{
          type: 'checkbox',
          selectedRowKeys,
          onChange: (keys) => setSelectedRowKeys(keys),
          getCheckboxProps: () => ({}),
        }}
        dataSource={csvData.map(r => ({ ...r, key: r._rowIndex }))}
        columns={step2Columns}
        pagination={{ pageSize: 10, showSizeChanger: false, showTotal: (t) => `${t} rows` }}
        size="small"
        scroll={{ x: 'max-content' }}
        bordered
        rowClassName={(row) => row._status !== ROW_STATUS.NEW ? 'import-dup-row' : ''}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
        <Button onClick={() => setStep(1)}>← Back</Button>
        <Button
          type="primary"
          onClick={handleImport}
          disabled={selectedRowKeys.length === 0}
        >
          Import {selectedRowKeys.length} Selected Row{selectedRowKeys.length !== 1 ? 's' : ''} →
        </Button>
      </div>
    </Spin>
  ), [isUploading, summaryStats, csvData, step2Columns, selectedRowKeys, handleImport]);

  // ─── Step 3 ─────────────────────────────────────────────────────────────────
  const Step3 = useMemo(() => (
    <div style={{ textAlign: 'center', padding: '20px 0' }}>
      <CheckCircleFilled style={{ fontSize: 64, color: '#52c41a', marginBottom: 16 }} />
      <Title level={3}>Import Complete!</Title>

      <div style={{ background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 8, padding: 16, display: 'inline-block', minWidth: 300, marginBottom: 24 }}>
        <Text strong style={{ color: '#52c41a', fontSize: 16 }}>✓ {result?.imported || 0} records imported successfully</Text>
      </div>

      {result?.skipped > 0 && (
        <div style={{ textAlign: 'left', background: '#fff7e6', border: '1px solid #ffd591', borderRadius: 8, padding: 16 }}>
          <Text strong style={{ color: '#fa8c16', display: 'block', marginBottom: 12 }}>
            <WarningFilled style={{ marginRight: 8 }} />
            ⚠ {result.skipped} rows skipped
          </Text>
          <Collapse ghost size="small">
            <Panel header="View skipped rows details" key="1">
              <ul style={{ paddingLeft: 20, margin: 0, color: '#d46b08' }}>
                {result.errors?.map((err, i) => (
                  <li key={i} style={{ marginBottom: 4 }}>Row {err.row}: {err.reason}</li>
                ))}
              </ul>
            </Panel>
          </Collapse>
        </div>
      )}

      <div style={{ marginTop: 32 }}>
        <Button type="primary" size="large" onClick={handleDone} style={{ width: 200 }}>Done</Button>
      </div>
    </div>
  ), [result, handleDone]);

  return (
    <Modal
      open={open}
      title={`Bulk Import ${moduleName}`}
      onCancel={handleClose}
      footer={null}
      width={900}
      destroyOnClose
      maskClosable={false}
    >
      <style>{`.import-dup-row { background: #fffbe6; }`}</style>
      {Stepper}
      {step === 1 && Step1}
      {step === 2 && Step2}
      {step === 3 && Step3}
    </Modal>
  );
};

export default BulkImportModal;
