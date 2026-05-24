import dagre from "dagre";
import type { Edge, Node } from "@xyflow/react";
import type { IntrospectionResponse } from "@/lib/api";
import {
  isBuiltinScalar,
  isLeafNamedType,
  isRelayTypeName,
  kindAccent,
  unwrapTypeRef,
} from "./introspection-utils";
import type {
  GraphFieldInfo,
  GraphTypeInfo,
  IntrospectionSchema,
  IntrospectionType,
  SchemaGraphDisplayOptions,
  SchemaGraphModel,
} from "./types";

export type ErFieldPreview = {
  name: string;
  typeLabel: string;
  isRelation: boolean;
  isKey?: boolean;
};

export type TypeNodeData = {
  label: string;
  kind: string;
  isRoot?: boolean;
  accent: string;
  previewFields: ErFieldPreview[];
  moreCount: number;
  dimmed?: boolean;
  focused?: boolean;
};

export type ErEdgeData = {
  fields: string[];
};

const MAX_TYPES = 80;
const MAX_PREVIEW_FIELDS = 7;
const NODE_WIDTH = 248;
const HEADER_HEIGHT = 44;
const FIELD_ROW_HEIGHT = 22;
const FOOTER_HEIGHT = 26;

function parseSchema(raw: IntrospectionResponse): IntrospectionSchema {
  return raw.data.__schema as unknown as IntrospectionSchema;
}

function mapFields(
  fields: IntrospectionType["fields"] | IntrospectionType["inputFields"],
  options: SchemaGraphDisplayOptions
): GraphFieldInfo[] {
  if (!fields) return [];

  let list = fields.map((f) => {
    const unwrapped = unwrapTypeRef(f.type);
    return {
      name: f.name,
      typeLabel: unwrapped.typeLabel,
      namedType: unwrapped.namedType,
      namedKind: unwrapped.namedKind,
      description: f.description ?? undefined,
      isDeprecated: f.isDeprecated,
      args: f.args?.map((a) => ({
        name: a.name,
        typeLabel: unwrapTypeRef(a.type).typeLabel,
      })),
    } satisfies GraphFieldInfo;
  });

  if (options.skipDeprecated) {
    list = list.filter((f) => !f.isDeprecated);
  }

  if (options.sortByAlphabet) {
    list.sort((a, b) => a.name.localeCompare(b.name));
  }

  return list;
}

function buildTypeCatalog(
  schema: IntrospectionSchema,
  options: SchemaGraphDisplayOptions
): Record<string, GraphTypeInfo> {
  const catalog: Record<string, GraphTypeInfo> = {};
  const queryRoot = schema.queryType?.name;
  const mutationRoot = schema.mutationType?.name;

  for (const t of schema.types) {
    if (!t.name || t.name.startsWith("__")) continue;
    if (options.skipRelay && isRelayTypeName(t.name)) continue;

    const fields =
      t.kind === "OBJECT" || t.kind === "INTERFACE"
        ? mapFields(t.fields, options)
        : t.kind === "INPUT_OBJECT"
          ? mapFields(t.inputFields, options)
          : [];

    catalog[t.name] = {
      name: t.name,
      kind: t.kind,
      description: t.description ?? undefined,
      fields,
      enumValues: t.enumValues?.map((v) => ({
        name: v.name,
        description: v.description ?? undefined,
        isDeprecated: v.isDeprecated,
      })),
      interfaces: t.interfaces?.map((i) => i.name),
      possibleTypes: t.possibleTypes?.map((p) => p.name),
      isRoot: t.name === queryRoot || t.name === mutationRoot,
    };
  }

  return catalog;
}

function collectReachable(
  start: string[],
  catalog: Record<string, GraphTypeInfo>,
  options: SchemaGraphDisplayOptions,
  maxDepth: number
): Set<string> {
  const seen = new Set<string>();
  const queue: Array<{ name: string; depth: number }> = start
    .filter((n) => catalog[n])
    .map((n) => ({ name: n, depth: 0 }));

  while (queue.length > 0) {
    const { name, depth } = queue.shift()!;
    if (seen.has(name)) continue;
    seen.add(name);
    if (depth >= maxDepth) continue;

    const info = catalog[name];
    if (!info) continue;

    for (const field of info.fields) {
      if (options.skipRelay && isRelayTypeName(field.namedType)) continue;
      if (
        !options.showLeafFields &&
        isLeafNamedType(field.namedKind) &&
        !catalog[field.namedType]
      ) {
        continue;
      }
      if (catalog[field.namedType] && !seen.has(field.namedType)) {
        queue.push({ name: field.namedType, depth: depth + 1 });
      }
    }

    for (const pt of info.possibleTypes ?? []) {
      if (catalog[pt] && !seen.has(pt)) {
        queue.push({ name: pt, depth: depth + 1 });
      }
    }
  }

  return seen;
}

function shouldIncludeType(
  name: string,
  kind: string,
  options: SchemaGraphDisplayOptions
): boolean {
  if (options.skipRelay && isRelayTypeName(name)) return false;
  if (kind === "SCALAR" && isBuiltinScalar(name) && !options.showLeafFields) {
    return false;
  }
  return ["OBJECT", "INTERFACE", "UNION", "ENUM", "INPUT_OBJECT"].includes(
    kind
  );
}

export function buildSchemaGraphModel(
  introspection: IntrospectionResponse,
  options: SchemaGraphDisplayOptions = {}
): SchemaGraphModel {
  const schema = parseSchema(introspection);
  const catalog = buildTypeCatalog(schema, options);
  const queryRoot = schema.queryType?.name;
  const mutationRoot = schema.mutationType?.name;

  const allNames = Object.keys(catalog);
  const entityNames = allNames.filter((n) =>
    shouldIncludeType(n, catalog[n].kind, options)
  );

  return {
    typesByName: catalog,
    queryRoot,
    mutationRoot,
    truncated: entityNames.length > MAX_TYPES,
    totalTypes: entityNames.length,
  };
}

export function getFocusNeighborhood(
  centerId: string,
  catalog: Record<string, GraphTypeInfo>,
  options: SchemaGraphDisplayOptions,
  depth = 2
): Set<string> {
  if (!catalog[centerId]) return new Set();
  return collectReachable([centerId], catalog, options, depth);
}

export function getDefaultFocusId(model: SchemaGraphModel): string | null {
  if (model.queryRoot && model.typesByName[model.queryRoot]) {
    return model.queryRoot;
  }
  const first = Object.keys(model.typesByName).find(
    (n) => model.typesByName[n].kind === "OBJECT"
  );
  return first ?? null;
}

function nodeHeight(previewCount: number, moreCount: number): number {
  const rows = Math.min(previewCount, MAX_PREVIEW_FIELDS);
  const footer = moreCount > 0 ? FOOTER_HEIGHT : 8;
  return HEADER_HEIGHT + rows * FIELD_ROW_HEIGHT + footer;
}

function buildPreviewFields(
  info: GraphTypeInfo,
  visibleTypes: Set<string>,
  options: SchemaGraphDisplayOptions
): { preview: ErFieldPreview[]; more: number } {
  const relations: ErFieldPreview[] = [];
  const scalars: ErFieldPreview[] = [];

  for (const f of info.fields) {
    const isRelation =
      visibleTypes.has(f.namedType) &&
      !isLeafNamedType(f.namedKind) &&
      f.namedKind !== "ENUM";
    const isKey =
      f.name === "id" ||
      f.name.endsWith("_id") ||
      f.name === "uuid" ||
      f.typeLabel === "ID!" ||
      f.typeLabel === "uuid!";

    const row: ErFieldPreview = {
      name: f.name,
      typeLabel: f.typeLabel,
      isRelation,
      isKey,
    };

    if (isRelation) relations.push(row);
    else if (options.showLeafFields || !isLeafNamedType(f.namedKind)) {
      scalars.push(row);
    }
  }

  const ordered = [...relations, ...scalars];
  const preview = ordered.slice(0, MAX_PREVIEW_FIELDS);
  return { preview, more: Math.max(0, ordered.length - preview.length) };
}

export type BuildFlowOptions = {
  focusId?: string | null;
  focusDepth?: number;
  showAll?: boolean;
  highlightIds?: Set<string> | null;
};

export function buildFlowGraph(
  model: SchemaGraphModel,
  displayOptions: SchemaGraphDisplayOptions = {},
  flowOptions: BuildFlowOptions = {}
): { nodes: Node<TypeNodeData>[]; edges: Edge[]; visibleCount: number } {
  const { typesByName } = model;
  const catalog = typesByName;

  let visibleNames: Set<string>;

  if (flowOptions.showAll) {
    visibleNames = new Set(
      Object.keys(catalog).filter((n) =>
        shouldIncludeType(n, catalog[n].kind, displayOptions)
      )
    );
    if (visibleNames.size > MAX_TYPES) {
      const roots = [model.queryRoot, model.mutationRoot].filter(
        Boolean
      ) as string[];
      visibleNames = collectReachable(roots, catalog, displayOptions, 4);
      for (const r of roots) {
        if (catalog[r]) visibleNames.add(r);
      }
    }
  } else if (flowOptions.focusId && catalog[flowOptions.focusId]) {
    visibleNames = getFocusNeighborhood(
      flowOptions.focusId,
      catalog,
      displayOptions,
      flowOptions.focusDepth ?? 2
    );
    if (visibleNames.size === 0) {
      visibleNames.add(flowOptions.focusId);
    }
  } else {
    const defaultFocus = getDefaultFocusId(model);
    visibleNames = defaultFocus
      ? getFocusNeighborhood(defaultFocus, catalog, displayOptions, 2)
      : new Set(
          Object.keys(catalog)
            .filter((n) => catalog[n].kind === "OBJECT")
            .slice(0, 24)
        );
  }

  const edgeMap = new Map<string, { source: string; target: string; fields: string[] }>();

  for (const sourceName of visibleNames) {
    const info = catalog[sourceName];
    if (!info) continue;

    for (const field of info.fields) {
      const target = field.namedType;
      if (!visibleNames.has(target)) continue;
      if (displayOptions.skipRelay && isRelayTypeName(target)) continue;
      if (
        !displayOptions.showLeafFields &&
        field.namedKind === "SCALAR" &&
        isBuiltinScalar(target)
      ) {
        continue;
      }
      if (isLeafNamedType(field.namedKind) && !visibleNames.has(target)) {
        continue;
      }

      const pairKey = `${sourceName}\t${target}`;
      const existing = edgeMap.get(pairKey);
      if (existing) {
        if (!existing.fields.includes(field.name)) {
          existing.fields.push(field.name);
        }
      } else {
        edgeMap.set(pairKey, {
          source: sourceName,
          target,
          fields: [field.name],
        });
      }
    }

    if (info.kind === "UNION") {
      for (const pt of info.possibleTypes ?? []) {
        if (!visibleNames.has(pt)) continue;
        const pairKey = `${sourceName}\t${pt}`;
        if (!edgeMap.has(pairKey)) {
          edgeMap.set(pairKey, {
            source: sourceName,
            target: pt,
            fields: ["∪"],
          });
        }
      }
    }
  }

  const highlight = flowOptions.highlightIds;
  const focusId = flowOptions.focusId;

  const edges: Edge[] = [...edgeMap.values()].map(({ source, target, fields }) => {
    const active =
      !highlight ||
      highlight.has(source) ||
      highlight.has(target) ||
      source === focusId ||
      target === focusId;
    const isFocusEdge = Boolean(
      focusId && (source === focusId || target === focusId)
    );

    return {
      id: `${source}->${target}`,
      source,
      target,
      type: "smoothstep",
      animated: isFocusEdge,
      label: fields.length === 1 ? fields[0] : undefined,
      data: { fields } satisfies ErEdgeData,
      style: {
        stroke: isFocusEdge
          ? "rgba(0, 240, 255, 0.65)"
          : active
            ? "rgba(148, 163, 184, 0.45)"
            : "rgba(71, 85, 105, 0.2)",
        strokeWidth: isFocusEdge ? 2 : 1.25,
      },
      labelStyle: { fill: "#94a3b8", fontSize: 11, fontFamily: "monospace" },
      labelBgStyle: {
        fill: "#131a2e",
        fillOpacity: 0.92,
      },
      labelBgPadding: [6, 4] as [number, number],
      labelBgBorderRadius: 4,
    };
  });

  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: "LR",
    nodesep: 48,
    ranksep: 110,
    marginx: 48,
    marginy: 48,
    align: "UL",
  });

  const nodes: Node<TypeNodeData>[] = [];

  for (const name of visibleNames) {
    const info = catalog[name];
    if (!info) continue;

    const { preview, more } = buildPreviewFields(
      info,
      visibleNames,
      displayOptions
    );
    const height = nodeHeight(preview.length, more);
    g.setNode(name, { width: NODE_WIDTH, height });

    const isFocused = name === focusId;
    const isHighlighted = highlight?.has(name) ?? true;
    const dimmed = highlight !== null && !isHighlighted && !isFocused;

    nodes.push({
      id: name,
      type: "schemaType",
      position: { x: 0, y: 0 },
      data: {
        label: name,
        kind: info.kind,
        isRoot: info.isRoot,
        accent: kindAccent(info.kind),
        previewFields: preview,
        moreCount: more,
        dimmed,
        focused: isFocused,
      },
      style: {
        width: NODE_WIDTH,
        height,
        opacity: dimmed ? 0.35 : 1,
      },
    });
  }

  for (const e of edges) {
    if (g.hasNode(e.source) && g.hasNode(e.target)) {
      g.setEdge(e.source, e.target);
    }
  }

  dagre.layout(g);

  for (const node of nodes) {
    const pos = g.node(node.id);
    const h = (node.style?.height as number) ?? HEADER_HEIGHT;
    if (pos) {
      node.position = {
        x: pos.x - NODE_WIDTH / 2,
        y: pos.y - h / 2,
      };
    }
  }

  return { nodes, edges, visibleCount: visibleNames.size };
}
