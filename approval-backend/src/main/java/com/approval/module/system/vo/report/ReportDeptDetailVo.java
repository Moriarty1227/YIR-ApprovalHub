package com.approval.module.system.vo.report;

import lombok.Data;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;

/**
 * 部门月度报表视图
 */
@Data
public class ReportDeptDetailVo {

    private Long deptId;
    private String deptName;
    private String month;
    private List<DeptPostStat> deptPostStats = Collections.emptyList();
    private List<MemberLeaveDetail> leaveDetails = Collections.emptyList();
    private List<MemberReimburseDetail> reimburseDetails = Collections.emptyList();

    @Data
    public static class MemberLeaveDetail {
        private Long userId;
        private String realName;
        private Long times;
        private BigDecimal days;
    }

    @Data
    public static class MemberReimburseDetail {
        private Long userId;
        private String realName;
        private Long times;
        private BigDecimal amount;
    }

    @Data
    public static class DeptPostStat {
        private Long postId;
        private String postName;
        private Long userCount;
    }
}
