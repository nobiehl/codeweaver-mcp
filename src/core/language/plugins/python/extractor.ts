/**
 * Python Symbol Extractor
 *
 * Extracts symbol definitions from Tree-Sitter Python AST.
 * Supports:
 * - Classes, Methods, Functions
 * - Decorators (@decorator syntax)
 * - Type Hints (Python 3.5+)
 * - Import statements
 */

import type { SymbolDefinition, SymbolKind, Modifier, Annotation, Parameter } from '../../../../types/symbols.js';

// Type for tree-sitter Tree and Node
type Tree = any;
type Node = any;

/**
 * Extract symbols from Python Tree-Sitter AST
 *
 * @param tree - Tree-Sitter parse tree
 * @param filePath - Path to source file
 * @returns Array of extracted symbols
 */
export function extractSymbols(tree: Tree, filePath: string): SymbolDefinition[] {
  const symbols: SymbolDefinition[] = [];
  const rootNode = tree.rootNode;

  // Process module-level nodes
  for (const child of rootNode.children) {
    const nodeSymbols = extractNode(child, filePath, undefined);
    symbols.push(...nodeSymbols);
  }

  // Add language field to all symbols
  return symbols.map(s => ({ ...s, language: 'python' }));
}

/**
 * Extract symbol from a Tree-Sitter node
 */
function extractNode(
  node: Node,
  filePath: string,
  parentName?: string
): SymbolDefinition[] {
  const symbols: SymbolDefinition[] = [];

  switch (node.type) {
    case 'class_definition':
      symbols.push(...extractClass(node, filePath, parentName));
      break;

    case 'function_definition':
      const funcSymbol = extractFunction(node, filePath, parentName);
      if (funcSymbol) symbols.push(funcSymbol);
      break;

    case 'decorated_definition':
      // Extract decorators and then the definition
      symbols.push(...extractDecoratedDefinition(node, filePath, parentName));
      break;

    case 'import_statement':
    case 'import_from_statement':
      // We could extract imports, but for now skip them
      break;

    default:
      // Recursively process children
      for (const child of node.children) {
        symbols.push(...extractNode(child, filePath, parentName));
      }
  }

  return symbols;
}

/**
 * Extract class definition
 */
function extractClass(
  node: Node,
  filePath: string,
  parentName?: string
): SymbolDefinition[] {
  const symbols: SymbolDefinition[] = [];

  // Get class name
  const nameNode = node.childForFieldName('name');
  if (!nameNode) return symbols;

  const className = nameNode.text;
  const qualifiedName = parentName ? `${parentName}.${className}` : className;

  // Extract decorators (if wrapped in decorated_definition)
  const decorators: Annotation[] = [];

  // Add class symbol
  symbols.push({
    id: qualifiedName,
    name: className,
    qualifiedName,
    kind: 'class' as SymbolKind,
    location: {
      path: filePath,
      startLine: node.startPosition.row + 1,
      startColumn: node.startPosition.column,
      endLine: node.endPosition.row + 1,
      endColumn: node.endPosition.column,
    },
    modifiers: [],
    signature: `class ${className}`,
    annotations: decorators,
    visibility: 'public',
  });

  // Extract class body (methods, nested classes)
  const bodyNode = node.childForFieldName('body');
  if (bodyNode) {
    for (const child of bodyNode.children) {
      if (child.type === 'function_definition') {
        const methodSymbol = extractMethod(child, filePath, qualifiedName);
        if (methodSymbol) symbols.push(methodSymbol);
      } else if (child.type === 'decorated_definition') {
        const decoratedNode = child.childForFieldName('definition');
        if (decoratedNode?.type === 'function_definition') {
          const decorators = extractDecorators(child);
          const methodSymbol = extractMethod(decoratedNode, filePath, qualifiedName, decorators);
          if (methodSymbol) symbols.push(methodSymbol);
        }
      } else if (child.type === 'class_definition') {
        // Nested class
        symbols.push(...extractClass(child, filePath, qualifiedName));
      }
    }
  }

  return symbols;
}

/**
 * Extract function definition (module-level)
 */
function extractFunction(
  node: Node,
  filePath: string,
  parentName?: string
): SymbolDefinition | null {
  const nameNode = node.childForFieldName('name');
  if (!nameNode) return null;

  const functionName = nameNode.text;
  const qualifiedName = parentName ? `${parentName}.${functionName}` : functionName;

  // Extract parameters
  const parameters = extractParameters(node);

  // Extract return type hint
  const returnTypeNode = node.childForFieldName('return_type');
  const returnType = returnTypeNode ? returnTypeNode.text.replace(/^->\s*/, '') : 'Any';

  // Build signature
  const paramSig = parameters.map(p => `${p.name}: ${p.type.name}`).join(', ');
  const signature = `def ${functionName}(${paramSig}) -> ${returnType}`;

  // Check if async
  const modifiers: string[] = [];
  if (node.text.trimStart().startsWith('async ')) {
    modifiers.push('async');
  }

  return {
    id: qualifiedName,
    name: functionName,
    qualifiedName,
    kind: 'function' as SymbolKind,
    location: {
      path: filePath,
      startLine: node.startPosition.row + 1,
      startColumn: node.startPosition.column,
      endLine: node.endPosition.row + 1,
      endColumn: node.endPosition.column,
    },
    modifiers: modifiers as Modifier[],
    signature,
    annotations: [],
    parameters,
    visibility: 'public',
  };
}

/**
 * Extract method definition (class member)
 */
function extractMethod(
  node: Node,
  filePath: string,
  className: string,
  decorators: Annotation[] = []
): SymbolDefinition | null {
  const nameNode = node.childForFieldName('name');
  if (!nameNode) return null;

  const methodName = nameNode.text;
  const qualifiedName = `${className}#${methodName}`;

  // Extract parameters
  const parameters = extractParameters(node);

  // Determine kind (method or constructor)
  let kind: SymbolKind = 'method';
  if (methodName === '__init__') {
    kind = 'constructor';
  }

  // Extract return type hint
  const returnTypeNode = node.childForFieldName('return_type');
  const returnType = returnTypeNode ? returnTypeNode.text.replace(/^->\s*/, '') : 'Any';

  // Determine modifiers
  const modifiers: string[] = [];
  if (node.text.trimStart().startsWith('async ')) {
    modifiers.push('async');
  }

  // Check for static/classmethod via decorators
  const hasStaticMethod = decorators.some(d => d.type === 'staticmethod');
  const hasClassMethod = decorators.some(d => d.type === 'classmethod');
  if (hasStaticMethod) modifiers.push('static');
  if (hasClassMethod) modifiers.push('classmethod');

  // Determine visibility from name
  let visibility: 'public' | 'protected' | 'package-private' | 'private' = 'public';
  if (methodName.startsWith('__') && !methodName.endsWith('__')) {
    visibility = 'private'; // Name mangling
  } else if (methodName.startsWith('_')) {
    visibility = 'protected'; // Convention
  }

  // Build signature
  const paramSig = parameters.map(p => `${p.name}: ${p.type.name}`).join(', ');
  const signature = `def ${methodName}(${paramSig}) -> ${returnType}`;

  return {
    id: qualifiedName,
    name: methodName,
    qualifiedName,
    kind,
    location: {
      path: filePath,
      startLine: node.startPosition.row + 1,
      startColumn: node.startPosition.column,
      endLine: node.endPosition.row + 1,
      endColumn: node.endPosition.column,
    },
    modifiers: modifiers as Modifier[],
    signature,
    annotations: decorators,
    parameters,
    visibility,
  };
}

/**
 * Extract decorated definition (function/class with decorators)
 */
function extractDecoratedDefinition(
  node: Node,
  filePath: string,
  parentName?: string
): SymbolDefinition[] {
  const decorators = extractDecorators(node);

  // Get the actual definition
  const definitionNode = node.childForFieldName('definition');
  if (!definitionNode) return [];

  if (definitionNode.type === 'function_definition') {
    if (parentName) {
      // Method
      const methodSymbol = extractMethod(definitionNode, filePath, parentName, decorators);
      return methodSymbol ? [methodSymbol] : [];
    } else {
      // Function
      const functionSymbol = extractFunction(definitionNode, filePath, parentName);
      if (functionSymbol) {
        functionSymbol.annotations = decorators;
        return [functionSymbol];
      }
    }
  } else if (definitionNode.type === 'class_definition') {
    const classSymbols = extractClass(definitionNode, filePath, parentName);
    if (classSymbols.length > 0) {
      // Add decorators to class symbol
      classSymbols[0].annotations = decorators;
    }
    return classSymbols;
  }

  return [];
}

/**
 * Extract decorators from decorated_definition node
 */
function extractDecorators(node: Node): Annotation[] {
  const decorators: Annotation[] = [];

  for (const child of node.children) {
    if (child.type === 'decorator') {
      // Get decorator name (after @)
      const nameNode = child.childForFieldName('name');
      if (nameNode) {
        decorators.push({
          type: nameNode.text,
        });
      } else {
        // Call expression like @decorator(args) - argument extraction omitted for simplicity
        const text = child.text.replace(/^@/, '').trim();
        const decoratorName = text.split('(')[0];
        decorators.push({
          type: decoratorName,
        });
      }
    }
  }

  return decorators;
}

/**
 * Extract function/method parameters
 */
function extractParameters(node: Node): Parameter[] {
  const parameters: Parameter[] = [];

  const paramsNode = node.childForFieldName('parameters');
  if (!paramsNode) return parameters;

  for (const child of paramsNode.children) {
    if (child.type === 'identifier') {
      // Simple parameter without type hint
      parameters.push({
        name: child.text,
        type: { name: 'Any' },
        annotations: [],
      });
    } else if (child.type === 'typed_parameter') {
      // Parameter with type hint: name: Type
      // Structure: typed_parameter has children: [identifier, ":", type]
      const nameNode = child.child(0); // First child is the identifier
      const typeNode = child.childForFieldName('type');

      if (nameNode && nameNode.type === 'identifier') {
        parameters.push({
          name: nameNode.text,
          type: { name: typeNode ? typeNode.text : 'Any' },
          annotations: [],
        });
      }
    } else if (child.type === 'default_parameter') {
      // Parameter with default value: name = value
      // Structure: default_parameter has children: [identifier, "=", value]
      const nameNode = child.child(0); // First child is the identifier

      if (nameNode && nameNode.type === 'identifier') {
        parameters.push({
          name: nameNode.text,
          type: { name: 'Any' },
          annotations: [],
        });
      }
    } else if (child.type === 'typed_default_parameter') {
      // Parameter with type hint AND default: name: Type = value
      // Structure: typed_default_parameter has children: [identifier, ":", type, "=", value]
      const nameNode = child.child(0); // First child is the identifier
      const typeNode = child.childForFieldName('type');

      if (nameNode && nameNode.type === 'identifier') {
        parameters.push({
          name: nameNode.text,
          type: { name: typeNode ? typeNode.text : 'Any' },
          annotations: [],
        });
      }
    } else if (child.type === 'list_splat_pattern') {
      // *args
      const nameNode = child.childForFieldName('name');
      if (nameNode) {
        parameters.push({
          name: `*${nameNode.text}`,
          type: { name: 'tuple' },
          annotations: [],
        });
      }
    } else if (child.type === 'dictionary_splat_pattern') {
      // **kwargs
      const nameNode = child.childForFieldName('name');
      if (nameNode) {
        parameters.push({
          name: `**${nameNode.text}`,
          type: { name: 'dict' },
          annotations: [],
        });
      }
    }
  }

  return parameters;
}
