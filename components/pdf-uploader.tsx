"use client"

import type React from "react"

import { useState, useRef, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Upload, Lock, FileText, AlertCircle, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { processPdf } from "@/lib/pdf-utils"

interface PDFUploaderProps {
  onPdfProcessed: (file: File, unlockedPdf: ArrayBuffer) => void
}

export default function PDFUploader({ onPdfProcessed }: PDFUploaderProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isPasswordProtected, setIsPasswordProtected] = useState(false)
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const processFile = async (selectedFile: File) => {
    setError(null)

    if (selectedFile.type !== "application/pdf" && !selectedFile.name.toLowerCase().endsWith(".pdf")) {
      setError("Please upload a PDF file")
      return
    }

    setFile(selectedFile)

    try {
      setIsProcessing(true)
      // Try to process without password first
      const { pdfBytes, isEncrypted } = await processPdf(selectedFile)

      if (isEncrypted) {
        setIsPasswordProtected(true)
      } else if (pdfBytes) {
        onPdfProcessed(selectedFile, pdfBytes)
      }
    } catch (err) {
      setIsPasswordProtected(true)
    } finally {
      setIsProcessing(false)
    }
  }

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      processFile(acceptedFiles[0])
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive, isDragAccept, isDragReject } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
    maxFiles: 1,
    multiple: false,
  })

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await processFile(e.target.files[0])
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!file) return

    try {
      setIsProcessing(true)
      const { pdfBytes, isEncrypted } = await processPdf(file, password)

      if (isEncrypted) {
        setError("Incorrect password. Please try again.")
      } else if (pdfBytes) {
        onPdfProcessed(file, pdfBytes)
        setIsPasswordProtected(false)
      }
    } catch (err) {
      setError("Failed to decrypt the PDF. Please check your password.")
    } finally {
      setIsProcessing(false)
    }
  }

  const resetUpload = () => {
    setFile(null)
    setIsPasswordProtected(false)
    setPassword("")
    setError(null)
    setShowPassword(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // Determine dropzone border color based on state
  const getBorderColor = () => {
    if (isDragAccept) return "border-green-500 bg-green-50"
    if (isDragReject) return "border-red-500 bg-red-50"
    if (isDragActive) return "border-blue-500 bg-blue-50"
    return "border-gray-300 hover:bg-gray-50"
  }

  return (
    <div className="space-y-4">
      {error && !isPasswordProtected && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!file ? (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${getBorderColor()}`}
        >
          <input {...getInputProps()} />

          <Upload
            className={`h-10 w-10 mx-auto mb-4 ${isDragActive ? "text-blue-500 animate-bounce" : "text-gray-400"}`}
          />

          <h3 className="text-lg font-medium mb-1">
            {isDragActive
              ? isDragAccept
                ? "Drop your PDF here"
                : "Only PDF files are accepted"
              : "Upload Bank Statement"}
          </h3>

          <p className="text-sm text-gray-500 mb-4">
            {isDragActive ? "Release to upload" : "Drag and drop your PDF file here or click to browse"}
          </p>

          {!isDragActive && (
            <Button type="button" variant="outline">
              Select PDF
            </Button>
          )}
        </div>
      ) : (
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <FileText className="h-6 w-6 text-blue-500 mr-2" />
              <div>
                <p className="font-medium">{file.name}</p>
                <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={resetUpload}>
              <X className="h-4 w-4 mr-1" />
              Change
            </Button>
          </div>

          <div className="flex items-center justify-center">
            {isProcessing ? (
              <div className="flex items-center text-blue-600">
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
                Processing PDF...
              </div>
            ) : (
              <Button disabled={isPasswordProtected}>
                {isPasswordProtected ? (
                  <div className="flex items-center">
                    <Lock className="h-4 w-4 mr-2" />
                    Password Protected
                  </div>
                ) : (
                  "PDF Ready for Analysis"
                )}
              </Button>
            )}
          </div>

          <Dialog
            open={isPasswordProtected}
            onOpenChange={(open) => {
              if (!open) {
                // If user closes dialog without entering password, reset the file
                resetUpload()
              }
            }}
          >
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Password Protected PDF</DialogTitle>
              </DialogHeader>

              <div className="flex items-center bg-amber-50 p-2 rounded text-amber-700 text-sm mb-3">
                <Lock className="h-4 w-4 mr-2 flex-shrink-0" />
                <span>This PDF requires a password to unlock</span>
              </div>

              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="pdf-password">Enter PDF Password</Label>
                  <div className="relative">
                    <Input
                      id="pdf-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password to unlock"
                      autoComplete="off"
                      autoFocus
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? "Hide" : "Show"}
                    </Button>
                  </div>
                  {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
                </div>

                <div className="flex justify-between items-center">
                  <Button type="button" variant="outline" onClick={resetUpload}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={!password || isProcessing}>
                    {isProcessing ? (
                      <>
                        <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
                        Unlocking...
                      </>
                    ) : (
                      <>Unlock PDF</>
                    )}
                  </Button>
                </div>

                <div className="pt-2 border-t text-xs text-gray-500">
                  <p className="font-medium mb-1">Privacy Information:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Your password is only used locally in your browser</li>
                    <li>Your password is never sent to our servers or stored</li>
                    <li>The decryption happens entirely on your device</li>
                    <li>When you close this page, the password is forgotten</li>
                  </ul>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  )
}
