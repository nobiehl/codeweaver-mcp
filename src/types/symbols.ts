export type SymbolId = string;
export type FilePath = string;
export type PackageName = string;

export type SymbolKind =
  | 'package'
  | 'import'
  | 'class' | 'interface' | 'enum' | 'record' | 'annotation-type'
  | 'module'
  | 'method' | 'constructor'
  | 'field' | 'enum-constant'
  | 'parameter' | 'local-variable'
  | 'type-parameter';

export type Modifier =
  | 'public' | 'protected' | 'private'
  | 'static' | 'final' | 'abstract' | 'native' | 'synchronized' | 'transient' | 'volatile'
  | 'strictfp' | 'default'
  | 'sealed' | 'non-sealed';

export interface Location {
  path: string;
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
}

export interface TypeReference {
  name: string;
  qualifiedName?: string;
  typeArguments?: TypeReference[];
  arrayDimensions?: number;
}

export interface Parameter {
  name: string;
  type: TypeReference;
  annotations: Annotation[];
}

export interface Annotation {
  type: string;
  arguments?: Record<string, any>;
}

export interface SymbolDefinition {
  id: SymbolId;
  kind: SymbolKind;
  name: string;
  qualifiedName: string;
  location: Location;
  signature?: string;
  returnType?: TypeReference;
  parameters?: Parameter[];
  typeParameters?: string[];
  modifiers: Modifier[];
  annotations: Annotation[];
  parent?: SymbolId;
  extends?: SymbolId[];
  implements?: SymbolId[];
  javadoc?: string;
  visibility: 'public' | 'protected' | 'package-private' | 'private';
}

export type ReferenceKind =
  | 'call'
  | 'field-access'
  | 'type-usage'
  | 'extends'
  | 'implements'
  | 'annotation'
  | 'throws'
  | 'instantiation';

export interface Reference {
  from: Location;
  to: SymbolId;
  kind: ReferenceKind;
  context?: string;
}

export interface FileSymbols {
  path: string;
  hash: string;
  lastModified: Date;
  packageName: string;
  imports: ImportInfo[];
  topLevelSymbols: SymbolId[];
  allSymbols: SymbolId[];
}

export interface ImportInfo {
  importedName: string;
  isStatic: boolean;
  isWildcard: boolean;
}

export interface PackageInfo {
  name: string;
  files: string[];
  classes: SymbolId[];
  interfaces: SymbolId[];
  enums: SymbolId[];
  annotations: SymbolId[];
}
