import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import useTracking from '../useTracking';

describe('useTracking', () => {
    it('does not throw an error if tracking context not present', () => {
        function ThrowMissingContext() {
            useTracking();
            return <div>hi</div>;
        }

        expect(() => {
            renderToString(<ThrowMissingContext />);
        }).not.toThrow();
    });

    it('dispatches tracking events from a useTracking hook tracking object', () => {
        const outerTrackingData = {
            page: 'Page'
        };

        const dispatch = vi.fn();

        function App() {
            const tracking = useTracking(outerTrackingData, { dispatch });

            expect(tracking.getTrackingData()).toEqual({
                page: 'Page'
            });

            return (
                <button
                    type="button"
                    onClick={() =>
                        tracking.trackEvent({
                            event: 'buttonClick'
                        })
                    }
                >
                    Click me
                </button>
            );
        }

        render(<App />);
        fireEvent.click(screen.getByRole('button'));
        expect(dispatch).toHaveBeenCalledWith({
            ...outerTrackingData,
            event: 'buttonClick'
        });
    });
});
