import { describe, it, expect, vi } from 'vitest';
import makeClassMemberDecorator from '../makeClassMemberDecorator';

describe('makeClassMemberDecorator', () => {
    it('is a decorator (exports a function, that returns a function)', () => {
        expect(typeof makeClassMemberDecorator).toBe('function');

        const decorated = makeClassMemberDecorator(() => () => {});
        expect(typeof decorated).toBe('function');
    });

    it('properly decorates class methods (value descriptor)', () => {
        const mockDecorator = vi.fn((x: Function) => x);
        const thingSpy = vi.fn();

        const decorator = makeClassMemberDecorator(mockDecorator);
        const descriptor = decorator({}, 'thing', {
            configurable: true,
            enumerable: false,
            value: thingSpy
        });

        expect(mockDecorator).toHaveBeenCalledTimes(1);
        expect(descriptor.value).toBe(thingSpy);
    });

    it('properly decorates field syntax (initializer descriptor)', () => {
        const mockDecorator = vi.fn((x: Function) => x);
        const fieldSpy = vi.fn();
        const target = {};

        const decorator = makeClassMemberDecorator(mockDecorator);
        const descriptor = decorator(target, 'field', {
            configurable: true,
            enumerable: true,
            initializer: () => fieldSpy
        });

        // The getter should exist
        expect(descriptor.get).toBeDefined();

        // Create an instance-like object to test the getter
        const instance = Object.create(target);
        const result = descriptor.get!.call(instance);

        expect(mockDecorator).toHaveBeenCalledTimes(1);
        expect(result).toBeDefined();
    });

    it('throws when called on unsupported descriptor', () => {
        const decorator = makeClassMemberDecorator(() => () => {});
        expect(() => decorator({}, 'test', {})).toThrow();
    });

    it('returns null when accessing decorated field directly on prototype', () => {
        const mockDecorator = vi.fn((x: Function) => x);
        const target = {};

        const decorator = makeClassMemberDecorator(mockDecorator);
        const descriptor = decorator(target, 'field', {
            configurable: true,
            enumerable: true,
            initializer: () => vi.fn()
        });

        // When called on the prototype itself (this === target), returns undefined
        const result = descriptor.get!.call(target);
        expect(result).toBeUndefined();
    });
});
