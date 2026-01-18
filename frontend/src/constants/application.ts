export type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'

export const APPLICATION_STATUS: Record<number, { text: string; variant: BadgeVariant }> = {
    0: { text: '草稿', variant: 'secondary' },
    1: { text: '待审批', variant: 'warning' },
    2: { text: '审批中', variant: 'default' },
    3: { text: '已通过', variant: 'success' },
    4: { text: '已拒绝', variant: 'destructive' },
    5: { text: '已撤回', variant: 'outline' },
}

export const APPLICATION_TYPE_LABELS: Record<string, string> = {
    leave: '请假',
    reimburse: '报销',
}

export const LEAVE_TYPE_LABELS: Record<number, string> = {
    1: '事假',
    2: '病假',
    3: '年假',
    4: '调休',
}

export const EXPENSE_TYPE_LABELS: Record<number, string> = {
    1: '差旅交通费',
    2: '业务招待费',
    3: '日常办公费',
    4: '培训教育费',
    5: '服务采购费',
    6: '其他',
}

export const APPROVAL_ACTION_LABELS: Record<number, string> = {
    1: '同意',
    2: '拒绝',
}
