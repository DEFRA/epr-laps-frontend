import csv
import json
import re

def sanitize_text(text):
    # Replace curly quotes with straight quotes
    text = re.sub(r'[“”]', '"', text)
    text = re.sub(r"[‘’]", "'", text)
    return text

def generate_key(text):
    sanitized = sanitize_text(text)
    key = sanitized.lower().replace(' ', '-')
    return key[:15]

def main():
    input_file = 'data-en.csv'
    output_file = 'locale-en.json'
    unique_lines = set()
    locale_dict = {}

    # Remove any dupliate lines on content
    with open(input_file, newline='', encoding='utf-8') as csvfile:
        reader = csv.reader(csvfile)
        for row in reader:
            if row:
                line = sanitize_text(row[0].strip())
                if line not in unique_lines:
                    unique_lines.add(line)
                    key = generate_key(line)
                    locale_dict[key] = line

    with open(output_file, 'w', encoding='utf-8') as jsonfile:
        json.dump(locale_dict, jsonfile, ensure_ascii=False, indent=4)

    print(f"Locale JSON file '{output_file}' has been generated successfully.")

if __name__ == '__main__':
    main()
