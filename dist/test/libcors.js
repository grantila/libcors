"use strict";
/**
 * As with the library itself, these tests are taken from 'corser', and have
 * been rewritten to typescript and to use libcors instead.
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
require("mocha");
const chai_1 = require("chai");
const sinon_1 = require("sinon");
const _1 = require("../");
describe('libcors', () => {
    const method = 'GET';
    it('should not add any headers if the "Origin" header is not present ' +
        'in the request', () => __awaiter(this, void 0, void 0, function* () {
        const requestListener = _1.setup();
        const res = yield requestListener(method, {});
        chai_1.expect(Object.keys(res.headers).length).to.equal(0);
    }));
    it('should not add any headers if the given origin does not match one ' +
        'of the origins in the list of origins', () => __awaiter(this, void 0, void 0, function* () {
        const origins = ["example.com"];
        const headers = { "origin": "fake.com" };
        {
            // Test with array.
            const requestListener = _1.setup({ origins });
            const res = yield requestListener(method, headers);
            chai_1.expect(Object.keys(res.headers).length).to.equal(0);
        }
        {
            // Test with function.
            const requestListener = _1.setup({
                origins: originHeader => origins.indexOf(originHeader) !== -1
            });
            const res = yield requestListener(method, headers);
            chai_1.expect(Object.keys(res.headers).length).to.equal(0);
        }
    }));
    it('should support passing a function as origins and it should work ' +
        'both synchronously and asynchronously', () => __awaiter(this, void 0, void 0, function* () {
        const origins = ["example.com"];
        // Test with asynchronous function.
        const requestListener = _1.setup({
            origins: originHeader => new Promise((resolve, reject) => {
                process.nextTick(() => resolve(origins.indexOf(originHeader) !== -1));
            })
        });
        const headers = { "origin": "fake.com" };
        const res = yield requestListener(method, headers);
        chai_1.expect(Object.keys(res.headers).length).to.equal(0);
        {
            headers["origin"] = "example.com";
            const res = yield requestListener(method, headers);
            chai_1.expect(Object.keys(res.headers).length).to.equal(1);
        }
        {
            // Test with synchronous function.
            const requestListener = _1.setup({
                origins: originHeader => origins.indexOf(originHeader) !== -1
            });
            const res = yield requestListener(method, headers);
            chai_1.expect(Object.keys(res.headers).length).to.equal(1);
        }
        {
            headers["origin"] = "fake.com";
            const res = yield requestListener(method, headers);
            chai_1.expect(Object.keys(res.headers).length).to.equal(0);
        }
    }));
    it('should not accept any non-boolean value as the second parameter ' +
        'of an match origin callback', () => __awaiter(this, void 0, void 0, function* () {
        const headers = { "origin": "example.com" };
        {
            // Test undefined.
            const requestListener = _1.setup({
                origins: originHeader => undefined
            });
            const res = yield requestListener(method, headers);
            chai_1.expect(Object.keys(res.headers).length).to.equal(0);
        }
        {
            // Test null.
            const requestListener = _1.setup({
                origins: originHeader => null
            });
            const res = yield requestListener(method, headers);
            chai_1.expect(Object.keys(res.headers).length).to.equal(0);
        }
        {
            // Test number.
            const requestListener = _1.setup({
                origins: originHeader => 4711
            });
            const res = yield requestListener(method, headers);
            chai_1.expect(Object.keys(res.headers).length).to.equal(0);
        }
        {
            // Test string.
            const requestListener = _1.setup({
                origins: originHeader => "test"
            });
            const res = yield requestListener(method, headers);
            chai_1.expect(Object.keys(res.headers).length).to.equal(0);
        }
    }));
    it('should expose errors encountered in the match origin callback', () => __awaiter(this, void 0, void 0, function* () {
        const thenner = sinon_1.spy();
        const requestListener = _1.setup({
            origins: originHeader => Promise.reject({
                message: "Something went wrong!",
                status: 500
            })
        });
        const headers = { "origin": "example.com" };
        yield requestListener(method, headers)
            .then(thenner, err => chai_1.expect(err).to.not.equal(undefined));
        chai_1.expect(thenner.callCount).to.equal(0);
    }));
    it('should not add any headers if the given origin is not a ' +
        'case-sentitive match of one of the origins in the list of origins', () => __awaiter(this, void 0, void 0, function* () {
        const requestListener = _1.setup({
            origins: ["example.com"]
        });
        const headers = { "origin": "eXaMpLe.cOm" };
        const res = yield requestListener(method, headers);
        chai_1.expect(Object.keys(res.headers).length).to.equal(0);
    }));
    describe('An actual request', () => {
        const method = 'GET';
        it('should add an Access-Control-Allow-Origin header of "*" for ' +
            'any given origin if the list of origins in unbound', () => __awaiter(this, void 0, void 0, function* () {
            const requestListener = _1.setup();
            const headers = { "origin": "example.org" };
            const res = yield requestListener(method, headers);
            chai_1.expect(res.headers["Access-Control-Allow-Origin"])
                .to.equal("*");
        }));
        it('should add an Access-Control-Allow-Origin header of ' +
            '"example.com" if the given origin matches one of the origins' +
            ' in the list of origins', () => __awaiter(this, void 0, void 0, function* () {
            const requestListener = _1.setup({
                origins: ["example.com"]
            });
            const headers = { "origin": "example.com" };
            const res = yield requestListener(method, headers);
            chai_1.expect(res.headers["Access-Control-Allow-Origin"])
                .to.equal("example.com");
        }));
        it('should add an Access-Control-Allow-Origin header of ' +
            '"example.com" and an Access-Control-Allow-Credentials header ' +
            'of "true" if credentials are supported and the list of ' +
            'origins in unbound', () => __awaiter(this, void 0, void 0, function* () {
            const requestListener = _1.setup({
                supportsCredentials: true
            });
            const headers = { "origin": "example.com" };
            const res = yield requestListener(method, headers);
            chai_1.expect(res.headers["Access-Control-Allow-Origin"])
                .to.equal("example.com");
            chai_1.expect(res.headers["Access-Control-Allow-Credentials"])
                .to.equal("true");
        }));
        it('should add an Access-Control-Allow-Origin header of ' +
            '"example.com" and an Access-Control-Allow-Credentials header ' +
            'of "true" if credentials are supported and the given origin ' +
            'matches one of the origins in the list of origins', () => __awaiter(this, void 0, void 0, function* () {
            const origins = ["example.com"];
            // Test with array.
            const requestListener = _1.setup({
                origins: origins,
                supportsCredentials: true,
            });
            const headers = { "origin": "example.com" };
            {
                const res = yield requestListener(method, headers);
                chai_1.expect(res.headers["Access-Control-Allow-Origin"])
                    .to.equal("example.com");
                chai_1.expect(res.headers["Access-Control-Allow-Credentials"])
                    .to.equal("true");
            }
            {
                // Test with function.
                const requestListener = _1.setup({
                    origins: origin => origins.indexOf(origin) !== -1,
                    supportsCredentials: true,
                });
                const res = yield requestListener(method, headers);
                chai_1.expect(res.headers["Access-Control-Allow-Origin"])
                    .to.equal("example.com");
                chai_1.expect(res.headers["Access-Control-Allow-Credentials"])
                    .to.equal("true");
            }
        }));
        it('should not add an Access-Control-Allow-Headers header if ' +
            'there are no response headers to expose', () => __awaiter(this, void 0, void 0, function* () {
            const requestListener = _1.setup();
            const headers = { "origin": "example.com" };
            const res = yield requestListener(method, headers);
            chai_1.expect(res.headers["Access-Control-Allow-Headers"])
                .to.equal(undefined);
        }));
        it('should add an Access-Control-Expose-Headers header with all ' +
            'the exposed response headers if there are response headers ' +
            'to expose', () => __awaiter(this, void 0, void 0, function* () {
            const requestListener = _1.setup({
                responseHeaders: _1.simpleResponseHeaders.concat(["X-Corser"])
            });
            const headers = { "origin": "example.com" };
            const res = yield requestListener(method, headers);
            chai_1.expect(res.headers["Access-Control-Expose-Headers"])
                .to.equal("x-corser");
        }));
    });
    describe('A preflight request', () => {
        const method = 'OPTIONS';
        it('should not add any headers if an Access-Control-Request-Method' +
            ' header is not present in the request', () => __awaiter(this, void 0, void 0, function* () {
            const requestListener = _1.setup({
                endPreflightRequests: false
            });
            const headers = { "origin": "example.com" };
            const res = yield requestListener(method, headers);
            chai_1.expect(Object.keys(res.headers).length).to.equal(0);
        }));
        it('should not add any headers if the ' +
            'Access-Control-Request-Method header contains a non-simple ' +
            'method', () => __awaiter(this, void 0, void 0, function* () {
            const requestListener = _1.setup({
                endPreflightRequests: false
            });
            const headers = {
                "origin": "example.com",
                "access-control-request-method": "PUT",
            };
            const res = yield requestListener(method, headers);
            chai_1.expect(Object.keys(res.headers).length).to.equal(0);
        }));
        it('should not add any headers if the ' +
            'Access-Control-Request-Headers header contains a non-simple ' +
            'request header', () => __awaiter(this, void 0, void 0, function* () {
            const requestListener = _1.setup({
                endPreflightRequests: false
            });
            const headers = {
                "origin": "example.com",
                "access-control-request-method": "GET",
                "access-control-request-headers": "X-Corser",
            };
            const res = yield requestListener(method, headers);
            chai_1.expect(Object.keys(res.headers).length).to.equal(0);
        }));
        it('should add an Access-Control-Allow-Origin header of "*" for ' +
            'any given origin if the list of origins in unbound', () => __awaiter(this, void 0, void 0, function* () {
            const requestListener = _1.setup({
                endPreflightRequests: false
            });
            const headers = {
                "origin": "example.org",
                "access-control-request-method": "GET",
            };
            const res = yield requestListener(method, headers);
            chai_1.expect(res.headers["Access-Control-Allow-Origin"])
                .to.equal("*");
        }));
        it('should add an Access-Control-Allow-Origin header of ' +
            '"example.com" if the given origin matches one of the origins ' +
            'in the list of origins', () => __awaiter(this, void 0, void 0, function* () {
            const requestListener = _1.setup({
                origins: ["example.com"],
                endPreflightRequests: false,
            });
            const headers = {
                "origin": "example.com",
                "access-control-request-method": "GET",
            };
            const res = yield requestListener(method, headers);
            chai_1.expect(res.headers["Access-Control-Allow-Origin"])
                .to.equal("example.com");
        }));
        it('should add an Access-Control-Allow-Origin header of ' +
            '"example.com" and an Access-Control-Allow-Credentials header ' +
            'of "true" if credentials are supported and the list of ' +
            'origins in unbound', () => __awaiter(this, void 0, void 0, function* () {
            const requestListener = _1.setup({
                supportsCredentials: true,
                endPreflightRequests: false
            });
            const headers = {
                "origin": "example.com",
                "access-control-request-method": "GET",
            };
            const res = yield requestListener(method, headers);
            chai_1.expect(res.headers["Access-Control-Allow-Origin"])
                .to.equal("example.com");
            chai_1.expect(res.headers["Access-Control-Allow-Credentials"])
                .to.equal("true");
        }));
        it('should add an Access-Control-Allow-Origin header of ' +
            '"example.com" and an Access-Control-Allow-Credentials header ' +
            'of "true" if credentials are supported and the given origin ' +
            'matches one of the origins in the list of origins', () => __awaiter(this, void 0, void 0, function* () {
            const requestListener = _1.setup({
                origins: ["example.com"],
                supportsCredentials: true,
                endPreflightRequests: false
            });
            const headers = {
                "origin": "example.com",
                "access-control-request-method": "GET",
            };
            const res = yield requestListener(method, headers);
            chai_1.expect(res.headers["Access-Control-Allow-Origin"])
                .to.equal("example.com");
            chai_1.expect(res.headers["Access-Control-Allow-Credentials"])
                .to.equal("true");
        }));
        it('should add an Access-Control-Allow-Origin header even though ' +
            'Origin was not added to the list of request headers', () => __awaiter(this, void 0, void 0, function* () {
            const requestListener = _1.setup({
                endPreflightRequests: false,
            });
            const headers = {
                "origin": "example.com",
                "access-control-request-method": "GET",
                "access-control-request-headers": "Origin",
            };
            const res = yield requestListener(method, headers);
            chai_1.expect(res.headers["Access-Control-Allow-Origin"])
                .not.to.equal(undefined);
        }));
        it('should add an Access-Control-Max-Age header of "50" if maxAge ' +
            'is set', () => __awaiter(this, void 0, void 0, function* () {
            const requestListener = _1.setup({
                maxAge: 50,
                endPreflightRequests: false,
            });
            const headers = {
                "origin": "example.com",
                "access-control-request-method": "GET",
            };
            const res = yield requestListener(method, headers);
            chai_1.expect(res.headers["Access-Control-Max-Age"])
                .to.equal('50');
        }));
        it('should add an Access-Control-Allow-Methods header with all ' +
            'methods that are in the list of methods', () => __awaiter(this, void 0, void 0, function* () {
            const requestListener = _1.setup({
                endPreflightRequests: false,
            });
            const headers = {
                "origin": "example.com",
                "access-control-request-method": "GET",
            };
            const res = yield requestListener(method, headers);
            chai_1.expect(res.headers["Access-Control-Allow-Methods"])
                .to.equal(_1.simpleMethods.join(","));
        }));
        it('should add an Access-Control-Allow-Headers header with all ' +
            'request headers that are in the list of request headers', () => __awaiter(this, void 0, void 0, function* () {
            const requestListener = _1.setup({
                endPreflightRequests: false,
            });
            const headers = {
                "origin": "example.com",
                "access-control-request-method": "GET",
            };
            const res = yield requestListener(method, headers);
            chai_1.expect(res.headers["Access-Control-Allow-Headers"])
                .to.equal(_1.simpleRequestHeaders.join(","));
        }));
        it('should add an Access-Control-Allow-Headers header that ' +
            'includes x-corser even though the name of the header in the ' +
            'Access-Control-Request-Headers header is not a case-sensitive ' +
            'match', () => __awaiter(this, void 0, void 0, function* () {
            const requestHeaders = _1.simpleRequestHeaders.concat(["x-corser"]);
            const requestListener = _1.setup({
                requestHeaders: requestHeaders,
                endPreflightRequests: false
            });
            const headers = {
                "origin": "example.com",
                "access-control-request-method": "GET",
                "access-control-request-headers": "X-Corser",
            };
            const res = yield requestListener(method, headers);
            chai_1.expect(res.headers["Access-Control-Allow-Headers"])
                .to.eql(requestHeaders.join(","));
        }));
        it('should end preflight requests by default', () => __awaiter(this, void 0, void 0, function* () {
            const requestListener = _1.setup();
            const headers = {
                "origin": "example.org",
                "access-control-request-method": "GET",
            };
            const res = yield requestListener(method, headers);
            chai_1.expect(res.status).to.equal(204);
        }));
    });
});
//# sourceMappingURL=libcors.js.map