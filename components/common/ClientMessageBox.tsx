"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import { Input } from "@/components/ui/input"
import { Send, User, ArrowLeft, Paperclip, X, FileText, Image as ImageIcon, Download } from "lucide-react"

export interface ClientMessage {
  id: string
  text: string
  sender: "client" | "superadmin"
  timestamp: Date
  read?: boolean
  attachment?: {
    fileName: string
    fileSize: number
    fileType: string
    fileUrl: string
  }
}

interface ClientMessageBoxProps {
  title: string
  onBack?: () => void
  className?: string
  conversationId?: string
}

const ClientMessageBox: React.FC<ClientMessageBoxProps> = ({ title, onBack, className = "", conversationId }) => {
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<ClientMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const currentSender = "client" as const

  useEffect(() => {
    let isMounted = true
    const controller = new AbortController()

    const load = async () => {
      try {
        if (!conversationId) {
          if (isMounted) setMessages([])
          return
        }
        if (isMounted) setIsLoading(true)
        const res = await fetch(`/api/messages?seed=1&conversationId=${encodeURIComponent(conversationId)}` , {
          cache: "no-store",
          signal: controller.signal,
        })
        if (!res.ok) throw new Error("Failed to load messages")
        const data = await res.json()
        const msgs: ClientMessage[] = (data.messages || []).map((m: any) => ({
          id: m.id,
          text: m.text,
          sender: m.sender,
          timestamp: new Date(m.timestamp),
          read: !!m.read,
          attachment: m.attachment ? {
            fileName: m.attachment.fileName,
            fileSize: m.attachment.fileSize,
            fileType: m.attachment.fileType,
            fileUrl: m.attachment.fileUrl,
          } : undefined,
        }))
        if (isMounted) setMessages(msgs)
      } catch (e: any) {
        if (e?.name !== "AbortError" && isMounted) {
          setMessages([])
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    load()
    return () => {
      isMounted = false
      controller.abort()
    }
  }, [conversationId])

  // Silent background polling to refresh messages without visible UI changes
  useEffect(() => {
    let isMounted = true
    const interval = setInterval(async () => {
      try {
        if (!conversationId) return
        const res = await fetch(`/api/messages?seed=1&conversationId=${encodeURIComponent(conversationId)}` , { cache: "no-store" })
        if (!res.ok) return
        const data = await res.json()
        const incoming: ClientMessage[] = (data.messages || []).map((m: any) => ({
          id: m.id,
          text: m.text,
          sender: m.sender,
          timestamp: new Date(m.timestamp),
          read: !!m.read,
          attachment: m.attachment ? {
            fileName: m.attachment.fileName,
            fileSize: m.attachment.fileSize,
            fileType: m.attachment.fileType,
            fileUrl: m.attachment.fileUrl,
          } : undefined,
        }))
        if (!isMounted) return
        // Merge by id to preserve optimistic entries and avoid flicker
        setMessages((prev) => {
          const map = new Map<string, ClientMessage>()
          for (const m of prev) map.set(m.id, m)
          for (const m of incoming) map.set(m.id, m)
          return Array.from(map.values()).sort(
            (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
          )
        })
      } catch (_) {
        // ignore polling errors silently
      }
    }, 4000)

    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [conversationId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert("File size must be less than 10MB")
      return
    }

    setSelectedFile(file)

    // Create preview for images
    if (file.type.startsWith("image/")) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setFilePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setFilePreview(null)
    }
  }

  const removeSelectedFile = () => {
    setSelectedFile(null)
    setFilePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const uploadFile = async (file: File): Promise<{ fileName: string; fileSize: number; fileType: string; fileUrl: string } | null> => {
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("conversationId", conversationId || "")

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) throw new Error("Upload failed")
      
      const data = await response.json()
      return {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        fileUrl: data.fileUrl,
      }
    } catch (error) {
      console.error("File upload error:", error)
      return null
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((!message.trim() && !selectedFile) || isSending) return
    if (!conversationId) return

    let attachment = null
    if (selectedFile) {
      attachment = await uploadFile(selectedFile)
      if (!attachment) {
        alert("Failed to upload file. Please try again.")
        return
      }
    }

    const optimistic: ClientMessage = {
      id: "temp-" + Date.now().toString(),
      text: message,
      sender: currentSender,
      timestamp: new Date(),
      read: true,
      attachment: attachment || undefined,
    }

    setMessages((prev) => [...prev, optimistic])
    const textToSend = message
    setMessage("")
    removeSelectedFile()

    try {
      setIsSending(true)
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textToSend, sender: currentSender, conversationId, attachment }),
      })
      if (!res.ok) throw new Error("Failed to send")
      const data = await res.json()
      const saved = data.data
      setMessages((prev) =>
        prev.map((m) =>
          m.id === optimistic.id
            ? {
                id: saved.id,
                text: saved.text,
                sender: saved.sender,
                timestamp: new Date(saved.timestamp),
                read: !!saved.read,
              }
            : m,
        ),
      )

      // Refetch to ensure all messages are shown
      const refresh = await fetch(`/api/messages${conversationId ? `?conversationId=${encodeURIComponent(conversationId)}` : ""}` , { cache: "no-store" })
      if (refresh.ok) {
        const payload = await refresh.json()
        const synced: ClientMessage[] = (payload.messages || []).map((m: any) => ({
          id: m.id,
          text: m.text,
          sender: m.sender,
          timestamp: new Date(m.timestamp),
          read: !!m.read,
          attachment: m.attachment ? {
            fileName: m.attachment.fileName,
            fileSize: m.attachment.fileSize,
            fileType: m.attachment.fileType,
            fileUrl: m.attachment.fileUrl,
          } : undefined,
        }))
        setMessages(synced)
      }
    } catch (err) {
      console.error("Send message failed", err)
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id))
    } finally {
      setIsSending(false)
    }
  }

  const formatTime = (date: Date | string) => {
    try {
      const dateObj = typeof date === "string" ? new Date(date) : date
      if (isNaN(dateObj.getTime())) return "Invalid date"
      return dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    } catch {
      return "--:--"
    }
  }

  const formatDate = (date: Date | string) => {
    try {
      const dateObj = typeof date === "string" ? new Date(date) : date
      if (isNaN(dateObj.getTime())) return ""
      return new Intl.DateTimeFormat(undefined, { year: "numeric", month: "2-digit", day: "2-digit" }).format(dateObj)
    } catch {
      return ""
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <ImageIcon className="h-4 w-4" />
    if (fileType === 'application/pdf') return <FileText className="h-4 w-4 text-red-500" />
    if (fileType.includes('word') || fileType.includes('document')) return <FileText className="h-4 w-4 text-blue-500" />
    if (fileType.includes('sheet') || fileType.includes('excel')) return <FileText className="h-4 w-4 text-green-500" />
    return <FileText className="h-4 w-4" />
  }

  const renderAttachment = (attachment: ClientMessage['attachment']) => {
    if (!attachment) return null

    const isImage = attachment.fileType.startsWith('image/')
    
    return (
      <div className="mt-2">
        {isImage ? (
          <div className="relative max-w-xs">
            <img 
              src={attachment.fileUrl} 
              alt={attachment.fileName}
              className="rounded-lg max-w-full h-auto cursor-pointer"
              onClick={() => window.open(attachment.fileUrl, '_blank')}
            />
          </div>
        ) : (
          <div className="flex items-center p-3 bg-gray-100 rounded-lg max-w-xs cursor-pointer hover:bg-gray-200"
               onClick={() => window.open(attachment.fileUrl, '_blank')}>
            <div className="mr-3">
              {getFileIcon(attachment.fileType)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {attachment.fileName}
              </p>
              <p className="text-xs text-gray-500">
                {formatFileSize(attachment.fileSize)}
              </p>
            </div>
            <Download className="h-4 w-4 text-gray-400 ml-2" />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={`flex flex-col h-screen bg-[#e5ddd5] max-h-[700px] bg-opacity-30 ${className}`}>
      {/* Header */}
      <div className="bg-[#0c0c0c] p-3 flex items-center justify-between text-white">
        <div className="flex items-center">
          {onBack && (
            <button onClick={onBack} className="p-2 mr-2 rounded-full hover:bg-white/10">
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
            <User className="h-5 w-5 text-gray-600" />
          </div>
          <div className="ml-3">
            <h2 className="font-medium">{title}</h2>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 bg-[#e5ddd5] bg-opacity-30">
        {isLoading && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            No messages yet. Start the conversation!
          </div>
        ) : (
          <div className="space-y-2">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === "client" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] p-3 rounded-lg shadow ${
                    msg.sender === "client"
                      ? "bg-[#dcf8c6] text-black rounded-tr-none"
                      : "bg-white text-black rounded-tl-none"
                  }`}
                >
                  {msg.text && <p className="text-sm">{msg.text}</p>}
                  {renderAttachment(msg.attachment)}
                  <div className="text-[10px] text-gray-500 text-right mt-1 flex justify-end items-center space-x-1">
                    <span>{formatTime(msg.timestamp)}</span>
                    <span>{formatDate(msg.timestamp)}</span>
                    {msg.read && <span className="text-blue-500">✓✓</span>}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* File Preview */}
      {selectedFile && (
        <div className="bg-[#f0f2f5] p-3 border-t border-gray-300">
          <div className="flex items-center justify-between bg-white p-3 rounded-lg">
            <div className="flex items-center">
              {filePreview ? (
                <img src={filePreview} alt="Preview" className="w-12 h-12 object-cover rounded mr-3" />
              ) : (
                <div className="w-12 h-12 bg-gray-200 rounded mr-3 flex items-center justify-center">
                  {getFileIcon(selectedFile.type)}
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
            </div>
            <button
              onClick={removeSelectedFile}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="bg-[#f0f2f5] p-3 border-t border-gray-300">
        <form onSubmit={handleSendMessage} className="flex items-center">
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-500 hover:text-gray-700 mr-2"
          >
            <Paperclip className="h-5 w-5" />
          </button>
          <div className="flex-1 mx-2">
            <Input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message"
              disabled={isSending}
              className="w-full rounded-full border-0 bg-white px-4 py-2 focus-visible:ring-1 focus-visible:ring-gray-300 disabled:opacity-50"
            />
          </div>
          <button
            type="submit"
            disabled={isSending || (!message.trim() && !selectedFile)}
            className="p-2 text-white bg-[#00a884] rounded-full hover:bg-[#128c7e] disabled:opacity-50"
          >
            <Send className="h-6 w-6" />
          </button>
        </form>
      </div>
    </div>
  )
}

export default ClientMessageBox
