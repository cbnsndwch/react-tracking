import { useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import merge from 'deepmerge';
import type { Options as DeepmergeOptions } from 'deepmerge';

import ReactTrackingContext from './ReactTrackingContext';
import dispatchTrackingEvent from './dispatchTrackingEvent';
import type { TrackingData, TrackingContextValue } from './types';

interface UseTrackingImplOptions {
    dispatch?: (data: TrackingData) => void;
    dispatchOnMount?:
        | boolean
        | ((contextData: TrackingData) => TrackingData | null);
    process?: (data: TrackingData) => TrackingData | null;
    mergeOptions?: DeepmergeOptions;
}

export default function useTrackingImpl(
    trackingData: TrackingData | ((...args: unknown[]) => TrackingData),
    options?: UseTrackingImplOptions
): TrackingContextValue {
    const { tracking } = useContext(ReactTrackingContext);
    const latestData = useRef(trackingData);
    const latestOptions = useRef(options);

    useEffect(() => {
        latestData.current = trackingData;
        latestOptions.current = options;
    });

    const {
        dispatch = dispatchTrackingEvent,
        dispatchOnMount = false,
        process
    } = useMemo(() => latestOptions.current || {}, []);

    const getProcessFn = useCallback(
        () => tracking && tracking.process,
        [tracking]
    );

    const getOwnTrackingData = useCallback(() => {
        const data = latestData.current;
        const ownTrackingData = typeof data === 'function' ? data() : data;
        return ownTrackingData || {};
    }, []);

    const getTrackingDataFn = useCallback(() => {
        const contextGetTrackingData =
            (tracking && tracking.getTrackingData) || getOwnTrackingData;

        return () =>
            contextGetTrackingData === getOwnTrackingData
                ? getOwnTrackingData()
                : merge(
                      contextGetTrackingData(),
                      getOwnTrackingData(),
                      (latestOptions.current || ({} as UseTrackingImplOptions))
                          .mergeOptions
                  );
    }, [getOwnTrackingData, tracking]);

    const getTrackingDispatcher = useCallback(() => {
        const contextDispatch = (tracking && tracking.dispatch) || dispatch;
        return (data?: TrackingData) =>
            contextDispatch(
                merge(
                    getOwnTrackingData(),
                    data || {},
                    (latestOptions.current || ({} as UseTrackingImplOptions))
                        .mergeOptions
                )
            );
    }, [getOwnTrackingData, tracking, dispatch]);

    const trackEvent = useCallback(
        (data?: TrackingData) => {
            getTrackingDispatcher()(data);
        },
        [getTrackingDispatcher]
    );

    useEffect(() => {
        const contextProcess = getProcessFn();
        const getTrackingData = getTrackingDataFn();

        if (contextProcess && process) {
            console.error(
                '[react-tracking] options.process should be defined once on a top-level component'
            );
        }

        if (
            typeof contextProcess === 'function' &&
            typeof dispatchOnMount === 'function'
        ) {
            trackEvent(
                merge(
                    contextProcess(getOwnTrackingData()) || {},
                    dispatchOnMount(getTrackingData()) || {},
                    (latestOptions.current || ({} as UseTrackingImplOptions))
                        .mergeOptions
                )
            );
        } else if (typeof contextProcess === 'function') {
            const processed = contextProcess(getOwnTrackingData());
            if (processed || dispatchOnMount === true) {
                trackEvent(processed!);
            }
        } else if (typeof dispatchOnMount === 'function') {
            trackEvent(dispatchOnMount(getTrackingData())!);
        } else if (dispatchOnMount === true) {
            trackEvent();
        }
    }, [
        getOwnTrackingData,
        getProcessFn,
        getTrackingDataFn,
        trackEvent,
        dispatchOnMount,
        process
    ]);

    return useMemo(
        () => ({
            tracking: {
                dispatch: getTrackingDispatcher(),
                getTrackingData: getTrackingDataFn(),
                process: getProcessFn() || process
            }
        }),
        [getTrackingDispatcher, getTrackingDataFn, getProcessFn, process]
    );
}
