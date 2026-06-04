// Maps server validation errors array to AntD form fields
// Server returns: [{ field: 'price_range_min', message: 'Must be positive' }]
// AntD expects: form.setFields([{ name: 'price_range_min', errors: ['Must be positive'] }])

const useFormErrors = (form) => {
  const applyServerErrors = (error) => {
    const serverErrors = error?.response?.data?.errors;
    if (!serverErrors || !Array.isArray(serverErrors)) return;

    const fieldErrors = serverErrors
      .filter(e => e.field)
      .map(e => ({ name: e.field, errors: [e.message] }));

    if (fieldErrors.length > 0) {
      form.setFields(fieldErrors);
    }
  };

  return { applyServerErrors };
};

export default useFormErrors;
