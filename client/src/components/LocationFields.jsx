import React, { useMemo, useState } from 'react';
import { Col, Form, Select } from 'antd';
import { useCountries, useStates, useCities } from '../api/locationsApi';

/**
 * Cascading location dropdowns: Country → State → City
 * Fetches from the database via the locations API.
 *
 * Props:
 *   restField  — spread from Form.List (only needed inside branch Form.List, optional otherwise)
 *   namePrefix — array path prefix: [] for company-level, [branchIndex] for branch inside Form.List
 *   colSpan    — Ant Design Col span (default 8)
 */
export default function LocationFields({ restField = {}, namePrefix = [], colSpan = 8 }) {
  const form = Form.useFormInstance();

  // Watch current form values to drive cascading
  const countryName = Form.useWatch([...namePrefix, 'country'], form);
  const stateName   = Form.useWatch([...namePrefix, 'state'],   form);

  // ─── Fetch all countries (always available) ───────────────────────────────
  const { data: countries = [], isLoading: loadingCountries } = useCountries();

  // Resolve selected country object by name → get its ID for the states query
  const selectedCountry = useMemo(
    () => countries.find(c => c.country_name === (countryName || 'India')) ?? null,
    [countryName, countries]
  );

  // ─── Fetch states when a country is selected ──────────────────────────────
  const { data: states = [], isLoading: loadingStates } = useStates({
    countryId: selectedCountry?.country_id,
    enabled: !!selectedCountry?.country_id,
  });

  // Resolve selected state object by name → get its ID for the cities query
  const selectedState = useMemo(
    () => states.find(s => s.state_name === stateName) ?? null,
    [stateName, states]
  );

  // ─── Fetch cities when a state is selected ────────────────────────────────
  const { data: cities = [], isLoading: loadingCities } = useCities({
    stateId: selectedState?.state_id,
    enabled: !!selectedState?.state_id,
  });

  // ─── Cascade resets ───────────────────────────────────────────────────────
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
            loading={loadingCountries}
            placeholder="Select Country"
            onChange={onCountryChange}
            filterOption={(input, option) =>
              option?.label?.toLowerCase().includes(input.toLowerCase())
            }
            options={countries.map(c => ({ label: c.country_name, value: c.country_name }))}
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
            loading={loadingStates}
            placeholder={selectedCountry ? 'Select State' : 'Select a Country first'}
            disabled={!selectedCountry}
            onChange={onStateChange}
            filterOption={(input, option) =>
              option?.label?.toLowerCase().includes(input.toLowerCase())
            }
            options={states.map(s => ({ label: s.state_name, value: s.state_name }))}
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
            loading={loadingCities}
            placeholder={selectedState ? 'Select City' : 'Select a State first'}
            disabled={!selectedState}
            filterOption={(input, option) =>
              option?.label?.toLowerCase().includes(input.toLowerCase())
            }
            options={cities.map(c => ({ label: c.city_name, value: c.city_name }))}
          />
        </Form.Item>
      </Col>
    </>
  );
}
