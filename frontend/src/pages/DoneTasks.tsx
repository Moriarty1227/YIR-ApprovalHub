import { useState, useEffect } from 'react'
import { taskApi } from '@/api'
import type { Task } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

const actionMap: Record<number, { text: string; variant: "success" | "destructive" | "default" | "secondary" | "outline" | "warning" }> = {
    1: { text: '同意', variant: 'success' },
    2: { text: '拒绝', variant: 'destructive' },
}

export default function DoneTasks() {
    const [tasks, setTasks] = useState<Task[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        const fetchTasks = async () => {
            setLoading(true)
            try {
                const res = await taskApi.getDoneTasks({ pageNum: 1, pageSize: 20 })
                setTasks(res.records)
            } catch (error) {
                console.error(error)
            } finally {
                setLoading(false)
            }
        }

        fetchTasks()
    }, [])

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold tracking-tight">已办任务</h2>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>任务历史</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-10 text-muted-foreground">加载中...</div>
                    ) : tasks.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground">暂无已办任务</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>申请单号</TableHead>
                                    <TableHead>标题</TableHead>
                                    <TableHead>申请人</TableHead>
                                    <TableHead>审批结果</TableHead>
                                    <TableHead>审批意见</TableHead>
                                    <TableHead>完成时间</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {tasks.map((task) => (
                                    <TableRow key={task.taskId}>
                                        <TableCell>{task.appNo}</TableCell>
                                        <TableCell>{task.title}</TableCell>
                                        <TableCell>{task.applicantName}</TableCell>
                                        <TableCell>
                                            <Badge variant={actionMap[task.action || 1]?.variant}>
                                                {actionMap[task.action || 1]?.text}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {task.comment || '-'}
                                        </TableCell>
                                        <TableCell>
                                            {task.finishTime
                                                ? new Date(task.finishTime).toLocaleString('zh-CN')
                                                : '-'}
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
