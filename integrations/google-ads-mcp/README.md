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
5. Open Data Connectors and use **Check MCP Runtime**, then **Discover Accounts**.

The runtime being installed and responding to `tools/list` proves only local MCP reachability. A provider account is verified only after `customers_list_accessible_customers` returns at least one customer ID.
