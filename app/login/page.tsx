"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Shield } from "lucide-react"
import Image from "next/image"

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    await signIn("google", { callbackUrl: "/" })
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Financhat</CardTitle>
          <CardDescription>Sign in to analyze your bank statements</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="rounded-full bg-blue-50 p-3">
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
            <div>
              <h3 className="text-lg font-medium">Bank Statement Analysis</h3>
              <p className="text-sm text-gray-500">Chat with your bank statements and get financial insights</p>
            </div>
          </div>

          <div className="flex items-center justify-center space-x-2 text-sm text-green-600">
            <Shield className="h-4 w-4" />
            <span>Privacy-First & Secure</span>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-gray-50 px-2 text-gray-500">Sign in with</span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full border-gray-300 bg-white text-black hover:bg-gray-50"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-gray-500 border-t-transparent" />
            ) : (
              <Image src="/google-logo.png" width={18} height={18} alt="Google" className="mr-2" />
            )}
            Continue with Google
          </Button>
        </CardContent>

        <CardFooter className="flex flex-col space-y-2 text-center text-xs text-gray-500">
          <p>By signing in, you agree to our Terms of Service and Privacy Policy.</p>
          <p>Trial access includes analysis of one bank statement.</p>
        </CardFooter>
      </Card>
    </div>
  )
}
