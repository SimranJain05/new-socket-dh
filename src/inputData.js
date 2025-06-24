// Sample input copied from your testConvertBlocks.js
export const input = [
  {
    "id": "dummyDependency",
    "type": "textField",
    "title": "Dummy Dependency",
    "help": "Type 'foo' or 'bar' to see different options",
    "required": false,
    "defaultValue": ""
  },
  {
    "id": "dummyDynamic",
    "type": "dropdown",
    "title": "Dummy Dynamic Dropdown",
    "help": "Options depend on Dummy Dependency field",
    "dynamicOptions": "async function(userResponse) { await new Promise(res => setTimeout(res, 500)); console.log('api called'); if (userResponse.dummyDependency === 'foo') return [{ label: 'Foo Option 1', value: 'foo1' }, { label: 'Foo Option 2', value: 'foo2' }]; if (userResponse.dummyDependency === 'bar') return [{ label: 'Bar Option 1', value: 'bar1' }, { label: 'Bar Option 2', value: 'bar2' }]; return []; }",
    "defaultValue": "",
    "allowMultiSelect": false
  },
  {
    "placeholder": "Enter your name",
    "title": "Full Name",
    "help": "Please provide your full legal name",
    "required": true,
    "type": "textField",
    "id": "A",
    "defaultValue": ""
  },
  {
    "placeholder": "Enter your email",
    "title": "Email Address",
    "help": "We’ll send updates to this email",
    "required": true,
    "type": "textField",
    "id": "B",
    "defaultValue": "",
    "depends_on": ["A"]
  },
  {
    "id": "C",
    "type": "inputGroup",
    "title": "Contact Information",
    "help": "Group for various contact methods",
    "children": [
      {
        "id": "C1",
        "type": "inputGroup",
        "title": "Phone Number",
        "help": "Enter country code and number",
        "children": [
          {
            "id": "C11",
            "type": "dropdown",
            "title": "Country Code",
            "help": "Select your country code",
            "required": true,
            "options": [
              { "label": "+1 (USA)", "value": "+1" },
              { "label": "+91 (India)", "value": "+91" }
            ],
            "defaultValue": "+91",
            "allowMultiSelect": false
          },
          {
            "id": "C12",
            "type": "textField",
            "title": "Phone number",
            "help": "Enter your phone number",
            "placeholder": "Phone number",
            "required": true,
            "defaultValue": ""
          }
        ]
      },
      {
        "id": "C2",
        "type": "inputGroup",
        "title": "Dynamic Fields",
        "help": "Fields generated dynamically",
        "children": []
      },
      {
        "id": "C3",
        "type": "inputGroup",
        "title": "Nested Group C3",
        "help": "Contains deeper nested fields",
        "children": [
          {
            "id": "C31",
            "type": "textField",
            "title": "C31 Field",
            "placeholder": "Static field C31",
            "help": "Some help text for C31",
            "required": true,
            "defaultValue": ""
          },
          {
            "id": "C32",
            "type": "inputGroup",
            "title": "Dynamic Subgroup C32",
            "children": []
          },
          {
            "id": "C33",
            "type": "inputGroup",
            "title": "Subgroup C33",
            "help": "Another level of static fields",
            "children": []
          }
        ]
      }
    ]
  }
];