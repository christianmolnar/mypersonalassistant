# PDF_OCR_Extract.py
#
# A Python script to extract text from PDF files using OCR
# This script converts PDF pages to images and then uses Tesseract OCR
# to extract text, which works even for scanned documents

import sys
import os
import argparse
import tempfile
from datetime import datetime

def check_dependencies():
    """Check if required libraries are installed, install if missing"""
    required_packages = ['pdf2image', 'pytesseract', 'pillow']
    missing_packages = []
    
    for package in required_packages:
        try:
            __import__(package)
        except ImportError:
            missing_packages.append(package)
    
    if missing_packages:
        print(f"Installing missing packages: {', '.join(missing_packages)}")
        import subprocess
        for package in missing_packages:
            subprocess.check_call([sys.executable, "-m", "pip", "install", package])
        print("All required packages have been installed.")
    
    return True

def check_tesseract():
    """Check if Tesseract OCR is installed and provide instructions if not"""
    import pytesseract
    try:
        pytesseract.get_tesseract_version()
        print("Tesseract OCR is installed and working.")
        return True
    except Exception:
        print("\nTesseract OCR is not installed or not in your PATH.")
        print("Please follow these steps to install Tesseract OCR:\n")
        print("1. Download Tesseract installer from: https://github.com/UB-Mannheim/tesseract/wiki")
        print("2. Run the installer and complete the installation")
        print("3. Add Tesseract to your PATH environment variable")
        print("   - Default installation path: C:\\Program Files\\Tesseract-OCR")
        print("\nAlternatively, you can specify the Tesseract path in this script")
        print("by uncommenting and updating the pytesseract.pytesseract.tesseract_cmd line.\n")
        return False

def extract_text_with_ocr(pdf_path, output_dir=None):
    """Extract text from a PDF file using OCR"""
    from pdf2image import convert_from_path
    import pytesseract
    from PIL import Image
    
    # Uncomment and update this line if Tesseract is not in PATH
    # pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
    
    if not os.path.exists(pdf_path):
        print(f"Error: File not found - {pdf_path}")
        return False
    
    # Get base filename without extension
    base_name = os.path.splitext(os.path.basename(pdf_path))[0]
    
    # Use the provided output directory or the same directory as the PDF
    if output_dir is None:
        output_dir = os.path.dirname(pdf_path)
    
    # Create output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)
    
    # Define output paths
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    text_output = os.path.join(output_dir, f"{base_name}_OCR_{timestamp}.txt")
    markdown_output = os.path.join(output_dir, f"{base_name}_OCR_{timestamp}.md")
    
    # Create temporary directory for image conversion
    with tempfile.TemporaryDirectory() as temp_dir:
        try:
            print(f"Converting PDF to images...")
            # Convert PDF pages to images
            images = convert_from_path(
                pdf_path, 
                dpi=300,  # Higher DPI for better OCR quality
                output_folder=temp_dir,
                fmt='png'
            )
            
            print(f"PDF has {len(images)} pages")
            all_text = ""
            
            # Process each page
            for i, image in enumerate(images):
                page_num = i + 1
                print(f"Processing page {page_num}/{len(images)} with OCR")
                
                # Save image temporarily
                image_path = os.path.join(temp_dir, f"page_{page_num}.png")
                image.save(image_path)
                
                # Extract text with OCR
                text = pytesseract.image_to_string(Image.open(image_path))
                all_text += f"\n--- Page {page_num} ---\n\n{text}\n"
            
            # Write text to file
            with open(text_output, 'w', encoding='utf-8') as out_file:
                out_file.write(all_text)
            
            # Create markdown version
            markdown_content = f"# OCR Text Extraction from {base_name}\n\n"
            markdown_content += f"*Extraction date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}*\n\n"
            markdown_content += f"## Overview\n\n"
            markdown_content += f"- Source: `{os.path.basename(pdf_path)}`\n"
            markdown_content += f"- Pages: {len(images)}\n"
            markdown_content += f"- Method: Optical Character Recognition (Tesseract OCR)\n\n"
            markdown_content += f"## Extracted Content\n\n"
            markdown_content += all_text
            
            with open(markdown_output, 'w', encoding='utf-8') as md_file:
                md_file.write(markdown_content)
            
            print(f"OCR extraction complete!")
            print(f"Text output: {text_output}")
            print(f"Markdown output: {markdown_output}")
            
            return True
        except Exception as e:
            print(f"Error during OCR extraction: {e}")
            return False

def main():
    """Main function to handle command line arguments"""
    parser = argparse.ArgumentParser(description="Extract text from PDF files using OCR")
    parser.add_argument("pdf_path", help="Path to the PDF file")
    parser.add_argument("-o", "--output", help="Output directory for extracted text")
    args = parser.parse_args()
    
    if check_dependencies() and check_tesseract():
        extract_text_with_ocr(args.pdf_path, args.output)

if __name__ == "__main__":
    main()
