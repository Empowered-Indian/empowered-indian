import { describe, expect, it } from 'vitest'
import indexHtml from '../../index.html?raw'
import cloudflareHeaders from '../../public/_headers?raw'
import cloudflareRedirects from '../../public/_redirects?raw'
import viteConfig from '../../vite.config.js?raw'

describe('performance shell configuration', () => {
  it('serves a visible first-paint shell for home and MPLADS routes', () => {
    expect(indexHtml).toContain("dataset.initialRoute = location.pathname.startsWith('/mplads')")
    expect(indexHtml).toContain('Empowered Indian')
    expect(indexHtml).toContain('MPLADS Dashboard')
    expect(indexHtml).toContain('Overview of Member of Parliament Local Area Development Scheme')
  })

  it('sets immutable Cloudflare Pages cache headers for hashed assets', () => {
    expect(cloudflareHeaders).toContain('/assets/*')
    expect(cloudflareHeaders).toContain('Cache-Control: public, max-age=31536000, immutable')
  })

  it('keeps Cloudflare Pages deep links routed to the SPA shell', () => {
    expect(cloudflareRedirects).toContain('/robots.txt /robots.txt 200')
    expect(cloudflareRedirects).toContain('/* /index.html 200')
  })

  it('keeps deferred chart bundles out of the initial route graph', () => {
    expect(viteConfig).toContain('hoistTransitiveImports: false')
    expect(viteConfig).toContain('return deps.filter')
    expect(viteConfig).toContain('(charts|pdf-vendor)')
  })
})
