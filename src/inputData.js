// Sample input with the key renamed to 'dynamicOptions'.
export const input = [
  {
    "placeholder": "Enter your name",
    "title": "Full Name",
    "required": true,
    "type": "textField",
    "id": "A"
  },
  {
    "placeholder": "Enter your email",
    "title": "Email Address",
    "required": true,
    "type": "textField",
    "id": "B",
    "depends_on": ["A"]
  },
  {
    "id": "C",
    "type": "inputGroup",
    "title": "Contact Information",
    "children": [
      {
        "id": "C1",
        "type": "inputGroup",
        "title": "Phone Number",
        "children": [
          {
            "id": "C11",
            "type": "dropdown",
            "title": "Country Code",
            "required": true,
            "options": [
              { "label": "+1 (USA)", "value": "+1" },
              { "label": "+91 (India)", "value": "+91" }
            ],
            "defaultValue": "+91"
          },
          {
            "id": "C12",
            "type": "textField",
            "title": "Phone number",
            "placeholder": "Phone number",
            "required": true
          }
        ]
      },
      {
        "id": "dynamic_control",
        "type": "dropdown",
        "title": "What information do you want to provide?",
        "options": [
          { "label": "Social Media", "value": "social" },
          { "label": "Company Details", "value": "company" }
        ],
        "defaultValue": "social"
      },
      {
        "id": "C2",
        "type": "dynamicGroup",
        "title": "Dynamic Additional Info",
        "depends_on": ["dynamic_control"],
        "dynamicOptions": `
          function(response) {
            const selection = response?.C?.dynamic_control;

            if (selection === 'social') {
              return [
                {
                  "id": "twitter_handle",
                  "type": "textField",
                  "title": "Twitter Handle",
                  "placeholder": "@username"
                },
                {
                  "id": "linkedin_url",
                  "type": "textField",
                  "title": "LinkedIn Profile URL",
                  "placeholder": "https://linkedin.com/in/..."
                }
              ];
            } else if (selection === 'company') {
              return [
                {
                  "id": "company_name",
                  "type": "textField",
                  "title": "Company Name"
                },
                {
                  "id": "company_size",
                  "type": "dropdown",
                  "title": "Company Size",
                  "options": [
                    {"label": "1-10 employees", "value": "small"},
                    {"label": "11-50 employees", "value": "medium"},
                    {"label": "51+ employees", "value": "large"}
                  ]
                },
                {
                    "id": "is_remote",
                    "type": "checkbox",
                    "title": "Is the company fully remote?"
                }
              ];
            }
            return [];
          }
        `
      }
    ]
  }
];