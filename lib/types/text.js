/*!
 * body-parser
 * Copyright(c) 2014-2015 Douglas Christopher Wilson
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var bytes = require('bytes')
var contentType = require('content-type')
var debug = require('debug')('body-parser:text')
var read = require('../read')
var typeis = require('type-is')

/**
 * Module exports.
 */

module.exports = text

/**
 * Create a middleware to parse text bodies.
 *
 * @param {object} [options]
 * @return {function}
 * @api public
 */

function text(options) {
  options = options || {};

  var defaultCharset = options.defaultCharset || 'utf-8'
  var inflate = options.inflate !== false
  var limit = typeof options.limit !== 'number'
    ? bytes(options.limit || '100kb')
    : options.limit
  var type = options.type || 'text/plain'
  var verify = options.verify || false

  if (verify !== false && typeof verify !== 'function') {
    throw new TypeError('option verify must be function')
  }

  // create the appropriate type checking function
  var shouldParse = typeof type !== 'function'
    ? typeChecker(type)
    : type

  function parse(buf) {
    return buf
  }

  return function textParser(req, res, next) {
    if (req._body) {
      return debug('body already parsed'), next()
    }

    req.body = req.body || {}

    // skip requests without bodies
    if (!typeis.hasBody(req)) {
      return debug('skip empty body'), next()
    }

    debug('content-type %s', JSON.stringify(req.headers['content-type']))

    // determine if request should be parsed
    if (!shouldParse(req)) {
      return debug('skip parsing'), next()
    }

    // get charset
    var charset = getCharset(req) || defaultCharset

    // read
    read(req, res, next, parse, debug, {
      encoding: charset,
      inflate: inflate,
      limit: limit,
      verify: verify
    })
  }
}

/**
 * Get the charset of a request.
 *
 * @param {object} req
 * @api private
 */

function getCharset(req) {
  try {
    return contentType.parse(req).parameters.charset.toLowerCase()
  } catch (e) {
    return undefined
  }
}

/**
 * Get the simple type checker.
 *
 * @param {string} type
 * @return {function}
 */

function typeChecker(type) {
  return function checkType(req) {
    return Boolean(typeis(req, type))
  }
}
