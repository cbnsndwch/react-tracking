import withTrackingComponentDecorator from './withTrackingComponentDecorator';
import type { TrackingDataInput, TrackingOptions } from './types';

export default function track(
    trackingData?: TrackingDataInput,
    options?: TrackingOptions
) {
    return withTrackingComponentDecorator(trackingData, options);
}
