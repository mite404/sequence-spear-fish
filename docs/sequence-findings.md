# Sequence: tested workflows and feature gaps

## Scope and confidence

This audit used Ethan's signed-in workspace to assemble a stock-footage commercial and exercise
graphics, effects, color, and compositing. Meaningful work was retained in the account.
Research observations are from October 2026. Features and pricing can change.

Evidence falls into three categories:

- **Observed:** a workflow exercised in the app, with export inspection where stated.
- **Documented:** a contract stated in Sequence's public documentation.
- **Unverified:** a hypothesis or capability not established by the tests.

The test used three 720p stock clips. It was not a production-scale, security, or independent-user
collaboration audit. No internal source code, private API, or collaboration protocol was inspected.

## Retained work

Project: **FIELD NOTES | 30s commercial + workflow audit**.

- **FIELD NOTES | 30s MASTER:** forest, coast, and paddleboard scenes, with blade splits and
  opening/closing text. This is the editable commercial, not just its flattened export.
- **01 STOCK - Mixkit:** three imported source clips.
- **FIELD_NOTES_30s_v02_silent.mp4:** downloaded and inspected commercial render.
- **FIELD_NOTES_30s_MASTER_v01.otio:** package generated before graphics work.
- **FIELD_NOTES_30s_MASTER_v02.otio:** later package retained in the library.
- **VFX LAB | graphics, keying + text matte:** duplicate used for experiments. Its name describes
  the intended experiment, not proof that native text mattes work.
- **KEY_TEST_synthetic.mp4** and **OCEAN-subtract-matte.png:** retained test assets.
- **VFX LAB - monochrome mix:** published custom effect with an adjustable mix control.
- **VFX_LAB_v01_text_and_custom_effect.mp4**, **VFX_LAB_v02_verified.mp4**, and
  **VFX_LAB_v03_grain.mp4:** retained lab exports.

The app resolved the initial workspace URL to another signed-in workspace ID. These identify the
project actually used:

```text
workspace: ethan-s-workspace-9b50a553-ecbe-47d4-a961-ce31234883fe
project: 6f6c0d77-ee9c-4357-a901-3241f78980fa
master timeline: pwti8LCgkOfSBYn-A2EJ4
VFX timeline: pwti8LCgkOfSBYn-A2EJ4__mv75f8f0
```

In the project, open **Edit → Timelines**, then double-click the relevant timeline name.
The source [research thread][thread] contains direct project links and visual evidence.

## Editing and organization

Observed import, folder organization, source trimming, timeline creation, and blade cuts.
The master uses forest roughly from 0–10 seconds, coast from 10–20 seconds, and paddleboard
from 20–30 seconds. Blade splits around 5 and 15 seconds remain in the saved timeline.

The app has multicam, nesting, advanced trim, keyframes, expressions, and substantial color
controls. Their existence is not proof of production quality. Do not list these as absent.
No multicam or nested-conform stress test was performed.

## Graphics and custom effects

Opening and closing title overlays appear in the commercial export. A separate VFX title card
preserved the degree sign and accented text in `COAST / 24° | Montréal`. A distinct outline stroke
was not discernible in the inspected frame. The card extended the lab beyond the master duration.

A custom GLSL monochrome effect was published and applied to the paddleboard shot. The export
shows grayscale footage. Control keyframes were authored, but interpolation was not independently
measured. GLSL is shader code executed by the graphics processor.

The starter shader needed its sampler changed to `tex` and explicit locations/binding added
before validation passed. Malformed JSON produced an actionable parse error. Preview sometimes
lagged the exported result; its cause was not established.

## Blend modes and built-in grain

Observed menu options, consistent with [blend-mode documentation][blends]:

- Normal, labelled with Alpha in the live menu.
- Add.
- Subtract.
- Reverse Subtract.

Screen, Multiply, and Difference were absent from that menu. Subtract is directional subtraction,
not absolute Difference, so it is not equivalent for bidirectional edit-version QC. Documentation
says opacity is available only in Normal mode.

Built-in synthetic grain exists under **Color → Creative Adjustments → Noise Type**. Off, Luma,
and RGB modes have Amount and Strength controls. Both active modes visibly responded at stress
settings of 100/100. The retained second forest segment uses Luma, Amount 30, Strength 20.

The v03 grain export was downloaded and inspected. Its 7-second frame differs from the pre-grain
v02 frame. Mild noise in a compressed still does not establish film-stock realism. No parity with
Resolve's grain emulation was demonstrated. [Creative adjustment documentation][adjustments]
describes these as synthetic grain controls.

## Masking: correction to the ocean-text experiment

**The ocean-through-letters experiment did not demonstrate a mask.** An imported black-on-white
raster title with Reverse Subtract blending produced recognizable beach-filled letters, but the
export retained dim beach detail outside them. This is a blend workaround, not alpha masking.
Even solid black outside the letters would not prove transparency.

A valid text-matte test needs beach footage inside the text and transparency outside, including
the holes in O and A. A contrasting layer beneath the beach must show through those transparent
regions. Changing the text must update the matte if editable text masking is claimed.

No native shape/Bezier mask authoring or text/alpha/luma track-matte workflow was found in the
inspected UI and docs. This is not exhaustive proof that no masking mechanism exists anywhere.

Explicit documented limits are narrower and stronger evidence:

- Grading sliders affect the whole clip, with no shapes or masks to limit them.
- The chroma keyer has no masks/garbage mattes, spill-suppression, or light-wrap controls.

## Alpha: distinguish compositing from media interchange

**Transparent compositing is established.** In the synthetic key test, forest appeared through
the removed green background and through a green hole within the foreground shape. Foreground
greens also disappeared. This was not a realistic hair, spill, or uneven-screen quality test.

**Alpha import is unverified.** No known-alpha PNG or ProRes graphic was tested through upload,
optimized playback, and rendering. General support for a file format does not prove alpha survives.

**Alpha export is unverified.** [Export settings][export-settings] list ProRes 4444, but a codec's
capacity to store alpha is not proof that Sequence writes meaningful transparency into it.

A decisive future test imports known transparent media over a contrasting background, checks
playback after optimization, exports ProRes 4444, and inspects both alpha values and recompositing
in another application. Merely finding an alpha-capable pixel format is insufficient.

## Transitions, color, and delivery timing

[Transition documentation][transitions] explicitly says there are no built-in dissolves, wipes,
crossfades, or one-click fades. Opacity and volume keyframes are the documented workaround.
An attempted end fade was absent from the commercial export. Selection or keyframe placement
may explain it; this is not a confirmed rendering defect.

Forest controls were exercised with exposure 0.2, highlights −8, shadows 10, and vibrance 8.
Curves, wheels, warper, and LUT controls were visible. No calibrated display, RAW/HDR test,
color-space round trip, or objective grading comparison was performed.

Downloaded commercial metadata and audio checks:

```text
video: H.264, 1280×720, 24000/1001 fps, 721 frames
video frame duration: approximately 30.0717 seconds
container duration: 30.122667 seconds
audio: AAC; FFmpeg volumedetect mean/max: −91.0 dB
VFX lab v02 container duration: 33.706667 seconds
```

The commercial is a silent rough cut, not an exact :30 broadcast delivery. The overrun may reflect
the edit and fractional frame rate, not faulty timing. Delivery validation needs an explicit
specification and must distinguish video-frame duration from audio/container duration.

## Interchange and EDL

The live package dropdown and [package documentation][packages] offer OTIO, AAF, and FCP7 XML.
EDL was not offered there. EDL remains useful for cut/timecode conforms, but its absence alone
does not establish broken interchange. EDL files can be stored as library documents; that is
different from generating or importing an editable timeline.

OTIO describes edit structure and timing, not the rendered movie or embedded footage. Packages
were generated, but their contents were not inspected and no receiving-NLE conform was completed.
The package context menu offered Open in Shuttle rather than browser Download.

Sequence documents that most effects, keyframes, and clip adjustments do not yet translate to
the destination NLE. A standalone package reader cannot recover information discarded on export.

## Browser diagnostics and remaining unknowns

The orb's Desktop Chrome lacked a WebGL context and showed a blank timeline. A separate browser
with working WebGL rendered it. This is environment-specific, not evidence that ordinary users
have broken timelines. No actionable capability explanation was observed in that blank state.

A scopes-waiting state alongside a visible preview, transient black preview, and missing fade
need controlled reproduction before being reported as defects. Some long browser recordings
failed with encoder lag. Screenshots, downloaded movies, and a short ocean-playback recording
remain in the source thread.

Still unverified: latency leadership, independent-user conflicts and undo, offline reconnection,
large-project reliability, upload recovery, camera-original throughput, security, production cost,
tracking, alpha import/export, and receiving-editor reconstruction.

## Source footage and provenance

- [Forest stream, Mixkit 529][forest].
- [Coast, Mixkit 4078][coast].
- [Paddleboard, Mixkit 2079][paddleboard].
- [Mixkit license][license]. Selected pages identified the clips as free for commercial/personal
  use. Preserve provenance; this research is not a legal opinion.

[thread]: https://ampcode.com/threads/T-01a136a5-c7c5-7272-8a0b-c923d2c741de
[blends]: https://sequence.film/docs/effects/blend-modes
[adjustments]: https://sequence.film/docs/effects/color-adjustments
[export-settings]: https://sequence.film/docs/exporting/export-settings
[transitions]: https://sequence.film/docs/effects/transitions-and-fades
[packages]: https://sequence.film/docs/exporting/timeline-packages
[forest]: https://mixkit.co/free-stock-video/forest-stream-in-the-sunlight-529/
[coast]: https://mixkit.co/free-stock-video/ocean-waves-bursting-on-the-shore-of-the-coast-4078/
[paddleboard]: https://mixkit.co/free-stock-video/calm-sea-with-paddleboarder-2079/
[license]: https://mixkit.co/license/
