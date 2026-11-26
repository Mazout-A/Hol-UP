// @ts-check
import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, relative, sep } from 'node:path';

// Liste tous les fichiers d'un dossier, sous-dossiers compris
function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

// Mode hors ligne : après chaque build, écrit dist/sw.js avec la liste exacte des fichiers du site
const offline = () => ({
  name: 'offline-service-worker',
  hooks: {
    'astro:build:done': ({ dir }) => {
      const out = fileURLToPath(dir);
      const files = walk(out)
        .filter((file) => !file.endsWith('sw.js') && !file.endsWith('.map') && !file.endsWith('404.html'))
        .sort();

      const urls = files.map((file) => {
        const path = '/' + relative(out, file).split(sep).join('/');
        return path.endsWith('/index.html') ? path.slice(0, -'index.html'.length) : path;
      });

      // La version change dès qu'un fichier change : les visiteurs reçoivent alors la mise à jour
      const hash = createHash('sha1');
      files.forEach((file) => hash.update(file).update(readFileSync(file)));
      const version = hash.digest('hex').slice(0, 10);

      const template = readFileSync('src/sw.template.js', 'utf8')
        .replace('__VERSION__', version)
        .replace('__PRECACHE__', JSON.stringify(urls));

      writeFileSync(join(out, 'sw.js'), template);
      console.log(`[offline] sw.js written: ${urls.length} files, version ${version}`);
    },
  },
});

// En local (astro dev), sert la fonction /api/submit-event comme le fera Vercel.
// Sans GITHUB_TOKEN dans le fichier .env, c'est un mode « essai » : la carte est vérifiée mais rien n'est envoyé.
const devApi = () => ({
  name: 'dev-api',
  hooks: {
    'astro:server:setup': ({ server }) => {
      server.middlewares.use('/api/submit-event', async (req, res) => {
        try {
          const env = loadEnv('development', process.cwd(), '');
          for (const [key, value] of Object.entries(env)) {
            if (!(key in process.env)) process.env[key] = value;
          }

          const chunks = [];
          for await (const chunk of req) chunks.push(chunk);
          const raw = Buffer.concat(chunks).toString('utf8');
          try { /** @type {any} */ (req).body = raw ? JSON.parse(raw) : undefined; } catch { /** @type {any} */ (req).body = raw; }

          /** @type {any} */ (res).status = (code) => { res.statusCode = code; return res; };
          /** @type {any} */ (res).json = (data) => {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(data));
          };

          const module = await server.ssrLoadModule('/api/submit-event.js');
          await module.default(req, res);
        } catch (error) {
          console.error('[dev-api]', error);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ ok: false, error: 'Dev API error' }));
        }
      });
    },
  },
});

// https://astro.build/config
export default defineConfig({
  integrations: [offline(), devApi()],
});
