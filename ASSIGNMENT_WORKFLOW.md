# Assignment Feature with AI Detection

## What This Feature Does

This assignment feature provides educators with a **Google Classroom-like file submission system** enhanced with **AI-powered content detection** to identify potentially AI-generated work.

### 🎯 **Core Purpose**
Help educators maintain academic integrity by automatically detecting AI-generated content in student submissions while providing a seamless assignment distribution and collection workflow.

### 📋 **Key Capabilities**

**For Educators:**
- ✅ Create file upload assignments with custom requirements (file types, size limits, due dates)
- ✅ Generate shareable assignment links (like Google Classroom)
- ✅ Automatically analyze all submissions using Gemini AI
- ✅ View AI detection results with confidence scores (0-100%)
- ✅ Get detailed analysis explaining why content was flagged
- ✅ Review submissions in a comprehensive dashboard
- ✅ Export results for record-keeping

**For Students:**
- ✅ Access assignments via simple share links (no account required)
- ✅ Upload files with drag-and-drop interface
- ✅ Get instant feedback on file validation
- ✅ See submission status and confirmation

**AI Detection Features:**
- 🧠 **Text Analysis** - Detects AI writing patterns, generic phrases, unnatural flow
- 👁️ **Image Analysis** - Distinguishes handwritten content from AI-generated images/art
- 📊 **Confidence Scoring** - Provides percentage confidence in AI detection
- 🎯 **Pattern Recognition** - Identifies specific indicators of AI generation
- ⚡ **Real-time Processing** - Analyzes files immediately after upload

### 🎨 **Use Cases**

1. **Essay Submissions** - Detect AI-written essays, reports, and written assignments
2. **Handwriting Assignments** - Verify authentic handwritten work vs digitally created content
3. **Creative Projects** - Identify AI-generated art, designs, or creative writing
4. **Code Submissions** - Flag AI-assisted programming assignments
5. **Research Papers** - Check for AI-generated research content

### 🔒 **Academic Integrity Benefits**

- **Proactive Detection** - Catch AI usage before grading
- **Evidence-Based** - Detailed reasoning for each detection
- **Graduated Response** - Risk-based flagging (High/Medium/Low confidence)
- **Documentation** - Complete audit trail for academic misconduct cases
- **Fair Assessment** - Helps ensure all students are evaluated equally

This feature transforms traditional file submission into an intelligent academic integrity monitoring system.

## System Architecture Diagram

```mermaid
graph TB
    subgraph "Educator Flow"
        A[Educator Login] --> B[Create Assignment]
        B --> C{Assignment Details}
        C --> D[Set File Requirements]
        C --> E[Set Due Date]
        C --> F[Add Instructions]
        D --> G[Generate Share Code]
        E --> G
        F --> G
        G --> H[Publish Assignment]
        H --> I[Share Link with Students]
    end

    subgraph "Student Flow"
        J[Student Access Link] --> K{Assignment Available?}
        K -->|No| L[Assignment Not Found]
        K -->|Yes| M[View Assignment Details]
        M --> N[Upload File]
        N --> O{File Valid?}
        O -->|No| P[Show Error]
        O -->|Yes| Q[File Saved]
        P --> N
        Q --> R[Trigger AI Analysis]
    end

    subgraph "AI Analysis Flow"
        R --> S{File Type?}
        S -->|Image| T[Gemini Vision Analysis]
        S -->|Text| U[Gemini Text Analysis]
        T --> V[Detect Handwriting vs AI Art]
        U --> W[Detect AI Writing Patterns]
        V --> X[Generate Analysis Report]
        W --> X
        X --> Y{Analysis Complete?}
        Y -->|Success| Z[Update Submission Status]
        Y -->|Error| AA[Mark as Error]
        Z --> BB[Store Analysis Results]
        AA --> BB
    end

    subgraph "Educator Review Flow"
        BB --> CC[Educator Dashboard]
        CC --> DD[View All Submissions]
        DD --> EE[Review AI Analysis]
        EE --> FF{Action Required?}
        FF -->|Yes| GG[Contact Student]
        FF -->|No| HH[Continue Monitoring]
        GG --> II[Document Decision]
        HH --> JJ[Export Results]
    end

    subgraph "Database Layer"
        KK[(assignments)]
        LL[(assignment_submissions)]
        MM[(ai_analysis_results)]
        NN[(users)]
        OO[(teams)]
    end

    B --> KK
    Q --> LL
    BB --> MM
    A --> NN
    A --> OO
```

## Detailed Component Flow

```mermaid
sequenceDiagram
    participant E as Educator
    participant API as API Server
    participant DB as Database
    participant FS as File System
    participant AI as Gemini AI
    participant S as Student

    Note over E,S: Assignment Creation Phase
    E->>API: POST /api/assignments/create
    API->>DB: Insert assignment record
    DB-->>API: Return assignment ID & share code
    API-->>E: Assignment created successfully

    Note over E,S: Student Submission Phase
    S->>API: GET /api/assignments/share/{shareCode}
    API->>DB: Fetch assignment details
    DB-->>API: Return assignment info
    API-->>S: Show assignment page

    S->>API: POST /api/assignments/upload (with file)
    API->>FS: Save file to uploads/assignments/
    FS-->>API: File saved successfully
    API->>DB: Insert submission record
    DB-->>API: Return submission ID
    API-->>S: Upload successful

    Note over E,S: AI Analysis Phase
    API->>API: Trigger analysis (automatic)
    API->>AI: Analyze file content

    alt Image File
        AI->>AI: Vision analysis for handwriting detection
        AI-->>API: Handwriting vs AI-generated result
    else Text File
        AI->>AI: Text analysis for AI writing patterns
        AI-->>API: Human vs AI-written result
    end

    API->>DB: Store analysis results
    DB-->>API: Analysis saved
    API->>DB: Update submission status to 'analyzed'

    Note over E,S: Educator Review Phase
    E->>API: GET /api/assignments/{id}
    API->>DB: Fetch submissions with analysis
    DB-->>API: Return complete data
    API-->>E: Show dashboard with AI results
```

## Database Schema Relationships

```mermaid
erDiagram
    USERS ||--o{ ASSIGNMENTS : creates
    USERS ||--o{ ASSIGNMENT_SUBMISSIONS : submits
    ASSIGNMENTS ||--o{ ASSIGNMENT_SUBMISSIONS : receives
    ASSIGNMENT_SUBMISSIONS ||--|| AI_ANALYSIS_RESULTS : has
    TEAMS ||--o{ ASSIGNMENTS : contains
    USERS ||--o{ USER_TEAMS : belongs_to
    TEAMS ||--|| USER_TEAMS : has

    USERS {
        string id PK
        string name
        string email UK
        string googleId
        boolean isActive
    }

    ASSIGNMENTS {
        string id PK
        string title
        text description
        text instructions
        datetime dueDate
        string allowedFileTypes
        integer maxFileSize
        string createdBy FK
        string teamId FK
        string shareCode UK
        boolean isPublished
        datetime createdAt
        datetime updatedAt
    }

    ASSIGNMENT_SUBMISSIONS {
        string id PK
        string assignmentId FK
        string studentId FK
        string studentName
        string studentEmail
        string fileName
        string originalFileName
        string filePath
        integer fileSize
        string mimeType
        string status
        datetime submittedAt
        datetime analyzedAt
    }

    AI_ANALYSIS_RESULTS {
        string id PK
        string submissionId FK
        string analysisType
        boolean isAiGenerated
        integer confidenceScore
        text detectedPatterns
        text aiDetectionReason
        integer handwritingConfidence
        text textExtracted
        datetime createdAt
    }

    TEAMS {
        string id PK
        string name
        string logo
        datetime createdAt
        string createdBy FK
    }

    USER_TEAMS {
        string userId FK
        string teamId FK
        string role
        boolean isSuperAdmin
        string status
    }
```

## AI Detection Logic Flow

```mermaid
flowchart TD
    A[File Upload] --> B{File Type Check}

    B -->|Image File| C[Gemini Vision API]
    B -->|Text File| D[Gemini Text API]
    B -->|Other| E[Basic File Analysis]

    subgraph "Image Analysis"
        C --> F[Analyze Visual Content]
        F --> G{Detect Handwriting?}
        G -->|Yes| H[Check Pen Pressure & Irregularities]
        G -->|No| I[Check Digital Artifacts]
        H --> J[Calculate Handwriting Confidence]
        I --> K[Calculate AI Generation Confidence]
        J --> L[Generate Image Analysis Report]
        K --> L
    end

    subgraph "Text Analysis"
        D --> M[Analyze Text Patterns]
        M --> N{AI Writing Patterns?}
        N -->|Yes| O[Flag AI Indicators]
        N -->|No| P[Flag Human Indicators]
        O --> Q[- Generic phrases<br/>- Perfect grammar<br/>- Repetitive structure<br/>- Lack of personal voice]
        P --> R[- Personal examples<br/>- Natural inconsistencies<br/>- Unique expressions<br/>- Emotional undertones]
        Q --> S[Calculate AI Confidence Score]
        R --> S
        S --> T[Generate Text Analysis Report]
    end

    E --> U[Basic Metadata Analysis]
    U --> V[Generate Basic Report]

    L --> W[Store Analysis Results]
    T --> W
    V --> W

    W --> X[Update Submission Status]
    X --> Y[Notify Educator Dashboard]

    Y --> Z{Confidence > 80%?}
    Z -->|Yes| AA[Flag as High Risk]
    Z -->|No| BB{Confidence > 60%?}
    BB -->|Yes| CC[Flag as Medium Risk]
    BB -->|No| DD[Mark as Low Risk]

    AA --> EE[Send Alert to Educator]
    CC --> FF[Add to Review Queue]
    DD --> GG[Normal Processing]
```

## User Interface Flow

```mermaid
journey
    title Assignment Workflow User Journey

    section Educator Creates Assignment
      Login to Dashboard: 5: Educator
      Navigate to Assignments: 4: Educator
      Click Create Assignment: 5: Educator
      Fill Assignment Details: 4: Educator
      Set File Requirements: 4: Educator
      Publish Assignment: 5: Educator
      Copy Share Link: 5: Educator

    section Student Submits Work
      Receive Assignment Link: 3: Student
      Open Assignment Page: 4: Student
      Read Instructions: 4: Student
      Upload File: 3: Student
      Wait for Confirmation: 2: Student
      See Success Message: 5: Student

    section AI Analysis Process
      File Processing: 1: System
      Gemini API Call: 1: System
      Pattern Detection: 1: System
      Generate Report: 1: System
      Store Results: 1: System

    section Educator Reviews Results
      Open Dashboard: 5: Educator
      View Submissions: 4: Educator
      Check AI Analysis: 3: Educator
      Review Flagged Items: 2: Educator
      Take Action if Needed: 3: Educator
      Export Results: 4: Educator
```

## API Endpoints Overview

```mermaid
graph LR
    subgraph "Assignment Management"
        A[POST /api/assignments/create]
        B[GET /api/assignments/list]
        C[GET /api/assignments/{id}]
        D[PUT /api/assignments/{id}]
        E[DELETE /api/assignments/{id}]
    end

    subgraph "File & Submissions"
        F[POST /api/assignments/upload]
        G[GET /api/assignments/share/{shareCode}]
    end

    subgraph "AI Analysis"
        H[POST /api/assignments/analyze]
    end

    subgraph "Frontend Pages"
        I[/dashboard/assignments/create]
        J[/dashboard/assignments/library]
        K[/dashboard/assignments/view/{id}]
        L[/assignment/{shareCode}]
    end

    I --> A
    J --> B
    K --> C
    L --> G
    L --> F
    F --> H
```

## Security & Validation Flow

```mermaid
flowchart TD
    A[File Upload Request] --> B[Authentication Check]
    B --> C{User Authenticated?}
    C -->|No| D[Return 401 Unauthorized]
    C -->|Yes| E[Validate File Size]
    E --> F{Size Valid?}
    F -->|No| G[Return File Too Large Error]
    F -->|Yes| H[Validate File Type]
    H --> I{Type Allowed?}
    I -->|No| J[Return Invalid Type Error]
    I -->|Yes| K[Virus Scan (Future)]
    K --> L[Save to Secure Directory]
    L --> M[Generate Unique Filename]
    M --> N[Store Database Record]
    N --> O[Return Success]

    D --> P[Log Security Event]
    G --> P
    J --> P
    O --> Q[Trigger AI Analysis]
```

This comprehensive diagram set shows the complete flow of the assignment system with AI detection, from creation to analysis and review.