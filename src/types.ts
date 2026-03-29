import type { Options as DeepmergeOptions } from 'deepmerge';
import type { ComponentType } from 'react';

export type TrackingData = Record<string, unknown>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TrackingDataFn = (props: any) => TrackingData;

export type TrackingDataInput = TrackingData | TrackingDataFn;

export interface TrackingOptions {
    dispatch?: (data: TrackingData) => void;
    dispatchOnMount?:
        | boolean
        | ((contextData: TrackingData) => TrackingData | null);
    process?: (data: TrackingData) => TrackingData | null;
    forwardRef?: boolean;
    mergeOptions?: DeepmergeOptions;
}

export interface TrackingProp {
    trackEvent: (data?: TrackingData) => void;
    getTrackingData: () => TrackingData;
}

export interface TrackingContextValue {
    tracking: {
        dispatch: (data?: TrackingData) => void;
        getTrackingData: () => TrackingData;
        process?: ((data: TrackingData) => TrackingData | null) | null;
    };
}

export type WithTrackingProps<P = Record<string, unknown>> = P & {
    tracking: TrackingProp;
};

export type TrackingDecorator = <
    P extends Record<string, unknown>,
    C extends ComponentType<P>
>(
    component: C
) => C;
