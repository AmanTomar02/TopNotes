package com.topnotes.util;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.topnotes.exception.BadRequestException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URL;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Handles all file I/O for the platform using Cloudinary Free Tier.
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class FileUploadUtil {

    private final Cloudinary cloudinary;

    @Value("${app.file.max-pdf-size-bytes}")
    private long maxPdfSizeBytes;

    @Value("${app.file.max-image-size-bytes}")
    private long maxImageSizeBytes;

    private static final List<String> ALLOWED_PDF_TYPES   = List.of("application/pdf");
    private static final List<String> ALLOWED_IMAGE_TYPES = List.of("image/jpeg", "image/png", "image/webp");

    public String storePdf(MultipartFile file) throws IOException {
        validateFile(file, ALLOWED_PDF_TYPES, maxPdfSizeBytes, "PDF");
        // PDFs ko "raw" format mein upload karna zaroori hai Cloudinary par
        return uploadToCloudinary(file, AppConstants.FOLDER_PDFS, "raw");
    }

    public String storeThumbnail(MultipartFile file) throws IOException {
        validateFile(file, ALLOWED_IMAGE_TYPES, maxImageSizeBytes, "thumbnail image");
        return uploadToCloudinary(file, AppConstants.FOLDER_THUMBNAILS, "image");
    }

    public String storeMarksheet(MultipartFile file) throws IOException {
        validateFile(file, ALLOWED_IMAGE_TYPES, maxImageSizeBytes, "marksheet image");
        return uploadToCloudinary(file, AppConstants.FOLDER_MARKSHEETS, "image");
    }

    public String storeProfileImage(MultipartFile file) throws IOException {
        validateFile(file, ALLOWED_IMAGE_TYPES, maxImageSizeBytes, "profile image");
        return uploadToCloudinary(file, AppConstants.FOLDER_PROFILES, "image");
    }

    /** Cloudinary URL se file bytes read karke frontend ko securely serve karta hai */
    public byte[] readFileBytes(String fileUrl) throws IOException {
        if (fileUrl == null || fileUrl.isBlank()) {
            throw new BadRequestException("File URL is missing");
        }
        try {
            return new URL(fileUrl).openStream().readAllBytes();
        } catch (Exception e) {
            log.error("Error reading file from Cloudinary: {}", fileUrl, e);
            throw new BadRequestException("File not found on Cloud Server");
        }
    }

    public void deleteFile(String fileUrl) {
        if (fileUrl == null || fileUrl.isBlank()) return;
        try {
            String publicId = extractPublicId(fileUrl);
            if(publicId != null) {
                // Determine resource type: if it's a PDF, Cloudinary stores it as raw.
                String resourceType = fileUrl.endsWith(".pdf") ? "raw" : "image";
                cloudinary.uploader().destroy(publicId, ObjectUtils.asMap("resource_type", resourceType));
                log.debug("Deleted file from Cloudinary: {}", publicId);
            }
        } catch (IOException e) {
            log.warn("Could not delete file '{}': {}", fileUrl, e.getMessage());
        }
    }

    private String uploadToCloudinary(MultipartFile file, String folder, String resourceType) throws IOException {
        String filename = UUID.randomUUID().toString();
        Map uploadResult = cloudinary.uploader().upload(file.getBytes(),
                ObjectUtils.asMap(
                        "folder", "topnotes/" + folder,
                        "public_id", filename,
                        "resource_type", resourceType
                ));
        // Return secure (HTTPS) URL of the uploaded file
        return uploadResult.get("secure_url").toString();
    }

    private void validateFile(MultipartFile file, List<String> allowedTypes, long maxSize, String typeName) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException(typeName + " file is empty or missing");
        }
        if (!allowedTypes.contains(file.getContentType())) {
            throw new BadRequestException("Invalid " + typeName + " format. Allowed: " + allowedTypes);
        }
        if (file.getSize() > maxSize) {
            throw new BadRequestException(typeName + " exceeds the maximum allowed size.");
        }
    }

    private String extractPublicId(String url) {
        try {
            int startIndex = url.indexOf("topnotes/");
            int endIndex = url.lastIndexOf(".");
            if (startIndex != -1 && endIndex != -1 && endIndex > startIndex) {
                return url.substring(startIndex, endIndex);
            }
        } catch (Exception e) {
            log.warn("Failed to extract public_id from URL: {}", url);
        }
        return null;
    }
}