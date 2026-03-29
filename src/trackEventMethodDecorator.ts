import type { TrackingData, TrackingProp } from './types';
import makeClassMemberDecorator from './makeClassMemberDecorator';

type TrackEventDataInput =
    | TrackingData
    | ((
          props: Record<string, unknown>,
          state: unknown,
          args: unknown[],
          promiseArgs: unknown[]
      ) => TrackingData | null);

interface DecoratedThis {
    props?: { tracking?: TrackingProp } & Record<string, unknown>;
    state?: unknown;
}

export default function trackEventMethodDecorator(
    trackingData: TrackEventDataInput = {}
) {
    return makeClassMemberDecorator(
        (decoratedFn: Function) =>
            function (this: DecoratedThis, ...args: unknown[]) {
                const trackEvent = (...promiseArguments: unknown[]) => {
                    if (
                        this.props &&
                        this.props.tracking &&
                        typeof this.props.tracking.trackEvent === 'function'
                    ) {
                        const thisTrackingData =
                            typeof trackingData === 'function'
                                ? trackingData(
                                      this.props,
                                      this.state,
                                      args,
                                      promiseArguments
                                  )
                                : trackingData;
                        if (thisTrackingData) {
                            this.props.tracking.trackEvent(thisTrackingData);
                        }
                    }
                };

                const fn = Reflect.apply(decoratedFn, this, args);
                if (Promise && Promise.resolve(fn) === fn) {
                    return fn
                        .then(trackEvent.bind(this))
                        .then(() => fn)
                        .catch((error: Error) => {
                            trackEvent({}, error);
                            throw error;
                        });
                }
                trackEvent();
                return fn;
            }
    );
}
