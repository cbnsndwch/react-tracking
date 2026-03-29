import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('trackEventMethodDecorator', () => {
    let trackEventMethodDecorator: typeof import('../trackEventMethodDecorator').default;

    beforeEach(async () => {
        const mod = await import('../trackEventMethodDecorator');
        trackEventMethodDecorator = mod.default;
    });

    it('is a decorator (exports a function, that returns a function)', () => {
        expect(typeof trackEventMethodDecorator).toBe('function');

        const decorated = trackEventMethodDecorator();
        expect(typeof decorated).toBe('function');
    });

    it('properly calls trackEvent when trackingData is a plain object', () => {
        const dummyData = {};
        const trackEvent = vi.fn();
        const spyTestEvent = vi.fn();

        // Manually apply decorator to a value descriptor
        const decorator = trackEventMethodDecorator(dummyData);
        const descriptor = decorator({}, 'handleTestEvent', {
            configurable: true,
            enumerable: false,
            value: spyTestEvent
        });

        const instance = {
            props: { tracking: { trackEvent } }
        };

        descriptor.value!.call(instance, 'x');

        expect(trackEvent).toHaveBeenCalledWith(dummyData);
        expect(spyTestEvent).toHaveBeenCalledWith('x');
    });

    it('properly calls trackEvent when trackingData is a function', () => {
        const dummyData = {};
        const trackingData = vi.fn(() => dummyData);
        const trackEvent = vi.fn();
        const spyTestEvent = vi.fn();

        // Apply decorator to an initializer descriptor (field syntax)
        const decorator = trackEventMethodDecorator(trackingData);
        const target = {};
        const result = decorator(target, 'handleTestEvent', {
            configurable: true,
            enumerable: true,
            initializer: () => spyTestEvent
        });

        const instance = Object.create(target);
        instance.props = { tracking: { trackEvent } };

        // Access the getter to trigger decoration
        const decoratedFn = result.get!.call(instance);
        decoratedFn('x');

        expect(trackingData).toHaveBeenCalledTimes(1);
        expect(trackEvent).toHaveBeenCalledWith(dummyData);
        expect(spyTestEvent).toHaveBeenCalledWith('x');
    });

    it('properly passes through the correct arguments when trackingData is a function', () => {
        const dummyData = {};
        const trackingData = vi.fn(() => dummyData);
        const trackEvent = vi.fn();
        const eventData = 'eventData';
        const spyTestEvent = vi.fn(() => eventData);
        const dummyArgument = 'x';

        const decorator = trackEventMethodDecorator(trackingData);
        const target = {};
        const result = decorator(target, 'handleTestEvent', {
            configurable: true,
            enumerable: true,
            initializer: () => spyTestEvent
        });

        const instance = Object.create(target);
        instance.props = { tracking: { trackEvent } };
        instance.state = { myState: 'someState' };

        const decoratedFn = result.get!.call(instance);
        const returnValue = decoratedFn(dummyArgument);

        const trackingDataArguments = trackingData.mock.calls[0] as unknown[];

        expect(returnValue).toEqual(eventData);
        expect(trackingData).toHaveBeenCalledTimes(1);
        expect(trackingDataArguments[0]).toEqual(instance.props);
        expect(trackingDataArguments[1]).toEqual(instance.state);
        expect(Array.from(trackingDataArguments[2] as unknown[])).toEqual([
            dummyArgument
        ]);
        expect(trackEvent).toHaveBeenCalledWith(dummyData);
        expect(spyTestEvent).toHaveBeenCalledWith(dummyArgument);
    });

    it('properly passes through the correct arguments when the decorated method returns a promise', async () => {
        const dummyData = {};
        const trackingData = vi.fn(() => dummyData);
        const trackEvent = vi.fn();
        const dummyResolve = 'res';
        const spyTestEvent = vi.fn(() => Promise.resolve(dummyResolve));
        const dummyArgument = 'x';

        const decorator = trackEventMethodDecorator(trackingData);
        const target = {};
        const result = decorator(target, 'handleTestEvent', {
            configurable: true,
            enumerable: true,
            initializer: () => spyTestEvent
        });

        const instance = Object.create(target);
        instance.props = { tracking: { trackEvent } };
        instance.state = { myState: 'someState' };

        const decoratedFn = result.get!.call(instance);
        const returnValue = await decoratedFn(dummyArgument);

        const trackingDataArguments = trackingData.mock.calls[0] as unknown[];

        expect(returnValue).toEqual(dummyResolve);
        expect(trackingData).toHaveBeenCalledTimes(1);
        expect(trackingDataArguments[0]).toEqual(instance.props);
        expect(trackingDataArguments[1]).toEqual(instance.state);
        expect(Array.from(trackingDataArguments[2] as unknown[])).toEqual([
            dummyArgument
        ]);
        expect(trackingDataArguments[3]).toEqual([dummyResolve]);
        expect(trackEvent).toHaveBeenCalledWith(dummyData);
        expect(spyTestEvent).toHaveBeenCalledWith(dummyArgument);
    });

    [null, undefined].forEach(value => {
        it(`does not call trackEvent if the data is ${value}`, () => {
            const trackingData = vi.fn(() => value as null);
            const trackEvent = vi.fn();
            const spyTestEvent = vi.fn();

            const decorator = trackEventMethodDecorator(trackingData);
            const target = {};
            const result = decorator(target, 'handleTestEvent', {
                configurable: true,
                enumerable: true,
                initializer: () => spyTestEvent
            });

            const instance = Object.create(target);
            instance.props = { tracking: { trackEvent } };

            const decoratedFn = result.get!.call(instance);
            decoratedFn('x');

            expect(trackingData).toHaveBeenCalledTimes(1);
            expect(trackEvent).not.toHaveBeenCalled();
            expect(spyTestEvent).toHaveBeenCalledWith('x');
        });
    });

    it('properly calls trackData when an async method has resolved', async () => {
        const dummyData = {};
        const trackingData = vi.fn(() => dummyData);
        const trackEvent = vi.fn();
        let resolveTest!: (value?: unknown) => void;
        const spyTestEvent = vi.fn(
            () =>
                new Promise(resolve => {
                    resolveTest = resolve;
                })
        );

        const decorator = trackEventMethodDecorator(trackingData);
        const target = {};
        const result = decorator(target, 'handleTestEvent', {
            configurable: true,
            enumerable: true,
            initializer: () => spyTestEvent
        });

        const instance = Object.create(target);
        instance.props = { tracking: { trackEvent } };

        const decoratedFn = result.get!.call(instance);
        const promise = decoratedFn();

        expect(trackEvent).not.toHaveBeenCalled();
        resolveTest();
        await promise;
        expect(trackEvent).toHaveBeenCalledWith(dummyData);
    });

    it('calls tracking function when the async function throws and will rethrow the error', async () => {
        const dummyData = {};
        const trackingData = vi.fn(() => dummyData);
        const trackEvent = vi.fn();
        const spyTestEvent = vi.fn(
            () =>
                new Promise(() => {
                    throw new Error('test error');
                })
        );

        const decorator = trackEventMethodDecorator(trackingData);
        const target = {};
        const result = decorator(target, 'handleTestEvent', {
            configurable: true,
            enumerable: true,
            initializer: () => spyTestEvent
        });

        const instance = Object.create(target);
        instance.props = { tracking: { trackEvent } };

        const decoratedFn = result.get!.call(instance);

        try {
            await decoratedFn();
        } catch (error) {
            expect(trackEvent).toHaveBeenCalledWith(dummyData);
            const trackingDataArguments = trackingData.mock
                .calls[0] as unknown[];
            expect(trackingDataArguments[3]).toEqual([{}, error]);
            expect(error).toBeInstanceOf(Error);
        }
    });
});
