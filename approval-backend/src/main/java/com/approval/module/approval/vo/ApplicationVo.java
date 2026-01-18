package com.approval.module.approval.vo;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 申请列表VO
 */
@Data
public class ApplicationVo {

    private Long appId;

    private String appNo;

    private String appType;

    private String title;

    private String applicantName;

    private String deptName;

    private Integer status;

    private String currentNode;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime submitTime;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime finishTime;

    private Integer leaveType;

    private Integer expenseType;
}
