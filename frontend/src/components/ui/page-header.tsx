import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Header trang chuẩn: eyebrow (tiếng Việt) + tiêu đề + mô tả, kèm slot action
 * bên phải. Dùng lại khắp các trang để thống nhất thứ bậc chữ.
 *
 *   <PageHeader eyebrow="Việc làm" title="Tìm việc IT tiếng Hàn" />
 */
function PageHeader({
  eyebrow,
  title,
  description,
  icon,
  action,
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "title"> & {
  eyebrow?: React.ReactNode
  title: React.ReactNode
  description?: React.ReactNode
  icon?: React.ReactNode
  action?: React.ReactNode
}) {
  const label = eyebrow ? <p className="eyebrow">{eyebrow}</p> : null

  return (
    <div
      data-slot="page-header"
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        className
      )}
      {...props}
    >
      <div className="space-y-2">
        {label}
        <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          {icon ? <span className="text-primary">{icon}</span> : null}
          {title}
        </h1>
        {description ? (
          <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}

export { PageHeader }
