"use client"

import type React from "react"
import { useCallback, useState } from "react"
import { Upload, X } from "lucide-react"

/**
 * FileUpload 컴포넌트의 props 타입
 */
interface FileUploadProps {
  onFileSelect: (file: File) => void // 파일 선택 시 호출되는 콜백
  accept?: string // 허용할 파일 타입 (기본값: "image/*")
  maxSize?: number // 최대 파일 크기 (바이트 단위, 기본값: 10MB)
}

/**
 * 기본 설정값
 */
const DEFAULT_ACCEPT = "image/*"
const DEFAULT_MAX_SIZE = 10 * 1024 * 1024 // 10MB
const DEFAULT_MAX_SIZE_MB = 10

/**
 * 드래그 앤 드롭과 클릭 업로드를 지원하는 파일 업로드 컴포넌트
 * 
 * 기능:
 * - 드래그 앤 드롭으로 파일 업로드
 * - 클릭하여 파일 탐색기에서 파일 선택
 * - 파일 타입 및 크기 검증
 * - 업로드 상태에 따른 시각적 피드백
 * - 에러 메시지 표시
 */
export default function FileUpload({ 
  onFileSelect, 
  accept = DEFAULT_ACCEPT, 
  maxSize = DEFAULT_MAX_SIZE 
}: FileUploadProps) {
  // 상태 관리
  const [isDragOver, setIsDragOver] = useState(false) // 드래그 오버 상태
  const [error, setError] = useState<string | null>(null) // 에러 메시지

  /**
   * 드래그 오버 이벤트 핸들러
   * 파일이 드래그 영역 위에 있을 때 시각적 피드백 제공
   */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  /**
   * 드래그 리브 이벤트 핸들러
   * 파일이 드래그 영역을 벗어날 때 시각적 피드백 제거
   */
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  /**
   * 파일 유효성 검사 함수
   * 파일 타입과 크기를 검증
   */
  const validateFile = useCallback((file: File): string | null => {
    // 이미지 파일 타입 검사 (accept가 "image/*"인 경우)
    if (accept === "image/*" && !file.type.startsWith("image/")) {
      return "이미지 파일만 업로드할 수 있습니다."
    }

    // .pkg 파일 확장자 검사 (accept가 ".pkg"인 경우)
    if (accept === ".pkg" && !file.name.toLowerCase().endsWith(".pkg")) {
      return ".pkg 파일만 업로드할 수 있습니다."
    }

    // .zip 파일 확장자 검사 (accept가 ".zip"인 경우)
    if (accept === ".zip" && !file.name.toLowerCase().endsWith(".zip")) {
      return "pkgs.zip 파일만 업로드할 수 있습니다."
    }

    // 파일 크기 검사
    if (file.size > maxSize) {
      const maxSizeMB = Math.round(maxSize / (1024 * 1024))
      return `파일 크기가 너무 큽니다. ${maxSizeMB}MB 이하의 파일을 선택해주세요.`
    }

    return null // 유효한 파일
  }, [accept, maxSize])

  /**
   * 드롭 이벤트 핸들러
   * 드래그한 파일을 처리
   */
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
      setError(null)

      const files = Array.from(e.dataTransfer.files)
      const file = files[0] // 첫 번째 파일만 처리

      if (!file) return

      // 파일 유효성 검사
      const validationError = validateFile(file)
      if (validationError) {
        setError(validationError)
        return
      }

      onFileSelect(file)
    },
    [onFileSelect, validateFile],
  )

  /**
   * 파일 입력 이벤트 핸들러
   * 파일 탐색기에서 선택한 파일을 처리
   */
  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      setError(null)

      // 파일 유효성 검사
      const validationError = validateFile(file)
      if (validationError) {
        setError(validationError)
        return
      }

      onFileSelect(file)
    },
    [onFileSelect, validateFile],
  )

  // 파일 타입에 따른 UI 텍스트 설정
  const isImageUpload = accept === "image/*"
  const isPkgUpload = accept === ".pkg"
  const isZipUpload = accept === ".zip"
  
  const getUploadText = () => {
    if (isPkgUpload) {
      return {
        title: "PKG 파일을 여기에 드롭하거나 클릭하여 선택하세요",
        subtitle: `압축된 .pkg 파일만 지원 (최대 ${Math.round(maxSize / (1024 * 1024))}MB)`,
      }
    }
    if (isZipUpload) {
      return {
        title: "pkgs.zip 파일을 여기에 드롭하거나 클릭하여 선택하세요",
        subtitle: `복원용 pkgs.zip 파일만 지원 (최대 ${Math.round(maxSize / (1024 * 1024))}MB)`,
      }
    }
    return {
      title: "이미지를 여기에 드롭하거나 클릭하여 선택하세요",
      subtitle: `PNG, JPG, GIF 형식 지원 (최대 ${Math.round(maxSize / (1024 * 1024))}MB)`,
    }
  }

  const uploadText = getUploadText()

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* 드래그 앤 드롭 영역 */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-12 text-center transition-colors
    min-h-[20rem] flex flex-col items-center justify-center
          ${isDragOver 
            ? "border-blue-500 bg-blue-50" 
            : "border-gray-300 hover:border-gray-400"
          }
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* 숨겨진 파일 입력 요소 */}
        <input
          type="file"
          accept={accept}
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        {/* 업로드 아이콘 */}
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        
        {/* 업로드 안내 텍스트 */}
        <p className="text-lg font-medium text-gray-900 mb-2">
          {uploadText.title}
        </p>
        <p className="text-sm text-gray-500">
          {uploadText.subtitle}
        </p>
      </div>

      {/* 에러 메시지 표시 */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center">
            <X className="h-4 w-4 text-red-500 mr-2" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}
    </div>
  )
}
