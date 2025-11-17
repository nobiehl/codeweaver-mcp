# CodeWeaver Documentation

Welcome to CodeWeaver - a multi-language code intelligence system.

## Features

### Core Features

CodeWeaver provides the following core features:

- Symbol extraction from multiple languages
- Semantic search capabilities
- Git integration

### Language Support

We currently support:

- **Java**: Full support for Java 8-23
- **TypeScript**: Complete TypeScript support
- **JavaScript**: Modern ES6+ features
- **Markdown**: Documentation analysis

## Getting Started

See the [Installation Guide](./installation.md) for setup instructions.

## Usage

### Basic Example

Here's a simple example:

```typescript
const agent = new SymbolsAgent();
const symbols = await agent.parseFile('src/App.ts');
console.log(symbols);
```

### Advanced Example

For more complex use cases:

```java
public class Example {
    private String name;

    public Example(String name) {
        this.name = name;
    }
}
```

## API Reference

Check out the [API Documentation](./api/index.md) for details.

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

MIT License - see [LICENSE](../LICENSE) file.
