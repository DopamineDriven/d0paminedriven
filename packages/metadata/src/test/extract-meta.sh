#!/bin/bash

input_dir="${1:-.}"
output_dir="${2:-./raw}"

[[ -d "$output_dir" ]] || mkdir -p "$output_dir"

for file in "$input_dir"/*.png; do
  [[ -f "$file" ]] || continue
  filename=$(basename "$file" .png)

  metadata=$(exiftool "$file")

  if [[ -n "$metadata" ]]; then
    echo "$metadata" > "$output_dir/$filename.txt"
    echo "Extracted: $filename"
  else
    echo "No text metadata: $filename"
  fi
done
