import { describe, expect, it } from 'vitest'
import { getRouteAnalyticsMetadata, getRoutePageViewPayload } from './routeAnalytics'

describe('getRouteAnalyticsMetadata', () => {
  it('labels the MPLADS dashboard route', () => {
    expect(getRouteAnalyticsMetadata('/mplads')).toEqual({
      pageName: 'MPLADS Dashboard',
      routePattern: '/mplads',
      contentType: 'dashboard',
      search: '',
    })
  })

  it('captures a specific MP detail page id', () => {
    expect(getRouteAnalyticsMetadata('/mplads/mps/jane-doe-123', '?house=Lok%20Sabha')).toEqual({
      pageName: 'MP Detail',
      routePattern: '/mplads/mps/:mpId',
      contentType: 'mp_profile',
      contentId: 'jane-doe-123',
      search: '?house=Lok%20Sabha',
    })
  })

  it('captures a specific state detail page id', () => {
    expect(getRouteAnalyticsMetadata('/mplads/states/Uttar%20Pradesh')).toEqual({
      pageName: 'State Detail',
      routePattern: '/mplads/states/:stateId',
      contentType: 'state_profile',
      contentId: 'Uttar Pradesh',
      search: '',
    })
  })

  it('falls back to the raw id when a dynamic route has malformed encoding', () => {
    expect(getRouteAnalyticsMetadata('/mplads/mps/%E0%A4%A')).toEqual({
      pageName: 'MP Detail',
      routePattern: '/mplads/mps/:mpId',
      contentType: 'mp_profile',
      contentId: '%E0%A4%A',
      search: '',
    })
  })

  it('does not label nested MP detail misses as real profiles', () => {
    expect(getRouteAnalyticsMetadata('/mplads/mps/jane-doe-123/extra')).toEqual({
      pageName: 'Not Found',
      routePattern: '*',
      contentType: 'not_found',
      search: '',
    })
  })

  it('does not label nested state detail misses as real profiles', () => {
    expect(getRouteAnalyticsMetadata('/mplads/states/uttar-pradesh/extra')).toEqual({
      pageName: 'Not Found',
      routePattern: '*',
      contentType: 'not_found',
      search: '',
    })
  })

  it('normalizes trailing slash static routes', () => {
    expect(getRouteAnalyticsMetadata('/about-us/')).toEqual({
      pageName: 'About Us',
      routePattern: '/about-us',
      contentType: 'marketing_page',
      search: '',
    })
  })

  it('scrubs sensitive query data from verification page views', () => {
    const payload = getRoutePageViewPayload(
      '/verify-email',
      '?token=secret-token&email=user@example.com',
      'https://empoweredindian.in'
    )

    expect(payload).toEqual({
      pageName: 'Verify Email',
      parameters: {
        page_path: '/verify-email',
        page_location: 'https://empoweredindian.in/verify-email',
        route_pattern: '/verify-email',
        content_type: 'auth_page',
        content_id: '',
        search: '',
      },
    })
    expect(JSON.stringify(payload)).not.toContain('secret-token')
    expect(JSON.stringify(payload)).not.toContain('user@example.com')
  })

  it('scrubs unsubscribe tokens from page views', () => {
    const payload = getRoutePageViewPayload(
      '/unsubscribe/secret-token',
      '',
      'https://empoweredindian.in'
    )

    expect(payload).toEqual({
      pageName: 'Unsubscribe',
      parameters: {
        page_path: '/unsubscribe/:token',
        page_location: 'https://empoweredindian.in/unsubscribe/:token',
        route_pattern: '/unsubscribe/:token',
        content_type: 'mailing_list_page',
        content_id: '',
        search: '',
      },
    })
    expect(JSON.stringify(payload)).not.toContain('secret-token')
  })
})
