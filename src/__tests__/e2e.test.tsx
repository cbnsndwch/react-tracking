import { describe, it, expect, vi, beforeEach } from 'vitest';
import React, { useContext, useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

const dispatchTrackingEvent = vi.fn();
vi.mock('../dispatchTrackingEvent', () => ({
    default: (...args: unknown[]) => dispatchTrackingEvent(...args)
}));

import track, { useTracking } from '..';
import ReactTrackingContext from '../ReactTrackingContext';

const testDataContext = { testDataContext: true };
const testData = { testData: true };
const dispatch = vi.fn();

describe('e2e', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('defaults mostly everything', () => {
        const TestDefaults = track(null as unknown as undefined, {
            process: () => null
        })(({ children }: { children: React.ReactNode }) => <>{children}</>);

        function Child({
            tracking
        }: {
            tracking: { trackEvent: (d: Record<string, unknown>) => void };
        }) {
            React.useEffect(() => {
                tracking.trackEvent({ test: true });
            }, [tracking]);
            return <>hi</>;
        }

        const TrackedChild = track()(Child);

        render(
            <TestDefaults>
                <TrackedChild />
            </TestDefaults>
        );

        expect(dispatchTrackingEvent).toHaveBeenCalledTimes(1);
        expect(dispatchTrackingEvent).toHaveBeenCalledWith({ test: true });
    });

    it('allows tracking errors', () => {
        function TestPage({
            tracking
        }: {
            tracking: { trackEvent: (d: Record<string, unknown>) => void };
        }) {
            React.useEffect(() => {
                tracking.trackEvent({ test: new Error('my crazy error') });
            }, [tracking]);
            return <>hi</>;
        }

        const TrackedTestPage = track(null as unknown as undefined, {
            mergeOptions: {
                isMergeableObject: (obj: unknown) => !(obj instanceof Error)
            }
        })(TestPage);

        render(<TrackedTestPage />);

        expect(dispatchTrackingEvent).toHaveBeenCalledTimes(1);
        expect(dispatchTrackingEvent).toHaveBeenCalledWith({
            test: new Error('my crazy error')
        });
    });

    it('defaults to dispatchTrackingEvent when no dispatch function passed in to options', () => {
        const testPageData = { page: 'TestPage' };

        const TestPage = track(testPageData, { dispatchOnMount: true })(
            () => null
        );

        render(<TestPage />);

        expect(dispatchTrackingEvent).toHaveBeenCalledWith({
            ...testPageData
        });
    });

    it('accepts a dispatch function in options', () => {
        function TestOptions({
            tracking
        }: {
            tracking: { trackEvent: (d: Record<string, unknown>) => void };
        }) {
            const blah = () => {
                tracking.trackEvent(testData);
            };
            blah();
            return <div />;
        }

        const TrackedTestOptions = track(testDataContext, { dispatch })(
            TestOptions
        );

        render(<TrackedTestOptions />);

        expect(dispatchTrackingEvent).not.toHaveBeenCalled();
        expect(dispatch).toHaveBeenCalledWith({
            ...testDataContext,
            ...testData
        });
    });

    it('will use dispatch fn passed in from further up in context', () => {
        const testChildData = { page: 'TestChild' };

        const TestOptions = track(testDataContext, { dispatch })(
            ({ children }: { children: React.ReactNode }) => <>{children}</>
        );

        const TestChild = track(testChildData, { dispatchOnMount: true })(
            () => <div />
        );

        render(
            <TestOptions>
                <TestChild />
            </TestOptions>
        );

        expect(dispatch).toHaveBeenCalledWith({
            ...testDataContext,
            ...testChildData
        });
    });

    it('will deep-merge tracking data', () => {
        const testData1 = { key: { x: 1, y: 1 } };
        const testData2 = { key: { x: 2, z: 2 }, page: 'TestDeepMerge' };

        const TestData1 = track(testData1)(
            ({ children }: { children: React.ReactNode }) => <>{children}</>
        );

        const TestData3 = track(
            { key: { x: 3, y: 3 } },
            { dispatchOnMount: true }
        )(() => <div />);

        const TestData2 = track(testData2)(() => <TestData3 />);

        render(
            <TestData1>
                <TestData2 />
            </TestData1>
        );

        expect(dispatchTrackingEvent).toHaveBeenCalledWith({
            page: 'TestDeepMerge',
            key: { x: 3, y: 3, z: 2 }
        });
    });

    it('will call dispatchOnMount as a function', () => {
        const testDispatchOnMount = { test: true };
        const dispatchOnMount = vi.fn(() => ({ dom: true }));

        const TestComponent = track(testDispatchOnMount, {
            dispatch,
            dispatchOnMount
        })(() => null);

        render(<TestComponent />);

        expect(dispatchOnMount).toHaveBeenCalledWith(testDispatchOnMount);
        expect(dispatch).toHaveBeenCalledWith({ dom: true, test: true });
    });

    it('will dispatch a pageview event on mount on functional component', () => {
        const App = track(
            { topLevel: true },
            {
                dispatch,
                process: data => {
                    if (data.page) {
                        return { event: 'pageView' };
                    }
                    return null;
                }
            }
        )(({ children }: { children: React.ReactNode }) => <>{children}</>);

        const Page = track({ page: 'Page' })(() => <div>Page</div>);

        render(
            <App>
                <Page />
            </App>
        );

        expect(dispatch).toHaveBeenCalledWith({
            topLevel: true,
            event: 'pageView',
            page: 'Page'
        });
    });

    it("should not dispatch a pageview event on mount if there's no page property on tracking object", () => {
        const App = track(
            { topLevel: true },
            {
                dispatch,
                process: () => null
            }
        )(({ children }: { children: React.ReactNode }) => <>{children}</>);

        const Page = track({ page: 'Page' })(() => <div>Page</div>);

        render(
            <App>
                <Page />
            </App>
        );

        expect(dispatch).not.toHaveBeenCalled();
    });

    it('should not dispatch a pageview event on mount if process returns falsy value', () => {
        const App = track(
            { topLevel: true },
            {
                dispatch,
                process: data => {
                    if (data.page) {
                        return { event: 'pageView' };
                    }
                    return false as unknown as null;
                }
            }
        )(({ children }: { children: React.ReactNode }) => <>{children}</>);

        const Page = track({})(() => <div>Page</div>);

        render(
            <App>
                <Page />
            </App>
        );

        expect(dispatch).not.toHaveBeenCalled();
    });

    it('will dispatch a top level pageview event on every page and component specific event on mount', () => {
        const App = track(
            { topLevel: true },
            {
                dispatch,
                process: data => {
                    if (data.page) {
                        return { event: 'pageView' };
                    }
                    return null;
                }
            }
        )(({ children }: { children: React.ReactNode }) => <>{children}</>);

        const Page1 = track({ page: 'Page1' })(() => <div>Page</div>);

        const Page2 = track(
            { page: 'Page2' },
            { dispatchOnMount: () => ({ page2specific: true }) }
        )(() => <div>Page</div>);

        render(
            <App>
                <Page1 />
                <Page2 />
            </App>
        );

        expect(dispatch).toHaveBeenCalledTimes(2);
        expect(dispatch).toHaveBeenCalledWith({
            page: 'Page1',
            event: 'pageView',
            topLevel: true
        });
        expect(dispatch).toHaveBeenCalledWith({
            page: 'Page2',
            event: 'pageView',
            topLevel: true,
            page2specific: true
        });
    });

    it('process works with trackingData as a function', () => {
        const App = track(
            { topLevel: true },
            {
                dispatch,
                process: data => {
                    if (data.page) {
                        return { event: 'pageView' };
                    }
                    return null;
                }
            }
        )(({ children }: { children: React.ReactNode }) => <>{children}</>);

        const Page = track((props: { runtimeData: boolean }) => ({
            page: 'Page',
            runtimeData: props.runtimeData
        }))(() => <div>Page</div>);

        render(
            <App>
                <Page runtimeData />
            </App>
        );

        expect(dispatch).toHaveBeenCalledWith({
            event: 'pageView',
            page: 'Page',
            runtimeData: true,
            topLevel: true
        });
    });

    it("doesn't dispatch pageview for nested components without page tracking data", () => {
        const App = track(
            { topLevel: true },
            {
                dispatch,
                process: data => {
                    if (data.page) {
                        return { event: 'pageView' };
                    }
                    return null;
                }
            }
        )(({ children }: { children: React.ReactNode }) => <>{children}</>);

        const Page = track({ page: 'Page' })(
            ({ children }: { children: React.ReactNode }) => <>{children}</>
        );

        const Nested = track({ view: 'View' })(
            ({ children }: { children: React.ReactNode }) => <>{children}</>
        );

        function ButtonInner({
            tracking
        }: {
            tracking: { trackEvent: (d: Record<string, unknown>) => void };
        }) {
            return (
                <button
                    type="button"
                    onClick={() =>
                        tracking.trackEvent({ event: 'buttonClick' })
                    }
                >
                    Click me!
                </button>
            );
        }

        const Button = track({ region: 'Button' })(ButtonInner);

        render(
            <App>
                <Page>
                    <Nested>
                        <Button />
                    </Nested>
                </Page>
            </App>
        );

        fireEvent.click(screen.getByText('Click me!'));

        expect(dispatch).toHaveBeenCalledWith({
            event: 'pageView',
            page: 'Page',
            topLevel: true
        });
        expect(dispatch).toHaveBeenCalledWith({
            event: 'buttonClick',
            page: 'Page',
            region: 'Button',
            view: 'View',
            topLevel: true
        });
        expect(dispatch).toHaveBeenCalledTimes(2);
    });

    it('can read tracking data from props.tracking.getTrackingData()', () => {
        const mockReader = vi.fn();

        const TestOptions = track((props: { onProps: string }) => ({
            onProps: props.onProps,
            ...testDataContext
        }))(({ children }: { children: React.ReactNode }) => <>{children}</>);

        function TestChildInner({
            tracking
        }: {
            tracking: { getTrackingData: () => Record<string, unknown> };
        }) {
            mockReader(tracking.getTrackingData());
            return <>hi</>;
        }

        const TestChild = track({ child: true })(TestChildInner);

        render(
            <TestOptions onProps="yes">
                <TestChild />
            </TestOptions>
        );

        expect(mockReader).toHaveBeenCalledTimes(1);
        expect(mockReader).toHaveBeenCalledWith({
            child: true,
            onProps: 'yes',
            ...testDataContext
        });

        expect(dispatchTrackingEvent).not.toHaveBeenCalled();
    });

    it('logs a console error when there is already a process defined on context', () => {
        const consoleError = vi
            .spyOn(console, 'error')
            .mockImplementation(() => {});
        const process = () => null;

        const NestedComponent = track({}, { process })(() => <div />);

        function Intermediate() {
            return (
                <div>
                    <NestedComponent />
                </div>
            );
        }

        const TestComponent = track(
            {},
            { process }
        )(() => (
            <div>
                <Intermediate />
            </div>
        ));

        render(<TestComponent />);

        expect(consoleError).toHaveBeenCalledTimes(1);
        expect(consoleError).toHaveBeenCalledWith(
            '[react-tracking] options.process should be defined once on a top-level component'
        );

        consoleError.mockRestore();
    });

    it('will dispatch different data if props changed', () => {
        const Top = track(
            (props: { data: number; children: React.ReactNode }) => ({
                data: props.data
            })
        )(({ children }: { children: React.ReactNode }) => <>{children}</>);

        function PageInner({
            tracking
        }: {
            tracking: { trackEvent: (d: Record<string, unknown>) => void };
        }) {
            return (
                <button
                    data-testid="clicker"
                    type="button"
                    onClick={() =>
                        tracking.trackEvent({ event: 'buttonClick' })
                    }
                >
                    Click Me
                </button>
            );
        }

        const Page = track({ page: 'Page' })(PageInner);

        function App() {
            const [data, setData] = useState(1);

            const TrackedApp = React.useMemo(
                () =>
                    track(
                        {},
                        { dispatch }
                    )(({ children }: { children: React.ReactNode }) => (
                        <>{children}</>
                    )),
                []
            );

            return (
                <TrackedApp>
                    <div>
                        <button type="button" onClick={() => setData(2)}>
                            Update
                        </button>
                        <Top data={data}>
                            <Page />
                        </Top>
                    </div>
                </TrackedApp>
            );
        }

        render(<App />);

        fireEvent.click(screen.getByTestId('clicker'));
        expect(dispatch).toHaveBeenCalledWith({
            data: 1,
            event: 'buttonClick',
            page: 'Page'
        });

        fireEvent.click(screen.getByRole('button', { name: 'Update' }));
        fireEvent.click(screen.getByTestId('clicker'));
        expect(dispatch).toHaveBeenCalledWith({
            data: 2,
            event: 'buttonClick',
            page: 'Page'
        });
    });

    it('does not cause unnecessary updates due to context changes', () => {
        let innerRenderCount = 0;

        const OuterComponent = track()(
            ({ children }: { children?: React.ReactNode }) => <>{children}</>
        );

        const MiddleInner = React.memo(
            ({
                children
            }: {
                children?: React.ReactNode;
                middleProp?: number;
            }) => <>{children}</>,
            (prev, next) => prev.middleProp === next.middleProp
        );
        const MiddleComponent = track()(MiddleInner);

        const InnerComponent = track()(() => {
            innerRenderCount += 1;
            return null;
        });

        function AppInner() {
            const [state, setState] = useState<{ count: number }>({ count: 0 });

            return (
                <div>
                    <button
                        onClick={() => setState({ count: state.count + 1 })}
                        type="button"
                    >
                        Update Props
                    </button>
                    <OuterComponent trackedProp={state}>
                        <MiddleComponent middleProp={1}>
                            <InnerComponent innerProps="a" />
                        </MiddleComponent>
                    </OuterComponent>
                </div>
            );
        }

        const App = track()(AppInner);

        render(<App />);

        fireEvent.click(screen.getByText('Update Props'));

        expect(innerRenderCount).toEqual(1);
    });

    it('root context items are accessible to children', () => {
        const App = track()(() => <Child />);

        function Child() {
            const trackingContext = useContext(ReactTrackingContext);
            expect(Object.keys(trackingContext.tracking!)).toEqual([
                'dispatch',
                'getTrackingData',
                'process'
            ]);
            return <div />;
        }

        render(<App />);
    });

    it('dispatches tracking events from a useTracking hook tracking object', () => {
        const outerTrackingData = {
            page: 'Page'
        };

        const Page = track(outerTrackingData, { dispatch })(
            ({ children }: { children: React.ReactNode }) => <>{children}</>
        );

        function Child() {
            const tracking = useTracking();

            expect(tracking.getTrackingData()).toEqual(outerTrackingData);

            return (
                <button
                    type="button"
                    onClick={() => {
                        tracking.trackEvent({ event: 'buttonClick' });
                    }}
                >
                    Click
                </button>
            );
        }

        render(
            <Page>
                <Child />
            </Page>
        );

        fireEvent.click(screen.getByRole('button'));

        expect(dispatch).toHaveBeenCalledWith({
            ...outerTrackingData,
            event: 'buttonClick'
        });
    });

    it('can access wrapped component by ref', () => {
        const focusFn = vi.fn();

        const Child = React.forwardRef(
            (
                _props: Record<string, unknown>,
                ref: React.Ref<{ focus: () => void }>
            ) => {
                React.useImperativeHandle(ref, () => ({ focus: focusFn }));
                return <>child</>;
            }
        );

        const TrackedChild = track({}, { forwardRef: true })(Child);

        function Parent() {
            const childRef = React.useRef<{ focus: () => void }>(null);

            React.useEffect(() => {
                childRef.current?.focus();
            }, []);

            return <TrackedChild ref={childRef} />;
        }

        render(<Parent />);

        expect(focusFn).toHaveBeenCalledTimes(1);
    });

    it('can establish tracking context with only hooks', () => {
        function MyButton() {
            const { trackEvent } = useTracking({ element: 'MyButton' });
            return (
                <button
                    type="button"
                    onClick={() => {
                        trackEvent({ event: 'buttonClick' });
                    }}
                >
                    Click me
                </button>
            );
        }

        function App() {
            const { Track } = useTracking(
                { page: 'App' },
                { dispatch, dispatchOnMount: true }
            );
            return (
                <Track>
                    <MyButton />
                </Track>
            );
        }

        render(<App />);
        fireEvent.click(screen.getByRole('button'));

        expect(dispatch).toHaveBeenCalledTimes(2);
        expect(dispatch).toHaveBeenCalledWith({
            page: 'App'
        });
        expect(dispatch).toHaveBeenCalledWith({
            page: 'App',
            event: 'buttonClick',
            element: 'MyButton'
        });
    });
});
