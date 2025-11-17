# 🚀 Quick Start Guide - CodeWeaver MCP

**Get up and running with CodeWeaver in 5 minutes!**

This guide will walk you through installation, basic usage, and your first analysis.

---

## 📋 Prerequisites

Before you start, make sure you have:

- ✅ **Node.js 20+** installed ([Download](https://nodejs.org/))
- ✅ **Git** installed (for VCS features)
- ✅ A code project to analyze (Java, TypeScript, JavaScript, Python, or Markdown)

**Check your versions:**
```bash
node --version  # Should be v20.0.0 or higher
npm --version   # Should be 10.0.0 or higher
git --version   # Any recent version
```

---

## ⚡ 5-Minute Quick Start

### Step 1: Clone & Install (2 minutes)

```bash
# Clone the repository
git clone https://github.com/nobiehl/codeweaver-mcp.git
cd codeweaver-mcp

# Install dependencies
npm install

# Build the project
npm run build
```

**Expected output:**
```
✓ codeweaver-mcp@0.3.0 dependencies installed
✓ TypeScript compiled successfully
```

---

### Step 2: Navigate to Your Project (30 seconds)

```bash
# Go to the project you want to analyze
cd /path/to/your/java-or-typescript-project

# Or use CodeWeaver from anywhere by specifying the path
```

---

### Step 3: Get Project Info (30 seconds)

```bash
# Get basic project information
node /path/to/codeweaver-mcp/dist/index.js info
```

**Example output:**
```
📦 Project Information

Directory: /home/user/my-spring-app
Files: 1,234 files
Languages: Java (60%), TypeScript (30%), Markdown (10%)
Git: master branch, 45 commits
```

---

### Step 4: Index Your Code (2 minutes)

```bash
# Index all symbols in your project
node /path/to/codeweaver-mcp/dist/index.js symbols index
```

**Example output:**
```
🔍 Indexing project symbols...

Languages detected:
  ✓ Java: 456 files
  ✓ TypeScript: 234 files
  ✓ JavaScript: 123 files
  ✓ Markdown: 45 files

Symbol extraction complete!
  ✓ 3,456 classes
  ✓ 12,345 methods
  ✓ 5,678 functions
  ✓ 892 interfaces

Indexed in 8.3 seconds
Saved to: .codeweaver/symbols.jsonl
```

---

### Step 5: Search Your Code (30 seconds)

```bash
# Find a class or method
node /path/to/codeweaver-mcp/dist/index.js search keyword "UserService"
```

**Example output:**
```
🔍 Found 12 results for "UserService":

src/services/UserService.java
  ├─ class UserService (line 15)
  ├─ method createUser (line 45)
  └─ method deleteUser (line 89)

src/api/UserServiceController.java
  ├─ class UserServiceController (line 10)
  └─ method getUserService (line 25)

...
```

---

## 🎯 Common Use Cases

### Use Case 1: Explore a New Codebase

**Scenario:** You just joined a team and need to understand the project structure.

```bash
# 1. Get project overview
node dist/index.js info

# 2. Index all symbols
node dist/index.js symbols index

# 3. Find all service classes
node dist/index.js search keyword "Service"

# 4. Analyze code quality
node dist/index.js analysis project
```

**Time:** ~5 minutes
**Result:** You now understand the project structure, main components, and code quality.

---

### Use Case 2: Find Where Something is Used

**Scenario:** You need to refactor a method and want to find all usages.

```bash
# Find all references to "sendEmail"
node dist/index.js search keyword "sendEmail"

# Or use regex for variations
node dist/index.js search keyword "send.*Email"
```

**Time:** <1 second
**Result:** List of all files and line numbers where the method is used.

---

### Use Case 3: Code Review Helper

**Scenario:** You're reviewing a pull request and want to check code quality.

```bash
# Check what changed
node dist/index.js vcs diff HEAD~1..HEAD

# Analyze complexity of changed files
node dist/index.js analysis file src/services/payment.ts

# Find all Payment-related code
node dist/index.js search keyword "Payment"
```

**Time:** ~10 seconds
**Result:** Comprehensive understanding of the changes and their impact.

---

### Use Case 4: Documentation Search

**Scenario:** You remember reading about authentication but forgot where.

```bash
# Search markdown files
node dist/index.js search keyword "authentication" --type markdown

# Or search all documentation
node dist/index.js search semantic "how does authentication work?"
```

**Time:** <1 second (keyword) or ~3 seconds (semantic)
**Result:** All relevant documentation sections.

---

## 📚 Core Commands Cheat Sheet

### Project Information
```bash
# Get project overview
node dist/index.js info
```

### Symbol Operations
```bash
# Index entire project
node dist/index.js symbols index

# Find symbols by name
node dist/index.js symbols find "UserService"

# Find symbols by type
node dist/index.js symbols findByKind class

# Get specific symbol details
node dist/index.js symbols get "com.example.UserService"
```

### Search Operations
```bash
# Keyword search
node dist/index.js search keyword "UserService"

# Pattern search (regex)
node dist/index.js search keyword "send.*Email"

# File search
node dist/index.js search files "*.java"

# Semantic search (AI-powered)
node dist/index.js search semantic "authentication logic"
```

### File Operations
```bash
# Read file with token limit
node dist/index.js file read src/Main.java --limit 10000

# Read specific line range
node dist/index.js file readRange src/Main.java 10 50

# Read with line numbers
node dist/index.js file readWithNumbers src/Main.java
```

### Code Analysis
```bash
# Analyze specific file
node dist/index.js analysis file src/UserService.java

# Analyze entire project
node dist/index.js analysis project
```

### Git Operations
```bash
# Git status
node dist/index.js vcs status

# Git diff
node dist/index.js vcs diff

# Git log
node dist/index.js vcs log -n 10

# Git blame
node dist/index.js vcs blame src/Main.java

# List branches
node dist/index.js vcs branches

# Compare branches
node dist/index.js vcs compare main feature-branch
```

### File Watcher
```bash
# Watch for changes and auto-update index
node dist/index.js watch

# Watch with semantic search updates
node dist/index.js watch --semantic
```

---

## 🔧 Advanced Setup

### Option 1: Use as MCP Server with Claude

**1. Build the project:**
```bash
cd /path/to/codeweaver-mcp
npm run build
```

**2. Configure Claude Desktop:**

Edit your Claude Desktop config file:
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Linux:** `~/.config/Claude/claude_desktop_config.json`

Add CodeWeaver as an MCP server:
```json
{
  "mcpServers": {
    "codeweaver": {
      "command": "node",
      "args": [
        "C:/path/to/codeweaver-mcp/dist/index.js",
        "--mcp"
      ],
      "cwd": "C:/path/to/your/project"
    }
  }
}
```

**3. Restart Claude Desktop**

**4. Verify:** Claude should now have access to 19 CodeWeaver tools!

---

### Option 2: Create a Global Command Alias

**For Windows (PowerShell Profile):**
```powershell
# Edit: notepad $PROFILE
function cw { node C:\path\to\codeweaver-mcp\dist\index.js $args }
```

**For macOS/Linux (Bash/Zsh):**
```bash
# Add to ~/.bashrc or ~/.zshrc
alias cw='node /path/to/codeweaver-mcp/dist/index.js'
```

**Now you can use:**
```bash
cw info
cw symbols index
cw search keyword "UserService"
```

---

### Option 3: Install as NPM Package (Local)

```bash
cd /path/to/codeweaver-mcp
npm link

# Now use from anywhere:
codeweaver info
codeweaver symbols index
```

---

## 🎓 Learning Path

### Beginner (Day 1)
1. ✅ Complete the 5-minute quick start
2. ✅ Try `info`, `symbols index`, and `search keyword`
3. ✅ Explore your project with keyword search

### Intermediate (Day 2-3)
4. ✅ Use `analysis` to check code quality
5. ✅ Try `vcs` commands for Git integration
6. ✅ Experiment with file reading (`file read`)

### Advanced (Week 1)
7. ✅ Set up semantic search (`search semantic`)
8. ✅ Use file watcher for auto-updates (`watch`)
9. ✅ Integrate with Claude Desktop (MCP server)

### Expert (Week 2+)
10. ✅ Create custom workflows combining multiple commands
11. ✅ Contribute to the project (add new languages!)
12. ✅ Share your use cases with the community

---

## 🐛 Troubleshooting

### Issue: "Command not found"
**Solution:** Use the full path to `dist/index.js` or create an alias.

---

### Issue: "No symbols found"
**Solution:**
1. Check if your project contains supported languages (Java, TypeScript, JavaScript, Python, Markdown)
2. Run `symbols index` first
3. Verify files are not in excluded directories (node_modules, dist, build)

---

### Issue: "Semantic search is slow"
**Solution:**
- First-time indexing takes ~1 minute per 1,000 files
- Subsequent queries are fast (<2s)
- Use `watch --semantic` for incremental updates
- For large projects (>10k files), stick to keyword search

---

### Issue: "Out of memory"
**Solution:**
- Semantic search needs 500MB-2GB RAM depending on project size
- Increase Node.js memory: `NODE_OPTIONS=--max-old-space-size=4096 node dist/index.js`
- Or disable semantic search and use only core features

---

## 📖 Next Steps

### Read the Full Documentation
- **[ARCHITECTURE.md](./../architecture/ARCHITECTURE.md)** - Understand how CodeWeaver works
- **[USAGE.md](./../reference/USAGE.md)** - Complete CLI command reference
- **[PERFORMANCE.md](./../reference/PERFORMANCE.md)** - Performance benchmarks
- **[API.md](./../reference/API.md)** - MCP tool reference (all 19 tools)

### Try Advanced Features
- **Semantic Search** - [SEMANTIC_SEARCH.md](./../guides/SEMANTIC_SEARCH.md)
- **Multi-Collection** - [MULTI_COLLECTION_GUIDE.md](./../guides/MULTI_COLLECTION_GUIDE.md)
- **File Watcher** - [FILE_WATCHER_GUIDE.md](./../guides/FILE_WATCHER_GUIDE.md)

### Join the Community
- **GitHub:** [nobiehl/codeweaver-mcp](https://github.com/nobiehl/codeweaver-mcp)
- **Issues:** Report bugs or request features
- **Pull Requests:** Contribute code (we'd love your help!)

---

## 💡 Pro Tips

### Tip 1: Use Token Limits for AI Workflows
```bash
# Read file with 10k token limit (perfect for Claude)
node dist/index.js file read src/LargeFile.java --limit 10000
```

### Tip 2: Combine Commands for Powerful Workflows
```bash
# Find all Payment classes, analyze them, check git history
node dist/index.js search keyword "Payment" | \
  xargs -I {} node dist/index.js analysis file {} | \
  xargs -I {} node dist/index.js vcs blame {}
```

### Tip 3: Use Regex for Advanced Search
```bash
# Find all async functions
node dist/index.js search keyword "async.*function"

# Find all test methods
node dist/index.js search keyword "@Test.*public.*void"
```

### Tip 4: Set Up File Watcher for Large Projects
```bash
# Start watcher in background
node dist/index.js watch &

# Now every file change auto-updates the index!
```

---

## 🎉 Success!

You're now ready to use CodeWeaver MCP!

**What you've learned:**
- ✅ Installation and basic setup
- ✅ Core commands (info, symbols, search, analysis)
- ✅ Common use cases
- ✅ Advanced integration options

**Next steps:**
- Try CodeWeaver on your real projects
- Explore advanced features (semantic search, MCP integration)
- Share your feedback and use cases

---

**Questions?** Check [docs/USAGE.md](./../reference/USAGE.md) or [open an issue](https://github.com/nobiehl/codeweaver-mcp/issues)

**Happy Coding! 🚀**
