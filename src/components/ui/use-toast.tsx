"use client"

import { toast as sonnerToast } from "sonner"

type ToastVariant =
  | "default"
  | "destructive"
  | "warning"
  | "info"
  | "success"
  | "error"

type ToastAction = {
  label: string
  onClick: () => void
}

type ToastParams =
  | string
  | {
      title?: string
      description?: string
      variant?: ToastVariant
      duration?: number
      action?: ToastAction
    }

export function useToast() {
  const toast = (params: ToastParams) => {
    if (typeof params === "string") {
      return sonnerToast(params)
    }

    const { title, description, variant = "default", duration, action } = params

    const content =
      title || description ? (
        <div>
          {title && <div className="font-medium">{title}</div>}
          {description && <div className="text-sm opacity-90">{description}</div>}
        </div>
      ) : (
        ""
      )

    const common = {
      duration,
      action: action
        ? {
            label: action.label,
            onClick: action.onClick,
          }
        : undefined,
    }

    switch (variant) {
      case "success":
        return sonnerToast.success(content, common)
      case "warning":
        return sonnerToast.warning(content, common)
      case "destructive":
      case "error":
        return sonnerToast.error(content, common)
      case "info":
        return sonnerToast.info(content, common)
      default:
        return sonnerToast(content, common)
    }
  }

  return { toast }
}

