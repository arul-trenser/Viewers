import React, { ReactNode } from 'react';
import { nonWLModalities, WindowLevelActionMenu } from './WindowLevelActionMenu';

export function getWindowLevelActionMenu({
  viewportId,
  element,
  displaySets,
  servicesManager,
  commandsManager,
  verticalDirection,
  horizontalDirection,
}: withAppTypes<{
  viewportId: string;
  element: HTMLElement;
  displaySets: AppTypes.DisplaySet[];
}>): ReactNode {
  const { customizationService } = servicesManager.services;

  const { presets } = customizationService.get('cornerstone.windowLevelPresets');
  const colorbarProperties = customizationService.get('cornerstone.colorbar');
  const { volumeRenderingPresets, volumeRenderingQualityRange } = customizationService.get(
    'cornerstone.3dVolumeRendering'
  );

  const windowLevelActionMenu = customizationService.get('cornerstone.windowLevelActionMenu');
  const MenuComponent =
    windowLevelActionMenu && windowLevelActionMenu.content
      ? windowLevelActionMenu.content
      : WindowLevelActionMenu;

  const displaySetPresets = displaySets
    .filter(displaySet => presets[displaySet.Modality])
    .map(displaySet => {
      return { [displaySet.Modality]: presets[displaySet.Modality] };
    });

  const modalities = displaySets
    .map(displaySet => displaySet.Modality)
    .filter(modality => !nonWLModalities.includes(modality));

  if (modalities.length === 0) {
    return null;
  }

  return (
    <MenuComponent
      viewportId={viewportId}
      element={element}
      presets={displaySetPresets}
      verticalDirection={verticalDirection}
      horizontalDirection={horizontalDirection}
      commandsManager={commandsManager}
      servicesManager={servicesManager}
      colorbarProperties={colorbarProperties}
      displaySets={displaySets}
      volumeRenderingPresets={volumeRenderingPresets}
      volumeRenderingQualityRange={volumeRenderingQualityRange}
    />
  );
}
