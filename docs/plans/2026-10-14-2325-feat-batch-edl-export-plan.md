---
title: Batch CMX 3600 export - Plan
type: feat
date: 2026-10-14
artifact_contract: ce-unified-plan/v1
product_contract_source: ce-plan-bootstrap
execution: code
---

# Batch CMX 3600 export - Plan

## Goal Capsule

- **Objective:** An assistant editor can deliver accurate per-layer EDLs in one operation, without
  repeatedly exporting tracks or renaming files.
- **Means:** Extend the existing timeline-package job with a batch CMX 3600 export (KTD1).
- **Authority:** The Product Contract governs behavior; `docs/ADR.md` records the decisions and why.
- **Execution:** Planning only is authorized; no implementation, publication, or production writes.
- **Stop condition:** Production integration requires Sequence source access and the U1 findings.
- **Delivery owner:** A later implementer verifies the conform; Ethan authorizes publication
  separately.

---

## Product Contract

### Summary

Add a CMX 3600 export option that writes one EDL per selected video layer and packages them in a
ZIP. The assistant editor supplies an already-prepared turnover timeline or feature reel.

### Problem Frame

Assistants prepare a simplified turnover, then export and rename per-layer EDLs individually.
Finishing uses these lists when XML import fails and alongside imported sequences to inspect
revisions. Generating an EDL is not itself a change-list comparison or a media transfer.

### Requirements

**Selection and packaging**

- R1. Export selected video layers from one prepared timeline without modifying its content or
  media.
- R2. Append `_vNN.edl` to the user's filename stem using actual layer numbers, not selection order.
- R3. Deliver one ZIP containing every selected, valid, nonempty layer from the same timeline
  snapshot.
- R4. Preview the layer-to-filename mapping and event counts before submission, including explicit
  exclusion of temporary reference and Difference-check layers.

**Conform information**

- R5. Write CMX 3600 cuts and basic dissolves with correct source and record in/out timecodes.
- R6. Preserve timeline start, gaps, frame rate, and applicable drop-frame or non-drop-frame
  convention.
- R7. Preserve original camera filenames regardless of renamed timeline clips or active proxy media.
- R8. Retain available reel/tape identity and distinguish ambiguous original sources without
  requiring original media files to be online or transferred.
- R9. Export the prepared timeline's timing exactly, including intentional source-speed extensions;
  do not add handles, remove effects, flatten clips, or reset transforms during export.

**Failure behavior**

- R10. Report unsupported constructs and missing or ambiguous source information by layer and event;
  never invent timecodes or silently omit selected events.
- R11. Block a batch whose source identity or timing cannot be represented faithfully, and require
  acknowledgement of picture effects that the EDL cannot describe.
- R12. Show completion only after the full ZIP is available, using the existing job failure/progress
  conventions rather than exposing a successful-looking partial turnover.

### Key decisions

- **Prepared input, not automatic conform preparation.** Governs R1, R9. (session-settled:
  user-directed - chosen over automatic preparation because the assistant editor performs the
  turnover preparation.)
- **Per-layer CMX files with actual track suffixes.** Governs R2, R5, R6. (session-settled:
  user-directed - chosen over flattened or consecutively renumbered selections to match
  receiving-house conventions.)
- **Single ZIP.** Governs R3, R12. (session-settled: user-approved - chosen over individual browser
  downloads to deliver the batch.)

### Workflow context and boundaries

Ethan's workflow first flattens `_PREP` with effects enabled while checking Difference against an
aligned, pre-flattening picture reference; intentional effects-off and source-speed changes follow.
Preparation can also include relinking to originals and resetting scale, position, and rotation.
Requirements depend on the receiving colorist, so the exporter does not enforce one prep recipe.

The full turnover may include an effects-on XML, embedded-audio AAF, H.264 reference with timecode
and optional original filename burn-in, and a clean ProRes master with sound. Those files need not
all share the editorial cut's duration, but references for the prepared turnover must match that
prepared version.

This feature does not generate those other deliverables, compare EDL revisions, copy media, or
automatically prepare a timeline; those are follow-up features, not prerequisites for EDL
generation. It does not claim native compatibility with every version of every receiving
application. Four to six video layers is a common preparation target, not an export limit.

---

## Planning Contract

### Verified integration evidence

Inspected public production JavaScript on October 15, 2026 UTC:

- `DRW4eCmZ.js` lists `otio`, `aaf`, and `fcp7xml` in the package-format picker.
- The dialog calls `startTimelineTakeout` with `projectId`, `timelineId`, `format`, `preset`,
  `fileName`, `folderId`, `embedAudio`, and `userSessionId`.
- `Sd3xx2zU.js` implements `startTimelineTakeout` by creating a `TimelineTakeout` job with metadata.
- Its `newJob` function creates a model with status `Pending` through the synchronized client model.
- The public package documentation describes background generation and project-library output.

This is compiled JavaScript, not private TypeScript source; the inspected entry source-map URL
returned 404, and no worker implementation was available. Neither the worker language nor a shared
OTIO-based intermediate model is established by this evidence.

### Key technical decisions

- KTD1. **Extend `TimelineTakeout`, not video rendering.** Add a proposed `cmx3600` format to the
  existing dialog and job contract because the output is timeline metadata, not rendered pixels.
  Keep job creation through the existing synchronized model, not an invented REST export endpoint.
  Extend format-specific job metadata with selected layer IDs and a consistent revision reference;
  use the existing filename field as the ZIP name and derive the EDL stem from it.
- KTD2. **Resolve once, then serialize each selected layer.** Capture a consistent timeline
  revision, layer map, and original-source metadata through a consistent read in the existing
  worker. Reuse snapshot facilities if available, otherwise define the smallest consistent read
  there; this satisfies R3 without assuming click-time snapshots already exist.
- KTD3. **Use exact timing.** Calculate with integer frames at explicit rational rates, not decimal
  seconds; serialize timecode only at the CMX boundary, with exclusive out boundaries internally.
  Apply a verified source-to-sequence rate conversion or reject an unrepresentable event under R11.
- KTD4. **Keep one small serializer in the existing worker language.** Reuse its timeline traversal,
  timecode helpers, and CMX adapter if present and proven against R5-R8; otherwise add a serializer
  beside the existing interchange writers, not a new microservice or generic export framework. OTIO
  is an optional internal reuse opportunity, never a required user deliverable.
- KTD5. **Separate validation from text writing.** Resolve authoritative camera identity before CMX
  serialization, use original filenames in `FROM CLIP NAME` comments, and never truncate the
  filename to fit a reel field; assign collision-free CMX-compatible reel tokens with an explicit
  mapping when original reel identifiers cannot fit, then prove the receiving-app matching behavior.
- KTD6. **Publish only a complete artifact.** Validate the entire selected batch before packaging,
  then use existing job-scoped storage and library publication for the ZIP; follow existing retry,
  cancellation, authorization, and filename-collision rules rather than inventing parallel ones.

### High-level technical design

```diagram
┌──────────────────────┐     ┌──────────────────────┐
│ Existing package UI  │────▶│ TimelineTakeout job  │
│ stem + selected IDs  │     │ consistent snapshot  │
└──────────────────────┘     └──────────┬───────────┘
                                       ▼
                            ┌──────────────────────┐
                            │ Resolve and validate │
                            │ layers + source cuts │
                            └──────────┬───────────┘
                                       ▼
                            ┌──────────────────────┐
                            │ CMX files → one ZIP  │
                            │ existing library I/O │
                            └──────────────────────┘
```

The UI submits intent and authoritative selection identifiers; the worker resolves timeline data.
The serializer consumes resolved layer events and emits text without reading footage or UI state.
Validation issues return through the existing job-result mechanism with layer/event context.

### Proposed defaults

These details are recommendations, not additional answers attributed to Ethan:

- Export the whole prepared timeline, not an implicit playback selection.
- Show empty layers disabled with zero events; never silently renumber the remaining layers.
- Use the sequence timecode settings, with an explicit rate displayed because `FCM` alone does not
  distinguish rates such as 24 from 24000/1001.
- Reject unresolved nests, nonlinear retimes, unsupported transitions, and unrepresentable
  same-layer overlaps rather than flattening or interpreting them as dissolves.
- Allow offline originals when authoritative identity and source timing are available.
- Never infer a source start of zero merely because camera timecode is missing.
- Sanitize the filename stem for ZIP members without changing source filenames or leaking private
  storage URLs into EDL comments; show the final archive/member names before submission.
- Include a short README in the ZIP with sequence identity, revision, rate, timecode convention,
  selected layer map, reel-token mapping if needed, and acknowledged omissions.

### Integration blockers

This repository contains a local still-image compositor, not Sequence's export worker or timeline
model; its two demo layers cannot establish production integration readiness.

Before modifying production code, obtain authorized source access and locate these actual owners:

1. Package dialog, shared format/job schema, `startTimelineTakeout`, worker dispatcher, and writers.
2. Timeline revision/snapshot reader and stable video-layer assignments, including connected clips.
3. Original media identity, proxy-to-original mapping, source start timecode, and source frame
   rates.
4. Library artifact publication and browser download/ZIP support, including Shuttle implications.

Do not substitute visual lane coordinates or audio component-track IDs for stable video-layer IDs.
If Sequence has no equivalent stable track model, define an explicit reviewed export-layer mapping
before implementing R2; do not silently pack clips into newly numbered tracks.

---

## Implementation Units

### U1. Confirm the production mapping

**Goal:** Replace the blockers above with verified source owners and timing/layer contracts.
**Requirements:** R1-R12. **Dependencies:** Authorized Sequence source access. **Files:** Amend this
plan with actual source and test paths; do not invent proprietary paths. **Approach:** Trace one
existing interchange export from dialog to published file, then document snapshot timing, layer
mapping, original-source lookup, timecode utilities, and CMX reuse candidates. **Test expectation:**
No new behavioral test for discovery; identify existing exporter tests and receiving-app fixtures
before U2. **Verification:** Every integration owner has a real path; missing original identity or
layer mapping remains a blocker, not an assumed success.

### U2. Implement CMX output and batch packaging

**Goal:** Generate validated per-layer EDLs and one complete archive through the existing worker.
**Requirements:** R2, R3, R5-R12. **Dependencies:** U1. **Files:** Existing interchange writer
directory, shared format/job schema, dispatcher, and their existing tests, with exact paths supplied
by U1; add a sibling CMX writer/test only if needed. **Approach:** Apply KTD2-KTD6 and leave
existing formats unchanged; keep original timeline ordering and record positions through selection
and packaging. **Test scenarios:**

- V1 and V3 selected with a gap on V3 produce `_v01.edl` and `_v03.edl`, with unchanged record TC.
- A renamed clip on a proxy resolves to its original camera filename and a nonzero source start.
- Duplicate filenames on different camera reels remain distinguishable; unresolved duplicates fail.
- Literal expected events cover 24, 24000/1001, 25, and 30000/1001 with both valid DF/NDF cases.
- Boundary cases cover a one-frame cut, DF minute and ten-minute boundaries, and hour rollover.
- An asymmetric dissolve with verified handles produces the expected A/B events and duration;
  insufficient handles and unsupported overlap fail rather than inventing source frames.
- An expanded source-speed prep clip preserves its longer record duration.
- Missing TC, active nonlinear retime, unresolved nest, unsafe stem, or invalid range gets an
  actionable diagnostic without a partial published ZIP.
- An edit during generation cannot mix revisions between files; retries follow existing job rules
  without publishing duplicate successful artifacts.
- ZIP extraction yields exactly the selected nonempty EDLs and README, with no path traversal.

**Verification:** An independent CMX parser reconstructs expected source/record ranges from the ZIP,
and existing OTIO, AAF, and XML export tests remain unchanged and pass.

### U3. Add batch selection and verify a receiving conform

**Goal:** Assistants can preview and submit the batch and receive a usable finishing artifact.
**Requirements:** R1-R4, R10-R12. **Dependencies:** U2. **Files:** Existing package dialog,
job-result display, download handling, documentation, and browser tests, with exact paths supplied
by U1; leave the local mask/Difference slice unchanged. **Approach:** Add the format choice and
layer checklist to the current dialog under KTD1, showing the proposed defaults above; reuse current
project permission and background-job status behavior. **Test scenarios:**

- Select V1 and V3, exclude the reference layer, enter a stem, and inspect the downloaded ZIP.
- Empty selection prevents submission, and keyboard users can operate selection and acknowledgement.
- A worker failure names the affected layer/event and provides no successful download.
- Cancellation, output-name collision, and unauthorized access retain existing exporter behavior.
- Import a synthetic multi-layer turnover into Resolve, relink from a different folder using
  original filenames/reel metadata, and check first/last frames, gaps, source TC, and the dissolve
  boundaries.

**Verification:** Inspect the rendered dialog and record the download interaction; retain receiving
app/version and conform evidence instead of claiming compatibility from text inspection alone.

---

## Verification Contract

Production commands and exact test paths are blocked on U1, not replaced by this repo's compositor
tests; those tests cannot prove EDL behavior.

Validate timing against hand-calculated literal events and an independent parser, not solely a
writer/reader pair that shares the same conversions; run the resolved production export suite.
Retain a small prepared sequence with proxy/original mappings, sparse layers, source TC, and a basic
dissolve as the end-to-end fixture, then complete a real Resolve conform under U3. Add other
receiving applications only after testing their specific versions and import settings.

## Definition of Done

- R1-R12 are demonstrated by U2/U3 evidence, including successful extraction and receiving conform.
- Existing interchange formats and source timelines remain unchanged.
- Timing, identity, unsupported constructs, and delivery errors cannot masquerade as a complete
  batch.
- Docs identify tested rates, CMX dialect limits, original-source assumptions, and receiving
  versions.
- Temporary research files and abandoned implementation attempts are removed from the deliverable.
- No integration-ready claim is made while U1 prerequisites remain unresolved.

## Sources

- [Architecture decisions](../ADR.md).
- [Existing interchange audit](../sequence-findings.md#interchange-and-edl).
- [Sequence package documentation](https://sequence.film/docs/exporting/timeline-packages).
- [Inspected package dialog bundle](https://sequence.film/_app/immutable/chunks/DRW4eCmZ.js).
- [Inspected job-model bundle](https://sequence.film/_app/immutable/chunks/Sd3xx2zU.js).
- [OTIO reference](https://opentimelineio.readthedocs.io/en/v0.15/), API module
  `opentimelineio.adapters.cmx_3600`, documents comment and dissolve examples, not Sequence
  internals.
