# Sequence compositing lab

Research for Ethan Anderson's editor-platform job pitch, combining post-production and software
engineering experience. Findings were gathered during the October 2026 hands-on Sequence audit.
The local SvelteKit slice reproduces the inspected editor layout and adds two independent features:
Difference blending and rectangle/ellipse masks. This is not Sequence's source code or backend.

## Run the editor

Use Node 22.17 or newer and npm.

```sh
npm ci
npm run dev
```

In an Amp orb, use `amp orb services ensure` and open the returned portal URL.

Both tracks start with the same forest image and displayed in/out points of 00:00:00:00–00:00:08:00.
Select the upper clip and choose **Difference** with **Mask → None** and 100% opacity. The preview
becomes fully black because every pixel matches. Switch back to **Normal (Alpha)** to see the image.
For masking, replace one source with a different image so the revealed region is visible. Adjust
position, width, height, feather, or inversion independently. **Reset clip** restores only that clip.

The media panel accepts your own still images, including transparent images. Files stay in the
browser. Images stretch to a fixed 960 × 540 preview. Refreshing discards the session.

## Verify the slice

```sh
npm run check
npm run format:check
npm test
npm run build
```

`npm test` starts an ephemeral Vite server and checks real Chromium canvas pixels, then uploads
known-color images through the editor controls. It checks absolute Difference in both directions,
identical inputs, masks under Normal, ellipse corners, inversion, feathering, opacity, source alpha,
combined effects, and per-clip state. Chromium is preinstalled in Amp orbs. Elsewhere, set
`CHROME_PATH` to your Chrome executable before running tests.

## Architecture and limits

`src/routes/+page.svelte` owns selection, image decoding, and clip settings.
`src/lib/compositor.ts` accepts image sources and settings separately and paints bottom to top.
Masks multiply source alpha first; Canvas2D then applies opacity and Normal or Difference blending.
The preview uses encoded sRGB, not linear-light or HDR compositing. Feather is an inward linear
ramp in normalized frame coordinates; ellipse feather uses normalized radial distance.

SvelteKit matches the verified client framework. Local Canvas2D avoids unnecessary cloud services
for this slice. It does not mirror Sequence's private renderer, WebRTC streaming, Rust services,
or color pipeline. Integration requires private frame and effect contracts we do not have.
Playback, trimming, export, collaboration, saving, and the other inspector tabs are unavailable.
The eight-second timeline is a layout reference for two overlapping stills, not a video engine.

Demo stills come from Unsplash's image CDN: [coast][coast-image] and [forest][forest-image],
cropped to 960 × 540. See the [Unsplash license][unsplash-license]. These replace, rather than copy,
the Mixkit media in the Sequence screenshots. No Sequence assets or proprietary fonts are bundled.

[coast-image]: https://images.unsplash.com/photo-1475924156734-496f6cac6ec1
[forest-image]: https://images.unsplash.com/photo-1448375240586-882707db888b
[unsplash-license]: https://unsplash.com/license

## Read the research

- [Tested workflows and feature gaps](docs/sequence-findings.md): retained edits, export results,
  graphics, grain, masking, alpha support, and evidence limits.
- [Vertical-slice opportunities](docs/prototype-opportunities.md): conform preflight,
  edit-version QC, handle-aware dissolves, and the evidence each demo needs.
- [Differentiation and possible moats](docs/sequence-differentiation.md): competitor comparison,
  integrated workflow advantages, and what remains unproven.
- [Stack evidence and selected slice](docs/sequence-stack-and-slice.md): SvelteKit, cloud preview
  evidence, editor layout, and the independent Difference and masking features selected by Ethan.

The source conversation contains screenshots, recordings, and additional research context:
[Sequence research thread][thread]. Those artifacts are not copied into this repository.

## Evidence limits

Read the stack-and-slice document for the current scope, then the earlier research for context.
Treat documented limitations differently from reproduced defects. Do not describe the
subtract-blended ocean title as a successful mask. Do not claim alpha import/export, latency
leadership, or multiplayer conflict safety was verified.

Meaningful work remains in Ethan's Sequence account. The commercial master and VFX lab are
separate timelines. See the findings document for names and identifiers.

[thread]: https://ampcode.com/threads/T-01a136a5-c7c5-7272-8a0b-c923d2c741de
