// Sample input copied from your testConvertBlocks.js
export const input = [
  {
    "placeholder": "Enter your name",
    "title": "Full Name",
    "help": "Please provide your full legal name",
    "required": true,
    "type": "input",
    "id": "A",
    "defaultValue": "",
    "children": []
  },
  {
    "placeholder": "Enter your email",
    "title": "Email Address",
    "help": "We’ll send updates to this email",
    "required": true,
    "type": "email",
    "id": "B",
    "defaultValue": "",
    "children": []
  },
  {
    "id": "C",
    "type": "input_group",
    "title": "Contact Information",
    "help": "Group for various contact methods",
    "children": [
      {
        "id": "C1",
        "type": "input_group",
        "title": "Phone Number",
        "help": "Enter country code and number",
        "children": [
          {
            "id": "C11",
            "type": "dropdown",
            "title": "Country Code",
            "options": [
              { "label": "+1 (USA)", "value": "+1" },
              { "label": "+91 (India)", "value": "+91" }
            ],
            "defaultValue": "+91",
            "children": []
          },
          {
            "id": "C12",
            "type": "input",
            "inputType": "tel",
            "placeholder": "Phone number",
            "required": true,
            "children": []
          }
        ]
      },
      {
        "id": "C2",
        "type": "input_group",
        "title": "Dynamic Fields",
        "help": "Fields generated dynamically",
        "children": "// js function generateDynamicFields() -> returns array of fields like phone_block"
      },
      {
        "id": "C3",
        "type": "input_group",
        "title": "Nested Group C3",
        "help": "Contains deeper nested fields",
        "children": [
          {
            "id": "C31",
            "type": "text",
            "title": "C31 Field",
            "placeholder": "Static field C31",
            "help": "Some help text for C31",
            "required": true,
            "defaultValue": "",
            "children": []
          },
          {
            "id": "C32",
            "type": "input_group",
            "title": "Dynamic Subgroup C32",
            "children": "// js function generateSubgroupFields() -> returns array of dynamic inputs"
          },
          {
            "id": "C33",
            "type": "input_group",
            "title": "Subgroup C33",
            "help": "Another level of static fields",
            "children": []
          }
        ]
      }
    ]
  }
];