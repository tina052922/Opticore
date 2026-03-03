import * as React from "react"
import { ChevronDown } from "lucide-react"

interface SelectProps {
  value?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
}

interface SelectTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
}

interface SelectValueProps {
  placeholder?: string
}

interface SelectContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

interface SelectItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string
  children: React.ReactNode
}

const SelectContext = React.createContext<{
  value?: string
  onValueChange?: (value: string) => void
}>({})

const Select: React.FC<SelectProps> = ({ value, onValueChange, children }) => {
  return (
    <SelectContext.Provider value={{ value, onValueChange }}>
      {children}
    </SelectContext.Provider>
  )
}

const SelectTrigger = React.forwardRef<HTMLButtonElement, SelectTriggerProps>(
  ({ className, children, ...props }, ref) => {
    const context = React.useContext(SelectContext)
    
    return (
      <button
        ref={ref}
        className={`flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ${className || ''}`}
        onClick={() => {
          // Toggle dropdown logic would go here
        }}
        {...props}
      >
        {children}
        <ChevronDown className="h-4 w-4 opacity-50" />
      </button>
    )
  }
)
SelectTrigger.displayName = "SelectTrigger"

const SelectValue: React.FC<SelectValueProps> = ({ placeholder }) => {
  const context = React.useContext(SelectContext)
  return <span>{context.value || placeholder}</span>
}

const SelectContent: React.FC<SelectContentProps> = ({ children, className, ...props }) => {
  // Simplified dropdown content
  return (
    <div
      className={`absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-white shadow-md ${className || ""}`}
      {...props}
    >
      {children}
    </div>
  )
}

const SelectItem = React.forwardRef<HTMLButtonElement, SelectItemProps>(
  ({ className, children, value, ...props }, ref) => {
    const context = React.useContext(SelectContext)
    
    return (
      <button
        ref={ref}
        className={`relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm ${className || ''}`}
        onClick={() => context.onValueChange?.(value)}
        {...props}
      >
        {children}
      </button>
    )
  }
)
SelectItem.displayName = "SelectItem"

export { 
  Select, 
  SelectTrigger, 
  SelectValue, 
  SelectContent, 
  SelectItem 
}
