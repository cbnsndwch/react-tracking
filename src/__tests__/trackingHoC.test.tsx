import { describe, it, expect, vi } from 'vitest';

const wTCDmock = vi.fn(() => vi.fn());

vi.mock('../withTrackingComponentDecorator', () => ({
    default: wTCDmock
}));

describe('tracking HoC', () => {
    it('routes to withTrackingComponentDecorator for component wrapping', async () => {
        const { default: trackingHoC } = await import('../trackingHoC');
        const testData = { testClass: true };
        const options = {};

        trackingHoC(testData, options);

        expect(wTCDmock).toHaveBeenCalledWith(testData, options);
    });

    it('works on stateless functional components', async () => {
        const { default: trackingHoC } = await import('../trackingHoC');
        const testStateless = { testStateless: true };
        const options = {};

        function TestComponent() {
            return <div />;
        }

        const wrappedFn = vi.fn();
        wTCDmock.mockReturnValueOnce(wrappedFn);

        trackingHoC(testStateless, options)(TestComponent);

        expect(wTCDmock).toHaveBeenCalledWith(testStateless, options);
        expect(wrappedFn).toHaveBeenCalledWith(TestComponent);
    });
});
