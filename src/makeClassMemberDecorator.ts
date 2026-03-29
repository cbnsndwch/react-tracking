type DecoratorFn = (decoratedFn: Function) => Function;

export interface MemberDescriptor {
    configurable?: boolean;
    enumerable?: boolean;
    value?: Function;
    get?: () => Function;
    initializer?: () => Function;
}

export default function makeClassMemberDecorator(decorate: DecoratorFn) {
    return function decorateClassMember(
        target: object,
        name: string,
        descriptor: MemberDescriptor
    ): MemberDescriptor {
        const { configurable, enumerable, value, get, initializer } =
            descriptor;

        if (value) {
            return {
                configurable,
                enumerable,
                value: decorate(value)
            };
        }

        // support lazy initializer
        if (get || initializer) {
            return {
                configurable,
                enumerable,
                get(this: unknown) {
                    // This happens if someone accesses the
                    // property directly on the prototype
                    if (this === target) {
                        return undefined;
                    }

                    const resolvedValue = initializer
                        ? Reflect.apply(initializer, this, [])
                        : Reflect.apply(get!, this, []);
                    const decoratedValue = decorate(resolvedValue).bind(this);

                    Reflect.defineProperty(this as object, name, {
                        configurable,
                        enumerable,
                        value: decoratedValue
                    });

                    return decoratedValue;
                }
            };
        }

        throw new Error(
            'called makeClassMemberDecorator on unsupported descriptor'
        );
    };
}
