import type React from "react"
import { useState } from "react"
import "./App.css"

interface ApiResponse {
  success?: boolean
  image?: string
  details?: Array<{
    class: string
    top_confidence: number
    bbox: [number, number, number, number]
  }>
  details_count?: number
  msg?: string
  error?: string
}

function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>("")
  const [response, setResponse] = useState<ApiResponse | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setSelectedFile(file)

      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(file)

      // Reset previous results
      setResponse(null)
    }
  }

  const sendToApiGateway = async () => {
    if (!selectedFile) {
      alert("Please select an image first")
      return
    }

    setLoading(true)
    setError("")
    setResponse(null)

    try {
      // Convert image to base64
      const reader = new FileReader()
      const base64Image = await new Promise<string>((resolve, reject) => {
        reader.readAsDataURL(selectedFile)
        reader.onload = () => {
          if (reader.result) {
            const base64 = (reader.result as string).split(",")[1]
            resolve(base64)
          } else {
            reject(new Error("Failed to convert image to base64"))
          }
        }
        reader.onerror = () => reject(reader.error)
      })

      // Get API Gateway URL from environment
      const apiUrl = import.meta.env.VITE_INVOKE_URL || import.meta.env.VITE_API_URL

      if (!apiUrl) {
        throw new Error("API Gateway URL not configured. Please set VITE_INVOKE_URL in .env file")
      }

      // Determine content type
      const contentType = selectedFile.type.includes("jpeg")
        ? "jpeg"
        : selectedFile.type.includes("png")
          ? "png"
          : selectedFile.type.includes("gif")
            ? "gif"
            : "jpeg"

      // Send to API Gateway (same format as test.py)
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image_data: base64Image,
          image_name: selectedFile.name,
          content_type: contentType,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`API returned ${response.status}: ${errorText}`)
      }

      // Parse the response - Lambda returns JSON wrapped in a response structure
      const rawData = await response.json()
      console.log("Raw API Response:", rawData)

      // The response might be wrapped in a 'body' field if coming through API Gateway
      let data: ApiResponse

      if (rawData.body && typeof rawData.body === "string") {
        // If body is a string (common Lambda response format), parse it
        console.log("Parsing string body:", rawData.body.substring(0, 100))
        data = JSON.parse(rawData.body)
      } else if (rawData.success !== undefined) {
        // If it has the success field directly, use it as-is
        console.log("Using direct success field")
        data = rawData
      } else if (rawData.body && typeof rawData.body === "object") {
        // If body exists as object, use it
        console.log("Using body object")
        data = rawData.body
      } else {
        // Otherwise use raw data
        console.log("Using raw data")
        data = rawData as ApiResponse
      }

      console.log("Parsed API Response:", data)
      console.log("Success value:", data.success)
      setResponse(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred"
      setError(errorMessage)
      console.error("Error sending to API Gateway:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 py-8 px-4 sm:px-6 lg:px-8">
      <div
        className="fixed inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 35px, currentColor 35px, currentColor 36px),
                          repeating-linear-gradient(-45deg, transparent, transparent 35px, currentColor 35px, currentColor 36px)`,
          color: "#92400e",
        }}
      ></div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-12">
          <div className="inline-block mb-4">
            <div className="flex items-center justify-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-600 to-red-600 rounded-lg transform rotate-45"></div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-amber-800 via-red-700 to-orange-800 bg-clip-text text-transparent">
                Central Asian Cuisine
              </h1>
              <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-amber-600 rounded-lg transform rotate-45"></div>
            </div>
          </div>
          <p className="text-xl text-amber-900 font-medium">Food Recognition System</p>
          <p className="text-amber-700 mt-2 max-w-2xl mx-auto">
            Discover the rich flavors of Central Asia. Upload an image to identify traditional dishes using our latest Deep Learning model.
          </p>
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border-4 border-amber-200 overflow-hidden">
          <div className="h-3 bg-gradient-to-r from-amber-600 via-red-600 to-orange-600"></div>

          <div className="p-8 space-y-8">
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-8 border-2 border-amber-300">
              <h2 className="text-3xl font-bold text-amber-900 mb-6 text-center flex items-center justify-center gap-3">
                <span className="text-4xl">📸</span>
                Upload Your Food Image
                <span className="text-4xl">🍽️</span>
              </h2>

              <div className="border-4 border-dashed border-amber-400 rounded-xl p-12 text-center bg-white/50 hover:bg-white/80 hover:border-amber-500 transition-all duration-300">
                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" id="file-upload" />
                <label htmlFor="file-upload" className="cursor-pointer inline-block">
                  <div className="flex flex-col items-center">
                    <div className="w-24 h-24 bg-gradient-to-br from-amber-500 to-red-500 rounded-full flex items-center justify-center mb-6 shadow-lg">
                      <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                    </div>
                    <span className="text-amber-900 font-bold text-xl mb-2">Click to upload or drag and drop</span>
                    <span className="text-amber-700 mt-2">PNG, JPG, GIF up to 10MB</span>
                  </div>
                </label>
              </div>

              {selectedFile && (
                <div className="mt-6 bg-white rounded-xl p-6 border-2 border-amber-200 shadow-md">
                  <p className="text-sm font-semibold text-amber-800 mb-4 flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    Selected: {selectedFile.name}
                  </p>
                  <img
                    src={preview || "/placeholder.svg"}
                    alt="Preview"
                    className="w-full max-h-80 object-contain rounded-lg border-4 border-amber-100"
                  />
                </div>
              )}

              <button
                onClick={sendToApiGateway}
                disabled={!selectedFile || loading}
                className="mt-6 w-full bg-gradient-to-r from-amber-600 via-red-600 to-orange-600 hover:from-amber-700 hover:via-red-700 hover:to-orange-700 disabled:from-gray-400 disabled:via-gray-400 disabled:to-gray-400 text-white font-bold text-lg py-4 px-8 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-3">
                    <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Analyzing Your Dish...
                  </span>
                ) : (
                  "🔍 Detect Central Asian Cuisine"
                )}
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border-4 border-red-300 rounded-xl p-6 shadow-lg">
                <h2 className="text-2xl font-bold text-red-800 mb-3 flex items-center gap-2">
                  <span className="text-3xl">⚠️</span>
                  Error Occurred
                </h2>
                <p className="text-red-700 font-medium">{error}</p>
              </div>
            )}

            {response && (
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-8 border-2 border-amber-300">
                <h2 className="text-3xl font-bold text-amber-900 mb-6 text-center flex items-center justify-center gap-3">
                  <span className="text-4xl">✨</span>
                  Detection Results
                  <span className="text-4xl">✨</span>
                </h2>

                <div className="bg-white/70 rounded-xl p-6 border-2 border-amber-200 space-y-6">
                  <div className="flex items-center justify-center gap-4 pb-4 border-b-2 border-amber-200">
                    <span
                      className={`text-lg font-bold px-6 py-2 rounded-full ${
                        response.success
                          ? "bg-green-100 text-green-800 border-2 border-green-300"
                          : "bg-red-100 text-red-800 border-2 border-red-300"
                      }`}
                    >
                      {response.success ? "✅ Detection Successful" : "❌ Detection Failed"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <div className="bg-gradient-to-r from-amber-600 to-orange-600 text-white font-bold text-lg py-3 px-4 rounded-t-lg text-center">
                        📷 Original Image
                      </div>
                      <div className="bg-white rounded-b-lg border-4 border-amber-300 overflow-hidden shadow-lg">
                        {preview ? (
                          <img
                            src={preview || "/placeholder.svg"}
                            alt="Original"
                            className="w-full h-80 object-contain bg-gray-50"
                          />
                        ) : (
                          <div className="w-full h-80 flex items-center justify-center text-amber-400 text-lg">
                            No image selected
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="bg-gradient-to-r from-red-600 to-amber-600 text-white font-bold text-lg py-3 px-4 rounded-t-lg text-center">
                        🎯 Detected Cuisine
                      </div>
                      <div className="bg-white rounded-b-lg border-4 border-red-300 overflow-hidden shadow-lg">
                        {response.image ? (
                          <img
                            src={`data:image/jpeg;base64,${response.image}`}
                            alt="Processed"
                            className="w-full h-80 object-contain bg-gray-50"
                          />
                        ) : (
                          <div className="w-full h-80 flex items-center justify-center text-red-400 text-lg">
                            No processed image returned
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {response.details && response.details.length > 0 && (
                    <div className="mt-8">
                      <div className="bg-gradient-to-r from-amber-700 to-red-700 text-white font-bold text-xl py-4 px-6 rounded-t-xl text-center">
                        🍴 Identified Dishes ({response.details_count || response.details.length})
                      </div>
                      <div className="bg-white rounded-b-xl border-4 border-amber-300 p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {response.details.map((detection, index) => (
                            <div
                              key={index}
                              className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg p-5 border-3 border-amber-300 shadow-md hover:shadow-lg transition-shadow"
                            >
                              <div className="flex justify-between items-start mb-3">
                                <span className="font-bold text-lg text-amber-900 capitalize flex-1">
                                  {detection.class.replace(/-/g, " ").replace(/_/g, " ")}
                                </span>
                                <span className="text-2xl font-bold text-red-600 ml-3">
                                  {(detection.top_confidence * 100).toFixed(1)}%
                                </span>
                              </div>

                              <div className="w-full bg-amber-200 rounded-full h-3 mb-3 overflow-hidden">
                                <div
                                  className="bg-gradient-to-r from-amber-500 to-red-500 h-full rounded-full transition-all duration-500"
                                  style={{ width: `${detection.top_confidence * 100}%` }}
                                ></div>
                              </div>

                              <div className="flex items-center justify-between text-xs text-amber-700 bg-white/50 rounded px-3 py-2">
                                <span className="font-semibold">Bounding Box:</span>
                                <span className="font-mono">
                                  [{detection.bbox.map((n) => n.toFixed(0)).join(", ")}]
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {response.msg && (
                    <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 text-center">
                      <p className="text-blue-800 font-medium">{response.msg}</p>
                    </div>
                  )}

                  <details className="mt-6">
                    <summary className="cursor-pointer text-sm font-semibold text-amber-800 hover:text-amber-900 bg-amber-100 px-4 py-3 rounded-lg border-2 border-amber-300">
                      📋 View Raw JSON Response
                    </summary>
                    <pre className="mt-3 p-4 bg-gray-900 text-green-400 rounded-lg text-xs overflow-auto max-h-96 border-2 border-amber-300 font-mono">
                      {JSON.stringify(response, null, 2)}
                    </pre>
                  </details>
                </div>
              </div>
            )}
          </div>

          <div className="h-3 bg-gradient-to-r from-orange-600 via-red-600 to-amber-600"></div>
        </div>

      </div>
    </div>
  )
}

export default App
