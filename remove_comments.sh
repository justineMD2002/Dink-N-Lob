#!/bin/bash
# Script to remove comments from TypeScript/TSX files

for file in $(find app components -name "*.tsx" -o -name "*.ts"); do
    echo "Processing: $file"
    
    # Create a temp file
    temp_file="${file}.tmp"
    
    # Remove single-line comments and JSX comments, preserve strings
    sed -e 's|^\s*//.*$||' \
        -e 's|\s*//[^"'"'"']*$||' \
        -e 's|{/\*.*\*/}||g' \
        -e '/^\s*$/d' \
        "$file" > "$temp_file"
    
    # Move temp file back
    mv "$temp_file" "$file"
done

echo "Done removing comments!"
