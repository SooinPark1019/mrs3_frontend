"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Download, Loader2, Upload } from "lucide-react"
import FileUpload from "@/components/file-upload"

/**
 * API 호출 시 사용할 상수들
 */
const API_BASE_URL = "https://5c68fe981b47.ngrok-free.app"
const RESTORE_ENDPOINT = "/restore"

/**
 * 업스케일 방식 옵션들
 */
const MRS3_MODE_OPTIONS = [
  { value: "-1", label: "EDSR (고품질 AI 업스케일)", description: "AI 기반 고품질 업스케일링" },
  { value: "0", label: "OpenCV", description: "빠른 처리 속도" }
]

/**
 * 이미지 복원 페이지 컴포넌트
 * 
 * 기능:
 * - .pkg 파일 업로드
 * - 업스케일 방식 선택 (EDSR 또는 OpenCV)
 * - 백엔드 API 호출로 이미지 복원
 * - 복원된 이미지 다운로드
 */
export default function RestorePage() {
  const router = useRouter()

  // 상태 관리
  const [uploadedFile, setUploadedFile] = useState<File | null>(null) // 업로드된 .pkg 파일
  const [mrs3Mode, setMrs3Mode] = useState<number>(-1) // 업스케일 방식
  const [isProcessing, setIsProcessing] = useState(false) // 처리 중 상태
  const [resultUrl, setResultUrl] = useState<string | null>(null) // 결과 이미지 URL
  const [error, setError] = useState<string | null>(null) // 에러 메시지

  /**
   * 파일 선택 핸들러
   * .pkg 파일인지 확인하고 상태 업데이트
   */
  const handleFileSelect = useCallback((file: File) => {
    if (file && file.name.endsWith('.pkg')) {
      setUploadedFile(file)
      setResultUrl(null)
      setError(null)
    } else {
      setError('pkg 파일만 업로드 가능합니다.')
    }
  }, [])

  /**
   * 업스케일 방식 변경 핸들러
   */
  const handleMrs3ModeChange = useCallback((value: string) => {
    setMrs3Mode(parseInt(value))
  }, [])

  /**
   * 이미지 복원 처리 함수
   * 백엔드 API에 .pkg 파일과 복원 방식을 전송하여 복원 수행
   */
  const handleRestore = useCallback(async () => {
    if (!uploadedFile) return

    setIsProcessing(true)
    setError(null)

    try {
      // FormData 생성
      const formData = new FormData()
      formData.append("pkg", uploadedFile)
      formData.append("mrs3_mode", mrs3Mode.toString())

      // 백엔드 API 호출
      const response = await fetch(`${API_BASE_URL}${RESTORE_ENDPOINT}`, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || "복원 처리 중 오류가 발생했습니다.")
      }

      // 복원된 이미지를 blob으로 받아서 미리보기 URL 생성
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

  /**
   * 결과 이미지 다운로드 핸들러
   */
  const handleDownload = useCallback(() => {
    if (!resultUrl) return

    const link = document.createElement("a")
    link.href = resultUrl
    link.download = "restored-image.png"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [resultUrl])

  /**
   * 홈으로 돌아가기 핸들러
   */
  const handleGoHome = useCallback(() => {
    router.push("/")
  }, [router])

  // 복원 버튼 활성화 조건
  const canRestore = uploadedFile && !isProcessing

  // 선택된 복원 방식에 대한 설명 텍스트
  const selectedModeDescription = MRS3_MODE_OPTIONS.find(
    option => parseInt(option.value) === mrs3Mode
  )?.description || ""

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* 헤더 */}
        <div className="flex items-center gap-16 mb-8 mt-16 ">
          <Button onClick={handleGoHome} variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            홈으로 돌아가기
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">이미지 복원</h1>
        </div>

        <div className="space-y-6">
          {/* PKG 파일 업로드 섹션 */}
          
        <div className="flex items-center justify-center h-[60vh]">
          <div className="w-full max-w-2xl px-4">
            <FileUpload
              onFileSelect={handleFileSelect}
              accept=".pkg"
              maxSize={10 * 1024 * 1024}
            />

            {/* 업로드된 파일 정보 표시 */}
            {uploadedFile && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-700">
                  선택된 파일: {uploadedFile.name}
                </p>
              </div>
            )}

            {/* 에러 메시지 표시 */}
            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
          </div>
        </div>


          {/* 복원 설정 섹션 */}
          {uploadedFile && (
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-4">복원 설정</h2>
              <div className="space-y-4">
                {/* 업스케일 방식 선택 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    업스케일 방식
                  </label>
                  <Select value={mrs3Mode.toString()} onValueChange={handleMrs3ModeChange}>
                    <SelectTrigger className="w-64">
                      <SelectValue placeholder="업스케일 방식 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {MRS3_MODE_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {/* 선택된 방식에 대한 설명 */}
                  <p className="text-xs text-gray-500 mt-1">
                    {selectedModeDescription}
                    {mrs3Mode === -1 && " - 처리 시간이 오래 걸릴 수 있습니다."}
                  </p>
                </div>
                
                {/* 복원 실행 버튼 */}
                <div className="flex justify-center">
                  <Button 
                    onClick={handleRestore} 
                    disabled={!canRestore} 
                    size="lg" 
                    className="px-8"
                  >
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
              </div>
            </div>
          )}

          {/* 복원 결과 섹션 */}
          {resultUrl && (
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-4">복원 결과</h2>
              <div className="space-y-4">
                {/* 복원된 이미지 표시 */}
                <div className="flex justify-center">
                  <img
                    src={resultUrl}
                    alt="복원된 이미지"
                    className="max-w-full h-auto rounded border shadow-sm"
                    style={{ maxHeight: "600px" }}
                  />
                </div>
                
                {/* 복원 정보 및 다운로드 버튼 */}
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-4">
                    {mrs3Mode === -1 ? 'EDSR AI 업스케일링' : `OpenCV 방식 (모드 ${mrs3Mode})`}으로 복원된 이미지입니다.
                  </p>
                  <Button onClick={handleDownload}>
                    <Download className="h-4 w-4 mr-2" />
                    복원 이미지 다운로드
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
