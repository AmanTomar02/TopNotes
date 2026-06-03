# 📚 TopNotes Platform — Complete Setup Guide

> **Stack:** Java 21 · Spring Boot 3.2 · Angular 17 · MySQL 8  
> **Author:** TopNotes Dev Team  
> **Version:** 2.0.0

---

## 📋 Table of Contents

1. [What is TopNotes?](#1-what-is-topnotes)
2. [Project Folder Structure](#2-project-folder-structure)
3. [Prerequisites — What to Install First](#3-prerequisites--what-to-install-first)
4. [Local Setup — Backend (Spring Boot)](#4-local-setup--backend-spring-boot)
5. [Local Setup — Frontend (Angular)](#5-local-setup--frontend-angular)
6. [Database Setup + Dummy Data](#6-database-setup--dummy-data)
7. [Test Scenarios — Step by Step](#7-test-scenarios--step-by-step)
8. [Free Hosting — Deploy for Demo/Testing](#8-free-hosting--deploy-for-demotesting)
9. [Postman API Testing Guide](#9-postman-api-testing-guide)
10. [Troubleshooting Common Errors](#10-troubleshooting-common-errors)

---

## 1. What is TopNotes?

TopNotes is a marketplace where:
- **Verified Sellers (Toppers)** upload handwritten PDF notes and earn money
- **Buyers (Students)** purchase and securely view notes inside the browser
- **Admin** manages everything — users, verifications, test config, commission

### Key Features
| Feature | Description |
|---|---|
| Seller Verification | MCQ test + marksheet upload + admin approval |
| Configurable Test | Admin can add/edit/delete questions from UI — no code change |
| Content Protection | No download, no right-click, watermarked PDF |
| Revenue Split | 35% platform / 65% seller (configurable from admin panel) |
| Analytics | Revenue charts for Admin and Seller dashboards |

---

## 2. Project Folder Structure

```
topnotes/
├── backend/                    ← Spring Boot project
│   ├── pom.xml
│   └── src/main/
│       ├── java/com/topnotes/
│       │   ├── config/         (Security, CORS, Swagger, App)
│       │   ├── controller/     (7 controllers)
│       │   ├── dto/            (request + response DTOs)
│       │   ├── entity/         (JPA entities + enums)
│       │   ├── exception/      (global handler + custom)
│       │   ├── repository/     (10 JPA repos)
│       │   ├── security/       (JWT filter, util, user details)
│       │   ├── service/        (interfaces)
│       │   ├── service/impl/   (implementations)
│       │   └── util/           (file upload, constants)
│       └── resources/
│           ├── application.properties
│           └── test_schema_seed.sql
│
└── frontend/                   ← Angular 17 project
    ├── package.json
    ├── angular.json
    ├── tsconfig.json
    └── src/
        ├── index.html
        ├── main.ts
        ├── styles.css
        ├── environments/
        └── app/
            ├── core/           (models, services, guards)
            ├── shared/         (navbar, shared components)
            └── features/       (auth, buyer, seller, admin pages)
```

---

## 3. Prerequisites — What to Install First

### Install these tools before starting:

### A. Java 21 (JDK)
```bash
# Check if already installed
java -version   # Should show: openjdk 21...

# If not installed:
# Windows/Mac → Download from: https://adoptium.net/
# Ubuntu/Debian:
sudo apt install openjdk-21-jdk
```

### B. Maven 3.8+
```bash
mvn -version   # Should show: Apache Maven 3.x.x

# If not installed:
# Windows/Mac → https://maven.apache.org/download.cgi
# Ubuntu:
sudo apt install maven
```

### C. MySQL 8.0
```bash
mysql --version   # Should show: mysql  Ver 8.x.x

# If not installed:
# Windows/Mac → https://dev.mysql.com/downloads/mysql/
# Ubuntu:
sudo apt install mysql-server
sudo mysql_secure_installation
```

### D. Node.js 18+ and Angular CLI
```bash
node -version   # Should show: v18.x.x or v20.x.x
ng version      # Should show: Angular CLI: 17.x.x

# Install Node → https://nodejs.org/en/download
# Install Angular CLI:
npm install -g @angular/cli@17
```

### E. Git
```bash
git --version

# Ubuntu: sudo apt install git
# Windows/Mac → https://git-scm.com/
```

---

## 4. Local Setup — Backend (Spring Boot)

### Step 1: Create the MySQL database

Open MySQL terminal:
```bash
mysql -u root -p
# Enter your MySQL root password
```

Run these SQL commands:
```sql
-- Create database
CREATE DATABASE topnotes_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- Create a dedicated user (safer than using root)
CREATE USER 'topnotes_user'@'localhost' IDENTIFIED BY 'TopNotes@2024';
GRANT ALL PRIVILEGES ON topnotes_db.* TO 'topnotes_user'@'localhost';
FLUSH PRIVILEGES;

-- Verify
SHOW DATABASES LIKE 'topnotes_db';
EXIT;
```

### Step 2: Configure application.properties

Open `backend/src/main/resources/application.properties` and update these lines:

```properties
# ── Change these to match your MySQL setup ──
spring.datasource.url=jdbc:mysql://localhost:3306/topnotes_db?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
spring.datasource.username=topnotes_user
spring.datasource.password=TopNotes@2024

# ── JWT Secret (change this to any long random string) ──
app.jwt.secret=MyTopNotesJwtSecretKeyThatIsAtLeast256BitsLongForSecurity2024

# ── File upload folder (absolute path on your machine) ──
# Windows:
app.file.upload-dir=C:/topnotes-uploads
# Mac/Linux:
app.file.upload-dir=/home/yourusername/topnotes-uploads

# ── Email (Optional for local testing — leave blank to skip) ──
spring.mail.username=
spring.mail.password=
```

### Step 3: Create the upload folder

```bash
# Mac/Linux
mkdir -p ~/topnotes-uploads/{pdfs,thumbnails,marksheets,profiles}

# Windows (Command Prompt)
mkdir C:\topnotes-uploads\pdfs
mkdir C:\topnotes-uploads\thumbnails
mkdir C:\topnotes-uploads\marksheets
mkdir C:\topnotes-uploads\profiles
```

### Step 4: Build and Run

```bash
cd backend

# First build (downloads dependencies — takes 2-3 min first time)
mvn clean install -DskipTests

# Run the server
mvn spring-boot:run
```

**You should see this in the console:**
```
  .   ____          _            __ _ _
 /\\ / ___'_ __ _ _(_)_ __  __ _ \ \ \ \
...
Started TopNotesApplication in 8.234 seconds
```

Backend is now running at: **http://localhost:8080/api**

Swagger UI at: **http://localhost:8080/api/swagger-ui.html**

### Step 5: Create the Admin user

The admin user cannot self-register — create via SQL:

```bash
mysql -u topnotes_user -p topnotes_db
```

First, generate a BCrypt hash for "Admin@123":
```sql
-- We'll use this pre-generated hash for "Admin@123"
-- (BCrypt 12 rounds)
INSERT INTO users (
  email, password, full_name, role, status,
  is_verified, test_passed, marksheet_approved,
  created_at, updated_at
) VALUES (
  'admin@topnotes.com',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4QA1iBFW7G',
  'Platform Admin',
  'ADMIN',
  'ACTIVE',
  1, 1, 1,
  NOW(), NOW()
);
```

> **Admin credentials:**  
> Email: `admin@topnotes.com`  
> Password: `Admin@123`

---

## 5. Local Setup — Frontend (Angular)

### Step 1: Install dependencies

```bash
cd frontend
npm install
# Takes 2-3 minutes first time
```

### Step 2: Verify environment file

Open `frontend/src/environments/environment.ts`:
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api'  // ← must match backend port
};
```

### Step 3: Start the dev server

```bash
ng serve --open
# OR
npm start
```

This auto-opens **http://localhost:4200** in your browser.

### Common pages:
| URL | Description |
|---|---|
| `http://localhost:4200/register` | Register new account |
| `http://localhost:4200/login` | Login |
| `http://localhost:4200/browse` | Browse notes (public) |
| `http://localhost:4200/seller/dashboard` | Seller dashboard |
| `http://localhost:4200/admin/dashboard` | Admin dashboard |
| `http://localhost:4200/admin/test` | Test Manager |

---

## 6. Database Setup + Dummy Data

Run the seed SQL below to populate your database with realistic test data.

### 6A. Load Test Questions + Config

```bash
mysql -u topnotes_user -p topnotes_db < backend/src/main/resources/test_schema_seed.sql
```

### 6B. Full Dummy Data SQL

Copy and paste this into MySQL:

```sql
-- ═══════════════════════════════════════════════════════
-- TOPNOTES DUMMY DATA — Run AFTER starting the backend
-- (JPA creates tables automatically on first run)
-- ═══════════════════════════════════════════════════════

-- ─── 1. PLATFORM CONFIG ───────────────────────────────
INSERT IGNORE INTO platform_config (config_key, config_value, description, updated_at) VALUES
('platform-commission-percent', '35', 'Platform revenue cut in %',       NOW()),
('seller-commission-percent',   '65', 'Seller revenue share in %',       NOW()),
('test-pass-score-percent',     '70', 'Minimum test score to pass',      NOW()),
('currency',                    'INR','Display currency',                 NOW());

-- ─── 2. USERS ─────────────────────────────────────────
-- Password for ALL users below = "Test@1234"
-- BCrypt hash (12 rounds) of "Test@1234":
SET @pwd = '$2a$12$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';

-- Admin (already inserted above — skip if duplicate)
INSERT IGNORE INTO users (email, password, full_name, role, status, is_verified, test_passed, marksheet_approved, created_at, updated_at)
VALUES ('admin@topnotes.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4QA1iBFW7G', 'Platform Admin', 'ADMIN', 'ACTIVE', 1, 1, 1, NOW(), NOW());

-- ── Verified Sellers (can upload notes) ──
INSERT IGNORE INTO users (email, password, full_name, phone, role, status, is_verified, test_passed, test_score, marksheet_approved, class_level, institution, bio, created_at, updated_at) VALUES
('aarav.patel@email.com',    @pwd, 'Aarav Patel',    '9876543210', 'SELLER', 'ACTIVE', 1, 1, 90, 1, 'Class 12', 'IIT Bombay',  'JEE 2023 AIR 47. Physics and Maths topper. I believe in concept clarity over rote learning.', NOW(), NOW()),
('priya.sharma@email.com',   @pwd, 'Priya Sharma',   '9876543211', 'SELLER', 'ACTIVE', 1, 1, 85, 1, 'Class 12', 'AIIMS Delhi', 'NEET 2023 AIR 89. Biology and Chemistry expert. CBSE 98.4% scorer.', NOW(), NOW()),
('rahul.gupta@email.com',    @pwd, 'Rahul Gupta',    '9876543212', 'SELLER', 'ACTIVE', 1, 1, 80, 1, 'Class 12', 'IIT Delhi',   'JEE Advanced 2023 AIR 212. Maths enthusiast. 3 years teaching experience.', NOW(), NOW()),
('meera.iyer@email.com',     @pwd, 'Meera Iyer',     '9876543213', 'SELLER', 'ACTIVE', 1, 1, 95, 1, 'Class 11', 'NIT Trichy',  'Class 12 CBSE 97.8%. Passionate about Chemistry and making complex topics simple.', NOW(), NOW()),
('vikram.nair@email.com',    @pwd, 'Vikram Nair',    '9876543214', 'SELLER', 'ACTIVE', 1, 1, 88, 1, 'Dropper',  'IIT Madras',  'IIT Madras 2022 alumnus. Specializes in Physics for JEE. AIR 156.', NOW(), NOW()),

-- ── Unverified Seller (for testing verification flow) ──
('karan.mehta@email.com',    @pwd, 'Karan Mehta',    '9876543215', 'SELLER', 'ACTIVE', 0, 0, NULL, 0, 'Class 12', 'DPS Delhi',   'Aspiring seller — verification pending.', NOW(), NOW()),

-- ── Seller: Test passed but marksheet not uploaded ──
('sneha.patel@email.com',    @pwd, 'Sneha Patel',    '9876543216', 'SELLER', 'ACTIVE', 0, 1, 75,  0, 'Class 12', 'Kendriya Vidyalaya', 'Test passed, waiting to upload marksheet.', NOW(), NOW()),

-- ── Seller: Marksheet uploaded, awaiting admin approval ──
('arjun.singh@email.com',    @pwd, 'Arjun Singh',    '9876543217', 'SELLER', 'ACTIVE', 0, 1, 82,  0, 'Dropper',  'Resonance Kota', 'Marksheet uploaded, admin review pending.', NOW(), NOW()),

-- ── Buyers ──
('rohan.kumar@email.com',    @pwd, 'Rohan Kumar',    '9876543220', 'BUYER',  'ACTIVE', 0, 0, NULL, 0, NULL, NULL, NULL, NOW(), NOW()),
('anita.roy@email.com',      @pwd, 'Anita Roy',      '9876543221', 'BUYER',  'ACTIVE', 0, 0, NULL, 0, NULL, NULL, NULL, NOW(), NOW()),
('dev.krishna@email.com',    @pwd, 'Dev Krishna',    '9876543222', 'BUYER',  'ACTIVE', 0, 0, NULL, 0, NULL, NULL, NULL, NOW(), NOW()),
('pooja.verma@email.com',    @pwd, 'Pooja Verma',    '9876543223', 'BUYER',  'ACTIVE', 0, 0, NULL, 0, NULL, NULL, NULL, NOW(), NOW()),
('amit.joshi@email.com',     @pwd, 'Amit Joshi',     '9876543224', 'BUYER',  'ACTIVE', 0, 0, NULL, 0, NULL, NULL, NULL, NOW(), NOW()),
('nisha.mishra@email.com',   @pwd, 'Nisha Mishra',   '9876543225', 'BUYER',  'ACTIVE', 0, 0, NULL, 0, NULL, NULL, NULL, NOW(), NOW()),
('tanvir.ahmed@email.com',   @pwd, 'Tanvir Ahmed',   '9876543226', 'BUYER',  'SUSPENDED', 0, 0, NULL, 0, NULL, NULL, NULL, NOW(), NOW());

-- ─── 3. NOTES ─────────────────────────────────────────
-- Get seller IDs
SET @s1 = (SELECT id FROM users WHERE email = 'aarav.patel@email.com');
SET @s2 = (SELECT id FROM users WHERE email = 'priya.sharma@email.com');
SET @s3 = (SELECT id FROM users WHERE email = 'rahul.gupta@email.com');
SET @s4 = (SELECT id FROM users WHERE email = 'meera.iyer@email.com');
SET @s5 = (SELECT id FROM users WHERE email = 'vikram.nair@email.com');

INSERT INTO notes (title, description, class_level, subject, exam_type, price, pdf_url, preview_url, total_pages, status, purchase_count, average_rating, review_count, seller_id, created_at, updated_at) VALUES

-- Aarav's notes (Physics)
('Electrostatics & Capacitors — Complete JEE Notes',
 'Comprehensive handwritten notes covering Coulomb Law, Electric Field, Electric Potential, Capacitors with dielectric, energy stored in capacitor. Includes 40+ solved numericals, all important formulas with derivations. Perfect for JEE Advanced preparation.',
 'Class 12', 'Physics', 'JEE_ADVANCED', 249.00,
 '/pdfs/dummy1.pdf', '/pdfs/dummy1.pdf', 34, 'ACTIVE', 127, 4.90, 42, @s1, NOW(), NOW()),

('Magnetism & Electromagnetic Induction',
 'Detailed notes on Biot-Savart law, Ampere law, Faraday law, Lenz law, self and mutual inductance. All derivations step by step with memory tricks. 35+ solved problems from previous JEE papers.',
 'Class 12', 'Physics', 'JEE_MAIN', 199.00,
 '/pdfs/dummy2.pdf', '/pdfs/dummy2.pdf', 28, 'ACTIVE', 89, 4.70, 31, @s1, NOW(), NOW()),

('Modern Physics — Photoelectric Effect to Nuclear Physics',
 'Complete modern physics from photoelectric effect, de Broglie wavelength, Bohr model, X-rays, nuclear fission and fusion. Includes important graphs and derivations.',
 'Class 12', 'Physics', 'BOARD', 179.00,
 '/pdfs/dummy3.pdf', '/pdfs/dummy3.pdf', 22, 'ACTIVE', 64, 4.80, 19, @s1, NOW(), NOW()),

-- Priya's notes (Biology + Chemistry)
('Human Physiology — Complete NEET Notes',
 'All body systems covered: Digestive, Respiratory, Circulatory, Excretory, Nervous, Endocrine. Fully labeled diagrams drawn by hand, important hormones table, disease comparison charts. Highest-yield topics for NEET highlighted.',
 'Class 12', 'Biology', 'NEET', 229.00,
 '/pdfs/dummy4.pdf', '/pdfs/dummy4.pdf', 46, 'ACTIVE', 198, 5.00, 67, @s2, NOW(), NOW()),

('Plant Kingdom & Animal Kingdom — Classification Notes',
 'Complete classification with characteristics, examples and differences. Includes bryophytes, pteridophytes, gymnosperms, angiosperms, all animal phyla with diagrams. NCERT-aligned with extra NEET tips.',
 'Class 11', 'Biology', 'NEET', 189.00,
 '/pdfs/dummy5.pdf', '/pdfs/dummy5.pdf', 73, 'ACTIVE', 142, 4.80, 48, @s2, NOW(), NOW()),

('Organic Chemistry — Reactions & Mechanisms Handbook',
 'All name reactions with mechanism: Aldol, Cannizzaro, Williamson, Grignard, Clemmensen, etc. Color-coded by reaction type, reagent summary tables. Best for last-minute NEET/JEE revision.',
 'Class 12', 'Chemistry', 'NEET', 219.00,
 '/pdfs/dummy6.pdf', '/pdfs/dummy6.pdf', 91, 'ACTIVE', 213, 4.90, 72, @s2, NOW(), NOW()),

-- Rahul's notes (Maths)
('Integration Techniques — Complete JEE Maths',
 'All integration methods: by parts, substitution, partial fractions, trigonometric, reduction formulae. 100+ solved examples from JEE Mains and Advanced. Includes standard results you must memorize.',
 'Class 12', 'Mathematics', 'JEE_MAIN', 199.00,
 '/pdfs/dummy7.pdf', '/pdfs/dummy7.pdf', 39, 'ACTIVE', 108, 4.60, 35, @s3, NOW(), NOW()),

('3D Geometry & Vectors — JEE Notes',
 'Direction cosines, equation of line and plane in 3D, distance formula, angle between planes, vectors dot and cross product applications. All JEE previous year questions solved.',
 'Class 12', 'Mathematics', 'JEE_ADVANCED', 219.00,
 '/pdfs/dummy8.pdf', '/pdfs/dummy8.pdf', 31, 'ACTIVE', 56, 4.70, 22, @s3, NOW(), NOW()),

('Trigonometry — Formulae & Problem-Solving Tricks',
 'All trigonometric identities, inverse trig, general solutions, heights and distances. Includes quick tricks for multiple choice questions and important graph shapes.',
 'Class 11', 'Mathematics', 'BOARD', 159.00,
 '/pdfs/dummy9.pdf', '/pdfs/dummy9.pdf', 24, 'ACTIVE', 47, 4.50, 18, @s3, NOW(), NOW()),

-- Meera's notes (Chemistry)
('Chemical Bonding & Molecular Structure',
 'VSEPR theory, hybridization sp/sp2/sp3, MO theory with bond order, dipole moment, hydrogen bonding, van der Waals forces. Beautiful handmade diagrams with 3D structures.',
 'Class 11', 'Chemistry', 'NEET', 169.00,
 '/pdfs/dummy10.pdf', '/pdfs/dummy10.pdf', 28, 'ACTIVE', 81, 4.80, 29, @s4, NOW(), NOW()),

('Electrochemistry — Complete Notes',
 'Galvanic cells, electrode potential, Nernst equation, electrolysis, Faraday laws, corrosion, fuel cells. All derivations with worked examples.',
 'Class 12', 'Chemistry', 'JEE_MAIN', 189.00,
 '/pdfs/dummy11.pdf', '/pdfs/dummy11.pdf', 33, 'ACTIVE', 62, 4.70, 24, @s4, NOW(), NOW()),

-- Vikram's notes (Physics)
('Mechanics — JEE Complete Notes (Kinematics to Rotational Motion)',
 'From kinematics basics to rotational dynamics. Newton laws applications, circular motion, friction, work energy theorem, momentum, collisions, rotational motion with moment of inertia. 120+ solved problems.',
 'Class 11', 'Physics', 'JEE_ADVANCED', 279.00,
 '/pdfs/dummy12.pdf', '/pdfs/dummy12.pdf', 52, 'ACTIVE', 167, 4.80, 58, @s5, NOW(), NOW()),

('Waves & Thermodynamics',
 'SHM, waves on string, sound waves, Doppler effect, thermodynamics laws, Carnot engine, kinetic theory. All graphs explained with physical meaning.',
 'Class 11', 'Physics', 'JEE_MAIN', 199.00,
 '/pdfs/dummy13.pdf', '/pdfs/dummy13.pdf', 38, 'ACTIVE', 94, 4.60, 33, @s5, NOW(), NOW()),

-- Inactive note (for testing)
('Old Chemistry Notes — Deleted',
 'These notes have been removed.', 'Class 12', 'Chemistry', 'BOARD', 99.00,
 '/pdfs/dummy14.pdf', '/pdfs/dummy14.pdf', 10, 'DELETED', 3, 0.00, 0, @s4, NOW(), NOW());

-- ─── 4. PURCHASES ─────────────────────────────────────
SET @b1 = (SELECT id FROM users WHERE email = 'rohan.kumar@email.com');
SET @b2 = (SELECT id FROM users WHERE email = 'anita.roy@email.com');
SET @b3 = (SELECT id FROM users WHERE email = 'dev.krishna@email.com');
SET @b4 = (SELECT id FROM users WHERE email = 'pooja.verma@email.com');
SET @b5 = (SELECT id FROM users WHERE email = 'amit.joshi@email.com');

SET @n1  = (SELECT id FROM notes WHERE title LIKE 'Electrostatics%');
SET @n4  = (SELECT id FROM notes WHERE title LIKE 'Human Physiology%');
SET @n6  = (SELECT id FROM notes WHERE title LIKE 'Organic Chemistry%');
SET @n7  = (SELECT id FROM notes WHERE title LIKE 'Integration%');
SET @n12 = (SELECT id FROM notes WHERE title LIKE 'Mechanics%');

-- Rohan bought Electrostatics and Human Physiology
INSERT INTO purchases (buyer_id, note_id, seller_id, amount, platform_share, seller_share, transaction_id, invoice_number, status, purchased_at) VALUES
(@b1, @n1,  @s1, 249.00, 87.15, 161.85, 'TXN-A1B2C3D4E5F6', 'INV-20240115-A1B2C3', 'COMPLETED', '2024-01-15 10:30:00'),
(@b1, @n4,  @s2, 229.00, 80.15, 148.85, 'TXN-B2C3D4E5F6G7', 'INV-20240116-B2C3D4', 'COMPLETED', '2024-01-16 14:22:00'),
(@b1, @n12, @s5, 279.00, 97.65, 181.35, 'TXN-C3D4E5F6G7H8', 'INV-20240120-C3D4E5', 'COMPLETED', '2024-01-20 09:15:00'),

-- Anita bought Organic Chemistry and Mechanics
(@b2, @n6,  @s2, 219.00, 76.65, 142.35, 'TXN-D4E5F6G7H8I9', 'INV-20240118-D4E5F6', 'COMPLETED', '2024-01-18 16:45:00'),
(@b2, @n12, @s5, 279.00, 97.65, 181.35, 'TXN-E5F6G7H8I9J0', 'INV-20240122-E5F6G7', 'COMPLETED', '2024-01-22 11:30:00'),

-- Dev bought Integration and Electrostatics
(@b3, @n7,  @s3, 199.00, 69.65, 129.35, 'TXN-F6G7H8I9J0K1', 'INV-20240117-F6G7H8', 'COMPLETED', '2024-01-17 13:10:00'),
(@b3, @n1,  @s1, 249.00, 87.15, 161.85, 'TXN-G7H8I9J0K1L2', 'INV-20240119-G7H8I9', 'COMPLETED', '2024-01-19 15:20:00'),

-- Pooja bought Human Physiology
(@b4, @n4,  @s2, 229.00, 80.15, 148.85, 'TXN-H8I9J0K1L2M3', 'INV-20240121-H8I9J0', 'COMPLETED', '2024-01-21 08:45:00'),

-- Amit bought Organic Chemistry
(@b5, @n6,  @s2, 219.00, 76.65, 142.35, 'TXN-I9J0K1L2M3N4', 'INV-20240123-I9J0K1', 'COMPLETED', '2024-01-23 17:30:00');

-- ─── 5. EARNINGS ──────────────────────────────────────
INSERT INTO earnings (seller_id, purchase_id, amount, is_paid, earned_at)
SELECT seller_id, id, seller_share, 0, purchased_at FROM purchases;

-- ─── 6. REVIEWS ───────────────────────────────────────
SET @n1  = (SELECT id FROM notes WHERE title LIKE 'Electrostatics%');
SET @n4  = (SELECT id FROM notes WHERE title LIKE 'Human Physiology%');
SET @n6  = (SELECT id FROM notes WHERE title LIKE 'Organic Chemistry%');
SET @n12 = (SELECT id FROM notes WHERE title LIKE 'Mechanics%');

INSERT INTO reviews (buyer_id, note_id, rating, comment, created_at) VALUES
(@b1, @n1,  5, 'Absolutely brilliant notes! The diagrams are super clear and the explanations are better than my coaching institute. Scored 98 in Physics thanks to these notes!', '2024-01-20 10:00:00'),
(@b3, @n1,  5, 'Best Physics notes I have ever bought. All derivations are crystal clear with color coding. Worth every rupee!', '2024-01-22 14:30:00'),
(@b1, @n4,  5, 'Priya di ke notes are just amazing! Human physiology was my weakest topic but after these notes I scored full marks in NEET mock test. Must buy!', '2024-01-18 16:00:00'),
(@b4, @n4,  5, 'Diagrams are hand-drawn but extremely clear. Better than printed books because you can see the thinking process. Highly recommend for NEET aspirants.', '2024-01-24 09:15:00'),
(@b2, @n6,  5, 'All name reactions in one place with proper mechanism. The color coding makes it very easy to understand. My organic chemistry grade jumped from B to A.', '2024-01-21 15:30:00'),
(@b5, @n6,  4, 'Very good notes overall. Covers all important reactions. Could have included more practice problems but the theory is excellent.', '2024-01-25 11:00:00'),
(@b1, @n12, 5, 'Vikram bhai ke notes are legendary in my coaching batch. Mechanics problems that seemed impossible became easy after reading these. AIR improvement guaranteed!', '2024-01-23 13:00:00'),
(@b2, @n12, 4, 'Excellent coverage of rotational dynamics which is usually weak in textbooks. Some typos here and there but overall very good quality.', '2024-01-26 10:30:00');

-- ─── 7. NOTIFICATIONS ─────────────────────────────────
SET @seller1 = (SELECT id FROM users WHERE email = 'aarav.patel@email.com');
SET @seller2 = (SELECT id FROM users WHERE email = 'priya.sharma@email.com');
SET @buyer1  = (SELECT id FROM users WHERE email = 'rohan.kumar@email.com');

INSERT INTO notifications (user_id, title, message, type, is_read, created_at) VALUES
(@seller1, 'New Sale! 🎉', 'Your note "Electrostatics & Capacitors" was purchased. You earned ₹161.85', 'SALE', 0, NOW()),
(@seller1, 'New Sale! 🎉', 'Your note "Magnetism & Electromagnetic Induction" was purchased. You earned ₹129.35', 'SALE', 1, NOW()),
(@seller2, 'New Sale! 🎉', 'Your note "Human Physiology" was purchased. You earned ₹148.85', 'SALE', 0, NOW()),
(@seller2, 'New Sale! 🎉', 'Your note "Organic Chemistry Reactions" was purchased. You earned ₹142.35', 'SALE', 0, NOW()),
(@buyer1,  'Purchase Confirmed ✅', 'Your purchase of "Electrostatics & Capacitors" is confirmed. Invoice: INV-20240115-A1B2C3', 'PAYMENT', 1, NOW()),
(@buyer1,  'Purchase Confirmed ✅', 'Your purchase of "Human Physiology" is confirmed. Invoice: INV-20240116-B2C3D4', 'PAYMENT', 1, NOW()),
(@seller1, 'Account Approved! 🎓', 'Your seller account has been verified and approved. Start uploading notes!', 'VERIFICATION', 1, NOW()),
(@seller2, 'New Review ⭐', 'Rohan Kumar gave your note "Human Physiology" 5 stars!', 'REVIEW', 0, NOW());

-- ─── 8. VERIFICATION TEST ATTEMPTS ───────────────────
SET @karan = (SELECT id FROM users WHERE email = 'karan.mehta@email.com');
SET @sneha = (SELECT id FROM users WHERE email = 'sneha.patel@email.com');
SET @arjun = (SELECT id FROM users WHERE email = 'arjun.singh@email.com');

-- Karan failed the test
INSERT INTO verification_tests (seller_id, score, total_questions, correct_answers, passed, answers_json, attempted_at) VALUES
(@karan, 50, 10, 5, 0, '{1:A,2:A,3:B,4:B,5:A,6:C,7:A,8:B,9:A,10:C}', NOW());

-- Sneha passed, hasn't uploaded marksheet
INSERT INTO verification_tests (seller_id, score, total_questions, correct_answers, passed, answers_json, attempted_at) VALUES
(@sneha, 75, 10, 7, 1, '{1:A,2:B,3:B,4:B,5:A,6:A,7:B,8:B,9:B,10:B}', NOW());

UPDATE users SET test_passed = 1, test_score = 75 WHERE id = @sneha;

-- Arjun passed and uploaded marksheet
INSERT INTO verification_tests (seller_id, score, total_questions, correct_answers, passed, answers_json, attempted_at) VALUES
(@arjun, 82, 10, 8, 1, '{1:A,2:B,3:B,4:B,5:A,6:A,7:B,8:B,9:B,10:B}', NOW());

UPDATE users SET test_passed = 1, test_score = 82, marksheet_url = '/marksheets/dummy_marksheet.jpg'
WHERE id = @arjun;

-- ════════════════════════════════════════════════════════
-- ALL DUMMY DATA LOADED ✅
-- ════════════════════════════════════════════════════════
SELECT 'Users:'         AS entity, COUNT(*) AS count FROM users    UNION ALL
SELECT 'Notes:',                   COUNT(*)          FROM notes    UNION ALL
SELECT 'Purchases:',               COUNT(*)          FROM purchases UNION ALL
SELECT 'Reviews:',                 COUNT(*)          FROM reviews  UNION ALL
SELECT 'Earnings:',                COUNT(*)          FROM earnings UNION ALL
SELECT 'Notifications:',           COUNT(*)          FROM notifications;
```

---

## 7. Test Scenarios — Step by Step

All test accounts use password: **`Test@1234`**

---

### 🧪 Scenario 1 — Buyer Flow (Rohan Kumar)

**Goal:** Browse notes → Purchase → View securely → Leave review

```
1. Go to http://localhost:4200/login
2. Email: rohan.kumar@email.com
3. Password: Test@1234
4. Click → Browse (see all notes)
5. Click on "Electrostatics & Capacitors" note
6. See first-page preview (blurred/locked)
7. Click "Buy for ₹249"
8. ✅ Purchase successful toast appears
9. Click "Read Notes" → secure viewer opens
10. Try right-click → BLOCKED ✅
11. Try Ctrl+P → BLOCKED ✅
12. See diagonal watermark with your email ✅
13. Go back → Submit a 5-star review ✅
14. Go to My Purchases → see invoice ✅
```

---

### 🧪 Scenario 2 — New Buyer Registration

**Goal:** Register → Browse → Buy note

```
1. Go to http://localhost:4200/register
2. Select "I'm a Student" (BUYER role)
3. Fill: Full Name, Email, Password (min 8 chars)
4. Click "Create Account"
5. Redirect to Browse page ✅
6. Search for "Physics" notes
7. Filter by "Class 12"
8. Purchase any note ✅
```

---

### 🧪 Scenario 3 — Seller Verification Flow (Karan Mehta — FAILED test)

**Goal:** Login → Take test → Fail → Retake → Pass → Upload marksheet

```
1. Login: karan.mehta@email.com / Test@1234
2. Go to /seller/verification
3. See Step 1: Academic Test
4. Note: Previous attempt failed (50% — need 70%)
5. Click "Start Test"
6. Answer all questions (try to pass with 70%+)
   Correct answers: 1→A, 2→B, 3→B, 4→B, 5→A, 6→A, 7→B, 8→B, 9→B, 10→B
7. Click "Submit Answers"
8. If passed → Step 2 appears ✅
9. Upload any image as marksheet
10. See "Awaiting Admin Approval" ✅
```

---

### 🧪 Scenario 4 — Seller Dashboard (Aarav Patel — Verified)

**Goal:** View earnings, see charts, upload new note

```
1. Login: aarav.patel@email.com / Test@1234
2. Go to /seller/dashboard
3. See stats:
   - Total Earnings: ₹323.70 (2 sales × seller share)
   - Chart shows last 30 days revenue
4. Go to /seller/notes
5. See 3 existing notes listed
6. Click "Edit Price" on any note → change to ₹299 → Save ✅
7. Go to /seller/upload
8. Fill form + upload any PDF file
9. Click "Publish Notes" ✅
10. Go back to /seller/notes → new note appears ✅
```

---

### 🧪 Scenario 5 — Admin: Approve a Seller (Arjun Singh)

**Goal:** Admin approves seller who uploaded marksheet

```
1. Login: admin@topnotes.com / Admin@123
2. Go to /admin/dashboard
3. See "1 Pending Approvals" button (Arjun Singh)
4. Click → /admin/verifications
5. See Arjun's card with:
   - ✓ Test Passed (82%)
   - 📄 Marksheet Uploaded
6. Click "✓ Approve"
7. Toast: "Seller approved" ✅
8. Arjun can now log in and upload notes ✅

-- Reject scenario:
-- Type a rejection reason in the text field
-- Click "✕ Reject"
-- Arjun gets notified with the reason ✅
```

---

### 🧪 Scenario 6 — Admin: Configure Test Questions

**Goal:** Add/edit/delete MCQ questions without touching code

```
1. Login as admin
2. Go to /admin/test
3. Click "⚙️ Test Config" tab
4. Change:
   - Pass Score: 60% (easier to pass)
   - Time Limit: 20 minutes
   - Questions Per Test: 5
   - Shuffle Questions: ON
5. Click "Save Configuration" ✅
6. Click "📋 Questions" tab
7. See all 10 existing questions
8. Click "+ Add Question"
9. Fill question + 4 options + mark correct answer
10. Click "Create Question" ✅
11. See new question in list ✅
12. Click ⏸ to disable a question (it won't appear in test) ✅
13. Click "👁 Seller Preview" tab
14. See exactly what sellers will see (no correct answers shown) ✅

-- Now test seller side:
15. Login as karan.mehta@email.com
16. Take test → only 5 questions now, need 60% to pass ✅
```

---

### 🧪 Scenario 7 — Admin: User Management

**Goal:** View all users, suspend/activate

```
1. Login as admin → /admin/users
2. See all users in table
3. Click "Sellers" tab → filter to sellers only
4. Find "Tanvir Ahmed" (status: SUSPENDED)
5. Click "Activate" → status changes to ACTIVE ✅
6. Find any active user → click "Suspend" ✅

-- View by role:
7. Click "Buyers" → see only buyers
8. Click "All Users" → see everyone ✅
```

---

### 🧪 Scenario 8 — Admin: Platform Configuration

**Goal:** Change commission from 35% to 30%

```
1. Login as admin → /admin/config
2. See Revenue Split:
   - Platform: 35% / Seller: 65%
3. Change Platform Commission to 30
4. See split bar animate → Seller: 70% ✅
5. Click "Save Changes"
6. Toast: "Commission updated" ✅
7. Now buy a note as a buyer
8. Check purchase: platformShare = price × 30% ✅
```

---

### 🧪 Scenario 9 — Full End-to-End Test

**Goal:** New seller registers, verifies, uploads note, buyer purchases it

```
SELLER SIDE:
1. Register new account → role = SELLER
2. Go to /seller/verification
3. Take test (correct answers: 1A,2B,3B,4B,5A,6A,7B,8B,9B,10B)
4. Pass test → upload any image as marksheet
5. Wait for admin approval

ADMIN SIDE:
6. Login as admin → /admin/verifications
7. See new seller pending → click Approve

SELLER SIDE:
8. Login back as seller → verification complete!
9. Go to /seller/upload
10. Fill note details + upload PDF
11. Note goes live immediately

BUYER SIDE:
12. Login as buyer → Browse
13. Find the new note
14. Purchase it
15. View it securely ✅
16. Leave a review ✅

SELLER SIDE:
17. Go to dashboard → see new sale + earnings ✅
18. Go to notifications → see sale notification ✅
```

---

## 8. Free Hosting — Deploy for Demo/Testing

### Option A: Railway (Backend) + Vercel (Frontend) — Recommended

#### Step 1: Push to GitHub
```bash
cd topnotes
git init
git add .
git commit -m "feat: TopNotes platform v2.0"

# Create repo at github.com then:
git remote add origin https://github.com/YOUR_USERNAME/topnotes.git
git push -u origin main
```

#### Step 2: Deploy Database on Railway (Free MySQL)
1. Go to **railway.app** → Sign up with GitHub
2. Click **New Project** → **Provision MySQL**
3. Click on the MySQL service → **Variables** tab
4. Note down: `MYSQL_URL`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DB`

#### Step 3: Deploy Backend on Railway
1. In Railway → **New Service** → **GitHub Repo** → select your repo
2. Set **Root Directory** = `backend`
3. Add Environment Variables:
```
DB_HOST          = (from MySQL service)
DB_PORT          = 3306
DB_NAME          = railway
DB_USERNAME      = root
DB_PASSWORD      = (from MySQL service)
JWT_SECRET       = TopNotes2024VeryLongSecretKeyMin256BitsForProduction
FRONTEND_URL     = https://your-app.vercel.app
FILE_UPLOAD_DIR  = /app/uploads
PLATFORM_COMMISSION = 35
```
4. Railway auto-detects Maven → deploys automatically
5. Your backend URL: `https://topnotes-backend.up.railway.app/api`

#### Step 4: Deploy Frontend on Vercel
1. Go to **vercel.com** → Sign up with GitHub
2. Click **Add New Project** → select your repo
3. Set **Root Directory** = `frontend`
4. **Build Command** = `npm run build:prod`
5. **Output Directory** = `dist/topnotes-frontend/browser`
6. Add Environment variable: *(not needed — URL is in build)*
7. Before deploying, update `frontend/src/environments/environment.prod.ts`:
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://topnotes-backend.up.railway.app/api'
};
```
8. Commit and push → Vercel auto-deploys
9. Your app URL: `https://topnotes-xyz.vercel.app`

#### Step 5: Update Railway FRONTEND_URL
In Railway → Backend service → Variables:
```
FRONTEND_URL = https://topnotes-xyz.vercel.app
```

#### Step 6: Load dummy data on Railway
```bash
# Connect to Railway MySQL:
railway connect mysql
# Then paste the dummy SQL from section 6B
```

---

### Option B: Render (Backend, 100% Free)

1. Go to **render.com** → New Web Service → GitHub
2. **Root Directory** = `backend`
3. **Build Command** = `cd backend && mvn clean package -DskipTests`
4. **Start Command** = `java -jar backend/target/topnotes-backend-1.0.0.jar`
5. Add same environment variables as Railway
6. Note: Render free tier **sleeps after 15 min** of inactivity (use Railway for always-on)

---

### Option C: Local Network Sharing (Instant Demo)

Share your local setup with teammates on the same WiFi:

```bash
# Find your local IP
# Windows: ipconfig
# Mac/Linux: ifconfig | grep "inet "

# Start Angular on network
ng serve --host 0.0.0.0 --port 4200

# Update environment.ts to use your IP
apiUrl: 'http://192.168.1.X:8080/api'

# Team members access:
# http://192.168.1.X:4200
```

---

## 9. Postman API Testing Guide

### Download Postman: https://www.postman.com/downloads/

### Base URL: `http://localhost:8080/api`

### Step 1: Set up environment in Postman
- Create new Environment: "TopNotes Local"
- Add variable: `baseUrl` = `http://localhost:8080/api`
- Add variable: `token` = (leave blank — filled after login)

### Step 2: Login and get token
```
POST {{baseUrl}}/auth/login
Content-Type: application/json

{
  "email": "admin@topnotes.com",
  "password": "Admin@123"
}
```
Copy the `token` from response → paste into `token` variable.

### Step 3: All important requests

#### Register
```
POST {{baseUrl}}/auth/register
{
  "fullName": "Test User",
  "email": "testuser@email.com",
  "password": "Test@1234",
  "role": "BUYER"
}
```

#### Browse notes
```
GET {{baseUrl}}/notes
GET {{baseUrl}}/notes?keyword=physics&page=0&size=5
GET {{baseUrl}}/notes?classLevel=Class 12&examType=JEE_MAIN
```

#### Purchase a note (buyer)
```
POST {{baseUrl}}/buyer/purchase/1
Authorization: Bearer {{token}}
```

#### Get seller dashboard
```
GET {{baseUrl}}/seller/dashboard
Authorization: Bearer {{token}}
```

#### Get test questions (seller)
```
GET {{baseUrl}}/seller/verification/test
Authorization: Bearer {{token}}
```

#### Submit test (seller)
```
POST {{baseUrl}}/seller/verification/test/submit
Authorization: Bearer {{token}}
{
  "1": "A",
  "2": "B",
  "3": "B",
  "4": "B",
  "5": "A",
  "6": "A",
  "7": "B",
  "8": "B",
  "9": "B",
  "10": "B"
}
```

#### Admin: Get test config
```
GET {{baseUrl}}/admin/test/config
Authorization: Bearer {{token}}
```

#### Admin: Create test question
```
POST {{baseUrl}}/admin/test/questions
Authorization: Bearer {{token}}
{
  "questionText": "What is the SI unit of electric charge?",
  "subject": "Physics",
  "displayOrder": 11,
  "isActive": true,
  "correctAnswerKey": "B",
  "options": [
    {"optionKey": "A", "optionText": "Ampere"},
    {"optionKey": "B", "optionText": "Coulomb"},
    {"optionKey": "C", "optionText": "Volt"},
    {"optionKey": "D", "optionText": "Watt"}
  ]
}
```

#### Admin: Approve seller
```
POST {{baseUrl}}/admin/verifications/5/approve?approved=true
Authorization: Bearer {{token}}
```

#### Swagger UI (all endpoints with try-it-out):
```
http://localhost:8080/api/swagger-ui.html
```

---

## 10. Troubleshooting Common Errors

### ❌ `Access denied for user 'root'@'localhost'`
**Fix:** Check `DB_USERNAME` and `DB_PASSWORD` in `application.properties`.
```bash
mysql -u root -p   # Test manually
```

### ❌ `Port 8080 already in use`
**Fix:** Kill the process or change port:
```bash
# Find what is using 8080:
lsof -i :8080       # Mac/Linux
netstat -ano | findstr :8080  # Windows

# Or change port in application.properties:
server.port=8090
```

### ❌ `ng serve` fails — `Cannot find module @angular/core`
**Fix:**
```bash
rm -rf node_modules package-lock.json
npm install
ng serve
```

### ❌ `CORS blocked` in browser console
**Fix:** In `application.properties`:
```properties
app.cors.allowed-origins=http://localhost:4200
```
Make sure Angular is running on exactly port 4200.

### ❌ PDF upload fails
**Fix:** Create upload directory and check path:
```bash
mkdir -p ~/topnotes-uploads/{pdfs,thumbnails,marksheets,profiles}
```
In `application.properties`:
```properties
app.file.upload-dir=/home/YOURUSERNAME/topnotes-uploads
```

### ❌ `JWT token expired` errors
**Fix:** Just log out and log in again. Token expires after 24 hours.
To extend: in `application.properties`:
```properties
app.jwt.expiration-ms=604800000   # 7 days
```

### ❌ Swagger UI shows 403 Forbidden
**Fix:** In `SecurityConfig.java`, check these paths are allowed:
```java
.requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()
```

### ❌ `mvn clean install` fails with compilation errors
**Fix:**
```bash
# Check Java version
java -version  # Must be 21

# Force re-download dependencies
mvn clean install -U -DskipTests
```

### ❌ Angular build error: `Cannot find name 'Chart'`
**Fix:** chart.js is already in package.json. Run:
```bash
npm install
```

---

## 📋 Quick Reference — All Test Accounts

| Role | Email | Password | Status |
|---|---|---|---|
| **Admin** | admin@topnotes.com | Admin@123 | Active |
| **Seller** (verified) | aarav.patel@email.com | Test@1234 | Verified ✅ |
| **Seller** (verified) | priya.sharma@email.com | Test@1234 | Verified ✅ |
| **Seller** (verified) | rahul.gupta@email.com | Test@1234 | Verified ✅ |
| **Seller** (verified) | meera.iyer@email.com | Test@1234 | Verified ✅ |
| **Seller** (verified) | vikram.nair@email.com | Test@1234 | Verified ✅ |
| **Seller** (test failed) | karan.mehta@email.com | Test@1234 | Unverified |
| **Seller** (test passed, no marksheet) | sneha.patel@email.com | Test@1234 | Unverified |
| **Seller** (pending admin approval) | arjun.singh@email.com | Test@1234 | Pending ⏳ |
| **Buyer** | rohan.kumar@email.com | Test@1234 | Active (3 purchases) |
| **Buyer** | anita.roy@email.com | Test@1234 | Active (2 purchases) |
| **Buyer** | dev.krishna@email.com | Test@1234 | Active (2 purchases) |
| **Buyer** | pooja.verma@email.com | Test@1234 | Active (1 purchase) |
| **Buyer** | amit.joshi@email.com | Test@1234 | Active (1 purchase) |
| **Buyer** | nisha.mishra@email.com | Test@1234 | Active (no purchases) |
| **Buyer** (suspended) | tanvir.ahmed@email.com | Test@1234 | Suspended 🚫 |

---

## 🎯 Test MCQ Correct Answers

For passing the verification test (need 70%+):

| Q# | Question | Correct Answer |
|---|---|---|
| 1 | Derivative of x²? | **A** (2x) |
| 2 | Solve 2x+5=15 | **B** (x=5) |
| 3 | Newton's first law | **B** (Law of Inertia) |
| 4 | Formula of water | **B** (H₂O) |
| 5 | Value of π | **A** (3.14) |
| 6 | Speed of light | **A** (3×10⁸ m/s) |
| 7 | Discovery of India | **B** (Nehru) |
| 8 | Photosynthesis produces | **B** (O₂ and Glucose) |
| 9 | Ohm's Law V= | **B** (IR) |
| 10 | Capital of India | **B** (New Delhi) |

**Minimum correct = 7/10 (70%)** → Answers 1A, 2B, 3B, 4B, 5A, 6A, 7B, 8B, 9B, 10B

---

*TopNotes Platform · Built with Spring Boot 3.2 + Angular 17 · MIT License*
