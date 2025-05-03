"use client"

import { useState, useEffect, useRef } from "react"
import { Upload, Send, Lock, FileText, Shield, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useChat } from "@ai-sdk/react"
import { useSession, signOut } from "next-auth/react"
import PDFUploader from "@/components/pdf-uploader"
import RequestMoreUploads from "@/components/request-more-uploads"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { blobToBase64 } from "@/lib/utils"
import { MemoizedMarkdown } from "@/components/memoized-markdown"

export default function BankStatementAnalyzer() {
  const { data: session } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [pdfFile, setPdfFile] = useState<{ file: File; data: ArrayBuffer } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [activeTab, setActiveTab] = useState("upload")
  const [showRequestForm, setShowRequestForm] = useState(false)
  const chatContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!session?.user) {
      // Redirect to login if not authenticated
      router.push("/login")
    }
  }, [session])

  // Get user's remaining uploads
  const uploadsRemaining = session?.user?.usage?.uploadsRemaining || 0

  const { messages, input, handleInputChange, handleSubmit, append } = useChat({
    api: "/api/chat",
    initialMessages: [
      {
        id: "1",
        role: "user",
        content: "Hello! I have provided my bank statement. Give me a summary of my total income and total expenses."
      }
    ],
    onResponse: () => {
      setIsAnalyzing(false);
      // Automatically switch to chat tab after first response
      if (activeTab === "upload") {
        setActiveTab("chat");
      }
    },
    onError: (error) => {
      console.error("Error during chat:", error);
      setIsAnalyzing(false);
    },
    onFinish: (message) => {
      setIsLoading(false);
    }
  });

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    handleSubmit(e);
    setIsLoading(true);
  }

  const handlePdfProcessed = async (file: File, pdfBytes: ArrayBuffer) => {
    // Check if user has uploads remaining
    if (uploadsRemaining <= 0) {
      toast({
        title: "Upload limit reached",
        description: "You've used all your trial uploads. Please request more uploads.",
        variant: "destructive",
      })
      setShowRequestForm(true)
      return
    }

    // Proceed with upload
    setPdfFile({ file, data: pdfBytes })
    setIsAnalyzing(true)

    const dataURL = await blobToBase64(file);
    await append({
      role: "user",
      content: "This is my bank statement. Please analyze it.",
      experimental_attachments: [
        {
          name: file.name,
          contentType: file.type,
          url: dataURL,
        }
      ]
    })

    // Update user's remaining uploads in the database
    try {
      await fetch("/api/usage/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "decrementUploads" }),
      })
    } catch (error) {
      setIsAnalyzing(false)
      console.error("Failed to update usage:", error)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <Card className="w-full max-w-3xl shadow-lg">
        <CardHeader className="bg-white border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold">Financhat</CardTitle>
              <CardDescription>
                Chat with your bank statements securely and privately
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center text-green-600 text-sm">
                <Shield className="h-4 w-4 mr-1" />
                <span>Privacy-First</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut({ callbackUrl: "/login" })}
              >
                <LogOut className="h-4 w-4 mr-1" />
                Sign Out
              </Button>
            </div>
          </div>

          {/* User info and usage */}
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
            <div className="flex items-center">
              {session?.user?.image && (
                <img
                  src={session.user.image || "/placeholder.svg"}
                  alt={session.user.name || "User"}
                  className="h-6 w-6 rounded-full mr-2"
                />
              )}
              <span className="text-sm text-gray-600">
                {session?.user?.name}
              </span>
            </div>
            <div className="text-sm">
              <span
                className={`font-medium ${
                  uploadsRemaining > 0 ? "text-green-600" : "text-amber-600"
                }`}
              >
                {uploadsRemaining} upload{uploadsRemaining !== 1 ? "s" : ""}{" "}
                remaining
              </span>
              {uploadsRemaining === 0 && (
                <Button
                  variant="link"
                  size="sm"
                  className="text-xs p-0 h-auto ml-2"
                  onClick={() => setShowRequestForm(true)}
                >
                  Request more
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              <span>Upload Statement</span>
            </TabsTrigger>
            <TabsTrigger
              value="chat"
              className="flex items-center gap-2"
              disabled={!pdfFile}
            >
              <Send className="h-4 w-4" />
              <span>Chat</span>
              {messages.length > 0 && (
                <span className="ml-1 h-5 w-5 rounded-full bg-blue-100 text-blue-600 text-xs flex items-center justify-center">
                  {messages.length}
                </span>
              )}
            </TabsTrigger>
            </TabsList>

          <TabsContent value="upload" className="p-0">
            <CardContent className="pt-6">
              <div className="text-center mb-6">
                <p className="text-sm text-gray-500 mb-4">
                  Upload your bank statement to analyze and chat about your
                  finances. Your data stays private and is never stored on our
                  servers.
                </p>

                <div className="flex items-center justify-center gap-2 mb-4">
                  <FileText className="h-5 w-5 text-blue-500" />
                  <span className="text-sm font-medium">
                    Supports password-protected PDFs
                  </span>
                  <Lock className="h-4 w-4 text-blue-500" />
                </div>
              </div>

              {uploadsRemaining > 0 ? (
                <PDFUploader onPdfProcessed={handlePdfProcessed} />
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <div className="text-amber-600 mb-2">
                    <Shield className="h-10 w-10 mx-auto mb-2" />
                    <h3 className="text-lg font-medium">Trial Limit Reached</h3>
                  </div>
                  <p className="text-sm text-gray-500 mb-4">
                    You've used your trial upload. Request more uploads to
                    continue using the service.
                  </p>
                  <Button onClick={() => setShowRequestForm(true)}>
                    Request More Uploads
                  </Button>
                </div>
              )}

              {isAnalyzing && (
                <div className="mt-4 p-3 bg-blue-50 rounded-md text-sm text-blue-700 flex items-center">
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                  Analyzing your bank statement...
                </div>
              )}
            </CardContent>
          </TabsContent>

          <TabsContent value="chat" className="p-0">
            <CardContent
              ref={chatContainerRef}
              className="h-[500px] overflow-y-auto pt-6 px-4"
            >
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                  <FileText className="h-12 w-12 mb-4 text-gray-300" />
                  <p>Your bank statement is ready for analysis.</p>
                  <p className="text-sm mt-2">
                    Ask questions about your finances below.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.role === "user"
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-4 py-2 ${
                          message.role === "user"
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        <MemoizedMarkdown
                          id={message.id}
                          content={message.content}
                        />
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="max-w-[80%] rounded-lg px-4 py-2 bg-gray-100">
                        <div className="flex space-x-1">
                          <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                          <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>

            <CardFooter className="border-t p-4">
              <form onSubmit={handleSend} className="flex w-full gap-2">
                <Input
                  value={input}
                  onChange={handleInputChange}
                  placeholder="Ask about your finances..."
                  className="flex-1"
                  disabled={isLoading}
                />
                <Button type="submit" disabled={isLoading || !input.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </CardFooter>
          </TabsContent>
        </Tabs>
      </Card>

      <div className="mt-4 text-xs text-gray-500 max-w-3xl text-center">
        <p>
          Your data is processed locally and never stored on our servers. We use
          Claude by Anthropic, a privacy-first AI model that does not retain
          your financial information.
        </p>
      </div>

      {/* Request More Uploads Dialog */}
      <RequestMoreUploads
        open={showRequestForm}
        onOpenChange={setShowRequestForm}
      />
    </div>
  );
}
