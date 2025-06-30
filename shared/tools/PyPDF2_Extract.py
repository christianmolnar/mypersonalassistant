# PyPDF2_Extract.py
#
# A Python script to extract text from PDF files using the PyPDF2 library
# This script is more reliable than basic PowerShell extraction methods

import sys
import os
import argparse
from datetime import datetime

def check_dependencies():
    """Check if PyPDF2 is installed, install if missing"""
    try:
        import PyPDF2
        print("PyPDF2 is installed. Continuing with extraction.")
        return True
    except ImportError:
        print("PyPDF2 is not installed. Installing now...")
        import subprocess
        subprocess.check_call([sys.executable, "-m", "pip", "install", "PyPDF2"])
        print("PyPDF2 has been installed.")
        return True

def extract_text_from_pdf(pdf_path, output_dir=None):
    """Extract text from a PDF file using PyPDF2"""
    import PyPDF2
    
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
    text_output = os.path.join(output_dir, f"{base_name}_extracted_{timestamp}.txt")
    markdown_output = os.path.join(output_dir, f"{base_name}_extracted_{timestamp}.md")
    
    # Extract text from PDF
    try:
        with open(pdf_path, 'rb') as file:
            reader = PyPDF2.PdfReader(file)
            num_pages = len(reader.pages)
            print(f"PDF has {num_pages} pages")
            
            # Extract text from each page
            all_text = ""
            for i in range(num_pages):
                print(f"Processing page {i+1}/{num_pages}")
                page = reader.pages[i]
                text = page.extract_text()
                if text:
                    all_text += f"\n--- Page {i+1} ---\n\n{text}\n"
                else:
                    all_text += f"\n--- Page {i+1} (No text extracted) ---\n\n"
            
            # Write text to file
            with open(text_output, 'w', encoding='utf-8') as out_file:
                out_file.write(all_text)
            
            # Create markdown version
            markdown_content = f"# Extracted Text from {base_name}\n\n"
            markdown_content += f"*Extraction date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}*\n\n"
            markdown_content += f"## Overview\n\n"
            markdown_content += f"- Source: `{os.path.basename(pdf_path)}`\n"
            markdown_content += f"- Pages: {num_pages}\n\n"
            markdown_content += f"## Content\n\n"
            markdown_content += f"```\n{all_text}\n```\n"
            
            with open(markdown_output, 'w', encoding='utf-8') as md_file:
                md_file.write(markdown_content)
            
            print(f"Extraction complete!")
            print(f"Text output: {text_output}")
            print(f"Markdown output: {markdown_output}")
            
            return True
    except Exception as e:
        print(f"Error extracting text: {e}")
        return False

def main():
    """Main function to handle command line arguments"""
    parser = argparse.ArgumentParser(description="Extract text from PDF files")
    parser.add_argument("pdf_path", help="Path to the PDF file")
    parser.add_argument("-o", "--output", help="Output directory for extracted text")
    args = parser.parse_args()
    
    if check_dependencies():
        extract_text_from_pdf(args.pdf_path, args.output)

if __name__ == "__main__":
    main()
