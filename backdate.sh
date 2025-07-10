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
display_dates=()
for i in {1..7}; do
    date_str=$(date -v-"$i"d "+%Y-%m-%d")
    display_date=$(date -v-"$i"d "+%A, %B %d, %Y")
    dates+=("$date_str")
    display_dates+=("$display_date")
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
selected_display=${display_dates[$((choice-1))]}

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

    # Format time part
    time_str="$(printf "%02d:%02d:%02d" "$hour" "$minute" "$second")"
    commit_datetime="$selected_date $time_str"

    # Create folder and file
    folder_path="$base_dir/date_$((i+1))"
    mkdir -p "$folder_path"
    file_path="$folder_path/${filenames[$i]}"
    echo "${contents[$i]}" > "$file_path"

    echo -e "${YELLOW}📝 Created: $file_path${NC}"

    # Add and commit with backdated timestamp
    git add "$file_path"

    if GIT_COMMITTER_DATE="$commit_datetime" git commit --date="$commit_datetime" -m "${commit_messages[$i]}" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Created commit: ${commit_messages[$i]}${NC}"
    else
        echo -e "${RED}❌ Failed to create commit: ${commit_messages[$i]}${NC}"
    fi

    sleep 1
done

echo -e "\n${GREEN}🎉 Successfully created 5 backdated commits!${NC}"
echo -e "${BLUE}📁 Files created in: $base_dir${NC}"

# Show recent commits
echo -e "\n${YELLOW}📋 Recent commits:${NC}"
git log --oneline -5

# Ask if user wants to push
echo ""
read -p "Do you want to push these commits to remote? (Y/n): " push_choice

if [[ "$push_choice" =~ ^[Yy]$ ]]; then
    # Check if remote exists
    if git remote get-url origin > /dev/null 2>&1; then
        current_branch=$(git branch --show-current)
        echo -e "\n${BLUE}🚀 Pushing to remote...${NC}"

        if git push origin "$current_branch"; then
            echo -e "${GREEN}✅ Successfully pushed to remote!${NC}"
        else
            echo -e "${RED}❌ Failed to push to remote${NC}"
            echo -e "${YELLOW}💡 You may need to set up a remote repository first${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  No remote repository configured${NC}"
        echo -e "${YELLOW}💡 Add a remote with: git remote add origin <repository-url>${NC}"
    fi
else
    echo -e "${YELLOW}💡 You can push later with: git push origin $(git branch --show-current)${NC}"
fi

echo -e "\n${GREEN}🎯 All done!${NC}"
