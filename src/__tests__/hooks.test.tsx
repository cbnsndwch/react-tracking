import { describe, it, expect, vi, beforeEach } from 'vitest';
import React, { useContext, useEffect, useState } from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';

const dispatchTrackingEvent = vi.fn();
vi.mock('../dispatchTrackingEvent', () => ({
    default: (...args: unknown[]) => dispatchTrackingEvent(...args)
}));

import track, { useTracking } from '..';
import ReactTrackingContext from '../ReactTrackingContext';

const testDataContext = { testDataContext: true };
const testData = { testData: true };
const dispatch = vi.fn();
const testState = { booleanState: true };

describe('hooks', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('defaults mostly everything', () => {
        function TestDefaults({ children }: { children: React.ReactNode }) {
            const { Track } = useTracking({}, { process: () => null });
            return <Track>{children}</Track>;
        }

        function Child() {
            const { trackEvent } = useTracking();

            useEffect(() => {
                trackEvent({ test: true });
            }, [trackEvent]);

            return <>hi</>;
        }

        render(
            <TestDefaults>
                <Child />
            </TestDefaults>
        );

        expect(dispatchTrackingEvent).toHaveBeenCalledTimes(1);
        expect(dispatchTrackingEvent).toHaveBeenCalledWith({ test: true });
    });

    it('defaults to dispatchTrackingEvent when no dispatch function passed in to options', () => {
        const testPageData = { page: 'TestPage' };

        function TestPage() {
            useTracking(testPageData, { dispatchOnMount: true });
            return null;
        }

        render(<TestPage />);

        expect(dispatchTrackingEvent).toHaveBeenCalledWith({
            ...testPageData
        });
    });

    it('accepts a dispatch function in options', () => {
        function TestOptions() {
            const { trackEvent } = useTracking(testDataContext, { dispatch });

            const blah = () => {
                trackEvent(testData);
            };

            blah();
            return <div />;
        }

        render(<TestOptions />);

        expect(dispatchTrackingEvent).not.toHaveBeenCalled();
        expect(dispatch).toHaveBeenCalledWith({
            ...testDataContext,
            ...testData
        });
    });

    it('will use dispatch fn passed in from further up in context', () => {
        const testChildData = { page: 'TestChild' };

        function TestOptions({ children }: { children: React.ReactNode }) {
            const { Track } = useTracking(testDataContext, { dispatch });
            return <Track>{children}</Track>;
        }

        function TestChild() {
            useTracking(testChildData, { dispatchOnMount: true });
            return <div />;
        }

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
        const mockDispatch = vi.fn();
        const testData1 = { key: { x: 1, y: 1 } };
        const testData2 = { key: { x: 2, z: 2 }, page: 'TestDeepMerge' };

        function TestData1({ children }: { children: React.ReactNode }) {
            const { Track } = useTracking(testData1, {
                dispatch: mockDispatch
            });
            return <Track>{children}</Track>;
        }

        function TestData3() {
            const { Track } = useTracking(
                { key: { x: 3, y: 3 } },
                { dispatchOnMount: true }
            );
            return (
                <Track>
                    <div />
                </Track>
            );
        }

        function TestData2() {
            const { Track } = useTracking(testData2);
            return (
                <Track>
                    <TestData3 />
                </Track>
            );
        }

        render(
            <TestData1>
                <TestData2 />
            </TestData1>
        );

        expect(mockDispatch).toHaveBeenCalledWith({
            page: 'TestDeepMerge',
            key: { x: 3, y: 3, z: 2 }
        });
    });

    it('will call dispatchOnMount as a function', () => {
        const testDispatchOnMount = { test: true };
        const dispatchOnMount = vi.fn(() => ({ dom: true }));

        function TestComponent() {
            useTracking(testDispatchOnMount, { dispatch, dispatchOnMount });
            return null;
        }

        render(<TestComponent />);

        expect(dispatchOnMount).toHaveBeenCalledWith(testDispatchOnMount);
        expect(dispatch).toHaveBeenCalledWith({ dom: true, test: true });
    });

    it('will dispatch a pageview event on mount on class component', () => {
        function App({ children }: { children: React.ReactNode }) {
            const { Track } = useTracking(
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
            );
            return <Track>{children}</Track>;
        }

        function Page() {
            useTracking({ page: 'Page' });
            return <div>Page</div>;
        }

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

    it('will dispatch a pageview event on mount on functional component', () => {
        function App({ children }: { children: React.ReactNode }) {
            const { Track } = useTracking(
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
            );
            return <Track>{children}</Track>;
        }

        function Page() {
            useTracking({ page: 'Page' });
            return <div>Page</div>;
        }

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
        function App({ children }: { children: React.ReactNode }) {
            const { Track } = useTracking(
                { topLevel: true },
                {
                    dispatch,
                    process: () => null
                }
            );
            return <Track>{children}</Track>;
        }

        function Page() {
            useTracking({ page: 'Page' });
            return <div>Page</div>;
        }

        render(
            <App>
                <Page />
            </App>
        );

        expect(dispatch).not.toHaveBeenCalled();
    });

    it('should not dispatch a pageview event on mount if process returns falsy value', () => {
        function App({ children }: { children: React.ReactNode }) {
            const { Track } = useTracking(
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
            );
            return <Track>{children}</Track>;
        }

        function Page() {
            useTracking({});
            return <div>Page</div>;
        }

        render(
            <App>
                <Page />
            </App>
        );

        expect(dispatch).not.toHaveBeenCalled();
    });

    it('will dispatch a top level pageview event on every page and component specific event on mount', () => {
        function App({ children }: { children: React.ReactNode }) {
            const { Track } = useTracking(
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
            );
            return <Track>{children}</Track>;
        }

        function Page1() {
            useTracking({ page: 'Page1' });
            return <div>Page</div>;
        }

        function Page2() {
            useTracking(
                { page: 'Page2' },
                { dispatchOnMount: () => ({ page2specific: true }) }
            );
            return <div>Page</div>;
        }

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
        function App({ children }: { children: React.ReactNode }) {
            const { Track } = useTracking(
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
            );
            return <Track>{children}</Track>;
        }

        function Page({ runtimeData }: { runtimeData: boolean }) {
            useTracking({ page: 'Page', runtimeData });
            return <div>Page</div>;
        }

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
        function App({ children }: { children: React.ReactNode }) {
            const { Track } = useTracking(
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
            );
            return <Track>{children}</Track>;
        }

        function Page({ children }: { children: React.ReactNode }) {
            const { Track } = useTracking({ page: 'Page' });
            return <Track>{children}</Track>;
        }

        function Nested({ children }: { children: React.ReactNode }) {
            const { Track } = useTracking({ view: 'View' });
            return <Track>{children}</Track>;
        }

        function Button() {
            const { trackEvent } = useTracking({ region: 'Button' });

            const handleClick = () => {
                trackEvent({ event: 'buttonClick' });
            };

            return (
                <button type="button" onClick={handleClick}>
                    Click me!
                </button>
            );
        }

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

    it('dispatches state data when components contain state', () => {
        function TestOptions() {
            const [booleanState] = useState(true);
            const { trackEvent } = useTracking(testDataContext, { dispatch });

            const exampleMethod = () => {
                trackEvent({ booleanState });
            };

            exampleMethod();
            return <div />;
        }

        render(<TestOptions />);

        expect(dispatchTrackingEvent).not.toHaveBeenCalled();
        expect(dispatch).toHaveBeenCalledWith({
            ...testDataContext,
            ...testState
        });
    });

    it('can read tracking data from getTrackingData()', () => {
        const mockReader = vi.fn();

        function TestOptions({
            children
        }: {
            children: React.ReactNode;
            onProps?: string;
        }) {
            const { Track } = useTracking({ ...testDataContext });
            return <Track>{children}</Track>;
        }

        function TestChild() {
            const { getTrackingData } = useTracking();
            mockReader(getTrackingData());
            return <>hi</>;
        }

        render(
            <TestOptions onProps="yes">
                <TestChild />
            </TestOptions>
        );

        expect(mockReader).toHaveBeenCalledTimes(1);
        expect(mockReader).toHaveBeenCalledWith({
            ...testDataContext
        });

        expect(dispatchTrackingEvent).not.toHaveBeenCalled();
    });

    it('logs a console error when there is already a process defined on context', () => {
        const consoleError = vi
            .spyOn(console, 'error')
            .mockImplementation(() => {});
        const process = () => null;

        function NestedComponent() {
            const { Track } = useTracking({}, { process });
            return (
                <Track>
                    <div />
                </Track>
            );
        }

        function Intermediate() {
            return (
                <div>
                    <NestedComponent />
                </div>
            );
        }

        function TestComponent() {
            const { Track } = useTracking({}, { process });
            return (
                <Track>
                    <div>
                        <Intermediate />
                    </div>
                </Track>
            );
        }

        render(<TestComponent />);

        expect(consoleError).toHaveBeenCalledTimes(1);
        expect(consoleError).toHaveBeenCalledWith(
            '[react-tracking] options.process should be defined once on a top-level component'
        );

        consoleError.mockRestore();
    });

    it('will dispatch different data if props changed', () => {
        function Top({
            data,
            children
        }: {
            data: number;
            children: React.ReactNode;
        }) {
            const { Track } = useTracking(() => ({ data }));
            return <Track>{children}</Track>;
        }

        function Page() {
            const { Track, trackEvent } = useTracking({ page: 'Page' });

            const handleClick = () => {
                trackEvent({ event: 'buttonClick' });
            };

            return (
                <Track>
                    <button
                        data-testid="clicker"
                        type="button"
                        onClick={handleClick}
                    >
                        Click Me
                    </button>
                </Track>
            );
        }

        function App() {
            const [data, setData] = useState(1);
            const { Track } = useTracking({}, { dispatch });

            return (
                <Track>
                    <div>
                        <button type="button" onClick={() => setData(2)}>
                            Update
                        </button>
                        <Top data={data}>
                            <Page />
                        </Top>
                    </div>
                </Track>
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

    it('provides passed in tracking data immediately', () => {
        function Foo() {
            const { getTrackingData } = useTracking({ seeMe: true });
            expect(getTrackingData()).toStrictEqual({ seeMe: true });
            return null;
        }

        render(<Foo />);
    });

    it('does not cause unnecessary updates due to context changes', () => {
        let innerRenderCount = 0;
        let getLatestTrackingData: () => Record<string, unknown>;

        function OuterComponent({
            children,
            trackedProp
        }: {
            children: React.ReactNode;
            trackedProp: number;
        }) {
            const { Track } = useTracking({ trackedProp });
            return <Track>{children}</Track>;
        }

        const MiddleComponent = React.memo(
            ({
                children,
                middleProp
            }: {
                children: React.ReactNode;
                middleProp: string;
            }) => {
                const { Track } = useTracking({ middleProp });
                return <Track>{children}</Track>;
            },
            (prev, next) => prev.middleProp === next.middleProp
        );

        function InnerComponent({ innerProps }: { innerProps: string }) {
            const { Track, getTrackingData } = useTracking({ innerProps });
            innerRenderCount += 1;
            getLatestTrackingData = getTrackingData;
            return <Track>{innerProps}</Track>;
        }

        function App() {
            const [count, setCount] = useState(0);
            const { Track } = useTracking({ count });

            return (
                <Track>
                    <div>
                        <button
                            onClick={() => setCount(c => c + 1)}
                            type="button"
                        >
                            Update Props
                        </button>
                        <OuterComponent trackedProp={count}>
                            <MiddleComponent middleProp="middleProp">
                                <InnerComponent innerProps="a" />
                            </MiddleComponent>
                        </OuterComponent>
                    </div>
                </Track>
            );
        }

        render(<App />);

        fireEvent.click(screen.getByText('Update Props'));
        fireEvent.click(screen.getByText('Update Props'));

        expect(getLatestTrackingData!()).toStrictEqual({
            count: 2,
            trackedProp: 2,
            middleProp: 'middleProp',
            innerProps: 'a'
        });

        expect(innerRenderCount).toEqual(1);
    });

    it('does not cause unnecessary dispatches due to object literals passed to useTracking', () => {
        const trackRenders = vi.fn();

        function App() {
            const [_clickCount, setClickCount] = useState(0);

            useEffect(() => {
                trackRenders();
            });

            useTracking(
                {},
                {
                    dispatch,
                    dispatchOnMount: () => ({ test: true })
                }
            );

            return (
                <div>
                    <button
                        onClick={() => setClickCount(c => c + 1)}
                        type="button"
                    >
                        Update
                    </button>
                </div>
            );
        }

        render(<App />);

        const button = screen.getByRole('button');
        fireEvent.click(button);
        fireEvent.click(button);
        fireEvent.click(button);

        expect(trackRenders).toHaveBeenCalledTimes(4);
        expect(dispatch).toHaveBeenCalledTimes(1);
        expect(dispatch).toHaveBeenLastCalledWith({
            test: true
        });
    });

    it('dispatches the correct data if props change', () => {
        function App({ data }: { data?: string }) {
            const { trackEvent } = useTracking(
                { data: data || '' },
                {
                    dispatch,
                    dispatchOnMount: true
                }
            );

            const handleClick = () => {
                trackEvent({ event: 'click' });
            };

            return (
                <div>
                    <button onClick={handleClick} type="button">
                        Click
                    </button>
                </div>
            );
        }

        const { rerender } = render(<App />);

        expect(dispatch).toHaveBeenCalledWith({ data: '' });

        rerender(<App data="Updated data prop" />);
        fireEvent.click(screen.getByRole('button'));

        expect(dispatch).toHaveBeenCalledTimes(2);
        expect(dispatch).toHaveBeenLastCalledWith({
            event: 'click',
            data: 'Updated data prop'
        });
    });

    it('can interop with the HoC (where HoC is top-level)', () => {
        const mockDispatch = vi.fn();
        const testData1 = { key: { x: 1, y: 1 }, topLevel: 'hoc' };
        const testData2 = { key: { x: 2, z: 2 }, page: 'TestDeepMerge' };

        const TestData1 = track(testData1, { dispatch: mockDispatch })(
            ({ children }: { children: React.ReactNode }) => <>{children}</>
        );

        function TestData3() {
            const { Track } = useTracking(
                { key: { x: 3, y: 3 } },
                { dispatchOnMount: true }
            );
            return (
                <Track>
                    <div />
                </Track>
            );
        }

        function TestData2() {
            const { Track } = useTracking(testData2);
            return (
                <Track>
                    <TestData3 />
                </Track>
            );
        }

        render(
            <TestData1>
                <TestData2 />
            </TestData1>
        );

        expect(mockDispatch).toHaveBeenCalledWith({
            topLevel: 'hoc',
            page: 'TestDeepMerge',
            key: { x: 3, y: 3, z: 2 }
        });
    });

    it('can interop with HoC (where Hook is top-level)', () => {
        const mockDispatch = vi.fn();
        const testData1 = { key: { x: 1, y: 1 }, topLevel: 'hook' };
        const testData2 = { key: { x: 2, z: 2 }, page: 'TestDeepMerge' };

        function TestData1({ children }: { children: React.ReactNode }) {
            const { Track } = useTracking(testData1, {
                dispatch: mockDispatch
            });
            return <Track>{children}</Track>;
        }

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

        expect(mockDispatch).toHaveBeenCalledWith({
            topLevel: 'hook',
            page: 'TestDeepMerge',
            key: { x: 3, y: 3, z: 2 }
        });
    });

    it('root context items are accessible to children', () => {
        function Child() {
            const trackingContext = useContext(ReactTrackingContext);
            expect(Object.keys(trackingContext.tracking!)).toEqual([
                'dispatch',
                'getTrackingData',
                'process'
            ]);
            return <div />;
        }

        function App() {
            const { Track } = useTracking();
            return (
                <Track>
                    <Child />
                </Track>
            );
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

    it('dispatches tracking event from async function', async () => {
        const message = 'test';

        function Page() {
            const [state, setState] = useState<{ data?: string }>({});
            const { trackEvent } = useTracking();

            const handleAsyncAction = async () => {
                const value = await Promise.resolve(message);
                trackEvent({
                    label: 'async action',
                    status: 'success',
                    value
                });
                return value;
            };

            const executeAction = async () => {
                const data = await handleAsyncAction();
                setState({ data });
            };

            return (
                <>
                    <button type="button" onClick={executeAction}>
                        Go
                    </button>
                    <div data-testid="output">{state.data}</div>
                </>
            );
        }

        render(<Page />);

        await act(async () => {
            fireEvent.click(screen.getByRole('button'));
        });

        expect(screen.getByTestId('output').textContent).toEqual(message);
        expect(dispatchTrackingEvent).toHaveBeenCalledTimes(1);
        expect(dispatchTrackingEvent).toHaveBeenCalledWith({
            label: 'async action',
            status: 'success',
            value: message
        });
    });

    it('handles rejected async function', async () => {
        const message = 'error';

        function Page() {
            const [state, setState] = useState<{ data?: string }>({});
            const { trackEvent } = useTracking();

            const handleAsyncAction = () => Promise.reject(message);

            const executeAction = async () => {
                try {
                    const data = await handleAsyncAction();
                    setState({ data });
                } catch (error) {
                    setState({ data: error as string });
                    trackEvent({
                        label: 'async action',
                        status: 'failed'
                    });
                }
            };

            return (
                <>
                    <button type="button" onClick={executeAction}>
                        Go
                    </button>
                    <div data-testid="output">{state.data}</div>
                </>
            );
        }

        render(<Page />);

        await act(async () => {
            fireEvent.click(screen.getByRole('button'));
        });

        expect(screen.getByTestId('output').textContent).toEqual(message);
        expect(dispatchTrackingEvent).toHaveBeenCalledTimes(1);
        expect(dispatchTrackingEvent).toHaveBeenCalledWith({
            label: 'async action',
            status: 'failed'
        });
    });
});
