/**
 * Transforms Cloudinary image URLs to use proper aspect ratio scaling
 * This fixes images that were previously uploaded with incorrect cropping settings
 */
export function transformImageUrl(imageUrl: string | undefined | null): string {
  if (!imageUrl) return '';
  
  // Check if it's a Cloudinary URL
  if (imageUrl.includes('res.cloudinary.com')) {
    // Extract the base URL and the path
    const url = new URL(imageUrl);
    
    // Insert transformation parameter: c_scale (scale without cropping)
    // Format: /image/upload/c_scale,w_1200,f_auto,q_auto/...
    const pathParts = url.pathname.split('/');
    
    // Find the 'upload' part and insert transformation after it
    const uploadIndex = pathParts.indexOf('upload');
    if (uploadIndex !== -1) {
      // Insert the transformation parameters after 'upload'
      pathParts.splice(uploadIndex + 1, 0, 'c_scale,w_1200,f_auto,q_auto');
      url.pathname = pathParts.join('/');
    }
    
    return url.toString();
  }
  
  // Return URL as-is if not Cloudinary
  return imageUrl;
}
