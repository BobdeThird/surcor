import * as React from "react"
import { CheckIcon, FileIcon, FolderIcon, CodeIcon, LinkIcon, X, FileTextIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { googleDriveClient, type GoogleDriveFile } from "@/lib/google-drive-client"

interface ContextItem {
  value: string
  label: string
  icon?: any
  type: string
  mimeType?: string
  iconLink?: string
  webViewLink?: string
  modifiedTime?: string
}

// Static context items
const staticContextItems: ContextItem[] = [
  {
    value: "tab-1",
    label: "Tab 1",
    icon: FileIcon,
    type: "static",
  },
  {
    value: "tab-2",
    label: "Tab 2",
    icon: FolderIcon,
    type: "static",
  },
  {
    value: "tab-3",
    label: "Tab 3",
    icon: CodeIcon,
    type: "static",
  },
  {
    value: "url",
    label: "Add URL",
    icon: LinkIcon,
    type: "static",
  },
]

interface ContextSelectorProps {
  value: string[]
  onValueChange: (value: string[]) => void
  onAccessTokenChange?: (token: string | null) => void
}

export function ContextSelector({ value = [], onValueChange, onAccessTokenChange }: ContextSelectorProps) {
  const [open, setOpen] = React.useState(false)
  const [googleDriveFiles, setGoogleDriveFiles] = React.useState<GoogleDriveFile[]>([])
  const [isLoadingFiles, setIsLoadingFiles] = React.useState(false)
  const [isAuthenticated, setIsAuthenticated] = React.useState(false)
  const [accessToken, setAccessToken] = React.useState<string | null>(null)
  const [searchQuery, setSearchQuery] = React.useState("")
  const searchTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)
  const scrollContainerRef = React.useRef<HTMLDivElement>(null)

  // Handle mouse wheel for horizontal scrolling
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (scrollContainerRef.current) {
      e.preventDefault()
      scrollContainerRef.current.scrollLeft += e.deltaY
    }
  }

  // Initialize Google API and check authentication on mount
  React.useEffect(() => {
    const initialize = async () => {
      try {
        // Check authentication status first
        const authStatus = await googleDriveClient.checkAuthStatus()
        setIsAuthenticated(authStatus.authenticated)
        const token = authStatus.accessToken || null
        setAccessToken(token)
        // Notify parent component of access token change
        onAccessTokenChange?.(token)
        
        // Only initialize Google API client if authenticated
        if (authStatus.authenticated && token) {
          await googleDriveClient.initializeGapi()
        }
      } catch (error) {
        console.error('Error initializing:', error)
        setIsAuthenticated(false)
        setAccessToken(null)
        onAccessTokenChange?.(null)
      }
    }
    initialize()
  }, [])

  // Fetch Google Drive files when popover opens
  React.useEffect(() => {
    if (open && isAuthenticated && accessToken && googleDriveFiles.length === 0 && !searchQuery) {
      fetchGoogleDriveFiles()
    }
  }, [open, isAuthenticated, accessToken])

  // Handle search with debouncing
  React.useEffect(() => {
    if (!isAuthenticated || !accessToken) return

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    // Set new timeout for search
    searchTimeoutRef.current = setTimeout(async () => {
      if (searchQuery.trim()) {
        setIsLoadingFiles(true)
        try {
          const files = await googleDriveClient.searchFiles(searchQuery, accessToken)
          setGoogleDriveFiles(files)
        } catch (error) {
          console.error('Error searching Google Drive files:', error)
        } finally {
          setIsLoadingFiles(false)
        }
      } else {
        // If search is empty, fetch recent files
        fetchGoogleDriveFiles()
      }
    }, 300) // 300ms debounce

    // Cleanup
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchQuery, accessToken, isAuthenticated])

  const fetchGoogleDriveFiles = async () => {
    if (!accessToken || !isAuthenticated) return

    setIsLoadingFiles(true)
    try {
      const files = await googleDriveClient.fetchFiles(accessToken)
      setGoogleDriveFiles(files)
    } catch (error: any) {
      console.error('Error fetching Google Drive files:', error)
      // If token is invalid or any auth error, clear authentication state
      if (error?.status === 401 || error?.code === 401 || error?.message?.includes('authentication')) {
        setIsAuthenticated(false)
        setAccessToken(null)
        onAccessTokenChange?.(null)
        setGoogleDriveFiles([])
      }
    } finally {
      setIsLoadingFiles(false)
    }
  }

  // Combine static and dynamic items
  const allContextItems: ContextItem[] = [...staticContextItems, ...googleDriveFiles]

  const handleSelect = (selectedValue: string) => {
    const newValue = value.includes(selectedValue)
      ? value.filter((v) => v !== selectedValue)
      : [...value, selectedValue]
    onValueChange(newValue)
  }

  const handleRemove = (itemValue: string) => {
    onValueChange(value.filter((v) => v !== itemValue))
  }

  // Get icon for mime type
  const getFileIcon = (mimeType?: string) => {
    if (!mimeType) return FileIcon
    if (mimeType.includes('folder')) return FolderIcon
    if (mimeType.includes('document')) return FileTextIcon
    if (mimeType.includes('spreadsheet')) return FileTextIcon
    if (mimeType.includes('presentation')) return FileTextIcon
    return FileIcon
  }

  return (
    <div className="flex items-center gap-2 w-full overflow-hidden">
      <Popover open={open} onOpenChange={(newOpen) => {
        setOpen(newOpen)
        // Reset search when closing
        if (!newOpen) {
          setSearchQuery("")
        }
      }}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-fit justify-center h-8 p-2 font-normal rounded-lg"
          >
            <span>@ Add Context</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="center" sideOffset={4} collisionPadding={12}>
          <Command
            filter={(value, search) => {
              // Find the item by value
              const item = allContextItems.find(item => item.value === value)
              if (!item) return 0
              
              // For Google Drive items, the search is handled by the API
              if (item.type === 'google-drive') return 1
              
              // For static items, do case-insensitive search on the label
              if (item.label.toLowerCase().includes(search.toLowerCase())) return 1
              return 0
            }}
          >
            <CommandInput
              placeholder="Search context..." 
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList className="scrollbar-hide">
              <CommandEmpty>No context found.</CommandEmpty>
              
              {/* Static Context Items */}
              <CommandGroup heading="Browser Tabs">
                {staticContextItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <CommandItem
                      key={item.value}
                      value={item.value}
                      keywords={[item.label]}
                      onSelect={() => handleSelect(item.value)}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center">
                        <Icon className="mr-2 h-4 w-4" />
                        {item.label}
                      </div>
                      <CheckIcon
                        className={cn(
                          "h-4 w-4",
                          value.includes(item.value) ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  )
                })}
              </CommandGroup>

              {/* Google Drive Files */}
              {isAuthenticated && (
                <CommandGroup heading={
                  isLoadingFiles 
                    ? "Searching Google Drive..." 
                    : searchQuery 
                      ? `Google Drive results for "${searchQuery}"`
                      : "Recent Google Drive files"
                }>
                  {googleDriveFiles.length === 0 && !isLoadingFiles ? (
                    <CommandItem disabled>
                      <span className="text-muted-foreground">
                        {searchQuery ? "No files found matching your search" : "No files found"}
                      </span>
                    </CommandItem>
                  ) : (
                    googleDriveFiles.map((file) => {
                      const Icon = getFileIcon(file.mimeType)
                      return (
                        <CommandItem
                          key={file.value}
                          value={file.value}
                          keywords={[file.label]}
                          onSelect={() => handleSelect(file.value)}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center">
                            <Icon className="mr-2 h-4 w-4" />
                            <span className="truncate max-w-[200px]">{file.label}</span>
                          </div>
                          <CheckIcon
                            className={cn(
                              "h-4 w-4",
                              value.includes(file.value) ? "opacity-100" : "opacity-0"
                            )}
                          />
                        </CommandItem>
                      )
                    })
                  )}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      
      {/* Horizontally scrollable badges container */}
      {value.length > 0 && (
        <div 
          className="flex-1 overflow-x-auto scrollbar-hide rounded-md" 
          ref={scrollContainerRef}
          onWheel={handleWheel}
        >
          <div className="flex items-center gap-2 w-max">
            {value.map((itemValue) => {
              const item = allContextItems.find((i) => i.value === itemValue)
              if (!item) return null
              const Icon = item.type === 'google-drive' ? getFileIcon(item.mimeType) : item.icon
              
              return (
                <Badge
                  key={itemValue}
                  variant="secondary"
                  className="h-8 px-2 py-0 flex items-center gap-1.5 font-normal whitespace-nowrap"
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <span>{item.label}</span>
                  <button
                    onClick={() => handleRemove(itemValue)}
                    className="ml-1 hover:text-foreground/80 flex-shrink-0"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
