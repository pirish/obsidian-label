#!/bin/bash
# scripts/print-label.sh
# Usage: ./print-label.sh <pdf-path> <printer-name>

PDF_PATH="$1"
PRINTER_NAME="$2"

# Validate inputs
if [ -z "$PDF_PATH" ] || [ -z "$PRINTER_NAME" ]; then
  echo "Usage: $0 <pdf-path> <printer-name>"
  exit 1
fi

if [ ! -f "$PDF_PATH" ]; then
  echo "Error: PDF file not found: $PDF_PATH"
  exit 1
fi

# Check if printer exists
if ! lpstat -p "$PRINTER_NAME" &>/dev/null; then
  echo "Error: Printer not found: $PRINTER_NAME"
  echo "Available printers:"
  lpstat -p 2>/dev/null | awk '{print $2}' || echo "  (None found or lpstat unavailable)"
  exit 1
fi

# Print the PDF
lp -d "$PRINTER_NAME" -o fit-to-page "$PDF_PATH"

if [ $? -eq 0 ]; then
  echo "Label sent to printer: $PRINTER_NAME"
else
  echo "Error: Print job failed"
  exit 1
fi
