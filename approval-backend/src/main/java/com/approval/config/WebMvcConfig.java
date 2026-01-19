package com.approval.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.StringUtils;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
@RequiredArgsConstructor
public class WebMvcConfig implements WebMvcConfigurer {

    private final FileStorageProperties fileStorageProperties;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String uploadPath = fileStorageProperties.getUploadPath();
        if (!StringUtils.hasText(uploadPath)) {
            uploadPath = "upload";
        }
        Path path = Paths.get(uploadPath).toAbsolutePath().normalize();
        String location = path.toUri().toString();
        registry.addResourceHandler("/upload/**")
                .addResourceLocations(location);
    }
}
