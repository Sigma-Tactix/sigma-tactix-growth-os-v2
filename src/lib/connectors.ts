import { Connector, ConnectorCredentialsInput } from "../types";
import { apiFetch } from "./api";

// One client seam for connector connect/disconnect — callers get back the
// server's authoritative Connector state, never raw credentials.

export async function connectConnector(
  id: string,
  credentials: ConnectorCredentialsInput
): Promise<{ connector: Connector; verified: boolean }> {
  const res = await apiFetch(`/api/workspace/connectors/${id}/connect`, {
    method: "POST",
    body: JSON.stringify({ credentials }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || "Connection failed");
  return { connector: data.connector as Connector, verified: Boolean(data.verified) };
}

export async function disconnectConnector(id: string): Promise<Connector> {
  const res = await apiFetch(`/api/workspace/connectors/${id}/disconnect`, {
    method: "POST",
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || "Disconnect failed");
  return data.connector as Connector;
}
