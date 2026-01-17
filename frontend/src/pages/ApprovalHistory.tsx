import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import { applicationApi } from '@/api'
import type { ApplicationHistory } from '@/types'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'


const statusMap: Record<number, { text: string; variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" }> = {
    0: { text: '草稿', variant: 'secondary' },
    1: { text: '待审批', variant: 'warning' },
    2: { text: '审批中', variant: 'default' },
    3: { text: '已通过', variant: 'success' },
    4: { text: '已拒绝', variant: 'destructive' },
    5: { text: '已撤回', variant: 'outline' },
}

const typeMap: Record<string, string> = {
    leave: '请假',
    reimburse: '报销',
}

const getMonthRange = (month: string) => {
    const start = dayjs(month, 'YYYY-MM').startOf('month')
    const end = start.endOf('month')
    return {
        startTime: start.format('YYYY-MM-DD[T]HH:mm:ss'),
        endTime: end.format('YYYY-MM-DD[T]HH:mm:ss'),
    }
}

export default function ApprovalHistory() {
    const [applications, setApplications] = useState<ApplicationHistory[]>([])
    const [loading, setLoading] = useState(false)
    const [approverOptions, setApproverOptions] = useState<string[]>([])
    const [monthOptions, setMonthOptions] = useState<string[]>([])
    const [filter, setFilter] = useState({ appType: '', status: '', approverName: '', month: '' })

    const loadFilterOptions = async () => {
        try {
            const res = await applicationApi.getHistoryApplications({ pageNum: 1, pageSize: 500 })
            const records = Array.isArray(res.records) ? res.records : []

            const approvers = Array.from(
                new Set(records.map((item) => item.approverName).filter((name): name is string => Boolean(name)))
            )

            const months = Array.from(
                new Set(
                    records
                        .map((item) => item.approveTime || item.submitTime)
                        .filter((time): time is string => Boolean(time))
                        .map((time) => dayjs(time).format('YYYY-MM'))
                )
            ).sort((a, b) => (a > b ? -1 : 1))

            setApproverOptions(approvers)
            setMonthOptions(months)
        } catch (error) {
            console.error(error)
        }
    }

    const fetchApplications = async () => {
        setLoading(true)
        try {
            const params: Record<string, any> = {
                pageNum: 1,
                pageSize: 20,
                appType: filter.appType || undefined,
                status: filter.status ? Number(filter.status) : undefined,
                approverName: filter.approverName || undefined,
            }

            if (filter.month) {
                const { startTime, endTime } = getMonthRange(filter.month)
                params.startTime = startTime
                params.endTime = endTime
            }

            const res = await applicationApi.getHistoryApplications(params)
            const records = Array.isArray(res.records) ? res.records : []
            setApplications(records)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadFilterOptions()
    }, [])

    useEffect(() => {
        fetchApplications()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filter.appType, filter.status, filter.approverName, filter.month])

    const renderDateTime = (value?: string) => (value ? new Date(value).toLocaleString('zh-CN') : '-')

    const handleWithdraw = async (appId: number) => {
        if (!confirm('确定要撤回此申请吗？')) return

        try {
            await applicationApi.withdraw(appId)
            alert('撤回成功')
            fetchApplications()
        } catch (error: any) {
            alert(error?.message || '撤回失败')
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold tracking-tight">审批历史</h2>
                <div className="flex gap-4">
                    <Button onClick={fetchApplications} disabled={loading}>
                        {loading ? '刷新中...' : '刷新'}
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex gap-4">
                        <Select
                            value={filter.appType}
                            onValueChange={(val) =>
                                setFilter((prev) => ({ ...prev, appType: val === 'all' ? '' : val }))
                            }
                        >
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="全部类型" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">全部类型</SelectItem>
                                <SelectItem value="leave">请假</SelectItem>
                                <SelectItem value="reimburse">报销</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select
                            value={filter.status}
                            onValueChange={(val) =>
                                setFilter((prev) => ({ ...prev, status: val === 'all' ? '' : val }))
                            }
                        >
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="全部状态" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">全部状态</SelectItem>
                                <SelectItem value="3">已通过</SelectItem>
                                <SelectItem value="4">已拒绝</SelectItem>
                                <SelectItem value="5">已撤回</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select
                            value={filter.approverName}
                            onValueChange={(val) =>
                                setFilter((prev) => ({ ...prev, approverName: val === 'all' ? '' : val }))
                            }
                        >
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="审批人" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">全部审批人</SelectItem>
                                {approverOptions.length === 0 ? (
                                    <SelectItem value="__empty" disabled>
                                        暂无审批人
                                    </SelectItem>
                                ) : (
                                    approverOptions.map((name) => (
                                        <SelectItem key={name} value={name}>
                                            {name}
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>

                        <Select
                            value={filter.month}
                            onValueChange={(val) =>
                                setFilter((prev) => ({ ...prev, month: val === 'all' ? '' : val }))
                            }
                        >
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="时间" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">全部时间</SelectItem>
                                {monthOptions.length === 0 ? (
                                    <SelectItem value="__empty" disabled>
                                        暂无数据
                                    </SelectItem>
                                ) : (
                                    monthOptions.map((month) => (
                                        <SelectItem key={month} value={month}>
                                            {month}
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>

                        
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-10 text-muted-foreground">加载中...</div>
                    ) : applications.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground">暂无申请记录</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>申请单号</TableHead>
                                    <TableHead>类型</TableHead>
                                    <TableHead>标题</TableHead>
                                    <TableHead>审批人</TableHead>
                                    <TableHead>状态</TableHead>
                                    <TableHead>提交时间</TableHead>
                                    <TableHead>操作</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {applications.map((app) => (
                                    <TableRow key={app.appId}>
                                        <TableCell>{app.appNo}</TableCell>
                                        <TableCell>{typeMap[app.appType]}</TableCell>
                                        <TableCell>{app.title}</TableCell>
                                        <TableCell>{app.approverName || '-'}</TableCell>
                                        <TableCell>
                                            <Badge variant={statusMap[app.status]?.variant}>
                                                {statusMap[app.status]?.text}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{renderDateTime(app.submitTime)}</TableCell>
                                        <TableCell className="space-x-2">
                                            <Button variant="link" size="sm">查看</Button>
                                            {app.status === 1 && (
                                                <Button
                                                    variant="link"
                                                    size="sm"
                                                    className="text-destructive"
                                                    onClick={() => handleWithdraw(app.appId)}
                                                >
                                                    撤回
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
