"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Download, Loader2, PackageOpen, Images } from "lucide-react"
import FileUpload from "@/components/file-upload"
import PolygonDrawer from "@/components/polygon-drawer"
import MultiFileUpload from "@/components/multi-file-upload"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { API_BASE_URL, ENDPOINTS, SCALER_OPTIONS } from "@/lib/constants"
import { downloadByUrl } from "@/lib/download"
import type { Polygons } from "@/types/geometry"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useRouteOverlay } from "../providers/route-overlay";


/**
 * 이미지 압축 페이지 (단일/일괄)
 * - 단일: 업로드 → 폴리곤 선택 → 배율/옵션 선택 → .pkg 반환
 * - 일괄: 여러 이미지 업로드 → 배율 선택 → pkgs.zip 반환
 */
export default function DownscalePage() {
  const router = useRouter()

  // 공통 상태
  const [activeTab, setActiveTab] = useState<string>("single")

  // 단일 압축 상태
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [polygons, setPolygons] = useState<Polygons>([])
  const [scaler, setScaler] = useState<number>(2)
  const [useImgpresso, setUseImgpresso] = useState<boolean>(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // 일괄 압축 상태
  const [batchFiles, setBatchFiles] = useState<File[]>([])
  const [isBatchProcessing, setIsBatchProcessing] = useState(false)
  const [batchResultUrl, setBatchResultUrl] = useState<string | null>(null)
  const [batchError, setBatchError] = useState<string | null>(null)

  const handleFileSelect = useCallback((file: File) => {
    setUploadedFile(file)
    const url = URL.createObjectURL(file)
    setImageUrl(url)
    setPolygons([])
    setResultUrl(null)
    setError(null)
  }, [])

  const handlePolygonsComplete = useCallback((newPolygons: Polygons) => {
    setPolygons(newPolygons)
  }, [])

  const handleScalerChange = useCallback((value: string) => {
    setScaler(parseInt(value))
  }, [])

  const handleDownscale = useCallback(async () => {
    if (!uploadedFile || polygons.length === 0) return

    setIsProcessing(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("image", uploadedFile)
      formData.append(
        "polygons",
        JSON.stringify(polygons.map(poly => poly.map(pt => [Math.round(pt.x), Math.round(pt.y)])))
      )
      formData.append("scaler", scaler.toString())
      formData.append("use_imgpresso", useImgpresso ? "true" : "false")

      const response = await fetch(`${API_BASE_URL}${ENDPOINTS.COMPRESS}`, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || "압축 처리 중 오류가 발생했습니다.")
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      setResultUrl(url)
    } catch (error) {
      console.error("Error processing image:", error)
      setError(error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.")
    } finally {
      setIsProcessing(false)
    }
  }, [uploadedFile, polygons, scaler, useImgpresso])

  const handleDownload = useCallback(() => {
    if (!resultUrl) return
    downloadByUrl(resultUrl, "compressed-output.pkg")
  }, [resultUrl])

  const { setIsNavigating } = useRouteOverlay();

const handleGoHome = useCallback(() => {
  setIsNavigating(true);   // 오버레이 켜기
  router.push("/");        // 이동 시작
}, [router, setIsNavigating]);


  const canCompress = uploadedFile && polygons.length > 0 && !isProcessing

  const handleBatchFiles = useCallback((files: File[]) => {
    setBatchFiles(files)
    setBatchResultUrl(null)
    setBatchError(null)
  }, [])

  const handleBatchCompress = useCallback(async () => {
    if (batchFiles.length === 0) return

    setIsBatchProcessing(true)
    setBatchError(null)

    try {
      const formData = new FormData()
      batchFiles.forEach((f) => formData.append("images", f))
      formData.append("scaler", scaler.toString())
      formData.append("manual", "false") // 항상 false
      // imgpresso는 일괄 압축에서 미지원 (전송하지 않음)

      const response = await fetch(`${API_BASE_URL}${ENDPOINTS.AUTO_BATCH_COMPRESS}`, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || "일괄 압축 처리 중 오류가 발생했습니다.")
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      setBatchResultUrl(url)
    } catch (error) {
      console.error("Error batch compress:", error)
      setBatchError(error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.")
    } finally {
      setIsBatchProcessing(false)
    }
  }, [batchFiles, scaler])

  const handleBatchDownload = useCallback(() => {
    if (!batchResultUrl) return
    downloadByUrl(batchResultUrl, "pkgs.zip")
  }, [batchResultUrl])

  return (
    <div className="h-screen bg-gray-50 py-8 overflow-y-auto no-scrollbar">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* 헤더: 타이틀 중앙 정렬, 뒤로가기 버튼 좌측 고정 */}
        <div className="relative mb-8 mt-16">
          <Button onClick={handleGoHome} variant="outline" size="sm" className="absolute left-0 top-1/2 -translate-y-1/2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            홈으로 돌아가기
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 text-center">이미지 압축</h1>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="single" className="flex items-center gap-2">
              <PackageOpen className="h-4 w-4" /> 단일 압축
            </TabsTrigger>
            <TabsTrigger value="batch" className="flex items-center gap-2">
              <Images className="h-4 w-4" /> 일괄 압축
            </TabsTrigger>
          </TabsList>

          {/* 단일 압축 탭 */}
          <TabsContent value="single" className="mt-6">
            <div className="space-y-6">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-4">이미지 업로드</h2>
            {!imageUrl ? (
              
                <FileUpload onFileSelect={handleFileSelect} />
              
            ) : (
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h2 className="text-xl font-semibold mb-4">다각형 영역 선택</h2>
                <PolygonDrawer imageUrl={imageUrl} onPolygonComplete={handlePolygonsComplete} />
              </div>
            )}
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-4">압축 설정</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">다운스케일 배율</label>
                  <Select value={scaler.toString()} onValueChange={handleScalerChange}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="배율 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {SCALER_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* imgpresso 옵션 - 단일 압축만 */}
                <div className="flex items-center gap-3">
                  <Switch id="use-imgpresso" checked={useImgpresso} onCheckedChange={setUseImgpresso} />
                  <Label htmlFor="use-imgpresso" className="text-sm">고압축 (imgpresso 사용)</Label>
                </div>
                <p className="text-xs text-gray-500">imgpresso 사용 시 용량이 더 줄어들 수 있으나 처리 시간이 길어질 수 있습니다.</p>

                <div className="flex justify-center">
                  <Button onClick={handleDownscale} disabled={!canCompress} size="lg" className="px-8">
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

                {(!uploadedFile || polygons.length === 0)&& (
                  <p className="text-xs text-gray-500 text-center">이미지를 업로드하고 영역을 선택해야 압축을 시작할 수 있습니다.</p>
                )}
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {resultUrl && (
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h2 className="text-xl font-semibold mb-4">압축 결과</h2>
                <div className="space-y-4">
                  <div className="text-center p-8 border-2 border-dashed border-gray-300 rounded-lg">
                    <div className="text-gray-600 mb-4">
                      <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <p className="text-lg font-medium text-gray-900">압축 완료!</p>
                    <p className="text-sm text-gray-500">사진이 성공적으로 {scaler}배 다운스케일로 압축되었습니다!(다각형 개수: {polygons.length})</p>
                  </div>

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
          </TabsContent>

          {/* 일괄 압축 탭 */}
          <TabsContent value="batch" className="mt-6">
            <div className="space-y-6">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h2 className="text-xl font-semibold mb-4">이미지 다중 업로드</h2>
                <MultiFileUpload onFilesSelect={handleBatchFiles} accept="image/*" />
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h2 className="text-xl font-semibold mb-4">압축 설정</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">다운스케일 배율</label>
                    <Select value={scaler.toString()} onValueChange={handleScalerChange}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="배율 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {SCALER_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex justify-center">
                    <Button onClick={handleBatchCompress} disabled={isBatchProcessing || batchFiles.length === 0} size="lg" className="px-8">
                      {isBatchProcessing ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          일괄 압축 중...
                        </>
                      ) : (
                        "일괄 압축"
                      )}
                    </Button>
                  </div>
                  {batchFiles.length === 0 && (
                  <p className="text-xs text-gray-500 text-center">이미지를 업로드해야 압축을 시작할 수 있습니다.</p>
                )}
                </div>
              </div>

              {batchError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-700 text-sm">{batchError}</p>
                </div>
              )}

              {batchResultUrl && (
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <h2 className="text-xl font-semibold mb-4">일괄 압축 결과</h2>
                  <div className="space-y-4">
                    <div className="text-center p-8 border-2 border-dashed border-gray-300 rounded-lg">
                      <div className="text-gray-600 mb-4">
                        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <p className="text-lg font-medium text-gray-900">일괄 압축 완료!</p>
                      <p className="text-sm text-gray-500">선택한 이미지들이 {scaler}배 다운스케일로 압축되어 pkgs.zip으로 생성되었습니다.</p>
                    </div>

                    <div className="flex justify-center">
                      <Button onClick={handleBatchDownload}>
                        <Download className="h-4 w-4 mr-2" />
                        pkgs.zip 다운로드
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