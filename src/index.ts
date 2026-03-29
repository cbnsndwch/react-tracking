import track from './trackingHoC';

export { default as deepmerge } from 'deepmerge';

export { default as withTracking } from './withTrackingComponentDecorator';
export { default as trackEvent } from './trackEventMethodDecorator';
export { default as useTracking } from './useTracking';

export type { TrackingPropType } from './TrackingPropType';

export type {
    TrackingData,
    TrackingDataInput,
    TrackingOptions,
    TrackingProp,
    TrackingContextValue,
    WithTrackingProps
} from './types';

export { track };
export default track;
