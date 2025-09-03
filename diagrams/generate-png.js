#!/usr/bin/env node

/**
 * Mermaid Diagram PNG Generator
 * Generates high-quality PNG images from all mermaid diagrams in markdown files
 * 
 * Requirements:
 * - Node.js installed
 * - @mermaid-js/mermaid-cli installed globally: npm install -g @mermaid-js/mermaid-cli
 * 
 * Usage:
 * node generate-png.js
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
    outputDir: './png-output',
    width: 1200,
    height: 800,
    scale: 2,
    backgroundColor: 'white',
    theme: 'default'
};

// Diagram files mapping
const diagrams = [
    { file: '1-quiz-creation-flow.md', name: 'Quiz_Creation_Flow' },
    { file: '2-student-quiz-experience.md', name: 'Student_Quiz_Experience' },
    { file: '3-analytics-dashboard-architecture.md', name: 'Analytics_Dashboard_Architecture' },
    { file: '4-anti-cheat-monitoring-system.md', name: 'Anti_Cheat_Monitoring_System' },
    { file: '5-sharing-distribution-workflow.md', name: 'Sharing_Distribution_Workflow' }
];

console.log('🎨 Mermaid Diagram PNG Generator');
console.log('======================================');

// Check if mermaid-cli is installed
function checkMermaidCli() {
    try {
        execSync('mmdc --version', { stdio: 'ignore' });
        console.log('✅ Found mermaid-cli installed');
        return true;
    } catch (error) {
        console.log('❌ mermaid-cli (mmdc) is not installed!');
        console.log('📦 To install, run: npm install -g @mermaid-js/mermaid-cli');
        console.log('📖 Or visit: https://github.com/mermaid-js/mermaid-cli');
        return false;
    }
}

// Extract mermaid code from markdown file
function extractMermaidCode(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const mermaidRegex = /```mermaid\n([\s\S]*?)\n```/;
        const match = content.match(mermaidRegex);
        
        if (match && match[1]) {
            return match[1].trim();
        }
        return null;
    } catch (error) {
        console.error(`Error reading file ${filePath}:`, error.message);
        return null;
    }
}

// Generate PNG from mermaid code
async function generatePng(mermaidCode, outputPath) {
    return new Promise((resolve, reject) => {
        const tempFile = `temp_${Date.now()}.mmd`;
        
        try {
            // Write temporary mermaid file
            fs.writeFileSync(tempFile, mermaidCode);
            
            // Generate PNG using mermaid-cli
            const args = [
                '-i', tempFile,
                '-o', outputPath,
                '--width', config.width.toString(),
                '--height', config.height.toString(),
                '--backgroundColor', config.backgroundColor,
                '--theme', config.theme,
                '--scale', config.scale.toString()
            ];
            
            const mmdc = spawn('mmdc', args, { stdio: 'pipe' });
            
            let errorOutput = '';
            mmdc.stderr.on('data', (data) => {
                errorOutput += data.toString();
            });
            
            mmdc.on('close', (code) => {
                // Cleanup temp file
                try {
                    fs.unlinkSync(tempFile);
                } catch (e) {
                    // Ignore cleanup errors
                }
                
                if (code === 0) {
                    resolve(true);
                } else {
                    reject(new Error(`mermaid-cli exited with code ${code}: ${errorOutput}`));
                }
            });
            
        } catch (error) {
            // Cleanup temp file on error
            try {
                fs.unlinkSync(tempFile);
            } catch (e) {
                // Ignore cleanup errors
            }
            reject(error);
        }
    });
}

// Main function
async function main() {
    if (!checkMermaidCli()) {
        process.exit(1);
    }
    
    // Create output directory
    if (!fs.existsSync(config.outputDir)) {
        fs.mkdirSync(config.outputDir, { recursive: true });
    }
    
    console.log(`📁 Output directory: ${config.outputDir}`);
    console.log('');
    
    let successCount = 0;
    const totalCount = diagrams.length;
    
    for (const diagram of diagrams) {
        console.log(`🔄 Processing: ${diagram.file}`);
        
        if (!fs.existsSync(diagram.file)) {
            console.log(`❌ File not found: ${diagram.file}`);
            console.log('');
            continue;
        }
        
        const mermaidCode = extractMermaidCode(diagram.file);
        if (!mermaidCode) {
            console.log(`❌ No mermaid code found in: ${diagram.file}`);
            console.log('');
            continue;
        }
        
        const outputPath = path.join(config.outputDir, `${diagram.name}.png`);
        
        try {
            await generatePng(mermaidCode, outputPath);
            console.log(`✅ Generated: ${outputPath}`);
            successCount++;
        } catch (error) {
            console.log(`❌ Failed to generate: ${diagram.name}.png`);
            console.log(`   Error: ${error.message}`);
        }
        
        console.log('');
    }
    
    console.log('======================================');
    console.log(`🎯 Summary: ${successCount}/${totalCount} diagrams generated successfully`);
    
    if (successCount === totalCount) {
        console.log('🎉 All diagrams generated successfully!');
        console.log(`📁 Check the '${config.outputDir}' folder for your PNG files`);
        
        // List generated files
        console.log('📋 Generated files:');
        try {
            const files = fs.readdirSync(config.outputDir)
                .filter(file => file.endsWith('.png'))
                .sort();
            
            files.forEach(file => {
                console.log(`   • ${file}`);
            });
        } catch (error) {
            // Ignore listing errors
        }
    } else {
        console.log('⚠️  Some diagrams failed to generate. Check the errors above.');
    }
    
    console.log('💡 Tip: Use these PNG files in your presentations for best quality!');
}

// Run the script
main().catch(error => {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
});