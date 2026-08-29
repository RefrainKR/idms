import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const HTML_ASSET_PATTERN = /(\b(?:src|href)\s*=\s*)(["'])([^"'<>]+)\2(?:\d+)?()/gi;
const MODULE_FROM_PATTERN = /^(\s*(?:import|export)\b[^\r\n]*?\bfrom\s*)(["'])([^"']+)\2(?:\d+)?()/gm;
const SIDE_EFFECT_IMPORT_PATTERN = /^(\s*import\s*)(["'])([^"']+)\2(?:\d+)?()/gm;
const DYNAMIC_IMPORT_PATTERN = /(\bimport\s*\(\s*)(["'])([^"']+)\2(\s*\))/g;
const EXCLUDED_URL_PATTERN = /^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i;

function splitSpecifier(specifier) {
    const hashIndex = specifier.indexOf('#');
    const hash = hashIndex >= 0 ? specifier.slice(hashIndex) : '';
    const withoutHash = hashIndex >= 0 ? specifier.slice(0, hashIndex) : specifier;
    const queryIndex = withoutHash.indexOf('?');

    return {
        pathname: queryIndex >= 0 ? withoutHash.slice(0, queryIndex) : withoutHash,
        query: queryIndex >= 0 ? withoutHash.slice(queryIndex + 1) : '',
        hash
    };
}

function isLocalAsset(specifier, extensions) {
    if (!specifier || EXCLUDED_URL_PATTERN.test(specifier)) return false;
    const { pathname } = splitSpecifier(specifier);
    const lowerPath = pathname.toLowerCase();
    return extensions.some(extension => lowerPath.endsWith(extension));
}

function withCacheKey(specifier, cacheKey) {
    const { pathname, query, hash } = splitSpecifier(specifier);
    const params = new URLSearchParams(query);
    params.set('v', cacheKey);
    return `${pathname}?${params.toString()}${hash}`;
}

function withoutCacheKey(specifier) {
    const { pathname, query, hash } = splitSpecifier(specifier);
    const params = new URLSearchParams(query);
    params.delete('v');
    const remainingQuery = params.toString();
    return `${pathname}${remainingQuery ? `?${remainingQuery}` : ''}${hash}`;
}

function cacheKeyOf(specifier) {
    const { query } = splitSpecifier(specifier);
    return new URLSearchParams(query).get('v');
}

function replaceReferences(content, pattern, extensions, transform, references) {
    return content.replace(pattern, (match, prefix, quote, specifier, suffix = '') => {
        if (!isLocalAsset(specifier, extensions)) return match;
        const rewritten = transform(specifier);
        references.push({ before: specifier, after: rewritten });
        return `${prefix}${quote}${rewritten}${quote}${suffix}`;
    });
}

function rewriteHtml(content, cacheKey) {
    const references = [];
    const output = replaceReferences(
        content,
        HTML_ASSET_PATTERN,
        ['.js', '.css'],
        specifier => withCacheKey(specifier, cacheKey),
        references
    );
    return { output, references };
}

function rewriteJavaScript(content, cacheKey) {
    const references = [];
    let output = replaceReferences(
        content,
        MODULE_FROM_PATTERN,
        ['.js'],
        specifier => withCacheKey(specifier, cacheKey),
        references
    );
    output = replaceReferences(
        output,
        SIDE_EFFECT_IMPORT_PATTERN,
        ['.js'],
        specifier => withCacheKey(specifier, cacheKey),
        references
    );
    output = replaceReferences(
        output,
        DYNAMIC_IMPORT_PATTERN,
        ['.js'],
        specifier => withCacheKey(specifier, cacheKey),
        references
    );
    return { output, references };
}

function removeCacheKeysFromContent(content, isHtml) {
    const references = [];
    const patterns = isHtml
        ? [[HTML_ASSET_PATTERN, ['.js', '.css']]]
        : [
            [MODULE_FROM_PATTERN, ['.js']],
            [SIDE_EFFECT_IMPORT_PATTERN, ['.js']],
            [DYNAMIC_IMPORT_PATTERN, ['.js']]
        ];
    let output = content;
    for (const [pattern, extensions] of patterns) {
        output = replaceReferences(output, pattern, extensions, withoutCacheKey, references);
    }
    return { output, references };
}

function collectReferences(content, pattern, extensions) {
    const references = [];
    pattern.lastIndex = 0;
    for (const match of content.matchAll(pattern)) {
        const specifier = match[3];
        if (isLocalAsset(specifier, extensions)) references.push(specifier);
    }
    return references;
}

function collectHtmlReferences(content) {
    return collectReferences(content, HTML_ASSET_PATTERN, ['.js', '.css']);
}

function collectJavaScriptReferences(content) {
    return [
        ...collectReferences(content, MODULE_FROM_PATTERN, ['.js']),
        ...collectReferences(content, SIDE_EFFECT_IMPORT_PATTERN, ['.js']),
        ...collectReferences(content, DYNAMIC_IMPORT_PATTERN, ['.js'])
    ];
}

async function listTargetFiles(rootDirectory) {
    const files = [];

    async function walk(directory) {
        const entries = await readdir(directory, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(directory, entry.name);
            if (entry.isDirectory()) await walk(fullPath);
            else if (entry.isFile() && (entry.name.endsWith('.html') || entry.name.endsWith('.js'))) {
                files.push(fullPath);
            }
        }
    }

    await walk(rootDirectory);
    return files.sort();
}

function normalizeCacheKey(rawCacheKey) {
    if (!rawCacheKey || !/^[a-f\d]{7,64}$/i.test(rawCacheKey)) {
        throw new Error('Cache key must be a Git commit SHA with 7-64 hexadecimal characters.');
    }
    return rawCacheKey.slice(0, 12).toLowerCase();
}

export async function applyDeploymentCacheKey(rootDirectory, rawCacheKey) {
    const cacheKey = normalizeCacheKey(rawCacheKey);
    const files = await listTargetFiles(rootDirectory);
    let changedFileCount = 0;
    let rewrittenReferenceCount = 0;

    for (const file of files) {
        const content = await readFile(file, 'utf8');
        const result = file.endsWith('.html')
            ? rewriteHtml(content, cacheKey)
            : rewriteJavaScript(content, cacheKey);

        rewrittenReferenceCount += result.references.length;
        if (result.output !== content) {
            await writeFile(file, result.output, 'utf8');
            changedFileCount += 1;
        }
    }

    await verifyDeploymentCacheKey(rootDirectory, cacheKey);
    return { cacheKey, changedFileCount, rewrittenReferenceCount };
}

export async function verifyDeploymentCacheKey(rootDirectory, rawCacheKey) {
    const cacheKey = normalizeCacheKey(rawCacheKey);
    const files = await listTargetFiles(rootDirectory);
    const errors = [];
    let checkedReferenceCount = 0;

    for (const file of files) {
        const content = await readFile(file, 'utf8');
        const references = file.endsWith('.html')
            ? collectHtmlReferences(content)
            : collectJavaScriptReferences(content);

        for (const specifier of references) {
            checkedReferenceCount += 1;
            if (cacheKeyOf(specifier) !== cacheKey) {
                errors.push(`${path.relative(rootDirectory, file)}: ${specifier}`);
            }
        }
    }

    if (errors.length > 0) {
        throw new Error(`Deployment cache-key verification failed:\n${errors.join('\n')}`);
    }
    return { cacheKey, checkedReferenceCount };
}

export async function verifySourceHasNoCacheKeys(rootDirectory) {
    const files = await listTargetFiles(rootDirectory);
    const errors = [];
    let checkedReferenceCount = 0;

    for (const file of files) {
        const content = await readFile(file, 'utf8');
        const references = file.endsWith('.html')
            ? collectHtmlReferences(content)
            : collectJavaScriptReferences(content);

        for (const specifier of references) {
            checkedReferenceCount += 1;
            if (cacheKeyOf(specifier) !== null) {
                errors.push(`${path.relative(rootDirectory, file)}: ${specifier}`);
            }
        }
    }

    if (errors.length > 0) {
        throw new Error(`Source contains deployment cache keys:\n${errors.join('\n')}`);
    }
    return { checkedReferenceCount };
}

export async function removeSourceCacheKeys(rootDirectory) {
    const files = await listTargetFiles(rootDirectory);
    let changedFileCount = 0;
    let inspectedReferenceCount = 0;

    for (const file of files) {
        const content = await readFile(file, 'utf8');
        const result = removeCacheKeysFromContent(content, file.endsWith('.html'));
        inspectedReferenceCount += result.references.length;
        if (result.output !== content) {
            await writeFile(file, result.output, 'utf8');
            changedFileCount += 1;
        }
    }

    await verifySourceHasNoCacheKeys(rootDirectory);
    return { changedFileCount, inspectedReferenceCount };
}

async function main() {
    const [mode, rootArgument, cacheKeyArgument] = process.argv.slice(2);
    if (!mode || !rootArgument) {
        throw new Error('Usage: node scripts/apply-deployment-cache-key.mjs <--write|--check|--check-source|--clean-source> <directory> [git-sha]');
    }

    const rootDirectory = path.resolve(rootArgument);
    let result;
    if (mode === '--write') result = await applyDeploymentCacheKey(rootDirectory, cacheKeyArgument);
    else if (mode === '--check') result = await verifyDeploymentCacheKey(rootDirectory, cacheKeyArgument);
    else if (mode === '--check-source') result = await verifySourceHasNoCacheKeys(rootDirectory);
    else if (mode === '--clean-source') result = await removeSourceCacheKeys(rootDirectory);
    else throw new Error(`Unknown mode: ${mode}`);

    console.log(JSON.stringify({ mode, rootDirectory, ...result }));
}

const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : '';
if (import.meta.url === invokedPath) {
    main().catch(error => {
        console.error(error.message);
        process.exitCode = 1;
    });
}
