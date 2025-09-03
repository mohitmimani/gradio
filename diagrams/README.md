# Gradio Quiz Platform - System Flow Diagrams

This folder contains 5 key mermaid diagrams that illustrate the core workflows of the Gradio Quiz Platform. These diagrams are optimized for presentation slides and showcase the platform's comprehensive features.

## Diagram Overview

### 1. **Quiz Creation Flow** (`1-quiz-creation-flow.md`)
- Shows the three paths for quiz creation: AI-generated, template-based, and manual
- Illustrates the complete workflow from educator login to published quiz
- Highlights key features like review/edit capabilities and automatic share code generation

### 2. **Student Quiz Experience** (`2-student-quiz-experience.md`) 
- Sequence diagram showing the complete student journey
- Demonstrates real-time anti-cheat monitoring throughout the quiz
- Shows data flow from quiz access to results display

### 3. **Analytics Dashboard Architecture** (`3-analytics-dashboard-architecture.md`)
- Illustrates the data processing pipeline for analytics
- Shows how different data sources feed into visualization components
- Demonstrates comprehensive reporting capabilities

### 4. **Anti-Cheat Monitoring System** (`4-anti-cheat-monitoring-system.md`)
- Details the security monitoring workflow
- Shows event detection, risk calculation, and response actions
- Illustrates the dynamic risk scoring system (Green/Yellow/Red)

### 5. **Sharing & Distribution Workflow** (`5-sharing-distribution-workflow.md`)
- Comprehensive view of quiz distribution methods
- Shows multiple sharing channels and student access paths
- Demonstrates analytics tracking and engagement metrics

## 🖼️ Generating PNG Images

### Quick Start
1. **Install mermaid-cli globally:**
   ```bash
   npm install -g @mermaid-js/mermaid-cli
   ```

2. **Generate all PNGs:**
   ```bash
   # Using Node.js script (recommended)
   cd diagrams
   node generate-png.js
   
   # Or using Bash script
   ./generate-png.sh
   
   # Or using npm script
   npm run generate
   ```

3. **Find your images:**
   - All PNG files will be in the `png-output/` folder
   - High-resolution (2400x1600) perfect for presentations
   - White background for professional look

### Alternative Methods
- **Online**: Copy mermaid code to [mermaid.live](https://mermaid.live/) and export
- **VS Code**: Use Mermaid Preview extension
- **CLI Direct**: `mmdc -i diagram.md -o output.png`

## Usage for Presentations

Each diagram includes:
- **High contrast colors** for better visibility (updated with Material Design colors)
- **White text on colored backgrounds** for maximum readability
- **Concise labels** that fit well in slides
- **Key features summary** below each diagram
- **Professional styling** suitable for business presentations

## Technical Highlights Demonstrated

- 🤖 **AI-powered quiz generation**
- 🛡️ **Real-time anti-cheat monitoring**
- 📊 **Comprehensive analytics dashboard**
- 📱 **Multi-channel distribution (QR codes, links, email)**
- 🎯 **Template-based quiz creation**
- 📈 **Performance tracking and reporting**

These diagrams effectively communicate the platform's value proposition and technical sophistication to stakeholders, investors, or potential users.