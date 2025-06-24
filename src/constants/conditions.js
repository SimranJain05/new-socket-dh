// constants/conditions.js

// A list of conditions that require a value input field.
export const conditionsRequiringValue = [
  'equals', 'notEquals',
  'greaterThan', 'lessThan',
  'greaterThanOrEqual', 'lessThanOrEqual',
  'contains', 'doesNotContain',
  'startsWith', 'endsWith'
];

// Group conditions by type for the two-step selection process.
export const conditionGroups = {
  'General': [
    { value: 'notEmpty', label: 'Is not empty' },
    { value: 'isEmpty', label: 'Is empty' },
  ],
  'Text': [
    { value: 'equals', label: 'Equals' },
    { value: 'notEquals', label: 'Does not equal' },
    { value: 'contains', label: 'Contains' },
    { value: 'doesNotContain', label: 'Does not contain' },
    { value: 'startsWith', label: 'Starts with' },
    { value: 'endsWith', label: 'Ends with' },
  ],
  'Number': [
    { value: 'greaterThan', label: 'Greater than' },
    { value: 'lessThan', label: 'Less than' },
    { value: 'greaterThanOrEqual', label: 'Greater than or equal to' },
    { value: 'lessThanOrEqual', label: 'Less than or equal to' },
  ],
  'Boolean': [
    { value: 'isTrue', label: 'Is true' },
    { value: 'isFalse', label: 'Is false' },
  ],
  'Custom': [
    { value: 'customJs', label: 'Custom JavaScript' },
  ]
};
