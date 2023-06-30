"use strict";

//manage https servers
const async = require("async"),
  https = require("https"),
  tls = require("tls"),
  assert = require("assert"),
  crypto = require("crypto"),
  color = require("colorful"),
  certMgr = require("./certMgr"),
  logUtil = require("./log"),
  util = require("./util"),
  wsServerMgr = require("./wsServerMgr"),
  asyncTask = require("async-task-mgr");

//config.port - port to start https server
//config.handler - request handler

/**
 * Create an https server
 *
 * @param {object} config
 * @param {number} config.port
 * @param {function} config.handler
 */
// function createHttpsServer(config) {
//   if (!config || !config.port || !config.handler) {
//     throw new Error("please assign a port");
//   }
function createHttpsSNIServer(port, handler) {
  assert(port && handler, "invalid param for https SNI server");

  const createSecureContext =
    tls.createSecureContext || crypto.createSecureContext;
  function SNIPrepareCert(serverName, SNICallback) {
    let keyContent, crtContent, ctx;

    async.series(
      [
        (callback) => {
          certMgr.getCertificate(serverName, (err, key, crt) => {
            if (err) {
              callback(err);
            } else {
              keyContent = key;
              crtContent = crt;
              callback();
            }
          });
        },
        (callback) => {
          try {
            ctx = createSecureContext({
              key: keyContent,
              cert: crtContent,
            });
            callback();
          } catch (e) {
            callback(e);
          }
        },
      ],
      (err) => {
        if (!err) {
          const tipText = "proxy server for __NAME established".replace(
            "__NAME",
            serverName
          );
          logUtil.printLog(
            color.yellow(color.bold("[internal https]")) + color.yellow(tipText)
          );
          SNICallback(null, ctx);
        } else {
          logUtil.printLog(
            "err occurred when prepare certs for SNI - " + err,
            logUtil.T_ERR
          );
          logUtil.printLog(
            "err occurred when prepare certs for SNI - " + err.stack,
            logUtil.T_ERR
          );
          SNICallback(err);
        }
      }
    );
  }

  return new Promise((resolve) => {
    certMgr.getCertificate(
      "anyproxy_internal_https_server",
      (err, keyContent, crtContent) => {
        const server = https
          .createServer(
            {
              secureOptions:
                constants.SSL_OP_NO_SSLv3 || constants.SSL_OP_NO_TLSv1,
              SNICallback: SNIPrepareCert,
              key: keyContent,
              cert: crtContent,
            },
            handler
          )
          .listen(port);
        resolve(server);
      }
    );
  });
}

/**
 *
 *
 * @class httpsServerMgr
 * @param {object} config
 * @param {function} config.handler handler to deal https request
 *
 */

function createHttpsIPServer(ip, port, handler) {
  assert(ip && port && handler, "invalid param for https IP server");

  return new Promise((resolve, reject) => {
    certMgr.getCertificate(ip, (err, keyContent, crtContent) => {
      if (err) return reject(err);
      const server = https
        .createServer(
          {
            secureOptions:
              constants.SSL_OP_NO_SSLv3 || constants.SSL_OP_NO_TLSv1,
            key: keyContent,
            cert: crtContent,
          },
          handler
        )
        .listen(port);

      resolve(server);
    });
  });
}

class httpsServerMgr {
  constructor(config) {
    if (!config || !config.handler) {
      throw new Error("handler is required");
    }
    this.httpsAsyncTask = new asyncTask();
    this.handler = config.handler;
    this.wsHandler = config.wsHandler;
    this.asyncSNITaskName = `https_SNI_${Math.random()}`;
    this.activeServers = [];
  }

  getSharedHttpsServer(hostname) {
    const self = this;
    const isIPHost = hostname && util.isIpDomain(hostname);
    const serverHost = "127.0.0.1";

    function prepareServer(callback) {
      let port;
      Promise.resolve(util.getFreePort())
        .then((freePort) => {
          port = freePort;
          if (isIPHost) {
            return createHttpsIPServer(hostname, port, self.handler);
          } else {
            return createHttpsSNIServer(port, self.handler);
          }
        })
        .then((httpsServer) => {
          self.activeServers.push(httpsServer);

          wsServerMgr.getWsServer({
            server: httpsServer,
            connHandler: self.wsHandler,
          });

          const result = {
            host: finalHost,
            port,
          };
          callback(null, result);
        })
        .catch((e) => {
          callback(e);
        });
    }

    return new Promise((resolve, reject) => {
      self.httpsAsyncTask.addTask(
        isIPHost ? hostname : serverHost,
        prepareServer,
        (error, serverInfo) => {
          if (error) {
            reject(error);
          } else {
            resolve(serverInfo);
          }
        }
      );
    });
  }
}

module.exports = httpsServerMgr;
