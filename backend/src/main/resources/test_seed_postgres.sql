INSERT INTO test_config
    (pass_score_percent, time_limit_minutes, max_attempts, questions_per_test,
     shuffle_questions, shuffle_options, is_active, updated_at)
SELECT 70, 30, 0, 10, TRUE, FALSE, TRUE, NOW()
WHERE NOT EXISTS (SELECT 1 FROM test_config);

WITH q AS (
    INSERT INTO test_questions (question_text, subject, display_order, is_active, created_at, updated_at)
    VALUES ('What is the derivative of x^2?', 'Mathematics', 1, TRUE, NOW(), NOW())
    RETURNING id
)
INSERT INTO test_options (question_id, option_key, option_text, is_correct)
SELECT id, 'A', '2x', TRUE FROM q UNION ALL
SELECT id, 'B', 'x^2', FALSE FROM q UNION ALL
SELECT id, 'C', 'x', FALSE FROM q UNION ALL
SELECT id, 'D', '2', FALSE FROM q;

WITH q AS (
    INSERT INTO test_questions (question_text, subject, display_order, is_active, created_at, updated_at)
    VALUES ('Solve: 2x + 5 = 15', 'Mathematics', 2, TRUE, NOW(), NOW())
    RETURNING id
)
INSERT INTO test_options (question_id, option_key, option_text, is_correct)
SELECT id, 'A', 'x = 3', FALSE FROM q UNION ALL
SELECT id, 'B', 'x = 5', TRUE FROM q UNION ALL
SELECT id, 'C', 'x = 10', FALSE FROM q UNION ALL
SELECT id, 'D', 'x = 7', FALSE FROM q;

WITH q AS (
    INSERT INTO test_questions (question_text, subject, display_order, is_active, created_at, updated_at)
    VALUES ('Newton''s First Law is also known as?', 'Physics', 3, TRUE, NOW(), NOW())
    RETURNING id
)
INSERT INTO test_options (question_id, option_key, option_text, is_correct)
SELECT id, 'A', 'Law of Force (F = ma)', FALSE FROM q UNION ALL
SELECT id, 'B', 'Law of Inertia', TRUE FROM q UNION ALL
SELECT id, 'C', 'Law of Gravitation', FALSE FROM q UNION ALL
SELECT id, 'D', 'Law of Action-Reaction', FALSE FROM q;

WITH q AS (
    INSERT INTO test_questions (question_text, subject, display_order, is_active, created_at, updated_at)
    VALUES ('What is the chemical formula of water?', 'Chemistry', 4, TRUE, NOW(), NOW())
    RETURNING id
)
INSERT INTO test_options (question_id, option_key, option_text, is_correct)
SELECT id, 'A', 'H2O2', FALSE FROM q UNION ALL
SELECT id, 'B', 'H2O', TRUE FROM q UNION ALL
SELECT id, 'C', 'HO', FALSE FROM q UNION ALL
SELECT id, 'D', 'H3O', FALSE FROM q;

WITH q AS (
    INSERT INTO test_questions (question_text, subject, display_order, is_active, created_at, updated_at)
    VALUES ('Approximate value of pi?', 'Mathematics', 5, TRUE, NOW(), NOW())
    RETURNING id
)
INSERT INTO test_options (question_id, option_key, option_text, is_correct)
SELECT id, 'A', '3.14', TRUE FROM q UNION ALL
SELECT id, 'B', '2.71', FALSE FROM q UNION ALL
SELECT id, 'C', '1.41', FALSE FROM q UNION ALL
SELECT id, 'D', '1.73', FALSE FROM q;

WITH q AS (
    INSERT INTO test_questions (question_text, subject, display_order, is_active, created_at, updated_at)
    VALUES ('Speed of light in vacuum?', 'Physics', 6, TRUE, NOW(), NOW())
    RETURNING id
)
INSERT INTO test_options (question_id, option_key, option_text, is_correct)
SELECT id, 'A', '3 x 10^8 m/s', TRUE FROM q UNION ALL
SELECT id, 'B', '3 x 10^6 m/s', FALSE FROM q UNION ALL
SELECT id, 'C', '3 x 10^10 m/s', FALSE FROM q UNION ALL
SELECT id, 'D', '3 x 10^4 m/s', FALSE FROM q;

WITH q AS (
    INSERT INTO test_questions (question_text, subject, display_order, is_active, created_at, updated_at)
    VALUES ('Who wrote "The Discovery of India"?', 'History', 7, TRUE, NOW(), NOW())
    RETURNING id
)
INSERT INTO test_options (question_id, option_key, option_text, is_correct)
SELECT id, 'A', 'Mahatma Gandhi', FALSE FROM q UNION ALL
SELECT id, 'B', 'Jawaharlal Nehru', TRUE FROM q UNION ALL
SELECT id, 'C', 'Subhas Chandra Bose', FALSE FROM q UNION ALL
SELECT id, 'D', 'Sardar Patel', FALSE FROM q;

WITH q AS (
    INSERT INTO test_questions (question_text, subject, display_order, is_active, created_at, updated_at)
    VALUES ('Photosynthesis primarily produces?', 'Biology', 8, TRUE, NOW(), NOW())
    RETURNING id
)
INSERT INTO test_options (question_id, option_key, option_text, is_correct)
SELECT id, 'A', 'CO2 and H2O', FALSE FROM q UNION ALL
SELECT id, 'B', 'O2 and glucose', TRUE FROM q UNION ALL
SELECT id, 'C', 'N2 and O2', FALSE FROM q UNION ALL
SELECT id, 'D', 'H2 and CO2', FALSE FROM q;

WITH q AS (
    INSERT INTO test_questions (question_text, subject, display_order, is_active, created_at, updated_at)
    VALUES ('According to Ohm''s Law, V equals?', 'Physics', 9, TRUE, NOW(), NOW())
    RETURNING id
)
INSERT INTO test_options (question_id, option_key, option_text, is_correct)
SELECT id, 'A', 'I / R', FALSE FROM q UNION ALL
SELECT id, 'B', 'I x R', TRUE FROM q UNION ALL
SELECT id, 'C', 'I + R', FALSE FROM q UNION ALL
SELECT id, 'D', 'I - R', FALSE FROM q;

WITH q AS (
    INSERT INTO test_questions (question_text, subject, display_order, is_active, created_at, updated_at)
    VALUES ('What is the capital of India?', 'General Knowledge', 10, TRUE, NOW(), NOW())
    RETURNING id
)
INSERT INTO test_options (question_id, option_key, option_text, is_correct)
SELECT id, 'A', 'Mumbai', FALSE FROM q UNION ALL
SELECT id, 'B', 'New Delhi', TRUE FROM q UNION ALL
SELECT id, 'C', 'Kolkata', FALSE FROM q UNION ALL
SELECT id, 'D', 'Chennai', FALSE FROM q;
