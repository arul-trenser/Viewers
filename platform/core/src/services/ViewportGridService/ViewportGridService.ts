import { PubSubService } from '../_shared/pubSubServiceInterface';

class ViewportGridService extends PubSubService {
  public static readonly EVENTS = {
    ACTIVE_VIEWPORT_ID_CHANGED: 'event::activeviewportidchanged',
    LAYOUT_CHANGED: 'event::layoutChanged',
    GRID_STATE_CHANGED: 'event::gridStateChanged',
    GRID_SIZE_CHANGED: 'event::gridSizeChanged',
    VIEWPORTS_READY: 'event::viewportsReady',
  };

  public static REGISTRATION = {
    name: 'viewportGridService',
    altName: 'ViewportGridService',
    create: ({ configuration = {} }) => {
      return new ViewportGridService();
    },
  };

  serviceImplementation = {};
  presentationIdProviders: Map<
    string,
    (id: string, { viewport, viewports, isUpdatingSameViewport }) => unknown
  >;

  constructor() {
    super(ViewportGridService.EVENTS);
    this.serviceImplementation = {};
    this.presentationIdProviders = new Map();
  }

  public addPresentationIdProvider(
    id: string,
    provider: (id: string, { viewport, viewports, isUpdatingSameViewport }) => unknown
  ): void {
    this.presentationIdProviders.set(id, provider);
  }

  public getPresentationId(id, { viewport, viewports }) {
    const isUpdatingSameViewport = [...viewports.values()].some(
      v =>
        v.displaySetInstanceUIDs?.toString() === viewport.displaySetInstanceUIDs?.toString() &&
        v.viewportId === viewport.viewportId
    );

    const provider = this.presentationIdProviders.get(id);
    if (provider) {
      const result = provider(id, { viewport, viewports, isUpdatingSameViewport });
      return result;
    }
    return null;
  }

  public getPresentationIds({ viewport, viewports }) {
    // Use the keys of the Map to get all registered provider IDs
    const registeredPresentationProviders = Array.from(this.presentationIdProviders.keys());

    return registeredPresentationProviders.reduce((acc, id) => {
      const value = this.getPresentationId(id, { viewport, viewports });
      if (value !== null) {
        acc[id] = value;
      }
      return acc;
    }, {});
  }

  public setServiceImplementation({
    getState: getStateImplementation,
    setActiveViewportId: setActiveViewportIdImplementation,
    setDisplaySetsForViewports: setDisplaySetsForViewportsImplementation,
    setLayout: setLayoutImplementation,
    reset: resetImplementation,
    onModeExit: onModeExitImplementation,
    set: setImplementation,
    getNumViewportPanes: getNumViewportPanesImplementation,
    setViewportIsReady: setViewportIsReadyImplementation,
  }): void {
    if (getStateImplementation) {
      this.serviceImplementation._getState = getStateImplementation;
    }
    if (setActiveViewportIdImplementation) {
      this.serviceImplementation._setActiveViewport = setActiveViewportIdImplementation;
    }
    if (setDisplaySetsForViewportsImplementation) {
      this.serviceImplementation._setDisplaySetsForViewports =
        setDisplaySetsForViewportsImplementation;
    }
    if (setLayoutImplementation) {
      this.serviceImplementation._setLayout = setLayoutImplementation;
    }
    if (resetImplementation) {
      this.serviceImplementation._reset = resetImplementation;
    }
    if (onModeExitImplementation) {
      this.serviceImplementation._onModeExit = onModeExitImplementation;
    }
    if (setImplementation) {
      this.serviceImplementation._set = setImplementation;
    }
    if (getNumViewportPanesImplementation) {
      this.serviceImplementation._getNumViewportPanes = getNumViewportPanesImplementation;
    }

    if (setViewportIsReadyImplementation) {
      this.serviceImplementation._setViewportIsReady = setViewportIsReadyImplementation;
    }
  }

  public publishViewportsReady() {
    this._broadcastEvent(this.EVENTS.VIEWPORTS_READY, {});
  }

  public setActiveViewportId(id: string) {
    this.serviceImplementation._setActiveViewport(id);

    // Use queueMicrotask to delay the event broadcast
    queueMicrotask(() => {
      this._broadcastEvent(this.EVENTS.ACTIVE_VIEWPORT_ID_CHANGED, {
        viewportId: id,
      });
    });
  }

  public getState() {
    return this.serviceImplementation._getState();
  }

  public setViewportIsReady(viewportId, callback) {
    this.serviceImplementation._setViewportIsReady(viewportId, callback);
  }

  public getActiveViewportId() {
    const state = this.getState();
    return state.activeViewportId;
  }

  public setViewportGridSizeChanged() {
    const state = this.getState();
    this._broadcastEvent(this.EVENTS.GRID_SIZE_CHANGED, {
      state,
    });
  }

  public setDisplaySetsForViewport(props) {
    // Just update a single viewport, but use the multi-viewport update for it.
    this.setDisplaySetsForViewports([props]);
  }

  public async setDisplaySetsForViewports(props) {
    await this.serviceImplementation._setDisplaySetsForViewports(props);
    const state = this.getState();
    const viewports = [];

    for (const viewport of props) {
      const updatedViewport = state.viewports.get(viewport.viewportId);
      if (updatedViewport) {
        viewports.push(updatedViewport);
      } else {
        console.warn("ViewportGridService::Didn't find updated viewport", viewport);
      }
    }

    // Use queueMicrotask to delay the event broadcast
    queueMicrotask(() => {
      this._broadcastEvent(ViewportGridService.EVENTS.GRID_STATE_CHANGED, {
        state,
        viewports,
      });
    });
  }

  /**
   * Retrieves the display set instance UIDs for a given viewport.
   * @param viewportId The ID of the viewport.
   * @returns An array of display set instance UIDs.
   */
  public getDisplaySetsUIDsForViewport(viewportId: string) {
    const state = this.getState();
    const viewport = state.viewports.get(viewportId);
    return viewport?.displaySetInstanceUIDs;
  }

  /**
   *
   * @param numCols, numRows - the number of columns and rows to apply
   * @param findOrCreateViewport is a function which takes the
   *    index position of the viewport, the position id, and a set of
   *    options that is initially provided as {} (eg to store intermediate state)
   *    The function returns a viewport object to use at the given position.
   */
  public setLayout({
    numCols,
    numRows,
    layoutOptions,
    layoutType = 'grid',
    activeViewportId = undefined,
    findOrCreateViewport = undefined,
    isHangingProtocolLayout = false,
  }) {
    this.serviceImplementation._setLayout({
      numCols,
      numRows,
      layoutOptions,
      layoutType,
      activeViewportId,
      findOrCreateViewport,
      isHangingProtocolLayout,
    });
    this._broadcastEvent(this.EVENTS.LAYOUT_CHANGED, {
      numCols,
      numRows,
    });
  }

  public reset() {
    this.serviceImplementation._reset();
  }

  /**
   * The onModeExit must set the state of the viewport grid to a standard/clean
   * state.  To implement store/recover of the viewport grid, perform
   * a state store in the mode or extension onModeExit, and recover that
   * data if appropriate in the onModeEnter of the mode or extension.
   */
  public onModeExit(): void {
    this.serviceImplementation._onModeExit();
  }

  public set(state) {
    this.serviceImplementation._set(state);

    // Use queueMicrotask to delay the event broadcast
    queueMicrotask(() => {
      this._broadcastEvent(this.EVENTS.GRID_STATE_CHANGED, {
        state,
      });
    });
  }

  public getNumViewportPanes() {
    return this.serviceImplementation._getNumViewportPanes();
  }

  public getLayoutOptionsFromState(
    state: any
  ): { x: number; y: number; width: number; height: number }[] {
    return Array.from(state.viewports.entries()).map(([_, viewport]) => {
      return {
        x: viewport.x,
        y: viewport.y,
        width: viewport.width,
        height: viewport.height,
      };
    });
  }
}

export default ViewportGridService;
