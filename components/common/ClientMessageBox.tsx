// "use client"

// import type React from "react"
// import { useEffect, useRef, useState } from "react"
// import { Input } from "@/components/ui/input"
// import { Send, User, ArrowLeft, Paperclip, X, FileText, Image as ImageIcon, Download, ChevronDown } from "lucide-react"

// export interface ClientMessage {
//   id: string
//   text: string
//   sender: "client" | "superadmin"
//   timestamp: Date
//   read?: boolean
//   attachment?: {
//     fileName: string
//     fileSize: number
//     fileType: string
//     fileUrl: string
//   }
// }

// interface ClientMessageBoxProps {
//   title: string
//   onBack?: () => void
//   className?: string
//   conversationId?: string
// }

// const ClientMessageBox: React.FC<ClientMessageBoxProps> = ({ title, onBack, className = "", conversationId }) => {
//   const [message, setMessage] = useState("")
//   const [messages, setMessages] = useState<ClientMessage[]>([])
//   const [isLoading, setIsLoading] = useState(false)
//   const [isSending, setIsSending] = useState(false)
//   const [selectedFile, setSelectedFile] = useState<File | null>(null)
//   const [filePreview, setFilePreview] = useState<string | null>(null)
//   const messagesEndRef = useRef<HTMLDivElement>(null)
//   const fileInputRef = useRef<HTMLInputElement>(null)
//   const messageContainerRef = useRef<HTMLDivElement>(null)
//   const [showScrollToBottom, setShowScrollToBottom] = useState(false)

//   const currentSender = "client" as const

//   useEffect(() => {
//     let isMounted = true
//     const controller = new AbortController()

//     const load = async () => {
//       try {
//         if (!conversationId) {
//           if (isMounted) setMessages([])
//           return
//         }
//         if (isMounted) setIsLoading(true)
//         const res = await fetch(`/api/messages?seed=1&conversationId=${encodeURIComponent(conversationId)}` , {
//           cache: "no-store",
//           signal: controller.signal,
//         })
//         if (!res.ok) throw new Error("Failed to load messages")
//         const data = await res.json()
//         const msgs: ClientMessage[] = (data.messages || []).map((m: any) => ({
//           id: m.id,
//           text: m.text,
//           sender: m.sender,
//           timestamp: new Date(m.timestamp),
//           read: !!m.read,
//           attachment: m.attachment ? {
//             fileName: m.attachment.fileName,
//             fileSize: m.attachment.fileSize,
//             fileType: m.attachment.fileType,
//             fileUrl: m.attachment.fileUrl,
//           } : undefined,
//         }))
//         if (isMounted) setMessages(msgs)
//       } catch (e: any) {
//         if (e?.name !== "AbortError" && isMounted) {
//           setMessages([])
//         }
//       } finally {
//         if (isMounted) {
//           setIsLoading(false)
//         }
//       }
//     }

//     load()
//     return () => {
//       isMounted = false
//       controller.abort()
//     }
//   }, [conversationId])

//   // Silent background polling to refresh messages without visible UI changes
//   useEffect(() => {
//     let isMounted = true
//     const interval = setInterval(async () => {
//       try {
//         if (!conversationId) return
//         const res = await fetch(`/api/messages?seed=1&conversationId=${encodeURIComponent(conversationId)}` , { cache: "no-store" })
//         if (!res.ok) return
//         const data = await res.json()
//         const incoming: ClientMessage[] = (data.messages || []).map((m: any) => ({
//           id: m.id,
//           text: m.text,
//           sender: m.sender,
//           timestamp: new Date(m.timestamp),
//           read: !!m.read,
//           attachment: m.attachment ? {
//             fileName: m.attachment.fileName,
//             fileSize: m.attachment.fileSize,
//             fileType: m.attachment.fileType,
//             fileUrl: m.attachment.fileUrl,
//           } : undefined,
//         }))
//         if (!isMounted) return
//         // Merge by id to preserve optimistic entries and avoid flicker
//         setMessages((prev) => {
//           const map = new Map<string, ClientMessage>()
//           for (const m of prev) map.set(m.id, m)
//           for (const m of incoming) map.set(m.id, m)
//           return Array.from(map.values()).sort(
//             (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
//           )
//         })
//       } catch (_) {
//         // ignore polling errors silently
//       }
//     }, 4000)

//     return () => {
//       isMounted = false
//       clearInterval(interval)
//     }
//   }, [conversationId])

//   // Handle scroll to show/hide scroll to bottom button
//   useEffect(() => {
//     const handleScroll = () => {
//       if (!messageContainerRef.current) return;
//       const { scrollTop, scrollHeight, clientHeight } = messageContainerRef.current;
//       // Show button if not at bottom (with a 100px threshold)
//       setShowScrollToBottom(scrollHeight - scrollTop - clientHeight > 100);
//     };

//     const container = messageContainerRef.current;
//     if (container) {
//       container.addEventListener('scroll', handleScroll);
//       // Check initial position
//       handleScroll();
//     }

//     return () => {
//       if (container) {
//         container.removeEventListener('scroll', handleScroll);
//       }
//     };
//   }, []);

//   const scrollToBottom = () => {
//     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   };

//   const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0]
//     if (!file) return

//     // Check file size (max 10MB)
//     if (file.size > 10 * 1024 * 1024) {
//       alert("File size must be less than 10MB")
//       return
//     }

//     setSelectedFile(file)

//     // Create preview for images
//     if (file.type.startsWith("image/")) {
//       const reader = new FileReader()
//       reader.onload = (e) => {
//         setFilePreview(e.target?.result as string)
//       }
//       reader.readAsDataURL(file)
//     } else {
//       setFilePreview(null)
//     }
//   }

//   const removeSelectedFile = () => {
//     setSelectedFile(null)
//     setFilePreview(null)
//     if (fileInputRef.current) {
//       fileInputRef.current.value = ""
//     }
//   }

//   const uploadFile = async (file: File): Promise<{ fileName: string; fileSize: number; fileType: string; fileUrl: string } | null> => {
//     try {
//       const formData = new FormData()
//       formData.append("file", file)
//       formData.append("conversationId", conversationId || "")

//       const response = await fetch("/api/upload", {
//         method: "POST",
//         body: formData,
//       })

//       if (!response.ok) throw new Error("Upload failed")
      
//       const data = await response.json()
//       return {
//         fileName: file.name,
//         fileSize: file.size,
//         fileType: file.type,
//         fileUrl: data.fileUrl,
//       }
//     } catch (error) {
//       console.error("File upload error:", error)
//       return null
//     }
//   }

//   const handleSendMessage = async (e: React.FormEvent) => {
//     e.preventDefault()
//     if ((!message.trim() && !selectedFile) || isSending) return
//     if (!conversationId) return

//     let attachment = null
//     if (selectedFile) {
//       attachment = await uploadFile(selectedFile)
//       if (!attachment) {
//         alert("Failed to upload file. Please try again.")
//         return
//       }
//     }

//     const optimistic: ClientMessage = {
//       id: "temp-" + Date.now().toString(),
//       text: message,
//       sender: currentSender,
//       timestamp: new Date(),
//       read: true,
//       attachment: attachment || undefined,
//     }

//     setMessages((prev) => [...prev, optimistic])
//     const textToSend = message
//     setMessage("")
//     removeSelectedFile()

//     try {
//       setIsSending(true)
//       const res = await fetch("/api/messages", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ text: textToSend, sender: currentSender, conversationId, attachment }),
//       })
//       if (!res.ok) throw new Error("Failed to send")
//       const data = await res.json()
//       const saved = data.data
//       setMessages((prev) =>
//         prev.map((m) =>
//           m.id === optimistic.id
//             ? {
//                 id: saved.id,
//                 text: saved.text,
//                 sender: saved.sender,
//                 timestamp: new Date(saved.timestamp),
//                 read: !!saved.read,
//               }
//             : m,
//         ),
//       )

//       // Refetch to ensure all messages are shown
//       const refresh = await fetch(`/api/messages${conversationId ? `?conversationId=${encodeURIComponent(conversationId)}` : ""}` , { cache: "no-store" })
//       if (refresh.ok) {
//         const payload = await refresh.json()
//         const synced: ClientMessage[] = (payload.messages || []).map((m: any) => ({
//           id: m.id,
//           text: m.text,
//           sender: m.sender,
//           timestamp: new Date(m.timestamp),
//           read: !!m.read,
//           attachment: m.attachment ? {
//             fileName: m.attachment.fileName,
//             fileSize: m.attachment.fileSize,
//             fileType: m.attachment.fileType,
//             fileUrl: m.attachment.fileUrl,
//           } : undefined,
//         }))
//         setMessages(synced)
//       }
//     } catch (err) {
//       console.error("Send message failed", err)
//       setMessages((prev) => prev.filter((m) => m.id !== optimistic.id))
//     } finally {
//       setIsSending(false)
//     }
//   }

//   const formatTime = (date: Date | string) => {
//     try {
//       const dateObj = typeof date === "string" ? new Date(date) : date
//       if (isNaN(dateObj.getTime())) return "Invalid date"
//       return dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
//     } catch {
//       return "--:--"
//     }
//   }

//   const formatDate = (date: Date | string) => {
//     try {
//       const dateObj = typeof date === "string" ? new Date(date) : date
//       if (isNaN(dateObj.getTime())) return ""
//       return new Intl.DateTimeFormat(undefined, { year: "numeric", month: "2-digit", day: "2-digit" }).format(dateObj)
//     } catch {
//       return ""
//     }
//   }

//   const formatFileSize = (bytes: number): string => {
//     if (bytes === 0) return '0 Bytes'
//     const k = 1024
//     const sizes = ['Bytes', 'KB', 'MB', 'GB']
//     const i = Math.floor(Math.log(bytes) / Math.log(k))
//     return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
//   }

//   const getFileIcon = (fileType: string) => {
//     if (fileType.startsWith('image/')) return <ImageIcon className="h-5 w-5" />
//     if (fileType === 'application/pdf') return <FileText className="h-5 w-5 text-red-500" />
//     if (fileType.includes('word') || fileType.includes('document')) return <FileText className="h-5 w-5 text-blue-500" />
//     if (fileType.includes('sheet') || fileType.includes('excel')) return <FileText className="h-5 w-5 text-green-500" />
//     return <FileText className="h-5 w-5" />
//   }

//   const renderAttachment = (attachment: ClientMessage['attachment']) => {
//     if (!attachment) return null

//     const isImage = attachment.fileType.startsWith('image/')
    
//     return (
//       <div className="mt-2">
//         {isImage ? (
//           <div className="relative w-full sm:max-w-xs">
//             <img 
//               src={attachment.fileUrl} 
//               alt={attachment.fileName}
//               className="rounded-lg max-w-full h-auto cursor-pointer transition-transform duration-200 hover:scale-[1.02]"
//               onClick={() => window.open(attachment.fileUrl, '_blank')}
//             />
//           </div>
//         ) : (
//           <div className="flex items-center p-4 bg-gray-100 rounded-lg w-full sm:max-w-xs cursor-pointer hover:bg-gray-200 transition-colors duration-200"
//                onClick={() => window.open(attachment.fileUrl, '_blank')}>
//             <div className="mr-3">
//               {getFileIcon(attachment.fileType)}
//             </div>
//             <div className="flex-1 min-w-0">
//               <p className="text-sm sm:text-base font-medium text-gray-900 truncate max-w-[180px] sm:max-w-[220px]">
//                 {attachment.fileName}
//               </p>
//               <p className="text-xs text-gray-500">
//                 {formatFileSize(attachment.fileSize)}
//               </p>
//             </div>
//             <Download className="h-5 w-5 text-gray-400 ml-2" />
//           </div>
//         )}
//       </div>
//     )
//   }

//   return (
//     <div className={`flex flex-col h-screen bg-[#e5ddd5] max-h-[100vh] bg-opacity-30 ${className} message-box-container touch-manipulation`}>
//       {/* Mobile optimized layout */}
//       <style jsx>{`
//         @media (max-width: 640px) {
//           .message-box-container {
//             height: 100vh;
//             max-height: 100vh;
//             touch-action: manipulation;
//           }
          
//           /* Prevent zooming on input focus for better mobile experience */
//           input[type="text"] {
//             font-size: 16px;
//           }
          
//           /* Ensure touch targets are at least 48px for accessibility */
//           button, input[type="file"] + button {
//             min-height: 48px;
//             min-width: 48px;
//           }
//         }
//       `}</style>
//       {/* Header */}
//       <div className="bg-[#0c0c0c] p-4 flex items-center justify-between text-white sticky top-0 z-10">
//         <div className="flex items-center">
//           {onBack && (
//             <button onClick={onBack} className="p-3 min-h-[48px] min-w-[48px] mr-3 rounded-full hover:bg-white/10 transition-colors duration-200">
//               <ArrowLeft className="h-5 w-5" />
//             </button>
//           )}
//           <div className="w-12 h-12 min-w-[48px] min-h-[48px] rounded-full bg-gray-300 flex items-center justify-center">
//             <User className="h-6 w-6 text-gray-600" />
//           </div>
//           <div className="ml-3">
//             <h2 className="font-medium text-base sm:text-lg">{title}</h2>
//           </div>
//         </div>
//       </div>

//       {/* Chat Area */}
//       <div ref={messageContainerRef} className="flex-1 overflow-y-auto p-3 sm:p-4 bg-[#e5ddd5] bg-opacity-30">
//         {isLoading && messages.length === 0 ? (
//           <div className="flex items-center justify-center h-full text-gray-500 text-sm sm:text-base">Loading messages...</div>
//         ) : messages.length === 0 ? (
//           <div className="flex items-center justify-center h-full text-gray-500 text-sm sm:text-base p-6 text-center">
//               No messages yet. Start the conversation!
//             </div>
//         ) : (
//           <div className="space-y-2">
//             {messages.map((msg) => (
//               <div key={msg.id} className={`flex ${msg.sender === "client" ? "justify-end" : "justify-start"} py-2 sm:py-2 px-2 sm:px-0`}>
//                 <div
//                   className={`max-w-[90%] sm:max-w-[80%] p-4 rounded-lg shadow transition-all duration-200 ${msg.sender === "client" ? "bg-[#dcf8c6] text-black rounded-tr-none" : "bg-white text-black rounded-tl-none"}`}
//                 >
//                   {msg.text && <p className="text-base sm:text-base leading-relaxed">{msg.text}</p>}
//                   {renderAttachment(msg.attachment)}
//                   <div className="text-xs sm:text-sm text-gray-500 text-right mt-2 flex justify-end items-center space-x-2">
//                     <span>{formatTime(msg.timestamp)}</span>
//                     <span>{formatDate(msg.timestamp)}</span>
//                     {msg.read && <span className="text-blue-500 text-sm">✓✓</span>}
//                   </div>
//                 </div>
//               </div>
//             ))}
//             <div ref={messagesEndRef} />
//           </div>
//         )}
//         {showScrollToBottom && (
//           <button
//             onClick={scrollToBottom}
//             className="absolute bottom-24 right-5 p-3 bg-gray-800 text-white rounded-full shadow-lg hover:bg-gray-700 transition-colors duration-200"
//             aria-label="Scroll to bottom"
//           >
//             <ChevronDown className="h-6 w-6" />
//           </button>
//         )}
//       </div>

//       {/* File Preview */}
//         {selectedFile && (
//           <div className="bg-[#f0f2f5] p-3 border-t border-gray-300">
//             <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-lg">
//               <div className="flex items-center">
//                 {filePreview ? (
//                   <img src={filePreview} alt="Preview" className="w-24 h-24 sm:w-16 sm:h-16 object-cover rounded mr-3" />
//                 ) : (
//                   <div className="w-24 h-24 sm:w-16 sm:h-16 bg-gray-200 rounded mr-3 flex items-center justify-center">
//                     {getFileIcon(selectedFile.type)}
//                   </div>
//                 )}
//                 <div>
//                   <p className="text-base sm:text-base font-medium text-gray-900 truncate max-w-[180px] sm:max-w-[220px]">
//                     {selectedFile.name}
//                   </p>
//                   <p className="text-xs text-gray-500">
//                     {formatFileSize(selectedFile.size)}
//                   </p>
//                 </div>
//               </div>
//               <button
//                 onClick={removeSelectedFile}
//                 className="p-3 min-h-[48px] min-w-[48px] text-gray-400 hover:text-gray-600 transition-colors duration-200 rounded-full hover:bg-gray-100"
//               >
//                 <X className="h-5 w-5" />
//               </button>
//             </div>
//           </div>
//         )}

//       {/* Input */}
//       <div className="bg-[#f0f2f5] p-3 border-t border-gray-300 sticky bottom-0 z-10">
//         <form onSubmit={handleSendMessage} className="flex items-center">
//           <input
//             ref={fileInputRef}
//             type="file"
//             onChange={handleFileSelect}
//             accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
//             className="hidden"
//           />
//           <button
//             type="button"
//             onClick={() => fileInputRef.current?.click()}
//             className="p-3 min-h-[48px] min-w-[48px] text-gray-500 hover:text-gray-700 mr-2 transition-colors duration-200"
//           >
//             <Paperclip className="h-5 w-5" />
//           </button>
//           <div className="flex-1 mx-2">
//             <Input
//               type="text"
//               value={message}
//               onChange={(e) => setMessage(e.target.value)}
//               placeholder="Type a message"
//               disabled={isSending}
//               className="w-full rounded-full border-0 bg-white px-4 py-3 focus-visible:ring-1 focus-visible:ring-gray-300 disabled:opacity-50 text-base"
//             />
//           </div>
//           <button
//             type="submit"
//             disabled={isSending || (!message.trim() && !selectedFile)}
//             className="p-3 min-h-[48px] min-w-[48px] text-white bg-[#00a884] rounded-full hover:bg-[#128c7e] disabled:opacity-50 transition-colors duration-200"
//           >
//             <Send className="h-6 w-6" />
//           </button>
//         </form>
//       </div>
//     </div>
//   )
// }

// export default ClientMessageBox


"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import { Input } from "@/components/ui/input"
import { Send, User, ArrowLeft, Paperclip, X, FileText, ImageIcon, Download, ChevronDown } from "lucide-react"

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
  const messageContainerRef = useRef<HTMLDivElement>(null)
  const [showScrollToBottom, setShowScrollToBottom] = useState(false)

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
        const res = await fetch(`/api/messages?seed=1&conversationId=${encodeURIComponent(conversationId)}`, {
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
          attachment: m.attachment
            ? {
                fileName: m.attachment.fileName,
                fileSize: m.attachment.fileSize,
                fileType: m.attachment.fileType,
                fileUrl: m.attachment.fileUrl,
              }
            : undefined,
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
        const res = await fetch(`/api/messages?seed=1&conversationId=${encodeURIComponent(conversationId)}`, {
          cache: "no-store",
        })
        if (!res.ok) return
        const data = await res.json()
        const incoming: ClientMessage[] = (data.messages || []).map((m: any) => ({
          id: m.id,
          text: m.text,
          sender: m.sender,
          timestamp: new Date(m.timestamp),
          read: !!m.read,
          attachment: m.attachment
            ? {
                fileName: m.attachment.fileName,
                fileSize: m.attachment.fileSize,
                fileType: m.attachment.fileType,
                fileUrl: m.attachment.fileUrl,
              }
            : undefined,
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

  // Handle scroll to show/hide scroll to bottom button
  useEffect(() => {
    const handleScroll = () => {
      if (!messageContainerRef.current) return
      const { scrollTop, scrollHeight, clientHeight } = messageContainerRef.current
      // Show button if not at bottom (with a 100px threshold)
      setShowScrollToBottom(scrollHeight - scrollTop - clientHeight > 100)
    }

    const container = messageContainerRef.current
    if (container) {
      container.addEventListener("scroll", handleScroll)
      // Check initial position
      handleScroll()
    }

    return () => {
      if (container) {
        container.removeEventListener("scroll", handleScroll)
      }
    }
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

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

  const uploadFile = async (
    file: File,
  ): Promise<{ fileName: string; fileSize: number; fileType: string; fileUrl: string } | null> => {
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
      const refresh = await fetch(
        `/api/messages${conversationId ? `?conversationId=${encodeURIComponent(conversationId)}` : ""}`,
        { cache: "no-store" },
      )
      if (refresh.ok) {
        const payload = await refresh.json()
        const synced: ClientMessage[] = (payload.messages || []).map((m: any) => ({
          id: m.id,
          text: m.text,
          sender: m.sender,
          timestamp: new Date(m.timestamp),
          read: !!m.read,
          attachment: m.attachment
            ? {
                fileName: m.attachment.fileName,
                fileSize: m.attachment.fileSize,
                fileType: m.attachment.fileType,
                fileUrl: m.attachment.fileUrl,
              }
            : undefined,
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
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) return <ImageIcon className="h-5 w-5" />
    if (fileType === "application/pdf") return <FileText className="h-5 w-5 text-red-500" />
    if (fileType.includes("word") || fileType.includes("document"))
      return <FileText className="h-5 w-5 text-blue-500" />
    if (fileType.includes("sheet") || fileType.includes("excel")) return <FileText className="h-5 w-5 text-green-500" />
    return <FileText className="h-5 w-5" />
  }

  const renderAttachment = (attachment: ClientMessage["attachment"]) => {
    if (!attachment) return null

    const isImage = attachment.fileType.startsWith("image/")

    return (
      <div className="mt-2 overflow-hidden">
        {isImage ? (
          <div className="relative w-full max-w-[280px] sm:max-w-xs overflow-hidden rounded-lg">
            <img
              src={attachment.fileUrl || "/placeholder.svg"}
              alt={attachment.fileName}
              className="rounded-lg w-full h-auto cursor-pointer transition-transform duration-200 hover:scale-[1.02]"
              onClick={() => window.open(attachment.fileUrl, "_blank")}
            />
          </div>
        ) : (
          <div
            className="flex items-center p-3 bg-gray-100 rounded-lg max-w-[280px] sm:max-w-xs cursor-pointer hover:bg-gray-200 transition-colors duration-200"
            onClick={() => window.open(attachment.fileUrl, "_blank")}
          >
            <div className="mr-3 flex-shrink-0">{getFileIcon(attachment.fileType)}</div>
            <div className="flex-1 min-w-0 overflow-hidden">
              <p className="text-sm font-medium text-gray-900 truncate">{attachment.fileName}</p>
              <p className="text-xs text-gray-500">{formatFileSize(attachment.fileSize)}</p>
            </div>
            <Download className="h-5 w-5 text-gray-400 ml-2 flex-shrink-0" />
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      className={`flex flex-col h-screen lg:h-[800px] bg-gradient-to-b from-[#e5ddd5] to-[#d9d0c7] overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="bg-[#0c0c0c] p-3 sm:p-4 flex items-center justify-between text-white shadow-lg backdrop-blur-sm flex-shrink-0">
        <div className="flex items-center min-w-0 flex-1">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 mr-2 rounded-full hover:bg-white/10 transition-all duration-200 active:scale-95 flex-shrink-0"
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center shadow-md flex-shrink-0">
            <User className="h-5 w-5 sm:h-6 sm:w-6 text-gray-700" />
          </div>
          <div className="ml-3 min-w-0 flex-1">
            <h2 className="font-semibold text-base sm:text-lg truncate">{title}</h2>
            <p className="text-xs text-gray-300">Online</p>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div
        ref={messageContainerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 relative"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "#888 transparent",
        }}
      >
        {isLoading && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-600 text-sm sm:text-base">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
              <p>Loading messages...</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-600 text-sm sm:text-base p-6 text-center">
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center mb-2">
                <Send className="h-8 w-8 text-gray-400" />
              </div>
              <p className="font-medium">No messages yet</p>
              <p className="text-xs text-gray-500">Start the conversation!</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3 overflow-hidden">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === "client" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[75%] p-3 sm:p-4 rounded-2xl shadow-md transition-all duration-200 hover:shadow-lg overflow-hidden ${
                    msg.sender === "client"
                      ? "bg-[#dcf8c6] text-black rounded-tr-sm"
                      : "bg-white text-black rounded-tl-sm"
                  }`}
                >
                  {msg.text && (
                    <p className="text-sm sm:text-base leading-relaxed break-words overflow-wrap-anywhere whitespace-pre-wrap">
                      {msg.text}
                    </p>
                  )}
                  {renderAttachment(msg.attachment)}
                  <div className="text-[10px] sm:text-xs text-gray-500 text-right mt-2 flex justify-end items-center gap-2 flex-wrap">
                    <span className="whitespace-nowrap">{formatTime(msg.timestamp)}</span>
                    <span className="whitespace-nowrap">{formatDate(msg.timestamp)}</span>
                    {msg.read && <span className="text-blue-500">✓✓</span>}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
        {showScrollToBottom && (
          <button
            onClick={scrollToBottom}
            className="fixed bottom-28 right-4 sm:right-6 p-3 bg-gray-800 text-white rounded-full shadow-xl hover:bg-gray-700 transition-all duration-200 active:scale-95 z-20 animate-in fade-in slide-in-from-bottom-4"
            aria-label="Scroll to bottom"
          >
            <ChevronDown className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* File Preview */}
      {selectedFile && (
        <div className="bg-[#f0f2f5] p-3 border-t border-gray-300 flex-shrink-0 overflow-hidden">
          <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-lg shadow-sm overflow-hidden">
            <div className="flex items-center min-w-0 flex-1 overflow-hidden">
              {filePreview ? (
                <img
                  src={filePreview || "/placeholder.svg"}
                  alt="Preview"
                  className="w-12 h-12 sm:w-14 sm:h-14 object-cover rounded flex-shrink-0"
                />
              ) : (
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                  {getFileIcon(selectedFile.type)}
                </div>
              )}
              <div className="ml-3 min-w-0 flex-1 overflow-hidden">
                <p className="text-sm sm:text-base font-medium text-gray-900 truncate">{selectedFile.name}</p>
                <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
              </div>
            </div>
            <button
              onClick={removeSelectedFile}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200 rounded-full hover:bg-gray-100 active:scale-95 flex-shrink-0"
              aria-label="Remove file"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="bg-[#f0f2f5] p-3 sm:p-4 border-t border-gray-300 flex-shrink-0 overflow-hidden">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
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
            className="p-2.5 text-gray-500 hover:text-gray-700 transition-all duration-200 rounded-full hover:bg-gray-200 active:scale-95 flex-shrink-0"
            aria-label="Attach file"
          >
            <Paperclip className="h-5 w-5" />
          </button>
          <div className="flex-1 min-w-0">
            <Input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message"
              disabled={isSending}
              className="w-full rounded-full border-0 bg-white px-4 py-2.5 sm:py-3 focus-visible:ring-2 focus-visible:ring-[#00a884] disabled:opacity-50 text-base shadow-sm"
            />
          </div>
          <button
            type="submit"
            disabled={isSending || (!message.trim() && !selectedFile)}
            className="p-2.5 sm:p-3 text-white bg-[#00a884] rounded-full hover:bg-[#128c7e] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 active:scale-95 shadow-md hover:shadow-lg flex-shrink-0"
            aria-label="Send message"
          >
            <Send className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        </form>
      </div>
    </div>
  )
}

export default ClientMessageBox
