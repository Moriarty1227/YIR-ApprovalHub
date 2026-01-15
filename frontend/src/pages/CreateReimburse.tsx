import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { applicationApi } from '@/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export default function CreateReimburse() {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [form, setForm] = useState({
        amount: '',
        type: '差旅费',
        reason: '',
        attachment: '',
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!form.amount || !form.reason) {
            alert('请填写必填项')
            return
        }

        setLoading(true)
        try {
            await applicationApi.createReimburse({
                amount: Number(form.amount),
                type: form.type,
                reason: form.reason,
                attachment: form.attachment
            })
            alert('提交成功')
            navigate('/dashboard/applications')
        } catch (error: any) {
            alert(error?.message || '提交失败')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-2xl mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle>创建报销申请</CardTitle>
                    <CardDescription>请填写真实的报销信息</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label>报销金额 (元) *</Label>
                            <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={form.amount}
                                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                                placeholder="0.00"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>报销类别</Label>
                            <Input
                                type="text"
                                value={form.type}
                                onChange={(e) => setForm({ ...form, type: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>费用说明 *</Label>
                            <Textarea
                                value={form.reason}
                                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                                placeholder="请详细说明费用产生的详情"
                                rows={4}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>附件链接</Label>
                            <Input
                                type="url"
                                value={form.attachment}
                                onChange={(e) => setForm({ ...form, attachment: e.target.value })}
                                placeholder="请输入附件下载链接"
                            />
                        </div>

                        <div className="flex gap-4 pt-4">
                            <Button type="submit" className="flex-1" disabled={loading}>
                                {loading ? '提交中...' : '提交申请'}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => navigate('/dashboard/applications')}
                            >
                                取消
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
