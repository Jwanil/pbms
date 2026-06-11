import React, { useState } from 'react';
import { Dropdown, Button, Menu, Checkbox } from 'antd';
import { SettingOutlined } from '@ant-design/icons';

const ColumnSelector = ({ columns, hiddenKeys, onToggle }) => {
  const [open, setOpen] = useState(false);

  const menuItems = columns
    .filter(col => col.key !== 'actions' && col.title) // Actions column cannot be hidden
    .map(col => ({
      key: col.key,
      label: (
        <Checkbox
          checked={!hiddenKeys.has(col.key)}
          onChange={() => onToggle(col.key)}
          onClick={(e) => e.stopPropagation()} // Prevent dropdown from closing when clicking checkbox directly
        >
          {col.title}
        </Checkbox>
      ),
      onClick: ({ domEvent }) => {
        // Toggle when clicking the menu item row (outside the checkbox itself)
        domEvent.stopPropagation();
        onToggle(col.key);
      }
    }));

  return (
    <Dropdown
      menu={{ items: menuItems }}
      trigger={['click']}
      open={open}
      onOpenChange={setOpen}
      placement="bottomRight"
    >
      <Button icon={<SettingOutlined />}>Columns</Button>
    </Dropdown>
  );
};

export default ColumnSelector;