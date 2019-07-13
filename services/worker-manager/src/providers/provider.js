const assert = require('assert');
const libUrls = require('taskcluster-lib-urls');

/**
 * The parent class for all providers.
 *
 * See ../../providers.md for information on writing providers.
 */
class Provider {
  constructor({
    providerId,
    monitor,
    notify,
    rootUrl,
    estimator,
    validator,
    Worker,
    WorkerPool,
    WorkerPoolError,
  }) {
    this.providerId = providerId;
    this.monitor = monitor;
    this.validator = validator;
    this.notify = notify;
    this.rootUrl = rootUrl;
    this.estimator = estimator;
    this.Worker = Worker;
    this.WorkerPool = WorkerPool;
    this.WorkerPoolError = WorkerPoolError;
  }

  async setup() {
  }

  async initiate() {
  }

  async terminate() {
  }

  validate(config) {
    assert(this.configSchema); // This must be set up by a provider impl
    return this.validator(config, libUrls.schema(this.rootUrl, 'worker-manager', `v1/${this.configSchema}.yml`));
  }

  async prepare() {
  }

  async provision({workerPool}) {
  }

  async deprovision({workerPool}) {
  }

  async registerWorker({worker, workerPool, workerIdentityProof}) {
  }

  async cleanup() {
  }

  async scanPrepare() {
  }

  async checkWorker({Worker}) { // todo: it seems we're actually getting worker object
  }

  async scanCleanup() {
  }

  async createWorker({workerPool, workerGroup, workerId, input}) {
  }

  async removeWorker(worker) {
  }

  async createResources({workerPool}) {
  }

  async updateResources({workerPool}) {
  }

  async removeResources({workerPool}) {
  }
}

/**
 * An error which, if thrown from API-related Provider methods, will be returned to
 * the user as a 400 Bad Request error containing `err.message`.
 */
class ApiError extends Error {
}

module.exports = {
  Provider,
  ApiError,
};
