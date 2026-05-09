import io
import os
import streamlit as st
import openai
from openpyxl import load_workbook
from PIL import Image
import pytesseract

DEFAULT_TEMPLATE_PATH = "Copy of Pranay HOME E-Bill Analysis.xlsx"


def get_api_key():
    env_keys = ["GROQ_API_KEY", "OPENAI_API_KEY", "API_KEY"]
    for key in env_keys:
        value = os.getenv(key)
        if value:
            return value

    try:
        secrets = st.secrets
        for key in env_keys:
            if key in secrets and secrets[key]:
                return secrets[key]
    except Exception:
        pass

    return None


def build_prompt(bill_text: str) -> str:
    return (
        "Extract exactly these values from the bill text with no extra words or labels: "
        "Consumer Name, Consumer Number, Sanctioned Load (number only), Total Units Consumed, Total Bill Amount. "
        "Respond with exactly 5 values separated by commas and nothing else. "
        "Do not include any opening or closing statements, explanations, or labels. "
        f"Example: Aditi Kambe, 12345, 5.0, 200, 1500\n\nBill Text:\n{bill_text}"
    )


def call_llm(prompt: str, api_key: str) -> str:
    client = openai.OpenAI(api_key=api_key, base_url="https://api.groq.com/openai/v1")
    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": prompt}],
        temperature=0,
    )
    content = response.choices[0].message.content
    if not content:
        raise ValueError("LLM returned no text content")
    return content


def perform_ocr(image_file) -> str:
    image = Image.open(image_file)
    return pytesseract.image_to_string(image)


def extract_values(bill_text: str, api_key: str):
    prompt = build_prompt(bill_text)
    raw_output = call_llm(prompt, api_key)
    if not raw_output:
        raise ValueError("LLM returned empty response")
    values = [item.strip() for item in raw_output.strip().split(",")]
    return values, raw_output.strip()


def load_template(template_file):
    if template_file is None:
        if os.path.exists(DEFAULT_TEMPLATE_PATH):
            return DEFAULT_TEMPLATE_PATH
        raise FileNotFoundError(
            f"No Excel template uploaded and default template not found at {DEFAULT_TEMPLATE_PATH}."
        )

    if isinstance(template_file, bytes):
        bytes_io = io.BytesIO(template_file)
        bytes_io.seek(0)
        return bytes_io

    if isinstance(template_file, io.IOBase):
        template_file.seek(0)
        return template_file

    return template_file


def write_to_excel(template_source, values, output_path):
    template_data = load_template(template_source)
    workbook = load_workbook(template_data)
    sheet = workbook.active
    
    if sheet is None:
        if workbook.sheetnames:
            sheet = workbook[workbook.sheetnames[0]]
        else:
            raise ValueError("Excel workbook has no sheets")

    sheet["C1"] = values[0]
    sheet["C2"] = values[1]
    sheet["C4"] = values[2]
    sheet["D10"] = values[3]
    sheet["H10"] = values[3]
    sheet["E20"] = values[4]
    sheet["E22"] = values[4]

    workbook.save(output_path)
    return output_path


st.set_page_config(page_title="Bill Extractor", layout="centered")
st.title("Energy Bill Extractor")

api_key = get_api_key()
manual_api_key = st.text_input(
    "Groq/OpenAI API key (optional)",
    type="password",
    help="If your key is not available from environment variables or Streamlit secrets, paste it here.",
)
if not api_key and manual_api_key:
    api_key = manual_api_key

if not api_key:
    st.warning(
        "Set your Groq/OpenAI API key in environment variables `GROQ_API_KEY`, `OPENAI_API_KEY`, or `API_KEY`, "
        "or in Streamlit secrets under one of those keys. You can also paste it above."
    )

st.markdown(
    "Upload a bill image and an Excel template, then click `Extract & Save` to generate the filled workbook."
)

bill_image = st.file_uploader("Upload bill image", type=["png", "jpg", "jpeg", "tiff", "bmp"])
excel_template = st.file_uploader("Upload Excel template (optional)", type=["xlsx"])
output_name = st.text_input("Output Excel filename", value="Energybae_Final_Submission.xlsx")

if st.button("Extract & Save"):
    if bill_image is None:
        st.error("Please upload a bill image before running extraction.")
    elif not api_key:
        st.error("API key is required. Set it in environment variables, Streamlit secrets, or paste it above.")
    else:
        with st.spinner("Performing OCR and calling the LLM..."):
            bill_text = perform_ocr(bill_image)
            try:
                values, raw_output = extract_values(bill_text, api_key)
            except Exception as exc:
                st.error(f"LLM extraction failed: {exc}")
                st.stop()

        if len(values) != 5:
            st.error(
                f"Expected 5 comma-separated values, but received {len(values)}.\n\nOutput:\n{raw_output}"
            )
        else:
            st.success("Extraction successful")
            st.write(
                {
                    "Consumer Name": values[0],
                    "Consumer Number": values[1],
                    "Sanctioned Load": values[2],
                    "Total Units Consumed": values[3],
                    "Total Bill Amount": values[4],
                }
            )

            try:
                excel_data = excel_template.read() if excel_template else None
                output_path = write_to_excel(excel_data, values, output_name)
                with open(output_path, "rb") as f:
                    file_content = f.read()
                st.download_button(
                    label="Download filled Excel file",
                    data=file_content,
                    file_name=os.path.basename(output_path),
                    mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                )
                st.success(f"Saved output: {output_path}")
            except Exception as exc:
                st.error(f"Failed to save Excel file: {exc}")
