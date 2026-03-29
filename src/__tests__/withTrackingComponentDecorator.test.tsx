import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import withTrackingComponentDecorator from '../withTrackingComponentDecorator';

const mockDispatchTrackingEvent = vi.fn();

vi.mock('../dispatchTrackingEvent', () => ({
    default: (...args: unknown[]) => mockDispatchTrackingEvent(...args)
}));

describe('withTrackingComponentDecorator', () => {
    beforeEach(() => {
        mockDispatchTrackingEvent.mockClear();
    });

    it('is a decorator (exports a function, that returns a function)', () => {
        expect(typeof withTrackingComponentDecorator).toBe('function');

        const decorated = withTrackingComponentDecorator();
        expect(typeof decorated).toBe('function');
    });

    describe('with process option', () => {
        it('process function gets called', () => {
            const process = vi.fn(() => null);

            const ParentTestComponent = withTrackingComponentDecorator(
                {},
                { process }
            )(({ children }: { children?: React.ReactNode }) => (
                <>{children}</>
            ));

            const TestComponent = withTrackingComponentDecorator({ page: 1 })(
                () => null
            );

            render(
                <ParentTestComponent>
                    <TestComponent />
                </ParentTestComponent>
            );

            expect(process).toHaveBeenCalled();
            expect(mockDispatchTrackingEvent).not.toHaveBeenCalled();
        });
    });

    describe('with process option from parent and dispatchOnMount option on component', () => {
        it('dispatches only once when process and dispatchOnMount functions are passed', () => {
            const process = vi.fn(() => ({ event: 'pageView' }));
            const dispatchOnMount = vi.fn(() => ({ specificEvent: true }));

            const ParentTestComponent = withTrackingComponentDecorator(
                {},
                { process }
            )(({ children }: { children?: React.ReactNode }) => (
                <>{children}</>
            ));

            const TestComponent = withTrackingComponentDecorator(
                { page: 1 },
                { dispatchOnMount }
            )(() => null);

            render(
                <ParentTestComponent>
                    <TestComponent />
                </ParentTestComponent>
            );

            expect(process).toHaveBeenCalled();
            expect(dispatchOnMount).toHaveBeenCalled();
            expect(mockDispatchTrackingEvent).toHaveBeenCalledWith({
                page: 1,
                event: 'pageView',
                specificEvent: true
            });
            expect(mockDispatchTrackingEvent).toHaveBeenCalledTimes(1);
        });
    });

    describe('with function trackingContext', () => {
        it('dispatches only once when process and dispatchOnMount functions are passed', () => {
            const process = vi.fn(() => ({ event: 'pageView' }));
            const dispatchOnMount = vi.fn(() => ({ specificEvent: true }));
            const trackingContext = vi.fn((p: any) => ({ page: p.page }));

            const ParentTestComponent = withTrackingComponentDecorator(
                {},
                { process }
            )(({ children }: { children?: React.ReactNode }) => (
                <>{children}</>
            ));

            const TestComponent = withTrackingComponentDecorator(
                trackingContext,
                {
                    dispatchOnMount
                }
            )(() => null);

            render(
                <ParentTestComponent>
                    <TestComponent page={1} />
                </ParentTestComponent>
            );

            expect(process).toHaveBeenCalled();
            expect(dispatchOnMount).toHaveBeenCalled();
            expect(trackingContext).toHaveBeenCalled();
            expect(mockDispatchTrackingEvent).toHaveBeenCalledWith({
                page: 1,
                event: 'pageView',
                specificEvent: true
            });
            expect(mockDispatchTrackingEvent).toHaveBeenCalledTimes(1);
        });
    });

    describe('with process from parent falsey and dispatchOnMount is true', () => {
        it('dispatches when process returns null and dispatchOnMount is true', () => {
            const process = vi.fn(() => null);

            const ParentTestComponent = withTrackingComponentDecorator(
                {},
                { process }
            )(({ children }: { children?: React.ReactNode }) => (
                <>{children}</>
            ));

            const TestComponent = withTrackingComponentDecorator(
                { page: 1 },
                { dispatchOnMount: true }
            )(() => null);

            render(
                <ParentTestComponent>
                    <TestComponent />
                </ParentTestComponent>
            );

            expect(process).toHaveBeenCalled();
            expect(mockDispatchTrackingEvent).toHaveBeenCalledWith({ page: 1 });
            expect(mockDispatchTrackingEvent).toHaveBeenCalledTimes(1);
        });
    });

    describe('with a prop called tracking that has two functions as keys', () => {
        it('passes tracking prop with trackEvent and getTrackingData', () => {
            const dummyData = { page: 1 };
            let trackingProp: any;

            const Inner = (props: any) => {
                trackingProp = props.tracking;
                return null;
            };

            const TestComponent =
                withTrackingComponentDecorator(dummyData)(Inner);
            render(<TestComponent />);

            expect(trackingProp).toBeDefined();
            expect(trackingProp).toHaveProperty('trackEvent');
            expect(trackingProp).toHaveProperty('getTrackingData');
            expect(typeof trackingProp.trackEvent).toBe('function');
            expect(typeof trackingProp.getTrackingData).toBe('function');
        });

        it('when trackEvent is called from props, it dispatches the event', () => {
            const dummyData = { page: 1 };
            let trackingProp: any;

            const Inner = (props: any) => {
                trackingProp = props.tracking;
                return null;
            };

            const TestComponent =
                withTrackingComponentDecorator(dummyData)(Inner);
            render(<TestComponent />);

            expect(mockDispatchTrackingEvent).not.toHaveBeenCalled();
            trackingProp.trackEvent(dummyData);
            expect(mockDispatchTrackingEvent).toHaveBeenCalledWith(dummyData);
        });

        it('when getTrackingData is called, it returns the data passed to the decorator', () => {
            const dummyData = { page: 1 };
            let trackingProp: any;

            const Inner = (props: any) => {
                trackingProp = props.tracking;
                return null;
            };

            const TestComponent =
                withTrackingComponentDecorator(dummyData)(Inner);
            render(<TestComponent />);

            expect(trackingProp.getTrackingData()).toMatchObject(dummyData);
        });
    });

    describe('hoist non react statics', () => {
        it("should hoist a class's static method when wrapped via HoC", () => {
            class StaticComponent extends React.Component {
                static someMethod() {
                    return 'test';
                }

                static someVar = 'test';

                render() {
                    return null;
                }
            }

            const DecoratedComponent = withTrackingComponentDecorator({
                page: 1
            })(StaticComponent);

            expect((DecoratedComponent as any).someMethod).toBeDefined();
            expect((DecoratedComponent as any).someMethod()).toEqual('test');
            expect((DecoratedComponent as any).someVar).toEqual('test');
        });
    });
});
