/* Fake project data for the WhySlow demo.
   Titles, explanations and button labels are the real ones from Editor/Core/Strings.cs.
   The numbers describe an imaginary project called Sample Project. */

window.WS_DATA = (function () {
  "use strict";

  var DOCS = "https://docs.unity3d.com/2022.3/Documentation/Manual/";

  /* ---------------- Checkup → Scene ---------------- */

  var SCENE_ISSUES = [
    {
      id: "shadow-lights",
      severity: "crit",
      title: "4 realtime lights cast shadows",
      why: "Every shadowed light makes the scene render extra work.",
      passedTitle: "Realtime shadow lights are under control",
      fix: "Fix: make 3 static lights Mixed",
      safe: true,
      targets: 4,
      scene: true,
      learnMore:
        "Realtime shadow maps render the scene again from each light; a Point Light can require six shadow-map faces.\n\n1. Keep Realtime only for lights that move or change.\n2. Switch stationary lights to Mixed and bake the rest.\n3. Reduce Shadow Distance so fewer casters stay active.\n4. Compare shadow-casting draw calls in the Frame Debugger before and after.",
      docs: DOCS + "shadow-overview.html"
    },
    {
      id: "realtime-gi",
      severity: "crit",
      title: "Realtime Global Illumination is enabled",
      why: "Realtime lighting updates can add significant CPU and GPU work.",
      passedTitle: "Realtime Global Illumination is disabled",
      fix: "Fix: disable Realtime GI",
      safe: true,
      targets: 0,
      learnMore:
        "Realtime GI updates indirect lighting while the game runs, which adds runtime CPU/GPU work and precomputed data.\n\n1. Confirm whether indirect light truly changes during gameplay.\n2. If it does not, disable Realtime GI and enable Baked Global Illumination in the scene's Lighting Settings Asset.\n3. Mark static geometry Contribute Global Illumination and add Light Probes for moving objects.\n4. Generate lighting and inspect the Baked Lightmaps view before profiling the Player again.",
      docs: DOCS + "LightingInUnity.html"
    },
    {
      id: "shadow-distance",
      severity: "crit",
      profiles: ["Mobile"],
      title: "Shadow distance is 150 meters",
      why: "Long-distance shadows are expensive for the selected performance profile.",
      passedTitle: "Shadow distance is reasonable for the current target",
      fix: "Fix: set shadow distance to 50",
      safe: true,
      targets: 0,
      learnMore:
        "Unity renders realtime shadows only inside Shadow Distance, so a large value keeps more casters and shadow-map work active.\n\n1. Find the farthest distance where players can still notice useful shadows.\n2. Lower Shadow Distance in Quality Settings, the URP Asset, or the active HDRP Volume.\n3. Use fog, baked shadows or Shadowmask beyond that range when appropriate.\n4. Walk through the scene on the target device and verify both visual transitions and GPU frame time.",
      docs: DOCS + "shadow-distance.html"
    },
    {
      id: "webgl-compression",
      severity: "crit",
      profiles: ["WebGL"],
      title: "WebGL build compression is not Brotli",
      why: "Uncompressed web builds download slower and cost more bandwidth.",
      passedTitle: "WebGL build compression uses Brotli",
      fix: "Use Brotli",
      safe: true,
      targets: 0,
      learnMore:
        "Brotli produces the smallest web payload of the formats Unity offers, and every modern browser accepts it over HTTPS.\n\n1. Set Compression Format to Brotli in Player Settings > Publishing Settings.\n2. Configure the web server to serve the .br files with Content-Encoding: br.\n3. Measure the transferred size in the browser's network panel, not the size on disk.",
      docs: DOCS + "webgl-deploying.html"
    },
    {
      id: "missing-scripts",
      severity: "crit",
      title: "7 objects have missing scripts",
      why: "Missing components can hide broken behaviour and produce confusing errors.",
      passedTitle: "No missing scripts were found",
      fix: "Fix: remove missing components",
      safe: false,
      targets: 7,
      scene: true,
      learnMore:
        "A missing script means Unity kept the component's serialized data but can no longer resolve its MonoBehaviour type. Removing it immediately can discard settings that help you recover the component.\n\n1. Inspect the object, prefab source, version control history and recently changed packages or assembly definitions to identify the missing type.\n2. Restore the script or its assembly reference when the behaviour is still required.\n3. Remove the missing component only after confirming that its data is obsolete.\n4. Enter Play Mode and validate prefab overrides and the feature that used the component.\n\nWhySlow's Fix removes only the currently reported missing components and supports Undo.",
      docs: "https://docs.unity3d.com/2022.3/Documentation/ScriptReference/GameObjectUtility.RemoveMonoBehavioursWithMissingScript.html"
    },
    {
      id: "srp-batcher",
      severity: "warn",
      title: "SRP Batcher is disabled",
      why: "The renderer repeats more CPU setup work for materials.",
      passedTitle: "SRP Batcher is enabled",
      fix: "Fix: enable SRP Batcher",
      safe: true,
      targets: 0,
      learnMore:
        "The SRP Batcher keeps compatible material data in GPU buffers, reducing repeated CPU setup between draw calls that use the same shader variant.\n\n1. Enable SRP Batcher on the active URP or HDRP Render Pipeline Asset.\n2. Select important shaders and verify that the Inspector reports SRP Batcher compatibility.\n3. Avoid changing material instances unnecessarily at runtime.\n4. Compare CPU render-thread time and SRP Batcher batches in the Frame Debugger before and after.",
      docs: DOCS + "SRPBatcher.html"
    },
    {
      id: "unique-materials",
      severity: "warn",
      title: "Scene renderers use 148 unique materials",
      why: "Many unique materials increase rendering setup work and reduce batching.",
      passedTitle: "The number of unique materials is reasonable",
      fix: null,
      safe: false,
      targets: 148,
      scene: true,
      learnMore:
        "Renderers that use different Material assets usually cannot share the same batch, even when those materials look identical.\n\n1. Group materials by shader, textures and property values; reuse one shared asset where the result is identical.\n2. Atlas compatible textures when many materials differ only by texture.\n3. In scripts, avoid Renderer.material when you only need the shared asset because it creates an instance; use sharedMaterial deliberately.\n4. Recheck batches and SetPass calls with the Frame Debugger.",
      docs: DOCS + "DrawCallBatching.html"
    },
    {
      id: "raycast-spam",
      severity: "warn",
      title: "63 non-interactive UI graphics block raycasts",
      why: "The event system checks these graphics even though they cannot be clicked.",
      passedTitle: "UI raycasts are limited to interactive controls",
      fix: "Fix: disable unnecessary raycasts",
      safe: true,
      targets: 63,
      scene: true,
      learnMore:
        "A Graphic Raycaster tests eligible UI Graphics when it processes pointer input. Decorative Images and labels with Raycast Target enabled enlarge that search for no interaction benefit.\n\n1. Disable Raycast Target on decorative Images, Raw Images and text that cannot receive clicks or block input intentionally.\n2. Use Canvas Group Blocks Raycasts to disable whole inactive UI sections when appropriate.\n3. Remove Graphic Raycasters from Canvases that never receive pointer input.\n4. Test buttons, drag areas, tooltips and modal blocking after the change.\n\nWhySlow's Fix changes only reported non-interactive Graphics and supports Undo.",
      docs: DOCS + "script-GraphicRaycaster.html"
    },
    {
      id: "reflection-probes",
      severity: "warn",
      title: "2 reflection probes refresh every frame",
      why: "A realtime probe renders the scene repeatedly to update reflections.",
      passedTitle: "Reflection probes do not refresh every frame",
      fix: "Fix: refresh On Awake",
      safe: true,
      targets: 2,
      scene: true,
      learnMore:
        "A realtime Reflection Probe renders a cubemap: six views of its surroundings. Every Frame refresh can therefore be one of the most expensive scene settings.\n\n1. Use Baked for reflections that never change.\n2. Use On Awake when one runtime capture is sufficient.\n3. Use Via Scripting for controlled updates after a known visual change.\n4. If frequent updates are unavoidable, enable time slicing, lower resolution and restrict the culling mask; then profile the update frames.",
      docs: DOCS + "class-ReflectionProbe.html"
    },
    {
      id: "animator-culling",
      severity: "warn",
      title: "18 Animators and 12 skinned meshes keep animating off screen",
      why: "An Animator set to Always Animate keeps sampling curves and writing transforms for a character nobody can see.",
      passedTitle: "Animation stops for things that are not visible",
      fix: "Fix: cull animation when not visible",
      safe: true,
      targets: 18,
      scene: true,
      learnMore:
        "Culling lets Unity skip animation work for characters outside the view.\n\n1. Set the Animator's Culling Mode to Based On Renderers so it stops when the renderers are not visible.\n2. Set Skinned Mesh Renderers to Update When Offscreen only where the bounds are genuinely wrong.\n3. Keep Always Animate for objects whose animation drives gameplay while off screen.\n4. Check the Animation profiler markers with the camera looking away.",
      docs: "https://docs.unity3d.com/2022.3/Documentation/ScriptReference/Animator-cullingMode.html"
    },
    {
      id: "mobile-shadow-res",
      severity: "warn",
      profiles: ["Mobile"],
      title: "Mobile shadow resolution is Very High",
      why: "Very high shadow maps consume memory and GPU bandwidth on mobile devices.",
      passedTitle: "Shadow resolution is reasonable for the current target",
      fix: "Fix: lower the shadow map resolution",
      safe: true,
      targets: 0,
      learnMore:
        "Larger shadow maps consume more render-target memory and bandwidth, and they require more shadow texels to be rendered. Very High is rarely a safe default across mobile devices.\n\n1. Use Medium as a baseline for the mobile Quality level.\n2. Tune per-light resolution, atlas size, cascades and Shadow Distance in the active render pipeline instead of raising the global setting first.\n3. Reserve higher resolution for the main light or shots where the difference is visible.\n4. Compare shadow quality, GPU time and memory on low- and mid-tier target devices.\n\nWhySlow's Fix sets the current Quality level to Medium and supports Undo.",
      docs: DOCS + "shadow-mapping.html"
    },
    {
      id: "layout-groups",
      severity: "warn",
      title: "9 nested Layout Groups (of 24 in this scene)",
      why: "A Layout Group recalculates its children whenever anything inside it changes, and a group inside another group makes that work happen more than once.",
      passedTitle: "No costly Layout Group nesting found",
      fix: null,
      safe: false,
      targets: 9,
      scene: true,
      learnMore:
        "Layout Groups are convenient for authoring but they rebuild positions at runtime, and nesting them multiplies the rebuild.\n\n1. For layouts that never move after they are built, bake the positions and remove the group.\n2. Flatten nesting so one group does the work instead of three.\n3. Keep frequently rebuilt lists on their own Canvas.\n4. Watch Canvas.SendWillRenderCanvases and the Layout markers in the Profiler on the busiest screen.",
      docs: DOCS + "UIAutoLayout.html"
    },
    {
      id: "reuse-collision",
      severity: "warn",
      title: "Every collision callback allocates a Collision object",
      why: "Without reuse, each OnCollisionEnter, Stay and Exit call hands your script a freshly allocated Collision object that the collector later has to clean up.",
      passedTitle: "Collision callbacks reuse one instance",
      fix: "Fix: reuse collision callbacks",
      safe: false,
      targets: 0,
      learnMore:
        "With Reuse Collision Callbacks on, Unity passes a single Collision instance per callback instead of allocating a new one for every call.\n\n1. Enable Reuse Collision Callbacks in Physics settings.\n2. Check code that stores a Collision and reads it after the callback returns — with reuse on, that instance is only valid during the call and its contents are overwritten afterwards.\n3. Copy the values you need out of the Collision inside the callback rather than keeping the object.\n\nWhySlow's Fix supports Undo, and is deliberately left out of Fix All because of the behaviour change above.",
      docs: "https://docs.unity3d.com/2022.3/Documentation/ScriptReference/Physics-reuseCollisionCallbacks.html"
    },
    {
      id: "prebake-collision",
      severity: "warn",
      title: "Collision meshes are cooked at load time (34 MeshColliders in this scene)",
      why: "A mesh used for physics has to be prepared before it can answer queries, and without prebaking that happens while the player waits for the scene.",
      passedTitle: "Collision mesh cooking is handled at build time",
      fix: "Fix: prebake collision meshes",
      safe: true,
      targets: 34,
      scene: true,
      learnMore:
        "Physics cannot raycast or collide against a mesh until it has been cooked into the form the engine queries. Prebake Collision Meshes moves that work into the build.\n\n1. Enable Prebake Collision Meshes in Player Settings.\n2. Expect a slightly longer build and slightly larger build size in exchange for shorter scene load times.\n3. Meshes generated at runtime still cook at runtime; Physics.BakeMesh is the tool for those.\n\nWhySlow's Fix enables the setting and supports Undo.",
      docs: "https://docs.unity3d.com/2022.3/Documentation/ScriptReference/PlayerSettings-bakeCollisionMeshes.html"
    },
    {
      id: "far-plane",
      severity: "warn",
      title: "3 cameras see farther than 5,000 units",
      why: "Very distant rendering reduces depth precision and can draw objects the player never needs to see.",
      passedTitle: "Camera far clipping distances are reasonable",
      fix: "Fix: set far plane to 1,000",
      safe: true,
      targets: 3,
      scene: true,
      learnMore:
        "A very distant Far Clipping Plane enlarges the visible volume and reduces depth-buffer precision, which can increase rendering and cause z-fighting.\n\n1. Set Far to the maximum distance the player actually needs to see.\n2. Use fog, LODs and distance culling to hide the transition.\n3. Keep Shadow Distance no larger than the useful camera range.\n4. Test the full camera route for missing distant objects and compare visible-renderer counts in the Profiler.",
      docs: DOCS + "class-Camera.html"
    },
    {
      id: "physics-sim",
      severity: "warn",
      title: "Physics simulation runs with no physics in the scene",
      why: "An automatic physics step and transform auto-sync both cost time every frame, even with nothing for them to simulate.",
      passedTitle: "Physics simulation settings match how this scene uses physics",
      fix: "Fix: set Simulation Mode to Script",
      safe: true,
      targets: 0,
      learnMore:
        "The open scene has no Rigidbody and no Collider, yet Physics still runs an automatic simulation step, transform auto-sync, or both.\n\n1. Set Simulation Mode to Script for scenes that never need physics, such as menus and cutscenes.\n2. Turn Auto Sync Transforms off unless a script reads collider positions right after moving a Transform.\n3. Restore the setting for gameplay scenes that do simulate.",
      docs: "https://docs.unity3d.com/2022.3/Documentation/ScriptReference/Physics-simulationMode.html"
    },
    {
      id: "webgl-memory",
      severity: "warn",
      profiles: ["WebGL"],
      title: "WebGL initial memory is 768 MB",
      why: "A large initial heap can fail to allocate on tabs and devices with less memory available.",
      passedTitle: "WebGL initial memory is within 512 MB",
      fix: null,
      safe: false,
      targets: 0,
      learnMore:
        "The initial memory size is reserved on load, so a browser that cannot hand out that block fails the whole game rather than degrading.\n\n1. Measure the real peak with the memory profiler on a representative session.\n2. Lower Initial Memory Size in Player Settings and allow the heap to grow.\n3. Reduce what is loaded at once with Addressables and scene unloading.",
      docs: DOCS + "webgl-memory.html"
    }
  ];

  var PASSED_ISSUES = [
    "Only one active camera renders to the screen",
    "The number of realtime lights is reasonable",
    "Static scene lighting is not missing lightmaps",
    "The scene does not need an occlusion warning",
    "Moving objects use supported collider shapes",
    "Large moving meshes use LODs or static rendering",
    "Particle limits are reasonable",
    "The number of active audio sources is reasonable",
    "Terrain detail settings are reasonable",
    "UI canvases are not unusually large",
    "Camera-space canvases have a camera",
    "Release stack trace settings are reasonable",
    "Player build compression uses LZ4 or LZ4HC",
    "No unusually deep or wide hierarchy found",
    "Accelerometer frequency is reasonable for this project"
  ];

  /* ---------------- Checkup → Code ---------------- */

  var CODE_FINDINGS = [
    {
      severity: "crit",
      pattern: "String creation per frame",
      file: "Assets/Scripts/UI/HudPresenter.cs",
      line: 74,
      method: "Update",
      source: 'scoreLabel.text = "Score: " + _score.ToString("N0");',
      advice:
        "Avoid string concatenation or formatting in per-frame code. Reuse a StringBuilder or a non-allocating text API.",
      confidence: null
    },
    {
      severity: "crit",
      pattern: "LINQ per frame",
      file: "Assets/Scripts/AI/EnemyDirector.cs",
      line: 118,
      method: "LateUpdate",
      source: "var closest = _enemies.Where(e => e.Alive).OrderBy(e => e.Distance).FirstOrDefault();",
      advice: "Replace per-frame LINQ with a loop and reuse the destination collection.",
      confidence: null
    },
    {
      severity: "warn",
      pattern: "Repeated GetComponent",
      file: "Assets/Scripts/Player/PlayerController.cs",
      line: 52,
      method: "Update",
      source: "GetComponent<Rigidbody>().AddForce(_move * speed);",
      advice: "Cache the component reference in Awake or Start.",
      confidence: null
    },
    {
      severity: "warn",
      pattern: "Tag compared as a string",
      file: "Assets/Scripts/Gameplay/Pickup.cs",
      line: 29,
      method: "OnTriggerEnter",
      source: 'if (other.gameObject.tag == "Player")',
      advice:
        "Reading .tag allocates a new string every time. CompareTag does the same check without allocating.",
      confidence: null
    },
    {
      severity: "warn",
      pattern: "Renderer.material clones the material",
      file: "Assets/Scripts/Fx/Blinker.cs",
      line: 41,
      method: "Blink",
      source: "_renderer.material.color = Color.red;",
      advice:
        "Reading .material makes this renderer a private copy of the material, which allocates and stops it batching with everything that shares the original.",
      confidence: null
    },
    {
      severity: "warn",
      pattern: "String-keyed Animator/Material lookup",
      file: "Assets/Scripts/Player/PlayerAnimation.cs",
      line: 63,
      method: "Update",
      source: '_animator.SetFloat("Speed", _velocity.magnitude);',
      advice:
        "Unity hashes the string internally on every call. Cache Animator.StringToHash or Shader.PropertyToID once and reuse the integer.",
      confidence: null
    },
    {
      severity: "warn",
      pattern: "Allocating physics query",
      file: "Assets/Scripts/Weapons/Shotgun.cs",
      line: 88,
      method: "Fire",
      source: "var hits = Physics.SphereCastAll(origin, radius, dir, range);",
      advice: "Use a NonAlloc physics query with a reused result buffer.",
      confidence: "Guarded"
    },
    {
      severity: "warn",
      pattern: "New WaitForSeconds",
      file: "Assets/Scripts/Spawning/WaveSpawner.cs",
      line: 57,
      method: "SpawnLoop",
      source: "yield return new WaitForSeconds(0.25f);",
      advice: "Cache reusable WaitForSeconds instances when the duration does not change.",
      confidence: null
    },
    {
      severity: "warn",
      pattern: "Empty Update/LateUpdate/FixedUpdate",
      file: "Assets/Scripts/Debug/DebugHooks.cs",
      line: 12,
      method: "Update",
      source: "void Update() { }",
      advice:
        "Even an empty MonoBehaviour method costs Unity a call every frame. Remove it, or wrap test-only code in #if UNITY_EDITOR.",
      confidence: null
    },
    {
      severity: "warn",
      pattern: "Logging during gameplay",
      file: "Assets/Scripts/AI/EnemyDirector.cs",
      line: 141,
      method: "Update",
      source: 'Debug.Log("director tick " + Time.frameCount);',
      advice: "Remove per-frame logs or compile them only for development builds.",
      confidence: null
    },
    {
      severity: "warn",
      pattern: "Repeated Camera.main lookup",
      file: "Assets/Scripts/UI/WorldLabel.cs",
      line: 34,
      method: "LateUpdate",
      source: "transform.forward = Camera.main.transform.forward;",
      advice: "Cache Camera.main instead of looking it up every frame.",
      confidence: null
    },
    {
      severity: "warn",
      pattern: "Instantiate / Destroy churn",
      file: "Assets/Scripts/Fx/ImpactPool.cs",
      line: 26,
      method: "Spawn",
      source: "Destroy(Instantiate(impactPrefab, point, rotation), 1.5f);",
      advice: "Reuse objects with a pool instead of creating and destroying them repeatedly.",
      confidence: null
    }
  ];

  /* ---------------- Build X-Ray ---------------- */

  var BUILD = {
    platform: "Android",
    date: "24 Aug 2026, 14:12",
    totalBytes: 412 * 1024 * 1024,
    output: "Builds/Android/SampleProject.aab",
    delta: "+18.4 MB",
    groups: [
      { name: "Textures", bytes: 214 * 1024 * 1024, color: "#efa93c", count: 1284 },
      { name: "Audio",    bytes: 61 * 1024 * 1024,  color: "#5fd8cd", count: 212 },
      { name: "Meshes",   bytes: 48 * 1024 * 1024,  color: "#7fb069", count: 396 },
      {
        name: "Code", bytes: 38 * 1024 * 1024, color: "#8a939b", count: 1,
        rows: [
          "libil2cpp.so (arm64-v8a)  —  21.4 MB",
          "libil2cpp.so (armeabi-v7a)  —  14.8 MB",
          "Managed assemblies, stripped  —  1.8 MB"
        ]
      },
      {
        name: "Shaders", bytes: 26 * 1024 * 1024, color: "#d9614e", count: 74,
        rows: [
          "Universal Render Pipeline/Lit  —  9.1 MB (612 variants)",
          "Universal Render Pipeline/Particles/Unlit  —  4.4 MB (288 variants)",
          "Shader Graph/WaterSurface  —  3.2 MB (196 variants)",
          "TextMeshPro/Distance Field  —  1.9 MB (104 variants)"
        ]
      },
      { name: "Fonts",    bytes: 12 * 1024 * 1024,  color: "#3e8f89", count: 9 },
      {
        name: "Other", bytes: 13 * 1024 * 1024, color: "#5b666e", count: 331,
        rows: [
          "Assets/Scenes/Level_01.unity  —  3.6 MB",
          "Assets/Data/Localization.asset  —  2.1 MB",
          "Assets/Scenes/MainMenu.unity  —  1.4 MB",
          "Resources/UI/Prefabs  —  1.2 MB"
        ]
      }
    ],
    assets: [
      { path: "Assets/Art/Environment/Terrain_Albedo.png", type: "Texture2D", bytes: 24.8 * 1024 * 1024, fix: "texture", saving: "18.6 MB" },
      { path: "Assets/Audio/Music/MainTheme.wav",           type: "AudioClip", bytes: 21.3 * 1024 * 1024, fix: "audio",   saving: "19.1 MB" },
      { path: "Assets/Art/Characters/Hero_BaseColor.png",   type: "Texture2D", bytes: 16.0 * 1024 * 1024, fix: "texture", saving: "12.0 MB" },
      { path: "Assets/Art/Environment/Cliff_Normal.png",    type: "Texture2D", bytes: 16.0 * 1024 * 1024, fix: "texture", saving: "12.0 MB" },
      { path: "Assets/Audio/Ambience/Forest_Loop.wav",      type: "AudioClip", bytes: 14.7 * 1024 * 1024, fix: "audio",   saving: "13.2 MB" },
      { path: "Assets/Art/UI/Atlas_MainMenu.png",           type: "Texture2D", bytes: 12.0 * 1024 * 1024, fix: "texture", saving: "9.0 MB" },
      { path: "Assets/Models/Environment/CityBlock.fbx",    type: "Mesh",      bytes: 9.4 * 1024 * 1024,  fix: "mesh",    saving: "4.1 MB" },
      { path: "Assets/Art/Characters/Hero_Normal.png",      type: "Texture2D", bytes: 8.0 * 1024 * 1024,  fix: "texture", saving: "6.0 MB" },
      { path: "Assets/Audio/Voice/Intro_Narration.wav",     type: "AudioClip", bytes: 7.8 * 1024 * 1024,  fix: "audio",   saving: "7.0 MB" },
      { path: "Assets/Models/Characters/Hero.fbx",          type: "Mesh",      bytes: 6.6 * 1024 * 1024,  fix: "mesh",    saving: "2.4 MB" },
      { path: "Assets/Art/Environment/Rock_Albedo.png",     type: "Texture2D", bytes: 6.0 * 1024 * 1024,  fix: "texture", saving: "4.5 MB" },
      { path: "Assets/Fonts/Display-Bold SDF.asset",        type: "TMP_FontAsset", bytes: 5.2 * 1024 * 1024, fix: null,  saving: null },
      { path: "Assets/Art/VFX/Smoke_Sheet.png",             type: "Texture2D", bytes: 4.0 * 1024 * 1024,  fix: "texture", saving: "3.0 MB" },
      { path: "Assets/Models/Props/Barrel.fbx",             type: "Mesh",      bytes: 3.1 * 1024 * 1024,  fix: "mesh",    saving: "1.2 MB" },
      { path: "Assets/Audio/Sfx/Explosion_Big.wav",         type: "AudioClip", bytes: 2.9 * 1024 * 1024,  fix: "audio",   saving: "2.5 MB" }
    ]
  };

  var BUILD_DIFF = {
    before: "Android · 12 Aug 2026 · 394 MB",
    after: "Android · 24 Aug 2026 · 412 MB",
    summary: "Build grew by 18.4 MB. Top cause: Assets/Art/Environment/Terrain_Albedo.png (+11.2 MB).",
    grown: [
      { path: "Assets/Art/Environment/Terrain_Albedo.png", row: "13.6 MB → 24.8 MB · Δ +11.2 MB · 61% of total Δ" },
      { path: "Assets/Audio/Ambience/Forest_Loop.wav", row: "11.9 MB → 14.7 MB · Δ +2.8 MB · 15% of total Δ" }
    ],
    added: [
      { path: "Assets/Art/VFX/Smoke_Sheet.png", row: "New · 4.0 MB · 22% of total Δ" },
      { path: "Assets/Models/Props/Barrel.fbx", row: "New · 3.1 MB · 17% of total Δ" }
    ],
    shrunk: [
      { path: "Assets/Art/UI/Atlas_MainMenu.png", row: "14.2 MB → 12.0 MB · Δ −2.2 MB · 12% of total Δ" }
    ],
    removed: [{ path: "Assets/Art/UI/Atlas_Old.png", row: "Removed · was 1.5 MB · 8% of total Δ" }]
  };

  /* ---------------- Project Assets ---------------- */

  var DEAD_ASSETS = [
    {
      folder: "Assets/Art/Prototype",
      summary: "Nothing in this folder is used (38 files)",
      files: [
        "Blockout_Wall.fbx", "Blockout_Floor.fbx", "Gray_Checker.png",
        "Proto_Skybox.mat", "Proto_Light.prefab"
      ],
      more: 33
    },
    {
      folder: "Assets/Audio/Old_Music",
      summary: "12 of 14 files here are unused (2 still in use)",
      files: ["Theme_v1.wav", "Theme_v2.wav", "Menu_draft.wav", "Boss_scrapped.wav"],
      more: 8
    },
    {
      folder: "Assets/Art/UI/Unused_Icons",
      summary: "21 of 24 files here are unused (3 still in use)",
      files: ["icon_shop_old.png", "icon_quest_old.png", "icon_map_v2.png"],
      more: 18
    }
  ];

  var DUPLICATE_FILES = [
    {
      title: "3 identical files · 4.0 MB each",
      files: [
        "Assets/Art/Characters/Hero_Normal.png",
        "Assets/Art/Characters/Backup/Hero_Normal.png",
        "Assets/Art/Shared/Hero_Normal.png"
      ]
    },
    {
      title: "2 identical files · 1.2 MB each",
      files: ["Assets/Audio/Sfx/Click.wav", "Assets/Audio/UI/Click.wav"]
    }
  ];

  var DUPLICATE_MATERIALS = [
    {
      title: "4 equivalent materials",
      files: [
        "Assets/Art/Materials/Rock_01.mat",
        "Assets/Art/Materials/Rock_02.mat",
        "Assets/Art/Materials/Rock_03.mat",
        "Assets/Art/Materials/Rock_copy.mat"
      ]
    }
  ];

  var IMPORT_GROUPS = [
    {
      id: "mesh-rw",
      title: "Meshes keeping a second copy in memory",
      description:
        "Read/Write Enabled keeps a copy of the mesh in CPU memory next to the one on the GPU, doubling what it costs. It exists only so scripts can read the geometry.",
      fixAll: true,
      items: [
        { path: "Assets/Models/Environment/CityBlock.fbx", reason: "Read/Write is on, and nothing in this project reads mesh data at runtime." },
        { path: "Assets/Models/Characters/Hero.fbx", reason: "Read/Write is on, and nothing in this project reads mesh data at runtime." },
        { path: "Assets/Models/Props/Barrel.fbx", reason: "Read/Write is on, and nothing in this project reads mesh data at runtime." }
      ]
    },
    {
      id: "humanoid",
      title: "Humanoid rigs that are not being retargeted",
      description:
        "A Humanoid rig runs inverse kinematics and retargeting every frame whether anything uses them or not — Unity puts that at 30-50% more CPU than the same rig imported as Generic. Only models whose avatar comes from themselves are listed.",
      fixAll: false,
      blocked:
        "Switching a rig to Generic stops Humanoid muscle clips and IK from working, so this is a change to make per model with its animations in front of you, not in bulk.",
      items: [
        { path: "Assets/Models/Characters/Hero.fbx", reason: "Imported as Humanoid with its own avatar, so nothing here is being retargeted." },
        { path: "Assets/Models/Characters/Merchant.fbx", reason: "Imported as Humanoid with its own avatar, so nothing here is being retargeted." }
      ]
    },
    {
      id: "texture-import",
      title: "Textures spending memory on nothing",
      description:
        "Mipmaps generated for a texture always drawn at one size, and Read/Write keeping a second CPU copy. Textures on 3D surfaces are left alone — varying distance is exactly what mipmaps are for.",
      fixAll: true,
      items: [
        { path: "Assets/Art/UI/Atlas_MainMenu.png", reason: "Mipmaps are on for a Sprite (2D and UI) texture, which is drawn at a fixed size." },
        { path: "Assets/Art/UI/icon_settings.png", reason: "Mipmaps are on for a Sprite (2D and UI) texture, which is drawn at a fixed size." },
        { path: "Assets/Art/VFX/Smoke_Sheet.png", reason: "Read/Write is on, and nothing in this project reads texture pixels at runtime." }
      ]
    },
    {
      id: "scale-curves",
      title: "Animation clips that animate scale",
      description:
        "Scale curves cost more to evaluate than position and rotation. Constant scale curves are not listed — Unity already optimizes those.",
      fixAll: false,
      blocked:
        "Removing a scale curve changes how the animation looks, so this is reported for you to judge rather than fixed.",
      items: [
        { path: "Assets/Animations/Hero_Idle.anim", reason: "6 scale curves whose value actually changes over the clip." },
        { path: "Assets/Animations/Chest_Open.anim", reason: "3 scale curves whose value actually changes over the clip." }
      ]
    }
  ];

  /* ---------------- Performance Hunter ---------------- */

  var HUNT_OFFENDERS = [
    {
      site: "HudPresenter.Update()",
      file: "Assets/Scripts/UI/HudPresenter.cs",
      line: 74,
      pattern: "String creation per frame",
      advice:
        "Avoid string concatenation or formatting in per-frame code. Reuse a StringBuilder or a non-allocating text API.",
      behaviour: "Every frame",
      bytesPerFrame: 2144,
      share: 47,
      frames: 98,
      calls: 3,
      stack:
        "HudPresenter.Update()\n  System.String.Concat(String, String)\n  System.Number.FormatInt32(Int32, String)"
    },
    {
      site: "EnemyDirector.LateUpdate()",
      file: "Assets/Scripts/AI/EnemyDirector.cs",
      line: 118,
      pattern: "LINQ per frame",
      advice: "Replace per-frame LINQ with a loop and reuse the destination collection.",
      behaviour: "Every frame",
      bytesPerFrame: 1216,
      share: 27,
      frames: 96,
      calls: 1,
      stack:
        "EnemyDirector.LateUpdate()\n  System.Linq.Enumerable.Where(IEnumerable, Func)\n  System.Linq.Enumerable.OrderBy(IEnumerable, Func)"
    },
    {
      site: "WaveSpawner.SpawnLoop()",
      file: "Assets/Scripts/Spawning/WaveSpawner.cs",
      line: 57,
      pattern: "New WaitForSeconds",
      advice: "Cache reusable WaitForSeconds instances when the duration does not change.",
      behaviour: "Spikes",
      bytesPerFrame: 640,
      share: 14,
      frames: 22,
      calls: 4,
      stack: "WaveSpawner.SpawnLoop()\n  UnityEngine.WaitForSeconds..ctor(Single)"
    },
    {
      site: "Shotgun.Fire()",
      file: "Assets/Scripts/Weapons/Shotgun.cs",
      line: 88,
      pattern: "Allocating physics query",
      advice: "Use a NonAlloc physics query with a reused result buffer.",
      behaviour: "Occasional",
      bytesPerFrame: 384,
      share: 8,
      frames: 9,
      calls: 1,
      stack: "Shotgun.Fire()\n  UnityEngine.Physics.SphereCastAll(Vector3, Single, Vector3, Single)"
    },
    {
      site: "ImpactPool.Spawn()",
      file: "Assets/Scripts/Fx/ImpactPool.cs",
      line: 26,
      pattern: "Instantiate / Destroy churn",
      advice: "Reuse objects with a pool instead of creating and destroying them repeatedly.",
      behaviour: "Spikes",
      bytesPerFrame: 192,
      share: 4,
      frames: 17,
      calls: 2,
      stack: "ImpactPool.Spawn()\n  UnityEngine.Object.Instantiate(GameObject, Vector3, Quaternion)"
    }
  ];

  var PEAK_FRAMES = [
    { frame: 412, bytes: "48.2 KB", cause: "ImpactPool.Spawn()", causeBytes: "31.0 KB" },
    { frame: 388, bytes: "36.7 KB", cause: "WaveSpawner.SpawnLoop()", causeBytes: "22.4 KB" },
    { frame: 501, bytes: "29.1 KB", cause: "Shotgun.Fire()", causeBytes: "18.8 KB" }
  ];

  var HEAVY_ALLOCATIONS = [
    { site: "EnemyDirector.RebuildGrid()", row: "12× · 4.6 MB total · largest 512 KB" },
    { site: "SaveSystem.Serialize()", row: "3× · 1.9 MB total · largest 768 KB" }
  ];

  var RENDER_STATS = { batches: 1847, batchesPeak: 2310, setPass: 612, setPassPeak: 741, triangles: "1.9 M", trianglesPeak: "2.4 M" };

  /* ---------------- Compile Time ---------------- */

  var COMPILE_FINDINGS = [
    {
      id: "ring",
      severity: "crit",
      title: "Reference ring across 3 assemblies",
      detail:
        "Unity refuses to compile while this ring exists, and names only one assembly in the error. The full ring is: Game.Core → Game.UI → Game.Gameplay → Game.Core. Break it by removing whichever reference is easiest to invert.",
      action: null
    },
    {
      id: "unused-ref",
      severity: "warn",
      title: "Game.UI declares a reference to Game.Audio that nothing uses",
      detail:
        "The compiler emits a reference only where a type from it is actually used, and this one is absent from the compiled output. Removing it takes Game.UI out of Game.Audio's blast radius.",
      action: "Remove reference"
    },
    {
      id: "editor-runtime",
      severity: "crit",
      title: "Game.Gameplay references the editor assembly Game.Tools.Editor without being editor-only",
      detail:
        "This compiles in the editor and fails when someone makes a player build, so the failure arrives at the worst moment. Either move the code that needs it into an editor-only assembly, or guard it with UNITY_EDITOR and drop the reference.",
      action: null
    },
    {
      id: "monolith",
      severity: "warn",
      title: "1,284 scripts share one assembly, so every edit rebuilds all of them",
      detail:
        "Folders that depend least on the rest, and are therefore the least painful place to start: Assets/Scripts/Utils (41 scripts), Assets/Scripts/Save (23 scripts), Assets/Scripts/Localization (17 scripts).",
      action: null
    }
  ];

  var COMPILE_COSTS = [
    { name: "Assembly-CSharp", cost: "8.42 s", blast: "Nothing else rebuilds with it, 1,284 scripts", pct: 100 },
    { name: "Game.Core", cost: "3.10 s", blast: "4 other assemblies rebuild with it, 612 scripts in total", pct: 37 },
    { name: "Game.Gameplay", cost: "2.24 s", blast: "2 other assemblies rebuild with it, 388 scripts in total", pct: 27 },
    { name: "Game.UI", cost: "1.05 s", blast: "1 other assembly rebuilds with it, 156 scripts in total", pct: 12 },
    { name: "Game.Audio", cost: "0.61 s", blast: "Nothing else rebuilds with it, 44 scripts", pct: 7 },
    { name: "Game.Utils", cost: "not timed yet", blast: "Nothing else rebuilds with it, 41 scripts", pct: 4 }
  ];

  return {
    SCENE_ISSUES: SCENE_ISSUES,
    PASSED_ISSUES: PASSED_ISSUES,
    CODE_FINDINGS: CODE_FINDINGS,
    BUILD: BUILD,
    BUILD_DIFF: BUILD_DIFF,
    DEAD_ASSETS: DEAD_ASSETS,
    DUPLICATE_FILES: DUPLICATE_FILES,
    DUPLICATE_MATERIALS: DUPLICATE_MATERIALS,
    IMPORT_GROUPS: IMPORT_GROUPS,
    HUNT_OFFENDERS: HUNT_OFFENDERS,
    PEAK_FRAMES: PEAK_FRAMES,
    HEAVY_ALLOCATIONS: HEAVY_ALLOCATIONS,
    RENDER_STATS: RENDER_STATS,
    COMPILE_FINDINGS: COMPILE_FINDINGS,
    COMPILE_COSTS: COMPILE_COSTS
  };
})();
