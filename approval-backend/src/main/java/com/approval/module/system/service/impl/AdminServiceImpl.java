package com.approval.module.system.service.impl;

import com.approval.common.exception.BusinessException;
import com.approval.module.approval.entity.Application;
import com.approval.module.approval.entity.LeaveApplication;
import com.approval.module.approval.entity.ReimburseApplication;
import com.approval.module.approval.mapper.ApplicationMapper;
import com.approval.module.approval.mapper.LeaveApplicationMapper;
import com.approval.module.approval.mapper.ReimburseApplicationMapper;
import com.approval.module.system.dto.AssignPostDto;
import com.approval.module.system.dto.DeptDto;
import com.approval.module.system.dto.PostDto;
import com.approval.module.system.dto.UserDto;
import com.approval.module.system.entity.Dept;
import com.approval.module.system.entity.Permission;
import com.approval.module.system.entity.Post;
import com.approval.module.system.entity.User;
import com.approval.module.system.mapper.DeptMapper;
import com.approval.module.system.mapper.PermissionMapper;
import com.approval.module.system.mapper.PostMapper;
import com.approval.module.system.mapper.UserMapper;
import com.approval.module.system.service.IAdminService;
import com.approval.module.system.vo.DeptVo;
import com.approval.module.system.vo.PermissionVo;
import com.approval.module.system.vo.PostVo;
import com.approval.module.system.vo.UserVo;
import com.approval.module.system.vo.report.ReportDeptDetailVo;
import com.approval.module.system.vo.report.ReportSummaryVo;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminServiceImpl implements IAdminService {

    private final UserMapper userMapper;
    private final DeptMapper deptMapper;
    private final PostMapper postMapper;
    private final PermissionMapper permissionMapper;
    private final ApplicationMapper applicationMapper;
    private final LeaveApplicationMapper leaveApplicationMapper;
    private final ReimburseApplicationMapper reimburseApplicationMapper;
    private final PasswordEncoder passwordEncoder;

    @Override
    public Page<UserVo> getUserList(Integer pageNum, Integer pageSize, String username, String realName, Long deptId, Integer status) {
        Page<User> page = new Page<>(pageNum, pageSize);

        LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<>();
        wrapper.like(username != null && !username.isEmpty(), User::getUsername, username)
                .like(realName != null && !realName.isEmpty(), User::getRealName, realName)
                .eq(deptId != null, User::getDeptId, deptId)
                .eq(status != null, User::getStatus, status)
                .orderByDesc(User::getCreateTime);

        Page<User> userPage = userMapper.selectPage(page, wrapper);
        Page<UserVo> voPage = new Page<>(userPage.getCurrent(), userPage.getSize(), userPage.getTotal());

        voPage.setRecords(userPage.getRecords().stream().map(user -> {
            UserVo vo = convertToUserVo(user);
            return vo;
        }).collect(Collectors.toList()));

        return voPage;
    }

    @Override
    public UserVo getUserById(Long userId) {
        User user = userMapper.selectById(userId);
        if (user == null) {
            throw new BusinessException(404, "用户不存在");
        }
        return convertToUserVo(user);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void createUser(UserDto dto) {
        User existUser = userMapper.selectOne(
                new LambdaQueryWrapper<User>().eq(User::getUsername, dto.getUsername()));
        if (existUser != null) {
            throw new BusinessException("用户名已存在");
        }

        User user = new User();
        user.setUsername(dto.getUsername());
        user.setPassword(passwordEncoder.encode(dto.getPassword() != null ? dto.getPassword() : "123456"));
        user.setRealName(dto.getRealName());
        user.setPhone(dto.getPhone());
        user.setEmail(dto.getEmail());
        user.setDeptId(dto.getDeptId());
        user.setPostId(dto.getPostId());
        user.setAvatar(dto.getAvatar());
        user.setStatus(dto.getStatus() != null ? dto.getStatus() : 1);

        userMapper.insert(user);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateUser(UserDto dto) {
        if (dto.getUserId() == null) {
            throw new BusinessException("用户ID不能为空");
        }

        User user = userMapper.selectById(dto.getUserId());
        if (user == null) {
            throw new BusinessException(404, "用户不存在");
        }

        if (dto.getUsername() != null && !dto.getUsername().equals(user.getUsername())) {
            User existUser = userMapper.selectOne(
                    new LambdaQueryWrapper<User>().eq(User::getUsername, dto.getUsername()));
            if (existUser != null) {
                throw new BusinessException("用户名已存在");
            }
        }

        user.setUsername(dto.getUsername());
        if (dto.getPassword() != null && !dto.getPassword().isEmpty()) {
            user.setPassword(passwordEncoder.encode(dto.getPassword()));
        }
        user.setRealName(dto.getRealName());
        user.setPhone(dto.getPhone());
        user.setEmail(dto.getEmail());
        user.setDeptId(dto.getDeptId());
        user.setPostId(dto.getPostId());
        user.setAvatar(dto.getAvatar());
        user.setStatus(dto.getStatus());

        userMapper.updateById(user);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteUser(Long userId) {
        User user = userMapper.selectById(userId);
        if (user == null) {
            throw new BusinessException(404, "用户不存在");
        }

        if (userId == 1L) {
            throw new BusinessException("不能删除系统管理员");
        }

        userMapper.deleteById(userId);
    }

    @Override
    public Page<DeptVo> getDeptList(Integer pageNum, Integer pageSize, String deptName, Integer status) {
        Page<Dept> page = new Page<>(pageNum, pageSize);

        LambdaQueryWrapper<Dept> wrapper = new LambdaQueryWrapper<>();
        wrapper.like(deptName != null && !deptName.isEmpty(), Dept::getDeptName, deptName)
                .eq(status != null, Dept::getStatus, status)
                .orderByAsc(Dept::getOrderNum);

        Page<Dept> deptPage = deptMapper.selectPage(page, wrapper);
        Page<DeptVo> voPage = new Page<>(deptPage.getCurrent(), deptPage.getSize(), deptPage.getTotal());

        voPage.setRecords(deptPage.getRecords().stream().map(dept -> {
            DeptVo vo = new DeptVo();
            org.springframework.beans.BeanUtils.copyProperties(dept, vo);

            if (dept.getParentId() != null && dept.getParentId() != 0) {
                Dept parentDept = deptMapper.selectById(dept.getParentId());
                if (parentDept != null) {
                    vo.setParentName(parentDept.getDeptName());
                }
            }

            return vo;
        }).collect(Collectors.toList()));

        return voPage;
    }

    @Override
    public DeptVo getDeptById(Long deptId) {
        Dept dept = deptMapper.selectById(deptId);
        if (dept == null) {
            throw new BusinessException(404, "部门不存在");
        }

        DeptVo vo = new DeptVo();
        org.springframework.beans.BeanUtils.copyProperties(dept, vo);

        if (dept.getParentId() != null && dept.getParentId() != 0) {
            Dept parentDept = deptMapper.selectById(dept.getParentId());
            if (parentDept != null) {
                vo.setParentName(parentDept.getDeptName());
            }
        }

        return vo;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void createDept(DeptDto dto) {
        if (dto.getParentId() != null && dto.getParentId() != 0) {
            Dept parentDept = deptMapper.selectById(dto.getParentId());
            if (parentDept == null) {
                throw new BusinessException("父部门不存在");
            }
        }

        Dept dept = new Dept();
        dept.setParentId(dto.getParentId() != null ? dto.getParentId() : 0L);
        dept.setDeptName(dto.getDeptName());
        dept.setLeader(dto.getLeader());
        dept.setPhone(dto.getPhone());
        dept.setEmail(dto.getEmail());
        dept.setOrderNum(dto.getOrderNum() != null ? dto.getOrderNum() : 0);
        dept.setStatus(dto.getStatus() != null ? dto.getStatus() : 1);

        deptMapper.insert(dept);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateDept(DeptDto dto) {
        if (dto.getDeptId() == null) {
            throw new BusinessException("部门ID不能为空");
        }

        Dept dept = deptMapper.selectById(dto.getDeptId());
        if (dept == null) {
            throw new BusinessException(404, "部门不存在");
        }

        if (dto.getParentId() != null && dto.getParentId() != 0) {
            if (dto.getParentId().equals(dto.getDeptId())) {
                throw new BusinessException("父部门不能是自己");
            }

            Dept parentDept = deptMapper.selectById(dto.getParentId());
            if (parentDept == null) {
                throw new BusinessException("父部门不存在");
            }
        }

        dept.setParentId(dto.getParentId() != null ? dto.getParentId() : 0L);
        dept.setDeptName(dto.getDeptName());
        dept.setLeader(dto.getLeader());
        dept.setPhone(dto.getPhone());
        dept.setEmail(dto.getEmail());
        dept.setOrderNum(dto.getOrderNum());
        dept.setStatus(dto.getStatus());

        deptMapper.updateById(dept);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteDept(Long deptId) {
        Dept dept = deptMapper.selectById(deptId);
        if (dept == null) {
            throw new BusinessException(404, "部门不存在");
        }

        Long childCount = deptMapper.selectCount(
                new LambdaQueryWrapper<Dept>().eq(Dept::getParentId, deptId));
        if (childCount > 0) {
            throw new BusinessException("存在子部门，无法删除");
        }

        Long userCount = userMapper.selectCount(
                new LambdaQueryWrapper<User>().eq(User::getDeptId, deptId));
        if (userCount > 0) {
            throw new BusinessException("部门下存在用户，无法删除");
        }

        deptMapper.deleteById(deptId);
    }

    @Override
    public Page<PostVo> getPostList(Integer pageNum, Integer pageSize, String postName, Integer status) {
        Page<Post> page = new Page<>(pageNum, pageSize);

        LambdaQueryWrapper<Post> wrapper = new LambdaQueryWrapper<>();
        wrapper.like(postName != null && !postName.isEmpty(), Post::getPostName, postName)
                .eq(status != null, Post::getStatus, status)
                .orderByAsc(Post::getPostSort);

        Page<Post> postPage = postMapper.selectPage(page, wrapper);
        Page<PostVo> voPage = new Page<>(postPage.getCurrent(), postPage.getSize(), postPage.getTotal());

        voPage.setRecords(postPage.getRecords().stream()
            .map(this::convertToPostVo)
            .collect(Collectors.toList()));

        return voPage;
    }

    @Override
    public PostVo getPostById(Long postId) {
        Post post = postMapper.selectById(postId);
        if (post == null) {
            throw new BusinessException(404, "岗位不存在");
        }

        return convertToPostVo(post);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void createPost(PostDto dto) {
        Post existPost = postMapper.selectOne(
                new LambdaQueryWrapper<Post>().eq(Post::getPostCode, dto.getPostCode()));
        if (existPost != null) {
            throw new BusinessException("岗位编码已存在");
        }

        Post post = new Post();
        post.setPostCode(dto.getPostCode());
        post.setPostName(dto.getPostName());
        post.setPostSort(dto.getPostSort() != null ? dto.getPostSort() : 0);
        post.setStatus(dto.getStatus() != null ? dto.getStatus() : 1);

        postMapper.insert(post);
        savePostPermissions(post.getPostId(), dto.getPermissionIds());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updatePost(PostDto dto) {
        if (dto.getPostId() == null) {
            throw new BusinessException("岗位ID不能为空");
        }

        Post post = postMapper.selectById(dto.getPostId());
        if (post == null) {
            throw new BusinessException(404, "岗位不存在");
        }

        if (dto.getPostCode() != null && !dto.getPostCode().equals(post.getPostCode())) {
            Post existPost = postMapper.selectOne(
                    new LambdaQueryWrapper<Post>().eq(Post::getPostCode, dto.getPostCode()));
            if (existPost != null) {
                throw new BusinessException("岗位编码已存在");
            }
        }

        post.setPostCode(dto.getPostCode());
        post.setPostName(dto.getPostName());
        post.setPostSort(dto.getPostSort());
        post.setStatus(dto.getStatus());

        postMapper.updateById(post);
        savePostPermissions(post.getPostId(), dto.getPermissionIds());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deletePost(Long postId) {
        Post post = postMapper.selectById(postId);
        if (post == null) {
            throw new BusinessException(404, "岗位不存在");
        }

        Long userCount = userMapper.selectCount(
                new LambdaQueryWrapper<User>().eq(User::getPostId, postId));
        if (userCount > 0) {
            throw new BusinessException("岗位下存在用户，无法删除");
        }

        permissionMapper.deletePostPermissions(postId);
        postMapper.deleteById(postId);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void assignPost(AssignPostDto dto) {
        User user = userMapper.selectById(dto.getUserId());
        if (user == null) {
            throw new BusinessException(404, "用户不存在");
        }

        Post post = postMapper.selectById(dto.getPostId());
        if (post == null) {
            throw new BusinessException(404, "岗位不存在");
        }

        if (dto.getDeptId() != null) {
            Dept dept = deptMapper.selectById(dto.getDeptId());
            if (dept == null) {
                throw new BusinessException(404, "部门不存在");
            }
            user.setDeptId(dto.getDeptId());
        }
        user.setPostId(dto.getPostId());
        userMapper.updateById(user);
    }

    @Override
    public List<DeptVo> getAllDepts() {
        List<Dept> depts = deptMapper.selectList(
                new LambdaQueryWrapper<Dept>().eq(Dept::getStatus, 1).orderByAsc(Dept::getOrderNum));
        return depts.stream().map(dept -> {
            DeptVo vo = new DeptVo();
            org.springframework.beans.BeanUtils.copyProperties(dept, vo);
            return vo;
        }).collect(Collectors.toList());
    }

    @Override
    public List<PostVo> getAllPosts() {
        List<Post> posts = postMapper.selectList(
                new LambdaQueryWrapper<Post>().eq(Post::getStatus, 1).orderByAsc(Post::getPostSort));
        return posts.stream()
            .map(this::convertToPostVo)
            .collect(Collectors.toList());
    }

        @Override
        public List<PermissionVo> getAllPermissions() {
        List<Permission> permissions = permissionMapper.selectList(
            new LambdaQueryWrapper<Permission>().eq(Permission::getStatus, 1).eq(Permission::getDelFlag, 0));
        return permissions.stream()
            .map(this::convertToPermissionVo)
            .collect(Collectors.toList());
        }

        @Override
        public ReportSummaryVo getReportSummary(String month) {
        YearMonth yearMonth = resolveYearMonth(month);
        LocalDateTime start = yearMonth.atDay(1).atStartOfDay();
        LocalDateTime end = yearMonth.plusMonths(1).atDay(1).atStartOfDay();

        ReportSummaryVo vo = new ReportSummaryVo();
        vo.setMonth(yearMonth.toString());

        List<User> activeUsers = userMapper.selectList(
            new LambdaQueryWrapper<User>().eq(User::getStatus, 1));

        Map<Long, Long> deptCount = activeUsers.stream()
            .filter(user -> user.getDeptId() != null)
            .collect(Collectors.groupingBy(User::getDeptId, Collectors.counting()));
        Map<Long, Long> postCount = activeUsers.stream()
            .filter(user -> user.getPostId() != null)
            .collect(Collectors.groupingBy(User::getPostId, Collectors.counting()));

        Set<Long> deptIds = new HashSet<>(deptCount.keySet());

        List<Application> monthApps = applicationMapper.selectList(
            new LambdaQueryWrapper<Application>()
                .ge(Application::getSubmitTime, start)
                .lt(Application::getSubmitTime, end));

        monthApps.stream()
            .map(Application::getDeptId)
            .filter(Objects::nonNull)
            .forEach(deptIds::add);

        Map<Long, Dept> deptMap = deptIds.isEmpty()
            ? Collections.emptyMap()
            : deptMapper.selectBatchIds(deptIds).stream()
                .filter(Objects::nonNull)
                .collect(Collectors.toMap(Dept::getDeptId, dept -> dept));

        List<ReportSummaryVo.DeptEmployeeStat> deptStats = deptCount.entrySet().stream()
            .map(entry -> {
                ReportSummaryVo.DeptEmployeeStat stat = new ReportSummaryVo.DeptEmployeeStat();
                stat.setDeptId(entry.getKey());
                stat.setDeptName(deptMap.containsKey(entry.getKey())
                    ? deptMap.get(entry.getKey()).getDeptName()
                    : "未分配");
                stat.setUserCount(entry.getValue());
                return stat;
            })
            .sorted(Comparator.comparingLong(ReportSummaryVo.DeptEmployeeStat::getUserCount).reversed())
            .collect(Collectors.toList());
        vo.setDeptEmployeeStats(deptStats);

        Map<Long, Post> postMap = postCount.isEmpty()
            ? Collections.emptyMap()
            : postMapper.selectBatchIds(postCount.keySet()).stream()
                .filter(Objects::nonNull)
                .collect(Collectors.toMap(Post::getPostId, post -> post));
        List<ReportSummaryVo.PostEmployeeStat> postStats = postCount.entrySet().stream()
            .map(entry -> {
                ReportSummaryVo.PostEmployeeStat stat = new ReportSummaryVo.PostEmployeeStat();
                stat.setPostId(entry.getKey());
                stat.setPostName(postMap.containsKey(entry.getKey())
                    ? postMap.get(entry.getKey()).getPostName()
                    : "未分配");
                stat.setUserCount(entry.getValue());
                return stat;
            })
            .sorted(Comparator.comparingLong(ReportSummaryVo.PostEmployeeStat::getUserCount).reversed())
            .collect(Collectors.toList());
        vo.setPostEmployeeStats(postStats);

        ReportSummaryVo.ApplicationStats appStats = new ReportSummaryVo.ApplicationStats();
        appStats.setLeave(buildApplicationTypeStat(monthApps, "leave"));
        appStats.setReimburse(buildApplicationTypeStat(monthApps, "reimburse"));
        vo.setApplicationStats(appStats);

        vo.setDeptMonthlyStats(buildDeptMonthlyStats(monthApps, deptMap));

        return vo;
        }

        @Override
        public ReportDeptDetailVo getDeptReportDetail(Long deptId, String month) {
        if (deptId == null) {
            throw new BusinessException("部门ID不能为空");
        }

        Dept dept = deptMapper.selectById(deptId);
        if (dept == null) {
            throw new BusinessException(404, "部门不存在");
        }

        YearMonth yearMonth = resolveYearMonth(month);
        LocalDateTime start = yearMonth.atDay(1).atStartOfDay();
        LocalDateTime end = yearMonth.plusMonths(1).atDay(1).atStartOfDay();

        List<User> deptUsers = userMapper.selectList(
            new LambdaQueryWrapper<User>().eq(User::getDeptId, deptId));
        Map<Long, User> userMap = deptUsers.stream()
            .collect(Collectors.toMap(User::getUserId, user -> user));

        List<Application> deptApps = applicationMapper.selectList(
            new LambdaQueryWrapper<Application>()
                .eq(Application::getDeptId, deptId)
                .ge(Application::getSubmitTime, start)
                .lt(Application::getSubmitTime, end));

        Set<Long> applicantIds = deptApps.stream()
                .map(Application::getApplicantId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        if (!applicantIds.isEmpty()) {
            Set<Long> missingUserIds = applicantIds.stream()
                    .filter(userId -> !userMap.containsKey(userId))
                    .collect(Collectors.toSet());
            if (!missingUserIds.isEmpty()) {
                List<User> applicants = userMapper.selectBatchIds(missingUserIds);
                applicants.stream()
                        .filter(Objects::nonNull)
                        .forEach(user -> userMap.put(user.getUserId(), user));
            }
        }

        ReportDeptDetailVo vo = new ReportDeptDetailVo();
        vo.setDeptId(deptId);
        vo.setDeptName(dept.getDeptName());
        vo.setMonth(yearMonth.toString());
        Collection<User> statUsers = userMap.values().stream()
                .filter(user -> (user.getDeptId() != null && user.getDeptId().equals(deptId))
                        || applicantIds.contains(user.getUserId()))
                .collect(Collectors.toList());
        vo.setDeptPostStats(buildDeptPostStats(statUsers));
        vo.setLeaveDetails(buildMemberLeaveDetails(deptApps, userMap));
        vo.setReimburseDetails(buildMemberReimburseDetails(deptApps, userMap));

        return vo;
        }

    private List<ReportDeptDetailVo.DeptPostStat> buildDeptPostStats(Collection<User> users) {
        if (users == null || users.isEmpty()) {
            return Collections.emptyList();
        }

        Map<Long, Long> grouped = users.stream()
                .collect(Collectors.groupingBy(user -> user.getPostId() == null ? -1L : user.getPostId(), Collectors.counting()));

        Set<Long> postIds = grouped.keySet().stream()
                .filter(postId -> postId != -1L)
                .collect(Collectors.toSet());

        Map<Long, Post> postMap = postIds.isEmpty()
                ? Collections.emptyMap()
                : postMapper.selectBatchIds(postIds).stream()
                        .filter(Objects::nonNull)
                        .collect(Collectors.toMap(Post::getPostId, post -> post));

        List<ReportDeptDetailVo.DeptPostStat> stats = new ArrayList<>();
        for (Map.Entry<Long, Long> entry : grouped.entrySet()) {
            ReportDeptDetailVo.DeptPostStat stat = new ReportDeptDetailVo.DeptPostStat();
            if (entry.getKey().equals(-1L)) {
                stat.setPostId(null);
                stat.setPostName("未分配岗位");
            } else {
                stat.setPostId(entry.getKey());
                Post post = postMap.get(entry.getKey());
                stat.setPostName(post != null ? post.getPostName() : "未知岗位");
            }
            stat.setUserCount(entry.getValue());
            stats.add(stat);
        }

        stats.sort(Comparator.comparingLong(ReportDeptDetailVo.DeptPostStat::getUserCount).reversed());
        return stats;
    }

    private ReportSummaryVo.ApplicationTypeStat buildApplicationTypeStat(List<Application> applications, String appType) {
        long total = applications.stream()
                .filter(app -> appType.equals(app.getAppType()))
                .count();
        long approved = applications.stream()
                .filter(app -> appType.equals(app.getAppType()) && Integer.valueOf(3).equals(app.getStatus()))
                .count();

        ReportSummaryVo.ApplicationTypeStat stat = new ReportSummaryVo.ApplicationTypeStat();
        stat.setTotal(total);
        stat.setApproved(approved);
        stat.setApprovalRate(calculateApprovalRate(total, approved));
        return stat;
    }

    private List<ReportSummaryVo.DeptMonthlyStat> buildDeptMonthlyStats(List<Application> applications, Map<Long, Dept> deptMap) {
        if (applications.isEmpty()) {
            return Collections.emptyList();
        }

        Map<Long, List<Application>> grouped = applications.stream()
                .filter(app -> app.getDeptId() != null)
                .collect(Collectors.groupingBy(Application::getDeptId));

        List<ReportSummaryVo.DeptMonthlyStat> stats = new ArrayList<>();
        for (Map.Entry<Long, List<Application>> entry : grouped.entrySet()) {
            List<Application> deptApps = entry.getValue();
            long leaveTotal = deptApps.stream().filter(app -> "leave".equals(app.getAppType())).count();
            long reimburseTotal = deptApps.stream().filter(app -> "reimburse".equals(app.getAppType())).count();
            long approved = deptApps.stream().filter(app -> Integer.valueOf(3).equals(app.getStatus())).count();

            ReportSummaryVo.DeptMonthlyStat stat = new ReportSummaryVo.DeptMonthlyStat();
            stat.setDeptId(entry.getKey());
            stat.setDeptName(deptMap.containsKey(entry.getKey())
                    ? deptMap.get(entry.getKey()).getDeptName()
                    : "未分配");
            stat.setLeaveTotal(leaveTotal);
            stat.setReimburseTotal(reimburseTotal);
            stat.setApprovalRate(calculateApprovalRate(deptApps.size(), approved));
            stats.add(stat);
        }

        stats.sort(Comparator.comparingLong((ReportSummaryVo.DeptMonthlyStat stat) ->
            stat.getLeaveTotal() + stat.getReimburseTotal()).reversed());
        return stats;
    }

    private List<ReportDeptDetailVo.MemberLeaveDetail> buildMemberLeaveDetails(List<Application> applications, Map<Long, User> userMap) {
        List<Application> leaveApps = applications.stream()
                .filter(app -> "leave".equals(app.getAppType()))
                .collect(Collectors.toList());
        if (leaveApps.isEmpty()) {
            return Collections.emptyList();
        }

        List<Long> appIds = leaveApps.stream().map(Application::getAppId).collect(Collectors.toList());
        Map<Long, LeaveApplication> leaveMap = leaveApplicationMapper.selectList(
                new LambdaQueryWrapper<LeaveApplication>().in(LeaveApplication::getAppId, appIds))
                .stream()
                .collect(Collectors.toMap(LeaveApplication::getAppId, leave -> leave));

        Map<Long, ReportDeptDetailVo.MemberLeaveDetail> detailMap = new HashMap<>();
        for (Application app : leaveApps) {
            LeaveApplication leave = leaveMap.get(app.getAppId());
            if (leave == null) {
                continue;
            }
            ReportDeptDetailVo.MemberLeaveDetail detail = detailMap.computeIfAbsent(app.getApplicantId(), id -> {
                ReportDeptDetailVo.MemberLeaveDetail item = new ReportDeptDetailVo.MemberLeaveDetail();
                item.setUserId(id);
                item.setRealName(userMap.containsKey(id) ? userMap.get(id).getRealName() : "未知");
                item.setTimes(0L);
                item.setDays(BigDecimal.ZERO);
                return item;
            });
            detail.setTimes(detail.getTimes() + 1);
            BigDecimal days = leave.getDays() != null ? leave.getDays() : BigDecimal.ZERO;
            detail.setDays(detail.getDays().add(days));
        }

        return detailMap.values().stream()
                .sorted(Comparator.comparingLong(ReportDeptDetailVo.MemberLeaveDetail::getTimes).reversed())
                .collect(Collectors.toList());
    }

    private List<ReportDeptDetailVo.MemberReimburseDetail> buildMemberReimburseDetails(List<Application> applications, Map<Long, User> userMap) {
        List<Application> reimburseApps = applications.stream()
                .filter(app -> "reimburse".equals(app.getAppType()))
                .collect(Collectors.toList());
        if (reimburseApps.isEmpty()) {
            return Collections.emptyList();
        }

        List<Long> appIds = reimburseApps.stream().map(Application::getAppId).collect(Collectors.toList());
        Map<Long, ReimburseApplication> reimburseMap = reimburseApplicationMapper.selectList(
                new LambdaQueryWrapper<ReimburseApplication>().in(ReimburseApplication::getAppId, appIds))
                .stream()
                .collect(Collectors.toMap(ReimburseApplication::getAppId, reimburse -> reimburse));

        Map<Long, ReportDeptDetailVo.MemberReimburseDetail> detailMap = new HashMap<>();
        for (Application app : reimburseApps) {
            ReimburseApplication reimburse = reimburseMap.get(app.getAppId());
            if (reimburse == null) {
                continue;
            }
            ReportDeptDetailVo.MemberReimburseDetail detail = detailMap.computeIfAbsent(app.getApplicantId(), id -> {
                ReportDeptDetailVo.MemberReimburseDetail item = new ReportDeptDetailVo.MemberReimburseDetail();
                item.setUserId(id);
                item.setRealName(userMap.containsKey(id) ? userMap.get(id).getRealName() : "未知");
                item.setTimes(0L);
                item.setAmount(BigDecimal.ZERO);
                return item;
            });
            detail.setTimes(detail.getTimes() + 1);
            BigDecimal amount = reimburse.getAmount() != null ? reimburse.getAmount() : BigDecimal.ZERO;
            detail.setAmount(detail.getAmount().add(amount));
        }

        return detailMap.values().stream()
                .sorted(Comparator.comparingLong(ReportDeptDetailVo.MemberReimburseDetail::getTimes).reversed())
                .collect(Collectors.toList());
    }

    private YearMonth resolveYearMonth(String month) {
        if (month == null || month.isEmpty()) {
            return YearMonth.now();
        }
        try {
            return YearMonth.parse(month);
        } catch (Exception ex) {
            throw new BusinessException("月份格式错误，示例：2026-01");
        }
    }

    private BigDecimal calculateApprovalRate(long total, long approved) {
        if (total == 0) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
        return BigDecimal.valueOf(approved)
                .multiply(BigDecimal.valueOf(100))
                .divide(BigDecimal.valueOf(total), 2, RoundingMode.HALF_UP);
    }

    private void savePostPermissions(Long postId, java.util.List<Long> permissionIds) {
        permissionMapper.deletePostPermissions(postId);
        if (permissionIds == null || permissionIds.isEmpty()) {
            return;
        }

        for (Long permissionId : permissionIds) {
            Permission permission = permissionMapper.selectById(permissionId);
            if (permission == null || permission.getStatus() == null || permission.getStatus() == 0) {
                throw new BusinessException("权限不存在或已禁用");
            }
            permissionMapper.insertPostPermission(postId, permissionId);
        }
    }

    private PostVo convertToPostVo(Post post) {
        PostVo vo = new PostVo();
        org.springframework.beans.BeanUtils.copyProperties(post, vo);
        List<Permission> permissionList = permissionMapper.selectPermissionsByPostId(post.getPostId());
        if (permissionList == null) {
            permissionList = java.util.Collections.emptyList();
        }
        vo.setPermissions(permissionList.stream()
                .map(this::convertToPermissionVo)
                .collect(Collectors.toList()));
        return vo;
    }

    private PermissionVo convertToPermissionVo(Permission permission) {
        PermissionVo vo = new PermissionVo();
        org.springframework.beans.BeanUtils.copyProperties(permission, vo);
        return vo;
    }

    private UserVo convertToUserVo(User user) {
        UserVo vo = new UserVo();
        org.springframework.beans.BeanUtils.copyProperties(user, vo);

        if (user.getDeptId() != null) {
            Dept dept = deptMapper.selectById(user.getDeptId());
            if (dept != null) {
                vo.setDeptName(dept.getDeptName());
            }
        }

        if (user.getPostId() != null) {
            Post post = postMapper.selectById(user.getPostId());
            if (post != null) {
                vo.setPostName(post.getPostName());
            }
        }

        List<String> permissions = java.util.Collections.emptyList();
        if (user.getPostId() != null) {
            List<String> codes = permissionMapper.selectPermissionCodesByPostId(user.getPostId());
            permissions = codes != null ? codes : java.util.Collections.emptyList();
        }
        vo.setPermissions(permissions);

        return vo;
    }
}
