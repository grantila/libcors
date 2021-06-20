/**
 * As with the library itself, these tests are taken from 'corser', and have
 * been rewritten to typescript and to use libcors instead.
 */

import { reflect } from 'already'

import {
	setup,
	simpleResponseHeaders,
	simpleMethods,
	simpleRequestHeaders
} from '.'


describe( 'libcors', ( ) =>
{
	const method = 'GET';

	it(
		'should not add any headers if the "Origin" header is not present ' +
		'in the request', async ( ) =>
	{
		const requestListener = setup( );
		const res = await requestListener( method, { } );
		expect( Object.keys( res.headers ).length ).toBe( 0 );
	} );

	it(
		'should handle throwing origins callback', async ( ) =>
	{
		const origins = [ "example.com" ];
		const headers = { "origin": "fake.com" };
		{
			const err = new Error( "foo" );
			// Test with function.
			const requestListener = setup( {
				origins: originHeader => { throw err; }
			} );
			const res = await reflect( requestListener( method, headers ) );
			expect( res.error ).toBe( err );
		}
	} );

	it(
		'should not add any headers if the given origin does not match one ' +
		'of the origins in the list of origins', async ( ) =>
	{
		const origins = [ "example.com" ];
		const headers = { "origin": "fake.com" };
		{
			// Test with array.
			const requestListener = setup( { origins } );
			const res = await requestListener( method, headers );
			expect( Object.keys( res.headers ).length ).toBe( 0 );
		}
		{
			// Test with function.
			const requestListener = setup( {
				origins: originHeader =>
					origins.indexOf(originHeader) !== -1
			} );
			const res = await requestListener( method, headers );
			expect( Object.keys( res.headers ).length ).toBe( 0 );
		}
	} );

	it(
		'should support passing a function as origins and it should work ' +
		'both synchronously and asynchronously', async () =>
	{
		const origins = [ "example.com" ];

		// Test with asynchronous function.
		const requestListener = setup( {
			origins: originHeader => new Promise( ( resolve, reject ) =>
			{
				process.nextTick( ( ) =>
					resolve( origins.indexOf(originHeader) !== -1 )
				);
			} )
		} );
		const headers = { "origin": "fake.com" };
		const res = await requestListener( method, headers );
		expect( Object.keys( res.headers ).length ).toBe( 0 );

		{
			headers[ "origin" ] = "example.com";
			const res = await requestListener( method, headers );
			expect( Object.keys( res.headers ).length ).toBe( 1 );
		}
		{
			// Test with synchronous function.
			const requestListener = setup( {
				origins: originHeader =>
					origins.indexOf( originHeader ) !== -1
			} );

			const res = await requestListener( method, headers );
			expect( Object.keys( res.headers ).length ).toBe( 1 );
		}
		{
			headers[ "origin" ] = "fake.com";
			const res = await requestListener( method, headers );
			expect( Object.keys( res.headers ).length ).toBe( 0 );
		}
	} );

	it(
		'should not accept any non-boolean value as the second parameter ' +
		'of an match origin callback', async ( ) =>
	{
		const headers = { "origin": "example.com" };

		{
			// Test undefined.
			const requestListener = setup( {
				origins: originHeader => undefined
			} );
			const res = await requestListener( method, headers );
			expect( Object.keys( res.headers ).length ).toBe( 0 );
		}
		{
			// Test null.
			const requestListener = setup( {
				origins: originHeader => null
			} );
			const res = await requestListener( method, headers );
			expect( Object.keys( res.headers ).length ).toBe( 0 );
		}
		{
			// Test number.
			const requestListener = setup( {
				origins: originHeader => < any >4711
			} );
			const res = await requestListener( method, headers );
			expect( Object.keys( res.headers ).length ).toBe( 0 );
		}
		{
			// Test string.
			const requestListener = setup( {
				origins: originHeader => < any >"test"
			} );
			const res = await requestListener( method, headers );
			expect( Object.keys( res.headers ).length ).toBe( 0 );
		}
	} );

	it(
		'should expose errors encountered in the match origin callback',
		async ( ) =>
	{
		const thenner = jest.fn( );

		const requestListener = setup( {
			origins: originHeader =>
				Promise.reject( {
					message: "Something went wrong!",
					status: 500
				} )
		} );
		const headers = { "origin": "example.com" };
		await requestListener( method, headers )
		.then(
			thenner,
			err => expect( err ).not.toBe( undefined )
		);

		expect( thenner.mock.calls.length ).toBe( 0 );
	} );

	it(
		'should not add any headers if the given origin is not a ' +
		'case-sentitive match of one of the origins in the list of origins',
		async ( ) =>
	{
		const requestListener = setup( {
			origins: [ "example.com" ]
		} );
		const headers = { "origin": "eXaMpLe.cOm" };
		const res = await requestListener( method, headers );
		expect( Object.keys( res.headers ).length ).toBe( 0 );
	} );

	describe( 'An actual request', ( ) =>
	{
		const method = 'GET';

		it(
			'should add an Access-Control-Allow-Origin header of "*" for ' +
			'any given origin if the list of origins in unbound', async ( ) =>
		{
			const requestListener = setup( );
			const headers = { "origin": "example.org" };
			const res = await requestListener( method, headers );
			expect( res.headers[ "Access-Control-Allow-Origin" ] )
				.toBe( "*" );
		} );

		it(
			'should add an Access-Control-Allow-Origin header of ' +
			'"example.com" if the given origin matches one of the origins' +
			' in the list of origins', async ( ) =>
		{
			const requestListener = setup( {
				origins: [ "example.com" ]
			} );
			const headers = { "origin": "example.com" };
			const res = await requestListener( method, headers );
			expect( res.headers[ "Access-Control-Allow-Origin" ] )
				.toBe( "example.com" );
		} );

		it(
			'should add an Access-Control-Allow-Origin header of ' +
			'"example.com" and an Access-Control-Allow-Credentials header ' +
			'of "true" if credentials are supported and the list of ' +
			'origins in unbound', async ( ) =>
		{
			const requestListener = setup( {
				supportsCredentials: true
			} );
			const headers = { "origin": "example.com" };
			const res = await requestListener( method, headers );
			expect( res.headers[ "Access-Control-Allow-Origin" ] )
				.toBe( "example.com" );
			expect( res.headers[ "Access-Control-Allow-Credentials" ] )
				.toBe( "true" );
		} );

		it(
			'should add an Access-Control-Allow-Origin header of ' +
			'"example.com" and an Access-Control-Allow-Credentials header ' +
			'of "true" if credentials are supported and the given origin ' +
			'matches one of the origins in the list of origins', async ( ) =>
		{
			const origins = [ "example.com" ];
			// Test with array.
			const requestListener = setup( {
				origins: origins,
				supportsCredentials: true,
			} );
			const headers = { "origin": "example.com" };
			{
				const res = await requestListener( method, headers );

				expect( res.headers[ "Access-Control-Allow-Origin" ] )
					.toBe( "example.com" );
				expect( res.headers[ "Access-Control-Allow-Credentials" ] )
					.toBe( "true" );
			}
			{
				// Test with function.
				const requestListener = setup( {
					origins: origin => origins.indexOf( origin ) !== -1,
					supportsCredentials: true,
				} );
				const res = await requestListener( method, headers );
				expect( res.headers[ "Access-Control-Allow-Origin" ] )
					.toBe( "example.com" );
				expect( res.headers[ "Access-Control-Allow-Credentials" ] )
					.toBe( "true" );
			}
		} );

		it(
			'should not add an Access-Control-Allow-Headers header if ' +
			'there are no response headers to expose', async ( ) =>
		{
			const requestListener = setup( );
			const headers = { "origin": "example.com" };
			const res = await requestListener( method, headers );
			expect( res.headers[ "Access-Control-Allow-Headers" ] )
				.toBe( undefined );
		} );

		it(
			'should add an Access-Control-Expose-Headers header with all ' +
			'the exposed response headers if there are response headers ' +
			'to expose', async ( ) =>
		{
			const requestListener = setup( {
				responseHeaders: simpleResponseHeaders.concat( [ "X-Corser" ] )
			} );
			const headers = { "origin": "example.com" };
			const res = await requestListener( method, headers );
			expect( res.headers[ "Access-Control-Expose-Headers" ] )
				.toBe( "x-corser" );
		} );
	} );

	describe( 'A preflight request', ( ) =>
	{
		const method = 'OPTIONS';

		it(
			'should not add any headers if an Access-Control-Request-Method' +
			' header is not present in the request', async ( ) =>
		{
			const requestListener = setup( {
				endPreflightRequests: false
			} );
			const headers = { "origin": "example.com" };
			const res = await requestListener( method, headers );
			expect( Object.keys( res.headers ).length ).toBe( 0 );
		} );

		it(
			'should not add any headers if the ' +
			'Access-Control-Request-Method header contains a non-simple ' +
			'method', async ( ) =>
		{
			const requestListener = setup( {
				endPreflightRequests: false
			} );
			const headers = {
				"origin": "example.com",
				"access-control-request-method": "PUT",
			};
			const res = await requestListener( method, headers );
			expect( Object.keys( res.headers ).length ).toBe( 0 );
		} );

		it(
			'should not add any headers if the ' +
			'Access-Control-Request-Headers header contains a non-simple ' +
			'request header', async ( ) =>
		{
			const requestListener = setup( {
				endPreflightRequests: false
			} );
			const headers = {
				"origin": "example.com",
				"access-control-request-method": "GET",
				"access-control-request-headers": "X-Corser",
			};
			const res = await requestListener( method, headers );
			expect( Object.keys( res.headers ).length ).toBe( 0 );
		} );

		it(
			'should add an Access-Control-Allow-Origin header of "*" for ' +
			'any given origin if the list of origins in unbound', async ( ) =>
		{
			const requestListener = setup( {
				endPreflightRequests: false
			} );
			const headers = {
				"origin": "example.org",
				"access-control-request-method": "GET",
			};
			const res = await requestListener( method, headers );
			expect( res.headers[ "Access-Control-Allow-Origin" ] )
				.toBe( "*" );
		} );

		it(
			'should add an Access-Control-Allow-Origin header of ' +
			'"example.com" if the given origin matches one of the origins ' +
			'in the list of origins', async ( ) =>
		{
			const requestListener = setup( {
				origins: [ "example.com" ],
				endPreflightRequests: false,
			} );
			const headers = {
				"origin": "example.com",
				"access-control-request-method": "GET",
			};
			const res = await requestListener( method, headers );
			expect( res.headers[ "Access-Control-Allow-Origin" ] )
				.toBe( "example.com" );
		} );

		it(
			'should add an Access-Control-Allow-Origin header of ' +
			'"example.com" and an Access-Control-Allow-Credentials header ' +
			'of "true" if credentials are supported and the list of ' +
			'origins in unbound', async ( ) =>
		{
			const requestListener = setup( {
				supportsCredentials: true,
				endPreflightRequests: false
			});
			const headers = {
				"origin": "example.com",
				"access-control-request-method": "GET",
			};
			const res = await requestListener( method, headers );
			expect( res.headers[ "Access-Control-Allow-Origin" ] )
				.toBe( "example.com" );
			expect( res.headers[ "Access-Control-Allow-Credentials" ] )
				.toBe( "true" );
		} );

		it(
			'should add an Access-Control-Allow-Origin header of ' +
			'"example.com" and an Access-Control-Allow-Credentials header ' +
			'of "true" if credentials are supported and the given origin ' +
			'matches one of the origins in the list of origins', async ( ) =>
		{
			const requestListener = setup( {
				origins: [ "example.com" ],
				supportsCredentials: true,
				endPreflightRequests: false
			} );
			const headers = {
				"origin": "example.com",
				"access-control-request-method": "GET",
			};
			const res = await requestListener( method, headers );
			expect( res.headers[ "Access-Control-Allow-Origin" ] )
				.toBe( "example.com" );
			expect( res.headers[ "Access-Control-Allow-Credentials" ] )
				.toBe( "true" );
		} );

		it(
			'should add an Access-Control-Allow-Origin header even though ' +
			'Origin was not added to the list of request headers', async ( ) =>
		{
			const requestListener = setup( {
				endPreflightRequests: false,
			} );
			const headers = {
				"origin": "example.com",
				"access-control-request-method": "GET",
				"access-control-request-headers": "Origin",
			};
			const res = await requestListener( method, headers );
			expect( res.headers[ "Access-Control-Allow-Origin" ] )
				.not.toBe( undefined );
		} );

		it(
			'should add an Access-Control-Max-Age header of "50" if maxAge ' +
			'is set', async ( ) =>
		{
			const requestListener = setup( {
				maxAge: 50,
				endPreflightRequests: false,
			} );
			const headers = {
				"origin": "example.com",
				"access-control-request-method": "GET",
			};
			const res = await requestListener( method, headers );
			expect( res.headers[ "Access-Control-Max-Age" ] )
				.toBe( '50' );
		} );

		it(
			'should add an Access-Control-Allow-Methods header with all ' +
			'methods that are in the list of methods', async ( ) =>
		{
			const requestListener = setup( {
				endPreflightRequests: false,
			} );
			const headers = {
				"origin": "example.com",
				"access-control-request-method": "GET",
			};
			const res = await requestListener( method, headers );
			expect( res.headers[ "Access-Control-Allow-Methods" ] )
				.toBe( simpleMethods.join( "," ) );
		} );

		it(
			'should add an Access-Control-Allow-Headers header with all ' +
			'request headers that are in the list of request headers',
			async ( ) =>
		{
			const requestListener = setup( {
				endPreflightRequests: false,
			} );
			const headers = {
				"origin": "example.com",
				"access-control-request-method": "GET",
			};
			const res = await requestListener( method, headers );
			expect( res.headers[ "Access-Control-Allow-Headers" ] )
				.toBe( simpleRequestHeaders.join( "," ) );
		} );

		it(
			'should add an Access-Control-Allow-Headers header that ' +
			'includes x-corser even though the name of the header in the ' +
			'Access-Control-Request-Headers header is not a case-sensitive ' +
			'match', async ( ) =>
		{
			const requestHeaders =
				simpleRequestHeaders.concat( [ "x-corser" ] );
			const requestListener = setup({
				requestHeaders: requestHeaders,
				endPreflightRequests: false
			});
			const headers = {
				"origin": "example.com",
				"access-control-request-method": "GET",
				"access-control-request-headers": "X-Corser",
			};
			const res = await requestListener( method, headers );
			expect( res.headers[ "Access-Control-Allow-Headers" ] )
				.toBe( requestHeaders.join( "," ) );
		} );

		it(
			'should end preflight requests by default', async ( ) =>
		{
			const requestListener = setup( );
			const headers = {
				"origin": "example.org",
				"access-control-request-method": "GET",
			};
			const res = await requestListener( method, headers );
			expect( res.status ).toBe( 204 );
		} );
	} );
} );
