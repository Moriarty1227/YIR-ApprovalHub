import { useState, useEffect } from 'react'
import { taskApi } from '@/api'
import type { Task } from '@/types'
import { Button } from '@/components/ui/button'
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
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function TodoTasks() {
    const [tasks, setTasks] = useState<Task[]>([])
    const [loading, setLoading] = useState(false)
    const [selectedTask, setSelectedTask] = useState<Task | null>(null)
    const [approveForm, setApproveForm] = useState({
        action: 1,
        comment: '',
    })

    const fetchTasks = async () => {
        setLoading(true)
        try {
            const res = await taskApi.getTodoTasks({ pageNum: 1, pageSize: 20 })
            setTasks(res.records)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchTasks()
    }, [])

    const handleApprove = async () => {
        if (!selectedTask) return

        try {
            await taskApi.approve({
                taskId: selectedTask.taskId,
                action: approveForm.action,
                comment: approveForm.comment || undefined,
            })
            alert('审批成功')
            setSelectedTask(null)
            setApproveForm({ action: 1, comment: '' })
            fetchTasks()
        } catch (error: any) {
            alert(error?.message || '审批失败')
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold tracking-tight">待办任务</h2>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>任务列表</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-10 text-muted-foreground">加载中...</div>
                    ) : tasks.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground">暂无待办任务</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>申请单号</TableHead>
                                    <TableHead>标题</TableHead>
                                    <TableHead>申请人</TableHead>
                                    <TableHead>当前节点</TableHead>
                                    <TableHead>接收时间</TableHead>
                                    <TableHead>操作</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {tasks.map((task) => (
                                    <TableRow key={task.taskId}>
                                        <TableCell>{task.appNo}</TableCell>
                                        <TableCell>{task.title}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{task.applicantName}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary">{task.nodeName}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            {new Date(task.createTime).toLocaleString('zh-CN')}
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="link"
                                                onClick={() => setSelectedTask(task)}
                                            >
                                                审批
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <Dialog open={!!selectedTask} onOpenChange={(open) => !open && setSelectedTask(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>审批：{selectedTask?.title}</DialogTitle>
                        <DialogDescription>
                            请仔细核对申请信息后进行审批操作。
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>审批动作</Label>
                            <RadioGroup
                                value={String(approveForm.action)}
                                onValueChange={(val) => setApproveForm({ ...approveForm, action: Number(val) })}
                                className="flex gap-4"
                            >
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="1" id="r1" />
                                    <Label htmlFor="r1">同意</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="2" id="r2" />
                                    <Label htmlFor="r2">拒绝</Label>
                                </div>
                            </RadioGroup>
                        </div>

                        <div className="grid gap-2">
                            <Label>审批意见</Label>
                            <Textarea
                                value={approveForm.comment}
                                onChange={(e) => setApproveForm({ ...approveForm, comment: e.target.value })}
                                placeholder="请输入审批意见..."
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSelectedTask(null)}>取消</Button>
                        <Button onClick={handleApprove}>提交</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
