// Sample input with the new dynamicChildren feature
export const input = [
    {
        "id": "repo_url",
        "type": "input",
        "title": "Repository URL",
        "label": "Git Repository URL",
        "placeholder": "https://github.com/user/repo.git",
        "required": true,
        "help": "The URL of the repository to be deployed."
    },
    {
        "id": "branch",
        "type": "input",
        "title": "Branch Name",
        "label": "Deployment Branch",
        "defaultValue": "main",
        "required": true
    },
    {
        "id": "deployment_environment",
        "type": "dropdown",
        "title": "Deployment Environment",
        "label": "Target Environment",
        "options": [
            { "label": "Staging", "value": "staging" },
            { "label": "Production", "value": "production" }
        ],
        "dependsOn": {
            "logic": "AND",
            "rules": [
                {
                    "fieldId": "repo_url",
                    "condition": "notEmpty",
                    "action": "disable"
                }
            ]
        },
        "help": "This field is enabled once a repository URL is provided."
    },
    {
        "id": "ci_cd_config",
        "type": "input_group",
        "title": "CI/CD Configuration",
        "children": [
            {
                "id": "has_ci_cd",
                "type": "checkbox",
                "title": "CI/CD Pipeline",
                "label": "Trigger a CI/CD pipeline"
            },
            {
                "id": "ci_cd_provider",
                "type": "dropdown",
                "title": "CI/CD Provider",
                "label": "Select a Provider",
                "options": [
                    { "label": "GitHub Actions", "value": "github_actions" },
                    { "label": "Jenkins", "value": "jenkins" },
                    { "label": "Custom Script", "value": "custom" }
                ],
                "dependsOn": {
                    "logic": "AND",
                    "rules": [
                        {
                            "fieldId": "has_ci_cd",
                            "condition": "isTrue",
                            "action": "hide"
                        }
                    ]
                }
            }
        ]
    },
    {
        "id": "custom_script_section",
        "type": "input_group",
        "title": "Custom Deployment Script",
        "help": "Define your custom deployment steps.",
        "dependsOn": {
            "logic": "AND",
            "rules": [
                {
                    "fieldId": "ci_cd_provider",
                    "condition": "equals",
                    "value": "custom",
                    "action": "hide"
                }
            ]
        },
        "children": [
            // ... static children ...
        ]
    },
    {
        "id": "deployment_strategy_group",
        "type": "input_group",
        "title": "Deployment Strategy",
        // ... dependsOn and children ...
    },
    // --- NEW DYNAMIC FIELD EXAMPLE ---
    {
        "id": "dynamic_notification_group",
        "type": "input_group",
        "title": "Dynamic Notification Settings",
        "help": "Settings change based on the selected environment.",
        "dependsOn": {
            "logic": "AND",
            "rules": [{
                "fieldId": "deployment_environment",
                "condition": "notEmpty",
                "action": "hide"
            }]
        },
        "children": [],
        "dynamicChildren": "const env = data['deployment_environment'];\n\nif (env === 'production') {\n  return [\n    { id: 'prod_email', type: 'email', label: 'Production On-Call Email', required: true },\n    { id: 'prod_pager', type: 'input', label: 'PagerDuty Key' }\n  ];\n} \n\nif (env === 'staging') {\n  return [\n    { id: 'staging_slack', type: 'input', label: 'Staging Slack Channel', defaultValue: '#dev-alerts' }\n  ];\n}\n\nreturn []; // Return empty array if no environment is selected or matches"
    },
    {
        "id": "trigger_deployment",
        "type": "button",
        "title": "Trigger Deployment"
    }
]