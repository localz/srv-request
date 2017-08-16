const test = require('ava')
const sinon = require('sinon')
const nock = require('nock')
const dns = require('dns')

const Request = require('../index')
const Constants = require('./helpers/Constants')

test.beforeEach(t => {
  t.context.sandbox = sinon.sandbox.create()
})

test.afterEach(t => {
  t.context.sandbox.restore()
  nock.cleanAll()
})

test.cb('should use SRV name and port ', t => {
  const getOptions = { url: Constants.TEST_URL, method: 'GET', json: true }

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
  Request(getOptions, (err, response) => {
    if (err) return t.fail(err)
    t.is(response.statusCode, 200)
    t.end()
  })
})

test.cb('should fall back when resolvSrv returns empty array', t => {
  const getOptions = { url: Constants.TEST_URL, method: 'GET', json: true }

  // Create Stubs
  t.context.sandbox.stub(dns, 'resolveSrv').callsFake((host, callback) => {
    return callback(null, [])
  })
  nock(Constants.TEST_URL).get('/').reply(200)

  // Perform Request
  Request(getOptions, (err, response) => {
    if (err) return t.fail(err)
    t.is(response.statusCode, 200)
    t.end()
  })
})

test.cb('should fall back when resolvSrv returns null', t => {
  const getOptions = { url: Constants.TEST_URL, method: 'GET', json: true }

  // Create Stubs
  t.context.sandbox.stub(dns, 'resolveSrv').callsFake((host, callback) => {
    return callback(null, null)
  })
  nock(Constants.TEST_URL).get('/').reply(200)

  // Perform Request
  Request(getOptions, (err, response) => {
    if (err) return t.fail(err)
    t.is(response.statusCode, 200)
    t.end()
  })
})

test.cb('should fall back when resolvSrv returns an error', t => {
  const getOptions = { url: Constants.TEST_URL, method: 'GET', json: true }

  // Create Stubs
  t.context.sandbox.stub(dns, 'resolveSrv').callsFake((host, callback) => {
    callback(new Error('Some error'))
  })
  nock(Constants.TEST_URL).get('/').reply(200)

  // Perform Request
  Request(getOptions, (err, response) => {
    if (err) return t.fail(err)
    t.is(response.statusCode, 200)
    t.end()
  })
})
