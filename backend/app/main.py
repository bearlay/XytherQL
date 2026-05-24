"""FastAPI server for XytherQL."""

from __future__ import annotations

import uuid
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, PlainTextResponse

from app import audit_service
from app.models import (
    ConnectRequest,
    ConnectResponse,
    MutationAuditRequest,
    TableAuditRequest,
    TableDumpRequest,
)

app = FastAPI(
    title="XytherQL API",
    description="XytherQL — GraphQL security auditing service",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory sessions for active audits
_sessions: dict[str, dict[str, Any]] = {}


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/connect", response_model=ConnectResponse)
def connect(body: ConnectRequest) -> ConnectResponse:
    try:
        schema = audit_service.fetch_schema(
            body.endpoint,
            headers=body.headers,
            timeout=body.timeout,
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e)) from e

    if not schema:
        raise HTTPException(status_code=400, detail="Failed to fetch schema")

    entities, mutations = audit_service.parse_schema_entities(schema)
    payload = audit_service.build_session_payload(
        body.endpoint, schema, entities, mutations
    )

    session_id = str(uuid.uuid4())
    _sessions[session_id] = {
        **payload,
        "headers": body.headers or {},
        "timeout": body.timeout,
    }

    return ConnectResponse(
        session_id=session_id,
        endpoint=body.endpoint,
        summary=payload["summary"],
        tables=sorted(payload["tables"].keys()),
        mutations=sorted(mutations.keys()),
    )


@app.get("/api/session/{session_id}")
def get_session(session_id: str) -> dict[str, Any]:
    session = _get_session(session_id)
    return {
        "session_id": session_id,
        "endpoint": session["endpoint"],
        "summary": session["summary"],
        "tables": sorted(session["tables"].keys()),
        "mutations": sorted(session["mutations"].keys()),
    }


@app.get("/api/session/{session_id}/entity/{name}")
def get_entity(session_id: str, name: str) -> dict[str, Any]:
    session = _get_session(session_id)

    if name in session["mutations"]:
        info = session["mutations"][name]
        return {
            "name": name,
            "kind": "MUTATION",
            "returns": info["returns"],
            "arguments": info["arguments"],
        }

    if name in session["entities"]:
        info = session["entities"][name]
        return {
            "name": name,
            "kind": info["kind"],
            "fields": info["fields"],
        }

    if name in session["tables"]:
        return {
            "name": name,
            "kind": "TABLE",
            "fields": session["tables"][name],
        }

    raise HTTPException(status_code=404, detail="Name not found in schema")


@app.post("/api/session/{session_id}/audit/table")
def audit_table(session_id: str, body: TableAuditRequest) -> dict[str, Any]:
    session = _get_session(session_id)
    tables = session["tables"]

    if body.table_name not in tables:
        raise HTTPException(status_code=404, detail="Table not found")

    try:
        result = audit_service.audit_table_access(
            session["endpoint"],
            body.table_name,
            tables[body.table_name],
            headers=session.get("headers"),
            limit=body.limit,
            timeout=min(session.get("timeout", 15), 30),
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e)) from e

    return result


@app.post("/api/session/{session_id}/dump/table")
def dump_table(session_id: str, body: TableDumpRequest) -> dict[str, Any]:
    session = _get_session(session_id)
    tables = session["tables"]

    if body.table_name not in tables:
        raise HTTPException(status_code=404, detail="Table not found")

    try:
        result = audit_service.dump_table_data(
            session["endpoint"],
            body.table_name,
            tables[body.table_name],
            headers=session.get("headers"),
            batch_size=body.batch_size,
            max_rows=body.max_rows,
            fetch_all=body.fetch_all,
            timeout=max(session.get("timeout", 15), 120),
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e)) from e

    return result


@app.post("/api/session/{session_id}/audit/mutation")
def audit_mutation_endpoint(
    session_id: str, body: MutationAuditRequest
) -> dict[str, Any]:
    session = _get_session(session_id)
    mutations = session["mutations"]

    if body.mutation_name not in mutations:
        raise HTTPException(status_code=404, detail="Mutation not found")

    try:
        result = audit_service.audit_mutation(
            session["endpoint"],
            body.mutation_name,
            mutations[body.mutation_name],
            session["entities"],
            headers=session.get("headers"),
            timeout=min(session.get("timeout", 15), 30),
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e)) from e

    return result


@app.get("/api/session/{session_id}/introspection")
def get_introspection(session_id: str) -> dict[str, Any]:
    """Introspection result for the schema graph explorer."""
    session = _get_session(session_id)
    return {"data": {"__schema": session["schema"]}}


@app.get("/api/session/{session_id}/export")
def export_schema(session_id: str) -> PlainTextResponse:
    session = _get_session(session_id)
    content = audit_service.export_schema_json(session["schema"])
    return PlainTextResponse(
        content=content,
        media_type="application/json",
        headers={
            "Content-Disposition": 'attachment; filename="schema_extract.json"'
        },
    )


@app.delete("/api/session/{session_id}")
def disconnect(session_id: str) -> dict[str, str]:
    _sessions.pop(session_id, None)
    return {"status": "disconnected"}


def _get_session(session_id: str) -> dict[str, Any]:
    session = _sessions.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found or expired")
    return session
