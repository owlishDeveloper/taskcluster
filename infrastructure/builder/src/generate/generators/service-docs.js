const util = require('util');
const path = require('path');
const glob = require('glob');
const rimraf = util.promisify(require('rimraf'));
const mkdirp = util.promisify(require('mkdirp'));
const References = require('taskcluster-lib-references');
const exec = util.promisify(require('child_process').execFile);
const {REPO_ROOT, writeJSON} = require('../util');

/**
 * This file defines a few tasks that generate all of the documentation and
 * reference output from each service and include it in generated/docs and
 * generated/references.json.
 */
const SERVICES = glob.sync(
  'services/*/package.json',
  {cwd: REPO_ROOT})
  .map(filename => filename.split('/')[1])
  // this can't run writeDocs without 'yarn build', so ignore it for now.
  .filter(service => service !== 'web-server');

const genDir = path.join(REPO_ROOT, 'generated');
const docsDir = path.join(genDir, 'docs');

exports.tasks = [];

exports.tasks.push({
  title: `Clean Docs`,
  provides: ['clean-docs'],
  run: async (requirements, utils) => {
    await rimraf(docsDir);
    await mkdirp(docsDir);
  },
});

/**
 * Extract the docs/refs information from each service
 */
SERVICES.forEach(name => {
  exports.tasks.push({
    title: `Extract ${name} Docs Tarball`,
    requires: ['clean-docs'],
    provides: [`docs-tarball-${name}`],
    run: async (requirements, utils) => {
      const svcDir = path.join(docsDir, name);

      await mkdirp(docsDir);
      await rimraf(svcDir);

      // worker-manager uses a different filename from the other services..
      const main = name !== 'worker-manager' ? 'src/main.js' : 'lib/main.js';
      await exec('node', [main, 'writeDocs'], {
        cwd: path.join(REPO_ROOT, 'services', name),
        env: Object.assign({}, process.env, {
          NODE_ENV: 'production',
          PUBLISH_METADATA: 'false',
          DOCS_OUTPUT_DIR: svcDir,
        }),
      });

      return {
        [`docs-tarball-${name}`]: svcDir,
      };
    },
  });
});

exports.tasks.push({
  title: `Generate References`,
  requires: SERVICES.map(name => `docs-tarball-${name}`),
  provides: [
    'target-references',
    'references-json',
  ],
  run: async (requirements, utils) => {
    await mkdirp(genDir);

    const refs = References.fromBuiltServices({directory: docsDir});
    const serializable = refs.makeSerializable();

    // sort the serializable output by filename to ensure consistency
    serializable.sort((a, b) => {
      if (a.filename < b.filename) {
        return 1;
      } else if (a.filename > b.filename) {
        return -1;
      } else {
        return 0;
      }
    });

    await writeJSON('generated/references.json', serializable);

    return {
      'target-references': true,
      'references-json': serializable,
    };
  },
});
