"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ReactFlow,
  Background,
  Controls,
  BackgroundVariant,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { IntrospectionResponse } from "@/lib/api";
import {
  buildFlowGraph,
  buildSchemaGraphModel,
  getDefaultFocusId,
  type TypeNodeData,
} from "@/lib/schema-graph/build-graph";
import type { SchemaGraphDisplayOptions } from "@/lib/schema-graph/types";
import { TypeNode } from "./type-node";
import { SchemaGraphDetail } from "./schema-graph-detail";
import { SchemaGraphToolbar } from "./schema-graph-toolbar";

const nodeTypes = { schemaType: TypeNode } as const;

type SchemaGraphViewerProps = {
  introspection: IntrospectionResponse;
  displayOptions?: SchemaGraphDisplayOptions;
  onDisplayChange?: (d: SchemaGraphDisplayOptions) => void;
  onRefresh?: () => void;
  loading?: boolean;
};

function SchemaGraphCanvas({
  introspection,
  displayOptions = {},
  onDisplayChange,
  onRefresh,
  loading,
}: SchemaGraphViewerProps) {
  const { fitView, getNodes } = useReactFlow();
  const [search, setSearch] = useState("");
  const [focusId, setFocusId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const initFocus = useRef(false);
  const flowContainerRef = useRef<HTMLDivElement>(null);
  const fitRaf = useRef<number | null>(null);

  const model = useMemo(
    () => buildSchemaGraphModel(introspection, displayOptions),
    [introspection, displayOptions]
  );

  useEffect(() => {
    if (!initFocus.current && model.queryRoot) {
      setFocusId(getDefaultFocusId(model));
      initFocus.current = true;
    }
  }, [model]);

  const searchLower = search.trim().toLowerCase();

  const searchMatches = useMemo(() => {
    if (!searchLower) return null;
    return new Set(
      Object.keys(model.typesByName).filter((n) =>
        n.toLowerCase().includes(searchLower)
      )
    );
  }, [model.typesByName, searchLower]);

  useEffect(() => {
    if (!searchLower || !searchMatches?.size) return;
    const first = [...searchMatches].sort((a, b) => a.localeCompare(b))[0];
    setFocusId(first);
    setShowAll(false);
    setSelectedId(first);
  }, [searchLower, searchMatches]);

  const effectiveFocus = showAll ? null : focusId ?? getDefaultFocusId(model);

  const { nodes: layoutNodes, edges: layoutEdges, visibleCount } = useMemo(
    () =>
      buildFlowGraph(model, displayOptions, {
        focusId: effectiveFocus,
        focusDepth: 2,
        showAll,
        highlightIds: searchMatches,
      }),
    [model, displayOptions, effectiveFocus, showAll, searchMatches]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutEdges);

  const scheduleFitView = useCallback(() => {
    if (fitRaf.current !== null) {
      cancelAnimationFrame(fitRaf.current);
    }
    fitRaf.current = requestAnimationFrame(() => {
      fitRaf.current = requestAnimationFrame(() => {
        fitRaf.current = null;
        if (getNodes().length === 0) return;
        fitView({ padding: 0.2, duration: 280 });
      });
    });
  }, [fitView, getNodes]);

  useEffect(() => {
    setNodes(layoutNodes);
    setEdges(layoutEdges);
  }, [layoutNodes, layoutEdges, setNodes, setEdges]);

  useLayoutEffect(() => {
    scheduleFitView();
  }, [layoutNodes, scheduleFitView]);

  useEffect(() => {
    const el = flowContainerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => scheduleFitView());
    ro.observe(el);
    return () => ro.disconnect();
  }, [scheduleFitView]);

  useEffect(
    () => () => {
      if (fitRaf.current !== null) cancelAnimationFrame(fitRaf.current);
    },
    []
  );

  const onFlowInit = useCallback(() => {
    scheduleFitView();
  }, [scheduleFitView]);

  const selectedType = selectedId ? model.typesByName[selectedId] ?? null : null;

  const onNodeClick = useCallback((_: unknown, node: Node<TypeNodeData>) => {
    setSelectedId(node.id);
    setFocusId(node.id);
    setShowAll(false);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedId(null);
  }, []);

  const onEdgeClick = useCallback(
    (_: unknown, edge: Edge) => {
      setSelectedId(edge.source);
      setFocusId(edge.source);
      setShowAll(false);
    },
    []
  );

  const handleFitView = useCallback(() => {
    scheduleFitView();
  }, [scheduleFitView]);

  const handleResetFocus = useCallback(() => {
    const def = getDefaultFocusId(model);
    setFocusId(def);
    setSelectedId(def);
    setShowAll(false);
    setSearch("");
  }, [model]);

  const displayNodes = useMemo(
    () =>
      nodes.map((n) => ({
        ...n,
        selected: n.id === selectedId,
        data: {
          ...(n.data as TypeNodeData),
          focused: n.id === effectiveFocus,
        },
      })),
    [nodes, selectedId, effectiveFocus]
  );

  return (
    <div className="flex h-full min-h-0 w-full flex-col bg-[#080c18]">
      <SchemaGraphToolbar
        search={search}
        onSearchChange={setSearch}
        display={displayOptions}
        onDisplayChange={onDisplayChange ?? (() => {})}
        showAll={showAll}
        onShowAllChange={setShowAll}
        onRefresh={onRefresh ?? (() => {})}
        onFitView={handleFitView}
        onResetFocus={handleResetFocus}
        loading={loading}
        visibleCount={visibleCount}
        totalTypes={model.totalTypes}
        truncated={model.truncated}
        focusLabel={effectiveFocus}
      />

      <div className="relative min-h-0 flex-1">
        <div
          ref={flowContainerRef}
          className="absolute inset-0 min-h-[320px]"
        >
          {visibleCount === 0 && (
            <div className="pointer-events-none absolute inset-0 z-[5] flex items-center justify-center p-6">
              <p className="max-w-sm rounded-lg border border-slate-700/60 bg-[#131a2e]/95 px-4 py-3 text-center text-sm text-slate-400">
                No entities match the current filters. Try{" "}
                <span className="text-slate-200">Full graph</span>, turn off{" "}
                <span className="text-slate-200">Hide Relay</span>, or search
                for a type name.
              </p>
            </div>
          )}

          <ReactFlow
            nodes={displayNodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            onEdgeClick={onEdgeClick}
            onPaneClick={onPaneClick}
            onInit={onFlowInit}
            nodeTypes={nodeTypes}
            minZoom={0.08}
            maxZoom={1.8}
            colorMode="dark"
            proOptions={{ hideAttribution: true }}
            className="schema-flow-er h-full w-full"
            nodesDraggable
            nodesConnectable={false}
            elementsSelectable
            defaultEdgeOptions={{ type: "smoothstep" }}
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={24}
              size={1}
              color="rgba(148, 163, 184, 0.12)"
            />
            <Controls
              position="bottom-left"
              className="schema-flow-controls"
              showInteractive={false}
            />
          </ReactFlow>

          <div
            className={`pointer-events-none absolute bottom-4 z-10 rounded-lg border border-slate-700/60 bg-[#131a2e]/95 px-3 py-2 text-[10px] text-slate-400 ${selectedType ? "left-4 hidden sm:block" : "right-4 hidden sm:block"}`}
          >
            <p className="mb-1 font-medium text-slate-300">ER diagram</p>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-[#00F0FF]" /> relation
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-amber-400" /> key
              </span>
            </div>
          </div>
        </div>

        {!selectedType && (
          <div className="pointer-events-none absolute bottom-4 right-4 z-10 hidden max-w-[220px] rounded-lg border border-slate-700/60 bg-[#131a2e]/95 px-3 py-2 text-[10px] text-slate-400 md:block">
            <p className="font-medium text-slate-300">Entity inspector</p>
            <p className="mt-1 leading-relaxed">
              Click an entity to inspect fields. Canvas uses full width until
              then.
            </p>
          </div>
        )}

        {selectedType && (
          <aside className="absolute bottom-0 right-0 top-0 z-20 flex w-full max-w-md flex-col border-l border-white/10 bg-[#0d1224]/98 shadow-2xl backdrop-blur-md sm:max-w-sm md:max-w-md lg:max-w-lg">
            <SchemaGraphDetail
              typeInfo={selectedType}
              focusId={effectiveFocus}
              onClose={() => setSelectedId(null)}
              onFocusType={(name) => {
                setFocusId(name);
                setSelectedId(name);
                setShowAll(false);
              }}
            />
          </aside>
        )}
      </div>
    </div>
  );
}

export function SchemaGraphViewer(props: SchemaGraphViewerProps) {
  return (
    <ReactFlowProvider>
      <SchemaGraphCanvas {...props} />
    </ReactFlowProvider>
  );
}
