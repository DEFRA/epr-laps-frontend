import json
# File paths
json_file_path = 'locale-en.json'            # Original JSON file
replacement_file_path = 'data-cy.csv'  # File with new values (one per line)
output_file_path = 'locale-cy.json'  # Output file

# Load the original JSON data
with open(json_file_path, 'r') as json_file:
    data = json.load(json_file)

# Load the replacement values line by line
with open(replacement_file_path, 'r') as replacement_file:
    replacements = [line.strip() for line in replacement_file.readlines()]

# Replace values in the JSON data
for i, key in enumerate(data.keys()):
    if i < len(replacements):
        data[key] = replacements[i]

# Save the updated JSON data to a new file
with open(output_file_path, 'w') as output_file:
    json.dump(data, output_file, indent=4)

print(f"Updated JSON data has been saved to {output_file_path}.")
