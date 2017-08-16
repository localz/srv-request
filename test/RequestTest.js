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

test.cb('test if srv-request is overriding init', t => {
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
  Request(getOptions, (err, response) => {
    if (err) return t.fail(err)
    t.is(response.statusCode, 200)
    t.true(initSpy.called)
    t.true(originalInitSpy.called)
    t.end()
  })
})

test.cb('test if request call returns correct status code', t => {
  const getOptions = { url: Constants.TEST_URL, method: 'GET', json: true }

  // Create Stubs
  t.context.sandbox.stub(dns, 'resolveSrv').callsFake((host, callback) => {
    callback(new Error('Some error'))
  })
  nock(Constants.TEST_URL).get('/').reply(404)

  // Perform Request
  Request(getOptions, (err, response) => {
    if (err) return t.fail(err)
    t.is(response.statusCode, 404)
    t.end()
  })
})
