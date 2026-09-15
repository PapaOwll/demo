// GitHub Pages does not support SPA fallback redirects, so deep links
// (e.g. /demo/users) would 404. Serving a copy of index.html as the
// custom 404 page boots the app and lets vue-router handle the path.
import { copyFileSync, existsSync } from 'node:fs'

if (existsSync('dist/index.html')) {
  copyFileSync('dist/index.html', 'dist/404.html')
  console.log('dist/404.html created (SPA fallback for GitHub Pages)')
}
