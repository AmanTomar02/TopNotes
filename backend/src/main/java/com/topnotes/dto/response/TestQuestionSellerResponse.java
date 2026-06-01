package com.topnotes.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

/**
 * Seller-facing test question — correct answer is STRIPPED.
 * Options may be shuffled based on TestConfig.shuffleOptions.
 */
@Getter @Builder
public class TestQuestionSellerResponse {
    private Long   id;
    private String questionText;
    private String subject;
    private List<OptionItem> options;

    @Getter @Builder
    public static class OptionItem {
        private String optionKey;
        private String optionText;
        // isCorrect intentionally omitted
    }
}
