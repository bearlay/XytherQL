const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type ConnectResponse = {
  session_id: string;
  endpoint: string;
  summary: {
    tablesCount: number;
    mutationsCount: number;
    entitiesCount: number;
  };
  tables: string[];
  mutations: string[];
};

export type AuditResult = {
  status: string;
  message: string;
  query?: string;
  mutation?: string;
  records?: Record<string, unknown>[];
  data?: Record<string, unknown>;
};

export type DumpResult = {
  status: string;
  message: string;
  records: Record<string, unknown>[];
  total_count: number;
  pages_fetched?: number;
  queries?: string[];
  truncated?: boolean;
};

export type EntityDetail = {
  name: string;
  kind: string;
  fields?: Record<string, string>;
  returns?: string;
  arguments?: Record<string, string>;
};

async function request<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(
      typeof err.detail === "string"
        ? err.detail
        : JSON.stringify(err.detail) || "Request failed"
    );
  }

  return res.json() as Promise<T>;
}

export async function connectEndpoint(
  endpoint: string,
  headers?: Record<string, string>,
  timeout = 15
): Promise<ConnectResponse> {
  return request<ConnectResponse>("/api/connect", {
    method: "POST",
    body: JSON.stringify({ endpoint, headers, timeout }),
  });
}

export async function getEntity(
  sessionId: string,
  name: string
): Promise<EntityDetail> {
  return request<EntityDetail>(`/api/session/${sessionId}/entity/${name}`);
}

export async function auditTable(
  sessionId: string,
  tableName: string,
  limit = 3
): Promise<AuditResult> {
  return request<AuditResult>(`/api/session/${sessionId}/audit/table`, {
    method: "POST",
    body: JSON.stringify({ table_name: tableName, limit }),
  });
}

export async function auditMutation(
  sessionId: string,
  mutationName: string
): Promise<AuditResult> {
  return request<AuditResult>(`/api/session/${sessionId}/audit/mutation`, {
    method: "POST",
    body: JSON.stringify({ mutation_name: mutationName }),
  });
}

export async function dumpTable(
  sessionId: string,
  tableName: string,
  options: {
    fetch_all?: boolean;
    max_rows?: number;
    batch_size?: number;
  } = {}
): Promise<DumpResult> {
  return request<DumpResult>(`/api/session/${sessionId}/dump/table`, {
    method: "POST",
    body: JSON.stringify({
      table_name: tableName,
      fetch_all: options.fetch_all ?? true,
      max_rows: options.max_rows ?? 0,
      batch_size: options.batch_size ?? 500,
    }),
  });
}

export type IntrospectionResponse = {
  data: {
    __schema: Record<string, unknown>;
  };
};

export async function getIntrospection(
  sessionId: string
): Promise<IntrospectionResponse> {
  return request<IntrospectionResponse>(
    `/api/session/${sessionId}/introspection`
  );
}

export function getExportUrl(sessionId: string): string {
  return `${API_BASE}/api/session/${sessionId}/export`;
}

export async function disconnect(sessionId: string): Promise<void> {
  await request(`/api/session/${sessionId}`, { method: "DELETE" });
}
