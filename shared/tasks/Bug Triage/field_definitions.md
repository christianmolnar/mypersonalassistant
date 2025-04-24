# Field Definitions for Bug Triage

This document defines the standard values and guidelines for setting specific fields during bug triage.

## Priority

*   **1 - Critical**: System down, blocking issue, major customer impact. Requires immediate attention.
*   **2 - High**: Significant feature malfunction, important customer impact. Address in the current sprint.
*   **3 - Medium**: Moderate issue, workaround available. Address in the next sprint or as capacity allows.
*   **4 - Low**: Minor issue, cosmetic, low impact. Address when time permits.

## Triage State

*Set the triage state for the bug. Valid options are:*

*   **Approved**: The bug has been reviewed and is ready for assignment/scheduling.
*   **More Info**: Further details are required before the bug can be fully triaged.
*   *(Leave blank if not yet reviewed or if another state applies outside this specific triage process)*

**Note**: This field may not exist if you are not using the `office.visualstudio.com` instance. If the field is not present, ignore this step.

## Assignable Team Members

*Assignable team members are defined by the individual folders within the `personal/who/people/` directory.*
*Refer to the `info.md` file within each person's folder for details like their ADO identity if needed.*

## Iteration Path

*   **Current Sprint**: Assign to the active sprint (e.g., `YourProject\Sprint 123`).
*   **Next Sprint**: Assign to the upcoming sprint (e.g., `YourProject\Sprint 124`).
*   **Backlog**: If not suitable for the current or next sprint.

*(Update sprint names/paths as needed)*
