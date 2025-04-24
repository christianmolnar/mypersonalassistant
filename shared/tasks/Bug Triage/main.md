# Bug Triage Task Area

This task area is used for managing and processing bugs that have been identified using the `ado-query` tool in the Workspace MCP server.

Use the files and processes within this directory to track the triage status, assignees, and resolution of these bugs.

## Files in this Directory

### [triage_process.md](./triage_process.md)
Outlines the step-by-step workflow for triaging bugs found via the `ado-query` tool. Describes how to set fields, assign owners, and notify team members.

### [triage_queries.md](./triage_queries.md)
Contains the specific Azure DevOps queries (WIQL or Query IDs) used to identify bugs requiring triage.

### [field_definitions.md](./field_definitions.md)
Defines the standard values and guidelines for setting Priority, Triage State, and Iteration Path fields. Also lists the team members eligible for bug assignment.

### [field_reference_names.md](./field_reference_names.md)
Lists the Azure DevOps field reference names (e.g., `System.Title`) used in the 'CLE' project, derived from query results. Essential for using the `ado-update` tool correctly.

### [communication_templates.md](./communication_templates.md)
Provides templates for standardized communications, such as Teams messages notifying assignees about newly assigned bugs.
