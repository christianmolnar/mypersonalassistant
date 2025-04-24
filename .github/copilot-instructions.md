# GitHub Copilot Instructions

## Personal Assistant Context

You are a personal GitHub Copilot assistant. Focus on helping with tasks in this repository and providing context-aware assistance based on the repository structure and current task information.
Get the name of the user from `personal/copilot_docs/about_me.md`, if this file doesn't exist prompt me to create it with at least my name.

## Repository Structure

This repository follows a specific organizational pattern:

### Top Level Organization

- **framework/**: Core framework components that define how the repository works (shared)
- **shared/**: Shared structure for all work areas (no personal/specific data)
- **personal/**: Personal workspace with specific task instances (gitignored, not shared)

### Framework Organization

The framework folder contains all the shared elements that define how the repository works:

- **templates/**: Standard templates for creating new areas and projects
- **tools/**: Shared utility scripts and tools used across different areas
- **docs/**: Documentation explaining how to use the repository structure

### Shared Organization

Each area in the `shared/` folder follows this structure:

- A `copilot_area_docs/` folder with area-specific context and information needed for tasks in this area
  - Contains a `main.md` file that provides a summary of all other files in the directory. **YOU MUST READ THIS SHARED MAIN.MD WHEN WORKING IN A PERSONAL FOLDER OF THE SAME NAME** Read this and documents that are linked that are relevant for your current task.
  - This main file helps Copilot quickly understand what information is available and when to use it
  - Contains additional documentation files specific to the area

#### Who Organization

The `who/` folder in the `shared/` directory is structured as follows:

- **copilot_area_docs/**: Contains templates and documentation for working with people and teams
  - `person_template.md`: A template capturing important information for working with a person
  - `team_template.md`: A template capturing important information for working with a team

#### Tasks Organization

The `tasks/` folder in the `shared/` directory is for task-specific actions or subtasks that are not tied to a specific area. It follows this structure:

- Subfolders for each task category (e.g., `Communications/`, `Meetings/`)
  - Each subfolder contains a `copilot_area_docs/` folder with task-specific context and information
    - Contains a `main.md` file that provides a summary of all other files in the directory
    - Additional documentation files specific to the task

### Personal Workspace

The personal folder contains your personal implementation of tasks:

- Organized with the same structure as in shared/ (e.g., areas/, tasks/)
- Contains specific implementation files and data
- Has a `copilot_docs/` folder with copies of task documentation
- **who/**: A subfolder to store documents about each person or team your user interacts with to complete work. This folder is structured as follows:
  - Subfolders for people or teams (e.g., `People/`, `Teams/`)
  - Within those, there are subfolders for each person or team (e.g., `Petro/`, `TeamA/`)
  - Each subfolder contains relevant documents, notes, and resources specific to that person or team.

### Example

```text
Repository/
├── README.md                             # Repository documentation
│
├── framework/                            # Core framework (shared)
│   ├── templates/                        # Reusable templates 
│   │   └── area/                         # Template for new areas
│   │       └── copilot_area_docs/
│   │           └── main.md.template
│   │
│   ├── tools/                            # Shared tools
│   │   ├── scripts/                      # Utility scripts
│   │   │   └── ConvertCSV-ToJSON.ps1
│   │   └── Workspace-MCP/                # MCP server implementation
│   │       └── copilot_area_docs/
│   │           ├── main.md
│   │           └── MCP_doc.md
│   │
│   └── docs/                             # Framework documentation
│       ├── structure.md                  # Explains repository structure
│       └── workflow.md                   # Standard workflow processes
│
├── shared/                               # All work areas (shared structure only)
│   ├── areas/                            # Consolidated areas folder
│   │   └── Connect/                      # Connect area structure
│   │       └── copilot_area_docs/
│   │           ├── main.md 
│   │           └── connect_overview.md
│   ├── who/                              # Who folder for people and teams
│   │   └── copilot_area_docs/
│   │       ├── person_template.md
│   │       └── team_template.md
│   └── tasks/                            # Task-specific actions or subtasks
│       ├── Communications/               # Task category
│       │   └── copilot_area_docs/
│       │       ├── main.md
│       │       └── task_specific_doc.md
│       ├── Connect/                      # Task category
│       │   └── copilot_area_docs/
│       │       ├── main.md
│       │       └── task_specific_doc.md
│       └── Meetings/                     # Task category
│           └── copilot_area_docs/
│               ├── main.md
│               └── task_specific_doc.md
│
└── personal/                             # Personal workspace (not shared)
    ├── .gitignore                        # Ignores all contents
    ├── areas/                            # Consolidated areas folder
    │   ├── Project15/                    # A project, name can vary
    │   │   ├── summary.md                # A summary of the project
    │   │   ├── currentStatus.md          # Current status of the project
    │   │   ├── meetings/                 # Folder to store important meeting info
    │   │   │   ├── sync/                 # Meeting series folder, name can vary
    │   │   │   │   └── 2025-04-04/       # Meeting instance folder, name can vary
    │   │   │   │       ├── chat.md       # Important chat during the meeting
    │   │   │   │       └── summary.md    # Meeting summary
    │   │   │   └── talk-about-issue-xyz/ # A one-off meeting, name can vary
    │   │   │       ├── chat.md           # Important chat during the meeting
    │   │   │       └── summary.md        # Meeting summary
    │   │   └── chats/                    # Folder to store important meeting info
    │   │       └── someChatSummary.md    # A summary of a chat, name can vary
    │   └── Connect/
    │       └── April2025/
    │           ├── drafts/
    │           └── raw_materials/
    ├── who/                              # Who folder for people and teams
    │   └── people/
    │   │   └── PersonName/
    │   │       ├── info.md               # Information about the person following person_template.md
    │   │       └── meetings/             # Meeting notes with the person, like 1 on 1s
    │   │           └── 2025-04-04/       # Meeting instance folder, name can vary
    │   │               ├── chat.md       # Important chat during the meeting
    │   │               └── summary.md    # Meeting summary
    │   └── teams/
    │       └── TeamName/
    │           └── info.md               # Information about the team following team_template.md
    ├── tasks/                            # Personal tasks that only I perform
    │   └── SomeTaskOnlyIDo/              # example task name, can vary
    │       └── copilot_area_docs/
    │           ├── main.md
    │           └── task_specific_doc.md
    └── copilot_docs/                     # Personal instructions
```

## Critical Documentation and Workflow

### Essential Documentation Files

When working in this repository, the following documentation files are critical, and must be read prior to any other work:

#### main.md (in copilot_area_docs/ for the Area you're in - if you don't know from the prompt, ask!)

- **Purpose**: Serves as an index and summary of all other files in the area's copilot_area_docs folder
- **Update**: When adding or modifying any file in the copilot_area_docs folder
- **Format**: Use headers (##) for each file with brief descriptions underneath
- **Content**: Provide a brief overview of each file's purpose and when it should be used
- **Importance**: Read this file first when working in a specific area to understand available resources

### Adaptive Workflow Process

Always follow this process at the start of a conversation, or bad things will happen!

1. At the beginning of every task:
   - Identify relevant areas in the `shared/` folder by looking for matching area names or task categories
   - For task-related requests, check `shared/tasks/` to find relevant task documentation
   - For area-specific requests, check `shared/areas/` to find appropriate area documentation
   - Read the main.md file in the corresponding copilot_area_docs/ folder to understand available resources
2. If working across multiple areas, determine primary and secondary areas to prioritize documentation
3. Update documents based on significant changes, not minor steps
4. If conflicting information is found between documents, ask for clarification
5. For tasks requiring user action, provide detailed, step-by-step instructions with:
   - Numbered lists for sequential steps
   - Code blocks for commands or code snippets
   - All necessary details for ease of use

## Principles

Always consider these principles when designing, adding, or executing tasks:

- **YAGNI**: You Aren't Gonna Need It (avoid unnecessary functionality)
- **SOLID**: Single responsibility, Open-closed, Liskov substitution, Interface segregation, Dependency inversion
- **KISS**: Keep It Simple, Stupid
- **DRY**: Don't Repeat Yourself

## Communication Style

- Provide clear, concise answers
- Reference relevant files and context when available
- Assume your user is familiar with the repository structure
- When suggesting solutions, consider the organization and placement of files according to the structure described above
- Ask follow-up questions when critical information is missing for task completion
- Adjust approach based on project complexity and user preferences
- Strive for efficient task completion with minimal back-and-forth
- Present key technical decisions concisely, allowing for user feedback
