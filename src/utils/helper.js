"use client";
export async function isValidYouTubeVideo(url) {
  if (!url || typeof url !== 'string') return false;
  const ytRegex = /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([\w-]{11})(?:\S+)?$/;
  if (!ytRegex.test(url)) return false;

  try {
    const oEmbedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    const response = await fetch(oEmbedUrl);
    return response.ok;
  } catch {
    return false;
  }
}

export function getYouTubeThumbnail(url) {
  if (!url || typeof url !== 'string') return null;
  const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  if (match && match[2].length === 11) {
    return `https://img.youtube.com/vi/${match[2]}/hqdefault.jpg`;
  }
  return null;
}

export async function getYouTubeVideoTitle(url) {
  try {
    const oEmbedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    const response = await fetch(oEmbedUrl);
    if (response.ok) {
      const data = await response.json();
      return data.title;
    }
  } catch {
    return null;
  }
  return null;
}


export function getImage(imagePath) {
  if (!imagePath) return '';

  const trimmed = imagePath.trim();
  if (trimmed === '' || trimmed.toLowerCase() === 'null') return '';

  // 1. If it's already a full URL (R2 or external), return it as is
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;

  // 2. Prioritize R2 Public URL
  const r2Url = (process.env.NEXT_PUBLIC_R2_PUBLIC_URL || '').replace(/\/$/, '');
  if (r2Url) {
    // Strip "/uploads/" or "uploads/" if it exists to clean up the filename
    const fileName = trimmed.replace(/^\/?uploads\//, '');
    return `${r2Url}/${fileName}`;
  }

  return trimmed;
}

export const createSlug = (text) => {
  if (!text) return "";
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-");
};

export const trackPageView = (url) => {
  window.gtag("config", process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID, {
    page_path: url,
  });
};

export function formatFraction(num) {
  if (num === null || num === undefined || num === '') return '';
  
  const n = parseFloat(num);
  if (isNaN(n)) return num; // Return as is if not a number
  if (n === 0) return '0';
  
  const whole = Math.floor(n);
  const fraction = n - whole;
  
  if (fraction === 0) return whole.toString();
  
  const fractionMap = [
    { val: 0.5, char: '1⁄2' },
    { val: 0.333, char: '1⁄3' },
    { val: 0.666, char: '2⁄3' },
    { val: 0.25, char: '1⁄4' },
    { val: 0.75, char: '3⁄4' },
    { val: 0.125, char: '1⁄8' },
    { val: 0.375, char: '3⁄8' },
    { val: 0.625, char: '5⁄8' },
    { val: 0.875, char: '7⁄8' },
  ];
  
  // Find the closest fraction
  let bestMatch = fractionMap[0];
  let minDiff = Math.abs(fraction - fractionMap[0].val);
  
  for (let i = 1; i < fractionMap.length; i++) {
    const diff = Math.abs(fraction - fractionMap[i].val);
    if (diff < minDiff) {
      minDiff = diff;
      bestMatch = fractionMap[i];
    }
  }
  
  // If the difference is small enough (e.g., < 0.01), use the fraction
  if (minDiff < 0.01) {
    return whole > 0 ? `${whole} ${bestMatch.char}` : bestMatch.char;
  }
  
  // Otherwise return as is, rounded to 2 decimals if needed
  return n.toFixed(2).replace(/\.?0+$/, '');
}

