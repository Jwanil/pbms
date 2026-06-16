import React, { useMemo } from 'react';
import { Col, Form, Select } from 'antd';
import { Country, State, City } from 'country-state-city';

export default function LocationFields({ restField, namePrefix = [] }) {
  const form = Form.useFormInstance();
  
  const countryName = Form.useWatch([...namePrefix, 'country'], form);
  const stateName = Form.useWatch([...namePrefix, 'state'], form);

  const countries = useMemo(() => Country.getAllCountries(), []);
  
  const selectedCountry = useMemo(() => {
    if (countryName) return countries.find(c => c.name === countryName);
    return countries.find(c => c.name === 'India');
  }, [countryName, countries]);

  const states = useMemo(() => 
    selectedCountry ? State.getStatesOfCountry(selectedCountry.isoCode) : [],
  [selectedCountry]);

  const selectedState = useMemo(() => 
    stateName ? states.find(s => s.name === stateName) : null,
  [stateName, states]);

  const cities = useMemo(() => 
    selectedState ? City.getCitiesOfState(selectedCountry.isoCode, selectedState.isoCode) : [],
  [selectedState, selectedCountry]);

  const onCountryChange = () => {
    form.setFieldValue([...namePrefix, 'state'], undefined);
    form.setFieldValue([...namePrefix, 'city'], undefined);
  };

  const onStateChange = () => {
    form.setFieldValue([...namePrefix, 'city'], undefined);
  };

  return (
    <>
      <Col span={8}>
        <Form.Item {...restField} name={[...namePrefix, 'country']} label="Country" initialValue="India">
          <Select 
            showSearch 
            placeholder="Select Country"
            onChange={onCountryChange}
            options={countries.map(c => ({ label: c.name, value: c.name }))}
          />
        </Form.Item>
      </Col>
      <Col span={8}>
        <Form.Item {...restField} name={[...namePrefix, 'state']} label="State">
          <Select 
            showSearch 
            placeholder="Select State"
            onChange={onStateChange}
            options={states.map(s => ({ label: s.name, value: s.name }))}
            disabled={!selectedCountry}
          />
        </Form.Item>
      </Col>
      <Col span={8}>
        <Form.Item {...restField} name={[...namePrefix, 'city']} label="City">
          <Select 
            showSearch 
            placeholder="Select City"
            options={cities.map(c => ({ label: c.name, value: c.name }))}
            disabled={!selectedState}
          />
        </Form.Item>
      </Col>
    </>
  );
}
