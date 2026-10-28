# Official Google Ads MCP integration

Growth OS uses `googleads/google-ads-mcp` version `0.0.4` as a read-only reporting runtime.

## Supported use cases

- Discover customer IDs directly accessible to the authenticated Google identity.
- Inspect Google Ads resource metadata before constructing a report query.
- Run read-only Google Ads reporting searches.

Campaign creation, bid changes, budget changes, pausing, enabling, and deletion are deliberately unavailable through this MCP.

## Local setup

1. Run `npm run setup:google-ads-mcp`.
2. Enable the Google Ads API in the Google Cloud project.
3. Configure the server-only variables documented in `.env.example`.
4. Restart the Growth OS server.
5. Follow [the Growth OS MCP setup](../../docs/mcp-setup.md) for the verified workspace binding, receipt migration and account-scoped credentials. Then open Data Connectors and use **Check MCP Runtime**, then **Discover Accounts**.

The shared client is pinned to `@mcp-use/client@2.4.5`. Provider calls from the application require the bound workspace and `sigmatactix@gmail.com` identity, and persist receipts before and after execution. The new gateway exposes discovery, resource metadata and bounded reporting, while the inbound Growth OS endpoint exposes summaries only.

The runtime being installed and responding to `tools/list` proves only local MCP reachability. A provider account is verified only after `customers_list_accessible_customers` returns at least one customer ID.
