from typing import Any

from pydantic import BaseModel, Field


class ConnectRequest(BaseModel):
    endpoint: str = Field(..., min_length=1)
    headers: dict[str, str] | None = None
    timeout: int = Field(default=15, ge=5, le=120)


class TableAuditRequest(BaseModel):
    table_name: str
    limit: int = Field(default=3, ge=1, le=10)


class TableDumpRequest(BaseModel):
    table_name: str
    batch_size: int = Field(default=500, ge=1, le=5000)
    max_rows: int = Field(default=0, ge=0, le=1_000_000)
    fetch_all: bool = True


class MutationAuditRequest(BaseModel):
    mutation_name: str


class InspectRequest(BaseModel):
    name: str


class ConnectResponse(BaseModel):
    session_id: str
    endpoint: str
    summary: dict[str, int]
    tables: list[str]
    mutations: list[str]


class AuditResult(BaseModel):
    status: str
    message: str
    query: str | None = None
    mutation: str | None = None
    records: list[Any] | None = None
    data: dict[str, Any] | None = None


class EntityInfo(BaseModel):
    name: str
    kind: str
    fields: dict[str, str]


class MutationInfo(BaseModel):
    name: str
    returns: str
    arguments: dict[str, str]
