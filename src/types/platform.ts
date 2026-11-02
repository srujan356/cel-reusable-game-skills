export type PrimaryBucket =
  | 'Input & Selection'
  | 'Feedback & Validation'
  | 'Gameplay Resolution'
  | 'Guidance & Assistance'
  | 'Progression & State'
  | 'Outcomes & Recovery'
  | 'Rewards & Collection';

export type CompatibilityStatus =
  | 'Compatible'
  | 'Compatible with configuration'
  | 'Requires mapping'
  | 'Requires additional integration'
  | 'Unsupported';

export type AssetCategory =
  | '3D Models'
  | 'Characters'
  | 'Animation Clips'
  | 'Images and Sprites'
  | 'Textures and Materials'
  | 'Audio'
  | 'Visual Effects';

export type InspectionStatus = 'INSPECTED' | 'NEEDS_CONFIRMATION' | 'WARNING' | 'UNSUPPORTED';

export interface ExtractedAssetFacts {
  meshes: string[];
  vertexCount?: number;
  skeleton: string | null;
  boneCount: number;
  bonesSample: string[];
  hasSeparateLidMesh?: boolean;
  lidPivotCoordinates?: [number, number, number] | null;
  animationClips: {
    name: string;
    durationSec: number;
    fps: number;
    rootMotion: boolean;
    tracksCount: number;
  }[];
  durationSec: number;
  materials: {
    name: string;
    shader: string;
    exposesColorParam: boolean;
    colorParamName?: string;
    bakedTextureOnly?: boolean;
  }[];
  textures: string[];
  fileSizeKB: number;
  dimensionsOrSampleRate: string;
  signatureVerified: boolean;
}

export interface AISemanticSuggestion {
  possibleAnimationCategory: string;
  confidence: number;
  possibleComponentRole: ComponentSlotId | 'Actor' | 'Target';
  suggestedTags: string[];
  possibleInteractionClassification: string;
  reasoningEvidence: string;
  ambiguityWarning?: string;
}

export interface CreatorConfirmationState {
  confirmedByCreator: boolean;
  confirmedRole: ComponentSlotId | 'Actor' | 'Target' | 'Unassigned';
  confirmedAnimationPurpose: string;
  openingMechanismMode: 'animation_clip' | 'procedural_lid_pivot' | 'none_static';
  exposedCapabilities: string[];
}

export interface AssetItem {
  id: string;
  name: string;
  filename: string;
  format: 'FBX' | 'GLB' | 'glTF' | 'PNG' | 'WebP' | 'WAV' | 'OGG' | 'JSON' | 'ZIP';
  category: AssetCategory;
  inspectionStatus: InspectionStatus;
  compatibility: CompatibilityStatus;
  compatibilityNote: string;
  license: 'CC-BY-4.0' | 'Studio Proprietary (Redistributable)' | 'MIT Asset License' | 'Restricted (Internal Only)';
  redistributable: boolean;
  usedInCurrentSkill: boolean;
  compatibleSlots: ComponentSlotId[];
  visualKind:
    | 'chest_gold'
    | 'chest_wood_static'
    | 'gift_box'
    | 'reward_card'
    | 'coins'
    | 'flowers'
    | 'candies'
    | 'cookies'
    | 'chocolates'
    | 'particles_burst'
    | 'confetti'
    | 'sparkles'
    | 'audio_wave'
    | 'character_rig'
    | 'texture_mat';
  previewColor: string;
  extractedFacts: ExtractedAssetFacts;
  aiSuggestions: AISemanticSuggestion;
  creatorConfirmation: CreatorConfirmationState;
}

export type ComponentSlotId =
  | 'reward_container'
  | 'container_body'
  | 'lid_opening_element'
  | 'reward_item'
  | 'reveal_effect'
  | 'audio_slot'
  | 'collection_destination';

export type ComponentCategory =
  | 'Game Objects & Props'
  | 'Characters & Entities'
  | 'UI & Interaction Elements'
  | 'Rewards & Collectibles'
  | 'Visual & Audio Elements'
  | 'Runtime References';

export type ComponentPropertyType = 'string' | 'number' | 'boolean' | 'enum' | 'color' | 'range';

export interface ComponentPropertySchema {
  id: string;
  label: string;
  type: ComponentPropertyType;
  defaultValue: unknown;
  min?: number;
  max?: number;
  options?: string[];
  unit?: string;
  capabilityRequirement?: string;
  validation?: string;
}

export interface ComponentDefinition {
  definitionId: string;
  name: string;
  icon: string;
  description: string;
  category: ComponentCategory;
  tags: string[];
  purpose: string;
  acceptedAssetTypes: string[];
  requiredCapabilities: string[];
  optionalCapabilities: string[];
  supportedStates: string[];
  exposedProperties: ComponentPropertySchema[];
  supportedTriggers: string[];
  compatibleActionTypes: string[];
  inputs: string[];
  outputs: string[];
  dependencies: string[];
  compatibilityNotes: string;
  previewSupport: 'Full' | 'Partial' | 'Documentation only';
  limitations: string;
}

export interface ComponentInstance {
  instanceId: string;
  definitionId: string;
  skillId?: string;
  playgroundId?: string;
  slotId?: ComponentSlotId;
  boundAssetIds: string[];
  propertyOverrides: Record<string, unknown>;
  currentState: string;
  config: Record<string, unknown>;
  enabled: boolean;
}

export interface SkillComponentSlot {
  id: ComponentSlotId;
  name: string;
  roleDescription: string;
  required: boolean;
  requiredNote?: string;
  assignedAssetId: string | null;
  compatibility: CompatibilityStatus;
  acceptedFormats: string[];
  slotConstraints: string[];
  stateList: string[];
  definitionId?: string;
  instanceId?: string;
}

export type TriggerType =
  | 'On Tap'
  | 'Double Tap'
  | 'Long Press'
  | 'Press Down'
  | 'Press Release'
  | 'Swipe'
  | 'Drag'
  | 'Drop'
  | 'Reward Earned'
  | 'Level Completed'
  | 'Level Failed'
  | 'Collision'
  | 'Timer Expired'
  | 'Host Game Event';

export type ActionCategory =
  | 'Transform'
  | 'Motion'
  | 'Animation'
  | 'Appearance'
  | 'Visibility'
  | 'Object'
  | 'Effects'
  | 'Audio'
  | 'Game Integration'
  | 'Composite';

export type TrajectoryType = 'Straight' | 'Arc' | 'Bezier' | 'Wave' | 'Custom';

export interface RotateProperties {
  axis: 'X' | 'Y' | 'Z';
  angleDeg: number;
  direction: 'CW' | 'CCW';
  pivotOrigin: string;
  coordinateSpace: 'Local' | 'World';
  durationMs: number;
  delayMs: number;
  easing: 'OutBack' | 'CubicBezier' | 'Spring' | 'Linear' | 'InOutQuad';
}

export interface MoveProperties {
  startPos: [number, number, number];
  destination: [number, number, number];
  destinationTargetSlot: ComponentSlotId | 'Coordinates';
  coordinateSpace: 'Local' | 'World' | 'ScreenUI';
  durationMs: number;
  delayMs: number;
  easing: 'OutCubic' | 'InOutQuad' | 'Spring' | 'Linear';
}

export interface TrajectoryProperties {
  type: TrajectoryType;
  // Arc settings
  arcDirection: 'Upward' | 'LeftArc' | 'RightArc' | 'RadialSpread';
  arcAngleDeg: number;
  arcHeightPx: number;
  // Bezier settings
  bezierStart: [number, number];
  bezierEnd: [number, number];
  bezierControl1: [number, number];
  bezierControl2: [number, number];
  // Wave settings
  waveAmplitudePx: number;
  waveFrequencyHz: number;
  durationMs: number;
  easing: 'OutBack' | 'CubicBezier' | 'InOutSine' | 'Linear';
}

export interface ScaleProperties {
  mode: 'Uniform' | 'Independent';
  scaleX: number;
  scaleY: number;
  scaleZ: number;
  anchorOrigin: 'Center' | 'Bottom-Center' | 'Lid-Hinge' | 'CustomPivot';
  durationMs: number;
  easing: 'OutBack' | 'ElasticOut' | 'Linear' | 'InOutQuad';
}

export interface AnimationProperties {
  availableClips: string[];
  selectedClip: string;
  playbackSpeed: number;
  startTimeSec: number;
  endTimeSec: number;
  loop: boolean;
  blendWeight: number;
}

export interface AppearanceProperties {
  materialName: string;
  colorHex: string;
  opacity: number;
  textureMap: string;
  glowIntensity: number;
  shaderSupportsColorOverride: boolean;
}

export interface CanvasNode {
  id: string;
  kind: 'component' | 'trigger' | 'composite_action' | 'primitive_action' | 'state';
  label: string;
  subtitle: string;
  category?: ActionCategory | 'Trigger' | 'Component' | 'State';
  x: number;
  y: number;
  targetSlotId?: ComponentSlotId;
  triggerType?: TriggerType;
  flowExecution?: 'Sequential' | 'Parallel' | 'Conditional';
  isCompositeExpanded?: boolean;
  parentCompositeId?: string;
  exposedToSchema: boolean;
  // Optional specialized property payloads
  rotateProps?: RotateProperties;
  moveProps?: MoveProperties;
  trajectoryProps?: TrajectoryProperties;
  scaleProps?: ScaleProperties;
  animationProps?: AnimationProperties;
  appearanceProps?: AppearanceProperties;
}

export interface CanvasConnection {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  label: string;
  flowType: 'Sequential' | 'Parallel' | 'Conditional';
  conditionExpr?: string;
}

export interface SkillVersionEntry {
  version: string;
  releaseType: 'Major' | 'Minor' | 'Patch';
  date: string;
  author: string;
  summary: string;
  changes: string[];
  isDemoData: boolean;
  status: 'Published (Immutable)' | 'Draft';
}

export interface SkillCardItem {
  id: string;
  name: string;
  shortDescription: string;
  primaryBucket: PrimaryBucket;
  tags: string[];
  creator: string;
  creatorHandle: string;
  studio: string;
  latestVersion: string;
  compatibilitySummary: CompatibilityStatus;
  compatibilityDetail: string;
  featured?: boolean;
  verifiedIntegration?: boolean;
  forkCount: number;
  adoptedProjects: number;
  previewVisual: 'reward_reveal' | 'tap_select' | 'button_feedback' | 'tile_merge' | 'hint_hand' | 'streak_bar' | 'level_victory';
  versions: SkillVersionEntry[];
}

/** A saved working workspace. Playgrounds are distinct from reusable Skills. */
export interface Playground {
  id: string;
  name: string;
  skillId?: string;
  gameContext?: string;
  lastModified: string;
}

export type PreviewInteractionState =
  | 'Closed'
  | 'Opening'
  | 'Revealed'
  | 'Collecting'
  | 'Completed'
  | 'Interrupted'
  | 'Error';

export type EdgeCaseScenarioId =
  | 'normal'
  | 'no_tap'
  | 'repeated_taps'
  | 'skip_during_opening'
  | 'skip_during_collection'
  | 'missing_opening_anim'
  | 'missing_reward_asset'
  | 'invalid_quantity'
  | 'missing_destination'
  | 'host_collection_failure'
  | 'interrupted_interaction'
  | 'reduced_motion';

export interface EdgeCaseScenario {
  id: EdgeCaseScenarioId;
  label: string;
  category: 'Input & Timing' | 'Asset & Schema Validation' | 'Host Authority & Runtime';
  description: string;
  expectedBehavior: string;
  severity: 'Normal' | 'Debounce / Safe' | 'Validation Warning' | 'Validation Error' | 'Runtime Recovery';
}

export interface PlaygroundConfiguration {
  activeVersion: string;
  openingStyle: 'Pop' | 'Fast' | 'Slow' | 'Procedural Hinge';
  openingImplementation: 'animation_clip' | 'procedural_lid_pivot' | 'none_static';
  rewardQuantity: number;
  chestColorHex: string;
  chestGlowIntensity: number;
  trajectoryType: TrajectoryType;
  arcHeightPx: number;
  arcAngleDeg: number;
  durationMs: number;
  playbackSpeed: number;
  effectIntensity: number;
  audioEnabled: boolean;
  audioVolume: number;
  skipEnabled: boolean;
  reducedMotion: boolean;
  activeTrigger: TriggerType;
  activeEdgeCase: EdgeCaseScenarioId;
  presetName: string;
}
