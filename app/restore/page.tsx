"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Download, Loader2, PackageOpen, Images } from "lucide-react"
import FileUpload from "@/components/file-upload"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { API_BASE_URL, ENDPOINTS, MRS3_MODE_OPTIONS } from "@/lib/constants"
import { downloadByUrl } from "@/lib/download"

/**
 * 이미지 복원 페이지 (단일/일괄)
 * - 단일: .pkg 업로드 → 복원방식 선택 → 복원 이미지 반환
 * - 일괄: pkgs.zip 업로드 → 복원 zip 반환
 */
export default function RestorePage() {
  const router = useRouter()

  // 공통 상태
  const [activeTab, setActiveTab] = useState<string>("single")

  // 단일 복원 상태
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [mrs3Mode, setMrs3Mode] = useState<number>(-1)
  const [isProcessing, setIsProcessing] = useState(false)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // 일괄 복원 상태
  const [zipFile, setZipFile] = useState<File | null>(null)
  const [isBatchProcessing, setIsBatchProcessing] = useState(false)
  const [batchResultUrl, setBatchResultUrl] = useState<string | null>(null)
  const [batchError, setBatchError] = useState<string | null>(null)

  /** 파일 선택(.pkg) */
  const handleFileSelect = useCallback((file: File) => {
    if (file && file.name.endsWith('.pkg')) {
      setUploadedFile(file)
      setResultUrl(null)
      setError(null)
    } else {
      setError('pkg 파일만 업로드 가능합니다.')
    }
  }, [])

  /** 복원 방식 변경 */
  const handleMrs3ModeChange = useCallback((value: string) => {
    setMrs3Mode(parseInt(value))
  }, [])

  /** 복원 실행(단일) */
  const handleRestore = useCallback(async () => {
    if (!uploadedFile) return

    setIsProcessing(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("pkg", uploadedFile)
      formData.append("mrs3_mode", mrs3Mode.toString())

      const response = await fetch(`${API_BASE_URL}${ENDPOINTS.RESTORE}`, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || "복원 처리 중 오류가 발생했습니다.")
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      setResultUrl(url)
    } catch (error) {
      console.error("Error processing pkg file:", error)
      setError(error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.")
    } finally {
      setIsProcessing(false)
    }
  }, [uploadedFile, mrs3Mode])

  /** 복원 이미지 다운로드 */
  const handleDownload = useCallback(() => {
    if (!resultUrl) return
    downloadByUrl(resultUrl, "restored-image.png")
  }, [resultUrl])

  /** 홈으로 이동 */
  const handleGoHome = useCallback(() => {
    router.push("/")
  }, [router])

  // 일괄 복원 핸들러들
  const handleZipSelect = useCallback((file: File) => {
    if (file && file.name.toLowerCase().endsWith('.zip')) {
      setZipFile(file)
      setBatchResultUrl(null)
      setBatchError(null)
    } else {
      setBatchError('zip 파일만 업로드 가능합니다.')
    }
  }, [])

  const handleBatchRestore = useCallback(async () => {
    if (!zipFile) return

    setIsBatchProcessing(true)
    setBatchError(null)

    try {
      const formData = new FormData()
      formData.append("pkgs_zip", zipFile)
      formData.append("mrs3_mode", mrs3Mode.toString())

      const response = await fetch(`${API_BASE_URL}${ENDPOINTS.BATCH_RESTORE}`, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || "일괄 복원 처리 중 오류가 발생했습니다.")
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      setBatchResultUrl(url)
    } catch (error) {
      console.error("Error batch restore:", error)
      setBatchError(error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.")
    } finally {
      setIsBatchProcessing(false)
    }
  }, [zipFile, mrs3Mode])

  const handleBatchDownload = useCallback(() => {
    if (!batchResultUrl) return
    downloadByUrl(batchResultUrl, "restored_imgs.zip")
  }, [batchResultUrl])

  const canRestore = uploadedFile && !isProcessing

  const selectedModeDescription = MRS3_MODE_OPTIONS.find(
    (option) => parseInt(option.value) === mrs3Mode,
  )?.description || ""

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* 헤더: 타이틀 중앙 정렬, 뒤로가기 버튼 좌측 고정 */}
        <div className="relative mb-8 mt-16 ">
          <Button onClick={handleGoHome} variant="outline" size="sm" className="absolute left-0 top-1/2 -translate-y-1/2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            홈으로 돌아가기
          </Button>
        <h1 className="text-3xl font-bold text-gray-900 text-center">이미지 복원</h1>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="single" className="flex items-center gap-2">
              <PackageOpen className="h-4 w-4" /> 단일 복원
            </TabsTrigger>
            <TabsTrigger value="batch" className="flex items-center gap-2">
              <Images className="h-4 w-4" /> 일괄 복원
            </TabsTrigger>
          </TabsList>

          {/* 단일 복원 탭 */}
          <TabsContent value="single" className="mt-6 space-y-6">
            {/* 업로드 영역 */}
            <div className="flex items-center justify-center h-[40vh]">
              <div className="w-full max-w-2xl px-4">
                <FileUpload onFileSelect={handleFileSelect} accept=".pkg" maxSize={10 * 1024 * 1024} />

                {uploadedFile && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-sm text-green-700">선택된 파일: {uploadedFile.name}</p>
                  </div>
                )}

                {error && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}
              </div>
            </div>

            {/* 설정 영역: 업로드 전에도 항상 노출 */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-4">복원 설정</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">업스케일 방식</label>
                  <Select value={mrs3Mode.toString()} onValueChange={handleMrs3ModeChange}>
                    <SelectTrigger className="w-64">
                      <SelectValue placeholder="업스케일 방식 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {MRS3_MODE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">{selectedModeDescription}{mrs3Mode === -1 && " - 처리 시간이 오래 걸릴 수 있습니다."}</p>
                </div>

                <div className="flex justify-center">
                  <Button onClick={handleRestore} disabled={!canRestore} size="lg" className="px-8">
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        복원 중...
                      </>
                    ) : (
                      "이미지 복원"
                    )}
                  </Button>
                </div>

                {!uploadedFile && (
                  <p className="text-xs text-gray-500 text-center">.pkg 파일을 업로드해야 복원을 시작할 수 있습니다.</p>
                )}
              </div>
            </div>

            {/* 복원 결과 */}
            {resultUrl && (
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h2 className="text-xl font-semibold mb-4">복원 결과</h2>
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <img src={resultUrl} alt="복원된 이미지" className="max-w-full h-auto rounded border shadow-sm" style={{ maxHeight: "600px" }} />
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-4">{mrs3Mode === -1 ? 'EDSR AI 업스케일링' : `OpenCV 방식 (모드 ${mrs3Mode})`}으로 복원된 이미지입니다.</p>
                    <Button onClick={handleDownload}>
                      <Download className="h-4 w-4 mr-2" /> 복원 이미지 다운로드
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          {/* 일괄 복원 탭 */}
          <TabsContent value="batch" className="mt-6">
            <div className="space-y-6">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h2 className="text-xl font-semibold mb-4">pkgs.zip 업로드</h2>
                <FileUpload onFileSelect={handleZipSelect} accept=".zip" maxSize={100 * 1024 * 1024} />
                {zipFile && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-sm text-green-700">선택된 파일: {zipFile.name}</p>
                  </div>
                )}
                {batchError && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-700">{batchError}</p>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h2 className="text-xl font-semibold mb-4">복원 설정</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">업스케일 방식</label>
                    <Select value={mrs3Mode.toString()} onValueChange={handleMrs3ModeChange}>
                      <SelectTrigger className="w-64">
                        <SelectValue placeholder="업스케일 방식 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {MRS3_MODE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex justify-center">
                    <Button onClick={handleBatchRestore} disabled={isBatchProcessing || !zipFile} size="lg" className="px-8">
                      {isBatchProcessing ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          일괄 복원 중...
                        </>
                      ) : (
                        "일괄 복원"
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {batchResultUrl && (
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <h2 className="text-xl font-semibold mb-4">일괄 복원 결과</h2>
                  <div className="space-y-4">
                    <div className="text-center p-8 border-2 border-dashed border-gray-300 rounded-lg">
                      <div className="text-gray-600 mb-4">
                        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <p className="text-lg font-medium text-gray-900">일괄 복원 완료!</p>
                      <p className="text-sm text-gray-500">업로드한 pkgs.zip이 복원되어 restored_imgs.zip으로 제공됩니다.</p>
                    </div>
                    <div className="flex justify-center">
                      <Button onClick={handleBatchDownload}>
                        <Download className="h-4 w-4 mr-2" />
                        restored_imgs.zip 다운로드
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
