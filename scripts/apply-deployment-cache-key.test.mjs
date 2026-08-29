import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
    applyDeploymentCacheKey,
    removeSourceCacheKeys,
    verifyDeploymentCacheKey,
    verifySourceHasNoCacheKeys
} from './apply-deployment-cache-key.mjs';

test('배포 사본의 로컬 JS/CSS 참조에만 동일한 SHA를 삽입한다', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'idms-cache-key-'));
    try {
        await mkdir(path.join(root, 'js'), { recursive: true });
        await writeFile(path.join(root, 'index.html'), [
            '<link rel="stylesheet" href="css/common.css?theme=dark#top">',
            '<script src="https://cdn.example.com/chart.js"></script>',
            '<script type="module" src="js/main.js"></script>'
        ].join('\n'));
        await writeFile(path.join(root, 'js', 'main.js'), [
            "import value from './value.js';",
            "import './side-effect.js?old=1&v=old';",
            "export { helper } from './helper.js#named';",
            "const lazy = import('./lazy.js');",
            "import external from 'https://cdn.example.com/external.js';"
        ].join('\n'));

        await verifySourceHasNoCacheKeys(root).then(
            () => assert.fail('기존 v 쿼리를 검출해야 합니다.'),
            error => assert.match(error.message, /side-effect\.js/)
        );

        const result = await applyDeploymentCacheKey(root, 'ABCDEF1234567890');
        assert.equal(result.cacheKey, 'abcdef123456');
        assert.equal(result.rewrittenReferenceCount, 6);

        const html = await readFile(path.join(root, 'index.html'), 'utf8');
        assert.match(html, /common\.css\?theme=dark&v=abcdef123456#top/);
        assert.match(html, /main\.js\?v=abcdef123456/);
        assert.match(html, /https:\/\/cdn\.example\.com\/chart\.js/);

        const javaScript = await readFile(path.join(root, 'js', 'main.js'), 'utf8');
        assert.match(javaScript, /value\.js\?v=abcdef123456/);
        assert.match(javaScript, /side-effect\.js\?old=1&v=abcdef123456/);
        assert.match(javaScript, /helper\.js\?v=abcdef123456#named/);
        assert.match(javaScript, /lazy\.js\?v=abcdef123456/);
        assert.match(javaScript, /https:\/\/cdn\.example\.com\/external\.js/);

        const verification = await verifyDeploymentCacheKey(root, 'abcdef1234567890');
        assert.equal(verification.checkedReferenceCount, 6);

        const cleanup = await removeSourceCacheKeys(root);
        assert.equal(cleanup.changedFileCount, 2);
        await verifySourceHasNoCacheKeys(root);
        assert.doesNotMatch(await readFile(path.join(root, 'index.html'), 'utf8'), /\?[^"']*\bv=/);
        assert.doesNotMatch(await readFile(path.join(root, 'js', 'main.js'), 'utf8'), /\?[^"']*\bv=/);
    } finally {
        await rm(root, { recursive: true, force: true });
    }
});

test('키가 없거나 다른 로컬 참조가 있으면 검사가 실패한다', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'idms-cache-key-'));
    try {
        await writeFile(path.join(root, 'index.html'), '<script type="module" src="js/main.js?v=deadbee"></script>');
        await assert.rejects(
            verifyDeploymentCacheKey(root, 'abcdef1234567890'),
            /cache-key verification failed/
        );
    } finally {
        await rm(root, { recursive: true, force: true });
    }
});
