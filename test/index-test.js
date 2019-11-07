/*!
 * Copyright (c) 2019, Braydon Fuller
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0

 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

const assert = require('assert');
const {randomBytes} = require('crypto');
const {resolve} = require('path');
const {tmpdir} = require('os');
const {expandSrc, listTags, matchTag, clone} = require('../');

describe('Git Package Manager', function() {
  const datadir = resolve(__dirname, './data');
  const testdir = `${tmpdir()}/gpm-test-${randomBytes(4).toString('hex')}`;

  const remotes = {
    file: [
      datadir
    ],
    onion: [
      'ssh://git@fszyuaceipjhnbyy44mtfmoocwzgzunmdu46votrm5c72poeeffa.onion:22',
      'ssh://git@xg5jwb4xxwajkhur2ahuhtdwifniyoyvbm5h4yzawawwjziol3jq.onion:22',
      'ssh://git@23aj5gsggiufl6qhfbmzwd334qyhgaugbh2g3ty4ecl3jikmt5ja.onion:22',
    ],
    gitlab: [
      'https://gitlab.com'
    ],
    github: [
      'https://github.com',
    ]
  };

  it('should parse source', () => {
    const vectors = [
      {
        input: 'github:bcoin-org/bdb@~1.1.7',
        output: {
          git: [
            'https://github.com/bcoin-org/bdb.git'
          ],
          version: '~1.1.7'
        }
      },
      {
        input: 'gitlab:bcoin-org/bdb@~1.1.7',
        output: {
          git: [
            'https://gitlab.com/bcoin-org/bdb.git'
          ],
          version: '~1.1.7'
        }
      },
      {
        input: 'onion:bcoin/bcoin@~1.1.7',
        output: {
          git: [
            'ssh://git@fszyuaceipjhnbyy44mtfmoocwzgzunmdu46votrm5c72poeeffa.onion:22/bcoin/bcoin.git',
            'ssh://git@xg5jwb4xxwajkhur2ahuhtdwifniyoyvbm5h4yzawawwjziol3jq.onion:22/bcoin/bcoin.git',
            'ssh://git@23aj5gsggiufl6qhfbmzwd334qyhgaugbh2g3ty4ecl3jikmt5ja.onion:22/bcoin/bcoin.git',
          ],
          version: '~1.1.7'
        }
      },
      {
        input: 'file:repo@~1.1.7',
        output: {
          git: [
            `${datadir}/repo/.git`
          ],
          version: '~1.1.7'
        }
      }
    ];

    for (const {input, output} of vectors) {
      const src = expandSrc(remotes, input);
      assert.deepEqual(src, output);
    }
  });

  it('should find all tags', async () => {
    const git = `${datadir}/repo/.git`;

    const tags = await listTags(git);
    assert.deepEqual(tags, ['v1.0.0','v1.1.0','v2.0.0']);
  });

  it('should find matching semver tags', async () => {
    const tags = ['v1.0.0', 'v1.1.0', 'v2.0.0'];

    let tag = null;

    tag = matchTag(tags, '^1.0.0');
    assert.equal(tag, 'v1.1.0');

    tag = matchTag(tags, '^1.1.0');
    assert.equal(tag, 'v1.1.0');

    tag = matchTag(tags, '^2.0.0');
    assert.equal(tag, 'v2.0.0');
  });

  it('should clone and verify signature', async () => {
    let err = null;

    try {
      await clone(remotes, 'file:repo@~1.1.0', testdir);
    } catch (e) {
      err = e;
    }

    assert(!err);
  });
});
