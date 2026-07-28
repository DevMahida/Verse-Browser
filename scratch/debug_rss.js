// Google News uses double-encoded protobuf URLs
// Layer 1: base64 -> protobuf containing another base64url string
// Layer 2: that base64url string -> actual article URL

function decodeGoogleNewsUrl(gnewsUrl) {
  try {
    const match = gnewsUrl.match(/articles\/([^?]+)/);
    if (!match) return null;
    
    // Layer 1: Decode the outer base64
    let b64 = match[1].replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4 !== 0) b64 += '=';
    const buf = Buffer.from(b64, 'base64');
    
    // The protobuf has: field 1 (varint), field 4 (0x22 = tag 4, wire type 2 = length-delimited)
    // The length-delimited field contains another base64url string
    // Let's find it - it starts after the protobuf header bytes
    const str = buf.toString('utf-8');
    
    // Find the inner base64url string (starts with AU_yqL or similar pattern)
    // It comes after the protobuf framing bytes
    const innerMatch = str.match(/[A-Za-z0-9_-]{20,}/);
    if (!innerMatch) {
      console.log('No inner b64 found');
      return null;
    }
    
    let innerB64 = innerMatch[0];
    console.log('Inner b64:', innerB64.substring(0, 60) + '...');
    
    // Layer 2: Decode the inner base64url 
    innerB64 = innerB64.replace(/-/g, '+').replace(/_/g, '/');
    while (innerB64.length % 4 !== 0) innerB64 += '=';
    
    const innerBuf = Buffer.from(innerB64, 'base64');
    const innerStr = innerBuf.toString('utf-8');
    console.log('Inner decoded:', innerStr.substring(0, 300));
    
    // Extract URL
    const urlMatch = innerStr.match(/(https?:\/\/[^\s\x00-\x1f\x7f"'<>]+)/);
    if (urlMatch) return urlMatch[1];
    
  } catch (err) {
    console.error('Error:', err.message);
  }
  return null;
}

const urls = [
  'https://news.google.com/rss/articles/CBMiwgFBVV95cUxPZEwyZEU5UW15R2xZRHFaRXRfejJNMFFoZzNfRmM4N3VnNFpjeXl1OG45ZjRTVkllVUZzdU9YWkFKb2YxR3l2NGVCOEJXRUtPbk0tTTVNMGNsRVRFREZONjlnTThxQWh3RmJSNGlBdU9wVDUzSlRlaDh6YVpkWWVZZDE3OXpINlg2bW9uNTRHN0k2T05vVkE2UzEzMkVZbE1KVzdMLVd2LXdJeTVvSEs0WGtXNzgzcFdDWTJMdkFYbzI4UQ?oc=5',
  'https://news.google.com/rss/articles/CBMipwFBVV95cUxQT21XQV9sdDFJbDZmZHYxTG1lX2J3VVRuWE9CTlhoNE5GUXJmQVBNZHdrOExPaHhNNGN2QUoxY2dKblhfUnY0Y2lQU0RsdzFHWUtaZGNOcDB5eGJTTEpXQzkyWkZheDAzRTJVcDhOdFlRNGt4d1lpSXMxSlNnR1ZYdDRWTVZMUWFRUWYzZG45OFdfZmQ0YXVkS3AtWTJNRU9PQ2I3WDFYMA?oc=5',
  'https://news.google.com/rss/articles/CBMi5wFBVV95cUxQMEZLQ1hlX0Y3MjREYnNPTmtoRmQ3LWpLVWhfSnF4YmVoRUJYTUxfd19NaVV6QmpXRTYxUkpHSl9qZnBEdEdBLUU4TEU3TWxfV204WmVIVXJwQW1BTjBBSlFDRUxxZFNLLUFDU2lUeVctZGRWbWdCVlhMQkNaSmpIekI2cFZFV1BUZGdPNXNkdTBNUUVCcHVDZ3FFbGRlZUpac2I0ckVDcGxibGh5dUQwaF9nZVJacTQ0LXpyRmkyYjRWYVM2X1BOVThZUFdEejNXTGVxNzNWXzZCN2hwZkpLeGhhLTlhYnc?oc=5'
];

urls.forEach((url, i) => {
  console.log(`\n=== URL ${i+1} ===`);
  const decoded = decodeGoogleNewsUrl(url);
  console.log('RESULT:', decoded || 'FAILED');
});
