package com.approval.module.system.controller;

import com.approval.common.exception.BusinessException;
import com.approval.common.result.Result;
import com.approval.config.FileStorageProperties;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.util.UUID;

@Tag(name = "文件管理")
@RestController
@RequestMapping("/file")
@RequiredArgsConstructor
public class FileController {

    private final FileStorageProperties fileStorageProperties;

    @Operation(summary = "上传文件")
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Result<FileUploadResponse> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "businessType", required = false) String businessType,
            @RequestParam(value = "businessId", required = false) Long businessId) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException("上传文件不能为空");
        }

        LocalDate today = LocalDate.now();
        Path baseDir = Paths.get(resolveUploadPath()).toAbsolutePath().normalize();
        Path targetDir = baseDir.resolve(Paths.get(String.valueOf(today.getYear()), String.format("%02d", today.getMonthValue())));
        try {
            Files.createDirectories(targetDir);
            String originalFilename = file.getOriginalFilename();
            String ext = StringUtils.getFilenameExtension(originalFilename);
            String newName = UUID.randomUUID().toString().replace("-", "");
            if (StringUtils.hasText(ext)) {
                newName = newName + "." + ext.toLowerCase();
            }
            Path targetFile = targetDir.resolve(newName);
            file.transferTo(targetFile.toFile());

            String relativePath = String.format("/upload/%d/%02d/%s", today.getYear(), today.getMonthValue(), newName);
            String fileUrl = ServletUriComponentsBuilder.fromCurrentContextPath()
                    .path(relativePath)
                    .toUriString();

            FileUploadResponse response = new FileUploadResponse();
            response.setFileName(StringUtils.hasText(originalFilename) ? originalFilename : newName);
            response.setFilePath(relativePath);
            response.setFileUrl(fileUrl);
            response.setFileSize(file.getSize());
            response.setContentType(file.getContentType());
            response.setBusinessType(businessType);
            response.setBusinessId(businessId);
            return Result.success(response);
        } catch (IOException e) {
            throw new BusinessException("文件上传失败，请稍后重试");
        }
    }

    private String resolveUploadPath() {
        String uploadPath = fileStorageProperties.getUploadPath();
        return StringUtils.hasText(uploadPath) ? uploadPath : "upload";
    }

    @Data
    public static class FileUploadResponse {
        private String fileName;
        private String filePath;
        private String fileUrl;
        private Long fileSize;
        private String contentType;
        private String businessType;
        private Long businessId;
    }
}
