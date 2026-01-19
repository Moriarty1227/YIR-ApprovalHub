import { useCallback, useRef, useState } from 'react'
import { UploadCloud, FileText, Loader2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { UploadFileResult } from '@/types'
import { fileApi } from '@/api'

interface AttachmentUploadProps {
    label?: string
    description?: string
    value?: UploadFileResult | null
    onChange?: (file: UploadFileResult | null) => void
    accept?: string
    maxSizeMB?: number
    disabled?: boolean
}

const DEFAULT_ACCEPT = 'image/*,.pdf'
const DEFAULT_MAX_SIZE = 10 // MB

export function AttachmentUpload({
    label,
    description,
    value,
    onChange,
    accept = DEFAULT_ACCEPT,
    maxSizeMB = DEFAULT_MAX_SIZE,
    disabled,
}: AttachmentUploadProps) {
    const inputRef = useRef<HTMLInputElement>(null)
    const [dragActive, setDragActive] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleFiles = useCallback(
        async (files: FileList | null) => {
            if (!files || files.length === 0) return
            const file = files[0]
            const sizeLimit = maxSizeMB * 1024 * 1024
            if (file.size > sizeLimit) {
                setError(`文件大小不能超过 ${maxSizeMB}MB`)
                return
            }

            setUploading(true)
            setError(null)
            try {
                const result = await fileApi.upload(file)
                onChange?.(result)
            } catch (err: any) {
                setError(err?.message || '上传失败，请稍后重试')
            } finally {
                setUploading(false)
            }
        },
        [maxSizeMB, onChange]
    )

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault()
        if (disabled) return
        setDragActive(false)
        handleFiles(event.dataTransfer.files)
    }

    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault()
        if (disabled) return
        setDragActive(true)
    }

    const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault()
        setDragActive(false)
    }

    const handleSelect = () => {
        if (disabled) return
        inputRef.current?.click()
    }

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        handleFiles(event.target.files)
        event.target.value = ''
    }

    return (
        <div className="space-y-3">
            {label && <p className="text-sm font-medium text-foreground">{label}</p>}
            <div
                className={cn(
                    'rounded-2xl border-2 border-dashed p-6 text-center transition-all',
                    dragActive ? 'border-primary bg-primary/5' : 'border-muted',
                    disabled && 'opacity-60'
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept={accept}
                    className="hidden"
                    onChange={handleInputChange}
                    disabled={disabled}
                />
                <div className="flex flex-col items-center gap-3">
                    {uploading ? (
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    ) : (
                        <UploadCloud className="h-10 w-10 text-primary" />
                    )}
                    <div className="space-y-1">
                        <p className="text-sm font-medium">拖拽文件到此处，或</p>
                        <Button type="button" variant="secondary" size="sm" onClick={handleSelect} disabled={disabled || uploading}>
                            选择文件
                        </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {description || `支持 ${accept.replace('image/*', '图片')}，单文件不超过 ${maxSizeMB}MB`}
                    </p>
                </div>
                {value && (
                    <div className="mt-5 rounded-xl border bg-white/80 p-4 text-left">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <FileText className="h-6 w-6 text-primary" />
                                <div>
                                    <p className="text-sm font-medium">{value.fileName}</p>
                                    <p className="text-xs text-muted-foreground">{formatSize(value.fileSize)}</p>
                                </div>
                            </div>
                            <Badge variant="outline">已上传</Badge>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                            <Button type="button" variant="ghost" size="sm" asChild>
                                <a href={value.fileUrl} target="_blank" rel="noreferrer">
                                    在线预览
                                </a>
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="text-destructive"
                                onClick={() => onChange?.(null)}
                            >
                                <Trash2 className="mr-1 h-4 w-4" />移除
                            </Button>
                        </div>
                    </div>
                )}
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
    )
}

const formatSize = (size?: number) => {
    if (!size || size <= 0) return '未知大小'
    if (size < 1024) return `${size} B`
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
    return `${(size / 1024 / 1024).toFixed(1)} MB`
}
