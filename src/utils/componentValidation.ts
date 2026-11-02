import { ComponentCategory, ComponentDefinition, ComponentInstance } from '../types/platform';
import { COMPONENT_DEFINITIONS } from '../data/componentDefinitions';

export function validateUniqueDefinitionIds(defs: ComponentDefinition[]): string[] {
  const ids = defs.map((d) => d.definitionId);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  return dupes;
}

export function validateDefinitionCategory(def: ComponentDefinition): boolean {
  return ['Game Objects & Props', 'Characters & Entities', 'UI & Interaction Elements', 'Rewards & Collectibles', 'Visual & Audio Elements', 'Runtime References'].includes(def.category);
}

export function validatePropertySchema(def: ComponentDefinition): string[] {
  const errors: string[] = [];
  def.exposedProperties.forEach((p) => {
    if (!p.id || !p.label || !p.type) errors.push(`${def.definitionId}:${p.id || 'unknown'} missing required schema fields`);
    if (p.type === 'number' && p.min !== undefined && p.max !== undefined && p.min > p.max) errors.push(`${def.definitionId}:${p.id} invalid range`);
  });
  return errors;
}

export function validateInstanceReference(instance: ComponentInstance): boolean {
  return COMPONENT_DEFINITIONS.some((d) => d.definitionId === instance.definitionId);
}

export function collectionAnchorIsAsset(def: ComponentDefinition): boolean {
  return def.definitionId === 'comp_collection_anchor' && def.acceptedAssetTypes.length > 0;
}

export function validateUnsupportedPropertyExposure(def: ComponentDefinition): string[] {
  // Properties with capabilityRequirement that cannot be satisfied are flagged by caller; here just ensure capabilityRequirement present for constrained props.
  return def.exposedProperties
    .filter((p) => p.capabilityRequirement && p.capabilityRequirement.trim().length === 0)
    .map((p) => `${def.definitionId}:${p.id} empty capability requirement`);
}

export function validateComponentInstancesIndependence(a: ComponentInstance, b: ComponentInstance): boolean {
  return a.instanceId !== b.instanceId;
}