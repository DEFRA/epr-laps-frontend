````md
# Localisation Workflow Documentation

## Overview

This document outlines the process for generating English and Welsh locale files for the application using provided content and translation sources.

---

## 📘 English Content Workflow

### Source

- Provided by the **User Centred Design team** in an Excel file.

### Step 1: Prepare CSV

- Convert the Excel content to `data-en.csv`.
- Ensure each individual word or sentence is on a **single line**.

### Step 2: Generate Locale File

Run the following script in the terminal:

```bash
.\generate-en-locale-file.py
```
````

### Script Functionality

- **Sanitize text**
- **Remove duplicate lines**
- **Output**: `locale-en.json` with `'key': 'value'` pairs

---

## 🏴 Welsh Content Workflow

### Source

- Provided by the **Welsh Translation Team**.
- Until available, use **Google Translate** for approximate translations.

### Step 1: Prepare CSV

- Create `data-cy.csv` using Welsh translations.

### Step 2: Generate Locale File

Run the following script in the terminal:

```bash
.\generate-cy-local-file.py
```

### Script Functionality

- Uses `locale-en.json` as a template to maintain consistent `'key'` values.
- Replaces English text with Welsh content from `data-cy.csv`.
- **Output**: `locale-cy.json`

---

## ✅ TODOs

- [ ] Check for additional characters to remove when creating keys (e.g. `(`).
- [ ] Ensure Welsh special characters (e.g. `Ffôn`) are correctly encoded and do not break the output (e.g. avoid `Ff\u00c3\u00b4n`).

---

## 🛠️ Notes

- All scripts should be run from the root directory using the terminal or command line.
- Ensure Python is installed and accessible via `python` or `python3`.
