import { createContext } from 'react';
import type { TrackingContextValue } from './types';

const ReactTrackingContext = createContext<Partial<TrackingContextValue>>({});

export default ReactTrackingContext;
