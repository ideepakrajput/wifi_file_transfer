#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🕒 Backdated Commit Generator${NC}\n"

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Not in a git repository. Initializing git...${NC}"
    git init
    echo -e "${GREEN}✅ Git repository initialized${NC}\n"
fi

# Generate last 7 days and display options
echo -e "${YELLOW}Select a date from the past 7 days:${NC}\n"

dates=()
for i in {1..7}; do
    date_str=$(date -d "$i days ago" "+%Y-%m-%d")
    display_date=$(date -d "$i days ago" "+%A, %B %d, %Y")
    dates+=("$date_str")
    echo "$i. $display_date ($date_str)"
done

echo ""
read -p "Enter your choice (1-7): " choice

# Validate input
if [[ ! "$choice" =~ ^[1-7]$ ]]; then
    echo -e "${RED}❌ Invalid selection!${NC}"
    exit 1
fi

# Get selected date
selected_date=${dates[$((choice-1))]}
selected_display=$(date -d "$selected_date" "+%A, %B %d, %Y")

echo -e "\n${GREEN}✅ Selected: $selected_display${NC}\n"

# Create base directory
base_dir="backdated/$selected_date"
mkdir -p "$base_dir"

# One-line content for each commit
declare -a contents=(
    "Project initialized with basic structure and configuration"
    "Added core modules and dependency management setup"
    "Implemented authentication system and user management"
    "Created API endpoints and database integration layer"
    "Finalized testing framework and deployment configuration"
)

declare -a commit_messages=(
    "Initial project setup and configuration"
    "Add core modules and dependency management"
    "Implement authentication and user management"
    "Create API endpoints and database integration"
    "Add testing framework and deployment config"
)

declare -a filenames=(
    "setup.md"
    "modules.md"
    "auth.md"
    "api.md"
    "deploy.md"
)

echo -e "${BLUE}🔄 Creating 5 backdated commits...${NC}\n"

# Create 5 commits throughout the day
for i in {0..4}; do
    # Calculate time (spread from 9 AM to 5 PM)
    hour=$((9 + i * 2))
    minute=$((RANDOM % 60))
    second=$((RANDOM % 60))
    
    # Create folder
    folder_path="$base_dir/date_$((i+1))"
    mkdir -p "$folder_path"
    
    # Create file with one-line content
    file_path="$folder_path/${filenames[$i]}"
    echo "${contents[$i]}" > "$file_path"
    
    # Format datetime for git
    commit_datetime="$selected_date $hour:$(printf "%02d" $minute):$(printf "%02d" $second)"
    
    echo -e "${YELLOW}📝 Created: $file_path${NC}"
    
    # Add and commit with backdated timestamp
    git add "$file_path"
    
    if GIT_COMMITTER_DATE="$commit_datetime" git commit --date="$commit_datetime" -m "${commit_messages[$i]}" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Created commit: ${commit_messages[$i]}${NC}"
    else
        echo -e "${RED}❌ Failed to create commit: ${commit_messages[$i]}${NC}"
    fi
    
    # Small delay between commits
    sleep 1
done

echo -e "\n${GREEN}🎉 Successfully created 5 backdated commits!${NC}"
echo -e "${BLUE}📁 Files created in: $base_dir${NC}"
echo -e "\n${YELLOW}💡 Use 'git log --oneline' to see your commits${NC}"