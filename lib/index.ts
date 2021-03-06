/**
 * The logic and many of the comments in this file is taken from the 'corser'
 * package:
 * https://github.com/agrueneberg/Corser
 *
 * Specification: http://www.w3.org/TR/2012/WD-cors-20120403/
 * W3C Working Draft 3 April 2012
 */
"use strict";

export const simpleMethods = Object.freeze( [
	"GET",
	"HEAD",
	"POST",
] );

export const simpleRequestHeaders = Object.freeze( [
	"accept",
	"accept-language",
	"content-language",
	"content-type",
] );

export const simpleResponseHeaders = Object.freeze( [
	"cache-control",
	"content-language",
	"content-type",
	"expires",
	"last-modified",
	"pragma",
] );

function mapLowerCase( arr: ReadonlyArray< string > )
{
	return arr.map( el => el.toLowerCase( ) );
};


export interface CorsResult
{
	headers: { [ key: string ]: string; };
	vary: Array< string >;
	status?: number; // Response code, if the request should be ended
}

export type OriginsFunction =
	( ( header: string ) => boolean ) |
	( ( header: string ) => Promise< boolean > );
export type Origins = string[] | OriginsFunction;

export interface CorsOptions
{
	origins: Origins;
	methods: ReadonlyArray< string >;
	requestHeaders: ReadonlyArray< string >;
	responseHeaders: ReadonlyArray< string >;
	supportsCredentials: boolean;
	maxAge: number;
	endPreflightRequests: boolean;
}

const defaultOptions = Object.freeze( {
	origins: [ ],
	methods: simpleMethods,
	requestHeaders: simpleRequestHeaders,
	responseHeaders: simpleResponseHeaders,
	supportsCredentials: false,
	maxAge: null,
	endPreflightRequests: true,
} as CorsOptions );


enum MatchingOrigin
{
	Yes,
	No,
	Any,
}

async function checkOriginMatch( originHeader: string, origins: Origins )
: Promise< MatchingOrigin >
{
	if ( typeof origins === "function" )
		return ( await origins( originHeader ) ) === true
			? MatchingOrigin.Yes
			: MatchingOrigin.No;

	else if ( origins.length > 0 )
		return origins.some( origin => origin === originHeader )
			? MatchingOrigin.Yes
			: MatchingOrigin.No;

	else
		// Always matching is acceptable since the list of origins can be
		// unbounded.
		return MatchingOrigin.Any;
};

function filterOptions( opts: Partial< CorsOptions > = { } )
{
	const { requestHeaders, responseHeaders } = opts;

	if ( !requestHeaders && !responseHeaders )
		return opts;

	if ( requestHeaders )
		opts.requestHeaders =
			requestHeaders.map( header => header.toLowerCase( ) );

	if ( responseHeaders )
		opts.responseHeaders =
			responseHeaders.map( header => header.toLowerCase( ) );

	return opts;
}

// This is not 100% compatible with NodeJS, since a few headers can be arrays.
// A TypeScript user of this library will detect this (as compilation failure)
// and be forced to act accordingly.
export type Headers = { [ key: string ]: string };

export type CorsFunction =
	( method: string, headers: Readonly< Headers > ) => Promise< CorsResult >;

function cors(
	options: CorsOptions,
	method: string,
	headers: Readonly< Headers >
)
: Promise< CorsResult >
{
	const {
		origins,
		methods,
		requestHeaders,
		responseHeaders,
		supportsCredentials,
		maxAge,
		endPreflightRequests,
	} = options;

	const result: CorsResult = {
		headers: { },
		vary: [ ],
		status: null,
	};

	function setHeader( key: string, value: string | ReadonlyArray< string > )
	: void
	{
		if ( typeof value !== 'string' )
			value = value.join( "," );

		result.headers[ key ] = value;
	}

	function endPreflight( )
	{
		if ( endPreflightRequests )
			result.status = 204;
	};


	// If the Origin header is not present terminate this set of steps.
	if ( !headers.origin )
		// The request is outside the scope of the CORS specification.
		// If there is no Origin header, it could be a same-origin request.
		// Let's let the user-agent handle this situation.
		return Promise.resolve( result );

	// If the value of the Origin header is not a case-sensitive match for any
	// of the values in list of origins, do not set any additional headers and
	// terminate this set of steps.
	return checkOriginMatch( headers.origin, origins )
	.then( originMatches =>
	{
		if ( originMatches === MatchingOrigin.No )
			return;

		if ( originMatches === MatchingOrigin.Yes )
			result.vary.push( 'Origin' );

		// Respond to preflight request.
		if ( method === "OPTIONS" )
		{
			// If there is no Access-Control-Request-Method header or if
			// parsing failed, do not set any additional headers and terminate
			// this set of steps.
			if ( !headers.hasOwnProperty( "access-control-request-method" ) )
				return endPreflight( );

			const acRequestMethod = headers[ "access-control-request-method" ];
			// If method is not a case-sensitive match for any of the values in
			// list of methods do not set any additional headers and terminate
			// this set of steps.
			if ( !methods.includes( acRequestMethod ) )
				return endPreflight( );

			// If there are no Access-Control-Request-Headers headers let
			// header field-names be the empty list. If parsing failed do not
			// set any additional headers and terminate this set of steps.
			// Checking for an empty header is a workaround for a bug Chrome 52:
			// https://bugs.chromium.org/p/chromium/issues/detail?id=633729
			const acRequestHeaders =
				headers[ "access-control-request-headers" ]
				? mapLowerCase(
					headers[ "access-control-request-headers" ].split( /,\s*/ )
				)
				: [ ];

			// If any of the header field-names is not a ASCII case-insensitive
			// match for any of the values in list of headers do not set any
			// additional headers and terminate this set of steps.
			const headersMatch = acRequestHeaders.every( requestHeader =>
				// Browsers automatically add Origin to
				// Access-Control-Request-Headers. However, Origin is not one
				// of the simple request headers. Therefore, the header is
				// accepted even if it is not in the list of request headers
				// because CORS would not work without it.
				( requestHeader === "origin" )
				||
				requestHeaders.includes( requestHeader )
			);
			if ( !headersMatch )
				return endPreflight( );

			if ( supportsCredentials )
			{
				// If the resource supports credentials add a single
				// Access-Control-Allow-Origin header, with the value of the
				// Origin header as value, and add a single
				// Access-Control-Allow-Credentials header with the literal
				// string "true" as value.
				setHeader( "Access-Control-Allow-Origin", headers.origin );
				setHeader( "Access-Control-Allow-Credentials", "true" );
			}
			else
			{
				// Otherwise, add a single Access-Control-Allow-Origin header,
				// with either the value of the Origin header or the string
				// "*" as value.
				if ( origins.length > 0 || typeof origins === "function" )
					setHeader( "Access-Control-Allow-Origin", headers.origin );
				else
					setHeader( "Access-Control-Allow-Origin", "*" );
			}

			// Optionally add a single Access-Control-Max-Age header with as
			// value the amount of seconds the user agent is allowed to cache
			// the result of the request.
			if ( maxAge != null )
				setHeader( "Access-Control-Max-Age", '' + maxAge );

			// Add one or more Access-Control-Allow-Methods headers consisting
			// of (a subset of) the list of methods.
			setHeader( "Access-Control-Allow-Methods", methods );
			// Add one or more Access-Control-Allow-Headers headers consisting
			// of (a subset of) the list of headers.
			setHeader( "Access-Control-Allow-Headers", requestHeaders );
			// And out.
			return endPreflight( );
		}
		else // Not OPTIONS
		{
			if ( supportsCredentials === true )
			{
				// If the resource supports credentials add a single
				// Access-Control-Allow-Origin header, with the value of the
				// Origin header as value, and add a single
				// Access-Control-Allow-Credentials header with the literal
				// string "true" as value.
				setHeader( "Access-Control-Allow-Origin", headers.origin );
				setHeader( "Access-Control-Allow-Credentials", "true" );
			}
			else
			{
				// Otherwise, add a single Access-Control-Allow-Origin header,
				// with either the value of the Origin header or the literal
				// string "*" as value.
				// If the list of origins is empty, use "*" as value.
				if ( origins.length > 0 || typeof origins === "function" )
					setHeader( "Access-Control-Allow-Origin", headers.origin );
				else
					setHeader( "Access-Control-Allow-Origin", "*" );
			}

			// If the list of exposed headers is not empty add one or more
			// Access-Control-Expose-Headers headers, with as values the
			// header field names given in the list of exposed headers.
			const exposedHeaders = responseHeaders.filter( responseHeader =>
				!simpleResponseHeaders.includes( responseHeader )
			);

			if ( exposedHeaders.length > 0 )
				setHeader( "Access-Control-Expose-Headers", exposedHeaders );
		}
	} )
	.then( ( ) => result );
};

export function setup( opts?: Partial< CorsOptions > ): CorsFunction
{
	const options: CorsOptions = Object.assign(
		{ },
		defaultOptions,
		filterOptions( opts )
	);

	return cors.bind( null, options );
}
