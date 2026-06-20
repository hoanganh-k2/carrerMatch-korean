import * as React from "react"

import { cn } from "@/lib/utils"

const sizeMap = {
  /** Trang nội dung tiêu chuẩn */
  content: "max-w-6xl",
  /** Form / auth — hẹp, dễ đọc */
  form: "max-w-2xl",
  /** Bảng dữ liệu dày / dashboard rộng */
  wide: "max-w-7xl",
  /** Văn bản dài 1 cột */
  prose: "max-w-3xl",
} as const

/**
 * Container chuẩn hoá bề rộng + padding ngang cho mọi trang.
 * Thay cho các `max-w-*` rải rác, không nhất quán trước đây.
 */
function Container({
  className,
  size = "content",
  ...props
}: React.ComponentProps<"div"> & { size?: keyof typeof sizeMap }) {
  return (
    <div
      data-slot="container"
      className={cn("mx-auto w-full px-4 sm:px-6", sizeMap[size], className)}
      {...props}
    />
  )
}

export { Container }
