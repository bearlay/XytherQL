import type { IntrospectionTypeRef } from "./types";

const BUILTIN_SCALARS = new Set([
  "String",
  "Int",
  "Float",
  "Boolean",
  "ID",
]);

export function unwrapTypeRef(ref: IntrospectionTypeRef | null | undefined): {
  namedType: string;
  namedKind: string;
  typeLabel: string;
  isList: boolean;
  isNonNull: boolean;
} {
  if (!ref) {
    return {
      namedType: "Unknown",
      namedKind: "SCALAR",
      typeLabel: "Unknown",
      isList: false,
      isNonNull: false,
    };
  }

  let current = ref;
  let isList = false;
  let isNonNull = false;

  while (current.kind === "NON_NULL" || current.kind === "LIST") {
    if (current.kind === "LIST") isList = true;
    if (current.kind === "NON_NULL") isNonNull = true;
    current = current.ofType ?? current;
  }

  const namedType = current.name ?? "Unknown";
  const namedKind = current.kind ?? "SCALAR";
  let typeLabel = namedType;
  if (isList) typeLabel = `[${typeLabel}]`;
  if (isNonNull) typeLabel = `${typeLabel}!`;

  return { namedType, namedKind, typeLabel, isList, isNonNull };
}

export function isRelayTypeName(name: string): boolean {
  return (
    name === "Node" ||
    name === "PageInfo" ||
    name.endsWith("Connection") ||
    name.endsWith("Edge")
  );
}

export function isLeafNamedType(kind: string): boolean {
  return kind === "SCALAR" || kind === "ENUM";
}

export function isBuiltinScalar(name: string): boolean {
  return BUILTIN_SCALARS.has(name);
}

export function kindAccent(kind: string): string {
  switch (kind) {
    case "OBJECT":
      return "#00F0FF";
    case "INTERFACE":
      return "#7A5CFF";
    case "UNION":
      return "#F59E0B";
    case "ENUM":
      return "#34D399";
    case "INPUT_OBJECT":
      return "#F472B6";
    case "SCALAR":
      return "#94A3B8";
    default:
      return "#64748B";
  }
}
