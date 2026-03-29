import { describe, it, expect } from 'vitest';
import * as index from '..';

describe('react-tracking', () => {
    it('exports withTracking', () => {
        expect(index.withTracking).toBeDefined();
    });

    it('exports trackEvent', () => {
        expect(index.trackEvent).toBeDefined();
    });

    it('exports useTracking', () => {
        expect(index.useTracking).toBeDefined();
    });

    it('exports track', () => {
        expect(index.track).toBeDefined();
    });

    it('exports default function', () => {
        expect(typeof index.default).toBe('function');
    });

    it('track and default export are the same', () => {
        expect(index.track).toBe(index.default);
    });

    it('exports deepmerge', () => {
        expect(index.deepmerge).toBeDefined();
    });
});
