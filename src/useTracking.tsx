import { useCallback, useDebugValue, useMemo } from 'react';

import ReactTrackingContext from './ReactTrackingContext';
import useTrackingImpl from './useTrackingImpl';
import type { TrackingData, TrackingDataInput, TrackingOptions } from './types';

interface UseTrackingResult {
    Track: React.FC<{ children: React.ReactNode }>;
    getTrackingData: () => TrackingData;
    trackEvent: (data?: TrackingData) => void;
}

export default function useTracking(
    trackingData: TrackingDataInput = {},
    options?: Omit<TrackingOptions, 'forwardRef'>
): UseTrackingResult {
    const contextValue = useTrackingImpl(trackingData as TrackingData, options);

    const Track = useCallback(
        ({ children }: { children: React.ReactNode }) => (
            <ReactTrackingContext.Provider value={contextValue}>
                {children}
            </ReactTrackingContext.Provider>
        ),
        [contextValue]
    );

    useDebugValue(contextValue.tracking.getTrackingData, getTrackingData =>
        getTrackingData()
    );

    return useMemo(
        () => ({
            Track,
            getTrackingData: contextValue.tracking.getTrackingData,
            trackEvent: contextValue.tracking.dispatch
        }),
        [contextValue, Track]
    );
}
