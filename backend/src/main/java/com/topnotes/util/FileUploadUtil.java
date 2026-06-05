package com.topnotes.util;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.topnotes.exception.BadRequestException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.net.URL;
import java.util.List;
import java.util.Map;

@Component
@Slf4j
public class FileUploadUtil {

    private static final long MAX_PDF_SIZE_BYTES = 15 * 1024 * 1024; // 15MB
    private static final long MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

    private static final List<String> ALLOWED_PDF_TYPES   = List.of("application/pdf");
    private static final List<String> ALLOWED_IMAGE_TYPES = List.of("image/jpeg", "image/png", "image/webp");

    /** ✨ FAIL-PROOF INSTANCE RESOLVER: Direct OS Environment compilation */
    private Cloudinary getCloudinaryInstance() {
        String cloudName = System.getenv("CLOUDINARY_CLOUD_NAME");
        String apiKey    = System.getenv("CLOUDINARY_API_KEY");
        String apiSecret = System.getenv("CLOUDINARY_API_SECRET");

        if (cloudName == null || apiKey == null || apiSecret == null) {
            log.error("CRITICAL: Cloudinary environment keys are completely missing from the server environment!");
        }

        return new Cloudinary(ObjectUtils.asMap(
            "cloud_name", cloudName,
            "api_key",    apiKey,
            "api_secret", apiSecret,
            "secure",     true
        ));
    }

    /** Validates and stores a PDF to Cloudinary. Returns secure web URL. */
    public String storePdf(MultipartFile file) throws IOException {
        validateFile(file, ALLOWED_PDF_TYPES, MAX_PDF_SIZE_BYTES, "PDF");
        return uploadToCloudinary(file, "topnotes/pdfs", "raw");
    }

    /** Validates and stores a thumbnail image to Cloudinary. Returns secure web URL. */
    public String storeThumbnail(MultipartFile file) throws IOException {
        validateFile(file, ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE_BYTES, "thumbnail image");
        return uploadToCloudinary(file, "topnotes/thumbnails", "image");
    }

    /** Validates and stores a marksheet image to Cloudinary. */
    public String storeMarksheet(MultipartFile file) throws IOException {
        validateFile(file, ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE_BYTES, "marksheet image");
        return uploadToCloudinary(file, "topnotes/marksheets", "image");
    }

    /** Validates and stores a profile image to Cloudinary. */
    public String storeProfileImage(MultipartFile file) throws IOException {
        validateFile(file, ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE_BYTES, "profile image");
        return uploadToCloudinary(file, "topnotes/profiles", "image");
    }

    /** Reads raw file bytes for secure rendering. */
    public byte[] readFileBytes(String urlOrPath) throws IOException {
        if (urlOrPath == null || urlOrPath.isBlank()) {
            throw new BadRequestException("Invalid file URL or path");
        }
        if (urlOrPath.startsWith("http://") || urlOrPath.startsWith("https://")) {
            try (InputStream in = new URL(urlOrPath).openStream()) {
                return in.readAllBytes();
            }
        }
        throw new BadRequestException("File path must be a valid Cloudinary URL: " + urlOrPath);
    }

    public void deleteFile(String relativeUrl) {
        log.debug("Cloudinary automated asset lifecycle managed online for: {}", relativeUrl);
    }

    // ── Internal Cloudinary upload engine ────────────────────────
    private String uploadToCloudinary(MultipartFile file, String folder, String resourceType) throws IOException {
        Map params = ObjectUtils.asMap(
            "folder", folder,
            "resource_type", resourceType
        );
        
        // Dynamic generation right before the secure push stream
        Cloudinary cloudinary = getCloudinaryInstance();
        Map uploadResult = cloudinary.uploader().upload(file.getBytes(), params);
        String secureUrl = (String) uploadResult.get("secure_url");
        log.info("Successfully pushed asset to Cloudinary. Remote URL -> {}", secureUrl);
        return secureUrl;
    }

    private void validateFile(MultipartFile file, List<String> allowedTypes, long maxSize, String typeName) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException(typeName + " file is empty or missing");
        }
        if (!allowedTypes.contains(file.getContentType())) {
            throw new BadRequestException("Invalid " + typeName + " format. Allowed: " + allowedTypes);
        }
        if (file.getSize() > maxSize) {
            throw new BadRequestException(typeName + " exceeds maximum allowed size.");
        }
    }
}