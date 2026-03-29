# @cbnsndwch/react-tracking

> **Fork Notice:** This is a modernized fork of [nytimes/react-tracking](https://github.com/nytimes/react-tracking). See [ACKNOWLEDGEMENTS.md](ACKNOWLEDGEMENTS.md) for attribution and license details.

Declarative tracking for React apps.

- React Hook (`useTracking`) and Higher-Order Component (`track()`) APIs
- Compartmentalize tracking concerns to individual components
- Analytics platform agnostic
- Full TypeScript support with bundled type declarations
- ESM-only, tree-shakeable

## Installation

```sh
npm install @cbnsndwch/react-tracking
# or
pnpm add @cbnsndwch/react-tracking
```

## Usage

```ts
import track, { useTracking } from '@cbnsndwch/react-tracking';
```

Both `track()` and `useTracking()` accept two arguments: `trackingData` and `options`.

- `trackingData` — the data to be tracked (or a function returning that data)
- `options` — an optional object with the following properties:
    - `dispatch` — a function to use instead of the default dispatch behavior. See [Custom dispatch](#custom-optionsdispatch-for-tracking-data) below.
    - `dispatchOnMount` — when `true`, dispatches tracking data when the component mounts. When a function, it is called with all contextual tracking data on initial render.
    - `process` — a function defined once at some top-level component, used for selectively dispatching tracking events based on each component's tracking data. See [Top level process](#top-level-optionsprocess) below.
    - `forwardRef` (HoC only) — when `true`, a ref on the wrapped component returns the underlying component instance. Default: `false`.
    - `mergeOptions` — [deepmerge options](https://github.com/TehShrike/deepmerge#options).

### `useTracking` Hook

The recommended API. Returns `trackEvent`, `getTrackingData`, and a `<Track />` provider component:

```tsx
import { useTracking } from '@cbnsndwch/react-tracking';

function FooPage() {
    const { Track, trackEvent } = useTracking({ page: 'FooPage' });

    return (
        <Track>
            <button onClick={() => trackEvent({ action: 'click' })}>
                Click Me
            </button>
        </Track>
    );
}
```

Wrap your returned markup with `<Track />` to pass contextual tracking data to child components via [deepmerge]. Leaf components that don't have tracked children can skip `<Track />`:

```tsx
import { useTracking } from '@cbnsndwch/react-tracking';

function Child() {
    const { trackEvent } = useTracking();

    return (
        <button onClick={() => trackEvent({ action: 'childClick' })}>
            Click
        </button>
    );
}

function FooPage() {
    const { Track, trackEvent } = useTracking({ page: 'FooPage' });

    return (
        <Track>
            <Child />
            <button onClick={() => trackEvent({ action: 'click' })}>
                Click Me
            </button>
        </Track>
    );
}
```

In this example, clicking the button in `Child` dispatches:

```json
{ "page": "FooPage", "action": "childClick" }
```

### `track()` Higher-Order Component

The `track()` export wraps a component and injects a `tracking` prop with `trackEvent()` and `getTrackingData()` methods:

```tsx
import track from '@cbnsndwch/react-tracking';

function FooPage({ tracking }) {
    return (
        <button onClick={() => tracking.trackEvent({ action: 'click' })}>
            Click Me
        </button>
    );
}

export default track({ page: 'FooPage' })(FooPage);
```

### Custom `options.dispatch()` for tracking data

By default, tracking data is pushed to `window.dataLayer[]` (see [src/dispatchTrackingEvent.ts](src/dispatchTrackingEvent.ts)), which works well with Google Tag Manager.

Override this by passing a `dispatch` function at a top-level component:

```tsx
import { useTracking } from '@cbnsndwch/react-tracking';

export default function App({ children }) {
    const { Track } = useTracking(
        {},
        { dispatch: data => window.myCustomDataLayer.push(data) }
    );

    return <Track>{children}</Track>;
}
```

Every child component will inherit this dispatch function.

### `options.dispatchOnMount`

#### As a boolean

Dispatches tracking data when a component mounts — useful for page-level tracking:

```tsx
function FooPage() {
    useTracking({ page: 'FooPage' }, { dispatchOnMount: true });
    return <div>Foo</div>;
}
```

#### As a function

Called with all contextual tracking data on mount. The returned object is [deepmerge]d with context data and dispatched:

```tsx
function FooPage() {
    useTracking(
        { page: 'FooPage' },
        { dispatchOnMount: contextData => ({ event: 'pageDataReady' }) }
    );
    return <div>Foo</div>;
}
```

Dispatches: `{ event: 'pageDataReady', page: 'FooPage' }`

### Top level `options.process`

Define an `options.process` function once at a top-level component to implicitly dispatch events based on each component's tracking data. Return a falsy value to skip dispatch:

```tsx
function App() {
    const { Track } = useTracking(
        {},
        {
            process: ownTrackingData =>
                ownTrackingData.page ? { event: 'pageview' } : null
        }
    );

    return (
        <Track>
            <Page1 />
            <Page2 />
        </Track>
    );
}

function Page1() {
    useTracking({ page: 'Page1' });
}

function Page2() {
    useTracking({});
}
```

When `Page1` mounts, `{ page: 'Page1', event: 'pageview' }` is dispatched. `Page2` dispatches nothing.

### Dynamic Tracking Data

Pass a function to compute tracking data from props at render time:

```tsx
import track from '@cbnsndwch/react-tracking';

const FooPage = track(props => ({
    page: props.isNew ? 'new' : 'existing'
}))(({ tracking }) => (
    <button onClick={() => tracking.trackEvent({ action: 'click' })}>
        Click
    </button>
));
```

### `getTrackingData()`

Access all contextual tracking data accumulated up the component tree:

```tsx
import { useMemo } from 'react';
import { useTracking } from '@cbnsndwch/react-tracking';

function AdComponent() {
    const randomId = useMemo(() => Math.floor(Math.random() * 100), []);
    const { getTrackingData } = useTracking({ page_view_id: randomId });
    const { page_view_id } = getTrackingData();

    return <Ad pageViewId={page_view_id} />;
}
```

### Tracking Data Format

There are no restrictions on the shape of tracking data objects. **The format is a contract between your app and the consumer of the tracking data.**

This library merges tracking data objects (via [deepmerge]) as they flow through your React component hierarchy into a single object sent to the tracking agent.

### TypeScript

Types are bundled with the package — no need for `@types/*`. All public APIs are fully typed.

### Deepmerge

You can use the copy of deepmerge bundled with this library:

```ts
import { deepmerge } from '@cbnsndwch/react-tracking';
```

## License

[MIT](LICENSE)

This project is a fork of [nytimes/react-tracking](https://github.com/nytimes/react-tracking), originally licensed under Apache 2.0. See [ACKNOWLEDGEMENTS.md](ACKNOWLEDGEMENTS.md).

[deepmerge]: https://www.npmjs.com/package/deepmerge
