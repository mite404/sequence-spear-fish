# Architecture decisions

## ADR-001: Export prepared timelines

Export the assistant editor's prepared timeline without modifying it because flattening,
source-speed expansion, relinking, and transform resets require editorial judgment.

## ADR-002: Use CMX 3600

Deliver CMX 3600 EDLs because finishing needs a familiar cut-list fallback when richer XML conforms
fail, not a new interchange format.

## ADR-003: Batch by video layer

Export selected video layers together as `<user_stem>_vNN.edl`, preserving actual layer numbers and
timeline placement because assistants currently export and rename these files individually.

## ADR-004: Preserve camera-source identity

Use original camera filenames and source timecodes rather than editable clip labels or proxy paths
because finishing must reconnect each event to the correct original frames.

## ADR-005: Keep preparation and comparison separate

Use Difference to check flattening before intentional effects-off timing changes because an expanded
source-speed turnover no longer matches the original reference frame for frame.

## ADR-006: Extend the existing export job

Propose EDL as another `TimelineTakeout` format because the inspected client already submits format
choices through that job, while its private worker implementation remains unverified.

## ADR-007: Separate serialization from job resources

Keep CMX serialization independent of the editor UI, database, and media renderer because text
export needs timeline metadata rather than decoded footage or a cloud preview session.

## ADR-008: Deliver one complete ZIP

Package all selected layers from one consistent timeline snapshot into one ZIP because mixed
revisions or silently missing layers would make a turnover unreliable.

## ADR-009: Preserve supported edits explicitly

Support cuts and basic dissolves while reporting unsupported constructs because silently
approximated timing or transitions can mislead the receiving conform.

## ADR-010: Reuse the worker's language and converters

Use the existing worker's language and reusable timeline conversion code where verified because a
new service or mandatory OTIO conversion would add an unproven integration boundary.
