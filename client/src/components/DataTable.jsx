import { Table, Input, Space } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useState } from 'react';

function DataTable({
  columns,
  dataSource,
  loading = false,
  total = 0,
  pageSize = 20,
  onPageChange,
  onSearch,
  searchPlaceholder = 'Search...',
  rowKey = 'id',
  extraFilters,
}) {
  const [searchValue, setSearchValue] = useState('');

  const handleSearch = (value) => {
    setSearchValue(value);
    onSearch?.(value);
  };

  return (
    <div>
      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
        <Input.Search
          placeholder={searchPlaceholder}
          allowClear
          value={searchValue}
          onSearch={handleSearch}
          onChange={(e) => !e.target.value && handleSearch('')}
          style={{ width: 300 }}
          prefix={<SearchOutlined />}
        />
        {extraFilters && <Space>{extraFilters}</Space>}
      </Space>

      <Table
        columns={columns}
        dataSource={dataSource}
        loading={loading}
        rowKey={rowKey}
        pagination={{
          total,
          pageSize,
          showSizeChanger: false,
          showTotal: (t) => `Total ${t} records`,
          onChange: onPageChange,
        }}
        scroll={{ x: 'max-content' }}
        size="middle"
      />
    </div>
  );
}

export default DataTable;
