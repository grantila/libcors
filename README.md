# libcors, of course

[![npm version][npm-image]][npm-url]
[![build status][travis-image]][travis-url]
[![coverage status][coverage-image]][coverage-url]
[![Language grade: JavaScript][lgtm-image]][lgtm-url]


CORS handling, 100% transportation agnostic. Is bundled with TypeScript type information.

This package is **heavily** influenced by [`corser`](https://www.npmjs.com/package/corser) for its logic. It is more or less hand-translated from `corser` line by line into TypeScript and by removing the dependencies on `req`/`res`.

## Motivation

Of the other libraries out there handling CORS, `cors`, `corser`, `koa-cors` etc, none of them are pure CORS related, but are coupled with express or koa or Node.js' `http` modules, and they potentially alter the corresponding `req` and `res` objects.

This package provides **purely** the logic for CORS.

There is **no** mutable global state being stored within this module. Each instance you create contains its own state. Expect no magic.

It's written in TypeScript. Exported as JavaScript with separate typings.

## API

The package exports one function; `setup`.

This function initializes a new CORS context given a set of options (if any). The return value is a function that can be called with a method and a set of headers to return (a promise to) CORS properties.

```js
import { setup as setupCors } from 'libcors'

const corsFn = setupCors( /* optional options object */ );

// We get these from somewhere:
const method;  // 'GET', 'POST', etc
const headers; // key-value of strings
const corsResult = await corsFn( method, headers );
```

Don't forget that `corsFn` returns a promise which needs to be `await`ed.

### Options

The options which can be provided to `setup` are

```ts
{
    origins: Origins;              // see below
    methods: string[];             // ['GET', 'HEAD', 'POST']
    requestHeaders: string[];      // see below
    responseHeaders: string[];     // see below
    supportsCredentials: boolean;  // default: false
    maxAge: number;                // default: null
    endPreflightRequests: boolean; // default: true
}
```

The `origins` is either an array of strings or a function taking the `Origin` header as argument (a string) and returns a boolean (or a promise to a boolean).

The `requestHeaders` defaults to `[ "accept", "accept-language", "content-language", "content-type" ]` and `responseHeaders` defaults to `[ "cache-control", "content-language", "content-type", "expires", "last-modified", "pragma" ]`.

### Result

The `corsResult` above is defined by the TypeScript interface `CorsResult`:

```ts
interface CorsResult
{
    headers: { [ key: string ]: string; };
    vary: string[];
    status?: number; // Response code, if the request should be ended
}
```

The `headers` is a key-value lookup of headers that should be sent back in the response and the `vary` is a list of fields that should be appended to the `Vary` header.

If `status` is defined, this means the response should be sent immediately (without allowing further middlewares/routes) and the HTTP response code should be set to this value. `if ( !status )`, the normal route flow should continue.

### Usage as a middleware

The package is 100% transport/framework agnostic, so to use it as a middleware in a framework, a wrapping package should be used instead where this provides the pure logic.


[npm-image]: https://img.shields.io/npm/v/libcors.svg
[npm-url]: https://npmjs.org/package/libcors
[travis-image]: https://img.shields.io/travis/grantila/libcors.svg
[travis-url]: https://travis-ci.org/grantila/libcors
[coverage-image]: https://coveralls.io/repos/github/grantila/libcors/badge.svg?branch=master
[coverage-url]: https://coveralls.io/github/grantila/libcors?branch=master
[lgtm-image]: https://img.shields.io/lgtm/grade/javascript/g/grantila/libcors.svg?logo=lgtm&logoWidth=18
[lgtm-url]: https://lgtm.com/projects/g/grantila/libcors/context:javascript
