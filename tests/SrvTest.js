const test = require('ava')
const sinon = require('sinon')
const nock = require('nock')
const dns = require('dns')

const Request = require('../index')
const Constants = require('./Constants')

test.beforeEach(t => {
  t.context.sandbox = sinon.sandbox.create()
})

test.afterEach(t => {
  t.context.sandbox.restore()
  nock.cleanAll()
})

test.cb('should override init and call original thorugh original_init', t => {
  const getOptions = { url: Constants.TEST_URL, method: 'GET', json: true }

  // Create Spies
  const initSpy = t.context.sandbox.spy(Request.Request.prototype, 'init')
  const originalInitSpy = t.context.sandbox.spy(Request.Request.prototype, 'original_init')

  // Create Stubs
  t.context.sandbox.stub(dns, 'resolveSrv').callsFake((host, callback) => {
    callback(new Error('Some error'))
  })
  nock(Constants.TEST_URL).get('/').reply(200)

  // Perform Request
  Request(getOptions, (err, { statusCode }) => {
    if (err) return t.fail(err)
    t.is(statusCode, 200)
    t.true(initSpy.called)
    t.true(originalInitSpy.called)
    t.end()
  })
})

test.cb('should return correct status code', t => {
  const getOptions = { url: Constants.TEST_URL, method: 'GET', json: true }

  // Create Stubs
  t.context.sandbox.stub(dns, 'resolveSrv').callsFake((host, callback) => {
    callback(new Error('Some error'))
  })
  nock(Constants.TEST_URL).get('/').reply(404)

  // Perform Request
  Request(getOptions, (err, { statusCode }) => {
    if (err) return t.fail(err)
    t.is(statusCode, 404)
    t.end()
  })
})

test.cb('should use SRV name and port - generic', t => {
  const getOptions = { url: Constants.TEST_URL, method: 'GET', json: true }

  const initSpy = t.context.sandbox.spy(Request.Request.prototype, 'init')

  // Create Stubs
  t.context.sandbox.stub(dns, 'resolveSrv').callsFake((host, callback) => {
    return callback(null, [
      {
        priority: 10,
        weight: 5,
        port: Constants.SRV_PORT,
        name: Constants.SRV_NAME
      }
    ])
  })
  nock(Constants.SRV_URL).get('/').reply(200)

  // Perform Request
  Request(getOptions, (err, { statusCode }) => {
    if (err) return t.fail(err)
    const requestVal = initSpy.getCall(0).thisValue
    t.is(statusCode, 200)
    t.is(requestVal.uri.host, Constants.SRV_NAME)
    t.is(requestVal.uri.hostname, Constants.SRV_NAME)
    t.is(requestVal.uri.port, Constants.SRV_PORT)
    t.end()
  })
})

test.cb('should use SRV name and port - CNC', t => {
  const getOptions = { url: Constants.CNC_BLUE_URL, method: 'GET', json: true }

  const initSpy = t.context.sandbox.spy(Request.Request.prototype, 'init')

  // Create Stubs
  t.context.sandbox.stub(dns, 'resolveSrv').callsFake((host, callback) => {
    return callback(null, [
      {
        priority: 1,
        weight: 1,
        port: Constants.CNC_BLUE_SRV_PORT,
        name: Constants.CNC_BLUE_SRV_NAME
      }
    ])
  })
  nock(Constants.CNC_BLUE_SRV_URL).get('/').reply(200, {
    result: '=^..^=',
    version: 'xyz'
  })

  // Perform Request
  Request(getOptions, (err, { statusCode }, body) => {
    if (err) return t.fail(err)
    const requestVal = initSpy.getCall(0).thisValue
    t.is(statusCode, 200)
    t.is(body.result, '=^..^=')
    t.is(body.version, 'xyz')
    t.is(requestVal.uri.host, Constants.CNC_BLUE_SRV_NAME)
    t.is(requestVal.uri.hostname, Constants.CNC_BLUE_SRV_NAME)
    t.is(requestVal.uri.port, Constants.CNC_BLUE_SRV_PORT)
    t.end()
  })
})

test.cb('should fall back when resolveSrv returns empty array', t => {
  const getOptions = { url: Constants.TEST_URL, method: 'GET', json: true }

  // Create Stubs
  t.context.sandbox.stub(dns, 'resolveSrv').callsFake((host, callback) => {
    return callback(null, [])
  })
  nock(Constants.TEST_URL).get('/').reply(200)

  // Perform Request
  Request(getOptions, (err, { statusCode }) => {
    if (err) return t.fail(err)
    t.is(statusCode, 200)
    t.end()
  })
})

test.cb('should fall back when resolveSrv returns null', t => {
  const getOptions = { url: Constants.TEST_URL, method: 'GET', json: true }

  // Create Stubs
  t.context.sandbox.stub(dns, 'resolveSrv').callsFake((host, callback) => {
    return callback(null, null)
  })
  nock(Constants.TEST_URL).get('/').reply(200)

  // Perform Request
  Request(getOptions, (err, { statusCode }) => {
    if (err) return t.fail(err)
    t.is(statusCode, 200)
    t.end()
  })
})

test.cb('should fall back when resolveSrv returns an error', t => {
  const getOptions = { url: Constants.TEST_URL, method: 'GET', json: true }

  // Create Stubs
  t.context.sandbox.stub(dns, 'resolveSrv').callsFake((host, callback) => {
    callback(new Error('Some error'))
  })
  nock(Constants.TEST_URL).get('/').reply(200)

  // Perform Request
  Request(getOptions, (err, { statusCode }) => {
    if (err) return t.fail(err)
    t.is(statusCode, 200)
    t.end()
  })
})
