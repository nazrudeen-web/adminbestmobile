export function LoadingSpinner({ size = "default", text = "Loading..." }) {
  const sizes = {
    sm: "h-4 w-4 border-2",
    default: "h-10 w-10 border-3",
    lg: "h-14 w-14 border-4"
  }

  return (
    <div className="flex flex-col items-center justify-center p-12 gap-4">
      <div
        className={`${sizes[size]} animate-spin rounded-full border-primary border-t-transparent`}
        style={{ borderStyle: 'solid' }}
      />
      {text && (
        <p className="text-sm text-muted-foreground animate-pulse">{text}</p>
      )}
    </div>
  )
}
