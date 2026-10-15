# FOR_ETHAN: the compositing lab

## The Story So Far

We inspected Sequence's actual edit bay before building this local slice. Its layout gives editors
familiar places to look: media on the left, picture in the center, clip controls on the right, and
tracks below. The screenshot reference had a failed cloud preview. Our local picture does render,
but that does not establish anything about Sequence's private infrastructure.

Difference and masks are separate tools. Difference changes how overlapping colors combine. A mask
changes where a clip is visible. Neither needs the other switched on.

## Cast & Crew (Architecture)

`src/routes/+page.svelte` is the edit desk. It decodes two still images and remembers the selected
clip. Each clip has its own `ClipSettings` record. Browser images are resources, not part of those
settings. Replacing footage does not replace its settings.

`src/lib/compositor.ts` is the local finishing desk. It receives an ordered array of image sources
and clip settings, applies each mask to that image's alpha, then paints the image over the lower
picture with its opacity and blend mode. Alpha is visibility: zero lets the picture underneath
show through. The checkerboard shows empty regions when neither layer covers them.

## Behind the Scenes (Decisions)

SvelteKit matches the framework we verified in Sequence. Native Canvas2D already implements
absolute Difference, so a custom GLSL engine would duplicate a browser capability for this slice.
The mask is a small CPU calculation over a fixed frame, suitable for two stills. Video playback
would require measuring that cost before choosing a GPU implementation.

The preview computes in encoded sRGB. It does not promise linear-light, HDR, or calibrated color
parity. Images stretch to 960 × 540. Feather fades inward, and ellipse softness uses normalized
radial distance rather than an exact pixel-distance field. These are stated ceilings, not hidden
production claims.

There is no database, login, export service, or simulated WebRTC connection. Rebuilding cloud
plumbing would not make the independent compositing controls more correct.

## Bloopers (Bugs & Fixes)

The first feather assertion assumed exact fractional-color arithmetic. Canvas stores premultiplied
8-bit alpha, so intermediate colors can round by one channel value. The test now allows a one-value
tolerance only for those fractional cases. Opaque Difference still needs exact RGB values.

The upload test initially set files before the initial images finished decoding. Automation can
set a file even when the real file control is disabled. The test now waits for Ready before
replacing each image, matching the actual user journey rather than bypassing its loading state.

The initial framework versions included a low-severity cookie advisory. We moved the fresh app to
SvelteKit 3 and its compatible Vite, Svelte, and TypeScript versions. That required the current Vite
plugin configuration and built-in TypeScript configuration rather than SvelteKit 2 conventions.

## Director's Commentary

The useful test is a contrast shot. Our lower RGB is `(20, 180, 60)` and upper RGB is
`(200, 40, 100)`. Difference must produce `(180, 140, 40)` regardless of which picture is on top.
Directional subtraction would lose the channel where the lower picture is brighter. Identical
opaque pictures must become black.

Mask tests need a visible lower picture. Black outside a shape could be an opaque black fill,
not transparency. The test checks that the lower green picture appears outside the mask under
Normal blending, then swaps the regions with inversion. That is the proof the earlier subtract
workaround did not provide.

Keep the controls honest. A disabled playback button and a still-image label are better than a
fake playhead animation that implies a video renderer. Likewise, passing local pixel tests does not
make this ready to integrate with Sequence's backend.
