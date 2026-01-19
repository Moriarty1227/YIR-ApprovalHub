package com.approval.module.system.vo.report;

import lombok.Data;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;

/**
 * 管理员统计汇总视图
 */
@Data
public class ReportSummaryVo {

    private String month;

    private List<DeptEmployeeStat> deptEmployeeStats = Collections.emptyList();

    private List<PostEmployeeStat> postEmployeeStats = Collections.emptyList();

    private ApplicationStats applicationStats = new ApplicationStats();

    private List<DeptMonthlyStat> deptMonthlyStats = Collections.emptyList();

    @Data
    public static class DeptEmployeeStat {
        private Long deptId;
        private String deptName;
        private Long userCount;
    }

    @Data
    public static class PostEmployeeStat {
        private Long postId;
        private String postName;
        private Long userCount;
    }

    @Data
    public static class ApplicationStats {
        private ApplicationTypeStat leave;
        private ApplicationTypeStat reimburse;
    }

    @Data
    public static class ApplicationTypeStat {
        private Long total;
        private Long approved;
        private BigDecimal approvalRate;
    }

    @Data
    public static class DeptMonthlyStat {
        private Long deptId;
        private String deptName;
        private Long leaveTotal;
        private Long reimburseTotal;
        private BigDecimal approvalRate;
    }
}
