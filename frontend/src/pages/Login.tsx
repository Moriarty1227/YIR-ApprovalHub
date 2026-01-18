import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authApi } from '@/api'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card'

export default function Login() {
    const navigate = useNavigate()
    const setAuth = useAuthStore((state) => state.setAuth)
    const [loading, setLoading] = useState(false)
    const [form, setForm] = useState({
        username: '',
        password: '',
    })

    useEffect(() => {
        // 加载樱花效果脚本
        const script = document.createElement('script')
        script.src = '/sakura.js'
        script.async = true
        document.body.appendChild(script)
        
        return () => {
            // 清理脚本
            document.body.removeChild(script)
        }
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!form.username || !form.password) {
            alert('请填写用户名和密码')
            return
        }

        setLoading(true)
        try {
            const res = await authApi.login(form)
            setAuth(res.token, res.userInfo)
            navigate('/dashboard')
        } catch (error: any) {
            alert(error?.message || '登录失败')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
            {/* 樱花Canvas */}
            <canvas id="sakura" className="absolute top-0 left-0 w-full h-full -z-10"></canvas>
            
            {/* 登录卡片 */}
            <Card className="w-full max-w-md shadow-lg bg-white/30 backdrop-blur-md border border-white/20">
                <CardHeader className="space-y-1 text-center">
                    <CardTitle className="text-2xl font-bold text-white text-shadow-md">审批系统</CardTitle>
                    <CardDescription className="text-white/80">请输入您的账号密码登录</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="username" className="text-white">用户名</Label>
                            <Input
                                id="username"
                                type="text"
                                value={form.username}
                                onChange={(e) => setForm({ ...form, username: e.target.value })}
                                placeholder="请输入用户名"
                                className="bg-white/40 backdrop-blur-sm border-white/30 text-white placeholder-white/70"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-white">密码</Label>
                            <Input
                                id="password"
                                type="password"
                                value={form.password}
                                onChange={(e) => setForm({ ...form, password: e.target.value })}
                                placeholder="请输入密码"
                                className="bg-white/40 backdrop-blur-sm border-white/30 text-white placeholder-white/70"
                            />
                        </div>

                        <Button type="submit" className="w-full bg-white/80 hover:bg-white text-gray-900" disabled={loading}>
                            {loading ? '登录中...' : '登录'}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex flex-col gap-4 text-center">
                    <div className="text-sm text-white">
                        还没有账号？
                        <Link to="/register" className="text-primary hover:underline ml-1">
                            立即注册
                        </Link>
                    </div>
                    <div className="flex flex-col gap-1 text-xs text-white/80 border-t border-white/20 pt-4 w-full">
                        <span>管理账号：admin / 123456</span>
                        <span>审批账号：zyb / 123456</span>
                        <span>员工账号：wangyi / 123456</span>
                    </div>
                </CardFooter>
            </Card>
        </div>
    )
}
