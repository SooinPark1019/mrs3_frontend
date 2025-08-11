/**
 * 브라우저에서 Blob/URL을 다운로드 링크로 저장하는 유틸리티
 */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  try {
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } finally {
    // 메모리 누수 방지
    setTimeout(() => URL.revokeObjectURL(url), 0)
  }
}

export function downloadByUrl(url: string, filename: string) {
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}