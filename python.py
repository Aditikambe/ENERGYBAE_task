import openai
from openpyxl import load_workbook
import time
from PIL import Image
import pytesseract
import os
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.getenv("GROQ_API_KEY")

BILL_IMAGE_PATH = r"C:\Users\Aditi Kambe\Downloads\bill_image.jpeg"
EXCEL_TEMPLATE_PATH = r"C:\Users\Aditi Kambe\Downloads\Copy of Pranay HOME E-Bill Analysis.xlsx"

client = openai.OpenAI(api_key=API_KEY, base_url="https://api.groq.com/openai/v1")

def run_energy_automation():
    print("--- Step 1: Extracting text from bill image ---")
    try:
        # Open the image and extract text using OCR
        image = Image.open(BILL_IMAGE_PATH)
        bill_text = pytesseract.image_to_string(image)
        
        print("--- Step 2: AI is parsing the bill text ---")
        prompt = (
            "Extract exactly these values from the bill text with no extra words or labels: "
            "Consumer Name, Consumer Number, Sanctioned Load (number only), Total Units Consumed, Total Bill Amount. "
            "Respond with exactly 5 values separated by commas and nothing else. "
            "Do not include any opening or closing statements, explanations, or labels. "
            f"Example: Aditi Kambe, 12345, 5.0, 200, 1500\n\nBill Text:\n{bill_text}"
        )
        
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}]
        )
        
        # Split the text into a list
        data = [item.strip() for item in response.choices[0].message.content.split(',')]
        
        # CHECK: Did we get 5 items?
        if len(data) < 5:
            print("Error: AI didn't find all 5 details. Retrying once...")
            return

        print(f"Success! Extracted: {data[0]}")

        print("--- Step 3: Writing to Excel ---")
        wb = load_workbook(EXCEL_TEMPLATE_PATH)
        sheet = wb.active 

        sheet['C1'] = data[0] # Name
        sheet['C2'] = data[1] # Number
        sheet['C4'] = data[2] # Load
        sheet['D10'] = data[3] # Units
        sheet['H10'] = data[3]
        sheet['E20'] = data[4] # Amount
        sheet['E22'] = data[4]

        output_file = "Energybae_Final_Submission.xlsx"
        wb.save(output_file)
        print(f"--- COMPLETE! File saved as {output_file} ---")

    except Exception as e:
        print(f"Error occurred: {e}")

if __name__ == "__main__":
    run_energy_automation()