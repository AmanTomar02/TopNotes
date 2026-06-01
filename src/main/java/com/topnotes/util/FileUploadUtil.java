package com.topnotes.util;

import com.topnotes.exception.BadRequestException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.List;
import java.util.UUID;

/**
 * Handles all file I/O for the platform:
 * PDF notes, thumbnail images, and marksheet uploads.
 * Files are stored under {@code app.file.upload-dir} on the local filesystem.
 * In production, swap {@link #storeFile} to write to S3/Cloudinary instead.
 */
@Component
@Slf4j
public class FileUploadUtil {

    @Value("${app.file.upload-dir}")
    private String uploadDir;

    @Value("${app.file.max-pdf-size-bytes}")
    private long maxPdfSizeBytes;

    @Value("${app.file.max-image-size-bytes}")
    private long maxImageSizeBytes;

    private static final List<String> ALLOWED_PDF_TYPES   = List.of("application/pdf");
    private static final List<String> ALLOWED_IMAGE_TYPES = List.of("image/jpeg", "image/png", "image/webp");

    // ── Public API ────────────────────────────────────────────

    /** Validates and stores a PDF. Returns relative URL path. */
    public String storePdf(MultipartFile file) throws IOException {
        validateFile(file, ALLOWED_PDF_TYPES, maxPdfSizeBytes, "PDF");
        return storeFile(file, AppConstants.FOLDER_PDFS);
    }

    /** Validates and stores a thumbnail image. Returns relative URL path. */
    public String storeThumbnail(MultipartFile file) throws IOException {
        validateFile(file, ALLOWED_IMAGE_TYPES, maxImageSizeBytes, "thumbnail image");
        return storeFile(file, AppConstants.FOLDER_THUMBNAILS);
    }

    /** Validates and stores a marksheet image. Returns relative URL path. */
    public String storeMarksheet(MultipartFile file) throws IOException {
        validateFile(file, ALLOWED_IMAGE_TYPES, maxImageSizeBytes, "marksheet image");
        return storeFile(file, AppConstants.FOLDER_MARKSHEETS);
    }

    /** Validates and stores a profile image. Returns relative URL path. */
    public String storeProfileImage(MultipartFile file) throws IOException {
        validateFile(file, ALLOWED_IMAGE_TYPES, maxImageSizeBytes, "profile image");
        return storeFile(file, AppConstants.FOLDER_PROFILES);
    }

    /** Reads raw file bytes for serving PDF content inline. */
    public byte[] readFileBytes(String relativeUrl) throws IOException {
        Path path = buildAbsolutePath(relativeUrl);
        if (!Files.exists(path)) {
            throw new BadRequestException("File not found: " + relativeUrl);
        }
        return Files.readAllBytes(path);
    }

    /** Silently deletes a file; logs a warning if deletion fails. */
    public void deleteFile(String relativeUrl) {
        if (relativeUrl == null || relativeUrl.isBlank()) return;
        try {
            Files.deleteIfExists(buildAbsolutePath(relativeUrl));
            log.debug("Deleted file: {}", relativeUrl);
        } catch (IOException e) {
            log.warn("Could not delete file '{}': {}", relativeUrl, e.getMessage());
        }
    }

    // ── Internal helpers ──────────────────────────────────────

    /** Stores a file and returns the relative URL: /{subfolder}/{uuid}.{ext} */
    private String storeFile(MultipartFile file, String subfolder) throws IOException {
        Path directory = Path.of(uploadDir, subfolder);
        Files.createDirectories(directory);

        String   ext      = extractExtension(file.getOriginalFilename());
        String   filename = UUID.randomUUID() + "." + ext;
        Path     target   = directory.resolve(filename);

        Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
        log.info("Stored file: {}", target);
        return "/" + subfolder + "/" + filename;
    }

    private void validateFile(MultipartFile file,
                              List<String>  allowedTypes,
                              long          maxSize,
                              String        typeName) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException(typeName + " file is empty or missing");
        }
        if (!allowedTypes.contains(file.getContentType())) {
            throw new BadRequestException(
                    "Invalid " + typeName + " format. Allowed: " + allowedTypes);
        }
        if (file.getSize() > maxSize) {
            throw new BadRequestException(
                    typeName + " exceeds the maximum allowed size of "
                    + (maxSize / 1_048_576) + " MB");
        }
    }

    private Path buildAbsolutePath(String relativeUrl) {
        // Strip leading slash and resolve against base dir
        String cleaned = relativeUrl.startsWith("/")
                ? relativeUrl.substring(1)
                : relativeUrl;
        return Path.of(uploadDir).resolve(cleaned);
    }

    private String extractExtension(String filename) {
        if (filename == null || !filename.contains(".")) return "bin";
        return filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
    }
}
