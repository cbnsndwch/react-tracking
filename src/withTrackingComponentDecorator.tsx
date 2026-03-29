import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import hoistNonReactStatics from 'hoist-non-react-statics';

import ReactTrackingContext from './ReactTrackingContext';
import useTrackingImpl from './useTrackingImpl';
import type { TrackingDataInput, TrackingOptions } from './types';

export default function withTrackingComponentDecorator(
    trackingData: TrackingDataInput = {},
    { forwardRef: shouldForwardRef = false, ...options }: TrackingOptions = {}
) {
    return (DecoratedComponent: React.ComponentType<any>) => {
        const decoratedComponentName =
            DecoratedComponent.displayName ||
            DecoratedComponent.name ||
            'Component';

        function WithTracking(
            props: Record<string, unknown>,
            ref?: React.Ref<unknown>
        ) {
            const latestProps = useRef(props);

            useEffect(() => {
                latestProps.current = props;
            });

            const trackingDataFn = useCallback(
                () =>
                    typeof trackingData === 'function'
                        ? trackingData(latestProps.current)
                        : trackingData,
                []
            );

            const contextValue = useTrackingImpl(trackingDataFn, options);

            const trackingProp = useMemo(
                () => ({
                    trackEvent: contextValue.tracking.dispatch,
                    getTrackingData: contextValue.tracking.getTrackingData
                }),
                [contextValue]
            );

            return (
                <ReactTrackingContext.Provider value={contextValue}>
                    {React.createElement(DecoratedComponent, {
                        ...props,
                        ...(shouldForwardRef ? { ref } : {}),
                        tracking: trackingProp
                    })}
                </ReactTrackingContext.Provider>
            );
        }

        if (shouldForwardRef) {
            const forwarded = React.forwardRef(WithTracking);
            forwarded.displayName = `WithTracking(${decoratedComponentName})`;
            hoistNonReactStatics(forwarded, DecoratedComponent);
            return forwarded;
        }

        WithTracking.displayName = `WithTracking(${decoratedComponentName})`;
        hoistNonReactStatics(WithTracking, DecoratedComponent);
        return WithTracking;
    };
}
