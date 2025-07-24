"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import NextImage from "next/image"
import { Camera, RotateCcw } from "lucide-react"


/**
 * 배경 이미지 블러 설정값
 */
const BLUR_LEVELS = {
  DEFAULT: 4,
  DOWNSCALE_HOVER: 12,
  RESTORE_HOVER: 0
} as const

/**
 * MRS3 시스템의 메인 랜딩 페이지
 * 
 * 기능:
 * - 배경 이미지와 함께 브랜드 소개
 * - 이미지 압축 및 복원 기능으로 이동하는 네비게이션
 * - 호버 시 배경 블러 효과 변경
 * - 반응형 레이아웃
 */
export default function LandingPage() {
  const hasLoadedOnce = useRef(false)
  const router = useRouter()

  // 상태 관리
  const [blurLevel, setBlurLevel] = useState<number>(BLUR_LEVELS.DEFAULT) // 배경 블러 레벨
  const [backgroundLoaded, setBackgroundLoaded] = useState(false) // 배경 이미지 로딩 상태

  /**
   * 배경 이미지 사전 로딩
   * 페이지 로드 시 배경 이미지를 미리 로드하여 부드러운 전환 효과 제공
   */
  useEffect(() => {
     if (hasLoadedOnce.current || sessionStorage.getItem("bgLoaded") === "true") {
    setBackgroundLoaded(true)
    return
  }

  const img = new window.Image()
  img.onload = () => {
    setBackgroundLoaded(true)
    hasLoadedOnce.current = true
    sessionStorage.setItem("bgLoaded", "true") // 한 번 로드되었음을 기록
  }
  img.src = "/nature-background.jpg"
}, [])


  /**
   * 이미지 압축 페이지로 이동
   */
  const handleDownscale = useCallback(() => {
    router.push("/downscale")
  }, [router])

  /**
   * 이미지 복원 페이지로 이동
   */
  const handleRestore = useCallback(() => {
    router.push("/restore")
  }, [router])

  /**
   * 압축 버튼 호버 시 배경 블러 증가 (압축 효과 시각화)
   */
  const handleDownscaleHover = useCallback(() => {
    setBlurLevel(BLUR_LEVELS.DOWNSCALE_HOVER)
  }, [])

  /**
   * 복원 버튼 호버 시 배경 블러 제거 (선명도 복원 효과 시각화)
   */
  const handleRestoreHover = useCallback(() => {
    setBlurLevel(BLUR_LEVELS.RESTORE_HOVER)
  }, [])

  /**
   * 마우스가 버튼에서 벗어날 때 기본 블러 레벨로 복원
   */
  const handleMouseLeave = useCallback(() => {
    setBlurLevel(BLUR_LEVELS.DEFAULT)
  }, [])

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* 동적 배경 이미지 (블러 효과 포함) */}
      <div
        className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-500 ease-in-out ${
          backgroundLoaded ? "opacity-100" : "opacity-0"
        }`}
        style={{
          backgroundImage: "url(/nature-background.jpg)",
          filter: `blur(${blurLevel}px)`,
        }}
      />

      {/* 로딩 중 폴백 배경 (그라데이션) */}
      {!backgroundLoaded && (
        <div className={`
    absolute inset-0 bg-gradient-to-br from-blue-400 to-black-400
    transition-opacity duration-500 ease-in-out z-0
    ${backgroundLoaded ? "opacity-0" : "opacity-100"}
  `} />
      )}

      {/* 어두운 오버레이 (텍스트 가독성 향상) */}
      <div className="absolute inset-0 bg-black/40" />

      {/* 메인 콘텐츠 영역 */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
        {/* 브랜드 및 제품 소개 */}
        <div className="text-center mb-24">
          <h1 className="text-8xl font-bold mb-6 [text-shadow:0_0_8px_rgba(0,0,0,0.5)]">
  MRS3</h1>
          <p className="text-2xl font-medium mb-2 [text-shadow:0_0_8px_rgba(0,0,0,0.8)]">
            다각형 영역 기반 이미지 압축 시스템
          </p>
          <p className="text-lg opacity-90 [text-shadow:0_0_8px_rgba(0,0,0,0.8)]">
            Multi-Region Selective Super-resolution System
          </p>
        </div>

        {/* 기능 카드 및 버튼 영역 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16 mt-20">
          {/* 이미지 복원 기능 카드 */}
          <div 
            onClick={handleRestore}
            onMouseEnter={handleRestoreHover}
            onMouseLeave={handleMouseLeave}
            className="cursor-pointer bg-white/10 hover:bg-white/20 transition duration-200 transform hover:scale-105 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <RotateCcw className="h-8 w-8 mb-4 text-green-300" />
            <h3 className="text-xl font-semibold mb-2">이미지 복원</h3>
            <p className="text-sm opacity-90">
              AI 기반 EDSR 또는 OpenCV로 고품질 이미지 복원을 제공합니다.
            </p>
          </div>

          {/* 이미지 압축 기능 카드 */}
          <div
            onClick={handleDownscale}
            onMouseEnter={handleDownscaleHover}
            onMouseLeave={handleMouseLeave} 
            className="cursor-pointer bg-white/10 hover:bg-white/20 transition duration-200 transform hover:scale-105 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <Camera className="h-8 w-8 mb-4 text-blue-300" />
            <h3 className="text-xl font-semibold mb-2">이미지 압축</h3>
            <p className="text-sm opacity-90">
              다각형 영역을 선택하여 스마트한 이미지 압축을 수행합니다.
            </p>
          </div>
          
        </div>
      </div>

      
    </div>
  )
}
