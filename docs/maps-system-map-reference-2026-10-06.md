# System Map visual reference — 2026-10-06

## Sources reviewed

- [AI OS Maps Guide](https://github.com/pavrus117/ai-os-maps-guide), especially the animated six-view dashboard reference in `assets/dashboard-current-views.gif`.
- [Turn Claude Code Into Your AI Operating System (4 Layers)](https://www.youtube.com/watch?v=Zs3faMCDYNs), the walkthrough linked with the guide.
- [Automation Orbit audit example](https://audit.automationorbit.com/?utm_source=youtube&utm_medium=video&utm_campaign=020-ai-os), used only as a typography and information-density reference. It is a report, not the graph implementation.

## Visual findings

- The reference is an analytical instrument, not a large-orb hero. Nodes are small, links are hairlines, and controls are compact and mostly monochrome.
- The six tabs are separate spatial readings of one graph, not cosmetic variants of one radial layout:
  - **Rings:** concentric placement by layer with the root at centre.
  - **Circle:** every non-root node on one circumference with relationship chords through the middle.
  - **Areas:** one discrete cluster per area with the root at centre.
  - **Links:** a force-directed relationship graph whose spacing is driven by actual links.
  - **Timeline:** routine/run activity above the centre line and files by last change below it.
  - **3D orbit:** a compact 2.5D sphere with slow rotation and straight relationship edges.
- Labels are selective. Persistent labels identify groups and layers; node labels appear on demand.
- The centre mark stays visually small so the system structure remains primary.
- Dark dotted texture, restrained rules, and a single warm accent create depth without card-heavy chrome.
- Video filtering keeps the complete graph in place, dims unrelated items, and highlights the selected area or kind.

## Sigma adaptation

- The reference Claude mark is replaced by a compact orange VANTA/Sigma nucleus.
- The VANTA Core and System Map remain separate top-level surfaces in `/living-system`; no two-orb overlay is restored.
- Area colours group the existing configured Sigma nodes into presentation domains. They do not add records or runtime claims.
- The map continues to read `getLivingSystemGraph()` through `buildMapsBrainGraph()` and remains presentation-only.
- The first pass reproduced the visual language but reused radial/cluster placement for Links and type lanes for Timeline. This pass replaces those approximations with view-specific layout algorithms matching the repository contract.
- Existing dependency names and legacy orchestrator IDs are normalized only when they resolve to a registered Sigma node. Dangling endpoints are still dropped.
- Sample clocks, productivity scores, future-session panels, and other telemetry from the reference are intentionally omitted because Sigma has no verified source for them in this view.
- The current registry exposes relative labels such as `12m ago`, `Today`, and `Live Active`, not verified event timestamps. Timeline therefore groups those records under **No date** and says that timestamps are unavailable instead of inventing days.
- Mobile uses a horizontally compressed projection and hidden scrollbars so the same graph remains readable without changing its data.

## Acceptance evidence

- Layout tests cover stable ring radii, a single circle circumference, distinct area centroids, deterministic force placement, timeline separation, and bounded orbit projection.
- Adapter tests cover stable IDs, valid relationships, duplicate/dangling removal, legacy endpoint normalization, and timestamp evidence handling.
- Desktop browser checks cover all six projections on the real `/living-system` surface.
- Area filtering kept all 40 non-core nodes mounted while dimming 37 unrelated nodes; selection also persisted across view changes.
- A 390 × 844 browser pass confirmed the Links graph remains readable after closing the standard mobile navigation drawer.
