import { useEffect, useMemo, useState } from 'react'
import dayjs from 'dayjs'
import { adminApi } from '@/api/admin'
import type { ReportSummary, ReportDeptDetail, ReportDeptMonthlyStat } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    Legend,
    CartesianGrid,
} from 'recharts'
import { Loader2 } from 'lucide-react'

const formatRate = (value?: number | string) => {
    const numeric = Number(value)
    if (Number.isNaN(numeric)) {
        return '0%'
    }
    return `${numeric.toFixed(2)}%`
}

export default function ReportCenter() {
    const [month, setMonth] = useState(dayjs().format('YYYY-MM'))
    const [summary, setSummary] = useState<ReportSummary | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [activeDeptId, setActiveDeptId] = useState<number | null>(null)
    const [deptDetail, setDeptDetail] = useState<ReportDeptDetail | null>(null)
    const [detailLoading, setDetailLoading] = useState(false)
    const [detailError, setDetailError] = useState<string | null>(null)
    const [detailDialogOpen, setDetailDialogOpen] = useState(false)

    const fetchSummary = async () => {
        setLoading(true)
        setError(null)
        try {
            const data = await adminApi.getReportSummary({ month })
            setSummary(data)
            if (activeDeptId) {
                fetchDeptDetail(activeDeptId, data.month)
            }
        } catch (err: any) {
            setError(err?.message || '统计数据获取失败')
        } finally {
            setLoading(false)
        }
    }

    const fetchDeptDetail = async (deptId: number, targetMonth?: string) => {
        setDetailLoading(true)
        setDetailError(null)
        try {
            const data = await adminApi.getDeptReportDetail({ deptId, month: targetMonth || month })
            setDeptDetail({
                ...data,
                deptPostStats: data.deptPostStats || [],
                leaveDetails: data.leaveDetails || [],
                reimburseDetails: data.reimburseDetails || [],
            })
            setActiveDeptId(deptId)
        } catch (err: any) {
            setDetailError(err?.message || '部门报表获取失败')
        } finally {
            setDetailLoading(false)
        }
    }

    useEffect(() => {
        fetchSummary()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [month])

    const deptCards = useMemo(() => {
        if (!summary) return []
        return summary.deptMonthlyStats || []
    }, [summary])

    const deptUserCountMap = useMemo(() => {
        const map = new Map<number, number>()
        summary?.deptEmployeeStats?.forEach((stat) => {
            map.set(stat.deptId, stat.userCount)
        })
        return map
    }, [summary])

    const chartData = useMemo(() => {
        if (!deptCards.length) return []
        return deptCards.map((stat) => {
            const total = stat.leaveTotal + stat.reimburseTotal
            const rate = Number(stat.approvalRate ?? 0) / 100
            const approved = Math.round(total * (Number.isFinite(rate) ? rate : 0))
            return {
                name: stat.deptName,
                total,
                approved,
            }
        })
    }, [deptCards])

    const handleViewDept = (deptId: number) => {
        setDetailDialogOpen(true)
        fetchDeptDetail(deptId)
    }

    const handleDialogChange = (open: boolean) => {
        setDetailDialogOpen(open)
        if (!open) {
            setDetailError(null)
            setDeptDetail(null)
            setActiveDeptId(null)
        }
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="pb-0">
                    <CardTitle className="text-2xl">管理员统计报表</CardTitle>
                    <p className="text-sm text-muted-foreground">
                        数据周期：{summary?.month || month}
                    </p>
                </CardHeader>
                <CardContent className="mt-4 grid gap-4 md:grid-cols-[220px,auto,140px] md:items-end">
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-medium text-muted-foreground">统计月份</label>
                        <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
                    </div>
                    <div className="flex flex-col gap-2 md:flex-row md:items-end">
                        <p className="text-xs text-muted-foreground">
                            选择月份后点击刷新即可重新获取部门汇总与明细。
                        </p>
                    </div>
                    <Button onClick={fetchSummary} disabled={loading}>
                        {loading ? '刷新中...' : '刷新统计'}
                    </Button>
                </CardContent>
            </Card>

            {error && <p className="text-sm text-red-500">{error}</p>}

            

            <Card>
                <CardHeader>
                    <CardTitle>部门申请趋势</CardTitle>
                </CardHeader>
                <CardContent className="h-80">
                    {chartData.length === 0 ? (
                        <p className="text-sm text-muted-foreground">暂无可绘制的部门数据</p>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData} margin={{ left: 12, right: 12, top: 12, bottom: 4 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} angle={-15} textAnchor="end" height={60} />
                                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="total" stroke="#2563eb" strokeWidth={2} name="申请总数" />
                                <Line type="monotone" dataKey="approved" stroke="#16a34a" strokeWidth={2} name="通过数量" />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>部门月度报表</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                    {deptCards.length === 0 && <p className="text-sm text-muted-foreground">暂无部门统计数据</p>}
                    {deptCards.map((stat) => (
                        <DeptReportCard
                            key={stat.deptId}
                            stat={stat}
                            memberCount={deptUserCountMap.get(stat.deptId) ?? 0}
                            onView={() => handleViewDept(stat.deptId)}
                            loading={detailLoading && activeDeptId === stat.deptId}
                        />
                    ))}
                </CardContent>
            </Card>

            <DeptDetailDialog
                open={detailDialogOpen}
                onOpenChange={handleDialogChange}
                detail={deptDetail}
                loading={detailLoading}
                error={detailError}
            />
        </div>
    )
}

function DeptReportCard({
    stat,
    memberCount,
    onView,
    loading,
}: {
    stat: ReportDeptMonthlyStat
    memberCount: number
    onView: () => void
    loading: boolean
}) {
    const total = stat.leaveTotal + stat.reimburseTotal
    return (
        <button
            type="button"
            onClick={onView}
            disabled={loading}
            className="flex w-full flex-col gap-4 rounded-2xl border border-transparent bg-white/90 p-4 text-left shadow-sm transition hover:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-70"
        >
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-sm text-muted-foreground">{stat.deptName}</p>
                    <p className="text-2xl font-bold mt-1">{total} 单</p>
                </div>
                <Badge variant="secondary">通过率 {formatRate(stat.approvalRate)}</Badge>
            </div>
            <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
                <Metric label="部门人数" value={`${memberCount} 人`} />
                <Metric label="请假申请" value={`${stat.leaveTotal} 单`} />
                <Metric label="报销申请" value={`${stat.reimburseTotal} 单`} />
                <Metric label="预计通过" value={`${Math.round(total * (Number(stat.approvalRate ?? 0) / 100 || 0))} 单`} />
            </div>
            <div className="text-sm font-medium text-primary">
                {loading ? '查询中...' : '查看部门明细 →'}
            </div>
        </button>
    )
}

function Metric({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex flex-col">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
            <span className="text-base font-semibold text-foreground">{value}</span>
        </div>
    )
}

function DeptDetailDialog({
    open,
    onOpenChange,
    detail,
    loading,
    error,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    detail: ReportDeptDetail | null
    loading: boolean
    error: string | null
}) {
    const totalMembers = useMemo(() => {
        if (!detail?.deptPostStats?.length) {
            return 0
        }
        return detail.deptPostStats.reduce((sum, item) => sum + item.userCount, 0)
    }, [detail])

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl">
                <DialogHeader>
                    <DialogTitle>
                        {detail ? `${detail.deptName} · ${detail.month}` : '部门明细报表'}
                    </DialogTitle>
                    <DialogDescription>查看该部门当月的岗位分布以及请假、报销明细。</DialogDescription>
                </DialogHeader>
                <div className="space-y-6">
                    {loading && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" /> 正在拉取部门报表...
                        </div>
                    )}
                    {error && <p className="text-sm text-red-500">{error}</p>}
                    {!loading && !error && detail && (
                        <>
                            <div className="rounded-lg border bg-muted/20 p-4">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <p className="text-sm font-medium text-muted-foreground">
                                        岗位分布（{totalMembers} 人）
                                    </p>
                                    <Badge variant="outline">{detail.month}</Badge>
                                </div>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {detail.deptPostStats.length === 0 ? (
                                        <p className="text-sm text-muted-foreground">暂无在岗成员</p>
                                    ) : (
                                        detail.deptPostStats.map((item) => (
                                            <Badge key={item.postId ?? 'none'} variant="secondary">
                                                {item.postName} · {item.userCount} 人
                                            </Badge>
                                        ))
                                    )}
                                </div>
                            </div>
                            <div className="grid gap-4 lg:grid-cols-2">
                                <DetailTable
                                    title="请假统计"
                                    headers={[['员工', 'flex-1'], ['次数', 'w-16 text-right'], ['请假天数', 'w-24 text-right']]}
                                    rows={detail.leaveDetails.map((item) => [
                                        item.realName,
                                        item.times,
                                        item.days,
                                    ])}
                                />
                                <DetailTable
                                    title="报销统计"
                                    headers={[['员工', 'flex-1'], ['次数', 'w-16 text-right'], ['报销金额', 'w-24 text-right']]}
                                    rows={detail.reimburseDetails.map((item) => [
                                        item.realName,
                                        item.times,
                                        item.amount,
                                    ])}
                                />
                            </div>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}

function DetailTable({
    title,
    headers,
    rows,
}: {
    title: string
    headers: [string, string][]
    rows: Array<Array<string | number>>
}) {
    return (
        <div className="rounded-lg border p-4">
            <p className="text-sm font-semibold mb-3">{title}</p>
            <Table>
                <TableHeader>
                    <TableRow>
                        {headers.map(([label, cls]) => (
                            <TableHead key={label} className={cls}>
                                {label}
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {rows.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={headers.length} className="text-center text-muted-foreground">
                                暂无数据
                            </TableCell>
                        </TableRow>
                    )}
                    {rows.map((row, idx) => (
                        <TableRow key={`${title}-${idx}`}>
                            {row.map((value, cellIdx) => (
                                <TableCell key={`${title}-${idx}-${cellIdx}`} className={headers[cellIdx][1]}>
                                    {value}
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
