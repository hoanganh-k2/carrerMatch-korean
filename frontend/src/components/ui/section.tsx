import * as React from "react"

import { cn } from "@/lib/utils"

const spacingMap = {
  sm: "py-8",
  default: "py-12",
  lg: "py-16",
} as const

/**
 * Bọc một mảng nội dung với nhịp khoảng cách dọc chuẩn.
 * Thay cho py-10/14/16/20 tuỳ hứng trước đây.
 */
function Section({
  className,
  spacing = "default",
  ...props
}: React.ComponentProps<"section"> & { spacing?: keyof typeof spacingMap }) {
  return (
    <section
      data-slot="section"
      className={cn(spacingMap[spacing], className)}
      {...props}
    />
  )
}

export { Section }
