import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

// You must set DISCOGS_TOKEN in your .env.local file
const DISCOGS_TOKEN = process.env.DISCOGS_TOKEN;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const { artist, album, catalogNumber } = req.body || {};
  if (!DISCOGS_TOKEN) {
    res.status(500).json({ error: 'Discogs API token not set.' });
    return;
  }
  if (!artist && !album && !catalogNumber) {
    res.status(400).json({ error: 'Please provide at least an artist, album, or catalog number.' });
    return;
  }
  try {
    // Build Discogs search query (less strict, allow partial matches)
    let query = [artist, album, catalogNumber].filter(Boolean).join(' ');
    // Add wildcard support for album (e.g., Self*)
    if (album && album.endsWith('*')) {
      query = [artist, album.replace('*', '')].filter(Boolean).join(' ');
    }
    const url = `https://api.discogs.com/database/search?q=${encodeURIComponent(query.trim())}&type=release&token=${DISCOGS_TOKEN}`;
    console.log('Discogs search URL:', url);
    const searchRes = await axios.get(url);
    const results = searchRes.data.results;
    if (!results || results.length === 0) {
      res.status(404).json({ error: 'No results found.' });
      return;
    }
    // Get details for the best-matching result (try to match album title if provided)
    let bestResult = results[0];
    if (album) {
      const albumLower = album.replace('*', '').toLowerCase();
      const found = results.find((r: any) => r.title && r.title.toLowerCase().includes(albumLower));
      if (found) bestResult = found;
    }
    const releaseId = bestResult.id;
    const releaseUrl = `https://api.discogs.com/releases/${releaseId}`;
    const releaseRes = await axios.get(releaseUrl);
    const release = releaseRes.data;
    // Get price guide from Discogs
    const priceUrl = `https://api.discogs.com/marketplace/price_suggestions/${releaseId}?token=${DISCOGS_TOKEN}`;
    let priceGuide = {};
    try {
      const priceRes = await axios.get(priceUrl);
      priceGuide = priceRes.data;
    } catch {}
    // Get additional price sources (simulate eBay and MusicStack for now)
    const ebaySearchTerms = [bestResult.title, bestResult.artist].filter(Boolean).join(' ');
    const ebayUrl = `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(ebaySearchTerms)}+vinyl&LH_Sold=1`;
    // MusicStack: use only required parameters, always add &media=248, and add &release_id= if catalogNumber is provided
    let musicStackUrl = '';
    const musicStackBase = 'https://www.musicstack.com/show.cgi?filter_submit=1';
    let musicStackParams = '';
    if (artist && album) {
      musicStackParams = `&find=${encodeURIComponent(artist)}&t=${encodeURIComponent(album)}`;
    } else if (artist) {
      musicStackParams = `&find=${encodeURIComponent(artist)}`;
    } else if (album) {
      musicStackParams = `&t=${encodeURIComponent(album)}`;
    }
    // Always add &media=248
    musicStackParams += '&media=248';
    // Add &release_id= if catalogNumber is provided
    if (catalogNumber) {
      musicStackParams += `&release_id=${encodeURIComponent(catalogNumber)}`;
    }
    if (musicStackParams) {
      musicStackUrl = musicStackBase + musicStackParams;
    }
    // Only include eBay and MusicStack in extraPriceSources
    const extraPriceSources = [
      { name: 'eBay', url: ebayUrl },
      ...(musicStackUrl ? [{ name: 'MusicStack', url: musicStackUrl }] : [])
    ];
    // Format Discogs details for display
    const discogsDetails = {
      year: release.year,
      country: release.country,
      label: release.labels?.map((l: any) => l.name).join(', '),
      catalogNumber: release.labels?.map((l: any) => l.catno).join(', '),
      format: release.formats?.map((f: any) => f.name + (f.descriptions ? ' (' + f.descriptions.join(', ') + ')' : '')).join(', '),
      pressingDate: release.released_formatted || release.released,
      title: release.title,
      artist: release.artists_sort,
      genres: release.genres,
      styles: release.styles,
      tracklist: release.tracklist?.map((t: any) => ({ position: t.position, title: t.title, duration: t.duration })),
      images: release.images?.map((img: any) => img.uri),
      thumb: release.thumb,
      notes: release.notes,
      numForSale: release.num_for_sale,
      lowestPrice: release.lowest_price,
      community: release.community,
      discogsUrl: release.uri,
    };
    res.status(200).json({
      artist: release.artists_sort,
      album: release.title,
      catalogNumber: release.labels?.[0]?.catno || '',
      pressingDate: release.released,
      label: release.labels?.[0]?.name || '',
      country: release.country,
      format: release.formats?.map((f:any) => f.name).join(', '),
      notes: release.notes || '',
      priceGuide,
      discogsUrl: bestResult.resource_url,
      coverImage: bestResult.cover_image,
      lastUpdated: new Date().toISOString(),
      extraPriceSources,
      discogsDetails
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Discogs API error.' });
  }
}
