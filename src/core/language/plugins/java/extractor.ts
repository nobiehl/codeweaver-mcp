/**
 * Java Symbol Extractor
 *
 * Extracts symbol definitions from Java AST.
 * Supports all Java features including:
 * - Classes, Interfaces, Enums, Records, Annotation Types
 * - Methods, Fields, Constructors
 * - Generics, Annotations, Modifiers
 * - Nested Types, Sealed Classes
 * - Module System (Java 9+)
 *
 * Extracted from SymbolsAgent for multi-language plugin architecture.
 */

import type { SymbolDefinition, SymbolKind, Modifier, Annotation, Parameter } from '../../../../types/symbols.js';

/**
 * Extract symbols from Java AST
 *
 * @param ast - Java AST from java-parser
 * @param filePath - Path to source file
 * @returns Array of extracted symbols
 */
export function extractSymbols(ast: any, filePath: string): SymbolDefinition[] {
  const symbols: SymbolDefinition[] = [];

  try {
    // Extract package name
    const packageDecl = ast.children?.ordinaryCompilationUnit?.[0]?.children?.packageDeclaration?.[0];
    const packageName = extractPackageName(packageDecl);

    // Check if this is module-info.java
    const modularUnit = ast.children?.modularCompilationUnit?.[0];
    if (modularUnit) {
      const moduleSymbols = extractModuleDeclaration(modularUnit, filePath);
      // Add language field to all symbols
      return moduleSymbols.map(s => ({ ...s, language: 'java' }));
    }

    // Extract type declarations (classes, interfaces, enums)
    const typeDecls = ast.children?.ordinaryCompilationUnit?.[0]?.children?.typeDeclaration || [];

    for (const typeDecl of typeDecls) {
      const typeSymbols = extractTypeDeclaration(typeDecl, packageName, filePath);
      symbols.push(...typeSymbols);
    }
  } catch (error) {
    console.error(`Error extracting symbols from ${filePath}:`, error);
  }

  // Add language field to all symbols
  return symbols.map(s => ({ ...s, language: 'java' }));
}

/**
 * Extract package name from package declaration
 */
function extractPackageName(packageDecl: any): string {
  if (!packageDecl) return '';

  try {
    const identifiers = packageDecl.children?.Identifier || [];
    return identifiers.map((id: any) => id.image).join('.');
  } catch {
    return '';
  }
}

/**
 * Extract type declaration (class, interface, enum, record, annotation)
 */
function extractTypeDeclaration(typeDecl: any, packageName: string, filePath: string): SymbolDefinition[] {
  const symbols: SymbolDefinition[] = [];

  try {
    // Class declaration (includes enums, records, annotation types)
    if (typeDecl.children?.classDeclaration) {
      const classDecl = typeDecl.children.classDeclaration[0];

      // Enum declaration
      if (classDecl.children?.enumDeclaration) {
        const enumDecl = classDecl.children.enumDeclaration[0];
        const enumName = enumDecl.children?.typeIdentifier?.[0]?.children?.Identifier?.[0]?.image;

        if (enumName) {
          const qualifiedName = packageName ? `${packageName}.${enumName}` : enumName;
          const modifiers = extractModifiers(classDecl.children?.classModifier);
          const annotations = extractAnnotations(classDecl.children?.classModifier);
          const visibility = getVisibility(modifiers);

          symbols.push({
            id: qualifiedName,
            name: enumName,
            qualifiedName,
            kind: 'enum' as SymbolKind,
            location: {
              path: filePath,
              startLine: extractLineNumber(enumDecl),
              startColumn: 0,
              endLine: extractLineNumber(enumDecl),
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
            const constantSymbols = extractEnumConstants(enumBody, qualifiedName, filePath);
            symbols.push(...constantSymbols);
          }
        }
      }
      // Record declaration
      else if (classDecl.children?.recordDeclaration) {
        const recordDecl = classDecl.children.recordDeclaration[0];
        const recordName = recordDecl.children?.typeIdentifier?.[0]?.children?.Identifier?.[0]?.image;

        if (recordName) {
          const qualifiedName = packageName ? `${packageName}.${recordName}` : recordName;
          const modifiers = extractModifiers(classDecl.children?.classModifier);
          const annotations = extractAnnotations(classDecl.children?.classModifier);
          const visibility = getVisibility(modifiers);

          // Extract record parameters from recordHeader
          const recordHeader = recordDecl.children?.recordHeader?.[0];
          const components = extractRecordComponents(recordHeader);

          symbols.push({
            id: qualifiedName,
            name: recordName,
            qualifiedName,
            kind: 'record' as SymbolKind,
            location: {
              path: filePath,
              startLine: extractLineNumber(recordDecl),
              startColumn: 0,
              endLine: extractLineNumber(recordDecl),
              endColumn: 0
            },
            modifiers: modifiers as Modifier[],
            signature: `${modifiers.join(' ')} record ${recordName}(${components.map(c => c.name).join(', ')})`,
            annotations,
            visibility,
            parameters: components
          });

          // Extract record body members (methods, constructors)
          const recordBody = recordDecl.children?.recordBody?.[0];
          if (recordBody) {
            const memberSymbols = extractRecordMembers(recordBody, qualifiedName, filePath);
            symbols.push(...memberSymbols);
          }
        }
      }
      // Annotation Type declaration
      else if (classDecl.children?.annotationTypeDeclaration) {
        const annotationDecl = classDecl.children.annotationTypeDeclaration[0];
        const annotationName = annotationDecl.children?.typeIdentifier?.[0]?.children?.Identifier?.[0]?.image;

        if (annotationName) {
          const qualifiedName = packageName ? `${packageName}.${annotationName}` : annotationName;
          const modifiers = extractModifiers(classDecl.children?.classModifier);
          const annotations = extractAnnotations(classDecl.children?.classModifier);
          const visibility = getVisibility(modifiers);

          symbols.push({
            id: qualifiedName,
            name: annotationName,
            qualifiedName,
            kind: 'annotation-type' as SymbolKind,
            location: {
              path: filePath,
              startLine: extractLineNumber(annotationDecl),
              startColumn: 0,
              endLine: extractLineNumber(annotationDecl),
              endColumn: 0
            },
            modifiers: modifiers as Modifier[],
            signature: `${modifiers.join(' ')} @interface ${annotationName}`,
            annotations,
            visibility
          });
        }
      }
      // Normal class (not enum or record)
      else {
        const className = classDecl.children?.normalClassDeclaration?.[0]?.children?.typeIdentifier?.[0]?.children?.Identifier?.[0]?.image;

        if (className) {
          const qualifiedName = packageName ? `${packageName}.${className}` : className;
          const modifiers = extractModifiers(classDecl.children?.classModifier);
          const annotations = extractAnnotations(classDecl.children?.classModifier);

          // Add class symbol
          const visibility = getVisibility(modifiers);
          symbols.push({
            id: qualifiedName,
            name: className,
            qualifiedName,
            kind: 'class' as SymbolKind,
            location: {
              path: filePath,
              startLine: extractLineNumber(classDecl),
              startColumn: 0,
              endLine: extractLineNumber(classDecl),
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
            const memberSymbols = extractClassMembers(classBody, qualifiedName, filePath);
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
        const modifiers = extractModifiers(interfaceDecl.children?.interfaceModifier);
        const annotations = extractAnnotations(interfaceDecl.children?.interfaceModifier);

        symbols.push({
          id: qualifiedName,
          name: interfaceName,
          qualifiedName,
          kind: 'interface' as SymbolKind,
          location: {
            path: filePath,
            startLine: extractLineNumber(interfaceDecl),
            startColumn: 0,
            endLine: extractLineNumber(interfaceDecl),
            endColumn: 0
          },
          modifiers: modifiers as Modifier[],
          signature: `${modifiers.join(' ')} interface ${interfaceName}`,
          annotations,
          visibility: getVisibility(modifiers)
        });

        // Extract interface members (methods)
        const interfaceBody = interfaceDecl.children?.normalInterfaceDeclaration?.[0]?.children?.interfaceBody?.[0];
        if (interfaceBody) {
          const memberSymbols = extractInterfaceMembers(interfaceBody, qualifiedName, filePath);
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
function extractClassMembers(classBody: any, className: string, filePath: string): SymbolDefinition[] {
  const symbols: SymbolDefinition[] = [];

  try {
    const declarations = classBody.children?.classBodyDeclaration || [];

    for (const decl of declarations) {
      // Field declaration
      if (decl.children?.classMemberDeclaration?.[0]?.children?.fieldDeclaration) {
        const fieldSymbols = extractFields(decl, className, filePath);
        symbols.push(...fieldSymbols);
      }

      // Method declaration
      if (decl.children?.classMemberDeclaration?.[0]?.children?.methodDeclaration) {
        const methodSymbol = extractMethod(decl, className, filePath);
        if (methodSymbol) symbols.push(methodSymbol);
      }

      // Constructor declaration
      if (decl.children?.constructorDeclaration) {
        const constructorSymbol = extractConstructor(decl, className, filePath);
        if (constructorSymbol) symbols.push(constructorSymbol);
      }

      // Nested type declarations (enum, class, interface)
      if (decl.children?.classMemberDeclaration?.[0]?.children?.classDeclaration) {
        const nestedTypeSymbols = extractNestedTypeDeclaration(
          decl.children.classMemberDeclaration[0].children.classDeclaration[0],
          decl.children?.classModifier,
          className,
          filePath
        );
        symbols.push(...nestedTypeSymbols);
      }

      // Nested interface declarations
      if (decl.children?.classMemberDeclaration?.[0]?.children?.interfaceDeclaration) {
        const nestedInterfaceSymbols = extractNestedInterfaceDeclaration(
          decl.children.classMemberDeclaration[0].children.interfaceDeclaration[0],
          decl.children?.classModifier,
          className,
          filePath
        );
        symbols.push(...nestedInterfaceSymbols);
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
function extractNestedTypeDeclaration(
  classDecl: any,
  classModifiers: any[] | undefined,
  parentClassName: string,
  filePath: string
): SymbolDefinition[] {
  const symbols: SymbolDefinition[] = [];

  try {
    const modifiers = extractModifiers(classModifiers);

    // Check if it's a nested enum
    if (classDecl.children?.enumDeclaration) {
      const enumDecl = classDecl.children.enumDeclaration[0];
      const enumName = enumDecl.children?.typeIdentifier?.[0]?.children?.Identifier?.[0]?.image;

      if (enumName) {
        const qualifiedName = `${parentClassName}$${enumName}`;
        const annotations = extractAnnotations(classModifiers);
        const visibility = getVisibility(modifiers);

        symbols.push({
          id: qualifiedName,
          name: enumName,
          qualifiedName,
          kind: 'enum' as SymbolKind,
          location: {
            path: filePath,
            startLine: extractLineNumber(enumDecl),
            startColumn: 0,
            endLine: extractLineNumber(enumDecl),
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
          const constantSymbols = extractEnumConstants(enumBody, qualifiedName, filePath);
          symbols.push(...constantSymbols);
        }
      }
    }
    // Check if it's a nested record
    else if (classDecl.children?.recordDeclaration) {
      const recordDecl = classDecl.children.recordDeclaration[0];
      const recordName = recordDecl.children?.typeIdentifier?.[0]?.children?.Identifier?.[0]?.image;

      if (recordName) {
        const qualifiedName = `${parentClassName}$${recordName}`;
        const annotations = extractAnnotations(classModifiers);
        const visibility = getVisibility(modifiers);

        // Extract record parameters from recordHeader
        const recordHeader = recordDecl.children?.recordHeader?.[0];
        const components = extractRecordComponents(recordHeader);

        symbols.push({
          id: qualifiedName,
          name: recordName,
          qualifiedName,
          kind: 'record' as SymbolKind,
          location: {
            path: filePath,
            startLine: extractLineNumber(recordDecl),
            startColumn: 0,
            endLine: extractLineNumber(recordDecl),
            endColumn: 0
          },
          modifiers: modifiers as Modifier[],
          signature: `${modifiers.join(' ')} record ${recordName}(${components.map(c => c.name).join(', ')})`,
          annotations,
          visibility,
          parameters: components
        });

        // Extract record body members (methods, constructors)
        const recordBody = recordDecl.children?.recordBody?.[0];
        if (recordBody) {
          const memberSymbols = extractRecordMembers(recordBody, qualifiedName, filePath);
          symbols.push(...memberSymbols);
        }
      }
    }
    // Check if it's a nested class
    else if (classDecl.children?.normalClassDeclaration) {
      const normalClassDecl = classDecl.children.normalClassDeclaration[0];
      const className = normalClassDecl.children?.typeIdentifier?.[0]?.children?.Identifier?.[0]?.image;

      if (className) {
        const qualifiedName = `${parentClassName}$${className}`;
        const annotations = extractAnnotations(classModifiers);
        const visibility = getVisibility(modifiers);

        symbols.push({
          id: qualifiedName,
          name: className,
          qualifiedName,
          kind: 'class' as SymbolKind,
          location: {
            path: filePath,
            startLine: extractLineNumber(normalClassDecl),
            startColumn: 0,
            endLine: extractLineNumber(normalClassDecl),
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
          const memberSymbols = extractClassMembers(classBody, qualifiedName, filePath);
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
        const annotations = extractAnnotations(classModifiers);
        const visibility = getVisibility(modifiers);

        symbols.push({
          id: qualifiedName,
          name: interfaceName,
          qualifiedName,
          kind: 'interface' as SymbolKind,
          location: {
            path: filePath,
            startLine: extractLineNumber(interfaceDecl),
            startColumn: 0,
            endLine: extractLineNumber(interfaceDecl),
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
          const memberSymbols = extractInterfaceMembers(interfaceBody, qualifiedName, filePath);
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
 * Extract nested interface declarations within a class
 */
function extractNestedInterfaceDeclaration(
  interfaceDecl: any,
  classModifiers: any[] | undefined,
  parentClassName: string,
  filePath: string
): SymbolDefinition[] {
  const symbols: SymbolDefinition[] = [];

  try {
    const modifiers = extractModifiers(classModifiers);
    const annotations = extractAnnotations(classModifiers);

    // Get interface modifiers from the interface declaration itself
    const interfaceModifiers = extractModifiers(interfaceDecl.children?.interfaceModifier);
    const interfaceAnnotations = extractAnnotations(interfaceDecl.children?.interfaceModifier);

    // Merge modifiers and annotations
    const allModifiers = [...modifiers, ...interfaceModifiers];
    const allAnnotations = [...annotations, ...interfaceAnnotations];

    const interfaceName = interfaceDecl.children?.normalInterfaceDeclaration?.[0]
      ?.children?.typeIdentifier?.[0]?.children?.Identifier?.[0]?.image;

    if (interfaceName) {
      const qualifiedName = `${parentClassName}$${interfaceName}`;
      const visibility = getVisibility(allModifiers);

      symbols.push({
        id: qualifiedName,
        name: interfaceName,
        qualifiedName,
        kind: 'interface' as SymbolKind,
        location: {
          path: filePath,
          startLine: extractLineNumber(interfaceDecl),
          startColumn: 0,
          endLine: extractLineNumber(interfaceDecl),
          endColumn: 0
        },
        modifiers: allModifiers as Modifier[],
        signature: `${allModifiers.join(' ')} interface ${interfaceName}`,
        annotations: allAnnotations,
        visibility
      });

      // Extract interface members
      const interfaceBody = interfaceDecl.children?.normalInterfaceDeclaration?.[0]?.children?.interfaceBody?.[0];
      if (interfaceBody) {
        const memberSymbols = extractInterfaceMembers(interfaceBody, qualifiedName, filePath);
        symbols.push(...memberSymbols);
      }
    }
  } catch (error) {
    console.error('Error extracting nested interface declaration:', error);
  }

  return symbols;
}

/**
 * Extract field declarations
 */
function extractFields(decl: any, className: string, filePath: string): SymbolDefinition[] {
  const symbols: SymbolDefinition[] = [];

  try {
    const fieldDecl = decl.children?.classMemberDeclaration?.[0]?.children?.fieldDeclaration?.[0];
    // Extract modifiers and annotations from fieldModifier (not classModifier!)
    const modifiers = extractModifiers(fieldDecl?.children?.fieldModifier);
    const annotations = extractAnnotations(fieldDecl?.children?.fieldModifier);
    const variables = fieldDecl?.children?.variableDeclaratorList?.[0]?.children?.variableDeclarator || [];

    for (const variable of variables) {
      const fieldName = variable.children?.variableDeclaratorId?.[0]?.children?.Identifier?.[0]?.image;

      if (fieldName) {
        const qualifiedName = `${className}#${fieldName}`;
        const visibility = getVisibility(modifiers);

        symbols.push({
          id: qualifiedName,
          name: fieldName,
          qualifiedName,
          kind: 'field' as SymbolKind,
          location: {
            path: filePath,
            startLine: extractLineNumber(fieldDecl),
            startColumn: 0,
            endLine: extractLineNumber(fieldDecl),
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
function extractMethod(decl: any, className: string, filePath: string): SymbolDefinition | null {
  try {
    const methodDecl = decl.children?.classMemberDeclaration?.[0]?.children?.methodDeclaration?.[0];
    const methodHeader = methodDecl?.children?.methodHeader?.[0];
    const methodDeclarator = methodHeader?.children?.methodDeclarator?.[0];

    // Extract modifiers and annotations from methodModifier (not classModifier!)
    const modifiers = extractModifiers(methodDecl?.children?.methodModifier);
    const annotations = extractAnnotations(methodDecl?.children?.methodModifier);
    const methodName = methodDeclarator?.children?.Identifier?.[0]?.image;

    if (methodName) {
      const qualifiedName = `${className}#${methodName}`;
      const visibility = getVisibility(modifiers);

      // Extract method parameters
      const parameters = extractMethodParameters(methodDeclarator);

      // Extract generic type parameters for signature
      const typeParams = extractTypeParametersSignature(methodHeader);

      // Build signature
      const paramSig = parameters.map(p => `${p.type.name} ${p.name}`).join(', ');
      const signature = `${modifiers.join(' ')} ${typeParams}${methodName}(${paramSig})`.trim();

      return {
        id: qualifiedName,
        name: methodName,
        qualifiedName,
        kind: 'method' as SymbolKind,
        location: {
          path: filePath,
          startLine: extractLineNumber(methodDecl),
          startColumn: 0,
          endLine: extractLineNumber(methodDecl),
          endColumn: 0
        },
        modifiers: modifiers as Modifier[],
        signature,
        annotations,
        parameters,
        visibility
      };
    }
  } catch (error) {
    console.error('Error extracting method:', error);
  }

  return null;
}

/**
 * Extract method parameters from method declarator
 */
function extractMethodParameters(methodDeclarator: any): Parameter[] {
  const parameters: Parameter[] = [];

  try {
    const formalParamList = methodDeclarator?.children?.formalParameterList?.[0];
    const formalParams = formalParamList?.children?.formalParameter || [];

    for (const param of formalParams) {
      const varParam = param.children?.variableParaRegularParameter?.[0];
      if (varParam) {
        const paramName = varParam.children?.variableDeclaratorId?.[0]?.children?.Identifier?.[0]?.image;
        const unannType = varParam.children?.unannType?.[0];

        // Extract type name (simplified)
        let typeName = 'Object';
        if (unannType?.children?.unannPrimitiveType) {
          typeName = unannType.children.unannPrimitiveType[0]?.children?.numericType?.[0]?.name || 'int';
        } else if (unannType?.children?.unannReferenceType) {
          const classOrInterfaceType = unannType.children.unannReferenceType[0]?.children?.unannClassOrInterfaceType?.[0];
          const unannClassType = classOrInterfaceType?.children?.unannClassType?.[0];

          // Try to get Identifier directly from unannClassType
          const identifiers = unannClassType?.children?.Identifier;
          if (identifiers && identifiers.length > 0) {
            typeName = identifiers.map((id: any) => id.image).join('.');
          } else {
            // Fallback to typeIdentifier
            const typeIdentifiers = unannClassType?.children?.typeIdentifier;
            if (typeIdentifiers) {
              typeName = typeIdentifiers.map((id: any) => id?.children?.Identifier?.[0]?.image).join('.');
            }
          }
        }

        // Extract annotations from variableModifier
        const annotations = extractAnnotations(varParam.children?.variableModifier);

        if (paramName) {
          parameters.push({
            name: paramName,
            type: { name: typeName },
            annotations
          });
        }
      }
    }
  } catch (error) {
    console.error('Error extracting method parameters:', error);
  }

  return parameters;
}

/**
 * Extract generic type parameters signature
 */
function extractTypeParametersSignature(methodHeader: any): string {
  try {
    const typeParams = methodHeader?.children?.typeParameters?.[0];
    if (!typeParams) return '';

    const typeParamList = typeParams.children?.typeParameterList?.[0];
    const typeParamsArray = typeParamList?.children?.typeParameter || [];

    if (typeParamsArray.length === 0) return '';

    const paramStrings = typeParamsArray.map((tp: any) => {
      const identifier = tp.children?.typeIdentifier?.[0]?.children?.Identifier?.[0]?.image;
      const typeBound = tp.children?.typeBound?.[0];

      if (typeBound) {
        const classOrInterfaceTypes = typeBound.children?.classOrInterfaceType || [];
        const bounds = classOrInterfaceTypes.map((coit: any) => {
          // Extract from classType (not directly from classOrInterfaceType)
          const classType = coit.children?.classType?.[0];
          if (classType) {
            const ids = classType.children?.Identifier || [];
            return ids.map((id: any) => id.image).join('.');
          }
          return '';
        }).filter((s: string) => s).join(' & ');
        return `${identifier} extends ${bounds}`;
      }

      return identifier;
    }).filter((s: string) => s);

    return paramStrings.length > 0 ? `<${paramStrings.join(', ')}> ` : '';
  } catch (error) {
    console.error('Error extracting type parameters:', error);
    return '';
  }
}

/**
 * Extract constructor declaration
 */
function extractConstructor(decl: any, className: string, filePath: string): SymbolDefinition | null {
  try {
    const constructorDecl = decl.children?.constructorDeclaration?.[0];
    const modifiers = extractModifiers(decl.children?.constructorModifier);
    const annotations = extractAnnotations(decl.children?.constructorModifier);
    const constructorName = constructorDecl?.children?.simpleTypeName?.[0]?.children?.Identifier?.[0]?.image;

    if (constructorName) {
      const qualifiedName = `${className}#<init>`;
      const visibility = getVisibility(modifiers);

      return {
        id: qualifiedName,
        name: constructorName,
        qualifiedName,
        kind: 'constructor' as SymbolKind,
        location: {
          path: filePath,
          startLine: extractLineNumber(constructorDecl),
          startColumn: 0,
          endLine: extractLineNumber(constructorDecl),
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
function extractModifiers(modifierNodes: any[] | undefined): string[] {
  const modifiers: string[] = [];

  if (!modifierNodes) return modifiers;

  for (const node of modifierNodes) {
    if (node.children?.Public) modifiers.push('public');
    if (node.children?.Private) modifiers.push('private');
    if (node.children?.Protected) modifiers.push('protected');
    if (node.children?.Static) modifiers.push('static');
    if (node.children?.Final) modifiers.push('final');
    if (node.children?.Abstract) modifiers.push('abstract');
    if (node.children?.Sealed) modifiers.push('sealed');
    if (node.children?.NonSealed) modifiers.push('non-sealed');
  }

  return modifiers;
}

/**
 * Extract annotations from modifier nodes
 */
function extractAnnotations(modifierNodes: any[] | undefined): Annotation[] {
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
function getVisibility(modifiers: string[]): 'public' | 'protected' | 'package-private' | 'private' {
  if (modifiers.includes('public')) return 'public';
  if (modifiers.includes('protected')) return 'protected';
  if (modifiers.includes('private')) return 'private';
  return 'package-private';
}

/**
 * Extract line number from AST node (if available)
 */
function extractLineNumber(node: any): number {
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
function extractInterfaceMembers(interfaceBody: any, interfaceName: string, filePath: string): SymbolDefinition[] {
  const symbols: SymbolDefinition[] = [];

  try {
    const declarations = interfaceBody.children?.interfaceMemberDeclaration || [];

    for (const decl of declarations) {
      // Interface method declaration
      if (decl.children?.interfaceMethodDeclaration) {
        const methodDecl = decl.children.interfaceMethodDeclaration[0];
        const modifiers = extractModifiers(decl.children?.interfaceMethodModifier);
        const annotations = extractAnnotations(decl.children?.interfaceMethodModifier);
        const methodName = methodDecl?.children?.methodHeader?.[0]?.children?.methodDeclarator?.[0]?.children?.Identifier?.[0]?.image;

        if (methodName) {
          const qualifiedName = `${interfaceName}#${methodName}`;
          const visibility = getVisibility(modifiers);

          symbols.push({
            id: qualifiedName,
            name: methodName,
            qualifiedName,
            kind: 'method' as SymbolKind,
            location: {
              path: filePath,
              startLine: extractLineNumber(methodDecl),
              startColumn: 0,
              endLine: extractLineNumber(methodDecl),
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
 * Extract record components (parameters) from recordHeader
 */
function extractRecordComponents(recordHeader: any): Parameter[] {
  const components: Parameter[] = [];

  if (!recordHeader) return components;

  try {
    const componentList = recordHeader.children?.recordComponentList?.[0];
    const recordComponents = componentList?.children?.recordComponent || [];

    for (const component of recordComponents) {
      const componentName = component.children?.Identifier?.[0]?.image;

      if (componentName) {
        // Extract annotations from recordComponentModifier
        const annotations = extractAnnotations(component.children?.recordComponentModifier);

        // Extract type information (simplified for now)
        const unannType = component.children?.unannType?.[0];
        const typeName = unannType?.children?.unannPrimitiveType?.[0]?.children?.numericType?.[0]?.name ||
                        unannType?.children?.unannReferenceType?.[0]?.children?.unannClassOrInterfaceType?.[0]
                          ?.children?.unannClassType?.[0]?.children?.typeIdentifier?.[0]?.children?.Identifier?.[0]?.image ||
                        'Object';

        components.push({
          name: componentName,
          type: { name: typeName },
          annotations
        });
      }
    }
  } catch (error) {
    console.error('Error extracting record components:', error);
  }

  return components;
}

/**
 * Extract members from record body (methods, constructors)
 */
function extractRecordMembers(recordBody: any, recordName: string, filePath: string): SymbolDefinition[] {
  const symbols: SymbolDefinition[] = [];

  if (!recordBody) return symbols;

  try {
    const declarations = recordBody.children?.recordBodyDeclaration || [];

    for (const decl of declarations) {
      // Check for class body declaration (methods, constructors, fields)
      if (decl.children?.classBodyDeclaration) {
        const bodyDecl = decl.children.classBodyDeclaration[0];

        // Method declaration
        if (bodyDecl.children?.classMemberDeclaration?.[0]?.children?.methodDeclaration) {
          const methodSymbol = extractMethod(bodyDecl, recordName, filePath);
          if (methodSymbol) symbols.push(methodSymbol);
        }

        // Constructor declaration (compact constructor)
        if (bodyDecl.children?.constructorDeclaration) {
          const constructorSymbol = extractConstructor(bodyDecl, recordName, filePath);
          if (constructorSymbol) symbols.push(constructorSymbol);
        }
      }

      // Compact constructor (special for records)
      if (decl.children?.compactConstructorDeclaration) {
        const compactConstructor = decl.children.compactConstructorDeclaration[0];
        const modifiers = extractModifiers(compactConstructor?.children?.constructorModifier);
        const annotations = extractAnnotations(compactConstructor?.children?.constructorModifier);

        symbols.push({
          id: `${recordName}#<init>`,
          name: recordName.split('.').pop() || recordName,
          qualifiedName: `${recordName}#<init>`,
          kind: 'constructor' as SymbolKind,
          location: {
            path: filePath,
            startLine: extractLineNumber(compactConstructor),
            startColumn: 0,
            endLine: extractLineNumber(compactConstructor),
            endColumn: 0
          },
          modifiers: modifiers as Modifier[],
          signature: `${modifiers.join(' ')} ${recordName}()`,
          annotations,
          parameters: [],
          visibility: getVisibility(modifiers)
        });
      }
    }
  } catch (error) {
    console.error('Error extracting record members:', error);
  }

  return symbols;
}

/**
 * Extract enum constants
 */
function extractEnumConstants(enumBody: any, enumName: string, filePath: string): SymbolDefinition[] {
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
            startLine: extractLineNumber(constant),
            startColumn: 0,
            endLine: extractLineNumber(constant),
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
 * Extract module declaration (module-info.java)
 */
function extractModuleDeclaration(modularUnit: any, filePath: string): SymbolDefinition[] {
  const symbols: SymbolDefinition[] = [];

  try {
    const moduleDecl = modularUnit.children?.moduleDeclaration?.[0];
    if (!moduleDecl) return symbols;

    // Extract module name
    const moduleNameParts = moduleDecl.children?.Identifier || [];
    const moduleName = moduleNameParts.map((id: any) => id.image).join('.');

    if (!moduleName) return symbols;

    // Extract module directives
    const directives = moduleDecl.children?.moduleDirective || [];
    const directiveStrings: string[] = [];

    for (const directive of directives) {
      // requires directive
      if (directive.children?.requiresModuleDirective) {
        const req = directive.children.requiresModuleDirective[0];
        const modifiers = req.children?.requiresModifier || [];
        const modifierStr = modifiers.map((mod: any) => {
          if (mod.children?.Transitive) return 'transitive';
          if (mod.children?.Static) return 'static';
          return '';
        }).filter((s: string) => s).join(' ');

        const requiredModule = req.children?.moduleName?.[0]?.children?.Identifier
          ?.map((id: any) => id.image).join('.') || '';

        directiveStrings.push(`requires ${modifierStr} ${requiredModule}`.trim());
      }

      // exports directive
      if (directive.children?.exportsModuleDirective) {
        const exp = directive.children.exportsModuleDirective[0];
        const packageName = exp.children?.packageName?.[0]?.children?.Identifier
          ?.map((id: any) => id.image).join('.') || '';

        // Check if there's a "to" clause
        if (exp.children?.To) {
          const targetModules = exp.children?.moduleName || [];
          const targets = targetModules.map((mod: any) =>
            mod.children?.Identifier?.map((id: any) => id.image).join('.') || ''
          ).filter((s: string) => s);
          directiveStrings.push(`exports ${packageName} to ${targets.join(', ')}`);
        } else {
          directiveStrings.push(`exports ${packageName}`);
        }
      }

      // opens directive
      if (directive.children?.opensModuleDirective) {
        const opens = directive.children.opensModuleDirective[0];
        const packageName = opens.children?.packageName?.[0]?.children?.Identifier
          ?.map((id: any) => id.image).join('.') || '';

        // Check if there's a "to" clause
        if (opens.children?.To) {
          const targetModules = opens.children?.moduleName || [];
          const targets = targetModules.map((mod: any) =>
            mod.children?.Identifier?.map((id: any) => id.image).join('.') || ''
          ).filter((s: string) => s);
          directiveStrings.push(`opens ${packageName} to ${targets.join(', ')}`);
        } else {
          directiveStrings.push(`opens ${packageName}`);
        }
      }

      // uses directive
      if (directive.children?.usesModuleDirective) {
        const uses = directive.children.usesModuleDirective[0];
        const typeName = uses.children?.typeName?.[0]?.children?.Identifier
          ?.map((id: any) => id.image).join('.') || '';
        directiveStrings.push(`uses ${typeName}`);
      }

      // provides directive
      if (directive.children?.providesModuleDirective) {
        const provides = directive.children.providesModuleDirective[0];
        const typeNames = provides.children?.typeName || [];

        // First typeName is the service interface, rest are implementations
        const interfaceName = typeNames[0]?.children?.Identifier
          ?.map((id: any) => id.image).join('.') || '';

        const implementations = typeNames.slice(1).map((type: any) =>
          type.children?.Identifier?.map((id: any) => id.image).join('.') || ''
        ).filter((s: string) => s);

        directiveStrings.push(`provides ${interfaceName} with ${implementations.join(', ')}`);
      }
    }

    // Create module symbol
    const signature = directiveStrings.length > 0
      ? `module ${moduleName} {\n  ${directiveStrings.join(';\n  ')};\n}`
      : `module ${moduleName}`;

    symbols.push({
      id: moduleName,
      name: moduleName,
      qualifiedName: moduleName,
      kind: 'module' as SymbolKind,
      location: {
        path: filePath,
        startLine: extractLineNumber(moduleDecl),
        startColumn: 0,
        endLine: extractLineNumber(moduleDecl),
        endColumn: 0
      },
      modifiers: [],
      signature,
      annotations: [],
      visibility: 'public'
    });

  } catch (error) {
    console.error('Error extracting module declaration:', error);
  }

  return symbols;
}
