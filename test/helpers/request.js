'use strict'

const http = require('node:http')
const https = require('node:https')

// Minimal undici-compatible `request()` built on node:http / node:https.
//
// The HTTPS path attaches a dedicated https.Agent that trusts the
// self-signed certificate from test/fixtures, so no global state
// (e.g. NODE_TLS_REJECT_UNAUTHORIZED) leaks into the test process.
function request (url, opts = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https://')
    const lib = isHttps ? https : http

    const finalOpts = { ...opts }
    if (isHttps && !finalOpts.agent) {
      finalOpts.agent = new https.Agent({ rejectUnauthorized: false })
    }

    const req = lib.request(url, finalOpts, (res) => {
      const chunks = []
      res.on('data', (chunk) => chunks.push(chunk))
      res.on('end', () => {
        const body = Buffer.concat(chunks).toString('utf8')
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: {
            json: async () => JSON.parse(body),
            text: async () => body
          }
        })
      })
    })
    req.on('error', reject)
    req.end()
  })
}

module.exports = { request }
