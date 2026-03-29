# Acknowledgements

This project is a fork of [nytimes/react-tracking](https://github.com/nytimes/react-tracking), originally created by [Jeremy Gayed](https://github.com/tizmagik) and contributors at **The New York Times Company**.

## Original License

The original work was licensed under the Apache License, Version 2.0. A copy of that license is reproduced below in compliance with its terms.

---

````markdown
Copyright (c) 2017 The New York Times Company

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this library except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
````

---

## Changes from the original

This fork has been substantially rewritten and is released under the [MIT License](LICENSE). Key changes include:

- Full rewrite from JavaScript to TypeScript
- Replaced Babel + Rollup build pipeline with Vite 8 (library mode)
- Replaced Jest + Enzyme test suite with Vitest + React Testing Library
- Removed `@decorator` syntax support for class method tracking
- Removed runtime PropTypes in favor of TypeScript types
- ESM-only distribution (no CommonJS)
- Replaced ESLint + Prettier with oxlint + oxfmt

## Original Contributors

- [Jeremy Gayed](https://github.com/tizmagik)
- [Nicole Baram](https://github.com/nicolehollyNYT)
- [Oleh Ziniak](https://github.com/oziniak)
- [Ivan Kravchenko](https://github.com/ivankravchenko)
- [Lukasz Szmit](https://github.com/lszm)
- [Bryan Gergen](https://github.com/bgergen)

And all other contributors to [nytimes/react-tracking](https://github.com/nytimes/react-tracking/graphs/contributors).
