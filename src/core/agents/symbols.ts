import fs from 'fs/promises';
import path from 'path';
import { parse } from 'java-parser';
import type { SymbolDefinition, SymbolKind, Modifier, Annotation } from '../../types/symbols.js';

/**
 * SymbolsAgent - Java Symbol Extraction
 *
 * Features:
 * - Parse Java files and extract symbols (classes, methods, fields, constructors)
 * - Build symbol index for entire project
 * - Find symbols by name, kind, or qualified name
 * - Extract method signatures, field types, modifiers
 */
export class SymbolsAgent {
  private projectRoot: string;
  private symbolIndex: Map<string, SymbolDefinition> = new Map();

  constructor(projectRoot: string = '.') {
    this.projectRoot = projectRoot;
  }

  /**
   * Parse a Java file and extract all symbols
   */
  async parseFile(filePath: string): Promise<SymbolDefinition[]> {
    const fullPath = path.join(this.projectRoot, filePath);

    try {
      const content = await fs.readFile(fullPath, 'utf-8');
      return this.parseJavaSource(content, filePath);
    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  /**
   * Parse Java source code and extract symbols
   */
  private parseJavaSource(source: string, filePath: string): SymbolDefinition[] {
    const symbols: SymbolDefinition[] = [];

    try {
      const ast = parse(source);

      // Extract package name
      const packageName = this.extractPackage(ast);

      // Extract compilation unit (classes, interfaces, enums)
      const compilationUnits = (ast as any).children?.ordinaryCompilationUnit;
      if (compilationUnits && Array.isArray(compilationUnits)) {
        const compilationUnit = compilationUnits[0];

        // Extract type declarations
        const typeDeclarations = (compilationUnit as any).children?.typeDeclaration;
        if (typeDeclarations && Array.isArray(typeDeclarations)) {
          for (const typeDecl of typeDeclarations) {
            const typeSymbols = this.extractTypeDeclaration(typeDecl, packageName, filePath);
            symbols.push(...typeSymbols);
          }
        }
      }
    } catch (error) {
      // Parser error - return empty array
      console.error(`Failed to parse ${filePath}:`, error);
    }

    return symbols;
  }

  /**
   * Extract package name from AST
   */
  private extractPackage(ast: any): string {
    try {
      const packageDecl = (ast as any).children?.ordinaryCompilationUnit?.[0]?.children?.packageDeclaration?.[0];
      if (packageDecl?.children?.Identifier) {
        return packageDecl.children.Identifier.map((id: any) => id.image).join('.');
      }
    } catch {}
    return '';
  }

  /**
   * Extract type declaration (class, interface, enum)
   */
  private extractTypeDeclaration(typeDecl: any, packageName: string, filePath: string): SymbolDefinition[] {
    const symbols: SymbolDefinition[] = [];

    try {
      // Class declaration
      if (typeDecl.children?.classDeclaration) {
        const classDecl = typeDecl.children.classDeclaration[0];

        // Check if it's actually an enum (enums are inside classDeclaration in java-parser)
        if (classDecl.children?.enumDeclaration) {
          const enumDecl = classDecl.children.enumDeclaration[0];
          const enumName = enumDecl.children?.typeIdentifier?.[0]?.children?.Identifier?.[0]?.image;

          if (enumName) {
            const qualifiedName = packageName ? `${packageName}.${enumName}` : enumName;
            const modifiers = this.extractModifiers(typeDecl.children?.classModifier);
            const annotations = this.extractAnnotations(typeDecl.children?.classModifier);

            symbols.push({
              id: qualifiedName,
              name: enumName,
              qualifiedName,
              kind: 'enum' as SymbolKind,
              location: {
                path: filePath,
                startLine: this.extractLineNumber(enumDecl),
                startColumn: 0,
                endLine: this.extractLineNumber(enumDecl),
                endColumn: 0
              },
              modifiers: modifiers as Modifier[],
              signature: `${modifiers.join(' ')} enum ${enumName}`,
              annotations,
              visibility: this.getVisibility(modifiers)
            });

            // Extract enum constants
            const enumBody = enumDecl.children?.enumBody?.[0];
            if (enumBody) {
              const constantSymbols = this.extractEnumConstants(enumBody, qualifiedName, filePath);
              symbols.push(...constantSymbols);
            }
          }
        } else {
          // Normal class (not enum)
          const className = classDecl.children?.normalClassDeclaration?.[0]?.children?.typeIdentifier?.[0]?.children?.Identifier?.[0]?.image;

          if (className) {
          const qualifiedName = packageName ? `${packageName}.${className}` : className;
          const modifiers = this.extractModifiers(typeDecl.children?.classModifier);
          const annotations = this.extractAnnotations(typeDecl.children?.classModifier);

          // Add class symbol
          const visibility = this.getVisibility(modifiers);
          symbols.push({
            id: qualifiedName,
            name: className,
            qualifiedName,
            kind: 'class' as SymbolKind,
            location: {
              path: filePath,
              startLine: this.extractLineNumber(classDecl),
              startColumn: 0,
              endLine: this.extractLineNumber(classDecl),
              endColumn: 0
            },
            modifiers: modifiers as Modifier[],
            signature: `${modifiers.join(' ')} class ${className}`,
            annotations,
            visibility
          });

          // Extract class body members
          const classBody = classDecl.children?.normalClassDeclaration?.[0]?.children?.classBody?.[0];
          if (classBody) {
            const memberSymbols = this.extractClassMembers(classBody, qualifiedName, filePath);
            symbols.push(...memberSymbols);
          }
        }
        }
      }

      // Interface declaration
      if (typeDecl.children?.interfaceDeclaration) {
        const interfaceDecl = typeDecl.children.interfaceDeclaration[0];
        const interfaceName = interfaceDecl.children?.normalInterfaceDeclaration?.[0]?.children?.typeIdentifier?.[0]?.children?.Identifier?.[0]?.image;

        if (interfaceName) {
          const qualifiedName = packageName ? `${packageName}.${interfaceName}` : interfaceName;
          const modifiers = this.extractModifiers(typeDecl.children?.interfaceModifier);
          const annotations = this.extractAnnotations(typeDecl.children?.interfaceModifier);

          symbols.push({
            id: qualifiedName,
            name: interfaceName,
            qualifiedName,
            kind: 'interface' as SymbolKind,
            location: {
              path: filePath,
              startLine: this.extractLineNumber(interfaceDecl),
              startColumn: 0,
              endLine: this.extractLineNumber(interfaceDecl),
              endColumn: 0
            },
            modifiers: modifiers as Modifier[],
            signature: `${modifiers.join(' ')} interface ${interfaceName}`,
            annotations,
            visibility: this.getVisibility(modifiers)
          });

          // Extract interface members (methods)
          const interfaceBody = interfaceDecl.children?.normalInterfaceDeclaration?.[0]?.children?.interfaceBody?.[0];
          if (interfaceBody) {
            const memberSymbols = this.extractInterfaceMembers(interfaceBody, qualifiedName, filePath);
            symbols.push(...memberSymbols);
          }
        }
      }

    } catch (error) {
      console.error('Error extracting type declaration:', error);
    }

    return symbols;
  }

  /**
   * Extract class members (fields, methods, constructors)
   */
  private extractClassMembers(classBody: any, className: string, filePath: string): SymbolDefinition[] {
    const symbols: SymbolDefinition[] = [];

    try {
      const declarations = classBody.children?.classBodyDeclaration || [];

      for (const decl of declarations) {
        // Field declaration
        if (decl.children?.classMemberDeclaration?.[0]?.children?.fieldDeclaration) {
          const fieldSymbols = this.extractFields(decl, className, filePath);
          symbols.push(...fieldSymbols);
        }

        // Method declaration
        if (decl.children?.classMemberDeclaration?.[0]?.children?.methodDeclaration) {
          const methodSymbol = this.extractMethod(decl, className, filePath);
          if (methodSymbol) symbols.push(methodSymbol);
        }

        // Constructor declaration
        if (decl.children?.constructorDeclaration) {
          const constructorSymbol = this.extractConstructor(decl, className, filePath);
          if (constructorSymbol) symbols.push(constructorSymbol);
        }

        // Nested type declarations (enum, class, interface)
        if (decl.children?.classMemberDeclaration?.[0]?.children?.classDeclaration) {
          const nestedTypeSymbols = this.extractNestedTypeDeclaration(
            decl.children.classMemberDeclaration[0].children.classDeclaration[0],
            decl.children?.classModifier,
            className,
            filePath
          );
          symbols.push(...nestedTypeSymbols);
        }
      }
    } catch (error) {
      console.error('Error extracting class members:', error);
    }

    return symbols;
  }

  /**
   * Extract nested type declarations (enum, class, interface) within a class
   */
  private extractNestedTypeDeclaration(
    classDecl: any,
    classModifiers: any[] | undefined,
    parentClassName: string,
    filePath: string
  ): SymbolDefinition[] {
    const symbols: SymbolDefinition[] = [];

    try {
      const modifiers = this.extractModifiers(classModifiers);

      // Check if it's a nested enum
      if (classDecl.children?.enumDeclaration) {
        const enumDecl = classDecl.children.enumDeclaration[0];
        const enumName = enumDecl.children?.typeIdentifier?.[0]?.children?.Identifier?.[0]?.image;

        if (enumName) {
          const qualifiedName = `${parentClassName}$${enumName}`;
          const annotations = this.extractAnnotations(classModifiers);
          const visibility = this.getVisibility(modifiers);

          symbols.push({
            id: qualifiedName,
            name: enumName,
            qualifiedName,
            kind: 'enum' as SymbolKind,
            location: {
              path: filePath,
              startLine: this.extractLineNumber(enumDecl),
              startColumn: 0,
              endLine: this.extractLineNumber(enumDecl),
              endColumn: 0
            },
            modifiers: modifiers as Modifier[],
            signature: `${modifiers.join(' ')} enum ${enumName}`,
            annotations,
            visibility
          });

          // Extract enum constants
          const enumBody = enumDecl.children?.enumBody?.[0];
          if (enumBody) {
            const constantSymbols = this.extractEnumConstants(enumBody, qualifiedName, filePath);
            symbols.push(...constantSymbols);
          }
        }
      }
      // Check if it's a nested class
      else if (classDecl.children?.normalClassDeclaration) {
        const normalClassDecl = classDecl.children.normalClassDeclaration[0];
        const className = normalClassDecl.children?.typeIdentifier?.[0]?.children?.Identifier?.[0]?.image;

        if (className) {
          const qualifiedName = `${parentClassName}$${className}`;
          const annotations = this.extractAnnotations(classModifiers);
          const visibility = this.getVisibility(modifiers);

          symbols.push({
            id: qualifiedName,
            name: className,
            qualifiedName,
            kind: 'class' as SymbolKind,
            location: {
              path: filePath,
              startLine: this.extractLineNumber(normalClassDecl),
              startColumn: 0,
              endLine: this.extractLineNumber(normalClassDecl),
              endColumn: 0
            },
            modifiers: modifiers as Modifier[],
            signature: `${modifiers.join(' ')} class ${className}`,
            annotations,
            visibility
          });

          // Extract nested class members recursively
          const classBody = normalClassDecl.children?.classBody?.[0];
          if (classBody) {
            const memberSymbols = this.extractClassMembers(classBody, qualifiedName, filePath);
            symbols.push(...memberSymbols);
          }
        }
      }
      // Check if it's a nested interface
      else if (classDecl.children?.normalInterfaceDeclaration) {
        const interfaceDecl = classDecl.children.normalInterfaceDeclaration[0];
        const interfaceName = interfaceDecl.children?.typeIdentifier?.[0]?.children?.Identifier?.[0]?.image;

        if (interfaceName) {
          const qualifiedName = `${parentClassName}$${interfaceName}`;
          const annotations = this.extractAnnotations(classModifiers);
          const visibility = this.getVisibility(modifiers);

          symbols.push({
            id: qualifiedName,
            name: interfaceName,
            qualifiedName,
            kind: 'interface' as SymbolKind,
            location: {
              path: filePath,
              startLine: this.extractLineNumber(interfaceDecl),
              startColumn: 0,
              endLine: this.extractLineNumber(interfaceDecl),
              endColumn: 0
            },
            modifiers: modifiers as Modifier[],
            signature: `${modifiers.join(' ')} interface ${interfaceName}`,
            annotations,
            visibility
          });

          // Extract interface members
          const interfaceBody = interfaceDecl.children?.interfaceBody?.[0];
          if (interfaceBody) {
            const memberSymbols = this.extractInterfaceMembers(interfaceBody, qualifiedName, filePath);
            symbols.push(...memberSymbols);
          }
        }
      }
    } catch (error) {
      console.error('Error extracting nested type declaration:', error);
    }

    return symbols;
  }

  /**
   * Extract field declarations
   */
  private extractFields(decl: any, className: string, filePath: string): SymbolDefinition[] {
    const symbols: SymbolDefinition[] = [];

    try {
      const fieldDecl = decl.children?.classMemberDeclaration?.[0]?.children?.fieldDeclaration?.[0];
      const modifiers = this.extractModifiers(decl.children?.classModifier);
      const annotations = this.extractAnnotations(decl.children?.classModifier);
      const variables = fieldDecl?.children?.variableDeclaratorList?.[0]?.children?.variableDeclarator || [];

      for (const variable of variables) {
        const fieldName = variable.children?.variableDeclaratorId?.[0]?.children?.Identifier?.[0]?.image;

        if (fieldName) {
          const qualifiedName = `${className}#${fieldName}`;
          const visibility = this.getVisibility(modifiers);

          symbols.push({
            id: qualifiedName,
            name: fieldName,
            qualifiedName,
            kind: 'field' as SymbolKind,
            location: {
              path: filePath,
              startLine: this.extractLineNumber(fieldDecl),
              startColumn: 0,
              endLine: this.extractLineNumber(fieldDecl),
              endColumn: 0
            },
            modifiers: modifiers as Modifier[],
            signature: `${modifiers.join(' ')} ${fieldName}`,
            annotations,
            visibility
          });
        }
      }
    } catch (error) {
      console.error('Error extracting fields:', error);
    }

    return symbols;
  }

  /**
   * Extract method declaration
   */
  private extractMethod(decl: any, className: string, filePath: string): SymbolDefinition | null {
    try {
      const methodDecl = decl.children?.classMemberDeclaration?.[0]?.children?.methodDeclaration?.[0];
      // Extract modifiers and annotations from methodModifier (not classModifier!)
      const modifiers = this.extractModifiers(methodDecl?.children?.methodModifier);
      const annotations = this.extractAnnotations(methodDecl?.children?.methodModifier);
      const methodName = methodDecl?.children?.methodHeader?.[0]?.children?.methodDeclarator?.[0]?.children?.Identifier?.[0]?.image;

      if (methodName) {
        const qualifiedName = `${className}#${methodName}`;
        const visibility = this.getVisibility(modifiers);

        return {
          id: qualifiedName,
          name: methodName,
          qualifiedName,
          kind: 'method' as SymbolKind,
          location: {
            path: filePath,
            startLine: this.extractLineNumber(methodDecl),
            startColumn: 0,
            endLine: this.extractLineNumber(methodDecl),
            endColumn: 0
          },
          modifiers: modifiers as Modifier[],
          signature: `${modifiers.join(' ')} ${methodName}()`,
          annotations,
          parameters: [],
          visibility
        };
      }
    } catch (error) {
      console.error('Error extracting method:', error);
    }

    return null;
  }

  /**
   * Extract constructor declaration
   */
  private extractConstructor(decl: any, className: string, filePath: string): SymbolDefinition | null {
    try {
      const constructorDecl = decl.children?.constructorDeclaration?.[0];
      const modifiers = this.extractModifiers(decl.children?.constructorModifier);
      const annotations = this.extractAnnotations(decl.children?.constructorModifier);
      const constructorName = constructorDecl?.children?.simpleTypeName?.[0]?.children?.Identifier?.[0]?.image;

      if (constructorName) {
        const qualifiedName = `${className}#<init>`;
        const visibility = this.getVisibility(modifiers);

        return {
          id: qualifiedName,
          name: constructorName,
          qualifiedName,
          kind: 'constructor' as SymbolKind,
          location: {
            path: filePath,
            startLine: this.extractLineNumber(constructorDecl),
            startColumn: 0,
            endLine: this.extractLineNumber(constructorDecl),
            endColumn: 0
          },
          modifiers: modifiers as Modifier[],
          signature: `${modifiers.join(' ')} ${constructorName}()`,
          annotations,
          parameters: [],
          visibility
        };
      }
    } catch (error) {
      console.error('Error extracting constructor:', error);
    }

    return null;
  }

  /**
   * Extract modifiers (public, private, static, etc.)
   */
  private extractModifiers(modifierNodes: any[] | undefined): string[] {
    const modifiers: string[] = [];

    if (!modifierNodes) return modifiers;

    for (const node of modifierNodes) {
      if (node.children?.Public) modifiers.push('public');
      if (node.children?.Private) modifiers.push('private');
      if (node.children?.Protected) modifiers.push('protected');
      if (node.children?.Static) modifiers.push('static');
      if (node.children?.Final) modifiers.push('final');
      if (node.children?.Abstract) modifiers.push('abstract');
    }

    return modifiers;
  }

  /**
   * Extract annotations from modifier nodes
   */
  private extractAnnotations(modifierNodes: any[] | undefined): Annotation[] {
    const annotations: Annotation[] = [];

    if (!modifierNodes) return annotations;

    for (const node of modifierNodes) {
      // Check if this modifier node contains an annotation
      const annotation = node.children?.annotation?.[0];
      if (annotation) {
        // Extract annotation name from typeName.Identifier
        const annotationName = annotation.children?.typeName?.[0]
          ?.children?.Identifier?.[0]?.image;

        if (annotationName) {
          // Check if annotation has parameters
          const elementValuePairs = annotation.children?.elementValuePairList;
          const hasParams = elementValuePairs !== undefined;

          if (hasParams) {
            // TODO: Extract actual parameter values
            // For now, just indicate that parameters exist
            annotations.push({
              type: annotationName,
              arguments: {}  // Placeholder for actual parameters
            });
          } else {
            // Simple annotation without parameters
            annotations.push({
              type: annotationName
            });
          }
        }
      }
    }

    return annotations;
  }

  /**
   * Get visibility from modifiers
   */
  private getVisibility(modifiers: string[]): 'public' | 'protected' | 'package-private' | 'private' {
    if (modifiers.includes('public')) return 'public';
    if (modifiers.includes('protected')) return 'protected';
    if (modifiers.includes('private')) return 'private';
    return 'package-private';
  }

  /**
   * Extract line number from AST node (if available)
   */
  private extractLineNumber(node: any): number {
    try {
      // java-parser provides location info in startLine/endLine properties
      if (node.location?.startLine) {
        return node.location.startLine;
      }
      // Alternative: check children for location info
      if (node.children) {
        for (const key in node.children) {
          const child = node.children[key];
          if (Array.isArray(child) && child[0]?.startLine) {
            return child[0].startLine;
          }
        }
      }
    } catch {}
    return 1; // Fallback
  }

  /**
   * Extract interface members (method signatures)
   */
  private extractInterfaceMembers(interfaceBody: any, interfaceName: string, filePath: string): SymbolDefinition[] {
    const symbols: SymbolDefinition[] = [];

    try {
      const declarations = interfaceBody.children?.interfaceMemberDeclaration || [];

      for (const decl of declarations) {
        // Interface method declaration
        if (decl.children?.interfaceMethodDeclaration) {
          const methodDecl = decl.children.interfaceMethodDeclaration[0];
          const modifiers = this.extractModifiers(decl.children?.interfaceMethodModifier);
          const annotations = this.extractAnnotations(decl.children?.interfaceMethodModifier);
          const methodName = methodDecl?.children?.methodHeader?.[0]?.children?.methodDeclarator?.[0]?.children?.Identifier?.[0]?.image;

          if (methodName) {
            const qualifiedName = `${interfaceName}#${methodName}`;
            const visibility = this.getVisibility(modifiers);

            symbols.push({
              id: qualifiedName,
              name: methodName,
              qualifiedName,
              kind: 'method' as SymbolKind,
              location: {
                path: filePath,
                startLine: this.extractLineNumber(methodDecl),
                startColumn: 0,
                endLine: this.extractLineNumber(methodDecl),
                endColumn: 0
              },
              modifiers: modifiers as Modifier[],
              signature: `${modifiers.join(' ')} ${methodName}()`,
              annotations,
              parameters: [],
              visibility
            });
          }
        }
      }
    } catch (error) {
      console.error('Error extracting interface members:', error);
    }

    return symbols;
  }

  /**
   * Extract enum constants
   */
  private extractEnumConstants(enumBody: any, enumName: string, filePath: string): SymbolDefinition[] {
    const symbols: SymbolDefinition[] = [];

    try {
      const enumConstants = enumBody.children?.enumConstantList?.[0]?.children?.enumConstant || [];

      for (const constant of enumConstants) {
        const constantName = constant.children?.Identifier?.[0]?.image;

        if (constantName) {
          const qualifiedName = `${enumName}#${constantName}`;

          symbols.push({
            id: qualifiedName,
            name: constantName,
            qualifiedName,
            kind: 'enum-constant' as SymbolKind,
            location: {
              path: filePath,
              startLine: this.extractLineNumber(constant),
              startColumn: 0,
              endLine: this.extractLineNumber(constant),
              endColumn: 0
            },
            modifiers: ['public', 'static', 'final'],
            signature: constantName,
            annotations: [],
            visibility: 'public'
          });
        }
      }
    } catch (error) {
      console.error('Error extracting enum constants:', error);
    }

    return symbols;
  }

  /**
   * Index entire project (find all .java files and parse them)
   */
  async indexProject(): Promise<{
    files: string[];
    symbols: SymbolDefinition[];
    classes: string[];
  }> {
    const javaFiles = await this.findJavaFiles();
    const allSymbols: SymbolDefinition[] = [];

    for (const file of javaFiles) {
      const symbols = await this.parseFile(file);
      allSymbols.push(...symbols);

      // Store in index
      for (const symbol of symbols) {
        this.symbolIndex.set(symbol.id, symbol);
      }
    }

    const classes = allSymbols.filter(s => s.kind === 'class').map(s => s.qualifiedName);

    return {
      files: javaFiles,
      symbols: allSymbols,
      classes
    };
  }

  /**
   * Find all .java files in project
   */
  private async findJavaFiles(): Promise<string[]> {
    const files: string[] = [];

    async function scan(dir: string, baseDir: string): Promise<void> {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);

          if (entry.isDirectory()) {
            // Skip common non-source directories
            if (!['node_modules', '.git', 'dist', 'build', 'target'].includes(entry.name)) {
              await scan(fullPath, baseDir);
            }
          } else if (entry.isFile() && entry.name.endsWith('.java')) {
            const relativePath = path.relative(baseDir, fullPath);
            files.push(relativePath);
          }
        }
      } catch (error) {
        // Ignore read errors
      }
    }

    await scan(this.projectRoot, this.projectRoot);
    return files;
  }

  /**
   * Find symbols by name (case-insensitive substring match)
   */
  findSymbolsByName(name: string): SymbolDefinition[] {
    const searchTerm = name.toLowerCase();
    return Array.from(this.symbolIndex.values()).filter(symbol =>
      symbol.name.toLowerCase().includes(searchTerm)
    );
  }

  /**
   * Find symbols by kind
   */
  findSymbolsByKind(kind: SymbolKind): SymbolDefinition[] {
    return Array.from(this.symbolIndex.values()).filter(symbol =>
      symbol.kind === kind
    );
  }

  /**
   * Get symbol by qualified name
   */
  getSymbol(qualifiedName: string): SymbolDefinition | undefined {
    return this.symbolIndex.get(qualifiedName);
  }

  /**
   * Clear symbol index
   */
  clearIndex(): void {
    this.symbolIndex.clear();
  }
}
