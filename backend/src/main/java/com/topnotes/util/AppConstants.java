package com.topnotes.util;

/**
 * Application-wide string and numeric constants.
 * Avoids magic values scattered across the codebase.
 */
public final class AppConstants {

    private AppConstants() { /* utility class — no instantiation */ }

    // ── Pagination defaults ───────────────────────────────────
    public static final int  DEFAULT_PAGE_NUMBER = 0;
    public static final int  DEFAULT_PAGE_SIZE   = 12;
    public static final int  MAX_PAGE_SIZE       = 100;
    public static final String DEFAULT_SORT_BY   = "createdAt";
    public static final String DEFAULT_SORT_DIR  = "desc";

    // ── File sub-folders (relative to upload-dir) ─────────────
    public static final String FOLDER_PDFS        = "pdfs";
    public static final String FOLDER_THUMBNAILS  = "thumbnails";
    public static final String FOLDER_MARKSHEETS  = "marksheets";
    public static final String FOLDER_PROFILES    = "profiles";

    // ── Platform config keys ──────────────────────────────────
    public static final String CONFIG_PLATFORM_COMMISSION = "platform-commission-percent";
    public static final String CONFIG_SELLER_COMMISSION   = "seller-commission-percent";
    public static final String CONFIG_TEST_PASS_SCORE     = "test-pass-score-percent";

    // ── Transaction prefixes ──────────────────────────────────
    public static final String TXN_PREFIX     = "TXN-";
    public static final String INVOICE_PREFIX = "INV-";
}
