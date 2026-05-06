export const config = { runtime: 'edge' };

export default async function handler(request) {
  const url = new URL(request.url);
  const channelId = url.searchParams.get('channel') || '';

  if (!/^UC[A-Za-z0-9_-]{22}$/.test(channelId)) {
    return new Response('Invalid channel id', {
      status: 400,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }

  const upstream = await fetch(
    'https://www.youtube.com/feeds/videos.xml?channel_id=' + channelId,
    { headers: { 'User-Agent': 'Mozilla/5.0 RCCG-JHSV-Site' } }
  ).catch(() => null);

  if (!upstream || !upstream.ok) {
    return new Response('Upstream error', {
      status: 502,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }

  const xml = await upstream.text();
  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=600, s-maxage=600',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
