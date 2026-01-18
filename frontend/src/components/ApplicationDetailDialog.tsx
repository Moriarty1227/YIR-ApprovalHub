import { useEffect, useState, type ReactNode } from 'react'
import dayjs from 'dayjs'
import { applicationApi } from '@/api'
import type {
    ApplicationDetailResponse,
    LeaveApplicationDetail,
    ReimburseApplicationDetail,
} from '@/types'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    APPLICATION_STATUS,
    APPLICATION_TYPE_LABELS,
    LEAVE_TYPE_LABELS,
    EXPENSE_TYPE_LABELS,
    APPROVAL_ACTION_LABELS,
} from '@/constants/application'
import { cn } from '@/lib/utils'

interface ApplicationDetailDialogProps {
    appId?: number
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function ApplicationDetailDialog({ appId, open, onOpenChange }: ApplicationDetailDialogProps) {
    const [detail, setDetail] = useState<ApplicationDetailResponse | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!open || !appId) {
            return
        }

        let cancelled = false
        setLoading(true)
        setError(null)

        applicationApi
            .getDetail(appId)
            .then((data) => {
                if (!cancelled) {
                    setDetail(data)
                }
            })
            .catch((err: any) => {
                if (!cancelled) {
                    setError(err?.message || '加载详情失败')
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setLoading(false)
                }
            })

        return () => {
            cancelled = true
        }
    }, [appId, open])

    useEffect(() => {
        if (!open) {
            setDetail(null)
            setError(null)
        }
    }, [open])

    const application = detail?.application
    const statusMeta = application ? APPLICATION_STATUS[application.status] : null
    const leaveDetail = isLeaveDetail(detail?.detail) ? detail?.detail : null
    const reimburseDetail = isReimburseDetail(detail?.detail) ? detail?.detail : null
    const historyRecords = detail?.history ?? []
    const displayTitle = getDisplayTitle(
        application?.appType,
        leaveDetail,
        reimburseDetail,
        application?.title
    )

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex  gap-4">
                        <span>{displayTitle}</span>
                        {application && (
                            <Badge variant={statusMeta?.variant || 'outline'}>
                                {statusMeta?.text || '未知状态'}
                            </Badge>
                        )}      
                    </DialogTitle>
                    {application && (
                        <DialogDescription>
                            单号：{application.appNo} · 类型：
                            {APPLICATION_TYPE_LABELS[application.appType] || application.appType}
                        </DialogDescription>
                    )}
                </DialogHeader>

                {loading && (
                    <div className="py-10 text-center text-muted-foreground">加载中...</div>
                )}

                {!loading && error && (
                    <div className="py-6 text-center text-destructive">{error}</div>
                )}

                {!loading && !error && !detail && (
                    <div className="py-6 text-center text-muted-foreground">请选择要查看的申请</div>
                )}

                {!loading && !error && detail && (
                    <div className="space-y-8">
                        <section className="space-y-3">
                            <h4 className="text-sm font-semibold text-muted-foreground">基础信息</h4>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <InfoRow label="标题" value={displayTitle} />
                                <InfoRow label="申请单号" value={application?.appNo} />
                                <InfoRow
                                    label="申请类型"
                                    value={
                                        application
                                            ? APPLICATION_TYPE_LABELS[application.appType] || application.appType
                                            : '-'
                                    }
                                />
                                <InfoRow label="当前节点" value={application?.currentNode || '-'} />
                                <InfoRow label="提交时间" value={formatDateTime(application?.submitTime)} />
                                <InfoRow label="完成时间" value={formatDateTime(application?.finishTime)} />
                            </div>
                        </section>

                        {leaveDetail && (
                            <section className="space-y-3">
                                <h4 className="text-sm font-semibold text-muted-foreground">请假信息</h4>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <InfoRow
                                        label="请假类型"
                                        value={LEAVE_TYPE_LABELS[leaveDetail.leaveType] || leaveDetail.leaveType}
                                    />
                                    <InfoRow label="请假天数" value={formatNumber(leaveDetail.days)} />
                                    <InfoRow label="开始时间" value={formatDateTime(leaveDetail.startTime)} />
                                    <InfoRow label="结束时间" value={formatDateTime(leaveDetail.endTime)} />
                                    <InfoRow
                                        className="sm:col-span-2"
                                        label="请假事由"
                                        value={<TextPanel text={leaveDetail.reason} />}
                                    />
                                    {leaveDetail.attachment && (
                                        <InfoRow
                                            className="sm:col-span-2"
                                            label="附件"
                                            value={
                                                <a
                                                    href={leaveDetail.attachment}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-primary underline"
                                                >
                                                    查看附件
                                                </a>
                                            }
                                        />
                                    )}
                                </div>
                            </section>
                        )}

                        {reimburseDetail && (
                            <section className="space-y-3">
                                <h4 className="text-sm font-semibold text-muted-foreground">报销信息</h4>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <InfoRow
                                        label="费用类型"
                                        value={
                                            EXPENSE_TYPE_LABELS[reimburseDetail.expenseType] ||
                                            reimburseDetail.expenseType
                                        }
                                    />
                                    <InfoRow label="报销金额" value={formatCurrency(reimburseDetail.amount)} />
                                    <InfoRow label="发生日期" value={formatDateOnly(reimburseDetail.occurDate)} />
                                    <InfoRow
                                        className="sm:col-span-2"
                                        label="费用说明"
                                        value={<TextPanel text={reimburseDetail.reason} />}
                                    />
                                    {reimburseDetail.invoiceAttachment && (
                                        <InfoRow
                                            className="sm:col-span-2"   
                                            label="发票附件"
                                            value={
                                                <a
                                                    href={reimburseDetail.invoiceAttachment}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-primary underline"
                                                >
                                                    查看附件
                                                </a>
                                            }
                                        />
                                    )}
                                </div>
                            </section>
                        )}

                        <section className="space-y-3">
                            <h4 className="text-sm font-semibold text-muted-foreground">审批流转</h4>
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>节点</TableHead>
                                            <TableHead>审批人</TableHead>
                                            <TableHead>动作</TableHead>
                                            <TableHead>时间</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {historyRecords.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center text-muted-foreground">
                                                    暂无审批记录
                                                </TableCell>
                                            </TableRow>
                                        )}

                                        {historyRecords.map((record) => (
                                            <TableRow key={record.historyId}>
                                                <TableCell>{record.nodeName || '-'}</TableCell>
                                                <TableCell>{record.approverName || '-'}</TableCell>
                                                <TableCell>
                                                    {record.action
                                                        ? APPROVAL_ACTION_LABELS[record.action] || record.action
                                                        : '-'}
                                                </TableCell>
                                                <TableCell>{formatDateTime(record.approveTime)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                            {historyRecords.length > 0 && (
                                <div className="space-y-3">
                                    <h5 className="text-xs uppercase tracking-wide text-muted-foreground">审批意见</h5>
                                    <div className="space-y-3">
                                        {historyRecords.map((record) => (
                                            <div key={`${record.historyId}-comment`} className="space-y-1">
                                                <div className="text-xs text-muted-foreground">
                                                    {record.approverName || '系统'} · {formatDateTime(record.approveTime)}
                                                </div>
                                                <TextPanel text={record.comment} placeholder="暂无审批意见" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </section>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}

function InfoRow({ label, value, className }: { label: string; value?: ReactNode; className?: string }) {
    return (
        <div className={cn('text-sm', className)}>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
            <div className="mt-1 text-sm font-medium leading-6">{value ?? '-'}</div>
        </div>
    )
}

function TextPanel({ text, placeholder }: { text?: string; placeholder?: string }) {
    return (
        <div className="rounded-xl border border-[#d7dce5] bg-white px-3 py-2 text-sm text-muted-foreground shadow-[0_1px_2px_rgba(15,23,42,0.08)] min-h-[96px] whitespace-pre-line">
            {text?.trim() ? text : placeholder || '暂无说明'}
        </div>
    )
}

function isLeaveDetail(
    detail?: LeaveApplicationDetail | ReimburseApplicationDetail | null
): detail is LeaveApplicationDetail {
    return Boolean(detail && (detail as LeaveApplicationDetail).leaveType !== undefined)
}

function isReimburseDetail(
    detail?: LeaveApplicationDetail | ReimburseApplicationDetail | null
): detail is ReimburseApplicationDetail {
    return Boolean(detail && (detail as ReimburseApplicationDetail).expenseType !== undefined)
}

const formatDateTime = (value?: string) => (value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '-')
const formatDateOnly = (value?: string) => (value ? dayjs(value).format('YYYY-MM-DD') : '-')

const formatNumber = (value?: number | string) => {
    if (value === null || value === undefined) {
        return '-'
    }
    const parsed = typeof value === 'number' ? value : Number(value)
    return Number.isFinite(parsed) ? `${parsed}` : String(value)
}

const formatCurrency = (value?: number | string) => {
    if (value === null || value === undefined) {
        return '-'
    }
    const parsed = typeof value === 'number' ? value : Number(value)
    if (Number.isFinite(parsed)) {
        return `¥${parsed.toFixed(2)}`
    }
    return String(value)
}

const getDisplayTitle = (
    appType?: string,
    leaveDetail?: LeaveApplicationDetail | null,
    reimburseDetail?: ReimburseApplicationDetail | null,
    fallback?: string
) => {
    if (appType === 'leave') {
        if (leaveDetail?.leaveType) {
            return LEAVE_TYPE_LABELS[leaveDetail.leaveType] || '请假'
        }
        return '请假'
    }

    if (appType === 'reimburse') {
        if (reimburseDetail?.expenseType) {
            return EXPENSE_TYPE_LABELS[reimburseDetail.expenseType] || '报销'
        }
        return '报销'
    }

    return fallback || '申请详情'
}
