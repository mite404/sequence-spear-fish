<script lang="ts">
  import { onMount } from 'svelte';
  import { composite, type ClipSettings, type Mask } from '../lib/compositor';

  const icons = {
    edit: 'M4 6h16M4 12h16M4 18h16M8 3v6M16 9v6M10 15v6',
    media: 'M4 4h6v16H4zM14 4h6v16h-6zM4 8h6M14 8h6',
    clock: 'M12 8v5l3 2M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18',
    grid: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
    folder: 'M3 6h7l2 3h9v11H3z',
    arrow: 'M4 12h16M14 6l6 6-6 6',
    audio: 'M4 9v6M8 5v14M12 8v8M16 3v18M20 9v6',
    color: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18M12 3v18M3 12h18',
    effects: 'M5 21l5-16q2-4 6-1M4 10h10M15 14l6 7M21 14l-6 7',
    comment: 'M3 4h18v13H8l-5 4zM7 10h1M12 10h1M17 10h1',
    info: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18M12 11v6M12 7v1',
    pointer: 'M4 3l16 9-7 2-3 7z',
    scissors:
      'M8 8l12 12M8 16L20 4M5 4a3 3 0 1 0 0 6 3 3 0 0 0 0-6M5 14a3 3 0 1 0 0 6 3 3 0 0 0 0-6',
    mask: 'M5 5h14v14H5zM2 8V2h6M16 2h6v6M22 16v6h-6M8 22H2v-6',
    bell: 'M5 17h14l-2-4V8a5 5 0 0 0-10 0v5zM10 21h4',
    settings:
      'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2',
  };
  const defaultMask: Mask = {
    shape: 'rectangle',
    x: 50,
    y: 50,
    width: 60,
    height: 65,
    feather: 0,
    invert: false,
  };
  const freshSettings = (): ClipSettings => ({ blend: 'normal', opacity: 1, mask: null });
  let settings = $state([freshSettings(), freshSettings()]);
  let selected = $state(1);
  let images = $state.raw<(HTMLImageElement | null)[]>([null, null]);
  let urls = $state(['/media/forest.jpg', '/media/forest.jpg']);
  let names = $state(['Forest.jpg', 'Forest.jpg']);
  let loading = $state([true, true]);
  let error = $state('');
  let canvas: HTMLCanvasElement;
  const clip = $derived(settings[selected]);
  const ready = $derived(!loading.some(Boolean) && images.every(Boolean));

  async function loadImage(url: string, index: number, name: string) {
    loading[index] = true;
    error = '';
    const image = new Image();
    image.src = url;
    try {
      await image.decode();
      const previous = urls[index];
      images = images.map((source, i) => (i === index ? image : source));
      urls[index] = url;
      names[index] = name;
      if (previous.startsWith('blob:')) URL.revokeObjectURL(previous);
    } catch {
      if (url.startsWith('blob:')) URL.revokeObjectURL(url);
      error = 'Could not decode that image. The previous picture is unchanged.';
    } finally {
      loading[index] = false;
    }
  }

  function replaceImage(event: Event, index: number) {
    if (!(event.currentTarget instanceof HTMLInputElement)) return;
    const file = event.currentTarget.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      error = 'Choose a still image, such as PNG, JPEG, WebP, or SVG.';
      return;
    }
    void loadImage(URL.createObjectURL(file), index, file.name);
    event.currentTarget.value = '';
  }

  function changeMask(event: Event) {
    if (!(event.currentTarget instanceof HTMLSelectElement)) return;
    const shape = event.currentTarget.value;
    if (shape === 'none') clip.mask = null;
    else if (shape === 'rectangle' || shape === 'ellipse') {
      clip.mask = { ...(clip.mask ?? defaultMask), shape };
    }
  }

  onMount(() => {
    void loadImage(urls[0], 0, names[0]);
    void loadImage(urls[1], 1, names[1]);
    return () =>
      urls.forEach((url) => {
        if (url.startsWith('blob:')) URL.revokeObjectURL(url);
      });
  });

  $effect(() => {
    const layers = images.flatMap((source, index) =>
      source ? [{ source, ...settings[index] }] : [],
    );
    if (canvas && layers.length === 2) {
      try {
        composite(canvas, layers);
      } catch (reason) {
        error = reason instanceof Error ? reason.message : 'Preview failed.';
      }
    }
  });
</script>

{#snippet icon(name: keyof typeof icons)}
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.5"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"><path d={icons[name]} /></svg
  >
{/snippet}

<svelte:head>
  <title>FIELD NOTES | Sequence compositing slice</title>
  <meta
    name="description"
    content="A local SvelteKit editor slice with independent Difference blending and shape masks."
  />
</svelte:head>

<div class="workspace">
  <aside class="sidebar">
    <div class="workspace-name">Ethan's workspace <span>⌄</span> {@render icon('bell')}</div>
    <button class="new-project" disabled title="Project creation is outside this slice"
      ><strong>Create New Project {@render icon('arrow')}</strong><span>Make some movie magic.</span
      ></button
    >
    <nav aria-label="Workspace">
      <button disabled>{@render icon('clock')} Recents</button><button disabled
        >{@render icon('grid')} All Projects</button
      >
    </nav>
    <div class="favorites">
      <span>Favorites</span>
      <p>No favorites added yet</p>
    </div>
    <div class="sidebar-bottom">
      <div class="local-note">
        <span class="status-dot"></span> Local prototype
        <p>No cloud session required</p>
      </div>
      <button disabled>{@render icon('comment')} Send Feedback</button><button disabled
        >{@render icon('settings')} Workspace Settings</button
      ><button disabled>{@render icon('info')} Help &amp; Support</button>
    </div>
  </aside>

  <main class="project">
    <header class="project-header">
      <div class="project-name">
        <span class="sequence-mark" aria-hidden="true"
          ><i></i><i></i><i></i><i></i><i></i><i></i></span
        ><span>FIELD NOTES <span class="project-subtitle">| compositing lab</span></span>
      </div>
      <nav aria-label="Project">
        <button disabled>Overview</button><button disabled>Upload</button><button
          class="active"
          aria-current="page">Edit</button
        ><button disabled>Review</button>
      </nav>
      <div class="share">
        <span class="avatar">EA</span><button disabled title="Sharing is outside this local slice"
          >↑ Share</button
        >
      </div>
    </header>

    <div class="edit-area">
      <section class="media-panel" aria-label="Media browser">
        <div class="panel-tabs">
          <span class="tab-active">{@render icon('media')} Media</span><button disabled
            >Timelines</button
          ><button disabled>Collections</button>
        </div>
        <div class="media-path">{@render icon('folder')} Project <span>⌄</span></div>
        <div class="media-grid">
          {#each urls as url, index}
            <button
              class="media-card"
              class:chosen={selected === index}
              onclick={() => (selected = index)}
              aria-label={`Select ${index === 0 ? 'lower' : 'upper'} media`}
            >
              <div class="thumbnail">
                <img src={url} alt={`${names[index]} source`} /><span>STILL</span>
              </div>
              <strong>{names[index]}</strong><small
                >{images[index]?.naturalWidth ?? 960} × {images[index]?.naturalHeight ?? 540} · {index ===
                0
                  ? 'Lower'
                  : 'Upper'} layer</small
              >
            </button>
          {/each}
        </div>
        <div class="replace-media">
          <h3>Your own pictures</h3>
          <p>
            Replace either source. Images stay in this browser and stretch to the preview frame.
          </p>
          <label class="file-button"
            >Replace lower image<input
              aria-label="Replace lower image"
              type="file"
              accept="image/*"
              disabled={loading[0]}
              onchange={(event) => replaceImage(event, 0)}
            /></label
          >
          <label class="file-button"
            >Replace upper image<input
              aria-label="Replace upper image"
              type="file"
              accept="image/*"
              disabled={loading[1]}
              onchange={(event) => replaceImage(event, 1)}
            /></label
          >
        </div>
      </section>

      <section class="viewer" aria-label="Composite preview">
        <div class="viewer-heading">
          {@render icon('mask')} <span>FIELD NOTES | COMPOSITING LAB</span><span class="local-badge"
            >LOCAL</span
          >
        </div>
        <div class="picture">
          <canvas
            bind:this={canvas}
            width="960"
            height="540"
            aria-label="Composite of the lower and upper still images"
          ></canvas>{#if !ready}<span class="loading">Loading images…</span>{/if}
        </div>
        <div class="transport">
          <button disabled aria-label="Playback unavailable for still-image slice">▷</button><span
            class="timecode">00:00:00:00</span
          ><span class="preview-size">960 × 540</span><span class="status-dot"></span>
        </div>
        <div class="preview-status" role="status">
          {error ||
            (ready ? 'Ready · local sRGB preview · still images' : 'Loading source images…')}
        </div>
      </section>

      <section class="inspector" aria-label="Clip inspector">
        <div class="inspector-content">
          <div class="inspector-heading">Edit <span>Clip inspector</span></div>
          <div class="clip-name">
            {@render icon('media')}<span>{names[selected]}</span><span class="layer-badge"
              >V{selected + 1}</span
            >
          </div>
          <section class="inspector-section">
            <h2>Clip Properties</h2>
            <div class="properties">
              <span>In</span><span>00:00:00:00</span><span>Out</span><span>00:00:08:00</span>
            </div>
            <div class="property-row"><span>Source</span><span>Still image</span></div>
          </section>
          <section class="inspector-section">
            <h2>Compositing <span class="section-icon">{@render icon('color')}</span></h2>
            <label class="control"
              >Blend mode<select bind:value={clip.blend} aria-label="Blend mode"
                ><option value="normal">Normal (Alpha)</option><option value="difference"
                  >Difference</option
                ></select
              ></label
            >
            <label class="range-control"
              ><span>Opacity <output>{Math.round(clip.opacity * 100)}%</output></span><input
                aria-label="Opacity"
                type="range"
                min="0"
                max="1"
                step="0.01"
                bind:value={clip.opacity}
              /></label
            >
            <p class="hint">
              {clip.blend === 'difference'
                ? 'Absolute picture difference. Identical opaque pictures become black.'
                : 'The upper picture covers the lower picture according to its alpha and opacity.'}
            </p>
          </section>
          <section class="inspector-section mask-section">
            <h2>Mask <span class="section-icon">{@render icon('mask')}</span></h2>
            <label class="control"
              >Shape<select
                aria-label="Mask shape"
                value={clip.mask?.shape ?? 'none'}
                onchange={changeMask}
                ><option value="none">None</option><option value="rectangle">Rectangle</option
                ><option value="ellipse">Ellipse</option></select
              ></label
            >
            {#if clip.mask}
              <div class="mask-controls">
                <label class="range-control"
                  ><span>Position X <output>{clip.mask.x}%</output></span><input
                    aria-label="Mask position X"
                    type="range"
                    min="0"
                    max="100"
                    bind:value={clip.mask.x}
                  /></label
                >
                <label class="range-control"
                  ><span>Position Y <output>{clip.mask.y}%</output></span><input
                    aria-label="Mask position Y"
                    type="range"
                    min="0"
                    max="100"
                    bind:value={clip.mask.y}
                  /></label
                >
                <label class="range-control"
                  ><span>Width <output>{clip.mask.width}%</output></span><input
                    aria-label="Mask width"
                    type="range"
                    min="1"
                    max="100"
                    bind:value={clip.mask.width}
                  /></label
                >
                <label class="range-control"
                  ><span>Height <output>{clip.mask.height}%</output></span><input
                    aria-label="Mask height"
                    type="range"
                    min="1"
                    max="100"
                    bind:value={clip.mask.height}
                  /></label
                >
                <label class="range-control"
                  ><span>Feather <output>{clip.mask.feather}%</output></span><input
                    aria-label="Mask feather"
                    type="range"
                    min="0"
                    max="25"
                    bind:value={clip.mask.feather}
                  /></label
                >
                <label class="checkbox-control"
                  ><input
                    type="checkbox"
                    aria-label="Invert mask"
                    bind:checked={clip.mask.invert}
                  /> Invert mask</label
                >
              </div>
            {/if}
            <p class="hint">
              {#if clip.mask}
                {clip.mask.invert ? 'Inside' : 'Outside'} the shape is transparent, revealing any lower
                layer. Position and size use frame percentages.
              {:else}
                Reveal the layer below with a shape. Works independently of the blend mode.
              {/if}
            </p>
          </section>
          <div class="reset-row">
            <button onclick={() => (settings[selected] = freshSettings())}>Reset clip</button><span
              >Not saved · session only</span
            >
          </div>
        </div>
        <nav class="inspector-rail" aria-label="Inspector panels">
          <button class="rail-active" aria-label="Edit inspector">{@render icon('edit')}</button
          >{#each ['audio', 'color', 'effects', 'comment', 'info'] as panel}<button
              disabled
              title="Outside this slice"
              aria-label={`${panel} inspector unavailable`}
              >{#if panel === 'audio'}{@render icon(
                  'audio',
                )}{:else if panel === 'color'}{@render icon(
                  'color',
                )}{:else if panel === 'effects'}{@render icon(
                  'effects',
                )}{:else if panel === 'comment'}{@render icon('comment')}{:else}{@render icon(
                  'info',
                )}{/if}</button
            >{/each}
        </nav>
      </section>
    </div>

    <section class="timeline" aria-label="Two-layer still-image timeline">
      <div class="timeline-heading">
        <span>Compositing lab</span><span
          >2 overlapping stills · 8s layout reference · no playback</span
        >
      </div>
      <div class="ruler">
        <span>00:00:00:00</span><span>00:00:02:00</span><span>00:00:04:00</span><span
          >00:00:06:00</span
        ><span>00:00:08:00</span>
      </div>
      <div class="tracks">
        <div class="playhead"></div>
        {#each [1, 0] as index}
          <div class="track">
            <span class="track-label">V{index + 1}</span><button
              class="timeline-clip"
              class:selected={selected === index}
              onclick={() => (selected = index)}
              aria-label={`Select ${index === 0 ? 'lower' : 'upper'} clip`}
              aria-pressed={selected === index}
              ><span class="clip-title"
                >{names[index]}
                <small
                  >{settings[index].blend === 'difference' ? 'Difference' : 'Normal'}{settings[
                    index
                  ].mask
                    ? ' · Mask'
                    : ''}</small
                ></span
              ><span class="filmstrip" style={`background-image: url('${urls[index]}')`}
              ></span></button
            >
          </div>
        {/each}
      </div>
      <div class="timeline-tools">
        <button class="tool-active" aria-label="Selection tool">{@render icon('pointer')}</button
        ><button disabled aria-label="Blade unavailable">{@render icon('scissors')}</button><button
          disabled
          aria-label="Trim unavailable">↔</button
        ><button disabled aria-label="Title unavailable">T</button><span></span><button
          disabled
          aria-label="Comments unavailable">{@render icon('comment')}</button
        ><button disabled aria-label="Keyframes unavailable">◇</button>
      </div>
    </section>
  </main>
</div>

<style>
  :global(*) {
    box-sizing: border-box;
  }
  :global(body) {
    margin: 0;
    background: #101213;
    color: #ecedee;
    font:
      13px Inter,
      -apple-system,
      BlinkMacSystemFont,
      'Segoe UI',
      sans-serif;
  }
  :global(button),
  :global(input),
  :global(select) {
    font: inherit;
  }
  :global(button) {
    color: inherit;
    background: none;
    border: 0;
    cursor: pointer;
  }
  :global(button:disabled) {
    cursor: not-allowed;
    color: #929a9d;
  }
  :global(button:not(:disabled):hover) {
    background-color: #303638;
  }
  :global(button:focus-visible),
  :global(input:focus-visible),
  :global(select:focus-visible),
  .file-button:focus-within {
    outline: 2px solid #f5aa29;
    outline-offset: 3px;
  }
  :global(svg) {
    flex-shrink: 0;
  }
  .workspace {
    height: 100dvh;
    min-height: 720px;
    padding: 8px;
    display: grid;
    grid-template-columns: 220px minmax(0, 1fr);
    gap: 8px;
  }
  .sidebar,
  .project {
    background: #1b1e1f;
    border: 1px solid #2b3032;
    border-radius: 16px;
    overflow: hidden;
  }
  .sidebar {
    display: flex;
    flex-direction: column;
    color: #969ea1;
  }
  .workspace-name {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 23px 15px;
    font-size: 15px;
    white-space: nowrap;
  }
  .workspace-name svg {
    margin-left: auto;
    width: 18px;
  }
  .new-project {
    margin: 4px 8px 12px;
    border: 1px solid #3a4042;
    border-radius: 6px;
    padding: 12px 9px;
    background: #262a2b;
    text-align: left;
  }
  .new-project strong {
    display: flex;
    justify-content: space-between;
    color: #ecedee;
    font-size: 15px;
    font-weight: 400;
  }
  .new-project span {
    display: block;
    margin-top: 5px;
  }
  .sidebar nav {
    padding: 0 8px 16px;
    border-bottom: 1px solid #2b3032;
  }
  .sidebar button:not(.new-project) {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 8px;
    width: 100%;
    text-align: left;
  }
  .favorites {
    padding: 18px 15px;
  }
  .favorites p {
    color: #737e82;
    margin-top: 20px;
  }
  .sidebar-bottom {
    margin-top: auto;
    border-top: 1px solid #2b3032;
    padding: 10px 8px;
  }
  .local-note {
    padding: 15px 8px 12px;
    color: #ecedee;
  }
  .local-note p {
    color: #7c868a;
    font-size: 11px;
  }
  .status-dot {
    display: inline-block;
    width: 6px;
    height: 6px;
    background: #75b77a;
    border-radius: 50%;
    margin-right: 7px;
  }
  .project {
    display: grid;
    grid-template-rows: 48px minmax(0, 1.15fr) minmax(260px, 0.85fr);
  }
  .project-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 0 13px;
    border-bottom: 1px solid #090b0c;
    background: #202425;
  }
  .project-name {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
    font-size: 16px;
    white-space: nowrap;
  }
  .sequence-mark {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #07090a;
    display: grid;
    grid-template-columns: repeat(2, 4px);
    gap: 2px;
    justify-content: center;
    align-content: center;
    flex-shrink: 0;
    transform: rotate(15deg);
  }
  .sequence-mark i {
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: #77b8b6;
  }
  .sequence-mark i:nth-child(2) {
    background: #846ee8;
  }
  .sequence-mark i:nth-child(3) {
    background: #b3dc53;
  }
  .sequence-mark i:nth-child(4) {
    background: #ed3f6f;
  }
  .sequence-mark i:nth-child(5) {
    background: #f5ba37;
  }
  .sequence-mark i:nth-child(6) {
    background: #389bd2;
  }
  .project-header nav {
    display: flex;
    border: 1px solid #34393b;
    border-radius: 9px;
    background: #151819;
    padding: 3px;
  }
  .project-header nav button {
    padding: 5px 10px;
    font-size: 14px;
    border-radius: 6px;
  }
  .active {
    background: #292d2f;
  }
  .share {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .avatar {
    background: #006a80;
    color: white;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    font-size: 11px;
  }
  .edit-area {
    display: grid;
    grid-template-columns: 260px minmax(200px, 1fr) 320px;
    min-height: 0;
  }
  .media-panel {
    border-right: 1px solid #090b0c;
    overflow: auto;
  }
  .panel-tabs {
    display: flex;
    align-items: center;
    gap: 8px;
    border-bottom: 1px solid #303536;
    padding: 9px 8px 0;
    white-space: nowrap;
  }
  .panel-tabs button {
    padding: 9px 0;
    font-size: 11px;
  }
  .tab-active {
    border: 1px solid #303536;
    border-bottom-color: #222628;
    border-radius: 8px 8px 0 0;
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 9px 7px;
    background: #222628;
  }
  .tab-active svg {
    width: 15px;
  }
  .media-path {
    margin: 9px;
    border: 1px solid #383f41;
    padding: 8px 10px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    gap: 10px;
    color: #969ea1;
  }
  .media-path span {
    margin-left: auto;
  }
  .media-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px 9px;
    padding: 10px 9px 18px;
  }
  .media-card {
    text-align: left;
    padding: 0;
    border-radius: 5px;
    min-width: 0;
  }
  .media-card.chosen .thumbnail {
    border-color: #6a7073;
  }
  .thumbnail {
    aspect-ratio: 1;
    display: flex;
    align-items: center;
    position: relative;
    background: #262a2c;
    border: 1px solid transparent;
    border-radius: 5px;
    overflow: hidden;
  }
  .thumbnail img {
    width: 100%;
    aspect-ratio: 16/9;
    object-fit: cover;
  }
  .thumbnail span {
    position: absolute;
    right: 5px;
    bottom: 5px;
    font-size: 8px;
    letter-spacing: 1px;
    color: #99a2a6;
  }
  .media-card strong {
    display: block;
    font-weight: 400;
    font-size: 11px;
    margin-top: 9px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .media-card small {
    color: #768286;
    font-size: 10px;
    display: block;
    margin-top: 5px;
  }
  .replace-media {
    margin: 0 10px;
    padding: 12px 0;
    border-top: 1px solid #303537;
  }
  .replace-media h3 {
    font-size: 12px;
    font-weight: 500;
    margin: 0;
  }
  .replace-media p {
    font-size: 11px;
    line-height: 1.5;
    color: #808c91;
  }
  .file-button {
    display: block;
    position: relative;
    border: 1px solid #3d464a;
    padding: 8px 10px;
    border-radius: 5px;
    font-size: 11px;
    margin: 8px 0;
    cursor: pointer;
  }
  .file-button:hover {
    background: #303638;
  }
  .file-button input {
    position: absolute;
    inset: 0;
    opacity: 0;
    width: 100%;
    cursor: pointer;
  }
  .viewer {
    display: flex;
    flex-direction: column;
    min-width: 0;
    background: #131516;
    border-right: 1px solid #090b0c;
  }
  .viewer-heading {
    display: flex;
    align-items: center;
    gap: 9px;
    height: 32px;
    padding: 0 10px;
    background: #1b1e1f;
    font-size: 11px;
  }
  .viewer-heading svg {
    color: #76858c;
    width: 15px;
  }
  .viewer-heading > span:first-of-type {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  .local-badge {
    font-size: 8px;
    letter-spacing: 1px;
    border: 1px solid #35403c;
    padding: 2px 4px;
    border-radius: 3px;
    color: #8bae96;
    margin-left: auto;
  }
  .picture {
    display: grid;
    place-items: center;
    flex: 1;
    min-height: 0;
    padding: 18px;
    position: relative;
    background-color: #101213;
    background-image: repeating-conic-gradient(#16191a 0% 25%, transparent 0% 50%);
    background-size: 14px 14px;
  }
  canvas {
    width: 100%;
    max-height: 100%;
    aspect-ratio: 16/9;
    object-fit: contain;
    box-shadow:
      0 0 0 1px #303738,
      0 8px 35px #0005;
  }
  .loading {
    position: absolute;
    background: #202526;
    padding: 16px;
    border-radius: 8px;
  }
  .transport {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 15px;
    padding: 9px;
    border-top: 1px solid #080a0b;
    background: #1b1e1f;
  }
  .transport button {
    font-size: 25px;
    padding: 0 8px;
  }
  .timecode {
    font:
      20px 'Courier New',
      monospace;
    padding: 4px 8px;
    border: 1px solid #353c3e;
    background: #151819;
    border-radius: 5px;
  }
  .preview-size {
    color: #7e8a8e;
    font-size: 10px;
  }
  .preview-status {
    color: #8c9b91;
    text-align: center;
    font-size: 10px;
    padding: 6px 10px;
    background: #1b1e1f;
    min-height: 23px;
  }
  .inspector {
    display: flex;
    min-height: 0;
  }
  .inspector-content {
    overflow: auto;
    flex: 1;
    min-width: 0;
  }
  .inspector-heading {
    padding: 8px 10px;
    font-weight: 500;
    color: #879195;
    border-bottom: 1px solid #2a3032;
  }
  .inspector-heading span {
    float: right;
    font-size: 10px;
    font-weight: 400;
    color: #616d71;
  }
  .clip-name {
    margin: 10px 8px 4px;
    padding: 10px;
    border: 1px solid #353c3f;
    border-radius: 18px;
    background: #151819;
    display: flex;
    align-items: center;
    gap: 8px;
    color: #a4adb0;
    font-size: 12px;
  }
  .clip-name > span:first-of-type {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  .clip-name svg {
    width: 15px;
  }
  .layer-badge {
    font-size: 9px;
    color: #8299d9;
    margin-left: auto;
  }
  .inspector-section {
    padding: 15px 12px;
    border-bottom: 1px solid #2c3234;
  }
  .inspector-section h2 {
    font-size: 14px;
    font-weight: 600;
    margin: 0 0 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .section-icon {
    color: #6e7c82;
  }
  .section-icon svg {
    width: 16px;
  }
  .properties {
    display: grid;
    grid-template-columns: 20px 1fr 25px 1fr;
    gap: 5px;
    font-size: 10px;
  }
  .properties span:nth-child(odd) {
    color: #79868b;
  }
  .properties span:nth-child(even) {
    text-align: right;
  }
  .property-row {
    display: flex;
    justify-content: space-between;
    color: #96a1a5;
    margin-top: 12px;
    font-size: 11px;
  }
  .property-row span:first-child {
    color: #79868b;
  }
  .control {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: center;
    color: #909da3;
    font-size: 12px;
    margin-bottom: 14px;
  }
  select {
    background: #282d2f;
    color: #e4e8ea;
    border: 1px solid #41494d;
    padding: 6px 7px;
    border-radius: 5px;
    max-width: 155px;
    font-size: 11px;
  }
  .range-control {
    display: block;
    margin: 11px 0;
    color: #909da3;
    font-size: 11px;
  }
  .range-control > span {
    display: flex;
    justify-content: space-between;
  }
  .range-control output {
    color: #d4dadd;
    font-variant-numeric: tabular-nums;
  }
  .range-control input {
    width: 100%;
    height: 14px;
    margin: 7px 0 0;
    accent-color: #d1a35c;
    cursor: pointer;
  }
  .hint {
    color: #748287;
    font-size: 10px;
    line-height: 1.5;
    margin: 12px 0 0;
  }
  .checkbox-control {
    display: flex;
    align-items: center;
    gap: 7px;
    font-size: 11px;
    color: #b5bec3;
  }
  .checkbox-control input {
    accent-color: #d1a35c;
  }
  .reset-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 5px;
    padding: 12px;
  }
  .reset-row button {
    border: 1px solid #41494d;
    padding: 6px 9px;
    border-radius: 4px;
    font-size: 10px;
  }
  .reset-row span {
    color: #78858b;
    font-size: 9px;
  }
  .inspector-rail {
    width: 40px;
    background: #222729;
    padding: 12px 4px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    flex-shrink: 0;
  }
  .inspector-rail button {
    height: 34px;
    display: grid;
    place-items: center;
    padding: 0;
    border-radius: 8px;
    color: #75858d;
  }
  .inspector-rail .rail-active {
    background: #493006;
    border: 1px solid #956000;
    color: #ffb516;
  }
  .timeline {
    position: relative;
    border-top: 2px solid #996229;
    background: #101213;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }
  .timeline-heading {
    padding: 9px 14px;
    display: flex;
    justify-content: space-between;
    color: #949ea2;
    font-size: 10px;
    border-bottom: 1px solid #23292c;
  }
  .timeline-heading span:last-child {
    color: #626f75;
  }
  .ruler {
    display: flex;
    justify-content: space-between;
    position: relative;
    padding: 12px 12px 18px 44px;
    font:
      10px 'Courier New',
      monospace;
    color: #87949a;
  }
  .ruler::after {
    content: '';
    position: absolute;
    bottom: 6px;
    left: 44px;
    right: 12px;
    height: 5px;
    background: repeating-linear-gradient(to right, #555f64 0 1px, transparent 1px 8px);
  }
  .tracks {
    position: relative;
    margin-top: 18px;
    padding: 0 14px 0 8px;
  }
  .track {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 5px;
  }
  .track-label {
    width: 26px;
    color: #6c7a84;
    font: 10px monospace;
    flex-shrink: 0;
  }
  .timeline-clip {
    width: 100%;
    border: 1px solid #05080c;
    border-radius: 8px;
    overflow: hidden;
    padding: 0 0 10px;
    background: #202d55;
    text-align: left;
    height: 83px;
  }
  .timeline-clip.selected {
    outline: 2px solid #ffab19;
    outline-offset: -2px;
  }
  .timeline-clip:hover {
    background: #283765 !important;
  }
  .clip-title {
    display: flex;
    justify-content: space-between;
    padding: 5px 6px;
    font-size: 12px;
    color: #90a6ff;
  }
  .clip-title small {
    color: #a1a9c4;
    font-size: 10px;
  }
  .filmstrip {
    display: block;
    margin: 0 5px;
    height: 41px;
    background-repeat: repeat-x;
    background-size: auto 41px;
  }
  .playhead {
    position: absolute;
    left: 44px;
    top: -25px;
    bottom: -25px;
    width: 1px;
    background: #ecedee;
    z-index: 1;
    pointer-events: none;
  }
  .playhead::before {
    content: '';
    position: absolute;
    top: -9px;
    left: -5px;
    width: 11px;
    height: 14px;
    background: #ecedee;
    clip-path: polygon(0 0, 100% 0, 100% 60%, 50% 100%, 0 60%);
  }
  .timeline-tools {
    margin: auto auto 24px;
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px;
    border: 1px solid #4a555a;
    border-radius: 13px;
    background: #272d30;
    box-shadow: 0 6px 16px #0006;
  }
  .timeline-tools button {
    width: 34px;
    height: 34px;
    border-radius: 8px;
    display: grid;
    place-items: center;
    font-size: 22px;
  }
  .timeline-tools span {
    width: 1px;
    height: 18px;
    background: #485258;
    margin: 0 4px;
  }
  .timeline-tools .tool-active {
    background: #68747b;
    color: #fff;
  }
  @media (min-width: 1600px) {
    .workspace {
      grid-template-columns: 260px minmax(0, 1fr);
    }
    .edit-area {
      grid-template-columns: 360px minmax(200px, 1fr) 350px;
    }
    .project-name {
      font-size: 18px;
    }
  }
  @media (max-width: 1250px) {
    .workspace {
      grid-template-columns: 180px minmax(0, 1fr);
    }
    .workspace-name {
      font-size: 12px;
      gap: 8px;
    }
    .edit-area {
      grid-template-columns: 210px minmax(200px, 1fr) 280px;
    }
    .project-subtitle {
      display: none;
    }
    .panel-tabs {
      gap: 6px;
    }
    .panel-tabs button {
      font-size: 9px;
    }
    .properties {
      grid-template-columns: 16px 1fr;
    }
    .properties span:nth-child(odd) {
      margin-top: 3px;
    }
  }
  @media (max-width: 1020px) {
    .workspace {
      grid-template-columns: minmax(0, 1fr);
    }
    .sidebar {
      display: none;
    }
    .edit-area {
      grid-template-columns: 190px minmax(200px, 1fr) 280px;
    }
    .project-header nav button {
      padding: 5px 7px;
      font-size: 12px;
    }
  }
  @media (max-width: 760px) {
    .workspace {
      height: auto;
      min-height: 100dvh;
      padding: 5px;
    }
    .project {
      display: flex;
      flex-direction: column;
    }
    .project-header {
      height: 48px;
      padding: 0 9px;
    }
    .project-header nav button:not(.active),
    .share {
      display: none;
    }
    .project-name {
      font-size: 13px;
    }
    .edit-area {
      display: flex;
      flex-direction: column;
    }
    .viewer {
      height: 310px;
      border-right: 0;
    }
    .picture {
      padding: 12px;
    }
    .media-panel {
      display: block;
      order: 3;
      border-right: 0;
      border-top: 1px solid #303537;
    }
    .media-grid,
    .media-path,
    .panel-tabs {
      display: none;
    }
    .replace-media {
      padding: 14px 0;
    }
    .replace-media h3,
    .replace-media p {
      margin-bottom: 8px;
    }
    .file-button {
      display: inline-block;
      margin-right: 6px;
    }
    .inspector-content {
      overflow: visible;
    }
    .inspector-rail {
      padding-top: 14px;
    }
    .timeline {
      min-height: 330px;
    }
    .timeline-heading {
      gap: 10px;
    }
    .timeline-heading span:last-child {
      max-width: 200px;
      text-align: right;
    }
    .timeline-tools {
      margin: 25px auto 18px;
    }
    .ruler span:nth-child(even) {
      display: none;
    }
    .clip-title {
      font-size: 10px;
    }
  }
</style>
