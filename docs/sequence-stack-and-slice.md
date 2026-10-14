# Sequence stack evidence and vertical-slice scope

Inspected on October 14, 2026 in Ethan's authenticated workspace.
Repository: `mite404/sequence-spear-fish`, branch `feat/blending-and-masks`.
Source [inspection thread][thread] contains the screenshots and browser observations.

## What exists now

This repository still contains research only. No Svelte application, renderer, dependencies,
tests, or prototype media have been added. The inspection did not modify saved Sequence edits.

Ethan asked to continue implementation in a new thread with the medium LLM dial and a medium orb,
after pushing the completed research. Browser authentication is local to the current orb and does
not automatically transfer to the new orb.

## Confirmed evidence and limits

- **Svelte/SvelteKit:** authenticated routes load `/_app/immutable/entry/` and node chunks.
  The DOM contains Svelte-generated classes. Route data requests use `__data.json` and
  `x-sveltekit-invalidated`. Exact framework versions were not identified.
- **Cloud rendering:** Sequence's [current FAQ][faq] states that compositing and rendering run in
  the cloud, with the resulting picture streamed to the browser.
- **WebRTC evidence:** the loaded `NTAGV4cI.js` client chunk contains
  `alreadySubscribedToWebrtcMetrics`, `wampClient.subscribe`, and a
  `v1.msgpack.project_worker.webrtc_metrics` topic. The preview video received a `srcObject`.
  These support a WebRTC preview path, but do not establish the negotiated codec or server engine.
- **Rust/GStreamer history:** Sequence's [December 2021 WebRTCSink post][webrtcsink] describes a
  Rust GStreamer plugin that accepts raw audio/video and performs encoding, congestion control,
  and packet-loss mitigation for WebRTC. This is historical evidence, not verification of the
  current production backend.
- **GLSL effects:** the earlier audit published and rendered a custom shader. See
  [graphics findings](sequence-findings.md). That does not reveal the internal compositor API.
- **Remotion:** no evidence of Remotion was found in the inspected client chunks or public sources.
  Absence from this inspection does not prove it is absent from every private service.
- **Typography:** the page body uses `Inter var`, with RGB background `21, 23, 24` and text
  `236, 237, 238`. Other loaded font families include Fabriga, Test Pitch Sans, and JetBrains Mono.
  Do not copy proprietary font files into the prototype.

The cloud edit bay started, but the preview ended at "Couldn't connect" and "The preview stream
never arrived." The populated timeline and inspector were inspectable. Playback, negotiated
codecs, and successful streaming were not verified in this session.

## UI reference

The inspected editor has a rounded workspace sidebar at left and a rounded project area at right.
The project header contains the project name, Overview/Upload/Edit/Review navigation, avatars,
and Share. Below it are the media browser, central preview, and right inspector. The timeline
occupies the lower project area, with a ruler, white playhead, stacked clips, and floating tools.

The media browser has Media/Timelines/Collections tabs and a thumbnail grid. The edit inspector
has Clip Properties, Layout, and Timing sections. Its vertical tab rail includes Edit, Audio,
Color, Effects, Comments, Info, and Transcript. Effects has Applied and Library tabs.
Selected timeline clips use an amber outline. Video clips are navy with blue labels and thumbnail
strips. Title clips are brown with orange labels. Panels use thin gray borders and muted labels.

The current orb's screenshots are not tracked in Git. The continuation thread can retrieve these
files from the source thread with `download_thread_file` while its orb is accessible:

```text
.amp/in/artifacts/sequence/editor-reference.png
.amp/in/artifacts/sequence/edit-inspector-reference.png
.amp/in/artifacts/sequence/effects-reference.png
```

The second inspection recording failed with encoder lag. Use the screenshots, not the failed
recording, as the visual reference.

## User-directed scope

Ethan approved Svelte and SvelteKit and asked to mirror Sequence's architecture where appropriate
for a vertical slice. He explicitly corrected the scope: masking and Difference blending are
two independent features, not one comparison tool.

- **Difference:** add a clip blend mode that computes absolute differences between overlapping
  pictures. Both brighter and darker changes remain visible. Identical opaque pictures become
  black. Do not substitute directional subtraction.
- **Masking:** independently control a clip's visible region and reveal the picture underneath.
  It must work with Normal blending and without Difference enabled.
- **UI:** reproduce the familiar editor layout, not every editor function. Keep unimplemented
  controls clearly unavailable rather than implying working export, sharing, or collaboration.

The agent proposed rectangle/ellipse masks with position, size, feather, and invert controls,
and a local two-input GLSL renderer. These are implementation proposals, not user-approved internal
interfaces. Native Canvas2D is another viable local rendering option. Neither establishes parity
with Sequence's color pipeline or cloud engine. No renderer design has been implemented.

Avoid Remotion, a database, authentication, cloud-session infrastructure, and a full NLE unless
new evidence makes them necessary. Keep effect settings separate from media and renderer resources.
Matching SvelteKit helps UI portability; true renderer integration needs Sequence's private frame
inputs, effect schema, and compositing contracts.

## Verification to retain

Verify rendered pixels, not only controls. Difference needs asymmetric colors in both directions
and an identical-input case. Masking needs a contrasting lower layer showing outside the shape,
inversion, and a feather boundary. Exercise the features separately before combining them.
Inspect rendered desktop and narrow-layout screenshots, and record real pointer interaction.
Document color-space assumptions and the difference between local preview and cloud rendering.

[thread]: https://ampcode.com/threads/T-01a13c27-f198-77ff-a6a0-fa79e8817d59
[faq]: https://sequence.film/docs/get-started/faq
[webrtcsink]: https://blog.sequence.film/p/introducing-webrtcsink
