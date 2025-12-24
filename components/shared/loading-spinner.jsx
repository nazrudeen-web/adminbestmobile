export function LoadingSpinner({ size = "default" }) {
  const sizes = {
    sm: "h-4 w-4",
    default: "h-8 w-8",
    lg: "h-12 w-12"
  }

  return (
    <div className="flex items-center justify-center p-8">
      <div
        className={`${sizes[size]} animate-spin rounded-full border-4 border-primary border-t-transparent`}
      />
    </div>
  )
}
