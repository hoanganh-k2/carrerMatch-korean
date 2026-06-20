import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Empty state nhẹ nhàng (viền mảnh, py vừa phải, có chỗ cho CTA) —
 * thay các block `py-20` viền đứt nặng nề trước đây.
 */
function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "title"> & {
  icon?: React.ReactNode
  title: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <div
      data-slot="empty-state"
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card/40 px-6 py-12 text-center",
        className
      )}
      {...props}
    >
      {icon ? (
        <div className="mb-4 flex size-12 items-center justify-center rounded-full border border-border text-muted-foreground">
          {icon}
        </div>
      ) : null}
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      {description ? (
        <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  )
}

export { EmptyState }
