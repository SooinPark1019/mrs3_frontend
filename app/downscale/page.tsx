"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Download, Loader2 } from "lucide-react"
import FileUpload from "@/components/file-upload"
import PolygonDrawer from "@/components/polygon-drawer"

/**
 * 점의 좌표를 나타내는 인터페이스
 */
interface Point {
  x: number
  y: number
}

/**
 * API 호출 시 사용할 상수들
 */
const API_BASE_URL = "https://5c68fe981b47.ngrok-free.app"
const COMPRESS_ENDPOINT = "/compress"

/**
 * 다운스케일 배율 옵션
 */
const SCALER_OPTIONS = [
  { value: "2", label: "2배" },
  { value: "3", label: "3배" },
  { value: "4", label: "4배" }
]

/**
 * 이미지 압축 페이지 컴포넌트
 * 
 * 기능:
 * - 이미지 파일 업로드
 * - 다각형 영역 선택 (여러 개 가능)
 * - 다운스케일 배율 설정
 * - 백엔드 API 호출로 이미지 압축
 * - .pkg 파일 다운로드
 */
export default function DownscalePage() {
  const router = useRouter()

  // 상태 관리
  const [uploadedFile, setUploadedFile] = useState<File | null>(null) // 업로드된 이미지 파일
  const [imageUrl, setImageUrl] = useState<string | null>(null) // 이미지 미리보기 URL
  const [polygons, setPolygons] = useState<Point[][]>([]) // 선택된 다각형들
  const [scaler, setScaler] = useState<number>(2) // 다운스케일 배율
  const [isProcessing, setIsProcessing] = useState(false) // 처리 중 상태
  const [resultUrl, setResultUrl] = useState<string | null>(null) // 결과 파일 URL
  const [error, setError] = useState<string | null>(null) // 에러 메시지

  /**
   * 파일 선택 핸들러
   * 새 파일을 선택하면 이전 상태들을 초기화
   */
  const handleFileSelect = useCallback((file: File) => {
    setUploadedFile(file)
    const url = URL.createObjectURL(file)
    setImageUrl(url)
    setPolygons([])
    setResultUrl(null)
    setError(null)
  }, [])

  /**
   * 다각형 완성 핸들러
   * PolygonDrawer에서 다각형이 완성되면 호출됨
   */
  const handlePolygonsComplete = useCallback((newPolygons: Point[][]) => {
    setPolygons(newPolygons)
  }, [])

  /**
   * 스케일러 변경 핸들러
   */
  const handleScalerChange = useCallback((value: string) => {
    setScaler(parseInt(value))
  }, [])

  /**
   * 이미지 압축 처리 함수
   * 백엔드 API에 이미지와 다각형 정보를 전송하여 압축 수행
   */
  const handleDownscale = useCallback(async () => {
    if (!uploadedFile || polygons.length === 0) return

    setIsProcessing(true)
    setError(null)

    try {
      // FormData 생성
      const formData = new FormData()
      formData.append("image", uploadedFile)
      
      // 다각형 좌표를 정수로 반올림하여 JSON 문자열로 변환
      formData.append(
        "polygons",
        JSON.stringify(
          polygons.map(poly => poly.map(pt => [Math.round(pt.x), Math.round(pt.y)]))
        )
      )
      formData.append("scaler", scaler.toString())

      // 백엔드 API 호출
      const response = await fetch(`${API_BASE_URL}${COMPRESS_ENDPOINT}`, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || "압축 처리 중 오류가 발생했습니다.")
      }

      // .pkg 파일을 blob으로 받아서 다운로드 URL 생성
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      setResultUrl(url)
    } catch (error) {
      console.error("Error processing image:", error)
      setError(error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.")
    } finally {
      setIsProcessing(false)
    }
  }, [uploadedFile, polygons, scaler])

  /**
   * 결과 파일 다운로드 핸들러
   */
  const handleDownload = useCallback(() => {
    if (!resultUrl) return

    const link = document.createElement("a")
    link.href = resultUrl
    link.download = "compressed-output.pkg"
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

  // 압축 버튼 활성화 조건
  const canCompress = uploadedFile && polygons.length > 0 && !isProcessing

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* 헤더 */}
        <div className="flex items-center gap-16 mb-8 mt-16">
          <Button onClick={handleGoHome} variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            홈으로 돌아가기
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">이미지 압축</h1>
        </div>

        {/* 메인 콘텐츠 */}
        {!imageUrl ? (
          /* 파일 업로드 영역 */
          <div className="flex items-center justify-center h-[60vh]">
          <FileUpload onFileSelect={handleFileSelect} />
          </div>
        ) : (
          <div className="space-y-6">
            {/* 다각형 선택 영역 */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-4">다각형 영역 선택</h2>
              <PolygonDrawer imageUrl={imageUrl} onPolygonComplete={handlePolygonsComplete} />
            </div>

            {/* 압축 설정 영역 */}
            {polygons.length > 0 && (
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h2 className="text-xl font-semibold mb-4">압축 설정</h2>
                <div className="space-y-4">
                  {/* 다운스케일 배율 선택 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      다운스케일 배율
                    </label>
                    <Select value={scaler.toString()} onValueChange={handleScalerChange}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="배율 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {SCALER_OPTIONS.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* 압축 실행 버튼 */}
                  <div className="flex justify-center">
                    <Button 
                      onClick={handleDownscale} 
                      disabled={!canCompress} 
                      size="lg" 
                      className="px-8"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          압축 중...
                        </>
                      ) : (
                        "이미지 압축"
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* 에러 메시지 */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {/* 압축 결과 */}
            {resultUrl && (
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h2 className="text-xl font-semibold mb-4">압축 결과</h2>
                <div className="space-y-4">
                  {/* 성공 메시지 */}
                  <div className="text-center p-8 border-2 border-dashed border-gray-300 rounded-lg">
                    <div className="text-gray-600 mb-4">
                      <svg 
                        className="mx-auto h-12 w-12 text-gray-400" 
                        stroke="currentColor" 
                        fill="none" 
                        viewBox="0 0 48 48"
                        aria-hidden="true"
                      >
                        <path 
                          d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" 
                          strokeWidth={2} 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                        />
                      </svg>
                    </div>
                    <p className="text-lg font-medium text-gray-900">압축 완료!</p>
                    <p className="text-sm text-gray-500">
                      사진이 성공적으로 {scaler}배 다운스케일로 압축되었습니다!(다각형 개수: {polygons.length})
                    </p>
                  </div>
                  
                  {/* 다운로드 버튼 */}
                  <div className="flex justify-center">
                    <Button onClick={handleDownload}>
                      <Download className="h-4 w-4 mr-2" />
                      압축 파일 다운로드 (.pkg)
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
} 