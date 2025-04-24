# Bug Triage Process

This document outlines the steps involved in the bug triage process, typically triggered by a prompt like "run triage".

1.  **Run Triage Query**: Execute the predefined triage query stored in `triage_queries.md` using the `ado-query` tool.
2.  **Iterate Through Bugs**: For each bug returned by the query:
    *   **Review Bug Details**: Examine the bug's title, description, and current state.
    *   **Determine Updates**: Based on the review and guidelines in `field_definitions.md`, determine the necessary updates for the below fields, **ALWAYS PROMPT ME TO SEE IF THE UPDATES ARE CORRECT BEFORE MOVING ON TO THE NEXT STEP**:
        *   Priority (`Microsoft.VSTS.Common.Priority`)
        *   Assigned Owner (`System.AssignedTo`)
        *   Iteration Path (`System.IterationPath`)
        *   Triage State (`Office.Triage.TriageState`) (**Note**: This field may only exist in the `office.visualstudio.com` instance. Ignore if not present.)
        *   Optional Comment (`System.History`)
    *   **Apply Updates**: Use the `ado-update` tool to apply all determined updates and the optional comment in a single operation for the current bug ID. *Proceed automatically to the next step without prompting.*
3.  **Notify Assignees**: After processing all bugs, generate Teams messages for each team member who received assignments, using the templates in `communication_templates.md`. Collate bugs per assignee.
4.  **Confirm Completion**: Indicate that the triage process is complete.
