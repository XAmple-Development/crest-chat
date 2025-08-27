export default function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-discord-bg flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-discord-primary mx-auto mb-4"></div>
        <p className="text-discord-text text-lg font-medium">Loading CrestChat...</p>
      </div>
    </div>
  )
}
