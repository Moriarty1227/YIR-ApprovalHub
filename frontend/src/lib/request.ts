import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios'

const axiosInstance: AxiosInstance = axios.create({
    baseURL: import.meta.env.VITE_APP_BASE_API || '/api',
    timeout: 10000,
})

// 请求拦截器
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token')
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

// 响应拦截器
axiosInstance.interceptors.response.use(
    (response) => {
        const { code, data, message } = response.data

        if (code === 200) {
            return data
        } else {
            // 错误处理
            console.error('API Error:', message)
            return Promise.reject(new Error(message))
        }
    },
    (error) => {
        if (error.response) {
            const { status } = error.response

            if (status === 401) {
                // Token 过期，清除并跳转登录
                localStorage.removeItem('token')
                localStorage.removeItem('user')
                window.location.href = '/login'
            }
        }

        return Promise.reject(error)
    }
)

type HttpClient = {
    get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T>
    post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>
    put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>
    delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T>
}

const request: HttpClient = {
    get(url, config) {
        return axiosInstance.get(url, config)
    },
    post(url, data, config) {
        return axiosInstance.post(url, data, config)
    },
    put(url, data, config) {
        return axiosInstance.put(url, data, config)
    },
    delete(url, config) {
        return axiosInstance.delete(url, config)
    },
}

export default request
