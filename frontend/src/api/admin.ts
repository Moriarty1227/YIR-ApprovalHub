import request from '@/lib/request'
import type {
    AdminUser,
    AdminDept,
    AdminPost,
    Permission,
    UserFormData,
    DeptFormData,
    PostFormData,
    AssignPostData,
    Application,
    ReportSummary,
    ReportDeptDetail,
} from '@/types'

export const adminApi = {
    getUserList: (params: {
        pageNum?: number
        pageSize?: number
        username?: string
        realName?: string
        deptId?: number
        status?: number
    }) =>
        request.get<{ records: AdminUser[]; total: number }>('/admin/users', { params }),

    getUserById: (userId: number) =>
        request.get<AdminUser>(`/admin/users/${userId}`),

    createUser: (data: UserFormData) =>
        request.post('/admin/users', data),

    updateUser: (data: UserFormData) =>
        request.put('/admin/users', data),

    deleteUser: (userId: number) =>
        request.delete(`/admin/users/${userId}`),

    getDeptList: (params: {
        pageNum?: number
        pageSize?: number
        deptName?: string
        status?: number
    }) =>
        request.get<{ records: AdminDept[]; total: number }>('/admin/depts', { params }),

    getDeptById: (deptId: number) =>
        request.get<AdminDept>(`/admin/depts/${deptId}`),

    createDept: (data: DeptFormData) =>
        request.post('/admin/depts', data),

    updateDept: (data: DeptFormData) =>
        request.put('/admin/depts', data),

    deleteDept: (deptId: number) =>
        request.delete(`/admin/depts/${deptId}`),

    getPostList: (params: {
        pageNum?: number
        pageSize?: number
        postName?: string
        status?: number
    }) =>
        request.get<{ records: AdminPost[]; total: number }>('/admin/posts', { params }),

    getPostById: (postId: number) =>
        request.get<AdminPost>(`/admin/posts/${postId}`),

    createPost: (data: PostFormData) =>
        request.post('/admin/posts', data),

    updatePost: (data: PostFormData) =>
        request.put('/admin/posts', data),

    deletePost: (postId: number) =>
        request.delete(`/admin/posts/${postId}`),

    assignPost: (data: AssignPostData) =>
        request.post('/admin/users/post', data),

    getAllDepts: () =>
        request.get<AdminDept[]>('/admin/depts/all'),

    getAllPosts: () =>
        request.get<AdminPost[]>('/admin/posts/all'),

    getAllPermissions: () =>
        request.get<Permission[]>('/admin/permissions/all'),

    getReportSummary: (params?: { month?: string }) =>
        request.get<ReportSummary>('/admin/reports/summary', { params }),

    getDeptReportDetail: (params: { deptId: number; month?: string }) =>
        request.get<ReportDeptDetail>('/admin/reports/dept-detail', { params }),

    getAllApplications: (params: {
        pageNum?: number
        pageSize?: number
        appType?: string
        status?: number
        appNo?: string
    }) =>
        request.get<{ records: Application[]; total: number }>('/admin/applications', { params }),

    getApplicationDetail: (appId: number) =>
        request.get(`/admin/applications/${appId}`),
}
