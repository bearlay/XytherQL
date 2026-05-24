"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/session-context";

export default function SettingsPage() {
  const { timeout, setTimeout, customHeaders, setCustomHeaders } = useSession();
  const [headerKey, setHeaderKey] = useState("");
  const [headerValue, setHeaderValue] = useState("");
  const [timeoutVal, setTimeoutVal] = useState(String(timeout));

  function addHeader() {
    if (!headerKey.trim()) return;
    setCustomHeaders({
      ...customHeaders,
      [headerKey.trim()]: headerValue,
    });
    setHeaderKey("");
    setHeaderValue("");
  }

  function removeHeader(key: string) {
    const next = { ...customHeaders };
    delete next[key];
    setCustomHeaders(next);
  }

  function saveTimeout() {
    const n = parseInt(timeoutVal, 10);
    if (n >= 5 && n <= 120) setTimeout(n);
  }

  return (
    <>
      <PageHeader
        title="Settings"
        description="Configure request timeouts and optional HTTP headers (e.g. Authorization). Applied on the next connect."
      />

      <div className="w-full max-w-xl space-y-4 sm:space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Request timeout</CardTitle>
            <CardDescription>
              Introspection timeout in seconds (5–120).
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              type="number"
              min={5}
              max={120}
              value={timeoutVal}
              onChange={(e) => setTimeoutVal(e.target.value)}
              className="w-full font-sans sm:max-w-[120px]"
            />
            <Button type="button" variant="secondary" onClick={saveTimeout} className="w-full sm:w-auto">
              Save
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Custom headers</CardTitle>
            <CardDescription>
              Sent with introspection and audit requests from the API server.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                placeholder="Header name"
                value={headerKey}
                onChange={(e) => setHeaderKey(e.target.value)}
                className="font-sans"
              />
              <Input
                placeholder="Value"
                value={headerValue}
                onChange={(e) => setHeaderValue(e.target.value)}
                className="font-sans"
              />
              <Button type="button" onClick={addHeader}>
                Add
              </Button>
            </div>
            {Object.keys(customHeaders).length > 0 && (
              <ul className="space-y-2">
                {Object.entries(customHeaders).map(([k, v]) => (
                  <li
                    key={k}
                    className="flex items-center justify-between rounded-md border border-border bg-muted/20 px-3 py-2 text-sm"
                  >
                    <span className="font-mono">
                      {k}: <span className="text-muted-foreground">{v}</span>
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeHeader(k)}
                    >
                      Remove
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardContent className="p-4 text-sm text-muted-foreground">
            Headers and tokens are stored in browser memory only until you
            connect. The API holds the active session server-side. Do not expose
            this tool outside your trusted network.
          </CardContent>
        </Card>
      </div>
    </>
  );
}
