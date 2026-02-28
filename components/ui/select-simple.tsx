import * as React from "react"
import { ChevronDown } from "lucide-react"

interface SimpleSelectProps {
  value?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
  placeholder?: string
}

const SimpleSelect: React.FC<SimpleSelectProps> = ({ value, onValueChange, children, placeholder }) => {
  const [isOpen, setIsOpen] = React.useState(false)
  
  return (
    <div className="relative">
      <button
        className="flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{value || placeholder}</span>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </button>
      
      {isOpen && (
        <div className="absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-white shadow-md mt-1">
          {children}
        </div>
      )}
    </div>
  )
}

interface SimpleSelectItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string
  children: React.ReactNode
}

const SimpleSelectItem: React.FC<SimpleSelectItemProps> = ({ value, children, onClick, ...props }) => {
  const parentSelect = React.useContext(React.createContext<{ onValueChange?: (value: string) => void }>({}))
  
  return (
    <button
      className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm hover:bg-gray-100"
      onClick={() => {
        parentSelect.onValueChange?.(value)
      }}
      {...props}
    >
      {children}
    </button>
  )
}

export { SimpleSelect, SimpleSelectItem }
