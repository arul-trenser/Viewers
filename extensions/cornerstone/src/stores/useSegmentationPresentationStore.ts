import { create } from 'zustand';
import { SegmentationPresentation } from '../types/Presentation';
import { JOIN_STR } from './presentationUtils';
import { getViewportOrientationFromImageOrientationPatient } from '../utils/getViewportOrientationFromImageOrientationPatient';

/**
 * The keys are the presentationId
 */
type SegmentationPresentationStore = {
  segmentationPresentationStore: Record<string, SegmentationPresentation>;
  setSegmentationPresentation: (presentationId: string, value: SegmentationPresentation) => void;
  clearSegmentationPresentationStore: () => void;
  getPresentationId: (
    id: string,
    options: {
      viewport: AppTypes.ViewportGrid.Viewport;
      viewports: AppTypes.ViewportGrid.Viewports;
      isUpdatingSameViewport: boolean;
      servicesManager: AppTypes.ServicesManager;
    }
  ) => string | undefined;
  addSegmentationPresentation: (
    presentationId: string,
    segmentationPresentation: SegmentationPresentation,
    { servicesManager }: { servicesManager: AppTypes.ServicesManager }
  ) => void;
};

/**
 * Gets the segmentationPresentationId for a viewport.
 * Used for retrieving segmentation information based on:
 * - displaySetOption[0].options (including id if present)
 * - displaySetUIDs
 * - a unique index if the generated key is already displayed
 *
 * @param {string} id - The ID to check
 * @param {Object} options - The options object
 * @param {Object} options.viewport - The current viewport
 * @param {Map} options.viewports - The list of all viewports
 * @returns {string|undefined} The segmentationPresentationId or undefined
 */
const getSegmentationPresentationId = (
  id: string,
  {
    viewport,
    servicesManager,
  }: {
    viewport: AppTypes.ViewportGrid.Viewport;
    viewports: AppTypes.ViewportGrid.Viewports;
    isUpdatingSameViewport: boolean;
    servicesManager: AppTypes.ServicesManager;
  }
): string | undefined => {
  if (id !== 'segmentationPresentationId') {
    return;
  }

  if (!viewport?.viewportOptions || !viewport.displaySetInstanceUIDs?.length) {
    return;
  }

  const { displaySetInstanceUIDs, viewportOptions } = viewport;

  let orientation = viewportOptions.orientation;

  if (!orientation) {
    // calculate it from the viewport sample image
    const displaySet = servicesManager.services.displaySetService.getDisplaySetByUID(
      displaySetInstanceUIDs[0]
    );
    const sampleImage = displaySet.images?.[0];
    const imageOrientationPatient = sampleImage?.ImageOrientationPatient;

    orientation = getViewportOrientationFromImageOrientationPatient(imageOrientationPatient);
  }

  const segmentationPresentationArr = [orientation || 'acquisition'];

  segmentationPresentationArr.push(...displaySetInstanceUIDs);
  // Probably we don't need this for segmentation presentation id since we want
  // the segmentation to appear on all the viewports with the same displayset i guess?

  // addUniqueIndex(
  //   segmentationPresentationArr,
  //   'segmentationPresentationId',
  //   viewports,
  //   isUpdatingSameViewport
  // );

  return segmentationPresentationArr.join(JOIN_STR);
};

// Stores a map from `segmentationPresentationId` to a Presentation object so that
// an OHIFCornerstoneViewport can be redisplayed with the same Segmentation
export const useSegmentationPresentationStore = create<SegmentationPresentationStore>(set => ({
  segmentationPresentationStore: {},
  clearSegmentationPresentationStore: () => set({ segmentationPresentationStore: {} }, false),
  addSegmentationPresentation: (
    presentationId: string,
    segmentationPresentation: SegmentationPresentation,
    { servicesManager }: { servicesManager: AppTypes.ServicesManager }
  ) =>
    set(
      state => ({
        segmentationPresentationStore: {
          ...state.segmentationPresentationStore,
          [presentationId]: segmentationPresentation,
        },
      }),
      false
    ),
  setSegmentationPresentation: (presentationId: string, value: SegmentationPresentation) =>
    set(
      state => ({
        segmentationPresentationStore: {
          ...state.segmentationPresentationStore,
          [presentationId]: value,
        },
      }),
      false
    ),
  getPresentationId: getSegmentationPresentationId,
}));
