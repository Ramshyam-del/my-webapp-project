import { Button } from "./ui/button"
import { cn } from "./ui/utils"

export function EmptyState({ 
  icon: Icon, 
  title, 
  message, 
  action, 
  className,
  ...props 
}) {
  return (
    <div
      className={cn(
        "flex min-h-[400px] flex-col items-center justify-center rounded-md border border-dashed p-8 text-center animate-in fade-in-50",
        className
      )}
      {...props}
    >
      {Icon && (
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Icon className="h-6 w-6 text-muted-foreground" />
        </div>
      )}
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-sm">
        {message}
      </p>
      {action && (
        <div className="mt-6">
          {typeof action === "string" ? (
            <Button>{action}</Button>
          ) : (
            action
          )}
        </div>
      )}
    </div>
  )
}
