# VANTA acceptance work orders

All rows start unverified. Use evidence for the exact candidate and environment.

## Acceptance matrix

| Area | Required demonstration by release candidate |
| --- | --- |
| Per-page VANTA | Every released route opens the same dock; the current object, selected period and Client Enclave are shown in context chips; source links resolve to records the user can view |
| Context correctness | Switching client or route mid-response cannot display stale client evidence; another user's attachment ID is rejected; stale object version triggers refresh/review |
| Knowledge policy | Executive and Credentials records never appear through semantic search, keyword fallback, page attachment, memory or tool output; member revocation blocks subsequent reads |
| Task lifecycle | Draft, approval, queued, running, succeeded and failed are distinct; approval is not completion; a failed tool produces no fabricated success or growth claim |
| Consent binding | Changing destination, content, price or scope after approval invalidates the approval; worker rechecks membership and connector grant at execution |
| Browser isolation | Two Client Enclaves use different browser contexts and filesystem roots; cookies, downloads and signed-in sessions cannot cross; worker has no access to host home directory or IDE credentials |
| Network boundary | Browser/tool navigation blocks internal IPs, metadata hosts and forbidden domains, including redirect and DNS rebinding paths; downloads are size/type-limited and contained |
| Prompt injection | A test webpage/file asking to reveal secrets, change approvals or contact an unrelated destination cannot cause those tool effects; record denial rather than silently broadening scope |
| Tools/MCP | Capability discovery is not a verification result; a read, one failure and revoked access are exercised per released tool operation; secret values never appear in prompts or artifacts |
| Hooks | Valid signed event dispatches once; forged/replayed/duplicate events are rejected or deduplicated; malformed payload produces useful audit evidence |
| Cron | Job completes with browser closed; restart resumes eligible work; duplicate trigger does not duplicate delivery; timezone and missed-run policy are demonstrated |
| Cancellation and limits | Cancel stops future steps; max runtime/steps/cost produces a visible blocked state; exhausted retries reach a recoverable dead-letter state |
| Deliverable persistence | Output survives reload, another authorized device and worker restart; another workspace cannot fetch the artifact; revoked signed links expire |
| Polished PDF | Correct client branding/date/currency/source notes; no clipped text, blank pages or overflowing charts; text is searchable; source metrics match snapshot; every page is visually inspected |
| Polished PPTX | Opens in PowerPoint/LibreOffice; text and charts remain editable where intended; no slide overflow, missing fonts/images or illegible labels; title/summary/actions/sources present |
| Usable XLSX | Opens in Excel/LibreOffice; real numeric/date cells, correct currency/timezone, formulas verified and recalculated; summary + data + definitions/source sheets; no broken references or formula-injection cells |
| Whole journey | New client -> confirmed profile -> verified data -> evidence-backed insight -> approved action -> recorded result -> PDF/PPTX/XLSX package; repeat with client B and a failure path |

Never mark a row passed solely because a unit test mocks the provider. Evidence records require exact build SHA, environment, inputs/data fixtures, test result, observed output/receipt and limitation.

