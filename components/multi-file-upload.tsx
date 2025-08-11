"use client"

import type React from "react"
import { useCallback, useMemo, useState } from "react"
import { Upload, X, Images } from "lucide-react"

interface MultiFileUploadProps {
  onFilesSelect: (files: File[]) => void
  accept?: string
  maxSize?: number // bytes
  maxFiles?: number
}

const DEFAULT_ACCEPT = "image/*"
const DEFAULT_MAX_SIZE = 10 * 1024 * 1024 // 10MB
const DEFAULT_MAX_FILES = 50

export default function MultiFileUpload({
  onFilesSelect,
  accept = DEFAULT_ACCEPT,
  maxSize = DEFAULT_MAX_SIZE,
  maxFiles = DEFAULT_MAX_FILES,
}: MultiFileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])

  const validateFiles = useCallback(
    (files: File[]): string | null => {
      if (!files.length) return "파일이 선택되지 않았습니다."
      if (files.length > maxFiles) return `최대 ${maxFiles}개까지 업로드할 수 있습니다.`
      for (const file of files) {
        if (accept === "image/*" && !file.type.startsWith("image/")) {
          return "이미지 파일만 업로드할 수 있습니다."
        }
        if (file.size > maxSize) {
          const mb = Math.round(maxSize / (1024 * 1024))
          return `파일 크기가 너무 큽니다. ${mb}MB 이하 파일만 가능합니다.`
        }
      }
      return null
    },
    [accept, maxFiles, maxSize],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
      setError(null)
      const files = Array.from(e.dataTransfer.files)
      const err = validateFiles(files)
      if (err) {
        setError(err)
        return
      }
      setSelectedFiles(files)
      onFilesSelect(files)
    },
    [onFilesSelect, validateFiles],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || [])
      setError(null)
      const err = validateFiles(files)
      if (err) {
        setError(err)
        return
      }
      setSelectedFiles(files)
      onFilesSelect(files)
    },
    [onFilesSelect, validateFiles],
  )

  const summaryText = useMemo(() => {
    if (!selectedFiles.length) return null
    const totalSize = selectedFiles.reduce((sum, f) => sum + f.size, 0)
    const mb = (totalSize / (1024 * 1024)).toFixed(1)
    return `${selectedFiles.length}개 선택됨 • 총 ${mb}MB`
  }, [selectedFiles])

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        className={`relative border-2 border-dashed rounded-lg p-12 text-center transition-colors min-h-[20rem] flex flex-col items-center justify-center ${
          isDragOver ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept={accept}
          multiple
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        <Images className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-lg font-medium text-gray-900 mb-2">
          여러 이미지를 여기에 드롭하거나 클릭하여 선택하세요
        </p>
        <p className="text-sm text-gray-500">
          PNG, JPG 등 이미지 최대 {Math.round(maxSize / (1024 * 1024))}MB • 최대 {maxFiles}개
        </p>

        {summaryText && (
          <div className="mt-4 text-sm text-gray-600">{summaryText}</div>
        )}
      </div>

      {selectedFiles.length > 0 && (
        <ul className="mt-4 space-y-1 text-sm text-gray-700 max-h-40 overflow-auto">
          {selectedFiles.map((f) => (
            <li key={f.name} className="truncate">• {f.name}</li>
          ))}
        </ul>
      )}

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