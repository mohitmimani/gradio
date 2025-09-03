#!/bin/bash

# Script to generate PNG images from all mermaid diagrams
# Requires: mermaid-cli (mmdc) to be installed globally
# Install with: npm install -g @mermaid-js/mermaid-cli

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🎨 Mermaid Diagram PNG Generator${NC}"
echo "======================================"

# Check if mermaid-cli is installed
if ! command -v mmdc &> /dev/null; then
    echo -e "${RED}❌ mermaid-cli (mmdc) is not installed!${NC}"
    echo -e "${YELLOW}📦 To install, run:${NC} npm install -g @mermaid-js/mermaid-cli"
    echo -e "${YELLOW}📖 Or visit:${NC} https://github.com/mermaid-js/mermaid-cli"
    exit 1
fi

# Create output directory
OUTPUT_DIR="./png-output"
mkdir -p "$OUTPUT_DIR"

echo -e "${GREEN}✅ Found mermaid-cli installed${NC}"
echo -e "${YELLOW}📁 Output directory:${NC} $OUTPUT_DIR"
echo ""

# Function to extract mermaid code from markdown
extract_mermaid() {
    local file="$1"
    local temp_file="temp_mermaid.mmd"
    
    # Extract content between ```mermaid and ```
    sed -n '/```mermaid/,/```/p' "$file" | sed '1d;$d' > "$temp_file"
    echo "$temp_file"
}

# Process each diagram file
diagram_files=(
    "1-quiz-creation-flow.md:Quiz_Creation_Flow"
    "2-student-quiz-experience.md:Student_Quiz_Experience"
    "3-analytics-dashboard-architecture.md:Analytics_Dashboard_Architecture"
    "4-anti-cheat-monitoring-system.md:Anti_Cheat_Monitoring_System"
    "5-sharing-distribution-workflow.md:Sharing_Distribution_Workflow"
)

success_count=0
total_count=${#diagram_files[@]}

for diagram in "${diagram_files[@]}"; do
    # Split filename and output name
    IFS=':' read -ra PARTS <<< "$diagram"
    input_file="${PARTS[0]}"
    output_name="${PARTS[1]}"
    
    if [ -f "$input_file" ]; then
        echo -e "${YELLOW}🔄 Processing:${NC} $input_file"
        
        # Extract mermaid code
        temp_file=$(extract_mermaid "$input_file")
        
        if [ -s "$temp_file" ]; then
            # Generate PNG with high quality settings
            if mmdc -i "$temp_file" -o "$OUTPUT_DIR/${output_name}.png" \
                --width 1200 --height 800 --backgroundColor white \
                --theme default --scale 2 2>/dev/null; then
                
                echo -e "${GREEN}✅ Generated:${NC} $OUTPUT_DIR/${output_name}.png"
                ((success_count++))
            else
                echo -e "${RED}❌ Failed to generate:${NC} ${output_name}.png"
            fi
        else
            echo -e "${RED}❌ No mermaid code found in:${NC} $input_file"
        fi
        
        # Cleanup
        rm -f "$temp_file"
    else
        echo -e "${RED}❌ File not found:${NC} $input_file"
    fi
    echo ""
done

echo "======================================"
echo -e "${GREEN}🎯 Summary:${NC} $success_count/$total_count diagrams generated successfully"

if [ $success_count -eq $total_count ]; then
    echo -e "${GREEN}🎉 All diagrams generated successfully!${NC}"
    echo -e "${YELLOW}📁 Check the '$OUTPUT_DIR' folder for your PNG files${NC}"
    
    # List generated files
    echo -e "${YELLOW}📋 Generated files:${NC}"
    ls -la "$OUTPUT_DIR"/*.png 2>/dev/null | awk '{print "   • " $9}' | sed 's|.*/||'
else
    echo -e "${YELLOW}⚠️  Some diagrams failed to generate. Check the errors above.${NC}"
fi

echo -e "${YELLOW}💡 Tip:${NC} Use these PNG files in your presentations for best quality!"