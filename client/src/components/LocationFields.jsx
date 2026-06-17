import React, { useMemo } from 'react';
import { Col, Form, Select } from 'antd';
import { Country, State, City } from 'country-state-city';

/**
 * Reusable cascading location fields: Country → State → City
 * 
 * Props:
 *   restField   — spread from Form.List (only needed for branch lists, optional otherwise)
 *   namePrefix  — array path prefix for the form field names
 *                  e.g. [] for company-level, [branchIndex] for branch inside Form.List
 *   colSpan     — Ant Design Col span (default 8, i.e. 3 per row)
 */
export default function LocationFields({ restField = {}, namePrefix = [], colSpan = 8 }) {
  const form = Form.useFormInstance();

  // Build watched field paths
  const countryPath = [...namePrefix, 'country'];
  const statePath   = [...namePrefix, 'state'];

  const countryName = Form.useWatch(countryPath, form);
  const stateName   = Form.useWatch(statePath,   form);

  const countries = useMemo(() => Country.getAllCountries(), []);

  const selectedCountry = useMemo(() => {
    const name = countryName || 'India';
    return countries.find(c => c.name === name) ?? null;
  }, [countryName, countries]);

  const states = useMemo(() =>
    selectedCountry ? State.getStatesOfCountry(selectedCountry.isoCode) : [],
  [selectedCountry]);

  const selectedState = useMemo(() =>
    stateName ? states.find(s => s.name === stateName) ?? null : null,
  [stateName, states]);

  const cities = useMemo(() =>
    selectedState && selectedCountry
      ? City.getCitiesOfState(selectedCountry.isoCode, selectedState.isoCode)
      : [],
  [selectedState, selectedCountry]);

  const onCountryChange = () => {
    form.setFieldValue([...namePrefix, 'state'], undefined);
    form.setFieldValue([...namePrefix, 'city'],  undefined);
  };

  const onStateChange = () => {
    form.setFieldValue([...namePrefix, 'city'], undefined);
  };

  return (
    <>
      <Col span={colSpan}>
        <Form.Item
          {...restField}
          name={[...namePrefix, 'country']}
          label="Country"
          initialValue="India"
        >
          <Select
            showSearch
            placeholder="Select Country"
            onChange={onCountryChange}
            filterOption={(input, option) =>
              option.label.toLowerCase().includes(input.toLowerCase())
            }
            options={countries.map(c => ({ label: c.name, value: c.name }))}
          />
        </Form.Item>
      </Col>
      <Col span={colSpan}>
        <Form.Item
          {...restField}
          name={[...namePrefix, 'state']}
          label="State"
        >
          <Select
            showSearch
            placeholder={selectedCountry ? 'Select State' : 'Select a Country first'}
            onChange={onStateChange}
            disabled={!selectedCountry}
            filterOption={(input, option) =>
              option.label.toLowerCase().includes(input.toLowerCase())
            }
            options={states.map(s => ({ label: s.name, value: s.name }))}
          />
        </Form.Item>
      </Col>
      <Col span={colSpan}>
        <Form.Item
          {...restField}
          name={[...namePrefix, 'city']}
          label="City"
        >
          <Select
            showSearch
            placeholder={selectedState ? 'Select City' : 'Select a State first'}
            disabled={!selectedState}
            filterOption={(input, option) =>
              option.label.toLowerCase().includes(input.toLowerCase())
            }
            options={cities.map(c => ({ label: c.name, value: c.name }))}
          />
        </Form.Item>
      </Col>
    </>
  );
}
