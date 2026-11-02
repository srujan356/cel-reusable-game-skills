import React, { useEffect, useMemo, useState } from 'react';
import { createZip, downloadBlob, readZip } from './utils/zip';
import {
  INITIAL_ASSETS,
  INITIAL_CANVAS_CONNECTIONS,
  INITIAL_CANVAS_NODES,
  INITIAL_COMPONENTS,
  EMPTY_PLAYGROUND_CONFIG,
  INITIAL_PLAYGROUND_CONFIG,
  INITIAL_PLAYGROUNDS,
  INITIAL_SKILLS,
} from './data/mockData';
import {
  AssetItem,
  CanvasConnection,
  CanvasNode,
  ComponentInstance,
  ComponentSlotId,
  Playground,
  PlaygroundConfiguration,
  SkillCardItem,
  SkillComponentSlot,
} from './types/platform';
import { COMPONENT_DEFINITIONS } from './data/componentDefinitions';
import { MainViewId, MyWorkSubFilter, TopBar } from './components/TopBar';
import { LeftSidebar } from './components/LeftSidebar';
import { SkillLibraryView } from './components/SkillLibraryView';
import { SkillDetailView } from './components/SkillDetailView';
import { FeedbackLearningView } from './components/FeedbackLearningView';
import { PlaygroundView } from './components/PlaygroundView';
import { AssetLibraryView } from './components/AssetLibraryView';
import { CommunityView } from './components/CommunityView';
import { ComponentLibraryView } from './components/ComponentLibraryView';
import { AssetImportModal } from './components/AssetImportModal';
import { AssetReplacementModal } from './components/AssetReplacementModal';
import { ExportModal } from './components/ExportModal';

const DRAFT_KEY = 'chaos-engine-lab:draft';
const EXPORT_KEY = 'chaos-engine-lab:lastExport';

type SkillSnapshot = { components: SkillComponentSlot[]; nodes: CanvasNode[]; connections: CanvasConnection[]; config: PlaygroundConfiguration };
type PlaygroundSnapshot = SkillSnapshot & { componentInstances: ComponentInstance[] };

const cloneValue = <T,>(value: T): T => {
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value)) as T;
};

const createEmptyPlaygroundSnapshot = (): PlaygroundSnapshot => ({
  components: cloneValue([] as SkillComponentSlot[]),
  nodes: cloneValue([] as CanvasNode[]),
  connections: cloneValue([] as CanvasConnection[]),
  config: cloneValue(EMPTY_PLAYGROUND_CONFIG),
  componentInstances: [],
});

function loadSnapshots(): Record<string, SkillSnapshot> {
  try {
    const raw = window.localStorage.getItem('chaos-engine-lab:skill-snapshots');
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function loadStored(key: string) {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export default function App() {
  const draft = loadStored(DRAFT_KEY);
  const initialSnapshots = loadSnapshots();
  let initialActiveSkillId = 'reward-reveal';
  try {
    const storedActiveSkillId = window.localStorage.getItem('chaos-engine-lab:active-skill');
    initialActiveSkillId = storedActiveSkillId === null ? 'reward-reveal' : storedActiveSkillId;
  } catch {
    initialActiveSkillId = 'reward-reveal';
  }
  const initialSnap = initialSnapshots[initialActiveSkillId];
  const initialPlaygrounds: Playground[] = draft?.playgrounds ?? INITIAL_PLAYGROUNDS;
  let initialActivePlaygroundId = draft?.activePlaygroundId || INITIAL_PLAYGROUNDS[0].id;
  try {
    const storedActivePlaygroundId = window.localStorage.getItem('chaos-engine-lab:active-playground');
    if (storedActivePlaygroundId && initialPlaygrounds.some((playground) => playground.id === storedActivePlaygroundId)) {
      initialActivePlaygroundId = storedActivePlaygroundId;
    }
  } catch {
    // use the draft/default id
  }
  const initialPlaygroundSnapshot = draft?.playgroundSnapshots?.[initialActivePlaygroundId] as PlaygroundSnapshot | undefined;
  const initialWorkspace: PlaygroundSnapshot = cloneValue(initialPlaygroundSnapshot ?? (initialActivePlaygroundId !== INITIAL_PLAYGROUNDS[0].id ? createEmptyPlaygroundSnapshot() : {
    components: initialSnap?.components ?? draft?.components ?? INITIAL_COMPONENTS,
    nodes: initialSnap?.nodes ?? draft?.nodes ?? INITIAL_CANVAS_NODES,
    connections: initialSnap?.connections ?? draft?.connections ?? INITIAL_CANVAS_CONNECTIONS,
    config: initialSnap?.config ?? draft?.config ?? INITIAL_PLAYGROUND_CONFIG,
    componentInstances: draft?.componentInstances ?? [],
  }));

  // Global Navigation State
  const [activeView, setActiveView] = useState<MainViewId>('skill_library');
  const [myWorkFilter, setMyWorkFilter] = useState<MyWorkSubFilter>('all');
  const [activeSkillId, setActiveSkillId] = useState<string>(initialActiveSkillId);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFlowId, setActiveFlowId] = useState<number | null>(null);

  // Core Domain State
  const [skills, setSkills] = useState<SkillCardItem[]>(draft?.skills ?? INITIAL_SKILLS);
  const [assets, setAssets] = useState<AssetItem[]>(draft?.assets ?? INITIAL_ASSETS);
  const [components, setComponents] = useState<SkillComponentSlot[]>(initialWorkspace.components);
  const [nodes, setNodes] = useState<CanvasNode[]>(initialWorkspace.nodes);
  const [connections, setConnections] = useState<CanvasConnection[]>(initialWorkspace.connections);
  const [config, setConfig] = useState<PlaygroundConfiguration>(initialWorkspace.config);
  const [componentInstances, setComponentInstances] = useState<ComponentInstance[]>(initialWorkspace.componentInstances);
  const [playgrounds, setPlaygrounds] = useState<Playground[]>(initialPlaygrounds);
  const [activePlaygroundId, setActivePlaygroundId] = useState<string>(initialActivePlaygroundId);
  const [playgroundSnapshots, setPlaygroundSnapshots] = useState<Record<string, PlaygroundSnapshot>>(() => draft?.playgroundSnapshots ?? {});
  const [skillSnapshots, setSkillSnapshots] = useState<Record<string, SkillSnapshot>>(loadSnapshots());
  const prevSkillRef = React.useRef(activeSkillId);
  const currentDataRef = React.useRef({ components, nodes, connections, config });
  const [saveStatusText, setSaveStatusText] = useState<string>(
    'Saved'
  );

  // Modals State
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [isReplaceModalOpen, setIsReplaceModalOpen] = useState<boolean>(false);
  const [replaceTargetSlotId, setReplaceTargetSlotId] = useState<ComponentSlotId>('reward_item');
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);

  // Ensure a snapshot exists for the initial skill
  useEffect(() => {
    setSkillSnapshots((prev) => {
      if (prev['reward-reveal']) return prev;
      return {
        ...prev,
        'reward-reveal': {
          components: INITIAL_COMPONENTS,
          nodes: INITIAL_CANVAS_NODES,
          connections: INITIAL_CANVAS_CONNECTIONS,
          config: INITIAL_PLAYGROUND_CONFIG,
        },
      };
    });
  }, []);

  // A Playground is a saved workspace, separate from the reusable Skill definition.
  // Older drafts did not have this collection, so seed only the active record once.
  useEffect(() => {
    setPlaygroundSnapshots((prev) => {
      if (prev[activePlaygroundId]) return prev;
      return {
        ...prev,
        [activePlaygroundId]: cloneValue({ components, nodes, connections, config, componentInstances }),
      };
    });
  }, []);

  // Sync current global state into the active skill's snapshot
  useEffect(() => {
    // While a skill switch is pending, the switch effect below is responsible
    // for saving the previous skill. Syncing here would copy the incoming
    // skill's data into the previous skill's snapshot.
    if (!activeSkillId || prevSkillRef.current !== activeSkillId) return;
    currentDataRef.current = { components, nodes, connections, config };
    setSkillSnapshots((prev) => ({
      ...prev,
      [activeSkillId]: { components, nodes, connections, config },
    }));
  }, [activeSkillId, components, nodes, connections, config]);

  // Switch skill data when activeSkillId changes (preserve original)
  useEffect(() => {
    const prev = prevSkillRef.current;
    if (prev === activeSkillId) return;
    // save previous
    const d = currentDataRef.current;
    setSkillSnapshots((p) => ({ ...p, [prev]: { components: d.components, nodes: d.nodes, connections: d.connections, config: d.config } }));
    // A Skill selection must not hydrate an unrelated independent Playground.
    // Skill-backed Playgrounds are activated explicitly by openSkill().
    const selectedPlayground = playgrounds.find((playground) => playground.id === activePlaygroundId);
    if (!selectedPlayground || selectedPlayground.skillId !== activeSkillId) {
      prevSkillRef.current = activeSkillId;
      return;
    }

    // load new
    // Independent Playgrounds intentionally have no Skill ID. Never load a
    // synthetic empty-key skill snapshot into a new workspace.
    const snap = activeSkillId ? skillSnapshots[activeSkillId] : undefined;
    if (snap) {
      setComponents(snap.components);
      setNodes(snap.nodes);
      setConnections(snap.connections);
      setConfig(snap.config);
      currentDataRef.current = { components: snap.components, nodes: snap.nodes, connections: snap.connections, config: snap.config };
    } else if (activeSkillId === 'reward-reveal') {
      setComponents(INITIAL_COMPONENTS);
      setNodes(INITIAL_CANVAS_NODES);
      setConnections(INITIAL_CANVAS_CONNECTIONS);
      setConfig(INITIAL_PLAYGROUND_CONFIG);
      currentDataRef.current = { components: INITIAL_COMPONENTS, nodes: INITIAL_CANVAS_NODES, connections: INITIAL_CANVAS_CONNECTIONS, config: INITIAL_PLAYGROUND_CONFIG };
    }
    prevSkillRef.current = activeSkillId;
  }, [activeSkillId, activePlaygroundId, playgrounds]);

  useEffect(() => {
    try {
      window.localStorage.setItem('chaos-engine-lab:active-playground', activePlaygroundId);
    } catch {
      // ignore
    }
  }, [activePlaygroundId]);

  useEffect(() => {
    if (!playgroundSnapshots[activePlaygroundId]) return;
    setPlaygroundSnapshots((prev) => ({
      ...prev,
      [activePlaygroundId]: cloneValue({ components, nodes, connections, config, componentInstances }),
    }));
  }, [activePlaygroundId, components, nodes, connections, config, componentInstances]);

  // Persist snapshots
  useEffect(() => {
    try {
      window.localStorage.setItem('chaos-engine-lab:skill-snapshots', JSON.stringify(skillSnapshots));
    } catch {
      // ignore
    }
  }, [skillSnapshots]);

  // Persist active skill id
  useEffect(() => {
    try {
      window.localStorage.setItem('chaos-engine-lab:active-skill', activeSkillId);
    } catch {
      // ignore
    }
  }, [activeSkillId]);

  // Persist local draft for browser reload restoration
  useEffect(() => {
    try {
      window.localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({ skills, assets, components, nodes, connections, config, componentInstances, playgrounds, activePlaygroundId, playgroundSnapshots })
      );
    } catch {
      // ignore storage failures
    }
  }, [skills, assets, components, nodes, connections, config, componentInstances, playgrounds, activePlaygroundId, playgroundSnapshots]);

  const activeSkill = useMemo(
    () => skills.find((s) => s.id === activeSkillId) || skills[0],
    [skills, activeSkillId]
  );
  const activePlayground = useMemo(
    () => playgrounds.find((playground) => playground.id === activePlaygroundId) || playgrounds[0],
    [playgrounds, activePlaygroundId]
  );

  const rewardSlot = components.find((c) => c.id === 'reward_item');
  const activeRewardAsset = assets.find((a) => a.id === rewardSlot?.assignedAssetId) || assets[1];

  // Compute Live Schema & Slot Validation Status
  const validationStatus = useMemo(() => {
    const missingRequired = components.filter((c) => c.required && !c.assignedAssetId);
    const containerSlot = components.find((c) => c.id === 'reward_container');
    const containerAsset = assets.find((a) => a.id === containerSlot?.assignedAssetId);

    if (missingRequired.length > 0) {
      return {
        valid: false,
        warningCount: 1,
        message: `Missing required slot: ${missingRequired.map((m) => m.name).join(', ')}`,
      };
    }
    if (
      config.activeEdgeCase === 'missing_opening_anim' ||
      containerAsset?.id === 'asset_crate_static_warn'
    ) {
      return {
        valid: false,
        warningCount: 1,
        message: 'Validation Warning: Static container has 0 clips & no lid pivot',
      };
    }
    if (config.rewardQuantity <= 0 || config.activeEdgeCase === 'invalid_quantity') {
      return {
        valid: false,
        warningCount: 1,
        message: `Invalid rewardQuantity (${config.rewardQuantity}); must be 1..50`,
      };
    }
    if (config.activeEdgeCase === 'missing_destination') {
      return {
        valid: true,
        warningCount: 1,
        message: '1 Warning: Destination unbound (Using hover fallback)',
      };
    }
    return {
      valid: true,
      warningCount: 0,
      message: 'All 7 slots valid',
    };
  }, [components, assets, config]);

  // Assign an asset to a component slot (non-destructively preserving previous asset in library)
  const handleAssignAssetToSlot = (assetId: string, slotId: ComponentSlotId) => {
    const newAsset = assets.find((a) => a.id === assetId);
    if (!newAsset) return;

    setComponents((prev) =>
      prev.map((slot) =>
        slot.id === slotId
          ? {
              ...slot,
              assignedAssetId: assetId,
              compatibility: newAsset.compatibility,
            }
          : slot
      )
    );

    // Update canvas node subtitle if reward_item or reward_container changed
    if (slotId === 'reward_item') {
      setNodes((prev) =>
        prev.map((n) =>
          n.id === 'node_prim_spawn_effect'
            ? {
                ...n,
                subtitle: `Slot: ${newAsset.name.split(' (')[0]} + Particle Burst`,
              }
            : n
        )
      );
    } else if (slotId === 'reward_container') {
      setNodes((prev) =>
        prev.map((n) =>
          n.id === 'node_comp_container'
            ? {
                ...n,
                subtitle: `${newAsset.filename} • State: Closed`,
              }
            : n
        )
      );
    }

    setSaveStatusText(`Saved · ${newAsset.name.split(' (')[0]}`);
  };

  // Remove asset reference from current skill WITHOUT deleting it from the Asset Library
  const handleRemoveAssetFromSkill = (assetId: string) => {
    setComponents((prev) =>
      prev.map((slot) =>
        slot.assignedAssetId === assetId ? { ...slot, assignedAssetId: null } : slot
      )
    );
    setSaveStatusText('Saved · asset unlinked');
  };

  // Confirm Asset Import & Analysis from Screen C
  const handleConfirmAssetImport = (
    assetId: string,
    confirmedRole: ComponentSlotId | 'Actor' | 'Target',
    confirmedPurpose: string,
    openingMode: 'animation_clip' | 'procedural_lid_pivot' | 'none_static',
    exposedCapabilities: string[],
    bindToPlaygroundSlot: boolean
  ) => {
    setAssets((prev) =>
      prev.map((a) =>
        a.id === assetId
          ? {
              ...a,
              inspectionStatus: 'INSPECTED',
              creatorConfirmation: {
                confirmedByCreator: true,
                confirmedRole,
                confirmedAnimationPurpose: confirmedPurpose,
                openingMechanismMode: openingMode,
                exposedCapabilities,
              },
            }
          : a
      )
    );

    if (
      bindToPlaygroundSlot &&
      confirmedRole !== 'Actor' &&
      confirmedRole !== 'Target'
    ) {
      handleAssignAssetToSlot(assetId, confirmedRole);
      setActiveView('playground');
    }
    setSaveStatusText('Saved · asset confirmed');
  };

  // Component Library: create an independent instance of a definition in a skill
  const handleCreateComponentInstance = (definitionId: string, skillId: string | undefined = activeSkillId || undefined, slotId?: ComponentSlotId) => {
    const slot = slotId ? components.find((c) => c.id === slotId) : undefined;
    const instance: ComponentInstance = {
      instanceId: `inst_${definitionId}_${typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}_${Math.floor(Math.random() * 1000000)}`}`,
      definitionId,
      skillId,
      playgroundId: activePlaygroundId,
      slotId,
      boundAssetIds: slot?.assignedAssetId ? [slot.assignedAssetId] : [],
      propertyOverrides: {},
      currentState: 'Idle',
      config: {},
      enabled: true,
    };
    setComponentInstances((prev) => [...prev, instance]);
    // Link slot to definition/instance without changing asset assignment
    if (slotId) {
      setComponents((prev) =>
        prev.map((s) =>
          s.id === slotId ? { ...s, definitionId, instanceId: instance.instanceId } : s
        )
      );
    }
    setSaveStatusText('Component instance added');
  };

  const getCurrentPlaygroundSnapshot = (): PlaygroundSnapshot => cloneValue({
    components,
    nodes,
    connections,
    config,
    componentInstances,
  });

  const getPlaygroundSnapshot = (playgroundId: string, playground?: Playground): PlaygroundSnapshot => {
    const stored = playgroundSnapshots[playgroundId];
    if (stored) return cloneValue(stored);

    // A legacy/default Reward Reveal Playground may not yet have a dedicated
    // record. It is the only workspace allowed to fall back to its Skill seed.
    if (playgroundId === INITIAL_PLAYGROUNDS[0].id || playground?.skillId === 'reward-reveal') {
      const skillSnapshot = playground?.skillId ? skillSnapshots[playground.skillId] : undefined;
      const rewardSnapshot = skillSnapshot || {
        components: INITIAL_COMPONENTS,
        nodes: INITIAL_CANVAS_NODES,
        connections: INITIAL_CANVAS_CONNECTIONS,
        config: INITIAL_PLAYGROUND_CONFIG,
      };
      return cloneValue({ ...rewardSnapshot, componentInstances: [] });
    }

    return createEmptyPlaygroundSnapshot();
  };

  // All Playground transitions go through this function. The previous
  // workspace is committed under its own ID before the target is hydrated,
  // and skill-loading effects are explicitly bypassed for this transition.
  const activatePlayground = (playgroundId: string, snapshot: PlaygroundSnapshot, skillId = '') => {
    const previousSnapshot = getCurrentPlaygroundSnapshot();
    const nextSnapshot = cloneValue(snapshot);

    setPlaygroundSnapshots((prev) => ({
      ...prev,
      [activePlaygroundId]: previousSnapshot,
      [playgroundId]: nextSnapshot,
    }));
    setActivePlaygroundId(playgroundId);
    setActiveSkillId(skillId);
    prevSkillRef.current = skillId;
    currentDataRef.current = {
      components: nextSnapshot.components,
      nodes: nextSnapshot.nodes,
      connections: nextSnapshot.connections,
      config: nextSnapshot.config,
    };
    setComponents(nextSnapshot.components);
    setNodes(nextSnapshot.nodes);
    setConnections(nextSnapshot.connections);
    setConfig(nextSnapshot.config);
    setComponentInstances(nextSnapshot.componentInstances);
  };

  const openSkill = (skillId: string, view: 'skill_detail' | 'playground') => {
    const skillPlayground = playgrounds.find((playground) => playground.skillId === skillId);
    if (skillPlayground) {
      activatePlayground(
        skillPlayground.id,
        getPlaygroundSnapshot(skillPlayground.id, skillPlayground),
        skillId,
      );
    } else {
      setActiveSkillId(skillId);
    }
    setActiveView(view);
  };

  const handleUseComponent = (
    definitionId: string,
    destination: { type: 'existing'; playgroundId: string } | { type: 'new'; name: string }
  ) => {
    const targetPlayground = destination.type === 'existing' ? playgrounds.find((playground) => playground.id === destination.playgroundId) : undefined;
    const targetId = targetPlayground?.id || `playground_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
    const storedTargetSnapshot = targetPlayground
      ? getPlaygroundSnapshot(targetId, targetPlayground)
      : createEmptyPlaygroundSnapshot();
    const targetSnapshot: PlaygroundSnapshot = {
      ...storedTargetSnapshot,
      componentInstances: destination.type === 'new'
        ? []
        : storedTargetSnapshot.componentInstances.filter((item) => !item.playgroundId || item.playgroundId === targetId),
    };
    const instance: ComponentInstance = {
      instanceId: `inst_${definitionId}_${typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}_${Math.floor(Math.random() * 1000000)}`}`,
      definitionId,
      skillId: targetPlayground?.skillId,
      playgroundId: targetId,
      boundAssetIds: [],
      propertyOverrides: {},
      currentState: 'Idle',
      config: {},
      enabled: true,
    };
    const selectedDefinition = COMPONENT_DEFINITIONS.find((definition) => definition.definitionId === definitionId);
    const instanceNode: CanvasNode = {
      id: `node_${instance.instanceId}`,
      kind: 'component',
      label: selectedDefinition?.name || definitionId,
      subtitle: 'New component instance',
      category: 'Component',
      x: 160 + targetSnapshot.nodes.length * 24,
      y: 120 + targetSnapshot.nodes.length * 24,
      exposedToSchema: true,
    };
    const nextSnapshot: PlaygroundSnapshot = {
      ...targetSnapshot,
      componentInstances: [...targetSnapshot.componentInstances, instance],
      nodes: [...targetSnapshot.nodes, instanceNode],
    };

    if (destination.type === 'new') {
      const nextPlayground: Playground = {
        id: targetId,
        name: destination.name,
        lastModified: 'Just now',
      };
      setPlaygrounds((prev) => [...prev, nextPlayground]);
    }
    activatePlayground(targetId, nextSnapshot, targetPlayground?.skillId || '');
    setActiveView('playground');
    setSaveStatusText(`Added ${COMPONENT_DEFINITIONS.find((definition) => definition.definitionId === definitionId)?.name || 'component'} · ${destination.type === 'new' ? 'new Playground' : 'Playground updated'}`);
  };

  const handleCreatePlayground = (name: string) => {
    const id = `playground_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
    const snapshot = createEmptyPlaygroundSnapshot();
    const playground: Playground = { id, name, lastModified: 'Just now' };
    setPlaygrounds((prev) => [...prev, playground]);
    activatePlayground(id, snapshot);
    setActiveView('playground');
    setSaveStatusText('New Playground created');
  };

  const handleUpdateComponentInstance = (instanceId: string, patch: Partial<ComponentInstance>) => {
    setComponentInstances((prev) =>
      prev.map((inst) => (inst.instanceId === instanceId ? { ...inst, ...patch } : inst))
    );
    setSaveStatusText('Saved');
  };

  // Fork Skill with Attribution (does not mutate the original skill definition)
  const handleForkSkill = (skillId = 'reward-reveal') => {
    setSaveStatusText('Forked with attribution');
    setActiveView('playground');
  };

  // Re-import Skill Package (.zip): parse the actual archive
  const handleImportSkillZipFile = async (file: File) => {
    try {
      const entries = await readZip(file);
      const manifestEntry = entries.find((e) => e.name === 'manifest.json');
      if (!manifestEntry) throw new Error('Missing manifest.json');
      const manifest = JSON.parse(new TextDecoder().decode(manifestEntry.data));
      if (!manifest || typeof manifest !== 'object') throw new Error('Invalid manifest');
      if (manifest.schemaVersion !== '1.0') throw new Error(`Unsupported schema version: ${manifest.schemaVersion}`);
      if (!manifest.skill) throw new Error('Invalid manifest contents');
      const snapshotData = manifest.snapshot || manifest;

      const newSkillId = `imported-${manifest.skill.id || 'skill'}-${Date.now()}`;
      const newSkill: SkillCardItem = {
        ...(manifest.skill as SkillCardItem),
        id: newSkillId,
        name: `${manifest.skill.name || 'Imported Skill'} (imported)`,
        latestVersion: manifest.skill.latestVersion || '1.0.0',
      };
      // lineage metadata
      (newSkill as any).sourceSkillId = manifest.skill.id;

      const snapshot: SkillSnapshot = {
        components: snapshotData.components || INITIAL_COMPONENTS,
        nodes: snapshotData.nodes || INITIAL_CANVAS_NODES,
        connections: snapshotData.connections || INITIAL_CANVAS_CONNECTIONS,
        config: snapshotData.config || INITIAL_PLAYGROUND_CONFIG,
      };

      setSkills((prev) => [...prev, newSkill]);
      setSkillSnapshots((prev) => ({ ...prev, [newSkillId]: snapshot }));
      setAssets((prev) => {
        // reuse existing assets by id; add metadata-only entries if missing
        const existingIds = new Set(prev.map((a) => a.id));
        const incoming = (manifest.assets || []) as AssetItem[];
        const toAdd = incoming.filter((a) => !existingIds.has(a.id));
        return [...prev, ...toAdd];
      });
      setActiveSkillId(newSkillId);
      setComponents(snapshot.components);
      setNodes(snapshot.nodes);
      setConnections(snapshot.connections);
      setConfig(snapshot.config);
      setActiveView('playground');
      setSaveStatusText('Imported skill package');
    } catch (err: any) {
      setSaveStatusText(`Import failed: ${err?.message || 'unknown error'}`);
    }
  };

  // Legacy shim (no longer uses localStorage snapshot)
  const handleReimportSkillPackage = () => {
    setSaveStatusText('Use the file picker to import a .zip package');
  };

  // Real downloadable ZIP export of the current skill snapshot
  const handleExportZip = () => {
    const activeSkillObj = skills.find((s) => s.id === activeSkillId) || skills[0];
    const snapshot = {
      schemaVersion: '1.0',
      skill: activeSkillObj,
      assets,
      components,
      nodes,
      connections,
      config,
      snapshot: { components, nodes, connections, config },
      exportedAt: new Date().toISOString(),
    };
    try {
      window.localStorage.setItem(EXPORT_KEY, JSON.stringify(snapshot));
    } catch {
      // ignore
    }
    const encoder = new TextEncoder();
    const snapshotJson = JSON.stringify(snapshot, null, 2);
    const readme = 'Chaos Engine Labs skill package. Transport format only; running it in a game requires an engine adapter. ' +
      'This package provides asset metadata only. See asset-reference.md for each slot\'s status and integration steps.';
    const assetRefMd = 'asset-reference.md';
    const entries = [
      { name: 'manifest.json', data: encoder.encode(snapshotJson) },
      { name: 'README.txt', data: encoder.encode(readme) },
      { name: assetRefMd, data: encoder.encode('# Asset Reference Guide\n\nThis document describes the status of each asset referenced by the skill package.\n') },
    ];
    const blob = createZip(entries);
    downloadBlob(blob, `reward-reveal-v${config.activeVersion}.zip`);
    setSaveStatusText('Exported .zip');
  };

  // Trigger any of the 7 Connected Prototype Flows from the Top Bar
  const handleTriggerPrototypeFlow = (flowId: number) => {
    setActiveFlowId(flowId);
    switch (flowId) {
      case 1:
        setActiveView('skill_library');
        break;
      case 2:
        setIsImportModalOpen(true);
        break;
      case 3:
        setActiveView('playground');
        setReplaceTargetSlotId('reward_item');
        setIsReplaceModalOpen(true);
        break;
      case 4:
        setActiveView('playground');
        break;
      case 5:
        setActiveView('playground');
        break;
      case 6:
        setActiveView('playground');
        setConfig((prev) => ({ ...prev, activeEdgeCase: 'skip_during_opening' }));
        break;
      case 7:
        setIsExportModalOpen(true);
        break;
      default:
        break;
    }
  };

  // Compute Breadcrumbs
  const breadcrumbs = useMemo(() => {
    if (activeView === 'skill_library') {
      return [
        { label: 'Skill Library', onClick: () => setActiveView('skill_library') },
        {
          label:
            myWorkFilter === 'my_skills'
              ? 'My Skills'
              : 'All',
        },
      ];
    }
    if (activeView === 'skill_detail') {
      return [
        { label: 'Skill Library', onClick: () => setActiveView('skill_library') },
        { label: 'Rewards & Collection', onClick: () => setActiveView('skill_library') },
        { label: `${activeSkill.name} (v${config.activeVersion})` },
      ];
    }
    if (activeView === 'feedback_learning') {
      return [
        { label: 'Skill Library', onClick: () => setActiveView('skill_library') },
        { label: 'Reward Reveal', onClick: () => setActiveView('skill_detail') },
        { label: 'Feedback & Learning' },
      ];
    }
    if (activeView === 'asset_library') {
      return [
        { label: 'My Work', onClick: () => setActiveView('asset_library') },
        { label: 'Imported Assets' },
      ];
    }
    if (activeView === 'component_library') {
      return [
        { label: 'Skill Library', onClick: () => setActiveView('skill_library') },
        { label: 'Components' },
      ];
    }
    if (activeView === 'community') {
      return [
        { label: 'Community', onClick: () => setActiveView('community') },
        { label: 'Elena Vance' },
      ];
    }
    return [
      { label: activePlayground?.name || 'Playground', onClick: () => setActiveView('playground') },
      { label: activeSkillId || 'No Skill', onClick: activeSkillId ? () => setActiveView('skill_detail') : undefined },
      { label: `v${config.activeVersion} draft` },
    ];
  }, [activeView, myWorkFilter, activeSkill, activePlayground, config.activeVersion, activeRewardAsset]);

  const activeRewardVisualKind = (
    ['coins', 'flowers', 'candies', 'cookies', 'chocolates'].includes(
      activeRewardAsset.visualKind
    )
      ? activeRewardAsset.visualKind
      : 'coins'
  ) as 'coins' | 'flowers' | 'candies' | 'cookies' | 'chocolates';

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-canvas text-ink">
        {/* Persistent Left Navigation Sidebar */}
      <LeftSidebar
        activeView={activeView}
        myWorkFilter={myWorkFilter}
        onSelectView={(view, filter = 'all') => {
          setActiveView(view);
          setMyWorkFilter(filter);
        }}
        assetCount={assets.length}
        skillCount={skills.length}
        activeRewardName={activeSkillId ? activeRewardAsset.name.split(' (')[0] : ''}
        activePlaygroundName={activePlayground?.name || 'Playground'}
        compact={activeView === 'playground'}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          breadcrumbs={breadcrumbs}
          searchQuery={searchQuery}
          onSearchChange={(q) => {
            setSearchQuery(q);
            if (activeView !== 'skill_library' && q.trim().length > 0) setActiveView('skill_library');
          }}
          onOpenImport={() => setIsImportModalOpen(true)}
          onOpenExport={() => setIsExportModalOpen(true)}
          showExport={activeView === 'playground'}
          onTour={handleTriggerPrototypeFlow}
          validation={validationStatus}
          saveStatus={saveStatusText}
        />

        <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* View Router */}
        {activeView === 'skill_library' && (
          <SkillLibraryView
            skills={skills}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            myWorkFilter={myWorkFilter}
            onOpenSkillDetail={(skillId) => {
              openSkill(skillId, 'skill_detail');
            }}
            onOpenPlayground={(skillId) => {
              openSkill(skillId, 'playground');
            }}
            onForkSkill={handleForkSkill}
            activeRewardVisualKind={activeRewardVisualKind}
          />
        )}

        {activeView === 'skill_detail' && (
          <SkillDetailView
            skill={activeSkill}
            components={components}
            assets={assets}
            config={config}
            onBackToLibrary={() => setActiveView('skill_library')}
            onImportToPlayground={(version) => {
              setConfig((prev) => ({ ...prev, activeVersion: version }));
              setActiveView('playground');
            }}
            onForkSkill={() => handleForkSkill(activeSkill.id)}
            onOpenFeedbackLearning={() => setActiveView('feedback_learning')}
            onOpenReplaceModal={() => {
              setReplaceTargetSlotId('reward_item');
              setIsReplaceModalOpen(true);
            }}
            onSelectVersion={(version) =>
              setConfig((prev) => ({ ...prev, activeVersion: version }))
            }
          />
        )}

        {activeView === 'feedback_learning' && (
          <FeedbackLearningView
            skill={activeSkill}
            onBack={() => setActiveView('skill_detail')}
          />
        )}

        {activeView === 'playground' && (
          <PlaygroundView
            assets={assets}
            components={components}
            nodes={nodes}
            connections={connections}
            config={config}
            componentDefinitions={COMPONENT_DEFINITIONS}
            componentInstances={componentInstances}
            onCreateComponentInstance={handleCreateComponentInstance}
            onUpdateComponentInstance={handleUpdateComponentInstance}
            onUpdateConfig={(patch) => {
              setConfig((prev) => ({ ...prev, ...patch }));
              setSaveStatusText('Saved');
            }}
            onUpdateNode={(nodeId, patch) =>
              setNodes((prev) =>
                prev.map((n) => (n.id === nodeId ? { ...n, ...patch } : n))
              )
            }
            onAddNode={(newNode, connectFromId) => {
              setNodes((prev) => [...prev, newNode]);
              if (connectFromId) {
                setConnections((prev) => [
                  ...prev,
                  {
                    id: `conn_${Date.now()}`,
                    fromNodeId: connectFromId,
                    toNodeId: newNode.id,
                    label: 'Then',
                    flowType: newNode.flowExecution || 'Sequential',
                  },
                ]);
              }
            }}
            onRemoveNode={(nodeId) => {
              setNodes((prev) => prev.filter((n) => n.id !== nodeId));
              setConnections((prev) =>
                prev.filter((c) => c.fromNodeId !== nodeId && c.toNodeId !== nodeId)
              );
            }}
            onAddConnection={(conn) => setConnections((prev) => [...prev, conn])}
            onOpenReplaceModal={(slotId) => {
              setReplaceTargetSlotId(slotId);
              setIsReplaceModalOpen(true);
            }}
            onOpenImportModal={() => setIsImportModalOpen(true)}
            onRemoveAssetFromSkill={handleRemoveAssetFromSkill}
            onAssignAssetToSlot={handleAssignAssetToSlot}
          />
        )}

        {activeView === 'component_library' && (
          <ComponentLibraryView
            definitions={COMPONENT_DEFINITIONS}
            instances={componentInstances}
            skills={skills}
            playgrounds={playgrounds}
            activePlaygroundId={activePlaygroundId}
            onUseComponent={handleUseComponent}
            onCreatePlayground={handleCreatePlayground}
          />
        )}

        {activeView === 'asset_library' && (
          <AssetLibraryView
            assets={assets}
            components={components}
            onOpenImportModal={() => setIsImportModalOpen(true)}
            onOpenReplaceModalForSlot={(slotId) => {
              setReplaceTargetSlotId(slotId);
              setIsReplaceModalOpen(true);
            }}
            onAssignAssetToSlot={handleAssignAssetToSlot}
            onRemoveAssetFromSkill={handleRemoveAssetFromSkill}
            onOpenPlayground={() => setActiveView('playground')}
          />
        )}

        {activeView === 'community' && (
          <CommunityView
            skill={activeSkill}
            onOpenSkillDetail={(skillId) => {
              openSkill(skillId, 'skill_detail');
            }}
            onOpenPlayground={(skillId) => {
              openSkill(skillId, 'playground');
            }}
            onCreateFork={() => handleForkSkill('reward-reveal')}
          />
        )}
        </div>
      </div>

      {/* Modal 1: 3-Screen Asset Import & Analysis Workflow */}
      <AssetImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        assets={assets}
        onConfirmAssetImport={handleConfirmAssetImport}
        onReimportSkillZip={handleReimportSkillPackage}
        onImportSkillZipFile={handleImportSkillZipFile}
      />

      {/* Modal 2: Typed Slot Asset Replacement Picker (Coins → Flowers, Candies, Cookies, Chocolates) */}
      <AssetReplacementModal
        isOpen={isReplaceModalOpen}
        onClose={() => setIsReplaceModalOpen(false)}
        targetSlotId={replaceTargetSlotId}
        onSelectTargetSlot={(slotId) => setReplaceTargetSlotId(slotId)}
        components={components}
        assets={assets}
        onConfirmReplace={(slotId, newAssetId) => handleAssignAssetToSlot(newAssetId, slotId)}
        onOpenImportModal={() => setIsImportModalOpen(true)}
      />

      {/* Modal 3: Export Skill Package (.zip, AI Agent Prompt .md, Code Export, Unity/Unreal SDK status) */}
      <ExportModal
        isOpen={isExportModalOpen && activeView === 'playground'}
        onClose={() => setIsExportModalOpen(false)}
        config={config}
        components={components}
        assets={assets}
        validationStatus={validationStatus}
        onReimportPackage={handleReimportSkillPackage}
        onExportZip={handleExportZip}
      />
    </div>
  );
}
