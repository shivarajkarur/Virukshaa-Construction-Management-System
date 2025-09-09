/**
 * Utility functions for file uploads across components
 */

export interface FileAttachment {
  fileName: string
  fileSize: number
  fileType: string
  fileUrl: string
}

/**
 * Upload a file using the main upload API
 */
export async function uploadFile(
  file: File, 
  conversationId?: string
): Promise<FileAttachment | null> {
  try {
    const formData = new FormData()
    formData.append('file', file)
    if (conversationId) {
      formData.append('conversationId', conversationId)
    }

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Upload failed')
    }

    return await response.json()
  } catch (error) {
    console.error('Upload error:', error)
    return null
  }
}

/**
 * Upload admin file (logo/profile image)
 */
export async function uploadAdminFile(
  file: File, 
  type: 'logo' | 'profile'
): Promise<FileAttachment | null> {
  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', type)

    const response = await fetch('/api/admin/upload-logo', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Upload failed')
    }

    return await response.json()
  } catch (error) {
    console.error('Admin upload error:', error)
    return null
  }
}

/**
 * Get file type icon based on MIME type
 */
export function getFileIcon(fileType: string): string {
  if (fileType.startsWith('image/')) return '🖼️'
  if (fileType === 'application/pdf') return '📄'
  if (fileType.includes('word') || fileType.includes('document')) return '📝'
  if (fileType.includes('sheet') || fileType.includes('excel')) return '📊'
  if (fileType.includes('presentation') || fileType.includes('powerpoint')) return '📋'
  if (fileType === 'text/plain') return '📄'
  return '📎'
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Validate file before upload
 */
export function validateFileClient(file: File, maxSizeMB: number = 10): string | null {
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
  ]

  if (!allowedTypes.includes(file.type)) {
    return `File type ${file.type} is not supported`
  }

  const maxSize = maxSizeMB * 1024 * 1024
  if (file.size > maxSize) {
    return `File size exceeds ${maxSizeMB}MB limit`
  }

  return null
}
