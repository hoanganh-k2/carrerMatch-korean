import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Thẻ thống kê dùng chung cho các dashboard (candidate/recruiter/admin) —
 * gộp các StatCard đang lặp lại, thống nhất padding & thứ bậc chữ.
 * Icon đơn sắc nét mảnh (không tô màu) để giao diện tinh giản, không "AI".
 * Số liệu dùng font mono cho cảm giác kỹ thuật.
 */
function StatCard({
  icon,
  value,
  label,
  sub,
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "title"> & {
  icon?: React.ReactNode
  value: React.ReactNode
  label: React.ReactNode
  sub?: React.ReactNode
}) {
  return (
    <div
      data-slot="stat-card"
      className={cn(
        "flex items-center gap-4 rounded-lg border border-border bg-card p-5",
        className
      )}
      {...props}
    >
      {icon ? (
        <div className="flex size-10 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground">
          {icon}
        </div>
      ) : null}
      <div className="min-w-0">
        <div className="font-mono text-xl font-bold leading-tight text-foreground">{value}</div>
        <div className="truncate text-xs text-muted-foreground">{label}</div>
        {sub ? <div className="mt-0.5 truncate text-xs text-muted-foreground/80">{sub}</div> : null}
      </div>
    </div>
  )
}

export { StatCard }
