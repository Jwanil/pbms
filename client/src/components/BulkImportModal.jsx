import React, { useState, useRef } from 'react';
import { Modal, Button, Spin, Table, Alert, Typography, Collapse, message } from 'antd';
import { UploadOutlined, FileTextOutlined, DownloadOutlined, CheckCircleFilled, WarningFilled } from '@ant-design/icons';
import Papa from 'papaparse';
import api from '../api/axiosInstance';

const { Text, Title, Paragraph } = Typography;
const { Panel } = Collapse;

const MODULE_FIELDS = {
  products: [
    { name: 'product_name', required: true },
    { name: 'sku', required: true },
    { name: 'composition', required: false },
    { name: 'category_name', required: false },
    { name: 'grade_name', required: false },
    { name: 'packaging_name', required: false },
    { name: 'unit_of_measure', required: false },
    { name: 'shelf_life', required: false },
    { name: 'molecular_formula', required: false },
    { name: 'molecular_weight', required: false },
    { name: 'purity', required: false },
    { name: 'process_type', required: false },
    { name: 'un_number', required: false },
    { name: 'industry_application', required: false },
    { name: 'hsn_code', required: false },
    { name: 'cas_number', required: false },
    { name: 'description', required: false },
  ],
  companies: [
    { name: 'company_name', required: true },
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
    { name: 'mobile', required: true },
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
  categories: [{ name: 'name', required: true }],
  grades: [{ name: 'name', required: true }],
  departments: [{ name: 'name', required: true }],
  packaging: [
    { name: 'packaging_name', required: true },
    { name: 'size_unit', required: true },
    { name: 'size_value', required: true },
  ],
};

const BulkImportModal = ({ open, onClose, module, moduleName, onImportSuccess }) => {
  const [step, setStep] = useState(1);
  const [file, setFile] = useState(null);
  const [csvData, setCsvData] = useState([]);
  const [validationError, setValidationError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState(null); // { imported, skipped, errors }
  const fileInputRef = useRef(null);

  const resetState = () => {
    setStep(1);
    setFile(null);
    setCsvData([]);
    setValidationError('');
    setResult(null);
    setIsUploading(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleDownloadTemplate = async () => {
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
    } catch (err) {
      message.error(`Failed to download template for ${moduleName}`);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv') && selectedFile.type !== 'text/csv') {
        setValidationError('Only CSV files are allowed');
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setValidationError('');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      if (!droppedFile.name.endsWith('.csv') && droppedFile.type !== 'text/csv') {
        setValidationError('Only CSV files are allowed');
        setFile(null);
        return;
      }
      setFile(droppedFile);
      setValidationError('');
    }
  };

  const handleDragOver = (e) => e.preventDefault();

  const handleNextStep1 = () => {
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
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

        setCsvData(data);
        setValidationError('');
        setStep(2);
      },
      error: (error) => {
        setValidationError(`Failed to read file: ${error.message}`);
      }
    });
  };

  const handleImport = async () => {
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post(`/${module}/import`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResult(res.data.data);
      setStep(3);
    } catch (err) {
      message.error(err.response?.data?.message || 'Import failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDone = () => {
    handleClose();
    if (result && result.imported > 0 && onImportSuccess) {
      onImportSuccess();
    }
  };

  // Render components
  const Stepper = () => (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24, fontSize: 16, fontWeight: 500, color: '#8c8c8c' }}>
      <span style={{ color: step >= 1 ? '#13c2c2' : 'inherit' }}>
        {step >= 1 ? <CheckCircleFilled /> : <span style={{ display: 'inline-block', width: 20, height: 20, borderRadius: '50%', border: '2px solid currentColor', textAlign: 'center', lineHeight: '16px', fontSize: 12 }}>1</span>} Upload
      </span>
      <span style={{ margin: '0 12px' }}>→</span>
      <span style={{ color: step >= 2 ? '#13c2c2' : 'inherit' }}>
        {step >= 2 ? <CheckCircleFilled /> : <span style={{ display: 'inline-block', width: 20, height: 20, borderRadius: '50%', border: '2px solid currentColor', textAlign: 'center', lineHeight: '16px', fontSize: 12 }}>2</span>} Preview
      </span>
      <span style={{ margin: '0 12px' }}>→</span>
      <span style={{ color: step === 3 ? '#13c2c2' : 'inherit' }}>
        <span style={{ display: 'inline-block', width: 20, height: 20, borderRadius: '50%', border: step === 3 ? 'none' : '2px solid currentColor', backgroundColor: step === 3 ? '#13c2c2' : 'transparent', color: step === 3 ? '#fff' : 'inherit', textAlign: 'center', lineHeight: step===3 ? '20px' : '16px', fontSize: 12 }}>3</span> Result
      </span>
    </div>
  );

  const Step1 = () => (
    <div>
      <div style={{ border: '1px dashed #d9d9d9', borderRadius: 8, padding: 16, marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={5} style={{ margin: 0 }}><FileTextOutlined style={{ marginRight: 8, color: '#13c2c2' }} /> Download CSV Template</Title>
          <Text type="secondary">Use this template to format your data correctly</Text>
        </div>
        <Button icon={<DownloadOutlined />} onClick={handleDownloadTemplate}>Template</Button>
      </div>

      <div style={{ marginBottom: 24, overflowX: 'auto' }}>
        <Text strong style={{ display: 'block', marginBottom: 8 }}>Field Reference</Text>
        <div style={{ display: 'inline-flex', border: '1px solid #f0f0f0', borderRadius: 4, padding: 8, background: '#fafafa' }}>
          {MODULE_FIELDS[module].map(f => (
            <div key={f.name} style={{ padding: '0 12px', textAlign: 'center', minWidth: 120 }}>
              <div style={{ color: f.required ? '#d46b08' : '#08979c', fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{f.name}</div>
              <div style={{ color: '#8c8c8c', fontSize: 12 }}>{f.required ? '(Required)' : '(Optional)'}</div>
            </div>
          ))}
        </div>
      </div>

      <div 
        onDrop={handleDrop} 
        onDragOver={handleDragOver}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: '2px dashed #13c2c2',
          background: '#f0fffe',
          borderRadius: 8,
          padding: 40,
          textAlign: 'center',
          cursor: 'pointer',
          marginBottom: 16
        }}
      >
        <input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} />
        {file ? (
          <div>
            <CheckCircleFilled style={{ fontSize: 32, color: '#52c41a', marginBottom: 12 }} />
            <Title level={5} style={{ margin: 0 }}>{file.name}</Title>
            <Text type="secondary">{(file.size / 1024).toFixed(1)} KB</Text>
          </div>
        ) : (
          <div>
            <UploadOutlined style={{ fontSize: 32, color: '#13c2c2', marginBottom: 12 }} />
            <Title level={5} style={{ margin: 0, color: '#13c2c2' }}>Drop your CSV file here, or click to browse</Title>
            <Text type="secondary">CSV files only</Text>
          </div>
        )}
      </div>

      {validationError && <Alert message={validationError} type="error" showIcon style={{ marginBottom: 16 }} />}

      <div style={{ textAlign: 'right' }}>
        <Button type="primary" disabled={!file} onClick={handleNextStep1}>Next →</Button>
      </div>
    </div>
  );

  const Step2 = () => {
    const columns = Object.keys(csvData[0] || {}).map(key => ({
      title: key,
      dataIndex: key,
      key: key,
      ellipsis: true,
      width: 150
    }));

    return (
      <Spin spinning={isUploading} tip="Importing data...">
        <div style={{ marginBottom: 16 }}>
          <Text strong>{csvData.length} rows detected.</Text> <Text type="secondary">Showing first 10 below.</Text>
        </div>
        <Table 
          dataSource={csvData.slice(0, 10).map((row, i) => ({ ...row, key: i }))} 
          columns={columns} 
          pagination={false}
          size="small"
          scroll={{ x: 'max-content' }}
          bordered
        />
        {csvData.length > 10 && (
          <div style={{ textAlign: 'center', marginTop: 8, color: '#8c8c8c' }}>
            ... and {csvData.length - 10} more rows
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
          <Button onClick={() => setStep(1)}>← Back</Button>
          <Button type="primary" onClick={handleImport}>Import {csvData.length} Rows →</Button>
        </div>
      </Spin>
    );
  };

  const Step3 = () => (
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
                  <li key={i} style={{ marginBottom: 4 }}>
                    Row {err.row}: {err.reason}
                  </li>
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
  );

  return (
    <Modal
      open={open}
      title={`Bulk Import ${moduleName}`}
      onCancel={handleClose}
      footer={null}
      width={800}
      destroyOnClose
      maskClosable={false}
    >
      <Stepper />
      {step === 1 && <Step1 />}
      {step === 2 && <Step2 />}
      {step === 3 && <Step3 />}
    </Modal>
  );
};

export default BulkImportModal;
