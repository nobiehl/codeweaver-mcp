/**
 * TypeScript Symbol Extractor
 *
 * Extracts symbol definitions from TypeScript/JavaScript AST.
 * Supports all TypeScript features including:
 * - Classes, Interfaces, Types, Enums
 * - Functions, Methods, Properties
 * - Generics, Decorators, Modifiers
 * - Arrow Functions, Async/Await
 * - Modules (import/export)
 */

import type { TSESTree } from '@typescript-eslint/typescript-estree';
import type { SymbolDefinition, SymbolKind, Modifier, Annotation, Parameter } from '../../../../types/symbols.js';

/**
 * Extract symbols from TypeScript/JavaScript AST
 *
 * @param ast - TypeScript AST from @typescript-eslint/typescript-estree
 * @param filePath - Path to source file
 * @param isJavaScript - Whether this is JavaScript (not TypeScript)
 * @returns Array of extracted symbols
 */
export function extractSymbols(ast: TSESTree.Program, filePath: string, isJavaScript: boolean = false): SymbolDefinition[] {
  const symbols: SymbolDefinition[] = [];

  // Process top-level declarations
  for (const node of ast.body) {
    const nodeSymbols = extractTopLevelDeclaration(node, filePath);
    symbols.push(...nodeSymbols);
  }

  // Add language field to all symbols
  const language = isJavaScript ? 'javascript' : 'typescript';
  return symbols.map(s => ({ ...s, language }));
}

/**
 * Extract top-level declarations
 */
function extractTopLevelDeclaration(node: TSESTree.ProgramStatement, filePath: string): SymbolDefinition[] {
  const symbols: SymbolDefinition[] = [];

  switch (node.type) {
    case 'ClassDeclaration':
      if (node.id) {
        const classSymbols = extractClass(node, node.id.name, filePath);
        symbols.push(...classSymbols);
      }
      break;

    case 'TSInterfaceDeclaration':
      const interfaceSymbols = extractInterface(node, filePath);
      symbols.push(...interfaceSymbols);
      break;

    case 'TSTypeAliasDeclaration':
      const typeSymbol = extractTypeAlias(node, filePath);
      if (typeSymbol) symbols.push(typeSymbol);
      break;

    case 'TSEnumDeclaration':
      const enumSymbols = extractEnum(node, filePath);
      symbols.push(...enumSymbols);
      break;

    case 'FunctionDeclaration':
      if (node.id) {
        const functionSymbol = extractFunction(node, node.id.name, filePath);
        if (functionSymbol) symbols.push(functionSymbol);
      }
      break;

    case 'VariableDeclaration':
      // Extract exported const functions (arrow functions)
      const varSymbols = extractVariableDeclaration(node, filePath);
      symbols.push(...varSymbols);
      break;

    case 'ExportNamedDeclaration':
    case 'ExportDefaultDeclaration':
      // Recursively extract from exported declarations
      if (node.type === 'ExportNamedDeclaration' && node.declaration) {
        const exportedSymbols = extractTopLevelDeclaration(node.declaration as any, filePath);
        symbols.push(...exportedSymbols);
      } else if (node.type === 'ExportDefaultDeclaration' && node.declaration) {
        // Handle default exports
        if (node.declaration.type === 'ClassDeclaration' || node.declaration.type === 'FunctionDeclaration') {
          const exportedSymbols = extractTopLevelDeclaration(node.declaration as any, filePath);
          symbols.push(...exportedSymbols);
        }
      }
      break;

    case 'TSModuleDeclaration':
      // Namespace declaration
      const namespaceSymbols = extractNamespace(node, filePath);
      symbols.push(...namespaceSymbols);
      break;
  }

  return symbols;
}

/**
 * Extract class declaration with members
 */
function extractClass(node: TSESTree.ClassDeclaration, className: string, filePath: string, parentName?: string): SymbolDefinition[] {
  const symbols: SymbolDefinition[] = [];
  const qualifiedName = parentName ? `${parentName}.${className}` : className;

  // Extract modifiers
  const modifiers = extractModifiers(node);
  const decorators = extractDecorators(node.decorators);
  const visibility = getVisibility(modifiers);

  // Add class symbol
  symbols.push({
    id: qualifiedName,
    name: className,
    qualifiedName,
    kind: 'class' as SymbolKind,
    location: {
      path: filePath,
      startLine: node.loc?.start.line || 1,
      startColumn: node.loc?.start.column || 0,
      endLine: node.loc?.end.line || 1,
      endColumn: node.loc?.end.column || 0,
    },
    modifiers: modifiers as Modifier[],
    signature: `${modifiers.join(' ')} class ${className}`.trim(),
    annotations: decorators,
    visibility,
  });

  // Extract class members
  for (const member of node.body.body) {
    const memberSymbols = extractClassMember(member, qualifiedName, filePath);
    symbols.push(...memberSymbols);
  }

  return symbols;
}

/**
 * Extract class members (methods, properties, constructor)
 */
function extractClassMember(member: TSESTree.ClassElement, className: string, filePath: string): SymbolDefinition[] {
  const symbols: SymbolDefinition[] = [];

  switch (member.type) {
    case 'MethodDefinition':
      if (member.key.type === 'Identifier') {
        const methodSymbol = extractMethod(member, member.key.name, className, filePath);
        if (methodSymbol) symbols.push(methodSymbol);
      }
      break;

    case 'PropertyDefinition':
      if (member.key.type === 'Identifier') {
        const propertySymbol = extractProperty(member, member.key.name, className, filePath);
        if (propertySymbol) symbols.push(propertySymbol);
      }
      break;

    case 'TSIndexSignature':
      // Index signatures like [key: string]: any
      // We can skip these for now or add as special symbol type
      break;
  }

  return symbols;
}

/**
 * Extract method definition
 */
function extractMethod(node: TSESTree.MethodDefinition, methodName: string, className: string, filePath: string): SymbolDefinition | null {
  const qualifiedName = `${className}#${methodName}`;
  const modifiers = extractModifiers(node);
  const decorators = extractDecorators(node.decorators);

  // Check if method is async (from the function value)
  if (node.value?.async) {
    if (!modifiers.includes('async')) {
      modifiers.push('async');
    }
  }

  const visibility = getVisibility(modifiers);

  // Determine kind
  let kind: SymbolKind = 'method';
  if (node.kind === 'constructor') {
    kind = 'constructor';
  }

  // Extract parameters (handle abstract methods that may not have a value)
  const parameters = node.value?.params ? extractParameters(node.value.params) : [];

  // Build signature
  const paramSig = parameters.map(p => `${p.name}: ${p.type.name}`).join(', ');
  const signature = `${modifiers.join(' ')} ${methodName}(${paramSig})`.trim();

  return {
    id: qualifiedName,
    name: methodName,
    qualifiedName,
    kind,
    location: {
      path: filePath,
      startLine: node.loc?.start.line || 1,
      startColumn: node.loc?.start.column || 0,
      endLine: node.loc?.end.line || 1,
      endColumn: node.loc?.end.column || 0,
    },
    modifiers: modifiers as Modifier[],
    signature,
    annotations: decorators,
    parameters,
    visibility,
  };
}

/**
 * Extract property definition
 */
function extractProperty(node: TSESTree.PropertyDefinition, propertyName: string, className: string, filePath: string): SymbolDefinition | null {
  const qualifiedName = `${className}#${propertyName}`;
  const modifiers = extractModifiers(node);
  const decorators = extractDecorators(node.decorators);
  const visibility = getVisibility(modifiers);

  // Extract type if available
  const typeName = node.typeAnnotation ? extractTypeName(node.typeAnnotation.typeAnnotation) : 'any';

  return {
    id: qualifiedName,
    name: propertyName,
    qualifiedName,
    kind: 'field' as SymbolKind,
    location: {
      path: filePath,
      startLine: node.loc?.start.line || 1,
      startColumn: node.loc?.start.column || 0,
      endLine: node.loc?.end.line || 1,
      endColumn: node.loc?.end.column || 0,
    },
    modifiers: modifiers as Modifier[],
    signature: `${modifiers.join(' ')} ${propertyName}: ${typeName}`.trim(),
    annotations: decorators,
    visibility,
  };
}

/**
 * Extract interface declaration
 */
function extractInterface(node: TSESTree.TSInterfaceDeclaration, filePath: string): SymbolDefinition[] {
  const symbols: SymbolDefinition[] = [];
  const interfaceName = node.id.name;
  const qualifiedName = interfaceName;

  // Interface modifiers (export, etc.)
  const modifiers: string[] = [];
  const visibility: 'public' | 'protected' | 'package-private' | 'private' = 'public';

  symbols.push({
    id: qualifiedName,
    name: interfaceName,
    qualifiedName,
    kind: 'interface' as SymbolKind,
    location: {
      path: filePath,
      startLine: node.loc?.start.line || 1,
      startColumn: node.loc?.start.column || 0,
      endLine: node.loc?.end.line || 1,
      endColumn: node.loc?.end.column || 0,
    },
    modifiers: modifiers as Modifier[],
    signature: `interface ${interfaceName}`,
    annotations: [],
    visibility,
  });

  // Extract interface members
  for (const member of node.body.body) {
    const memberSymbol = extractInterfaceMember(member, qualifiedName, filePath);
    if (memberSymbol) symbols.push(memberSymbol);
  }

  return symbols;
}

/**
 * Extract interface member
 */
function extractInterfaceMember(member: TSESTree.TypeElement, interfaceName: string, filePath: string): SymbolDefinition | null {
  switch (member.type) {
    case 'TSMethodSignature':
      if (member.key.type === 'Identifier') {
        const methodName = member.key.name;
        const qualifiedName = `${interfaceName}#${methodName}`;
        const parameters = extractParameters(member.params);
        const paramSig = parameters.map(p => `${p.name}: ${p.type.name}`).join(', ');

        return {
          id: qualifiedName,
          name: methodName,
          qualifiedName,
          kind: 'method' as SymbolKind,
          location: {
            path: filePath,
            startLine: member.loc?.start.line || 1,
            startColumn: member.loc?.start.column || 0,
            endLine: member.loc?.end.line || 1,
            endColumn: member.loc?.end.column || 0,
          },
          modifiers: [],
          signature: `${methodName}(${paramSig})`,
          annotations: [],
          parameters,
          visibility: 'public',
        };
      }
      break;

    case 'TSPropertySignature':
      if (member.key.type === 'Identifier') {
        const propertyName = member.key.name;
        const qualifiedName = `${interfaceName}#${propertyName}`;
        const typeName = member.typeAnnotation ? extractTypeName(member.typeAnnotation.typeAnnotation) : 'any';

        return {
          id: qualifiedName,
          name: propertyName,
          qualifiedName,
          kind: 'field' as SymbolKind,
          location: {
            path: filePath,
            startLine: member.loc?.start.line || 1,
            startColumn: member.loc?.start.column || 0,
            endLine: member.loc?.end.line || 1,
            endColumn: member.loc?.end.column || 0,
          },
          modifiers: [],
          signature: `${propertyName}: ${typeName}`,
          annotations: [],
          visibility: 'public',
        };
      }
      break;
  }

  return null;
}

/**
 * Extract type alias declaration
 */
function extractTypeAlias(node: TSESTree.TSTypeAliasDeclaration, filePath: string): SymbolDefinition | null {
  const typeName = node.id.name;
  const qualifiedName = typeName;

  return {
    id: qualifiedName,
    name: typeName,
    qualifiedName,
    kind: 'type' as SymbolKind,
    location: {
      path: filePath,
      startLine: node.loc?.start.line || 1,
      startColumn: node.loc?.start.column || 0,
      endLine: node.loc?.end.line || 1,
      endColumn: node.loc?.end.column || 0,
    },
    modifiers: [],
    signature: `type ${typeName}`,
    annotations: [],
    visibility: 'public',
  };
}

/**
 * Extract enum declaration
 */
function extractEnum(node: TSESTree.TSEnumDeclaration, filePath: string): SymbolDefinition[] {
  const symbols: SymbolDefinition[] = [];
  const enumName = node.id.name;
  const qualifiedName = enumName;

  // Add enum symbol
  symbols.push({
    id: qualifiedName,
    name: enumName,
    qualifiedName,
    kind: 'enum' as SymbolKind,
    location: {
      path: filePath,
      startLine: node.loc?.start.line || 1,
      startColumn: node.loc?.start.column || 0,
      endLine: node.loc?.end.line || 1,
      endColumn: node.loc?.end.column || 0,
    },
    modifiers: [],
    signature: `enum ${enumName}`,
    annotations: [],
    visibility: 'public',
  });

  // Extract enum members (use node.body.members instead of deprecated node.members)
  const enumMembers = (node.body?.members || (node as any).members) as TSESTree.TSEnumMember[];
  for (const member of enumMembers) {
    if (member.id.type === 'Identifier') {
      const memberName = member.id.name;
      const memberQualifiedName = `${qualifiedName}#${memberName}`;

      symbols.push({
        id: memberQualifiedName,
        name: memberName,
        qualifiedName: memberQualifiedName,
        kind: 'enum-constant' as SymbolKind,
        location: {
          path: filePath,
          startLine: member.loc?.start.line || 1,
          startColumn: member.loc?.start.column || 0,
          endLine: member.loc?.end.line || 1,
          endColumn: member.loc?.end.column || 0,
        },
        modifiers: [],
        signature: memberName,
        annotations: [],
        visibility: 'public',
      });
    }
  }

  return symbols;
}

/**
 * Extract function declaration
 */
function extractFunction(node: TSESTree.FunctionDeclaration, functionName: string, filePath: string): SymbolDefinition | null {
  const qualifiedName = functionName;
  const parameters = extractParameters(node.params);
  const paramSig = parameters.map(p => `${p.name}: ${p.type.name}`).join(', ');

  return {
    id: qualifiedName,
    name: functionName,
    qualifiedName,
    kind: 'function' as SymbolKind,
    location: {
      path: filePath,
      startLine: node.loc?.start.line || 1,
      startColumn: node.loc?.start.column || 0,
      endLine: node.loc?.end.line || 1,
      endColumn: node.loc?.end.column || 0,
    },
    modifiers: node.async ? ['async'] : [],
    signature: `${node.async ? 'async ' : ''}function ${functionName}(${paramSig})`,
    annotations: [],
    parameters,
    visibility: 'public',
  };
}

/**
 * Extract variable declaration (for arrow functions)
 */
function extractVariableDeclaration(node: TSESTree.VariableDeclaration, filePath: string): SymbolDefinition[] {
  const symbols: SymbolDefinition[] = [];

  for (const declarator of node.declarations) {
    // Check if it's an arrow function
    if (
      declarator.id.type === 'Identifier' &&
      declarator.init &&
      (declarator.init.type === 'ArrowFunctionExpression' || declarator.init.type === 'FunctionExpression')
    ) {
      const functionName = declarator.id.name;
      const qualifiedName = functionName;
      const parameters = extractParameters(declarator.init.params);
      const paramSig = parameters.map(p => `${p.name}: ${p.type.name}`).join(', ');

      symbols.push({
        id: qualifiedName,
        name: functionName,
        qualifiedName,
        kind: 'function' as SymbolKind,
        location: {
          path: filePath,
          startLine: declarator.loc?.start.line || 1,
          startColumn: declarator.loc?.start.column || 0,
          endLine: declarator.loc?.end.line || 1,
          endColumn: declarator.loc?.end.column || 0,
        },
        modifiers: declarator.init.async ? ['async'] : [],
        signature: `const ${functionName} = (${paramSig}) =>`,
        annotations: [],
        parameters,
        visibility: 'public',
      });
    }
  }

  return symbols;
}

/**
 * Extract namespace declaration
 */
function extractNamespace(node: TSESTree.TSModuleDeclaration, filePath: string): SymbolDefinition[] {
  const symbols: SymbolDefinition[] = [];

  if (node.id.type === 'Identifier') {
    const namespaceName = node.id.name;
    const qualifiedName = namespaceName;

    symbols.push({
      id: qualifiedName,
      name: namespaceName,
      qualifiedName,
      kind: 'module' as SymbolKind,
      location: {
        path: filePath,
        startLine: node.loc?.start.line || 1,
        startColumn: node.loc?.start.column || 0,
        endLine: node.loc?.end.line || 1,
        endColumn: node.loc?.end.column || 0,
      },
      modifiers: [],
      signature: `namespace ${namespaceName}`,
      annotations: [],
      visibility: 'public',
    });

    // TODO: Extract namespace members
  }

  return symbols;
}

/**
 * Extract function/method parameters
 */
function extractParameters(params: TSESTree.Parameter[]): Parameter[] {
  const parameters: Parameter[] = [];

  for (const param of params) {
    if (param.type === 'Identifier') {
      const paramName = param.name;
      const typeName = param.typeAnnotation ? extractTypeName(param.typeAnnotation.typeAnnotation) : 'any';

      parameters.push({
        name: paramName,
        type: { name: typeName },
        annotations: extractDecorators(param.decorators),
      });
    } else if (param.type === 'RestElement' && param.argument.type === 'Identifier') {
      const paramName = `...${param.argument.name}`;
      const typeName = param.typeAnnotation ? extractTypeName(param.typeAnnotation.typeAnnotation) : 'any[]';

      parameters.push({
        name: paramName,
        type: { name: typeName },
        annotations: [],
      });
    }
  }

  return parameters;
}

/**
 * Extract type name from type annotation
 */
function extractTypeName(typeNode: TSESTree.TypeNode): string {
  switch (typeNode.type) {
    case 'TSStringKeyword':
      return 'string';
    case 'TSNumberKeyword':
      return 'number';
    case 'TSBooleanKeyword':
      return 'boolean';
    case 'TSAnyKeyword':
      return 'any';
    case 'TSVoidKeyword':
      return 'void';
    case 'TSNullKeyword':
      return 'null';
    case 'TSUndefinedKeyword':
      return 'undefined';
    case 'TSTypeReference':
      if (typeNode.typeName.type === 'Identifier') {
        return typeNode.typeName.name;
      }
      return 'unknown';
    case 'TSArrayType':
      return `${extractTypeName(typeNode.elementType)}[]`;
    case 'TSUnionType':
      return typeNode.types.map(extractTypeName).join(' | ');
    case 'TSIntersectionType':
      return typeNode.types.map(extractTypeName).join(' & ');
    default:
      return 'unknown';
  }
}

/**
 * Extract modifiers from node
 */
function extractModifiers(node: any): string[] {
  const modifiers: string[] = [];

  if (node.static) modifiers.push('static');
  if (node.readonly) modifiers.push('readonly');
  if (node.abstract) modifiers.push('abstract');
  if (node.async) modifiers.push('async');

  // Check accessibility modifiers
  if (node.accessibility) {
    modifiers.push(node.accessibility); // 'public', 'private', 'protected'
  }

  return modifiers;
}

/**
 * Extract decorators (TypeScript decorators = Java annotations)
 */
function extractDecorators(decorators: TSESTree.Decorator[] | undefined): Annotation[] {
  const annotations: Annotation[] = [];

  if (!decorators) return annotations;

  for (const decorator of decorators) {
    if (decorator.expression.type === 'Identifier') {
      annotations.push({
        type: decorator.expression.name,
      });
    } else if (decorator.expression.type === 'CallExpression' && decorator.expression.callee.type === 'Identifier') {
      // Decorator with arguments
      annotations.push({
        type: decorator.expression.callee.name,
        arguments: {}, // TODO: Extract actual arguments
      });
    }
  }

  return annotations;
}

/**
 * Get visibility from modifiers
 */
function getVisibility(modifiers: string[]): 'public' | 'protected' | 'package-private' | 'private' {
  if (modifiers.includes('private')) return 'private';
  if (modifiers.includes('protected')) return 'protected';
  if (modifiers.includes('public')) return 'public';
  return 'public'; // Default to public in TypeScript
}
