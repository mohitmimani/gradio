# Anti-Cheat Monitoring System

```mermaid
flowchart LR
    subgraph "Browser Events"
        A[Tab Switch]
        B[Copy/Paste]
        C[Right Click]
        D[Keyboard Shortcuts]
        E[Window Focus Loss]
        F[Fullscreen Exit]
    end
    
    subgraph "Detection Engine"
        G[Event Listeners]
        H[Activity Logger]
        I[Risk Calculator]
    end
    
    subgraph "Response Actions"
        J[Real-time Warnings]
        K[Risk Score Update]
        L[Activity Recording]
    end
    
    subgraph "Final Assessment"
        M{Risk Level}
        N[Low Risk - Green]
        O[Medium Risk - Yellow] 
        P[High Risk - Red]
    end
    
    A --> G
    B --> G
    C --> G
    D --> G
    E --> G
    F --> G
    
    G --> H
    H --> I
    H --> L
    
    I --> J
    I --> K
    I --> M
    
    M -->|<15%| N
    M -->|15-40%| O
    M -->|>70%| P
    
    style A fill:#d32f2f,color:#ffffff
    style B fill:#d32f2f,color:#ffffff
    style C fill:#d32f2f,color:#ffffff
    style D fill:#d32f2f,color:#ffffff
    style E fill:#d32f2f,color:#ffffff
    style F fill:#d32f2f,color:#ffffff
    
    style N fill:#388e3c,color:#ffffff
    style O fill:#f57c00,color:#ffffff
    style P fill:#d32f2f,color:#ffffff
```

**Monitoring Features:**
- Real-time suspicious activity detection
- Dynamic risk scoring algorithm
- Immediate visual feedback to students
- Comprehensive data for educator review