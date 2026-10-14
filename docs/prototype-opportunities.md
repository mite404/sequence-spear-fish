# Vertical-slice opportunities for Ethan

## Recommendation

Build one finished user journey, not another NLE. The original recommendation is **OTIO conform
preflight** because it fits Ethan's turnover experience and does not require a private Sequence
integration. **Edit-version comparison QC** is the strongest later alternative raised by the
graphics audit and Ethan's use of Difference in finishing.

No prototype has been built. These are standalone portfolio proposals, not patches ready to merge
into Sequence. Read the [findings](sequence-findings.md) before treating a gap as confirmed.

## 1. OTIO conform preflight

User journey: load a timeline document, choose a finishing destination, read actionable warnings,
and export turnover notes.

The pain is documented: most effects, keyframes, and adjustments do not yet transfer to receiving
editors. A general caveat is less useful than knowing what a particular handoff can establish.

Keep the first slice narrow:

- One supported OTIO schema version and a cut-only timeline.
- Official OTIO library for timing semantics, with a small Python validator and browser report.
- Source references, source ranges, record ranges, frame rates, gaps, and unsupported objects.
- Media accessibility marked unknown unless a supplied manifest or permitted local check proves it.
- Resolve as the first destination, with CSV/HTML turnover notes and a reference-video checklist.

No database, login system, generic interchange parser, or editing engine is needed. Exporting EDL
can follow for a representable subset, with explicit rejection of unsupported constructs.

### The important ceiling

An OTIO reader cannot list per-clip effects that Sequence discarded before producing the file.
It can warn about that general export contract. Exact adjustment-loss reporting would require
a richer source manifest or integration with Sequence's internal timeline model.

### Proof that earns trust

Use fixtures with different source and record start times, fractional frame rates, gaps, missing
media references, and unsupported objects. Derive expected record ranges independently.
Then complete one real Resolve import with accessible originals and compare cut boundaries to
the reference movie. Until then, describe it as a preflight demo, not a verified conform tool.

## 2. Edit-version comparison QC

User journey: load two reference renders, align them, inspect absolute Difference, and navigate
changes. This directly reflects Ethan's use of Difference to spot revisions during quality checks.
Sequence's observed blend menu lacks Difference. Subtract is not an equivalent comparison.

Start with two local reference renders rather than unknown internal timeline APIs. Give the user
an explicit frame offset and a synchronized comparison. Separate picture differences from timing
differences. State the comparison resolution and color assumptions.

The first slice must distinguish real edit changes from codec noise, grading changes, and a
one-frame misalignment. Do not promise automatic editorial intent recognition.

Proof cases should include identical inputs, an asymmetric picture change, a one-frame offset,
different durations, and different encodes of the same picture. The identical case should be
black under Difference; both brighter and darker changes must remain visible.

Sequence integration would require access to two aligned frame inputs. The single-input custom
shader tested in the audit does not establish that capability. A comparison demo can stand alone.

## 3. Handle-aware dissolve

User journey: select a cut, choose a duration in frames, preview the dissolve, and undo it.
Source handles are unused frames before or after a cut that a transition can reveal.

The gap is explicit in Sequence's docs: no built-in transitions. A useful tool must detect
insufficient handles rather than silently inventing frames. Define whether it preserves sequence
duration and how it centers around the cut. Reuse opacity/volume animation where integration allows.

Without integration access, build a standalone two-clip demo and label it as such. Verify first,
middle, and last frames, boundary placement, and insufficient-handle rejection. A button mockup
is not a working vertical slice. This is a stronger immediate visual demo than preflight, but
uses less of Ethan's distinctive finishing knowledge.

## 4. Browser capability and preview diagnostics

User journey: open the editor, receive an actionable explanation if local graphics capability
or the cloud preview connection is unavailable, and understand the next step.

The audit reproduced a blank timeline in a browser without WebGL, then rendered it in a working
browser. Check local graphics capability separately from cloud connection/service state.
Do not infer that every blank preview has the same cause. Test supported and disabled-WebGL cases.

## Masking is a candidate, not yet a settled integration target

A real text matte or shape mask could make a useful visual demonstration. First complete the
known-alpha import/export test and confirm the available integration boundary. The subtract
experiment was not a mask and must not be used as proof that masking works.

Do not start by rebuilding a full motion-template authoring system. Grain is also a poor first
pitch because Sequence already has built-in synthetic grain.

## Fit to Ethan's experience

The supplied post resume describes Homecoming finishing/turnovers, post management at VOX, and
commercial/motion work in Premiere and After Effects. The SWE resume describes TypeScript/Python,
React/Node, workflow automation, data modeling, Web Audio timing, and agent observability.

Those are self-reported qualifications, not independently verified credits. They support an
editor-platform/product engineering pitch, not a claim of deep Rust, codec, or GPU expertise.
The Editor Platform posting found during research named TypeScript, Svelte, Rust, Python, and
browser/media technologies. Verify that the role is still open before applying.

Lead with the retained edit, one narrow demo, a reproducible check, and a clear explanation of
what the demo cannot infer. Ask where turnover validation or version comparison belongs in their
existing model. Do not lead with an undifferentiated list of complaints.

A pitch to use only after building the demo:

> My post background taught me what breaks a turnover. My software background lets me make those
> risks visible before an editor commits to the handoff. Here is a narrow demo, its test cases,
> and exactly what it cannot infer.
