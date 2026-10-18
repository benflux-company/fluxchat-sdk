"""Internal HTTP helper using httpx."""

from __future__ import annotations
from typing import Any

import httpx

from .exceptions import FluxChatApiError, FluxChatNetworkError


class HttpHelper:
    """Helper HTTP interne — wraps httpx et gère les erreurs."""

    def __init__(self, api_key: str, base_url: str, timeout: float = 30.0,
                 client: httpx.Client | None = None) -> None:
        self._base_url = base_url.rstrip("/")
        self._default_headers = {
            "X-API-Key": api_key,
            "Content-Type": "application/json",
            "Accept": "application/json",
        }
        self._timeout = timeout
        self._client = client or httpx.Client(timeout=timeout)

    def get(self, path: str, extra_headers: dict | None = None) -> Any:
        return self._request("GET", path, extra_headers=extra_headers)

    def post(self, path: str, body: dict | None = None) -> Any:
        return self._request("POST", path, body=body)

    def put(self, path: str, body: dict | None = None) -> Any:
        return self._request("PUT", path, body=body)

    def patch(self, path: str, body: dict | None = None) -> Any:
        return self._request("PATCH", path, body=body)

    def delete(self, path: str) -> None:
        self._request("DELETE", path)

    def _request(self, method: str, path: str,
                 body: dict | None = None,
                 extra_headers: dict | None = None) -> Any:
        headers = {**self._default_headers, **(extra_headers or {})}
        url = self._base_url + path
        try:
            response = self._client.request(
                method, url, headers=headers,
                json=body if body else None,
            )
        except httpx.RequestError as exc:
            raise FluxChatNetworkError(str(exc), cause=exc) from exc

        if not (200 <= response.status_code < 300):
            msg = response.text
            try:
                err_data = response.json()
                if "message" in err_data:
                    msg = err_data["message"]
            except Exception:
                pass
            raise FluxChatApiError(response.status_code, msg)

        if not response.content or response.content == b"null":
            return None

        try:
            data = response.json()
            if isinstance(data, dict) and "data" in data and "success" in data:
                return data["data"]
            return data
        except Exception as exc:
            raise FluxChatNetworkError("Failed to decode JSON response", cause=exc) from exc
