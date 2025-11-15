# Contributing to CodeWeaver

First off, thank you for considering contributing to CodeWeaver! It's people like you that make CodeWeaver such a great tool.

## 🌟 Ways to Contribute

- 🐛 **Report bugs** - Found a bug? [Open an issue](https://github.com/nobiehl/codeweaver-mcp/issues)
- 💡 **Suggest features** - Have an idea? We'd love to hear it!
- 📖 **Improve documentation** - Help others understand CodeWeaver better
- 🔧 **Submit pull requests** - Fix bugs or implement features
- ⭐ **Star the project** - Show your support!

## 🚀 Development Setup

### Prerequisites

- **Node.js** >= 20.0.0
- **Git**
- **Java JDK 21** (for testing with Java projects)

### Getting Started

1. **Fork the repository**
   ```bash
   # Click "Fork" on GitHub, then:
   git clone https://github.com/YOUR_USERNAME/codeweaver-mcp.git
   cd codeweaver-mcp
   ```

2. **Add upstream remote**
   ```bash
   git remote add upstream https://github.com/nobiehl/codeweaver-mcp.git
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Build the project**
   ```bash
   npm run build
   ```

5. **Run tests**
   ```bash
   npm test
   ```

## 🔄 Development Workflow

### 1. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

**Branch Naming:**
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Test improvements
- `chore/` - Build/tooling changes

### 2. Make Your Changes

- Write clean, readable code
- Follow existing code style
- Add tests for new features
- Update documentation as needed
- Keep commits focused and atomic

### 3. Test Your Changes

```bash
# Run all tests
npm test

# Run specific test file
npm test -- tests/unit/agents/semantic.test.ts

# Run tests in CI mode (no watch)
npm test -- --run

# Build to verify no compilation errors
npm run build

# Lint your code
npm run lint

# Format your code
npm run format
```

### 4. Commit Your Changes

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
git commit -m "feat: add GPU acceleration support"
git commit -m "fix: resolve file watcher memory leak"
git commit -m "docs: update semantic search guide"
git commit -m "test: add tests for multi-collection"
```

**Commit Types:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation only
- `style:` - Code style (formatting, semicolons, etc)
- `refactor:` - Code refactoring
- `test:` - Adding/updating tests
- `chore:` - Build process, dependencies, etc
- `perf:` - Performance improvements

### 5. Push and Create Pull Request

```bash
# Push your branch
git push origin feature/your-feature-name

# Go to GitHub and click "Create Pull Request"
```

## 📋 Pull Request Guidelines

### Before Submitting

- ✅ All tests pass (`npm test -- --run`)
- ✅ No TypeScript errors (`npm run build`)
- ✅ Code is formatted (`npm run format`)
- ✅ No linting errors (`npm run lint`)
- ✅ Documentation is updated
- ✅ CHANGELOG.md is updated (for user-facing changes)

### PR Description Template

```markdown
## Description
Brief description of what this PR does

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How did you test this?

## Checklist
- [ ] Tests pass
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
```

## 🧪 Testing Guidelines

### Writing Tests

```typescript
import { describe, it, expect, beforeEach } from 'vitest';

describe('MyFeature', () => {
  beforeEach(() => {
    // Setup
  });

  it('should do something', async () => {
    // Arrange
    const input = 'test';

    // Act
    const result = await myFunction(input);

    // Assert
    expect(result).toBe('expected');
  });
});
```

### Test Structure

- **Unit Tests** - `tests/unit/` - Test individual functions/classes
- **Integration Tests** - `tests/integration/` - Test component interactions
- **E2E Tests** - `tests/e2e/` - Test full workflows

### Test Requirements

- All new features must have tests
- Bug fixes should include regression tests
- Aim for meaningful test coverage, not just high numbers
- Tests should be fast and deterministic

## 📚 Documentation Guidelines

### What to Document

- New features and how to use them
- Breaking changes and migration guides
- Configuration options
- Examples and use cases
- Performance implications

### Documentation Locations

- **README.md** - High-level overview, quick start
- **docs/** - Detailed documentation
- **Code comments** - Complex logic, algorithms
- **CHANGELOG.md** - All user-facing changes

## 🎨 Code Style

### TypeScript

- Use TypeScript strict mode
- Explicit return types for public functions
- Prefer `const` over `let`
- Use async/await over promises
- ESM imports with `.js` extensions

```typescript
// ✅ Good
export async function indexFiles(files: string[]): Promise<IndexResult> {
  const results = await processFiles(files);
  return results;
}

// ❌ Bad
export async function indexFiles(files) {
  let results = await processFiles(files);
  return results;
}
```

### Naming Conventions

- **Classes** - PascalCase: `SemanticIndexAgent`
- **Functions** - camelCase: `generateEmbedding()`
- **Constants** - UPPER_SNAKE_CASE: `BATCH_SIZE`
- **Private members** - prefix with `private`: `private cache`
- **Types/Interfaces** - PascalCase: `IndexOptions`

### Comments

```typescript
// ✅ Good - Explains WHY
// Use debouncing to batch multiple rapid file changes
private scheduleReindex(): void { ... }

// ❌ Bad - Explains WHAT (code already shows this)
// Schedule reindex
private scheduleReindex(): void { ... }
```

## 🐛 Reporting Bugs

### Before Reporting

1. Check [existing issues](https://github.com/nobiehl/codeweaver-mcp/issues)
2. Try latest version
3. Verify it's not a configuration issue

### Bug Report Template

```markdown
**Description**
Clear description of the bug

**To Reproduce**
Steps to reproduce:
1. Run `codeweaver ...`
2. See error

**Expected Behavior**
What should happen

**Actual Behavior**
What actually happens

**Environment**
- OS: Windows 11 / macOS 14 / Ubuntu 22.04
- Node.js: 20.10.0
- CodeWeaver: 1.1.0

**Additional Context**
Error messages, logs, screenshots
```

## 💡 Feature Requests

### Feature Request Template

```markdown
**Problem**
What problem does this solve?

**Solution**
How should this work?

**Alternatives**
Other solutions you considered

**Additional Context**
Examples, mockups, etc
```

## 🔍 Code Review Process

### What We Look For

- ✅ Code quality and readability
- ✅ Test coverage
- ✅ Documentation
- ✅ Performance implications
- ✅ Breaking changes clearly marked

### Timeline

- Initial review: Within 1-2 days
- Follow-up: Within 1 day
- Merge: After approval and CI passes

## 🌍 Community

### Getting Help

- 📖 [Documentation](https://github.com/nobiehl/codeweaver-mcp#readme)
- 💬 [GitHub Discussions](https://github.com/nobiehl/codeweaver-mcp/discussions)
- 🐛 [Issue Tracker](https://github.com/nobiehl/codeweaver-mcp/issues)

### Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## 📄 License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).

---

## 🙏 Thank You!

Your contributions make CodeWeaver better for everyone. We appreciate your time and effort!

**Happy Coding!** 🚀
