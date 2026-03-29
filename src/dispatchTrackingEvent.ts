import type { TrackingData } from './types';

declare global {
    interface Window {
        dataLayer?: TrackingData[];
    }
}

export default function dispatchTrackingEvent(data: TrackingData): void {
    if (typeof window !== 'undefined' && Object.keys(data).length > 0) {
        (window.dataLayer = window.dataLayer || []).push(data);
    }
}
