/**
 * Utility functions for handling avatar uploads and management
 */

/**
 * Uploads an avatar image to Cloudflare R2
 * @param file The avatar file to upload
 * @returns The URL of the uploaded avatar
 */
export async function uploadAvatar(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', 'avatar');

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to upload avatar');
  }

  const data = await response.json();
  return data.fileUrl;
}

/**
 * Deletes an avatar from Cloudflare R2
 * @param fileUrl The URL of the avatar to delete
 */
export async function deleteAvatar(fileUrl: string): Promise<void> {
  const response = await fetch('/api/upload/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileUrl }),
  });

  if (!response.ok) {
    throw new Error('Failed to delete avatar');
  }
}

/**
 * Generates initials from a name
 * @param name The full name to generate initials from
 * @returns The initials (up to 2 characters)
 */
export function getInitials(name?: string): string {
  if (!name) return '';
  return name
    .split(' ')
    .map(part => part[0])
    .filter(char => char)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

/**
 * Generates a random background color for avatar placeholders
 * @param name The name to base the color on (for consistency)
 * @returns A CSS background color value
 */
export function getAvatarBackground(name: string): string {
  const colors = [
    '#F44336', '#E91E63', '#9C27B0', '#673AB7',
    '#3F51B5', '#2196F3', '#03A9F4', '#00BCD4',
    '#009688', '#4CAF50', '#8BC34A', '#CDDC39',
    '#FFC107', '#FF9800', '#FF5722', '#795548',
  ];

  // Use name to generate a consistent index
  const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[index % colors.length];
}