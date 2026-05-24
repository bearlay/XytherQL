"""GraphQL introspection and authorization audit logic."""

from __future__ import annotations

import json
from typing import Any

import requests

INTROSPECTION_QUERY = {
    "query": (
        "query IntrospectionQuery{__schema{queryType{name}mutationType{name}"
        "subscriptionType{name}types{...FullType}directives{name description "
        "locations args{...InputValue}}}}fragment FullType on __Type{kind name "
        "description fields(includeDeprecated:true){name description args{"
        "...InputValue}type{...TypeRef}isDeprecated deprecationReason}"
        "inputFields{...InputValue}interfaces{...TypeRef}enumValues("
        "includeDeprecated:true){name description isDeprecated "
        "deprecationReason}possibleTypes{...TypeRef}}fragment InputValue on "
        "__InputValue{name description type{...TypeRef}defaultValue}fragment "
        "TypeRef on __Type{kind name ofType{kind name ofType{kind name ofType{"
        "kind name ofType{kind name ofType{kind name ofType{kind name ofType{"
        "kind name}}}}}}}}"
    )
}

VALID_SCALARS = frozenset(
    {
        "String",
        "Int",
        "Float",
        "Boolean",
        "uuid",
        "timestamptz",
        "timetz",
        "date",
        "numeric",
        "ID",
        "bigint",
        "json",
        "jsonb",
    }
)


def clean_type(type_obj: dict[str, Any] | None) -> str:
    if not type_obj:
        return "Unknown"
    if type_obj.get("name"):
        return str(type_obj["name"])
    if type_obj.get("ofType"):
        return clean_type(type_obj["ofType"])
    return "Unknown"


def fetch_schema(
    endpoint: str,
    headers: dict[str, str] | None = None,
    timeout: int = 15,
) -> dict[str, Any] | None:
    req_headers = {
        "Content-Type": "application/json",
        "User-Agent": "XytherQL/1.0",
        **(headers or {}),
    }
    response = requests.post(
        endpoint,
        json=INTROSPECTION_QUERY,
        headers=req_headers,
        timeout=timeout,
    )
    if response.status_code != 200:
        raise ValueError(f"Server responded with HTTP {response.status_code}")

    res_json = response.json()
    if "data" in res_json and res_json["data"] and "__schema" in res_json["data"]:
        return res_json["data"]["__schema"]

    errors = res_json.get("errors", [])
    if errors:
        raise ValueError(errors[0].get("message", "Introspection failed"))
    raise ValueError("Response did not contain valid GraphQL schema data")


def parse_schema_entities(
    schema: dict[str, Any],
) -> tuple[dict[str, Any], dict[str, Any]]:
    entities: dict[str, Any] = {}
    mutations: dict[str, Any] = {}
    types = schema.get("types", []) or []

    mutation_root_name = (
        schema.get("mutationType", {}).get("name")
        if schema.get("mutationType")
        else "mutation_root"
    )
    query_root_name = (
        schema.get("queryType", {}).get("name") if schema.get("queryType") else "query_root"
    )

    for t in types:
        type_name = t.get("name", "")
        if type_name.startswith("__") or not type_name:
            continue

        kind = t.get("kind")

        if kind == "OBJECT":
            fields = t.get("fields") or []
            field_map: dict[str, str] = {}
            for f in fields:
                f_name = f.get("name")
                f_type = clean_type(f.get("type"))
                field_map[f_name] = f_type

                if type_name == mutation_root_name:
                    args = f.get("args", []) or []
                    arg_map = {
                        arg.get("name"): clean_type(arg.get("type")) for arg in args
                    }
                    mutations[f_name] = {
                        "returns": f_type,
                        "arguments": arg_map,
                    }

            if type_name not in (
                query_root_name,
                mutation_root_name,
                "subscription_root",
            ):
                entities[type_name] = {"kind": "OBJECT", "fields": field_map}

        elif kind == "INPUT_OBJECT":
            input_fields = t.get("inputFields") or []
            field_map = {
                f.get("name"): clean_type(f.get("type")) for f in input_fields
            }
            entities[type_name] = {"kind": "INPUT_OBJECT", "fields": field_map}

    return entities, mutations


def classify_tables(entities: dict[str, Any]) -> dict[str, dict[str, str]]:
    return {
        k: v["fields"]
        for k, v in entities.items()
        if v["kind"] == "OBJECT" and not k.endswith("Response")
    }


def audit_table_access(
    endpoint: str,
    table_name: str,
    columns: dict[str, str],
    headers: dict[str, str] | None = None,
    limit: int = 3,
    timeout: int = 10,
) -> dict[str, Any]:
    scalar_cols = [col for col, col_type in columns.items() if col_type in VALID_SCALARS]

    if not scalar_cols:
        return {
            "status": "error",
            "message": f"No queryable scalar columns for table '{table_name}'.",
        }

    col_list = " ".join(scalar_cols)
    graphql_query = f"query PoC_Extract {{ {table_name}(limit: {limit}) {{ {col_list} }} }}"

    req_headers = {
        "Content-Type": "application/json",
        "User-Agent": "XytherQL/1.0",
        **(headers or {}),
    }

    response = requests.post(
        endpoint,
        json={"query": graphql_query},
        headers=req_headers,
        timeout=timeout,
    )
    res_json = response.json()

    if "errors" in res_json:
        err_msg = res_json["errors"][0].get("message", "")
        restricted = any(
            indicator in err_msg.lower()
            for indicator in (
                "not found",
                "permission",
                "cannot query",
                "restrict",
                "unauthorized",
                "forbidden",
            )
        )
        return {
            "status": "restricted" if restricted else "query_error",
            "message": err_msg,
            "query": graphql_query,
        }

    if "data" in res_json and res_json["data"].get(table_name) is not None:
        records = res_json["data"][table_name]
        if not records:
            return {
                "status": "exposed_empty",
                "message": "Query authorized but table returned no rows.",
                "query": graphql_query,
                "records": [],
            }
        return {
            "status": "vulnerable",
            "message": f"Extracted {len(records)} sample row(s).",
            "query": graphql_query,
            "records": records,
        }

    return {
        "status": "unknown",
        "message": "Unexpected or null data response.",
        "query": graphql_query,
    }


MAX_DUMP_ROWS = 1_000_000
DEFAULT_DUMP_BATCH = 500


def _scalar_columns(columns: dict[str, str]) -> list[str]:
    return [col for col, col_type in columns.items() if col_type in VALID_SCALARS]


def _build_table_query(
    table_name: str,
    col_list: str,
    limit: int,
    offset: int | None = None,
    order_by: str | None = None,
) -> str:
    args: list[str] = [f"limit: {limit}"]
    if offset is not None and offset > 0:
        args.append(f"offset: {offset}")
    if order_by:
        args.append(order_by)
    args_str = ", ".join(args)
    return f"query PoC_Dump {{ {table_name}({args_str}) {{ {col_list} }} }}"


def _fetch_table_batch(
    endpoint: str,
    query: str,
    table_name: str,
    headers: dict[str, str] | None,
    timeout: int,
) -> tuple[list[dict[str, Any]] | None, str | None, dict[str, Any] | None]:
    """Returns (records, error_message, full_response_on_error)."""
    req_headers = {
        "Content-Type": "application/json",
        "User-Agent": "XytherQL/1.0",
        **(headers or {}),
    }
    response = requests.post(
        endpoint,
        json={"query": query},
        headers=req_headers,
        timeout=timeout,
    )
    res_json = response.json()

    if "errors" in res_json:
        return None, res_json["errors"][0].get("message", "Query failed"), res_json

    if "data" in res_json and res_json["data"].get(table_name) is not None:
        batch = res_json["data"][table_name] or []
        return batch, None, None

    return None, "Unexpected or null data response.", res_json


def dump_table_data(
    endpoint: str,
    table_name: str,
    columns: dict[str, str],
    headers: dict[str, str] | None = None,
    batch_size: int = DEFAULT_DUMP_BATCH,
    max_rows: int = 0,
    fetch_all: bool = True,
    timeout: int = 120,
) -> dict[str, Any]:
    """Paginated full-table dump using limit/offset (Hasura-style APIs)."""
    scalar_cols = _scalar_columns(columns)
    if not scalar_cols:
        return {
            "status": "error",
            "message": f"No queryable scalar columns for table '{table_name}'.",
            "records": [],
            "total_count": 0,
        }

    batch_size = max(1, min(batch_size, 5000))
    cap = MAX_DUMP_ROWS if fetch_all else max(1, min(max_rows, MAX_DUMP_ROWS))
    if not fetch_all and max_rows > 0:
        cap = max_rows

    col_list = " ".join(scalar_cols)
    order_field = "id" if "id" in scalar_cols else None
    order_by = f'order_by: {{ {order_field}: asc }}' if order_field else None

    all_records: list[dict[str, Any]] = []
    offset = 0
    pages = 0
    queries: list[str] = []
    use_offset = True

    while len(all_records) < cap:
        page_limit = min(batch_size, cap - len(all_records))
        query = _build_table_query(
            table_name,
            col_list,
            page_limit,
            offset if use_offset else None,
            order_by,
        )
        queries.append(query)

        batch, err_msg, _ = _fetch_table_batch(
            endpoint, query, table_name, headers, timeout
        )

        if batch is None:
            if use_offset and offset == 0 and err_msg:
                use_offset = False
                offset = 0
                queries.pop()
                continue
            restricted = err_msg and any(
                x in err_msg.lower()
                for x in (
                    "not found",
                    "permission",
                    "cannot query",
                    "restrict",
                    "unauthorized",
                    "forbidden",
                )
            )
            return {
                "status": "restricted" if restricted else "query_error",
                "message": err_msg or "Dump failed",
                "records": all_records,
                "total_count": len(all_records),
                "pages_fetched": pages,
                "queries": queries,
                "truncated": False,
            }

        pages += 1
        all_records.extend(batch)

        if len(batch) < page_limit:
            break

        if not use_offset:
            break

        offset += len(batch)

    truncated = len(all_records) >= cap

    if not all_records:
        return {
            "status": "exposed_empty",
            "message": "Query authorized but table returned no rows.",
            "records": [],
            "total_count": 0,
            "pages_fetched": pages,
            "queries": queries[-1:] if queries else [],
            "truncated": False,
        }

    return {
        "status": "success",
        "message": f"Retrieved {len(all_records)} row(s) across {pages} page(s).",
        "records": all_records,
        "total_count": len(all_records),
        "pages_fetched": pages,
        "queries": queries[:3] + (["..."] if len(queries) > 3 else []),
        "truncated": truncated,
    }


def audit_mutation(
    endpoint: str,
    m_name: str,
    info: dict[str, Any],
    entities: dict[str, Any],
    headers: dict[str, str] | None = None,
    timeout: int = 10,
) -> dict[str, Any]:
    return_type = info["returns"]
    return_fields_dict = entities.get(return_type, {}).get("fields", {})

    if return_fields_dict:
        return_fields_str = " ".join(list(return_fields_dict.keys()))
    else:
        return_fields_str = "message"

    arg_lines: list[str] = []
    for arg, arg_type in info["arguments"].items():
        if arg_type == "String":
            arg_lines.append(f'{arg}: "audit_poc_test"')
        elif arg_type == "Int":
            arg_lines.append(f"{arg}: 0")
        elif arg_type == "Boolean":
            arg_lines.append(f"{arg}: false")
        else:
            arg_lines.append(f'{arg}: "audit_poc_test"')

    arguments_str = ", ".join(arg_lines)
    mutation_body = (
        f"mutation PoCAuthAudit {{ {m_name}({arguments_str}) "
        f"{{ {return_fields_str} }} }}"
    )

    req_headers = {
        "Content-Type": "application/json",
        "User-Agent": "XytherQL/1.0",
        **(headers or {}),
    }

    response = requests.post(
        endpoint,
        json={"query": mutation_body},
        headers=req_headers,
        timeout=timeout,
    )
    res_json = response.json()

    if "errors" in res_json:
        err_msg = res_json["errors"][0].get("message", "")
        if "expected String, but encountered Array" in err_msg or "parsing Text failed" in err_msg:
            response = requests.post(
                endpoint,
                json={"query": mutation_body},
                headers=req_headers,
                timeout=timeout,
            )
            res_json = response.json()
            if "errors" in res_json:
                err_msg = res_json["errors"][0].get("message", "")

        return {
            "status": "handled",
            "message": err_msg,
            "mutation": mutation_body,
        }

    if "data" in res_json and res_json["data"]:
        return {
            "status": "processed",
            "message": "Endpoint processed validation without standard errors.",
            "mutation": mutation_body,
            "data": res_json["data"],
        }

    return {
        "status": "unknown",
        "message": "No data or errors in response.",
        "mutation": mutation_body,
    }


def build_session_payload(
    endpoint: str,
    schema: dict[str, Any],
    entities: dict[str, Any],
    mutations: dict[str, Any],
) -> dict[str, Any]:
    tables = classify_tables(entities)
    return {
        "endpoint": endpoint,
        "schema": schema,
        "entities": entities,
        "mutations": mutations,
        "tables": tables,
        "summary": {
            "tablesCount": len(tables),
            "mutationsCount": len(mutations),
            "entitiesCount": len(entities),
        },
    }


def export_schema_json(schema: dict[str, Any]) -> str:
    return json.dumps(schema, indent=2)
