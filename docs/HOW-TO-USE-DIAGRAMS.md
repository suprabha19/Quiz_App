# How to Use These Diagrams in Your Report

All diagrams are created and ready to use in your report! Here's how to use them:

## 📍 Location
All diagrams are in: `/docs/diagrams/`

## 📋 Available Diagrams

1. ✅ **use-case-diagram.md** - Shows actors (Guest, User, Admin) and their interactions
2. ✅ **gantt-chart.md** - Project timeline and development phases
3. ✅ **system-architecture.md** - Three-tier architecture (Client-Server-Database)
4. ✅ **class-diagram.md** - Database models and class relationships
5. ✅ **sequence-diagram.md** - Component interaction flows (5 different flows)
6. ✅ **activity-diagram.md** - User and admin workflows (4 different activities)

## 🎨 How to Include in Your Report

### Method 1: View in GitHub (Easiest)
The diagrams use **Mermaid syntax** which renders automatically in GitHub:
1. Push to GitHub (already done ✅)
2. Navigate to `docs/diagrams/` on GitHub
3. Click any `.md` file - diagrams render automatically
4. Take screenshots of rendered diagrams for your report

### Method 2: Export as Images
1. Open each diagram file in GitHub
2. Diagrams will render automatically
3. Take screenshot of the rendered diagram
4. Paste into your report document (Word, PDF, etc.)

### Method 3: Use Online Mermaid Editor
1. Copy the Mermaid code from between the \`\`\`mermaid blocks
2. Go to https://mermaid.live/ 
3. Paste the code
4. Click "Download PNG" or "Download SVG"
5. Insert image into your report

### Method 4: Use in Markdown Reports
If your report is in Markdown:
1. Simply copy the entire content of each `.md` file
2. Paste into your report markdown file
3. Mermaid diagrams will render if your viewer supports it

## 📊 What Each Diagram Shows

### Use Case Diagram
- **Purpose**: Shows what different users can do
- **Content**: Guest, User, and Admin capabilities
- **Best for**: Requirements section of report

### Gantt Chart
- **Purpose**: Shows project timeline
- **Content**: 7 phases over 110 days
- **Best for**: Project planning section

### System Architecture
- **Purpose**: Shows how system is structured
- **Content**: React frontend, Express backend, MongoDB database
- **Best for**: Technical architecture section

### Class Diagram
- **Purpose**: Shows data structure
- **Content**: User, Quiz, Result models with relationships
- **Best for**: Database design section

### Sequence Diagrams
- **Purpose**: Shows step-by-step interactions
- **Content**: Login flow, quiz taking flow, admin operations
- **Best for**: Process flow section

### Activity Diagrams
- **Purpose**: Shows workflows and decision logic
- **Content**: Registration, quiz taking, admin management
- **Best for**: User journey section

## 📝 Example: How to Reference in Report

### In Requirements Section:
"Figure 1 shows the use case diagram depicting the three main actors (Guest, User, and Admin) and their respective capabilities within the Quiz Application system."

### In Design Section:
"The system follows a three-tier architecture as illustrated in Figure 2, with a React-based presentation layer, Express.js application layer, and MongoDB data layer."

### In Implementation Section:
"Figure 3 demonstrates the authentication sequence, showing the interaction between the user, frontend, API server, and database during the login process."

## 🖼️ Screenshot Tips

For best quality in your report:
1. Open diagram in GitHub (full screen)
2. Zoom to 100% or appropriate size
3. Take clean screenshot
4. Crop to remove browser chrome
5. Save as PNG or JPG
6. Insert into report with caption

## ✨ Quick Export Commands

If you have the repository locally, you can:

```bash
# View all diagrams
ls docs/diagrams/

# Read any diagram
cat docs/diagrams/use-case-diagram.md

# Copy to clipboard (if on Mac)
cat docs/diagrams/use-case-diagram.md | pbcopy
```

## 📧 Already Done for You

✅ All 6 diagrams created  
✅ Professional Mermaid syntax  
✅ Detailed descriptions included  
✅ GitHub-compatible format  
✅ Ready to use immediately  

**Just view them on GitHub and take screenshots for your report!**

---

**Need help?** All diagrams are in `docs/diagrams/` folder and render automatically on GitHub.
